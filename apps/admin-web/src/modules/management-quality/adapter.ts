import { dataStatusMeta, qualityDimensions, qualityMetricRules } from './rules'
import { qualityScenarios } from './demo-data'
import type { QualityDataStatus, QualityDimensionView, QualityScenarioView } from './types'

const unavailableStatuses: QualityDataStatus[] = ['insufficient_data','data_abnormal','calculation_invalid']

function round(value:number, digits = 1) {
  const base = 10 ** digits
  return Math.round(value * base) / base
}

export function getQualityScenarioView(scenarioId:string): QualityScenarioView {
  const scenario = qualityScenarios.find(item=>item.id===scenarioId) ?? qualityScenarios[0]
  const samples = new Map(scenario.metrics.map(item=>[item.code,item]))
  const metrics = qualityMetricRules.map(rule=>{
    const sample = samples.get(rule.code)
    if (!sample) throw new Error(`管理质量样例数据缺失：${rule.code}`)
    const dimension = qualityDimensions.find(item=>item.id===rule.dimension)
    return {
      ...rule,
      ...sample,
      dimensionName:dimension?.name ?? rule.dimension,
      scoreText:sample.score===null ? '暂不出分' : `${round(sample.score)}/${rule.maxScore}`
    }
  })

  const dimensions: QualityDimensionView[] = qualityDimensions.map(dimension=>{
    const items = metrics.filter(metric=>metric.dimension===dimension.id)
    const hasUnavailable = items.some(metric=>unavailableStatuses.includes(metric.status))
    const applicable = items.filter(metric=>metric.status!=='process_not_applicable' && metric.score!==null)
    const applicableWeight = applicable.reduce((sum,item)=>sum+item.maxScore,0)
    const applicableScore = applicable.reduce((sum,item)=>sum+(item.score ?? 0),0)
    const score = hasUnavailable || !applicableWeight
      ? null
      : round(dimension.maxScore * applicableScore / applicableWeight)
    return {
      ...dimension,
      score,
      metricCount:items.length,
      availableCount:items.filter(item=>!unavailableStatuses.includes(item.status)).length,
      attentionCount:items.filter(item=>item.riskLevel==='attention' || item.riskLevel==='risk').length
    }
  })

  const hasUnavailable = metrics.some(metric=>unavailableStatuses.includes(metric.status))
  const availableScore = round(metrics.reduce((sum,item)=>sum+(item.score ?? 0),0))
  const totalScore = hasUnavailable ? null : round(dimensions.reduce((sum,item)=>sum+(item.score ?? 0),0))
  const coverageCount = metrics.filter(metric=>!unavailableStatuses.includes(metric.status)).length
  const statusCounts = Object.fromEntries(
    Object.keys(dataStatusMeta).map(status=>[status,metrics.filter(metric=>metric.status===status).length])
  ) as Record<QualityDataStatus,number>
  const mainLosses = metrics
    .filter(metric=>metric.score!==null && metric.maxScore-(metric.score ?? 0)>0)
    .sort((a,b)=>(b.maxScore-(b.score ?? 0))-(a.maxScore-(a.score ?? 0)))
    .slice(0,5)

  const trendSummary = scenario.id==='stable_economy_gap'
    ? '稳定达标与安全维度保持高位，经济高效近6个月下降，主要受曝气和污泥脱水影响。'
    : scenario.id==='low_cost_compliance_risk'
      ? '经济指标改善，但稳定达标维度连续回落；需优先恢复合格产出裕度。'
      : '当前存在缺失、异常和无效数据，标准总分暂不发布；先完成数据核查。'

  return {
    scenario,
    metrics,
    dimensions,
    totalScore,
    availableScore,
    coverageCount,
    coverageRate:round(coverageCount / metrics.length * 100,0),
    statusCounts,
    mainLosses,
    trendSummary
  }
}
