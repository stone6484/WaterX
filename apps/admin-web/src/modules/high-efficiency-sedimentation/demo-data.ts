import type { HscOptimizationPlan, HscScenario, HscScenarioId, HscVerification } from './types'

const baseValues: Record<string, string | number | boolean | null> = {
  site_id: 'WX-DEMO-01',
  unit_id: 'HSC-01',
  analysis_period: '2026-08-01—2026-08-30',
  model_version: '0.1.0',
  process_type: '常规高效沉淀池',
  design_capacity: 60000,
  design_peak_flow: 3500,
  mix_group_count: 2,
  floc_group_count: 2,
  settle_group_count: 2,
  mix_volume: 80,
  floc_volume: 1200,
  settle_volume: 6000,
  settle_area: 320,
  lamella_angle: 60,
  lamella_length: 1,
  design_surface_load_min: 6,
  design_surface_load_max: 9,
  mixer_rated_power: 18.5,
  mixer_rated_speed: 100,
  floc_rated_power: 7.5,
  floc_rated_speed: 30,
  return_pump_rated_flow: 150,
  waste_pump_rated_flow: 30,
  coagulant_name: '聚合氯化铝（PAC）',
  coagulant_active_component: 'Al₂O₃',
  coagulant_active_content: 10,
  coagulant_density: 1.2,
  coagulant_price: 1800,
  flocculant_name: '阴离子PAM',
  flocculant_price: 22000,
  actual_daily_flow: 56800,
  peak_hourly_flow: 3200,
  running_settle_groups: 2,
  influent_cod: 38,
  effluent_cod: 32,
  influent_ss: 45,
  effluent_ss: 8,
  influent_tp: 1.08,
  effluent_tp: 0.18,
  influent_ortho_p: 0.72,
  effluent_ortho_p: 0.08,
  coagulant_daily_mass: 1465.44,
  flocculant_daily_mass: 10.224,
  mixer_actual_speed: 65,
  mixer_actual_power: 14,
  floc_actual_speed: 18,
  floc_actual_power: 5,
  sludge_level: 0.82,
  return_sludge_flow: 100,
  return_sludge_hours: 24,
  return_sludge_concentration: 25000,
  waste_sludge_flow: 20,
  waste_sludge_hours: 2,
  waste_sludge_concentration: 18000,
  unit_energy: 1700,
  electricity_price: 0.8,
  floc_state: '矾花偏小，沉降速度一般',
  lamella_state: '局部存在轻度堵塞',
  effluent_clarity: '轻微浑浊但稳定达标'
}

function scenario(id: HscScenarioId, name: string, summary: string, overrides: Record<string, string | number | boolean | null>): HscScenario {
  return {
    id,
    name,
    summary,
    updatedAt: '2026-08-30 16:20',
    values: { ...baseValues, ...overrides }
  }
}

export const hscScenarios: HscScenario[] = [
  scenario('stable-cost', '场景A · 稳定出水但药耗偏高', '水力与出水总体稳定，混凝剂单耗高于示范目标，具备小步优化空间。', {}),
  scenario('chemical-data-gap', '场景B · 药剂证据不足', '有效成分与投加计量证据缺失，只能提出补数要求，药剂业务偏差被抑制。', {
    coagulant_active_component: null,
    coagulant_active_content: null,
    coagulant_daily_mass: null
  }),
  scenario('sample-incomparable', '场景C · 进出水数据不可比', '采样点与水力停留时间未对齐，只能修正采样和统计口径，暂停效果诊断。', {
    influent_ss: null,
    influent_tp: null,
    effluent_clarity: '采样时段与进水不对应'
  })
]

export const DEFAULT_HSC_SCENARIO_ID: HscScenarioId = 'stable-cost'

export function createDemoPlan(): HscOptimizationPlan {
  return {
    id: 'HSC-PLAN-20260830-01',
    sourceRuleCode: 'HSC-CHEM-04',
    title: '稳定出水约束下的PAC小步减量验证',
    objective: '不改变全厂达标责任边界，在高效沉淀池单体内验证混凝剂单耗由25.8 mg/L降至23.2 mg/L。',
    status: '草稿',
    estimatedAnnualSaving: 97024,
    createdAt: '2026-08-30 16:25',
    actions: [
      {
        id: 'ACT-01',
        title: 'PAC设定值分级下调',
        owner: '工艺主管',
        currentValue: '25.8 mg/L',
        targetValue: '23.2 mg/L',
        step: '每个HRT下调0.8—1.0 mg/L，稳定后再进入下一档。',
        guard: '单体出水SS≤10 mg/L、TP≤0.20 mg/L，矾花和出水外观无恶化。',
        stopCondition: '任一守护指标连续2次超出单体约束或出现明显跑矾。',
        rollbackCondition: '立即恢复上一稳定投加档，并保留当班记录与化验事实。',
        status: '待执行'
      },
      {
        id: 'ACT-02',
        title: '同步核验斜管和排泥状态',
        owner: '运行班长',
        currentValue: '局部轻度堵塞 / 泥位0.82 m',
        targetValue: '完成现场核验并保持泥位受控',
        step: '每班记录斜管表面、泥位、排泥时长和出水外观。',
        guard: '不形成设备维修质量、安全评价或全厂水质结论。',
        stopCondition: '发现设备故障或安全限制时，转专业模块处理并暂停试验。',
        rollbackCondition: '恢复原运行参数，关闭本单体验证动作。',
        status: '待执行'
      }
    ]
  }
}

export function createDemoVerification(): HscVerification {
  return {
    comparable: true,
    checks: [
      { name: '进出水采样点一致', passed: true, note: '同一单体固定采样点' },
      { name: '水力停留时间对齐', passed: true, note: '按2个HRT滚动比对' },
      { name: '处理水量差异可控', passed: true, note: '前后日均水量偏差2.8%' },
      { name: '外部工况无重大变化', passed: true, note: '未发生全厂工艺切换' }
    ],
    before: [
      { name: 'PAC商品单耗', value: '25.8 mg/L' },
      { name: '单体出水SS', value: '8.0 mg/L' },
      { name: '单体出水TP', value: '0.18 mg/L' },
      { name: '总吨水运行成本', value: '0.0743 元/m³' }
    ],
    after: [
      { name: 'PAC商品单耗', value: '23.2 mg/L' },
      { name: '单体出水SS', value: '8.4 mg/L' },
      { name: '单体出水TP', value: '0.19 mg/L' },
      { name: '总吨水运行成本', value: '0.0696 元/m³' }
    ],
    verifiedAnnualSaving: 96900,
    decision: 'PENDING',
    note: '示范值仅用于验证产品闭环；正式结论需满足项目确认的可比性窗口。'
  }
}
