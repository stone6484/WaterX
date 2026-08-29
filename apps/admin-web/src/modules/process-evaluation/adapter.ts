import { createDemoProcessEvaluationState } from './demo-data'
import { PROCESS_MODULE_MAP, PROCESS_RULE_MAP, PROCESS_RULES, PROCESS_RULE_VERSION, rulesForModule } from './rules'
import type {
  CheckRecord,
  EvaluationCadence,
  EvaluationIssue,
  EvaluationTask,
  IssueLevel,
  ModuleResultSummary,
  ModuleSummary,
  ProcessEvaluationState,
  ProcessModuleKey,
  ReviewConclusion,
  TaskDraft,
} from './types'

const STORAGE_KEY = 'waterx.process-evaluation.v01'

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function isValidState(value: unknown): value is ProcessEvaluationState {
  const state = value as ProcessEvaluationState
  return Boolean(state && Array.isArray(state.tasks) && Array.isArray(state.records) && Array.isArray(state.issues))
}

function inferCadence(task: Pick<EvaluationTask, 'type' | 'periodStart' | 'periodEnd'>): EvaluationCadence {
  if (task.type === '整改复核') return '整改复核'
  if (task.type === '专项检查') return '专项评价'
  const days = Math.max(1, Math.round((Date.parse(task.periodEnd) - Date.parse(task.periodStart)) / 86400000) + 1)
  if (days > 120) return '半年度评价'
  if (days > 45) return '季度评价'
  return '月度评价'
}

function normalizeState(state: ProcessEvaluationState): ProcessEvaluationState {
  const now = new Date().toLocaleString('zh-CN', { hour12: false })
  state.records = state.records.map((record) => ({ ...record, factValues: record.factValues || {} }))
  state.tasks = state.tasks.map((raw) => {
    const task = raw as EvaluationTask
    return {
      ...task,
      evaluationDate: task.evaluationDate || task.periodEnd,
      cadence: task.cadence || inferCadence(task),
      updatedAt: task.updatedAt || task.createdAt || now,
      lockedAt: task.lockedAt || '',
      lockedBy: task.lockedBy || '',
      voidedAt: task.voidedAt || '',
      voidReason: task.voidReason || '',
    }
  })
  const recordKeys = new Set(state.records.map((record) => `${record.taskId}:${record.ruleCode}`))
  for (const task of state.tasks) {
    for (const rule of PROCESS_RULES.filter((item) => task.moduleKeys.includes(item.module))) {
      const key = `${task.id}:${rule.code}`
      if (recordKeys.has(key)) continue
      const completed = ['已完成', '已锁定'].includes(task.status)
      state.records.push({
        taskId: task.id, ruleCode: rule.code, result: completed ? '符合' : '待检查', sampleTotal: completed ? 5 : null,
        passedCount: completed ? 5 : null, factValues: {}, objectName: '', facts: completed ? '历史评价快照：该项符合当期规则要求。' : '',
        evidence: completed ? '历史评价归档记录。' : '', tags: [], notApplicableReason: '', updatedAt: completed ? task.evaluationDate : '',
      })
      recordKeys.add(key)
    }
  }
  if (!state.tasks.some((task) => task.id === state.activeTaskId)) state.activeTaskId = state.tasks[0]?.id || ''
  return state
}

export function loadProcessEvaluationState(siteName: string): ProcessEvaluationState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as unknown
      if (isValidState(parsed)) return normalizeState(parsed)
    }
  } catch {
    // Local preview may block storage; the fixed demo still remains fully usable in memory.
  }
  return createDemoProcessEvaluationState(siteName)
}

export function persistProcessEvaluationState(state: ProcessEvaluationState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // In-memory state is retained by the page when storage is unavailable.
  }
}

export function resetProcessEvaluationState(siteName: string): ProcessEvaluationState {
  const state = createDemoProcessEvaluationState(siteName)
  persistProcessEvaluationState(state)
  return state
}

export function activeTask(state: ProcessEvaluationState): EvaluationTask {
  return state.tasks.find((task) => task.id === state.activeTaskId) || state.tasks[0]
}

