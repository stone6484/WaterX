import { qualityMetricRules } from './rules'

export const QUALITY_CALCULATION_VERSION = 'MQ-BUILTIN-0.1'
export type CalculationState = 'CALCULATED' | 'MISSING' | 'INVALID' | 'NA'
export interface QualityCalculation {
  code: string
  state: CalculationState
  actual: string | null
  score: number | null
  inputs: { name:string; value:number; unit:string }[]
  period: string
  source: string
  version: string
  note: string
}

// Counts are reviewed business facts, not concentrations compared to invented limits.
export function complianceRate(passed:number|null, expected:number|null):number|null {
  if(passed===null||expected===null||!Number.isInteger(passed)||!Number.isInteger(expected)||passed<0||expected<=0||passed>expected)return null
  return passed/expected
}
export function dailyComplianceScore(rate:number):number|null {
  if(!Number.isFinite(rate)||rate<0||rate>1)return null
  return 12*Math.max(0,Math.min(1,(rate-.95)/.05))
}
export function controlledHazardsScore(onTime:number|null, controlled:number|null, total:number|null):number|null {
  const a=complianceRate(onTime,total), b=complianceRate(controlled,total)
  return a===null||b===null?null:7*(.6*a+.4*b)
}
export function consumptionPerOutput(consumption:number|null, output:number|null):number|null {
  return consumption===null||output===null||!Number.isFinite(consumption)||!Number.isFinite(output)||consumption<0||output<=0?null:consumption/output
}

export const qualityInputGaps:Record<string,string>={
  'MQ-L01':'缺适用义务逐项权重、履约状态和无证否决核验；97.5%汇总不能反推出原始事实。',
  'MQ-L02':'缺完整且已去重的正式生效监管事件清单及分级映射；0起样例不等于真实台账已核验。',
  'MQ-L03':'缺污泥出厂/最终处置量、危废期初/产生/转移/库存及合规证据；70/30仍待确认。',
  'MQ-S01':'需全因子已核验的合格天数与应评天数；不能用工况目标替代法定限值。',
  'MQ-S02':'缺各污染物有效及超标瞬时记录数；不能从日均值反推。',
  'MQ-S03':'缺同口径完整序列、适用限值、波动定义及分位数算法；场景B指数38却给0分与8×指数/100不一致。',
  'MQ-S04':'缺应处理/实际水量、等效能力损失、故障边界及核心设备完整运行台时。',
  'MQ-A01':'缺已去重事故清单及正式分级；0起固定样例不作为真实安全结论。',
  'MQ-A02':'需重大隐患排查范围、按期复核关闭及当前受控数量；无隐患不得直接满分。',
  'MQ-A03':'缺逐屏障应测/合格次数、风险权重及最高风险集合。',
  'MQ-E01':'缺同边界生产/办公电量与处理水量原始记录、负荷修正及满分/零分阈值。',
  'MQ-E02':'已有8月示例电量/水量，只能核算该月实耗；动态基线模型、完整滚动期与合格产出证据未接入。固定2.4分不能由现有文字规则直接复现。',
  'MQ-E03':'缺同周期输送体积、电量与加权扬程；原文字中的流量/电量时间口径不明确，分扬程评分区间未确认。',
  'MQ-E04':'缺同周期电量、有效池容和运行天数；3 W/m³基线待校核。',
  'MQ-E05':'已有8月示例干泥/电量/PAM商品量，可算两项实耗；缺PAM有效成分、设备路线、分项基线及合格产出核验，不能据商品药耗生成6分总评分。',
  'MQ-E06':'缺同期进出COD/TN、外加COD/TN、投加必要性及TN达标证据。',
  'MQ-E07':'缺有效Al₂O₃质量、实际化学除磷量、适用基线及最终出水合格证据。',
  'MQ-E08':'缺同周期有效氯/紫外电量、水量及消毒效果；双路线权重尚未确认。'
}

// These inputs are transcribed ONLY from the existing fixed scenario's facts.
// Do not treat this adapter as a connection to lab, safety or operating databases.
export function calculateQualitySample(code:string, scenarioId:string):QualityCalculation {
  const result:QualityCalculation={code,state:'MISSING',actual:null,score:null,inputs:[],period:'待补同周期输入',source:'固定场景资料，非项目实测接口',version:QUALITY_CALCULATION_VERSION,note:qualityInputGaps[code]||'未登记规则'}
  if(scenarioId!=='stable_economy_gap')return result
  if(code==='MQ-S01'){
    result.inputs=[{name:'全部适用因子合格日',value:365,unit:'天'},{name:'应评价有效日',value:365,unit:'天'}]
    const rate=complianceRate(365,365)!
    Object.assign(result,{state:'CALCULATED',actual:`${rate*100}%`,score:dailyComplianceScore(rate),period:'2025-09—2026-08（样例滚动12个月）',note:'按既有365/365场景汇总执行讨论稿曲线；未接入法定限值与逐日证据，不是正式评价。'})
  }else if(code==='MQ-A02'){
    result.inputs=[{name:'重大隐患',value:2,unit:'项'},{name:'按期复核关闭',value:2,unit:'项'},{name:'当前受控',value:2,unit:'项'}]
    Object.assign(result,{state:'CALCULATED',actual:'100%',score:controlledHazardsScore(2,2,2),period:'样例评价期',note:'按既有“两项均按期复核关闭”样例计算；未接入真实隐患台账，不将空台账算满分。'})
  }else if(code==='MQ-E02'){
    result.inputs=[{name:'曝气电量',value:391480,unit:'kWh'},{name:'同月处理水量',value:2050000,unit:'m³'}]
    Object.assign(result,{state:'CALCULATED',actual:`${consumptionPerOutput(391480,2050000)!.toFixed(4)} kWh/m³`,period:'2026-08（月度样例，不代表滚动12个月）'})
  }else if(code==='MQ-E05'){
    result.inputs=[{name:'产干泥',value:412,unit:'tDS'},{name:'脱水电量',value:37904,unit:'kWh'},{name:'PAM商品用量',value:3.58,unit:'t'}]
    Object.assign(result,{state:'CALCULATED',actual:`电耗${consumptionPerOutput(37904,412)} kWh/tDS；商品PAM ${consumptionPerOutput(3.58*1000,412)!.toFixed(2)} kg/tDS`,period:'2026-08（月度样例，不代表滚动12个月）'})
  }
  return result
}

export function qualityCalculationCatalog(){return qualityMetricRules.map(rule=>({code:rule.code,name:rule.name,unit:rule.unit,formula:rule.formula,period:rule.period,version:QUALITY_CALCULATION_VERSION,scoring:'讨论稿，非正式制度',missing:qualityInputGaps[rule.code]}))}
