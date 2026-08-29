import type { QualityMetricSample, QualityScenario, QualitySourceFact } from './types'

const trendLabels = ['3月','4月','5月','6月','7月','8月']

function fact(id:string, module:string, title:string, recordNo:string, recordedAt:string, owner:string, detail:string): QualitySourceFact {
  return { id, module, title, recordNo, recordedAt, owner, detail }
}

function metric(
  code:string,
  actual:string,
  baseline:string,
  deviation:string,
  score:number | null,
  status:QualityMetricSample['status'],
  riskLevel:QualityMetricSample['riskLevel'],
  statusNote:string,
  interpretation:string,
  trend:number[],
  facts:QualitySourceFact[] = []
): QualityMetricSample {
  return { code, actual, baseline, deviation, score, status, riskLevel, statusNote, interpretation, trend, trendLabels, facts }
}

const stableEconomyGapMetrics: QualityMetricSample[] = [
  metric('MQ-L01','97.5%','100%适用义务履约','-2.5%',7.8,'normal_applicable','normal','1项执行报告延期后补报，证据已复核。','总体履约稳定，失分来自一次无监管后果的延期补报，建议持续核对许可义务日历。',[7.6,7.8,7.8,8,7.8,7.8]),
  metric('MQ-L02','0起','无正式监管事件','0起',6,'actual_zero','normal','经核验，评价期真实监管事件为0。','未发生已生效的正式环境监管事件；这里的“0”是实际业务值，得分为满分。',[6,6,6,6,6,6]),
  metric('MQ-L03','100%','全过程闭环100%','0%',6,'normal_applicable','normal','污泥与危废去向、数量和凭证闭环。','所有出厂污泥和适用危废均有合格接收、处置及联单证据。',[5.7,5.8,6,6,6,6]),
  metric('MQ-S01','100%','100%全因子日均达标','0%',12,'normal_applicable','normal','滚动12个月365个有效日全部达标。','日尺度稳定达标，但仍需结合水质裕度判断是否贴线运行。',[11.5,11.7,12,12,12,12]),
  metric('MQ-S02','98.6%','瞬时综合指数100%','-1.4%',4.9,'normal_applicable','normal','有效瞬时记录覆盖完整，少量短时波动未影响日均结果。','瞬时结果整体稳定，最低单项为总磷97.8%，建议继续观察雨季冲击。',[4.7,4.8,4.8,4.9,4.8,4.9]),
  metric('MQ-S03','93.8','稳定裕度指数100','-6.2',7.5,'normal_applicable','normal','核心污染物P95占用率均处于可控区间。','水质仍有充分裕度，总磷P95占用率最高，是当前稳定性优先关注因子。',[7.1,7.3,7.2,7.4,7.6,7.5],[fact('LAB-202608-TP','化验管理','出水总磷月度统计','LAB-M-202608-04','2026-08-27','化验负责人','有效样本31组；P50 0.22 mg/L，P95 0.31 mg/L，适用限值0.50 mg/L。')]),
  metric('MQ-S04','90.0','综合保障指数100','-10.0',4.5,'normal_applicable','attention','2#鼓风机故障造成3.2小时等效能力损失。','来水全部有效处理，但核心设备短时故障拉低可靠性子项。',[4.8,4.7,4.6,4.8,4.5,4.5],[fact('EQ-FAULT-260821','设备管理','2#鼓风机轴承温度高停机','EQ-F-20260821','2026-08-21','设备主管','故障停机3.2小时，备用机自动切换，未造成出水超标；已完成轴承检查。')]),
  metric('MQ-A01','0起','无生产安全事故','0起',8,'actual_zero','normal','评价期真实事故数为0。','未发生纳入统计的生产安全事故；未遂事件主动报告不在本项扣分。',[8,8,8,8,8,8]),
  metric('MQ-A02','100%','闭环受控率100%','0%',7,'normal_applicable','normal','2项重大隐患均按期复核关闭。','重大隐患没有持续暴露，排查任务和复核证据完整。',[6.5,6.7,7,7,7,7]),
  metric('MQ-A03','94.0%','屏障有效率100%','-6.0%',4.7,'normal_applicable','attention','1项硫化氢探头功能测试首次不合格，已恢复。','关键屏障总体有效，首次测试失败暴露了校准周期需要优化。',[4.8,4.8,4.6,4.7,4.9,4.7]),
  metric('MQ-E01','0.286 kWh/m³','0.272 kWh/m³','+5.1%',1.7,'normal_applicable','attention','总电耗略高于同边界负荷修正基线。','全厂用电可控，但分项结果显示主要偏差来自曝气和脱水。',[1.8,1.8,1.7,1.7,1.6,1.7]),
  metric('MQ-E02','0.191 kWh/m³','0.148 kWh/m³','+29.1%',2.4,'normal_applicable','risk','曝气电单耗高于动态基线29.1%。','出水稳定达标，但1#、2#鼓风机单位产气能耗偏高，且夜间DO设定存在过度曝气迹象。',[3.5,3.2,3,2.8,2.6,2.4],[fact('PROC-AIR-2608','工艺管理','生化池曝气月度运行明细','PROC-E-202608','2026-08-28','工艺负责人','曝气电量391,480 kWh；处理水量2,050,000 m³；好氧末端DO夜间P50为2.8 mg/L。'),fact('EQ-BLOWER-02','设备管理','2#鼓风机性能核查','EQ-T-202608-17','2026-08-25','设备工程师','实测单位能耗产气量较铭牌工况低12.6%，建议清洗进口过滤器并复测。')]),
  metric('MQ-E03','61.5%','适用扬程满分区间≥68%','-6.5个百分点',3.2,'normal_applicable','attention','进水提升泵运行点偏离高效区。','效率偏差主要集中在低水位时段，建议联动液位控制和泵组组合优化。',[3.5,3.4,3.3,3.3,3.1,3.2]),
  metric('MQ-E04','4.1 W/m³','3.0 W/m³','+36.7%',1.8,'normal_applicable','risk','连续搅拌功率密度高于暂定基线。','混合功能正常，但现有搅拌设备和运行方式能耗偏高；3 W/m³仍为待验证参数。',[2.3,2.2,2.1,2,1.9,1.8]),
  metric('MQ-E05','电耗92 kWh/tDS；PAM 8.7 kg/tDS','电耗68；PAM 6.0','综合偏高约38%',2.5,'normal_applicable','risk','泥饼含水率达标，但电耗和PAM均偏高。','本场景最大失分项。脱水产出合格，低分更可能来自设备运行点、污泥性质和投加控制。',[3.8,3.5,3.2,3,2.7,2.5],[fact('SLUDGE-2608','生产运行','污泥脱水月度汇总','OPS-S-202608','2026-08-28','污泥班长','产干泥412 tDS，脱水电量37,904 kWh，PAM用量3.58 t，平均泥饼含水率79.2%。')]),
  metric('MQ-E06','5.28 △C/△N','5.00 △C/△N','+5.6%',3.5,'normal_applicable','attention','TN目标满足，碳源折算值略高于暂定基线。','脱氮效果合格，现阶段可优先校正进水碳氮比判断和分时投加。',[3.2,3.3,3.4,3.5,3.4,3.5]),
  metric('MQ-E07','1.18×基线','≤1.00×基线','+18.0%',3.4,'normal_applicable','attention','最终TP达标，化学除磷药剂略高于适用基线。','应结合生物除磷贡献与投加点混凝条件进一步优化，而非只压低药量。',[3.6,3.5,3.4,3.3,3.4,3.4]),
  metric('MQ-E08','2.30 mg/L有效氯','2.00 mg/L','+15.0%',1.6,'normal_applicable','attention','消毒效果满足，药耗略高于讨论稿基线。','适度优化投加可降低资源消耗，但必须保持微生物指标满足适用要求。',[1.7,1.8,1.7,1.6,1.7,1.6])
]

