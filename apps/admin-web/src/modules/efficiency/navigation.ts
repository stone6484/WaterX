export const efficiencyUnits = [
  { id: 'highEfficiencySedimentation', name: '高效沉淀池' },
  { id: 'vFilterAnalysis', name: 'V型滤池' },
  { id: 'pretreatmentAnalysis', name: '预处理系统' },
  { id: 'disinfectionAnalysis', name: '消毒系统' },
  { id: 'sludgeBalanceAnalysis', name: '排泥系统' },
  { id: 'dewateringAnalysis', name: '污泥脱水' },
  { id: 'mbbrAnalysis', name: 'MBBR填料区' },
  { id: 'aerationAirAnalysis', name: '曝气供气系统' }
] as const

export const efficiencyTopics = [
  { id: 'efficiencyWaterBalance', name: '水量平衡' },
  { id: 'efficiencySludge', name: '污泥平衡' },
  { id: 'efficiencyEnergy', name: '能效系统' },
  { id: 'efficiencyChemical', name: '药剂与成本' },
  { id: 'efficiencyCapacity', name: '能力与瓶颈' },
  { id: 'efficiencyHydraulic', name: '水力高程' }
] as const

export const efficiencyPlanningPages = {
  efficiencyOverview: {
    title: '提质增效总览',
    purpose: '按单体分析、全厂分析和改进闭环组织入口。',
    scope: ['单体分析与全厂分析入口', '同周期关键指标与待核验事项', '同源任务与效果汇总'],
    limitation: '当前总览提供分类入口；跨模块指标、任务及收益汇总尚未接入，不展示虚构统计。'
  },
  efficiencyWaterBalance: {
    title: '全厂水量平衡',
    purpose: '核对全厂水量去向，区分外部进出水、厂内回水和储量变化。',
    scope: ['外部流入、外出与储量核对', '内部回水单列，避免重复计量', '未解释差额与来源下钻'],
    limitation: '已支持本地日核算和版本保存；需人工确认计量边界、同周期水量和库存，不把未解释差额直接判为漏损。'
  },
  efficiencyEnergy: {
    title: '全厂能耗与运行效率',
    purpose: '核对用电构成，区分处理负荷变化、用电变化和价格影响。',
    scope: ['总表与分表层级，避免重复相加', '吨水电耗、实测与估算分项', '同工况对比与费用因素分析'],
    limitation: '已支持本地日电耗核算和版本保存；分表不足时限制归因，估算不冒充实测收益，尚未接统一效果台账。'
  },
  efficiencySludge: {
    title: '污泥平衡与处理能力',
    purpose: '核对污泥处理线的来源、去向、库存和当前处理能力。',
    scope: ['干固体与湿泥分开', '库存、返流水及独立来源核验', '已确认产率与处理量对照'],
    limitation: '首版本地核算，不预测生化产泥、不改变生产控制；真实后端与统一任务尚未接入。'
  },
  efficiencyTasks: {
    title: '优化任务',
    purpose: '集中查看单体分析和全厂分析形成的同源优化事项。',
    scope: ['一个主问题关联一个主任务', '责任人、保护条件及人工执行记录', '停止、恢复和复核证据'],
    limitation: '统一任务列表尚未接入。现有单体方案仍在原页面中，不会自动复制为新任务；软件记录不代表设备已经执行。'
  },
  efficiencyChemical: { title: '药剂利用与处理成本', purpose: '分药种核算实际用量、有效量及所列成本。', scope: ['实际投加、采购与领用分开'], limitation: '本地核算，不等于完整经营成本或效果归因。' },
  efficiencyCapacity: { title: '系统能力与瓶颈', purpose: '同量纲同流路的当前能力核验。', scope: ['串联阶段、阶段内并联、共享上限'], limitation: '复杂交叉网络需分别建边界，不输出精确全厂扩容量。' },
  efficiencyHydraulic: { title: '水力高程', purpose: '同基准同期水位及水头差参考。', scope: ['自由水面比较、水位约束、可减少扬程试算'], limitation: '跨泵/压力段待专项核验；不把跌水当作实测节能收益。' },
  efficiencyResults: {
    title: '效果台账',
    purpose: '区分预估、观察期结果与年度外推，追溯同一措施的效果。',
    scope: ['前后周期与可比性核验', '保护指标、证据及确认状态', '收益去重，区分实测与年度外推'],
    limitation: '统一效果台账尚未接入。现有单体效果页保留演示状态，不汇总为真实节约收益。'
  }
} as const

export type EfficiencyPlanningPageId = keyof typeof efficiencyPlanningPages
export type EfficiencyPageId = EfficiencyPlanningPageId | typeof efficiencyUnits[number]['id']

export function isEfficiencyPlanningPage(id: string): id is EfficiencyPlanningPageId {
  return Object.prototype.hasOwnProperty.call(efficiencyPlanningPages, id)
}
