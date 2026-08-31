import { getImprovementModelVersion } from './model-registry'
import { getRemainingUnitDefinition } from './remaining-unit-config'
import type { RemainingUnitCode } from './remaining-unit-config'
import type {
  UnitCauseState,
  UnitConclusionType,
  UnitEvaluationStatus,
  UnitOptimizationPlan,
  UnitVerification
} from './types'

export type RemainingScenarioId = 'stable-optimization' | 'data-gap' | 'variant'

export interface RemainingScenario {
  id: RemainingScenarioId
  name: string
  summary: string
  updatedAt: string
}

export interface RemainingFieldView {
  fieldCode: string
  group: string
  name: string
  value: string | number | boolean | null
  unit: string | null
  source: string
  coverage: number
  reviewState: 'VERIFIED' | 'MISSING' | 'ABNORMAL'
  cadence: string
  applicability: string
  boundary: string
}

export interface RemainingMetricView {
  metricCode: string
  group: string
  name: string
  display: string
  unit: string
  formula: string
  dependencies: string[]
  status: 'VALID' | 'MISSING_INPUT' | 'NOT_APPLICABLE'
  benchmark: string
  boundary: string
}

export interface RemainingRuleView {
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
  applicability: string
  suppressedBy?: string
}

export interface RemainingCauseView {
  causeCode: string
  ruleCode: string
  category: string
  question: string
  requiredEvidence: string
  confirmationCriteria: string
  evidenceSource?: string
  priority?: string
  state: UnitCauseState
  note: string
}

export interface RemainingUnitState {
  scenarioId: RemainingScenarioId
  causes: RemainingCauseView[]
  plan: UnitOptimizationPlan
  verification: UnitVerification
}

export interface RemainingUnitView {
  scenario: RemainingScenario
  fields: RemainingFieldView[]
  metrics: RemainingMetricView[]
  rules: RemainingRuleView[]
  causes: RemainingCauseView[]
  plan: UnitOptimizationPlan
  verification: UnitVerification
}

function scenarios(code: RemainingUnitCode): RemainingScenario[] {
  const definition = getRemainingUnitDefinition(code)
  return [
    { id: 'stable-optimization', name: definition.normalScenario, summary: '关键数据完整，稳定运行基础上识别局部效率与成本优化机会。', updatedAt: '2026-08-31 18:10' },
    { id: 'data-gap', name: definition.dataGapScenario, summary: '最低证据门槛未满足，只输出补数要求并抑制依赖业务规则。', updatedAt: '2026-08-31 18:10' },
    { id: 'variant', name: definition.variantScenario, summary: '按单体配置先做适用性判断，不把未配置工艺或机型误判为缺数。', updatedAt: '2026-08-31 18:10' }
  ]
}

export function getRemainingUnitScenarios(code: RemainingUnitCode) {
  return scenarios(code)
}

function demoNumber(unit: string | null, index: number) {
  if (unit === '%') return Number((0.72 + index % 18 / 100).toFixed(3))
  if (unit?.includes('kWh')) return Number((0.08 + index * 0.013).toFixed(3))
  if (unit?.includes('元')) return Number((0.2 + index * 0.11).toFixed(2))
  if (unit === 'h' || unit === 'min') return Number((1.8 + index * 0.37).toFixed(2))
  return Number((8 + index * 3.7).toFixed(2))
}

function demoFieldValue(code: RemainingUnitCode, field: ReturnType<typeof getImprovementModelVersion>['fields'][number], index: number) {
  if (field.fieldCode === 'site_id') return 'WX-DEMO-01'
  if (field.fieldCode.includes('unit_id')) return `${code}-01`
  if (field.fieldCode.includes('analysis_period')) return '2026-08-01—2026-08-31'
  if (field.fieldCode.includes('model_version')) return '0.1.0'
  const type = field.dataType.toUpperCase()
  if (type.includes('BOOL')) return true
  if (type.includes('DATE') || type.includes('TIME')) return '2026-08-31 08:00'
  if (type.includes('STRING') || type.includes('ENUM')) return `示范值-${index + 1}`
  return demoNumber(field.unit, index)
}

function buildFields(code: RemainingUnitCode, scenarioId: RemainingScenarioId): RemainingFieldView[] {
  const model = getImprovementModelVersion(code, '0.1.0')
  const gapIndexes = new Set(model.fields.map((_, index) => index).filter(index => index > 4 && index < 11))
  return model.fields.map((field, index) => {
    const missing = scenarioId === 'data-gap' && gapIndexes.has(index)
    const abnormal = scenarioId === 'variant' && index === model.fields.length - 1
    return {
      ...field,
      value: missing ? null : demoFieldValue(code, field, index),
      coverage: missing ? 0 : abnormal ? 0.55 : 1,
      reviewState: missing ? 'MISSING' : abnormal ? 'ABNORMAL' : 'VERIFIED'
    }
  })
}

