import { hscModel } from './model'
import type {
  HscCauseVerification,
  HscEvaluationStatus,
  HscFieldValue,
  HscMetricResult,
  HscRuleResult,
  HscScenario
} from './types'

type Values = Record<string, string | number | boolean | null>

function number(values: Values, key: string): number | null {
  const value = values[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function divide(numerator: number | null, denominator: number | null): number | null {
  return numerator === null || denominator === null || denominator === 0 ? null : numerator / denominator
}

function removal(inlet: number | null, outlet: number | null): number | null {
  return inlet === null || outlet === null ? null : divide(inlet - outlet, inlet)
}

function metricValueMap(values: Values): Record<string, number | null> {
  const flow = number(values, 'actual_daily_flow')
  const capacity = number(values, 'design_capacity')
  const settleArea = number(values, 'settle_area')
  const runningGroups = number(values, 'running_settle_groups')
  const designGroups = number(values, 'settle_group_count')
  const runningShare = runningGroups !== null && designGroups ? runningGroups / designGroups : null
  const hourlyFlow = flow === null ? null : flow / 24
  const activeArea = settleArea !== null && runningShare !== null ? settleArea * runningShare : null
  const activeMixVolume = number(values, 'mix_volume')
  const activeFlocVolume = number(values, 'floc_volume')
  const activeSettleVolume = number(values, 'settle_volume')
  const coagMass = number(values, 'coagulant_daily_mass')
  const flocMass = number(values, 'flocculant_daily_mass')
  const coagDosage = divide(coagMass === null ? null : coagMass * 1000, flow)
  const activeContent = number(values, 'coagulant_active_content')
  const targetCoag = 21.5
  const returnVolume = number(values, 'return_sludge_flow') !== null && number(values, 'return_sludge_hours') !== null
    ? number(values, 'return_sludge_flow')! * number(values, 'return_sludge_hours')!
    : null
  const wasteVolume = number(values, 'waste_sludge_flow') !== null && number(values, 'waste_sludge_hours') !== null
    ? number(values, 'waste_sludge_flow')! * number(values, 'waste_sludge_hours')!
    : null
  const wasteConcentration = number(values, 'waste_sludge_concentration')
  const coagCost = coagMass === null ? null : divide(coagMass * number(values, 'coagulant_price')! / 1000, flow)
  const flocCost = flocMass === null ? null : divide(flocMass * number(values, 'flocculant_price')! / 1000, flow)
  const energyCost = number(values, 'unit_energy') !== null && number(values, 'electricity_price') !== null
    ? divide(number(values, 'unit_energy')! * number(values, 'electricity_price')!, flow)
    : null
  const totalCost = coagCost !== null && flocCost !== null && energyCost !== null ? coagCost + flocCost + energyCost : null

  return {
    LOAD_RATE: divide(flow, capacity),
    ACT_SURFACE_LOAD: divide(hourlyFlow, activeArea),
    PEAK_MARGIN: number(values, 'design_peak_flow') !== null && number(values, 'peak_hourly_flow') !== null
      ? divide(number(values, 'design_peak_flow'), number(values, 'peak_hourly_flow'))! - 1
      : null,
    MIX_HRT: divide(activeMixVolume, hourlyFlow) === null ? null : divide(activeMixVolume, hourlyFlow)! * 60,
    FLOC_HRT: divide(activeFlocVolume, hourlyFlow) === null ? null : divide(activeFlocVolume, hourlyFlow)! * 60,
    SETTLE_HRT: divide(activeSettleVolume, hourlyFlow) === null ? null : divide(activeSettleVolume, hourlyFlow)! * 60,
    COD_REMOVAL: removal(number(values, 'influent_cod'), number(values, 'effluent_cod')),
    SS_REMOVAL: removal(number(values, 'influent_ss'), number(values, 'effluent_ss')),
    TP_REMOVAL: removal(number(values, 'influent_tp'), number(values, 'effluent_tp')),
    ORTHO_P_REMOVAL: removal(number(values, 'influent_ortho_p'), number(values, 'effluent_ortho_p')),
    MIX_POWER_DENSITY: divide(number(values, 'mixer_actual_power') === null ? null : number(values, 'mixer_actual_power')! * 1000, activeMixVolume),
    FLOC_POWER_DENSITY: divide(number(values, 'floc_actual_power') === null ? null : number(values, 'floc_actual_power')! * 1000, activeFlocVolume),
    COAG_DOSAGE: coagDosage,
    COAG_ACTIVE_DOSAGE: coagDosage === null || activeContent === null ? null : coagDosage * activeContent / 100,
    THEORETICAL_COAG: null,
    COAG_DEVIATION: coagDosage === null ? null : (coagDosage - targetCoag) / targetCoag,
    METAL_P_MOLAR_RATIO: null,
    FLOC_DOSAGE: divide(flocMass === null ? null : flocMass * 1000, flow),
    RETURN_RATIO: divide(returnVolume, flow),
    ACT_WASTE_VOLUME: wasteVolume,
    ACT_WASTE_DS: wasteVolume === null || wasteConcentration === null ? null : wasteVolume * wasteConcentration / 1000,
    THEORY_SLUDGE_DS: null,
    SLUDGE_BALANCE_DEV: null,
    UNIT_ENERGY_INTENSITY: divide(number(values, 'unit_energy'), flow),
    COAG_COST_PER_WATER: coagCost,
    FLOC_COST_PER_WATER: flocCost,
    ENERGY_COST_PER_WATER: energyCost,
    TOTAL_COST_PER_WATER: totalCost,
    ANNUAL_SAVING: 97024
  }
}

function precisionDigits(precision: string): number {
  const match = precision.match(/\d+/)
  return match ? Number(match[0]) : 2
}

function displayMetric(value: number | null, unit: string, precision: string): string {
  if (value === null) return '待补充参数'
  const percentage = unit === '%'
  return `${(percentage ? value * 100 : value).toFixed(precisionDigits(precision))} ${unit}`.trim()
}

function benchmarkLabel(code: string): string {
  const specific = hscModel.benchmarks.filter(item => item.objectCode === code)
  if (!specific.length) return '按模型定义计算'
  const confirmed = specific.find(item => item.publishable)
  if (confirmed) return `${confirmed.name}（已确认）`
  return `${specific[0].name}（待项目确认）`
}

export function calculateMetrics(scenario: HscScenario): HscMetricResult[] {
  const values = metricValueMap(scenario.values)
  return hscModel.metrics.map(definition => {
    const value = values[definition.metricCode] ?? null
    const pendingModelParameter = ['THEORETICAL_COAG', 'METAL_P_MOLAR_RATIO', 'THEORY_SLUDGE_DS', 'SLUDGE_BALANCE_DEV'].includes(definition.metricCode)
    return {
      metricCode: definition.metricCode,
      group: definition.group,
      name: definition.name,
      value,
      display: displayMetric(value, definition.unit, definition.precision),
      unit: definition.unit,
      formula: definition.formulaDisplay,
      precision: definition.precision,
      status: value === null ? 'MISSING_INPUT' : 'VALID',
      benchmark: pendingModelParameter ? '化学计量/产泥参数待项目确认' : benchmarkLabel(definition.metricCode)
    }
  })
}

export function mapFields(scenario: HscScenario): HscFieldValue[] {
  return hscModel.fields.map(definition => {
    const value = scenario.values[definition.fieldCode] ?? null
    const missing = value === null || value === ''
    const abnormal = scenario.id === 'sample-incomparable' && ['influent_ss', 'influent_tp', 'effluent_clarity'].includes(definition.fieldCode)
    return {
      fieldCode: definition.fieldCode,
      group: definition.group,
      name: definition.name,
      value,
      unit: definition.unit,
      source: definition.primarySource,
      coverage: missing ? 0 : abnormal ? 0.45 : 1,
      reviewState: missing ? 'MISSING' : abnormal ? 'ABNORMAL' : 'VERIFIED',
      estimated: false
    }
  })
}

const stableTriggered = new Set(['HSC-SET-02', 'HSC-CHEM-04', 'HSC-SLD-01'])

function ruleStatus(ruleCode: string, scenario: HscScenario): { status: HscEvaluationStatus; suppressedBy?: string } {
  if (scenario.id === 'chemical-data-gap') {
    if (ruleCode === 'HSC-DATA-01') return { status: 'DATA_INSUFFICIENT' }
    if (['HSC-CHEM-01', 'HSC-CHEM-02', 'HSC-CHEM-03', 'HSC-CHEM-04'].includes(ruleCode)) return { status: 'SUPPRESSED', suppressedBy: 'HSC-DATA-01' }
  }
  if (scenario.id === 'sample-incomparable') {
    if (ruleCode === 'HSC-DATA-02') return { status: 'DATA_INSUFFICIENT' }
    if (['HSC-HRT-01', 'HSC-HRT-02', 'HSC-SET-01', 'HSC-SET-02'].includes(ruleCode)) return { status: 'SUPPRESSED', suppressedBy: 'HSC-DATA-02' }
    if (ruleCode === 'HSC-SLD-03') return { status: 'NOT_APPLICABLE' }
  }
  if (ruleCode.startsWith('HSC-DATA-')) return { status: 'NORMAL' }
  return { status: stableTriggered.has(ruleCode) ? 'TRIGGERED' : 'NORMAL' }
}

function evidenceFor(ruleCode: string, scenario: HscScenario, metrics: HscMetricResult[]): string[] {
  const byCode = Object.fromEntries(metrics.map(item => [item.metricCode, item.display]))
  const values = scenario.values
  const common: Record<string, string[]> = {
    'HSC-CAP-01': [`实际表面负荷 ${byCode.ACT_SURFACE_LOAD}`, `峰值能力裕量 ${byCode.PEAK_MARGIN}`],
    'HSC-CAP-02': [`处理负荷率 ${byCode.LOAD_RATE}`, `运行组数 ${values.running_settle_groups}组`],
    'HSC-HRT-01': [`混合区HRT ${byCode.MIX_HRT}`, `混合转速 ${values.mixer_actual_speed} rpm`],
    'HSC-HRT-02': [`絮凝区HRT ${byCode.FLOC_HRT}`, `矾花状态：${values.floc_state}`],
    'HSC-MIX-01': [`混合功率密度 ${byCode.MIX_POWER_DENSITY}`, `实际功率 ${values.mixer_actual_power} kW`],
    'HSC-MIX-02': [`絮凝功率密度 ${byCode.FLOC_POWER_DENSITY}`, `矾花状态：${values.floc_state}`],
    'HSC-SET-01': [`SS去除率 ${byCode.SS_REMOVAL}`, `出水外观：${values.effluent_clarity}`],
    'HSC-SET-02': [`斜管状态：${values.lamella_state}`, `沉淀区HRT ${byCode.SETTLE_HRT}`],
    'HSC-CHEM-01': [`PAC单耗 ${byCode.COAG_DOSAGE}`, `示范目标 21.5 mg/L（待确认）`],
    'HSC-CHEM-02': [`TP去除率 ${byCode.TP_REMOVAL}`, `出水TP ${values.effluent_tp} mg/L`],
    'HSC-CHEM-03': [`PAM单耗 ${byCode.FLOC_DOSAGE}`, `矾花状态：${values.floc_state}`],
    'HSC-CHEM-04': [`PAC单耗 ${byCode.COAG_DOSAGE}`, `出水TP ${values.effluent_tp} mg/L`, '示范优化目标 23.2 mg/L（待验证）'],
    'HSC-SLD-01': [`泥位 ${values.sludge_level} m`, `排泥量 ${byCode.ACT_WASTE_VOLUME}`],
    'HSC-SLD-02': [`泥位 ${values.sludge_level} m`, `出水外观：${values.effluent_clarity}`],
    'HSC-SLD-03': [`污泥回流比 ${byCode.RETURN_RATIO}`, `回流浓度 ${values.return_sludge_concentration ?? '不适用'} mg/L`],
    'HSC-SLD-04': [`实际排泥干固体 ${byCode.ACT_WASTE_DS}`, '理论产泥参数待项目确认'],
    'HSC-ENE-01': [`吨水电耗 ${byCode.UNIT_ENERGY_INTENSITY}`, `日耗电 ${values.unit_energy} kWh`],
    'HSC-COST-01': [`总吨水成本 ${byCode.TOTAL_COST_PER_WATER}`, `PAC成本 ${byCode.COAG_COST_PER_WATER}`],
    'HSC-DATA-01': ['有效成分、流量与投加量三项证据完整性校验', `当前缺失：${scenario.id === 'chemical-data-gap' ? '有效成分、含量、日投加量' : '无'}`],
    'HSC-DATA-02': ['采样点、采样时段与HRT对齐校验', `当前状态：${scenario.id === 'sample-incomparable' ? '不可比' : '可比'}`]
  }
  return common[ruleCode] ?? ['按模型依赖字段与指标完成证据校验']
}

export function evaluateRules(scenario: HscScenario, metrics: HscMetricResult[]): HscRuleResult[] {
  return hscModel.rules.map(definition => {
    const state = ruleStatus(definition.ruleCode, scenario)
    const dataRule = definition.ruleCode.startsWith('HSC-DATA-')
    const conclusion = state.status === 'DATA_INSUFFICIENT'
      ? definition.ruleCode === 'HSC-DATA-01'
        ? '药量诊断证据不足；仅要求补齐计量和检测，不生成药剂业务偏差。'
        : '进出水数据不可比；仅要求修正采样和统计口径，暂停效果诊断。'
      : state.status === 'SUPPRESSED'
        ? `依赖证据不足，已被 ${state.suppressedBy} 抑制，不发布业务偏差。`
        : state.status === 'NOT_APPLICABLE'
          ? '当前单体配置不适用，本周期不参与判断。'
          : state.status === 'TRIGGERED'
            ? `${definition.name}已命中示范规则，需结合原因核验后形成优化动作。`
            : `${definition.name}未命中，当前处于正常观察状态。`
    return {
      ruleCode: definition.ruleCode,
      group: definition.group,
      name: definition.name,
      status: state.status,
      severity: definition.severity,
      conclusionType: (dataRule ? 'DATA_INSUFFICIENT' : definition.conclusionType) as HscRuleResult['conclusionType'],
      conclusion,
      evidence: evidenceFor(definition.ruleCode, scenario, metrics),
      recommendation: state.status === 'DATA_INSUFFICIENT'
        ? definition.ruleCode === 'HSC-DATA-01' ? '补齐有效成分、投加计量和对应检测结果。' : '修正进出水采样点、时段和HRT配对关系。'
        : definition.recommendationTemplate,
      constraint: definition.constraint,
      recovery: definition.recoveryDescription,
      boundaryNote: definition.boundaryNote,
      suppressedBy: state.suppressedBy
    }
  })
}

export function createCauseVerifications(): HscCauseVerification[] {
  return hscModel.causes.map(item => ({
    causeCode: item.causeCode,
    ruleCode: item.ruleCode,
    category: item.category,
    question: item.question,
    requiredEvidence: item.requiredEvidence,
    confirmationCriteria: item.confirmationCriteria,
    state: 'PENDING',
    note: ''
  }))
}
