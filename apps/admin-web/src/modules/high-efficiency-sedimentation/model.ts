import rawModel from './hsc-model-0.1.0.json'

export interface HscModelField {
  fieldCode: string
  group: string
  name: string
  description: string
  dataType: string
  unit: string | null
  primarySource: string
  requiredMode: string
  defaultPage: string
  boundaryNote: string
}

export interface HscModelMetric {
  metricCode: string
  group: string
  name: string
  formulaDisplay: string
  unit: string
  precision: string
  minimumCoverage: number
  defaultPage: string
  boundaryNote: string
}

export interface HscModelBenchmark {
  benchmarkCode: string
  benchmarkType: string
  objectCode: string
  name: string
  lowerOrSource: string
  upperOrSource: string
  unit: string
  source: string
  status: string
  note: string
  publishable: boolean
}

export interface HscModelRule {
  ruleCode: string
  group: string
  name: string
  severity: string
  conclusionType: string
  resultStatusWhenMatched: string
  likelyCausesDescription: string
  recommendationTemplate: string
  constraint: string
  recoveryDescription: string
  boundaryNote: string
  suppresses: string[]
}

export interface HscModelCause {
  causeCode: string
  ruleCode: string
  category: string
  question: string
  requiredEvidence: string
  confirmationCriteria: string
}

export interface HscMachineModel {
  modelCode: string
  modelName: string
  version: string
  status: string
  timezone: string
  ownerDomain: string
  fields: HscModelField[]
  metrics: HscModelMetric[]
  benchmarks: HscModelBenchmark[]
  rules: HscModelRule[]
  causes: HscModelCause[]
  boundary: {
    owns: string[]
    references: string[]
    forbids: string[]
  }
}

export const hscModel = rawModel as HscMachineModel

export const HSC_MODEL_LABEL = `${hscModel.modelCode} ${hscModel.version}`
export const HSC_MODEL_STATUS = hscModel.status

export const modelCounts = {
  fields: hscModel.fields.length,
  metrics: hscModel.metrics.length,
  benchmarks: hscModel.benchmarks.length,
  rules: hscModel.rules.length,
  causes: hscModel.causes.length
}

export const confirmedBenchmarks = hscModel.benchmarks.filter(item => item.publishable)
export const pendingBenchmarks = hscModel.benchmarks.filter(item => !item.publishable)
