import { PROCESS_MODULES, PROCESS_RULES, PROCESS_RULE_VERSION } from './rules'
import type { CheckRecord, CheckResult, EvaluationIssue, EvaluationTask, ProcessEvaluationState } from './types'

const DEMO_TASK_ID = 'PE-202608-001'

const resultOverrides: Record<string, CheckResult> = {
  'OPS-C05': '部分符合',
  'OPS-G02': '待检查',
  'EQP-C04': '部分符合',
  'LAB-B04': '不适用',
  'LAB-D02': '部分符合',
  'LAB-D05': '证据不足',
  'SAF-D03': '部分符合',
  'SAF-G06': '不符合',
  'GEN-C01': '部分符合',
  'GEN-F03': '待检查',
}

const factOverrides: Record<string, Pick<CheckRecord, 'objectName' | 'facts' | 'evidence' | 'tags' | 'notApplicableReason'>> = {
  'OPS-C05': {
    objectName: '8月18日夜班回流运行方式切换',
    facts: '调控过程有运行记录，但未见授权范围内的审批或确认记录。',
    evidence: '运行日志 RL-20260818-N；中控趋势 22:10—23:40。',
    tags: ['调控审批缺失', '恢复条件不清'], notApplicableReason: '',
  },
  'EQP-C04': {
    objectName: '2号提升泵重复故障',
    facts: '三个月内发生两次同类轴承温升故障，已修复，但根因分析和稳定观察期不完整。',
    evidence: '工单 WO-240817、WO-240826；设备趋势截图。',
    tags: ['重复故障', '根因分析不足'], notApplicableReason: '',
  },
  'LAB-B04': {
    objectName: '外部监管取样', facts: '评价期内经确认未发生外部监管正式取样。', evidence: '监管事件登记台账。',
    tags: [], notApplicableReason: '评价期内无该类事件，已由化验主管确认。',
  },
  'LAB-D02': {
    objectName: '总磷平行样质量控制', facts: '抽查5组记录，1组缺少复核签字；一手数据和计算过程完整。',
    evidence: 'TP-QC-202608-01 至 05。', tags: ['质控记录不完整'], notApplicableReason: '',
  },
  'LAB-D05': {
    objectName: '8月质控失控事件', facts: '事件处置单已登记，但暂未取得受影响结果冻结和恢复审批证据。',
    evidence: '待补充电子审批记录。', tags: ['证据待补'], notApplicableReason: '',
  },
  'SAF-D03': {
    objectName: '脱水机房有限空间作业', facts: '抽查4次作业，1次持续检测记录中断18分钟，监护和防护措施仍在现场。',
    evidence: '作业票 LS-202608-03；检测仪导出记录。', tags: ['持续检测中断'], notApplicableReason: '',
  },
  'SAF-G06': {
    objectName: '脱水机房有限空间', facts: '有限空间已辨识并设置警示，但救援三脚架检验有效期已于8月15日届满。',
    evidence: '现场照片 SAF-0828-06；装备台账 ER-017。', tags: ['救援装备失效', '有限空间'], notApplicableReason: '',
  },
  'GEN-C01': {
    objectName: '一期改造项目档案', facts: '抽查5卷项目档案，1卷缺少最终竣工图索引，其他资料可检索。',
    evidence: '档案抽查记录 ARC-202608。', tags: ['归档要素缺失'], notApplicableReason: '',
  },
}

function recordForRule(ruleCode: string, taskId = DEMO_TASK_ID, historical = false): CheckRecord {
  const result = historical ? '符合' : resultOverrides[ruleCode] || '符合'
  const sampleTotal = result === '待检查' || result === '证据不足' || result === '不适用' ? null : 5
  const passedCount = result === '符合' ? 5 : result === '部分符合' ? 4 : result === '不符合' ? 0 : null
  const fact = factOverrides[ruleCode]
  return {
    taskId,
    ruleCode,
    result,
    sampleTotal,
    passedCount,
    factValues: {},
    objectName: fact?.objectName || '',
    facts: fact?.facts || (result === '符合' ? '抽查对象均满足当前规则要求，未发现未受控异常。' : ''),
    evidence: fact?.evidence || (result === '符合' ? '已引用对应专业模块记录。' : ''),
    tags: fact?.tags || [],
    notApplicableReason: fact?.notApplicableReason || '',
    updatedAt: result === '待检查' ? '' : historical ? '2026-07-31 16:30' : '2026-08-29 10:30',
  }
}

const demoTask: EvaluationTask = {
  id: DEMO_TASK_ID,
  name: '2026年8月综合过程评价',
  type: '综合检查',
  siteName: 'WaterX示范污水处理厂',
  periodStart: '2026-08-01',
  periodEnd: '2026-08-31',
  evaluationDate: '2026-08-29',
  cadence: '月度评价',
  moduleKeys: PROCESS_MODULES.map((module) => module.key),
  ruleVersion: PROCESS_RULE_VERSION,
  status: '待整改',
  owner: '李明',
  inspectors: ['张工', '王工', '陈工'],
  createdAt: '2026-08-01 09:00',
  updatedAt: '2026-08-29 10:45', lockedAt: '', lockedBy: '', voidedAt: '', voidReason: '',
}