type MetricOverride = Partial<QualityMetricSample> & { code:string }

function withOverrides(base: QualityMetricSample[], overrides: MetricOverride[]): QualityMetricSample[] {
  const byCode = new Map(overrides.map(item=>[item.code,item]))
  return base.map(item=>({ ...item, trend:[...item.trend], trendLabels:[...item.trendLabels], facts:item.facts.map(record=>({...record})), ...byCode.get(item.code) }))
}

const complianceRiskMetrics = withOverrides(stableEconomyGapMetrics, [
  { code:'MQ-S01', actual:'98.0%', baseline:'100%全因子日均达标', deviation:'-2.0%', score:7.2, status:'normal_applicable', riskLevel:'risk', statusNote:'滚动期内7个自然日存在至少一个因子不达标。', interpretation:'表面成本较低，但日均综合达标结果已明显下降。经济结果不能脱离合格产出前提解读。', trend:[12,11.4,10.2,9.6,8.4,7.2] },
  { code:'MQ-S02', actual:'95.4%', baseline:'瞬时综合指数100%', deviation:'-4.6%', score:4.8, status:'normal_applicable', riskLevel:'attention', statusNote:'总磷与氨氮存在短时越限记录。', interpretation:'短时风险正在增加，应结合进水冲击和控制策略核查。' },
  { code:'MQ-S03', actual:'38.0', baseline:'稳定裕度指数100', deviation:'-62.0', score:0, status:'score_zero', riskLevel:'risk', statusNote:'数据有效且适用，按讨论稿规则得分确实为0。', interpretation:'核心指标P95占用率接近或越过风险边界，低成本结果不应被解读为高效率。', trend:[7.1,6.2,5.4,3.8,1.9,0] },
  { code:'MQ-E01', actual:'0.252 kWh/m³', baseline:'0.272 kWh/m³', deviation:'-7.4%', score:2, status:'normal_applicable', riskLevel:'normal', statusNote:'总电耗低于基线。', interpretation:'电耗较低，但需要与稳定达标风险同时解读。' },
  { code:'MQ-E02', actual:'0.139 kWh/m³', baseline:'0.148 kWh/m³', deviation:'-6.1%', score:5, status:'normal_applicable', riskLevel:'attention', statusNote:'能耗值较低，但硝化和稳定裕度前提存在风险。', interpretation:'暂不把低能耗直接认定为优秀，应先核验合格产出前提。' },
  { code:'MQ-E05', actual:'电耗66 kWh/tDS；PAM 5.7 kg/tDS', baseline:'电耗68；PAM 6.0', deviation:'-3.8%', score:6, status:'normal_applicable', riskLevel:'normal', statusNote:'脱水产出与含水率满足要求。', interpretation:'该项资源效率正常。' }
])

