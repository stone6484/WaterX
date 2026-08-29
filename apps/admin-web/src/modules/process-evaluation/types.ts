export type ProcessModuleKey = 'operations' | 'equipment' | 'laboratory' | 'safety' | 'general'

export type ProcessEvaluationPageId =
  | 'evaluationResults'
  | 'evaluationOperations'
  | 'evaluationEquipment'
  | 'evaluationLaboratory'
  | 'evaluationSafety'
  | 'evaluationComprehensive'
  | 'evaluationRectification'
  | 'evaluationReport'

export type RequirementImportance = 1 | 3 | 5
export type CheckResult = '待检查' | '证据不足' | '符合' | '部分符合' | '不符合' | '不适用'
export type TaskType = '综合检查' | '专项检查' | '整改复核'
export type EvaluationCadence = '月度评价' | '季度评价' | '半年度评价' | '专项评价' | '整改复核'
export type TaskStatus = '草稿' | '待执行' | '检查中' | '待整改' | '待复核' | '待发布' | '已完成' | '已锁定' | '已作废' | '撤销' | '退回'
export type IssueLevel = '一般' | '重要' | '重大' | '关键控制失效'
export type IssueStatus = '待整改' | '整改中' | '待复核' | '已关闭' | '升级处理'
export type ReviewConclusion = '关闭' | '退回整改' | '升级处理'

export interface EvaluationCategory {
  key: string
  shortName: string
  name: string
  weight: number
}

export interface ProcessModuleDefinition {
  key: ProcessModuleKey
  name: string
  shortName: string
  pageId: ProcessEvaluationPageId
  icon: string
  description: string
  boundary: string
  categories: EvaluationCategory[]
}

export interface ProcessRule {
  code: string
  module: ProcessModuleKey
  category: string
  title: string
  requirement: string
  importance: RequirementImportance
  outcomeHint: string
  sampleHint: string
  evidenceHint: string
  ruleVersion: string
  detail: ProcessRuleDetail
}

export type RuleFactFieldType = 'number' | 'text' | 'boolean' | 'date'

export interface RuleFactField {
  key: string
  label: string
  type: RuleFactFieldType
  unit?: string
  placeholder?: string
}

export interface RuleDecisionCriteria {
  compliant: string
  partial: string
  nonCompliant: string
  notApplicable: string
  critical?: string
}

export interface ProcessRuleDetail {
  overview: string
  checkPoints: string[]
  sampling: string[]
  factFields: RuleFactField[]
  decision: RuleDecisionCriteria
  problemTags: string[]
  evidence: string
  closeCondition: string
  method: string
  boundary: string
}

export interface EvaluationTask {
  id: string
  name: string
  type: TaskType
  siteName: string
  periodStart: string
  periodEnd: string
  evaluationDate: string
  cadence: EvaluationCadence
  moduleKeys: ProcessModuleKey[]
  ruleVersion: string
  status: TaskStatus
  owner: string
  inspectors: string[]
  createdAt: string
  updatedAt: string
  lockedAt: string
  lockedBy: string
  voidedAt: string
  voidReason: string
}

export interface CheckRecord {
  taskId: string
  ruleCode: string
  result: CheckResult
  sampleTotal: number | null
  passedCount: number | null
  factValues: Record<string, string | number | boolean | null>
  objectName: string
  facts: string
  evidence: string
  tags: string[]
  notApplicableReason: string
  updatedAt: string
}

export interface EvaluationIssue {
  id: string
  taskId: string
  factKey: string
  title: string
  primaryModule: ProcessModuleKey
  primaryRuleCode: string
  associatedModules: ProcessModuleKey[]
  objectName: string
  tags: string[]
  level: IssueLevel
  facts: string
  evidence: string
  assignee: string
  dueDate: string
  correction: string
  reviewer: string
  reviewConclusion: ReviewConclusion | ''
  reviewNote: string
  repeat: boolean
  status: IssueStatus
  createdAt: string
  closedAt: string
}

export interface ProcessEvaluationState {
  tasks: EvaluationTask[]
  records: CheckRecord[]
  issues: EvaluationIssue[]
  activeTaskId: string
}

export interface ModuleSummary {
  module: ProcessModuleKey
  total: number
  applicable: number
  completed: number
  score: number | null
  status: '待检查' | '受控' | '基本受控' | '待改进' | '失控' | '严重失控'
  issueCount: number
  blockers: number
}

export interface ModuleResultSummary extends ModuleSummary {
  taskId: string
  taskName: string
  evaluationDate: string
  periodStart: string
  periodEnd: string
  taskType: TaskType
  cadence: EvaluationCadence
  taskStatus: TaskStatus
  owner: string
  ruleVersion: string
  locked: boolean
}

export interface TaskDraft {
  name: string
  type: TaskType
  periodStart: string
  periodEnd: string
  evaluationDate: string
  cadence: EvaluationCadence
  moduleKeys: ProcessModuleKey[]
  owner: string
}
