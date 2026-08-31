export type HscTab = 'overview' | 'data' | 'diagnosis' | 'plan' | 'verification'

export type HscEvaluationStatus =
  | 'NOT_APPLICABLE'
  | 'DATA_INSUFFICIENT'
  | 'NORMAL'
  | 'TRIGGERED'
  | 'SUPPRESSED'

export type HscConclusionType =
  | 'CONFIRMED_DEVIATION'
  | 'SUSPECTED_DEVIATION'
  | 'OPTIMIZATION_OPPORTUNITY'
  | 'DATA_INSUFFICIENT'

export type HscScenarioId = 'stable-cost' | 'chemical-data-gap' | 'sample-incomparable'

export type HscCauseState = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'INCONCLUSIVE' | 'NOT_APPLICABLE'

export interface HscFieldValue {
  fieldCode: string
  group: string
  name: string
  value: string | number | boolean | null
  unit: string | null
  source: string
  coverage: number
  reviewState: 'VERIFIED' | 'PENDING' | 'MISSING' | 'ABNORMAL'
  estimated: boolean
}

export interface HscMetricResult {
  metricCode: string
  group: string
  name: string
  value: number | null
  display: string
  unit: string
  formula: string
  precision: string
  status: 'VALID' | 'MISSING_INPUT' | 'NOT_APPLICABLE' | 'CALCULATION_INVALID'
  benchmark: string
}

export interface HscRuleResult {
  ruleCode: string
  group: string
  name: string
  status: HscEvaluationStatus
  severity: string
  conclusionType: HscConclusionType
  conclusion: string
  evidence: string[]
  recommendation: string
  constraint: string
  recovery: string
  boundaryNote: string
  suppressedBy?: string
}

export interface HscCauseVerification {
  causeCode: string
  ruleCode: string
  category: string
  question: string
  requiredEvidence: string
  confirmationCriteria: string
  state: HscCauseState
  note: string
}

export interface HscPlanAction {
  id: string
  title: string
  owner: string
  currentValue: string
  targetValue: string
  step: string
  guard: string
  stopCondition: string
  rollbackCondition: string
  status: '待执行' | '执行中' | '已完成' | '已停止'
}

export interface HscOptimizationPlan {
  id: string
  sourceRuleCode: string
  title: string
  objective: string
  status: '草稿' | '待审批' | '执行中' | '待验证' | '已完成' | '已回退'
  estimatedAnnualSaving: number
  actions: HscPlanAction[]
  createdAt: string
}

export interface HscVerification {
  comparable: boolean
  checks: Array<{ name: string; passed: boolean; note: string }>
  before: Array<{ name: string; value: string }>
  after: Array<{ name: string; value: string }>
  verifiedAnnualSaving: number | null
  decision: 'PENDING' | 'ACCEPT' | 'CONTINUE' | 'ROLLBACK' | 'NOT_COMPARABLE'
  note: string
}

export interface HscScenario {
  id: HscScenarioId
  name: string
  summary: string
  updatedAt: string
  values: Record<string, string | number | boolean | null>
}

export interface HscModelView {
  scenario: HscScenario
  fields: HscFieldValue[]
  metrics: HscMetricResult[]
  rules: HscRuleResult[]
  causes: HscCauseVerification[]
  plan: HscOptimizationPlan
  verification: HscVerification
}