export function recordsForTask(state: ProcessEvaluationState, taskId: string): CheckRecord[] {
  return state.records.filter((record) => record.taskId === taskId)
}

function resultCoefficient(record: CheckRecord): number | null {
  if (record.result === '符合') return 1
  if (record.result === '不符合') return 0
  if (record.result === '部分符合') {
    if (record.sampleTotal && record.passedCount !== null) return Math.max(0, Math.min(1, record.passedCount / record.sampleTotal))
    return 0.6
  }
  return null
}

export function moduleSummary(state: ProcessEvaluationState, taskId: string, module: ProcessModuleKey): ModuleSummary {
  const task = state.tasks.find((item) => item.id === taskId)
  const rules = rulesForModule(module)
  const records = new Map(recordsForTask(state, taskId).map((record) => [record.ruleCode, record]))
  const applicableRules = rules.filter((rule) => records.get(rule.code)?.result !== '不适用')
  const completed = applicableRules.filter((rule) => {
    const result = records.get(rule.code)?.result
    return result && result !== '待检查' && result !== '证据不足'
  }).length
  let score = 0
  for (const category of PROCESS_MODULE_MAP.get(module)?.categories || []) {
    const categoryRules = applicableRules.filter((rule) => rule.category === category.key)
    const importanceTotal = categoryRules.reduce((sum, rule) => sum + rule.importance, 0)
    if (!importanceTotal) continue
    for (const rule of categoryRules) {
      const coefficient = resultCoefficient(records.get(rule.code) || {} as CheckRecord)
      if (coefficient !== null) score += category.weight * rule.importance / importanceTotal * coefficient
    }
  }
  const issues = state.issues.filter((issue) => issue.taskId === taskId && issue.primaryModule === module)
  const activeIssues = issues.filter((issue) => issue.status !== '已关闭')
  const critical = activeIssues.some((issue) => issue.level === '关键控制失效')
  const major = activeIssues.some((issue) => issue.level === '重大')
  const important = activeIssues.some((issue) => issue.level === '重要')
  const rounded = rules.length && completed > 0 && task?.moduleKeys.includes(module) ? Number(score.toFixed(1)) : null
  let status: ModuleSummary['status'] = '待检查'
  if (rounded !== null && completed > 0) {
    if (critical) status = '严重失控'
    else if (rounded < 70) status = '失控'
    else if (rounded < 80 || major) status = '待改进'
    else if (rounded < 90 || important) status = '基本受控'
    else status = '受控'
  }
  const blockers = applicableRules.filter((rule) => ['待检查', '证据不足'].includes(records.get(rule.code)?.result || '待检查')).length +
    activeIssues.filter((issue) => ['重大', '关键控制失效'].includes(issue.level)).length
  return { module, total: rules.length, applicable: applicableRules.length, completed, score: rounded, status, issueCount: issues.length, blockers }
}

export function moduleSummaries(state: ProcessEvaluationState, taskId: string): ModuleSummary[] {
  return PROCESS_MODULE_MAP.size
    ? Array.from(PROCESS_MODULE_MAP.keys()).map((module) => moduleSummary(state, taskId, module))
    : []
}

function taskDateValue(task: EvaluationTask): number {
  return Date.parse(task.evaluationDate || task.periodEnd) || 0
}

export function latestTaskForModule(state: ProcessEvaluationState, module: ProcessModuleKey): EvaluationTask | undefined {
  return state.tasks
    .filter((task) => task.moduleKeys.includes(module) && !['已作废', '撤销'].includes(task.status))
    .sort((a, b) => taskDateValue(b) - taskDateValue(a) || b.createdAt.localeCompare(a.createdAt))[0]
}

function toResultSummary(state: ProcessEvaluationState, task: EvaluationTask, module: ProcessModuleKey): ModuleResultSummary {
  return {
    ...moduleSummary(state, task.id, module),
    taskId: task.id,
    taskName: task.name,
    evaluationDate: task.evaluationDate,
    periodStart: task.periodStart,
    periodEnd: task.periodEnd,
    taskType: task.type,
    cadence: task.cadence,
    taskStatus: task.status,
    owner: task.owner,
    ruleVersion: task.ruleVersion,
    locked: task.status === '已锁定',
  }
}

