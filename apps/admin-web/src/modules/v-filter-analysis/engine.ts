import { vfRegisteredModel as vfModel } from '../unit-analysis/model-registry'
import type {
  UnitEvaluationStatus,
  VfCauseVerification,
  VfFieldValue,
  VfMetricResult,
  VfRuleResult,
  VfScenario
} from './types'

type Values = VfScenario['values']

function num(values: Values, key: string): number | null {
  const value = values[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function divide(a: number | null, b: number | null) {
  return a === null || b === null || b === 0 ? null : a / b
}

function product(...values: Array<number | null>) {
  return values.some(value => value === null) ? null : values.reduce<number>((total, value) => total * (value as number), 1)
}

function removal(inlet: number | null, outlet: number | null) {
  return inlet === null || outlet === null ? null : divide(inlet - outlet, inlet)
}

function metricMap(values: Values): Record<string, number | null> {
  const daily = num(values, 'actual_daily_flow')
  const hourly = daily === null ? null : daily / 24
  const cellArea = product(num(values, 'cell_length'), num(values, 'cell_width'))
  const totalCells = product(num(values, 'filter_group_count'), num(values, 'cells_per_group'))
  const totalArea = product(totalCells, cellArea)
  const operatingArea = product(num(values, 'running_cell_count'), cellArea)
  const backwashArea = product(
    num(values, 'running_cell_count') === null || num(values, 'backwashing_cell_count') === null
      ? null
      : num(values, 'running_cell_count')! - num(values, 'backwashing_cell_count')!,
    cellArea
  )
  const gasFlowLs = num(values, 'air_flow_gas') === null ? null : num(values, 'air_flow_gas')! * 1000 / 60 * (num(values, 'blowers_gas') ?? 1)
  const combinedAirLs = num(values, 'air_flow_combined') === null ? null : num(values, 'air_flow_combined')! * 1000 / 60 * (num(values, 'blowers_combined') ?? 1)
  const combinedWaterM3h = product(num(values, 'wash_pump_flow_combined'), num(values, 'wash_pumps_combined'))
  const waterM3h = product(num(values, 'wash_pump_flow_water'), num(values, 'wash_pumps_water'))
  const combinedWater = product(combinedWaterM3h, num(values, 'combined_duration'))
  const waterWash = product(waterM3h, num(values, 'water_duration'))
  const surfaceWater = product(num(values, 'surface_wash_flow'), num(values, 'surface_duration'))
  const combinedPerEvent = combinedWater === null ? null : combinedWater / 60
  const waterPerEvent = waterWash === null ? null : waterWash / 60
  const surfacePerEvent = surfaceWater === null ? null : surfaceWater / 60
  const totalPerEvent = combinedPerEvent === null || waterPerEvent === null ? null : combinedPerEvent + waterPerEvent + (surfacePerEvent ?? 0)
  const dailyBackwash = product(totalPerEvent, num(values, 'backwash_events_daily'))
  const pumpPower = num(values, 'pump_actual_current') === null ? null : Math.sqrt(3) * 0.38 * num(values, 'pump_actual_current')! * 0.85
  const blowerPower = num(values, 'blower_actual_current') === null ? null : Math.sqrt(3) * 0.38 * num(values, 'blower_actual_current')! * 0.85
  const totalEnergy = num(values, 'pump_daily_energy') === null || num(values, 'blower_daily_energy') === null
    ? null : num(values, 'pump_daily_energy')! + num(values, 'blower_daily_energy')!
  const energyCost = totalEnergy === null || num(values, 'electricity_price') === null ? null : totalEnergy * num(values, 'electricity_price')!
  const waterCost = dailyBackwash === null || num(values, 'treated_water_price') === null ? null : dailyBackwash * num(values, 'treated_water_price')!

  return {
    ACT_HOURLY_FLOW: hourly,
    CELL_AREA: cellArea,
    TOTAL_FILTER_AREA: totalArea,
    OPERATING_FILTER_AREA: operatingArea,
    NORMAL_FILTER_RATE: divide(hourly, operatingArea),
    BACKWASH_FILTER_RATE: divide(hourly, backwashArea),
    CAPACITY_UTILIZATION: divide(daily, num(values, 'design_capacity')),
    AVAILABLE_HEAD: num(values, 'inlet_well_level') === null || num(values, 'outlet_well_level') === null ? null : num(values, 'inlet_well_level')! - num(values, 'outlet_well_level')!,
    HEADLOSS_GROWTH: num(values, 'filter_headloss_end') === null || num(values, 'filter_headloss_start') === null ? null : num(values, 'filter_headloss_end')! - num(values, 'filter_headloss_start')!,
    FILTER_CYCLE: num(values, 'filter_cycle_hours'),
    BACKWASH_EVENTS: num(values, 'backwash_events_daily'),
    TOTAL_BACKWASH_TIME: [num(values, 'gas_duration'), num(values, 'combined_duration'), num(values, 'water_duration'), num(values, 'surface_duration')].some(value => value === null)
      ? null : num(values, 'gas_duration')! + num(values, 'combined_duration')! + num(values, 'water_duration')! + num(values, 'surface_duration')!,
    GAS_INTENSITY: divide(gasFlowLs, cellArea),
    COMBINED_AIR_INTENSITY: divide(combinedAirLs, cellArea),
    COMBINED_WATER_INTENSITY: divide(combinedWaterM3h === null ? null : combinedWaterM3h * 1000 / 3600, cellArea),
    WATER_INTENSITY: divide(waterM3h === null ? null : waterM3h * 1000 / 3600, cellArea),
    SURFACE_INTENSITY: divide(num(values, 'surface_wash_flow') === null ? null : num(values, 'surface_wash_flow')! * 1000 / 3600, cellArea),
    COMBINED_WATER_PER_EVENT: combinedPerEvent,
    WATER_WASH_PER_EVENT: waterPerEvent,
    SURFACE_WATER_PER_EVENT: surfacePerEvent,
    BACKWASH_WATER_PER_EVENT: totalPerEvent,
    DAILY_BACKWASH_WATER: dailyBackwash,
    BACKWASH_WATER_RATIO: divide(dailyBackwash, daily),
    PUMP_POWER: pumpPower,
    PUMP_SYSTEM_EFFICIENCY: pumpPower === null ? null : divide(product(num(values, 'pump_actual_flow'), num(values, 'pump_actual_head')), 367 * pumpPower),
    BLOWER_POWER: blowerPower,
    TOTAL_BACKWASH_ENERGY: totalEnergy,
    UNIT_BACKWASH_ENERGY: divide(totalEnergy, daily),
    ENERGY_COST: energyCost,
    WATER_COST: waterCost,
    TOTAL_COST_PER_WATER: energyCost === null ? null : divide(energyCost + (waterCost ?? 0), daily),
    SS_REMOVAL: removal(num(values, 'influent_ss'), num(values, 'effluent_ss')),
    TURBIDITY_REMOVAL: removal(num(values, 'influent_turbidity'), num(values, 'effluent_turbidity')),
    COD_REMOVAL_OBS: removal(num(values, 'influent_cod'), num(values, 'effluent_cod')),
    TP_REMOVAL_OBS: removal(num(values, 'influent_tp'), num(values, 'effluent_tp'))
  }
}

function format(value: number | null, unit: string) {
  if (value === null) return '待补充参数'
  const scaled = unit === '%' ? value * 100 : value
  const digits = Math.abs(scaled) >= 100 ? 1 : Math.abs(scaled) < 0.01 ? 4 : 2
  return `${scaled.toFixed(digits)} ${unit}`.trim()
}

export function calculateVfMetrics(scenario: VfScenario): VfMetricResult[] {
  const values = metricMap(scenario.values)
  return vfModel.metrics.map(definition => {
    let value = values[definition.metricCode] ?? null
    const surfaceNotApplicable = definition.metricCode === 'SURFACE_INTENSITY' || definition.metricCode === 'SURFACE_WATER_PER_EVENT'
    const notApplicable = surfaceNotApplicable && scenario.values.surface_wash_flow === null
    if (notApplicable) value = null
    return {
      metricCode: definition.metricCode,
      group: definition.group,
      name: definition.name,
      value,
      display: notApplicable ? '不适用' : format(value, definition.unit),
      unit: definition.unit,
      formula: definition.formula,
      status: notApplicable ? 'NOT_APPLICABLE' : value === null ? 'MISSING_INPUT' : 'VALID',
      benchmark: '候选基准待项目确认 · 仅演示试算'
    }
  })
}

export function mapVfFields(scenario: VfScenario): VfFieldValue[] {
  return vfModel.fields.map(definition => {
    const value = scenario.values[definition.fieldCode] ?? null
    const missing = value === null || value === ''
    const abnormal = scenario.id === 'cell-data-gap' && ['backwash_uniformity', 'media_state'].includes(definition.fieldCode)
    return {
      fieldCode: definition.fieldCode,
      group: definition.group,
      name: definition.name,
      value,
      unit: definition.unit,
      source: definition.source,
      coverage: missing ? 0 : abnormal ? 0.42 : 1,
      reviewState: missing ? 'MISSING' : abnormal ? 'ABNORMAL' : 'VERIFIED',
      estimated: false
    }
  })
}

const stableTriggered = new Set(['VF-CYCLE-01', 'VF-WATER-01', 'VF-ENERGY-01', 'VF-DIST-01'])

function statusFor(ruleCode: string, scenario: VfScenario): { status: UnitEvaluationStatus; suppressedBy?: string } {
  if (scenario.id === 'backwash-data-gap' && ruleCode === 'VF-BW-08') return { status: 'NOT_APPLICABLE' }
  const dataGate = scenario.id === 'backwash-data-gap' ? 'VF-DATA-01' : scenario.id === 'sample-incomparable' ? 'VF-DATA-02' : scenario.id === 'cell-data-gap' ? 'VF-DATA-03' : null
  if (dataGate) {
    if (ruleCode === dataGate) return { status: 'DATA_INSUFFICIENT' }
    const gate = vfModel.rules.find(item => item.ruleCode === dataGate)
    if (gate?.suppresses.includes(ruleCode)) return { status: 'SUPPRESSED', suppressedBy: dataGate }
  }
  if (ruleCode.startsWith('VF-DATA-')) return { status: 'NORMAL' }
  return { status: scenario.id === 'stable-water-saving' && stableTriggered.has(ruleCode) ? 'TRIGGERED' : 'NORMAL' }
}

function evidence(ruleCode: string, scenario: VfScenario, metrics: VfMetricResult[]) {
  const metric = Object.fromEntries(metrics.map(item => [item.metricCode, item.display]))
  const values = scenario.values
  const map: Record<string, string[]> = {
    'VF-DATA-01': [`事件 ${values.backwash_event_id ?? '待补充'}`, `程序版本 ${values.backwash_program_version ?? '缺失'}`, '流量、台数、单一combined_duration、有效面积同事件校验'],
    'VF-DATA-02': ['点位、采样时间、水力时滞、检测方法四项可比性校验', `当前：${values.samples_comparable ? '可比' : '不可比'}`],
    'VF-DATA-03': [`分格覆盖率 ${Math.round(Number(values.per_cell_coverage ?? 0) * 100)}%`, '滤格编码需贯通周期、反洗、水头和浊度数据'],
    'VF-HYD-01': [`正常滤速 ${metric.NORMAL_FILTER_RATE}`, `运行滤格 ${values.running_cell_count}格`],
    'VF-HYD-02': [`反洗期间滤速 ${metric.BACKWASH_FILTER_RATE}`, `同时反洗 ${values.backwashing_cell_count}格`],
    'VF-HEAD-01': [`水头损失增长 ${metric.HEADLOSS_GROWTH}`, `可用水头 ${metric.AVAILABLE_HEAD}`],
    'VF-CYCLE-01': [`过滤周期 ${metric.FILTER_CYCLE}`, `日反洗 ${metric.BACKWASH_EVENTS}`],
    'VF-WATER-01': [`反洗水率 ${metric.BACKWASH_WATER_RATIO}`, `单次反洗水量 ${metric.BACKWASH_WATER_PER_EVENT}`],
    'VF-ENERGY-01': [`反洗泵系统效率 ${metric.PUMP_SYSTEM_EFFICIENCY}`, `泵工况 ${values.pump_actual_flow} m³/h @ ${values.pump_actual_head} m`],
    'VF-ENERGY-02': [`吨水反洗电耗 ${metric.UNIT_BACKWASH_ENERGY}`, `日分项电量 ${metric.TOTAL_BACKWASH_ENERGY}`],
    'VF-EFF-01': [`SS局部去除 ${metric.SS_REMOVAL}`, '仅作滤池前后局部效果'],
    'VF-EFF-02': [`浊度局部去除 ${metric.TURBIDITY_REMOVAL}`, `滤后浊度 ${values.effluent_turbidity} NTU`],
    'VF-EFF-03': [`COD局部观察 ${metric.COD_REMOVAL_OBS}`, `TP局部观察 ${metric.TP_REMOVAL_OBS}`, '不升级为全厂原因或达标判断'],
    'VF-BAL-01': [`分格覆盖率 ${Math.round(Number(values.per_cell_coverage ?? 0) * 100)}%`, '周期离散度依项目确认口径试算'],
    'VF-MEDIA-01': [`滤料现场状态：${values.media_state}`, '无现场证据不下确定结论'],
    'VF-DIST-01': [`反洗均匀性：${values.backwash_uniformity}`, '不直接形成设备维修质量结论']
  }
  return map[ruleCode] ?? [`按 ${ruleCode} 的模型依赖、候选基准和持续条件试算`]
}

export function evaluateVfRules(scenario: VfScenario, metrics: VfMetricResult[]): VfRuleResult[] {
  return vfModel.rules.map(definition => {
    const state = statusFor(definition.ruleCode, scenario)
    const conclusion = state.status === 'DATA_INSUFFICIENT'
      ? `${definition.name}：只输出补数要求，不生成业务偏差或优化方案。`
      : state.status === 'SUPPRESSED' ? `依赖证据不足，已被 ${state.suppressedBy} 抑制，不显示为正常。`
        : state.status === 'NOT_APPLICABLE' ? '当前单体配置不适用本规则。'
          : state.status === 'TRIGGERED' ? `${definition.name}已命中草案试算，需核验原因并完成受控验证。`
            : `${definition.name}未命中，当前保持观察。`
    return {
      ruleCode: definition.ruleCode, group: definition.group, name: definition.name, status: state.status,
      severity: definition.severity, conclusionType: definition.conclusionType as VfRuleResult['conclusionType'], conclusion,
      evidence: evidence(definition.ruleCode, scenario, metrics),
      recommendation: state.status === 'DATA_INSUFFICIENT' ? definition.recommendation : definition.recommendation || '按小步试验核验',
      constraint: definition.constraint, recovery: definition.recovery, boundaryNote: definition.boundary, suppressedBy: state.suppressedBy
    }
  })
}

export function createVfCauses(): VfCauseVerification[] {
  return vfModel.causes.map(item => ({ ...item, state: 'PENDING', note: '' }))
}
