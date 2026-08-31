import type { UnitOptimizationPlan, UnitVerification, VfScenario, VfScenarioId } from './types'

const baseValues: Record<string, string | number | boolean | null> = {
  site_id: 'WX-DEMO-01', unit_id: 'VF-01', analysis_period: '2026-08-01—2026-08-30', model_version: '0.1.0', process_type: 'V_FILTER',
  design_capacity: 60000, design_peak_flow: 3600, filter_group_count: 2, cells_per_group: 6,
  cell_length: 8, cell_width: 3.5, media_depth: 1.2, media_effective_size: 1.05, support_depth: 0.45, support_size: '2—16',
  filter_plate_thickness: 0.12, air_water_chamber_height: 0.9, working_water_depth: 1.8, max_filter_water_depth: 2.3,
  constant_level_setpoint: 1.75, inlet_to_filter_design_head: 2.1, filter_to_outlet_design_head: 1.25,
  design_filter_rate_min: 6, design_filter_rate_max: 8, design_backwash_filter_rate_max: 9.5, design_backwash_interval: 28,
  design_air_intensity_min: 14, design_air_intensity_max: 17, design_combined_water_intensity_min: 3.5,
  design_combined_water_intensity_max: 4.5, design_water_intensity_min: 7, design_water_intensity_max: 9,
  design_surface_intensity_min: 1.8, design_surface_intensity_max: 2.5,
  actual_daily_flow: 55200, peak_hourly_flow: 3280, running_group_count: 2, running_cell_count: 10, backwashing_cell_count: 1,
  filter_cycle_hours: 21.6, backwash_events_daily: 3.2, filter_headloss_start: 0.18, filter_headloss_end: 1.14,
  inlet_well_level: 4.62, filter_operating_level: 3.78, outlet_well_level: 2.92,
  influent_ss: 17.5, effluent_ss: 5.2, influent_turbidity: 4.8, effluent_turbidity: 0.72,
  influent_cod: 31, effluent_cod: 29.6, influent_tp: 0.42, effluent_tp: 0.36,
  air_flow_gas: 25.8, air_pressure_gas: 48, blowers_gas: 1, gas_duration: 3,
  air_flow_combined: 25.2, blowers_combined: 1, combined_duration: 4,
  wash_pump_flow_combined: 390, wash_pumps_combined: 1, wash_pump_flow_water: 760, wash_pumps_water: 1, water_duration: 5,
  surface_wash_flow: 220, surface_duration: 4,
  pump_rated_flow: 800, pump_actual_flow: 760, pump_actual_head: 13.8, pump_actual_current: 92, pump_daily_hours: 0.48,
  blower_actual_flow: 25.5, blower_actual_pressure: 48, blower_actual_current: 128, blower_daily_hours: 0.37,
  pump_daily_energy: 39.6, blower_daily_energy: 34.8, electricity_price: 0.8, treated_water_price: 0.35,
  backwash_uniformity: '总体均匀，3#滤格局部气泡偏少', media_state: '未见泥球，局部厚度待复核', effluent_clarity: '清澈',
  backwash_program_version: 'BW-P03', backwash_event_id: 'BW-20260830-031', backwash_event_complete: true,
  samples_comparable: true, per_cell_coverage: 0.94, cell_data_available: true
}

function scenario(id: VfScenarioId, name: string, summary: string, overrides: Record<string, string | number | boolean | null>): VfScenario {
  return { id, name, summary, updatedAt: '2026-08-31 10:20', values: { ...baseValues, ...overrides } }
}

export const vfScenarios: VfScenario[] = [
  scenario('stable-water-saving', '场景A · 水质稳定但反洗水耗偏高', '滤后SS与浊度稳定，过滤周期偏短、反洗水率及泵系统效率存在试算优化空间。', {}),
  scenario('backwash-data-gap', '场景B · 反洗事件证据不足', '同一反洗事件的流量、台数、时长或程序版本不完整，只输出补数要求。', {
    wash_pump_flow_combined: null, pump_daily_energy: null, backwash_event_complete: false, backwash_program_version: null, surface_wash_flow: null
  }),
  scenario('sample-incomparable', '场景C · 滤前后样本不可比', '点位、时间、水力时滞或检测方法未对齐，局部效果规则暂停。', {
    influent_ss: null, influent_turbidity: null, influent_cod: null, influent_tp: null, samples_comparable: false
  }),
  scenario('cell-data-gap', '场景D · 分格数据不足', '滤格编码未贯通周期、反洗和水头证据，不形成均衡、滤料或配水结论。', {
    per_cell_coverage: 0.42, cell_data_available: false, backwash_uniformity: '无分格记录', media_state: '无分格记录'
  })
]

export const DEFAULT_VF_SCENARIO_ID: VfScenarioId = 'stable-water-saving'

export function createVfPlan(): UnitOptimizationPlan {
  return {
    id: 'VF-PLAN-20260831-01', sourceRuleCode: 'VF-WATER-01', title: '滤后浊度保护下的反洗参数小步优化',
    objective: '在滤后浊度、SS及水头恢复不恶化前提下，验证反洗水率和分项电耗的可降低空间。',
    status: '草稿', estimatedAnnualSaving: 68400, createdAt: '2026-08-31 10:25',
    actions: [
      { id: 'VF-ACT-01', title: '水冲时长小步下调', owner: '工艺主管', currentValue: '5.0 min', targetValue: '4.6 min（演示试算）', step: '单次仅调整0.2 min，完成一个可比周期后再进入下一档。', guard: '滤后浊度、SS、反洗后初始水头和滤料状态。', stopCondition: '滤后浊度连续2点超过项目保护线，或出现跑料/翻砂。', rollbackCondition: '恢复上一稳定程序版本，保留事件快照。', status: '待执行' },
      { id: 'VF-ACT-02', title: '复核泵风机组合与分格均匀性', owner: '运行班长', currentValue: '1泵+1风机', targetValue: '保持反洗强度并减少无效运行', step: '记录同一事件的流量、台数、时长、有效面积和程序版本。', guard: '反洗均匀性、泵风机安全边界和滤层恢复。', stopCondition: '事件证据不完整或设备/安全限制触发。', rollbackCondition: '转设备或安全专业模块，本单体只保留引用。', status: '待执行' }
    ]
  }
}

export function createVfVerification(): UnitVerification {
  return {
    comparable: true,
    checks: [
      { name: '滤前后点位与方法一致', passed: true, note: '点位台账与化验方法版本已对齐' },
      { name: '水力时滞已配对', passed: true, note: '按批准的过滤时滞匹配' },
      { name: '运行滤格和负荷可比', passed: true, note: '滤格组合一致，日均流量差2.6%' },
      { name: '反洗程序版本可追溯', passed: true, note: 'BW-P03 → BW-P03-T1' }
    ],
    before: [
      { name: '反洗水率', value: '3.28%' }, { name: '吨水反洗电耗', value: '0.00135 kWh/m³' },
      { name: '滤后浊度', value: '0.72 NTU' }, { name: '过滤周期', value: '21.6 h' }
    ],
    after: [
      { name: '反洗水率', value: '2.91%' }, { name: '吨水反洗电耗', value: '0.00123 kWh/m³' },
      { name: '滤后浊度', value: '0.74 NTU' }, { name: '过滤周期', value: '23.2 h' }
    ],
    verifiedAnnualSaving: 67100, decision: 'PENDING', note: '演示收益仅在可比性和保护指标通过后可认定；项目基准未确认前不发布生产结论。'
  }
}
