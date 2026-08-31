export type RemainingUnitCode = 'PRE' | 'DIS' | 'SLG' | 'DWT' | 'MBBR' | 'AIR'

export type RemainingUnitPageId =
  | 'pretreatmentAnalysis'
  | 'disinfectionAnalysis'
  | 'sludgeBalanceAnalysis'
  | 'dewateringAnalysis'
  | 'mbbrAnalysis'
  | 'aerationAirAnalysis'

export interface RemainingUnitDefinition {
  code: RemainingUnitCode
  pageId: RemainingUnitPageId
  name: string
  shortName: string
  objectName: string
  positioning: string
  normalScenario: string
  dataGapScenario: string
  variantScenario: string
  defaultOwner: string
  annualSaving: number
}

export const remainingUnitDefinitions: RemainingUnitDefinition[] = [
  {
    code: 'PRE', pageId: 'pretreatmentAnalysis', name: '预处理分析', shortName: '预处理', objectName: '1#预处理系统',
    positioning: '聚焦格栅、提升泵、沉砂、可选初沉和局部计量，不延伸为管网或全厂水量平衡结论。',
    normalScenario: '场景A · 运行稳定但提升与格栅存在优化空间', dataGapScenario: '场景B · 预处理关键证据不足', variantScenario: '场景C · 可选初沉当前不适用',
    defaultOwner: '运行主管', annualSaving: 72800
  },
  {
    code: 'DIS', pageId: 'disinfectionAnalysis', name: '消毒分析', shortName: '消毒', objectName: '1#次氯酸钠消毒系统',
    positioning: '围绕接触条件、有效氯、余氯、微生物效果和成本形成闭环，不替代全厂出水合规判断。',
    normalScenario: '场景A · 消毒效果稳定但药剂效率偏差', dataGapScenario: '场景B · 药剂计量证据不足', variantScenario: '场景C · 预留消毒方式不适用',
    defaultOwner: '工艺主管', annualSaving: 51600
  },
  {
    code: 'SLG', pageId: 'sludgeBalanceAnalysis', name: '排泥与污泥浓缩分析', shortName: '排泥浓缩', objectName: '污泥归集与浓缩链',
    positioning: '负责多源排泥干固体归集、浓缩、回流和库存，不重复判断各源单体的产泥原因。',
    normalScenario: '场景A · 泥量基本闭合但回流负荷偏高', dataGapScenario: '场景B · 源端排泥证据不足', variantScenario: '场景C · 序批浓缩规则不适用',
    defaultOwner: '污泥主管', annualSaving: 89400
  },
  {
    code: 'DWT', pageId: 'dewateringAnalysis', name: '污泥脱水分析', shortName: '污泥脱水', objectName: '1#污泥脱水系统',
    positioning: '统一支持板框、带式和离心机型，聚焦泥饼、滤液、药耗、能耗与运行成本。',
    normalScenario: '场景A · 泥饼稳定但药耗与电耗偏高', dataGapScenario: '场景B · 进泥泥饼滤液证据不足', variantScenario: '场景C · 非当前机型规则不适用',
    defaultOwner: '污泥主管', annualSaving: 112600
  },
  {
    code: 'MBBR', pageId: 'mbbrAnalysis', name: 'MBBR填料区分析', shortName: 'MBBR填料区', objectName: '1#MBBR填料区',
    positioning: '只分析填料区水力、流化、挂膜、拦截和局部效果，整体生化机理继续引用专业诊断。',
    normalScenario: '场景A · 整体目标受控但流化均匀性偏差', dataGapScenario: '场景B · 填料配置与盘点证据不足', variantScenario: '场景C · IFAS专属规则不适用',
    defaultOwner: '工艺主管', annualSaving: 63800
  },
  {
    code: 'AIR', pageId: 'aerationAirAnalysis', name: '曝气供气系统分析', shortName: '曝气供气', objectName: '1#曝气供气系统',
    positioning: '分析风机、压力链、曝气器、分区配气和清洗收益，只执行整体工艺下发的目标。',
    normalScenario: '场景A · DO目标受控但供气阻力与能效偏差', dataGapScenario: '场景B · 风量压力功率同期证据不足', variantScenario: '场景C · 非配置供气方式不适用',
    defaultOwner: '能源主管', annualSaving: 146000
  }
]

export const remainingUnitPageMap = Object.fromEntries(
  remainingUnitDefinitions.map(item => [item.pageId, item.code])
) as Record<RemainingUnitPageId, RemainingUnitCode>

export function getRemainingUnitDefinition(code: RemainingUnitCode) {
  const definition = remainingUnitDefinitions.find(item => item.code === code)
  if (!definition) throw new Error(`UNIT_DEFINITION_NOT_FOUND: ${code}`)
  return definition
}

export function isRemainingUnitPageId(value: string): value is RemainingUnitPageId {
  return value in remainingUnitPageMap
}
