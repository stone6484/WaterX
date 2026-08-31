export type UnitAnalysisTab = 'overview' | 'data' | 'diagnosis' | 'plan' | 'verification'

export type UnitEvaluationStatus =
  | 'NOT_APPLICABLE'
  | 'DATA_INSUFFICIENT'
  | 'NORMAL'
  | 'TRIGGERED'
  | 'SUPPRESSED'

export type UnitConclusionType =
  | 'CONFIRMED_DEVIATION'
  | 'SUSPECTED_DEVIATION'
  | 'OPTIMIZATION_OPPORTUNITY'
  | 'DATA_INSUFFICIENT'

export type UnitCauseState = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'INCONCLUSIVE' | 'NOT_APPLICABLE'

export interface UnitTabDefinition {
  id: UnitAnalysisTab
  name: string
  note: string
}

export interface UnitPlanAction {
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

export interface UnitOptimizationPlan {
  id: string
  sourceRuleCode: string
  title: string
  objective: string
  status: '草稿' | '待审批' | '执行中' | '待验证' | '已完成' | '已回退'
  estimatedAnnualSaving: number
  actions: UnitPlanAction[]
  createdAt: string
}

export interface UnitVerification {
  comparable: boolean
  checks: Array<{ name: string; passed: boolean; note: string }>
  before: Array<{ name: string; value: string }>
  after: Array<{ name: string; value: string }>
  verifiedAnnualSaving: number | null
  decision: 'PENDING' | 'ACCEPT' | 'CONTINUE' | 'ROLLBACK' | 'NOT_COMPARABLE'
  note: string
}
