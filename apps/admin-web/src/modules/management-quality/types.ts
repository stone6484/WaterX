export type QualityDimensionId = 'compliance' | 'stability' | 'safety' | 'efficiency'

export type QualityPageId =
  | 'qualityCompliance'
  | 'qualityStable'
  | 'qualitySafety'
  | 'qualityEfficiency'

export type QualityDataStatus =
  | 'normal_applicable'
  | 'process_not_applicable'
  | 'insufficient_data'
  | 'data_abnormal'
  | 'calculation_invalid'
  | 'actual_zero'
  | 'score_zero'

export type MetricRiskLevel = 'normal' | 'attention' | 'risk' | 'unavailable'

export interface QualityDimensionDefinition {
  id: QualityDimensionId
  name: string
  maxScore: number
  pageId: QualityPageId
  description: string
}

export interface QualityMetricRule {
  code: string
  dimension: QualityDimensionId
  name: string
  maxScore: number
  unit: string
  definition: string
  purpose: string
  period: string
  sourceModules: string[]
  baseline: string
  formula: string
  scoringRule: string
  applicability: string
  resultMeaning: string
  pendingValidation: string
}

export interface QualitySourceFact {
  id: string
  module: string
  title: string
  recordNo: string
  recordedAt: string
  owner: string
  detail: string
}

export interface QualityMetricSample {
  code: string
  actual: string
  baseline: string
  deviation: string
  score: number | null
  status: QualityDataStatus
  statusNote: string
  riskLevel: MetricRiskLevel
  interpretation: string
  trend: number[]
  trendLabels: string[]
  facts: QualitySourceFact[]
}

export interface QualityScenario {
  id: string
  name: string
  shortName: string
  description: string
  evaluationPeriod: string
  updatedAt: string
  metrics: QualityMetricSample[]
}

export interface QualityMetricView extends QualityMetricRule, QualityMetricSample {
  dimensionName: string
  scoreText: string
}

export interface QualityDimensionView extends QualityDimensionDefinition {
  score: number | null
  metricCount: number
  availableCount: number
  attentionCount: number
}

export interface QualityScenarioView {
  scenario: QualityScenario
  metrics: QualityMetricView[]
  dimensions: QualityDimensionView[]
  totalScore: number | null
  availableScore: number
  coverageCount: number
  coverageRate: number
  statusCounts: Record<QualityDataStatus, number>
  mainLosses: QualityMetricView[]
  trendSummary: string
}

export interface ImprovementDraft {
  sourceModule: '管理质量'
  sourceMetricCode: string
  sourceMetricName: string
  currentValue: string
  baseline: string
  currentScore: string
  problemDescription: string
  suggestedGoal: string
  evaluationPeriod: string
  ruleVersion: string
}