export function latestModuleResults(state: ProcessEvaluationState): ModuleResultSummary[] {
  return Array.from(PROCESS_MODULE_MAP.keys()).map((module) => {
    const task = latestTaskForModule(state, module)
    return task
      ? toResultSummary(state, task, module)
      : { ...moduleSummary(state, '', module), taskId: '', taskName: '暂无评价', evaluationDate: '', periodStart: '', periodEnd: '', taskType: '综合检查', cadence: '月度评价', taskStatus: '草稿', owner: '', ruleVersion: PROCESS_RULE_VERSION, locked: false }
  })
}

export function moduleResults(state: ProcessEvaluationState): ModuleResultSummary[] {
  return state.tasks.flatMap((task) => task.moduleKeys.map((module) => toResultSummary(state, task, module)))
    .sort((a, b) => Date.parse(b.evaluationDate) - Date.parse(a.evaluationDate) || b.taskId.localeCompare(a.taskId))
}

export function selectEvaluationTask(state: ProcessEvaluationState, taskId: string): EvaluationTask | undefined {
  const task = state.tasks.find((item) => item.id === taskId)
  if (!task) return undefined
  state.activeTaskId = task.id
  persistProcessEvaluationState(state)
  return task
}

export function reportBlockers(state: ProcessEvaluationState, taskId: string): string[] {
  const task = state.tasks.find((item) => item.id === taskId)
  if (!task) return ['评价任务不存在。']
  const selectedCodes = PROCESS_RULES.filter((rule) => task.moduleKeys.includes(rule.module)).map((rule) => rule.code)
  const records = new Map(recordsForTask(state, taskId).map((record) => [record.ruleCode, record]))
  const pending = selectedCodes.filter((code) => records.get(code)?.result === '待检查' || !records.has(code)).length
  const insufficient = selectedCodes.filter((code) => records.get(code)?.result === '证据不足').length
  const missingApplicability = selectedCodes.filter((code) => records.get(code)?.result === '不适用' && !records.get(code)?.notApplicableReason.trim()).length
  const keyIssueWithoutControl = state.issues.filter((issue) => issue.taskId === taskId && ['重大', '关键控制失效'].includes(issue.level) && issue.status !== '已关闭' && !issue.correction.trim()).length
  const reviewPending = state.issues.filter((issue) => issue.taskId === taskId && issue.status === '待复核').length
  const blockers: string[] = []
  if (pending) blockers.push(`仍有 ${pending} 项待检查`)
  if (insufficient) blockers.push(`仍有 ${insufficient} 项证据不足`)
  if (missingApplicability) blockers.push(`仍有 ${missingApplicability} 项不适用原因未确认`)
  if (keyIssueWithoutControl) blockers.push(`仍有 ${keyIssueWithoutControl} 个重大或关键问题未填写控制措施`)
  if (reviewPending) blockers.push(`仍有 ${reviewPending} 个问题待复核`)
  return blockers
}

export function createEvaluationTask(state: ProcessEvaluationState, draft: TaskDraft, siteName: string): EvaluationTask {
  const now = new Date()
  const id = `PE-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${String(state.tasks.length + 1).padStart(3, '0')}`
  const task: EvaluationTask = {
    id,
    name: draft.name,
    type: draft.type,
    siteName,
    periodStart: draft.periodStart,
    periodEnd: draft.periodEnd,
    evaluationDate: draft.evaluationDate,
    cadence: draft.cadence,
    moduleKeys: [...draft.moduleKeys],
    ruleVersion: PROCESS_RULE_VERSION,
    status: '待执行',
    owner: draft.owner,
    inspectors: [],
    createdAt: now.toLocaleString('zh-CN', { hour12: false }),
    updatedAt: now.toLocaleString('zh-CN', { hour12: false }),
    lockedAt: '', lockedBy: '', voidedAt: '', voidReason: '',
  }
  state.tasks.unshift(task)
  state.activeTaskId = task.id
  state.records.push(...PROCESS_RULES.filter((rule) => draft.moduleKeys.includes(rule.module)).map((rule) => ({
    taskId: task.id, ruleCode: rule.code, result: '待检查' as const, sampleTotal: null, passedCount: null,
    factValues: {}, objectName: '', facts: '', evidence: '', tags: [], notApplicableReason: '', updatedAt: '',
  })))
  persistProcessEvaluationState(state)
  return task
}