function benchmarkText(code: RemainingUnitCode, metricCode: string) {
  const benchmark = getImprovementModelVersion(code, '0.1.0').benchmarks.find(item => item.objectCode === metricCode)
  if (!benchmark) return '候选基准待项目确认 · 当前仅演示试算'
  const range = [benchmark.lower, benchmark.upper].filter(value => value !== null && value !== undefined).join(' — ')
  return `${range || benchmark.name} ${benchmark.unit}`.trim() + ' · DRAFT / 不可发布'
}

function buildMetrics(code: RemainingUnitCode, scenarioId: RemainingScenarioId, fields: RemainingFieldView[]): RemainingMetricView[] {
  const model = getImprovementModelVersion(code, '0.1.0')
  const missingCodes = new Set(fields.filter(item => item.reviewState !== 'VERIFIED').map(item => item.fieldCode))
  return model.metrics.map((metric, index) => {
    const missing = scenarioId === 'data-gap' && metric.dependencies.some(item => missingCodes.has(item))
    const notApplicable = scenarioId === 'variant' && index >= model.metrics.length - 2
    const value = demoNumber(metric.unit, index)
    return {
      ...metric,
      display: notApplicable ? '不适用' : missing ? '待补充参数' : `${metric.unit === '%' ? (value * 100).toFixed(1) : value} ${metric.unit}`.trim(),
      status: notApplicable ? 'NOT_APPLICABLE' : missing ? 'MISSING_INPUT' : 'VALID',
      benchmark: benchmarkText(code, metric.metricCode)
    }
  })
}

function ruleState(code: RemainingUnitCode, scenarioId: RemainingScenarioId, ruleCode: string) {
  const model = getImprovementModelVersion(code, '0.1.0')
  const dataRules = model.rules.filter(item => item.conclusionType === 'DATA_INSUFFICIENT')
  const businessRules = model.rules.filter(item => item.conclusionType !== 'DATA_INSUFFICIENT')
  const gate = dataRules[0]
  if (scenarioId === 'data-gap' && gate) {
    if (ruleCode === gate.ruleCode) return { status: 'DATA_INSUFFICIENT' as const }
    if (gate.suppresses.includes(ruleCode)) return { status: 'SUPPRESSED' as const, suppressedBy: gate.ruleCode }
  }
  if (dataRules.some(item => item.ruleCode === ruleCode)) return { status: 'NORMAL' as const }
  if (scenarioId === 'variant' && ruleCode === businessRules[businessRules.length - 1]?.ruleCode) return { status: 'NOT_APPLICABLE' as const }
  const triggered = scenarioId === 'stable-optimization' ? businessRules.slice(0, 3) : scenarioId === 'variant' ? businessRules.slice(0, 1) : []
  return { status: triggered.some(item => item.ruleCode === ruleCode) ? 'TRIGGERED' as const : 'NORMAL' as const }
}

function buildRules(code: RemainingUnitCode, scenarioId: RemainingScenarioId, fields: RemainingFieldView[]): RemainingRuleView[] {
  const model = getImprovementModelVersion(code, '0.1.0')
  const coverage = Math.round(fields.reduce((sum, item) => sum + item.coverage, 0) / fields.length * 100)
  return model.rules.map(rule => {
    const state = ruleState(code, scenarioId, rule.ruleCode)
    const conclusion = state.status === 'DATA_INSUFFICIENT'
      ? `${rule.name}：最低证据不完整，只输出补数要求，不生成业务偏差。`
      : state.status === 'SUPPRESSED'
        ? `依赖证据不足，已被 ${state.suppressedBy} 抑制，不显示为正常。`
        : state.status === 'NOT_APPLICABLE'
          ? '当前单体配置不适用本规则，不要求补数。'
          : state.status === 'TRIGGERED'
            ? `${rule.name}命中DRAFT候选基准试算，需先完成人工原因核验。`
            : `${rule.name}当前未命中，继续按受控周期观察。`
    return {
      ...rule,
      status: state.status,
      suppressedBy: state.suppressedBy,
      conclusionType: rule.conclusionType as UnitConclusionType,
      conclusion,
      evidence: [
        `当前字段覆盖率 ${coverage}% · 对象与周期已冻结`,
        `规则门槛：${rule.thresholdRef || '按模型最低证据集执行'}`,
        `适用范围：${rule.applicability}`
      ],
      boundaryNote: rule.boundary
    }
  })
}