const incompleteDataMetrics = withOverrides(stableEconomyGapMetrics, [
  { code:'MQ-S01', actual:'95.0%', baseline:'100%全因子日均达标', deviation:'-5.0%', score:0, status:'score_zero', riskLevel:'risk', statusNote:'数据有效且适用，按讨论稿95%边界得分为0。', interpretation:'这是“得分为0”，不是缺数据。' },
  { code:'MQ-S02', actual:'—', baseline:'适用瞬时限值库', deviation:'无法计算', score:null, status:'insufficient_data', riskLevel:'unavailable', statusNote:'缺少总磷瞬时有效记录数与超标记录数。', interpretation:'应补齐责任模块数据；数据不足不能自动按0分或满分处理。' },
  { code:'MQ-E03', actual:'—', baseline:'分扬程效率区间', deviation:'无法计算', score:null, status:'insufficient_data', riskLevel:'unavailable', statusNote:'二次提升系统电量缺失。', interpretation:'应前往生产运行或设备管理补齐同周期电量。' },
  { code:'MQ-E04', actual:'不适用', baseline:'3.0 W/m³', deviation:'不参与', score:null, status:'process_not_applicable', riskLevel:'unavailable', statusNote:'示范分支未设置厌氧/缺氧机械混合系统。', interpretation:'属于工艺不适用，将按适用权重规则处理，不等于缺数据。' },
  { code:'MQ-E05', actual:'-14 kWh/tDS', baseline:'设备路线基线', deviation:'物理不合理', score:null, status:'data_abnormal', riskLevel:'unavailable', statusNote:'导入电量出现负值，等待核查原始记录。', interpretation:'数据异常，不形成正式得分。' },
  { code:'MQ-E06', actual:'分母为0', baseline:'△C/△N基线5', deviation:'公式前提不成立', score:null, status:'calculation_invalid', riskLevel:'unavailable', statusNote:'进出水TN与外加TN形成的分母为0。', interpretation:'计算无效，需要核对采样边界与输入数据。' }
])

export const qualityScenarios: QualityScenario[] = [
  { id:'stable_economy_gap', name:'稳定达标但经济性偏差', shortName:'场景A', description:'出水与安全总体稳定，曝气、混合和污泥脱水效率存在主要失分。', evaluationPeriod:'2025-09—2026-08（滚动12个月）', updatedAt:'2026-08-28 10:30', metrics:stableEconomyGapMetrics },
  { id:'low_cost_compliance_risk', name:'成本较低但存在达标风险', shortName:'场景B', description:'资源消耗较低，但水质裕度和日均达标结果下降，演示“低成本不等于高质量”。', evaluationPeriod:'2025-09—2026-08（滚动12个月）', updatedAt:'2026-08-28 10:30', metrics:complianceRiskMetrics },
  { id:'incomplete_data', name:'数据不完整与异常', shortName:'场景C', description:'同时演示工艺不适用、数据不足、数据异常、计算无效、真实值为0和得分为0。', evaluationPeriod:'2025-09—2026-08（滚动12个月）', updatedAt:'2026-08-28 10:30', metrics:incompleteDataMetrics }
]

export const DEFAULT_SCENARIO_ID = qualityScenarios[0].id
