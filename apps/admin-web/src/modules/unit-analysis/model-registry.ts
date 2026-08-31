import rawHscModel from '../high-efficiency-sedimentation/hsc-model-0.1.0.json'
import rawVfModel from '../v-filter-analysis/vf-model-0.1.0.json'
import rawPretreatmentModel from './pretreatment-model-0.1.0.json'
import rawDisinfectionModel from './disinfection-model-0.1.0.json'
import rawSludgeBalanceModel from './sludge-balance-model-0.1.0.json'
import rawDewateringModel from './dewatering-model-0.1.0.json'
import rawMbbrModel from './mbbr-model-0.1.0.json'
import rawAerationAirModel from './aeration-air-model-0.1.0.json'

export interface UnitModelField {
  fieldCode: string
  group: string
  name: string
  dataType: string
  unit: string | null
  source: string
  requiredMode: string
  cadence: string
  applicability: string
  boundary: string
}

export interface UnitModelMetric {
  metricCode: string
  group: string
  name: string
  formula: string
  dependencies: string[]
  unit: string
  precision: string
  minimumCoverage: number
  boundary: string
}

export interface UnitModelBenchmark {
  benchmarkCode: string
  benchmarkType: string
  objectCode: string
  name: string
  status: string
  publishable: boolean
  source: string
  lower: string | number | null
  upper: string | number | null
  unit: string
  applicability: string
  note: string
}

export interface UnitModelRule {
  ruleCode: string
  group: string
  name: string
  severity: string
  conclusionType: string
  resultStatusWhenMatched: string
  evidence: string
  likelyCauses: string
  recommendation: string
  constraint: string
  recovery: string
  boundary: string
  suppresses: string[]
  applicability: string
  thresholdRef: string
}

export interface UnitModelCause {
  causeCode: string
  ruleCode: string
  category: string
  question: string
  requiredEvidence: string
  confirmationCriteria: string
  evidenceSource?: string
  priority?: string
}

export interface UnitMachineModel {
  modelCode: string
  modelName: string
  version: string
  status: string
  ownerDomain: string
  fields: UnitModelField[]
  metrics: UnitModelMetric[]
  benchmarks: UnitModelBenchmark[]
  rules: UnitModelRule[]
  causes: UnitModelCause[]
  boundary: { owns: string[]; references: string[]; forbids: string[] }
  pageMappings: unknown[]
}

type RawRecord = Record<string, any>

function normalizeModel(raw: RawRecord): UnitMachineModel {
  return {
    modelCode: raw.modelCode,
    modelName: raw.modelName,
    version: raw.version,
    status: raw.status,
    ownerDomain: raw.ownerDomain,
    fields: raw.fields.map((item: RawRecord) => ({
      fieldCode: item.fieldCode,
      group: item.group,
      name: item.name,
      dataType: item.dataType,
      unit: item.unit === '—' ? null : item.unit,
      source: item.source ?? item.primarySource ?? '未配置',
      requiredMode: item.requiredMode,
      cadence: item.cadence ?? '',
      applicability: item.applicability ?? '全部',
      boundary: item.boundary ?? item.boundaryNote ?? ''
    })),
    metrics: raw.metrics.map((item: RawRecord) => ({
      metricCode: item.metricCode,
      group: item.group,
      name: item.name,
      formula: item.formula ?? item.formulaDisplay ?? '',
      dependencies: item.dependencies ?? [],
      unit: item.unit ?? '',
      precision: item.precision ?? '2',
      minimumCoverage: item.minimumCoverage ?? 0.8,
      boundary: item.boundary ?? item.boundaryNote ?? ''
    })),
    benchmarks: raw.benchmarks.map((item: RawRecord) => ({
      benchmarkCode: item.benchmarkCode,
      benchmarkType: item.benchmarkType,
      objectCode: item.objectCode,
      name: item.name,
      status: item.status,
      publishable: Boolean(item.publishable),
      source: item.source ?? '',
      lower: item.lower ?? null,
      upper: item.upper ?? null,
      unit: item.unit ?? '',
      applicability: item.applicability ?? '全部',
      note: item.note ?? ''
    })),
    rules: raw.rules.map((item: RawRecord) => ({
      ruleCode: item.ruleCode,
      group: item.group,
      name: item.name,
      severity: item.severity,
      conclusionType: item.conclusionType,
      resultStatusWhenMatched: item.resultStatusWhenMatched,
      evidence: item.evidence ?? '',
      likelyCauses: item.likelyCauses ?? item.likelyCausesDescription ?? '',
      recommendation: item.recommendation ?? item.recommendationTemplate ?? '',
      constraint: item.constraint ?? '',
      recovery: item.recovery ?? item.recoveryDescription ?? '',
      boundary: item.boundary ?? item.boundaryNote ?? '',
      suppresses: item.suppresses ?? [],
      applicability: item.applicability ?? '全部',
      thresholdRef: item.thresholdRef ?? ''
    })),
    causes: raw.causes,
    boundary: raw.boundary,
    pageMappings: raw.pageMappings ?? []
  }
}

const modelRegistry = new Map<string, UnitMachineModel>()

export function registerImprovementModel(raw: RawRecord) {
  const model = normalizeModel(raw)
  modelRegistry.set(`${model.modelCode}:${model.version}`, model)
  return model
}

export function getImprovementModelVersion(modelCode: string, versionNo: string) {
  const model = modelRegistry.get(`${modelCode}:${versionNo}`)
  if (!model) throw new Error(`MODEL_NOT_REGISTERED: ${modelCode}/${versionNo}`)
  return model
}

/** @deprecated 兼容首个 HSC 客户端，新实现统一使用 modelCode 入口。 */
export function getHscModelVersion(versionNo: string) {
  return getImprovementModelVersion('HSC', versionNo)
}

export const hscRegisteredModel = registerImprovementModel(rawHscModel as RawRecord)
export const vfRegisteredModel = registerImprovementModel(rawVfModel as RawRecord)
export const remainingRegisteredModels = [
  rawPretreatmentModel,
  rawDisinfectionModel,
  rawSludgeBalanceModel,
  rawDewateringModel,
  rawMbbrModel,
  rawAerationAirModel
].map(item => registerImprovementModel(item as RawRecord))

export function registeredModelCodes() {
  return Array.from(new Set(Array.from(modelRegistry.values()).map(item => item.modelCode)))
}