function createCauses(code: RemainingUnitCode): RemainingCauseView[] {
  return getImprovementModelVersion(code, '0.1.0').causes.map(item => ({ ...item, state: 'PENDING', note: '' }))
}

function createPlan(code: RemainingUnitCode): UnitOptimizationPlan {
  const definition = getRemainingUnitDefinition(code)
  const model = getImprovementModelVersion(code, '0.1.0')
  const source = model.rules.find(item => item.conclusionType !== 'DATA_INSUFFICIENT') ?? model.rules[0]
  return {
    id: `${code}-PLAN-20260831-01`, sourceRuleCode: source.ruleCode, title: `${definition.shortName}受控优化试验`,
    objective: '在保护指标不恶化的前提下，通过小步调整验证局部效率改善空间。', status: '草稿',
    estimatedAnnualSaving: definition.annualSaving, createdAt: '2026-08-31 18:15',
    actions: [
      { id: `${code}-ACT-01`, title: '确认原因与基线', owner: definition.defaultOwner, currentValue: '当前运行档位', targetValue: '形成可追溯基线', step: '核验对象、周期、证据和外部引用，冻结生产性试验基线。', guard: '水质、负荷、设备与安全约束不恶化。', stopCondition: '证据不足或专业边界无法确认。', rollbackCondition: '撤销试验准备，保留原始快照。', status: '待执行' },
      { id: `${code}-ACT-02`, title: '执行小步生产性试验', owner: definition.defaultOwner, currentValue: '基线参数', targetValue: '候选目标（待验证）', step: '单次只调整一个受控变量，跨越完整稳定周期后再评价。', guard: '关键保护指标和设备运行边界持续满足。', stopCondition: '任一保护指标触发，立即停止继续调整。', rollbackCondition: '恢复上一稳定参数版本并记录回退原因。', status: '待执行' }
    ]
  }
}

function createVerification(code: RemainingUnitCode): UnitVerification {
  const definition = getRemainingUnitDefinition(code)
  return {
    comparable: true,
    checks: [
      { name: '对象与边界一致', passed: true, note: '同一单体、同一计量边界' },
      { name: '负荷与周期可比', passed: true, note: '运行负荷差异处于演示容许范围' },
      { name: '数据来源与方法一致', passed: true, note: '版本和点位均可追溯' },
      { name: '保护指标未恶化', passed: true, note: '未触发停止或回退条件' }
    ],
    before: [{ name: '运行效率指数', value: '基线 100' }, { name: '单位成本指数', value: '基线 100' }, { name: '保护指标', value: '受控' }],
    after: [{ name: '运行效率指数', value: '104.8（演示）' }, { name: '单位成本指数', value: '94.6（演示）' }, { name: '保护指标', value: '未恶化' }],
    verifiedAnnualSaving: definition.annualSaving * 0.93,
    decision: 'PENDING', note: '所有结果均为固定演示数据；96项候选基准完成试点审批前不得固化生产目标。'
  }
}

function defaults(code: RemainingUnitCode): RemainingUnitState {
  return { scenarioId: 'stable-optimization', causes: createCauses(code), plan: createPlan(code), verification: createVerification(code) }
}

function storageKey(code: RemainingUnitCode) {
  return `waterx-unit-${code.toLowerCase()}-v1-demo-state`
}

export function loadRemainingUnitState(code: RemainingUnitCode): RemainingUnitState {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey(code)) || 'null') as RemainingUnitState | null
    if (stored && scenarios(code).some(item => item.id === stored.scenarioId)) return stored
  } catch {
    // 本地演示状态不可用时恢复固定样例。
  }
  return defaults(code)
}

export function saveRemainingUnitState(code: RemainingUnitCode, state: RemainingUnitState) {
  localStorage.setItem(storageKey(code), JSON.stringify(state))
}

export function resetRemainingUnitState(code: RemainingUnitCode) {
  const state = defaults(code)
  saveRemainingUnitState(code, state)
  return state
}

export function buildRemainingUnitView(code: RemainingUnitCode, state: RemainingUnitState): RemainingUnitView {
  const scenario = scenarios(code).find(item => item.id === state.scenarioId) ?? scenarios(code)[0]
  const fields = buildFields(code, scenario.id)
  return {
    scenario,
    fields,
    metrics: buildMetrics(code, scenario.id, fields),
    rules: buildRules(code, scenario.id, fields),
    causes: state.causes,
    plan: state.plan,
    verification: state.verification
  }
}

export function updateRemainingCause(code: RemainingUnitCode, state: RemainingUnitState, causeCode: string, nextState: UnitCauseState, note: string) {
  const cause = state.causes.find(item => item.causeCode === causeCode)
  if (!cause) return
  cause.state = nextState
  cause.note = note
  saveRemainingUnitState(code, state)
}