const historicalTasks: EvaluationTask[] = [
  {
    id: 'PE-202607-002', name: '防汛专项复核', type: '整改复核', siteName: 'WaterX示范污水处理厂',
    periodStart: '2026-07-15', periodEnd: '2026-07-22', moduleKeys: ['operations', 'safety'], ruleVersion: PROCESS_RULE_VERSION,
    evaluationDate: '2026-07-22', cadence: '整改复核', status: '已完成', owner: '李明', inspectors: ['张工'], createdAt: '2026-07-15 08:30',
    updatedAt: '2026-07-22 16:40', lockedAt: '', lockedBy: '', voidedAt: '', voidReason: '',
  },
  {
    id: 'PE-202607-001', name: '在线监测运维专项', type: '专项检查', siteName: 'WaterX示范污水处理厂',
    periodStart: '2026-07-01', periodEnd: '2026-07-10', moduleKeys: ['laboratory'], ruleVersion: PROCESS_RULE_VERSION,
    evaluationDate: '2026-07-10', cadence: '专项评价', status: '已锁定', owner: '李明', inspectors: ['陈工'], createdAt: '2026-07-01 09:10',
    updatedAt: '2026-07-11 09:00', lockedAt: '2026-07-11 09:00', lockedBy: '质量负责人', voidedAt: '', voidReason: '',
  },
  {
    id: 'PE-202606-001', name: '2026年第二季度综合过程评价', type: '综合检查', siteName: 'WaterX示范污水处理厂',
    periodStart: '2026-04-01', periodEnd: '2026-06-30', evaluationDate: '2026-06-30', cadence: '季度评价',
    moduleKeys: PROCESS_MODULES.map((module) => module.key), ruleVersion: PROCESS_RULE_VERSION,
    status: '已锁定', owner: '李明', inspectors: ['张工', '王工', '陈工'], createdAt: '2026-06-20 08:30',
    updatedAt: '2026-07-02 10:00', lockedAt: '2026-07-02 10:00', lockedBy: '厂长', voidedAt: '', voidReason: '',
  },
]

const demoIssues: EvaluationIssue[] = [
  {
    id: 'ISS-202608-001', taskId: DEMO_TASK_ID, factKey: 'FACT-OPS-0818-SWITCH', title: '重要调控缺少审批确认',
    primaryModule: 'operations', primaryRuleCode: 'OPS-C05', associatedModules: [], objectName: '8月18日夜班回流运行方式切换',
    tags: ['调控审批缺失', '恢复条件不清'], level: '重要', facts: factOverrides['OPS-C05'].facts, evidence: factOverrides['OPS-C05'].evidence,
    assignee: '运行经理', dueDate: '2026-09-10', correction: '', reviewer: '运营负责人', reviewConclusion: '', reviewNote: '',
    repeat: false, status: '待整改', createdAt: '2026-08-29 10:32', closedAt: '',
  },
  {
    id: 'ISS-202608-002', taskId: DEMO_TASK_ID, factKey: 'FACT-EQP-PUMP02-REPEAT', title: '2号提升泵重复故障根因分析不完整',
    primaryModule: 'equipment', primaryRuleCode: 'EQP-C04', associatedModules: ['operations'], objectName: '2号提升泵',
    tags: ['重复故障', '根因分析不足'], level: '重要', facts: factOverrides['EQP-C04'].facts, evidence: factOverrides['EQP-C04'].evidence,
    assignee: '设备经理', dueDate: '2026-09-06', correction: '已补充轴承润滑、同轴度和运行负荷分析，调整点检频次并完成72小时观察。',
    reviewer: '技术负责人', reviewConclusion: '', reviewNote: '', repeat: true, status: '待复核', createdAt: '2026-08-29 10:38', closedAt: '',
  },
  {
    id: 'ISS-202608-003', taskId: DEMO_TASK_ID, factKey: 'FACT-LAB-TP-QC', title: '总磷平行样记录缺少复核签字',
    primaryModule: 'laboratory', primaryRuleCode: 'LAB-D02', associatedModules: [], objectName: '总磷平行样质量控制',
    tags: ['质控记录不完整'], level: '一般', facts: factOverrides['LAB-D02'].facts, evidence: factOverrides['LAB-D02'].evidence,
    assignee: '化验主管', dueDate: '2026-08-28', correction: '已补充电子复核提醒，并完成后续5组质控记录复核。', reviewer: '质量负责人',
    reviewConclusion: '关闭', reviewNote: '后续记录完整，未影响原结果有效性。', repeat: false, status: '已关闭', createdAt: '2026-08-22 14:10', closedAt: '2026-08-28 16:20',
  },
  {
    id: 'ISS-202608-004', taskId: DEMO_TASK_ID, factKey: 'FACT-SAF-CONFINED-RESCUE', title: '有限空间救援三脚架检验已超期',
    primaryModule: 'safety', primaryRuleCode: 'SAF-G06', associatedModules: ['equipment'], objectName: '脱水机房有限空间',
    tags: ['救援装备失效', '有限空间'], level: '重大', facts: factOverrides['SAF-G06'].facts, evidence: factOverrides['SAF-G06'].evidence,
    assignee: '安全经理', dueDate: '2026-09-03', correction: '', reviewer: '厂长', reviewConclusion: '', reviewNote: '', repeat: false,
    status: '整改中', createdAt: '2026-08-29 10:45', closedAt: '',
  },
]

export function createDemoProcessEvaluationState(siteName = 'WaterX示范污水处理厂'): ProcessEvaluationState {
  const historicalRecords = historicalTasks.flatMap((task) => PROCESS_RULES
    .filter((rule) => task.moduleKeys.includes(rule.module))
    .map((rule) => recordForRule(rule.code, task.id, true)))
  return {
    tasks: [{ ...demoTask, siteName }, ...historicalTasks.map((task) => ({ ...task, siteName }))],
    records: [...PROCESS_RULES.map((rule) => recordForRule(rule.code)), ...historicalRecords],
    issues: demoIssues.map((issue) => ({ ...issue, associatedModules: [...issue.associatedModules], tags: [...issue.tags] })),
    activeTaskId: DEMO_TASK_ID,
  }
}