export function updateEvaluationTask(state: ProcessEvaluationState, taskId: string, draft: TaskDraft): EvaluationTask | undefined {
  const task = state.tasks.find((item) => item.id === taskId)
  if (!task || ['已锁定', '已作废', '撤销'].includes(task.status)) return undefined
  const mayChangeScope = ['草稿', '待执行'].includes(task.status)
  const oldModules = [...task.moduleKeys]
  task.name = draft.name
  task.type = draft.type
  task.periodStart = draft.periodStart
  task.periodEnd = draft.periodEnd
  task.evaluationDate = draft.evaluationDate
  task.cadence = draft.cadence
  task.owner = draft.owner
  task.updatedAt = new Date().toLocaleString('zh-CN', { hour12: false })
  if (mayChangeScope) {
    task.moduleKeys = [...draft.moduleKeys]
    const allowedCodes = new Set(PROCESS_RULES.filter((rule) => task.moduleKeys.includes(rule.module)).map((rule) => rule.code))
    state.records = state.records.filter((record) => record.taskId !== task.id || allowedCodes.has(record.ruleCode))
    const existingCodes = new Set(state.records.filter((record) => record.taskId === task.id).map((record) => record.ruleCode))
    state.records.push(...PROCESS_RULES.filter((rule) => task.moduleKeys.includes(rule.module) && !existingCodes.has(rule.code)).map((rule) => ({
      taskId: task.id, ruleCode: rule.code, result: '待检查' as const, sampleTotal: null, passedCount: null,
      factValues: {}, objectName: '', facts: '', evidence: '', tags: [], notApplicableReason: '', updatedAt: '',
    })))
  } else task.moduleKeys = oldModules
  persistProcessEvaluationState(state)
  return task
}

export function taskHasEnteredData(state: ProcessEvaluationState, taskId: string): boolean {
  return state.issues.some((issue) => issue.taskId === taskId) || state.records.some((record) => record.taskId === taskId && (
    record.result !== '待检查' || Boolean(record.objectName || record.facts || record.evidence || record.updatedAt || Object.values(record.factValues || {}).some((value) => value !== '' && value !== null))
  ))
}

export function removeOrVoidEvaluationTask(state: ProcessEvaluationState, taskId: string, reason = '用户在评价结果管理中作废'): 'deleted' | 'voided' | 'blocked' {
  const task = state.tasks.find((item) => item.id === taskId)
  if (!task || ['已锁定', '已作废'].includes(task.status)) return 'blocked'
  if (['草稿', '待执行'].includes(task.status) && !taskHasEnteredData(state, taskId)) {
    state.tasks = state.tasks.filter((item) => item.id !== taskId)
    state.records = state.records.filter((record) => record.taskId !== taskId)
    state.issues = state.issues.filter((issue) => issue.taskId !== taskId)
    state.activeTaskId = state.tasks[0]?.id || ''
    persistProcessEvaluationState(state)
    return 'deleted'
  }
  task.status = '已作废'
  task.voidedAt = new Date().toLocaleString('zh-CN', { hour12: false })
  task.voidReason = reason
  task.updatedAt = task.voidedAt
  persistProcessEvaluationState(state)
  return 'voided'
}

