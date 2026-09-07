import { emptyDraft, newFact, type Fact, type TopicDefinition } from './types'
export const waterDefinition: TopicDefinition = {
  name: '水量平衡', shortName: '水量平衡', scope: '全厂外部边界；厂内回水单列。以人工日累计为主，结果不是漏损判定。',
  roles: { IN: '外部流入', OUT: '外部流出', STOCK: '边界内库存', INTERNAL: '内部回水' },
  methods: { DIRECT: '直接期间量', METER: '累计读数差' }, units: ['m³'],
  fields: [{ key: 'value', label: '期间体积', unit: 'm³' }, { key: 'start', label: '期初读数 / 库存', unit: 'm³' }, { key: 'end', label: '期末读数 / 库存', unit: 'm³' }, { key: 'multiplier', label: '已确认倍率' }],
  parameters: [{ key: 'limit', label: '绝对差额阈值', unit: 'm³' }, { key: 'targetSource', label: '阈值依据 / 工况版本' }],
  checks: [{ key: 'target', label: '已确认阈值及其适用周期（不勾选则待配置）' }]
}
export const energyDefinition: TopicDefinition = {
  name: '能效系统', shortName: '能效系统', scope: '首期电能日核算；分开总表、互斥实测分项、估算和未知。费用分解不等于节约收益。',
  roles: { MAIN: '全厂消耗总表', PART: '互斥分项电表', WATER: '处理水量' }, methods: { DIRECT: '直接期间量', METER: '累计读数差' }, units: ['kWh', 'm³'],
  fields: [{ key: 'value', label: '期间量（选定单位）' }, { key: 'start', label: '初读数' }, { key: 'end', label: '末读数' }, { key: 'multiplier', label: '已确认倍率' }],
  parameters: [{ key: 'limit', label: '单位处理量电耗上限', unit: 'kWh/m³' }, { key: 'targetSource', label: '目标工况 / 版本依据' }, { key: 'price', label: '本日已确认均价', unit: '元/kWh' }, { key: 'previousEnergy', label: '对照日电量', unit: 'kWh' }, { key: 'previousPrice', label: '对照日均价', unit: '元/kWh' }, { key: 'costSource', label: '本期/对照期日期及费用凭据' }],
  checks: [{ key: 'target', label: '已确认同工况目标及适用周期' }, { key: 'price', label: '已核对两期电量费用口径和均价依据（不含固定费）' }]
}
export const sludgeDefinition: TopicDefinition = {
  name: '污泥平衡与处理能力', shortName: '污泥平衡', scope: '以污泥处理线为边界，分清干固体、湿泥、库存与返流。不生成生化排泥指令。',
  roles: { IN: '来泥', ADDED: '外加固体贡献', OUT: '外运 / 其他外出', RETURN: '返回水线', INTERNAL: '内部转移（不汇总）', STOCK: '库存', TRANSFORM: '净生成 / 消耗' },
  methods: { DIRECT: '独立干固体量', LIQUID: '液体体积×固体浓度', WET: '湿质量×含固率' }, units: ['t干固体', 'mg/L', 'kg/m³', 't湿泥'],
  fields: [{ key: 'value', label: '干固体t / 液体体积m³ / 湿质量t（按方式）' }, { key: 'concentration', label: '固体浓度（使用选定单位）' }, { key: 'moisture', label: '含水率', unit: '%' }, { key: 'start', label: '期初库存', unit: 't干固体' }, { key: 'end', label: '期末库存', unit: 't干固体' }, { key: 'pollutant', label: '同日返流氨氮', unit: 'mg/L' }],
  parameters: [{ key: 'limit', label: '绝对固体差额阈值', unit: 't干固体' }, { key: 'targetSource', label: '阈值及固体口径依据' }, { key: 'rate', label: '已核验当前进料产率', unit: 't干固体/h' }, { key: 'hours', label: '可用运行时间', unit: 'h/d' }, { key: 'demand', label: '待处理进料', unit: 't干固体/d' }, { key: 'capacitySource', label: '在线组合 / 共享限制 / 产率依据' }, { key: 'batchDS', label: '批次模式每批进料', unit: 't干固体/批' }, { key: 'cycle', label: '完整批次周期', unit: 'h/批' }, { key: 'processedDS', label: '本设备实际处理进料', unit: 't干固体' }, { key: 'energy', label: '本设备同期电量', unit: 'kWh' }, { key: 'actualDrug', label: '单一药种实际投加', unit: 'kg商品' }, { key: 'electricityFee', label: '所列实际电费', unit: '元' }, { key: 'drugFee', label: '所列实际药费', unit: '元' }, { key: 'transportFee', label: '所列运处合价', unit: '元' }, { key: 'resourceSource', label: '单一药种/同设备/计费基础及凭据' }, { key: 'remaining', label: '同形态可用储量余量', unit: 't干固体' }, { key: 'accumulation', label: '已核验净积存速率', unit: 't干固体/d' }],
  checks: [{ key: 'target', label: '已确认差额阈值及适用周期' }, { key: 'solids', label: '已核验固体检测口径可比（SS/TS/含固率差异已有依据）' }, { key: 'independent', label: '输出、库存有独立观测证据，不用输入推算结果自证闭合' }, { key: 'capacity', label: '产率及需求均为相同进料干固体口径，已扣共享限制' }, { key: 'stable', label: '储存余量与积存速率同形态且稳定，仅作情景估算' }, { key: 'batch', label: '采用批次能力模式（否则为连续产率模式）' }, { key: 'resources', label: '已核验同设备进料、电量、单一药种实际投加口径' }, { key: 'costs', label: '已核验所列电/药/运处费用互斥，合价未重复计入分价' }]
}
export const chemicalDefinition: TopicDefinition = {
  name: '药剂利用与处理成本', shortName: '药剂与成本', scope: '实际投加与采购/领用分开；不同药种有效量不相加，成本只汇总所列互斥项目。',
  roles: { DOSING: '实际投加（非碳源）', CARBON: '碳源实际投加', PURCHASE: '采购（仅参考）', ISSUED: '领用（仅参考）', WATER: '同期处理水量', COST: '其他实际运行费用' },
  methods: { DIRECT: '直接质量 / 水量 / 费用', VOLUME: '液体体积转换商品质量' }, units: ['kg商品', 'L', 'm³', '元'],
  fields: [{ key: 'value', label: '实际数量（选定单位）' }, { key: 'density', label: '同批液体密度', unit: 'kg/L' }, { key: 'active', label: '有效成分质量分数', unit: '%' }, { key: 'equivalence', label: '实测可利用当量', unit: 'kg有效当量/kg商品' }, { key: 'price', label: '同期商品单价', unit: '元/kg商品' }], parameters: [], checks: []
}
export const capacityDefinition: TopicDefinition = {
  name: '系统能力与瓶颈', shortName: '能力与瓶颈', scope: '每个分析边界是一条串联流路；同阶段并联实例相加，并核对共享上限。不同量纲分开计算。',
  roles: { STAGE: '在线工段 / 设备实例' }, methods: { DIRECT: '经确认的当前有效能力' }, units: ['m³/h', 'kg/d', 't干固体/d'],
  fields: [{ key: 'value', label: '当前有效能力（选定单位）' }, { key: 'substance', label: '质量负荷口径（kg/d填同一污染物，如COD；t干固体/d填进料或出料）' }, { key: 'sharedLimit', label: '该并联阶段共享上限（同单位；无则留空并在依据中确认）' }],
  parameters: [{ key: 'stages', label: '完整串联阶段名（逗号分隔，须与点位的“阶段名”一致）' }, { key: 'actual-m³/h', label: '同流路实际水力负荷', unit: 'm³/h' }, { key: 'actual-kg/d', label: '同流路同污染物负荷', unit: 'kg/d' }, { key: 'actual-t干固体/d', label: '同流路固体负荷', unit: 't干固体/d' }],
  checks: [{ key: 'capacity', label: '已核对同工况、串并联关系、在线状态及共享限制，全部关键阶段均已列入' }]
}
export const hydraulicDefinition: TopicDefinition = {
  name: '水力高程', shortName: '水力高程', scope: '同基准、同一测量时段的水位比较；自由水面与跨泵/压力段分开。水头差不是全部可消除损失。',
  roles: { SEGMENT: '测量水力段' }, methods: { FREE: '两端自由水面', PUMP: '跨泵段（专项待核验）', PRESSURE: '压力段（专项待核验）', UNKNOWN: '测点性质待确认' }, units: ['m'],
  fields: [{ key: 'start', label: '上游实测水面高程', unit: 'm' }, { key: 'end', label: '下游实测水面高程', unit: 'm' }, { key: 'flow', label: '同一时段实测流量', unit: 'm³/h' }, { key: 'time', label: '同时测量时间 / 阀位 / 尾水说明' }, { key: 'design', label: '同基准上游设计水位', unit: 'm' }, { key: 'maxLevel', label: '适用上游允许最高水位', unit: 'm' }],
  parameters: [{ key: 'datum', label: '高程基准与校测依据' }, { key: 'dh', label: '经确认可减少扬程', unit: 'm' }, { key: 'volume', label: '对应试算过水量', unit: 'm³' }, { key: 'rho', label: '适用水密度', unit: 'kg/m³' }, { key: 'g', label: '适用重力加速度', unit: 'm/s²' }, { key: 'efficiency', label: '适用机泵总效率', unit: '0—1比例' }, { key: 'energySource', label: '可减少扬程/效率/参数依据' }],
  checks: [{ key: 'datum', label: '已核对同一高程基准及测点含义' }, { key: 'simultaneous', label: '已确认水位与流量同期测量' }, { key: 'velocity', label: '自由水面两端大气压，速度水头差可忽略' }, { key: 'level', label: '最高水位约束已按项目资料确认' }, { key: 'reducible', label: '可减少扬程及保护条件已有依据；试算不代表实测节电' }]
}
export type ImplementedTopic = 'water' | 'sludge' | 'energy' | 'chemical' | 'capacity' | 'hydraulic'
export const definitions = { water: waterDefinition, sludge: sludgeDefinition, energy: energyDefinition, chemical: chemicalDefinition, capacity: capacityDefinition, hydraulic: hydraulicDefinition }
export function fieldsFor(topic: ImplementedTopic, f: Fact) {
  return definitions[topic].fields.filter(field => {
    if (topic === 'capacity' || topic === 'hydraulic') return true
    if (topic === 'chemical') return field.key === 'value' || !['WATER', 'COST'].includes(f.role) && (field.key === 'price' || field.key === 'density' && f.method === 'VOLUME' || field.key === 'equivalence' && f.role === 'CARBON' || field.key === 'active' && f.role !== 'CARBON')
    if (f.role === 'STOCK') return ['start', 'end'].includes(field.key)
    if (topic === 'sludge') return field.key === 'value' || f.method === 'LIQUID' && (field.key === 'concentration' || f.role === 'RETURN' && field.key === 'pollutant') || f.method === 'WET' && field.key === 'moisture'
    return f.method === 'DIRECT' ? field.key === 'value' : field.key !== 'value'
  })
}
export function demoDraft(topic: ImplementedTopic) {
  const d = emptyDraft(topic); d.boundary = `演示${definitions[topic].shortName}边界`; d.basis = '固定独立算例，非生产数据'; d.complete = true; d.demo = true
  const f = (name: string, role: string, value: string, unit: string, extra: Partial<Fact> = {}): Fact => ({ ...newFact(d.date, role, unit), name, path: name, source: '固定独立算例', values: { value }, ...extra })
  if (topic === 'water') d.facts = [f('外来水', 'IN', '10000', 'm³'), f('厂外出水', 'OUT', '9700', 'm³'), f('反洗回水', 'INTERNAL', '800', 'm³'), f('储水池', 'STOCK', '', 'm³', { values: { start: '1000', end: '1200' } })]
  if (topic === 'energy') {
    const main = f('全厂消耗总表', 'MAIN', '1000', 'kWh'); d.facts = [main, f('提升用电', 'PART', '400', 'kWh', { parent: main.id }), f('曝气用电', 'PART', '300', 'kWh', { parent: main.id }), f('全厂处理量', 'WATER', '5000', 'm³')]
  }
  if (topic === 'sludge') {
    d.checks.solids = d.checks.independent = true
    d.facts = [f('污泥线来泥', 'IN', '1000', 'kg/m³', { method: 'LIQUID', values: { value: '1000', concentration: '10' } }), f('核验外加固体', 'ADDED', '0.5', 't干固体'), f('外运车次1', 'OUT', '45', 't湿泥', { method: 'WET', values: { value: '45', moisture: '80' } }), f('脱水返流水', 'RETURN', '200', 'mg/L', { method: 'LIQUID', values: { value: '200', concentration: '1000', pollutant: '100' } }), f('储泥及料仓', 'STOCK', '', 't干固体', { values: { start: '2', end: '3' } }), f('经核验无净转化', 'TRANSFORM', '0', 't干固体')]
  }
  if (topic === 'chemical') d.facts = [f('次氯酸钠实际投加', 'DOSING', '1000', 'kg商品', { values: { value: '1000', active: '10', price: '1' } }), f('同日处理量', 'WATER', '10000', 'm³')]
  if (topic === 'capacity') {
    d.checks.capacity = true; d.parameters = { stages: '提升,过滤,出水', 'actual-m³/h': '900' }
    d.facts = [f('提升在线组合', 'STAGE', '1200', 'm³/h', { path: '提升' }), f('过滤在线组合', 'STAGE', '1000', 'm³/h', { path: '过滤' }), f('出水在线组合', 'STAGE', '1100', 'm³/h', { path: '出水' })]
  }
  if (topic === 'hydraulic') {
    d.checks.datum = d.checks.simultaneous = d.checks.velocity = true; d.parameters.datum = '固定算例：同一假定基准'
    d.facts = [f('自由水面段', 'SEGMENT', '', 'm', { method: 'FREE', values: { start: '10.8', end: '10.2', flow: '900', time: '同日10:00，构造算例', design: '10.7' } })]
  }
  return d
}
