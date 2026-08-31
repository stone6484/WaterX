import type {
  UnitCauseState,
  UnitConclusionType,
  UnitEvaluationStatus,
  UnitOptimizationPlan,
  UnitVerification
} from '../unit-analysis/types'

export type VfScenarioId = 'stable-water-saving' | 'backwash-data-gap' | 'sample-incomparable' | 'cell-data-gap'

export interface VfScenario {
  id: VfScenarioId
  name: string
  summary: string
  updatedAt: string
  values: Record<string, string | number | boolean | null>
}

export interface VfFieldValue {
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

export interface VfMetricResult {
  metricCode: string
  group: string
  name: string
  value: number | null
  display: string
  unit: string
  formula: string
  status: 'VALID' | 'MISSING_INPUT' | 'NOT_APPLICABLE' | 'CALCULATION_INVALID'
  benchmark: string
}

export interface VfRuleResult {
  ruleCode: string
  group: string
  name: string
  status: UnitEvaluationStatus
  severity: string
  conclusionType: UnitConclusionType
  conclusion: string
  evidence: string[]
  recommendation: string
  constraint: string
  recovery: string
  boundaryNote: string
  suppressedBy?: string
}

export interface VfCauseVerification {
  causeCode: string
  ruleCode: string
  category: string
  question: string
  requiredEvidence: string
  confirmationCriteria: string
  state: UnitCauseState
  note: string
}

export interface VfModelView {
  scenario: VfScenario
  fields: VfFieldValue[]
  metrics: VfMetricResult[]
  rules: VfRuleResult[]
  causes: VfCauseVerification[]
  plan: UnitOptimizationPlan
  verification: UnitVerification
}

export type { UnitCauseState, UnitEvaluationStatus, UnitOptimizationPlan, UnitVerification }