export function lockEvaluationTask(state: ProcessEvaluationState, taskId: string, operator = '当前用户'): string[] {
  const task = state.tasks.find((item) => item.id === taskId)
  if (!task) return ['评价任务不存在。']
  if (task.status === '已锁定') return []
  if (['已作废', '撤销'].includes(task.status)) return ['已作废任务不能锁定。']
  const blockers = reportBlockers(state, taskId)
  if (blockers.length) return blockers
  task.status = '已锁定'
  task.lockedAt = new Date().toLocaleString('zh-CN', { hour12: false })
  task.lockedBy = operator
  task.updatedAt = task.lockedAt
  persistProcessEvaluationState(state)
  return []
}

export function saveCheckRecord(state: ProcessEvaluationState, record: CheckRecord): void {
  const index = state.records.findIndex((item) => item.taskId === record.taskId && item.ruleCode === record.ruleCode)
  const targetTask = state.tasks.find((item) => item.id === record.taskId)
  if (targetTask && ['已锁定', '已作废', '撤销'].includes(targetTask.status)) return
  if (index >= 0) state.records[index] = clone(record)
  else state.records.push(clone(record))
  const task = targetTask
  if (task && ['草稿', '待执行'].includes(task.status)) task.status = '检查中'
  persistProcessEvaluationState(state)
}

export function createOrUpdateIssue(
  state: ProcessEvaluationState,
  record: CheckRecord,
  level: IssueLevel,
  assignee: string,
  dueDate: string,
  associatedModules: ProcessModuleKey[],
): EvaluationIssue {
  const rule = PROCESS_RULE_MAP.get(record.ruleCode)!
  const factKey = `${record.taskId}:${record.objectName.trim().toLowerCase() || record.ruleCode}`
  const existing = state.issues.find((issue) => issue.taskId === record.taskId && (issue.factKey === factKey || issue.primaryRuleCode === record.ruleCode) && issue.status !== '已关闭')
  if (existing) {
    existing.title = record.objectName ? `${record.objectName}：${rule.title}存在缺陷` : `${rule.title}存在缺陷`
    existing.facts = record.facts
    existing.evidence = record.evidence
    existing.tags = [...record.tags]
    existing.level = level
    existing.assignee = assignee
    existing.dueDate = dueDate
    existing.associatedModules = associatedModules.filter((module) => module !== rule.module)
    persistProcessEvaluationState(state)
    return existing
  }
  const issue: EvaluationIssue = {
    id: `ISS-${new Date().getFullYear()}-${String(state.issues.length + 1).padStart(3, '0')}`,
    taskId: record.taskId,
    factKey,
    title: record.objectName ? `${record.objectName}：${rule.title}存在缺陷` : `${rule.title}存在缺陷`,
    primaryModule: rule.module,
    primaryRuleCode: rule.code,
    associatedModules: associatedModules.filter((module) => module !== rule.module),
    objectName: record.objectName,
    tags: [...record.tags],
    level,
    facts: record.facts,
    evidence: record.evidence,
    assignee,
    dueDate,
    correction: '', reviewer: '', reviewConclusion: '', reviewNote: '', repeat: false,
    status: '待整改', createdAt: new Date().toLocaleString('zh-CN', { hour12: false }), closedAt: '',
  }
  state.issues.unshift(issue)
  persistProcessEvaluationState(state)
  return issue
}

export function submitIssueCorrection(state: ProcessEvaluationState, issueId: string, correction: string, reviewer: string): void {
  const issue = state.issues.find((item) => item.id === issueId)
  if (!issue) return
  issue.correction = correction
  issue.reviewer = reviewer
  issue.status = '待复核'
  issue.reviewConclusion = ''
  issue.reviewNote = ''
  persistProcessEvaluationState(state)
}

export function reviewIssue(state: ProcessEvaluationState, issueId: string, conclusion: ReviewConclusion, note: string): void {
  const issue = state.issues.find((item) => item.id === issueId)
  if (!issue) return
  issue.reviewConclusion = conclusion
  issue.reviewNote = note
  issue.status = conclusion === '关闭' ? '已关闭' : conclusion === '退回整改' ? '整改中' : '升级处理'
  issue.closedAt = conclusion === '关闭' ? new Date().toLocaleString('zh-CN', { hour12: false }) : ''
  persistProcessEvaluationState(state)
}
