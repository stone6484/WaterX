import type { QualityDataStatus, QualityDimensionDefinition, QualityMetricRule, QualityPageId } from './types'

export const QUALITY_RULE_VERSION = 'V0.1（讨论稿）'
export const QUALITY_STANDARD_SCORE = 100

export const qualityDimensions: QualityDimensionDefinition[] = [
  { id:'compliance', name:'合法合规', maxScore:20, pageId:'qualityCompliance', description:'环境与运营合规结果' },
  { id:'stability', name:'稳定达标', maxScore:30, pageId:'qualityStable', description:'出水、处理能力及运行稳定性' },
  { id:'safety', name:'安全运行', maxScore:20, pageId:'qualitySafety', description:'事故、重大隐患与关键安全屏障' },
  { id:'efficiency', name:'经济高效', maxScore:30, pageId:'qualityEfficiency', description:'合格产出前提下的资源利用效率' }
]

export const qualityPages: Record<QualityPageId, { title:string; dimension:QualityDimensionDefinition['id']; summary:string }> = {
  qualityCompliance:{ title:'合法合规', dimension:'compliance', summary:'聚焦环境许可、监管结果与污泥危废全过程闭环。' },
  qualityStable:{ title:'稳定达标', dimension:'stability', summary:'观察日均与瞬时达标、水质裕度及处理保障能力。' },
  qualitySafety:{ title:'安全运行', dimension:'safety', summary:'观察生产安全后果、重大隐患受控和关键屏障有效性。' },
  qualityEfficiency:{ title:'经济高效', dimension:'efficiency', summary:'在合格产出前提下评价能源、药剂和污泥处理效率。' }
}

export const qualityPageIds = Object.keys(qualityPages) as QualityPageId[]
export function isQualityPageId(value: string): value is QualityPageId {
  return qualityPageIds.includes(value as QualityPageId)
}

export const dataStatusMeta: Record<QualityDataStatus, { label:string; tone:string; description:string }> = {
  normal_applicable:{ label:'正常适用', tone:'normal', description:'数据、基线、周期和适用条件均满足，可正式出分。' },
  process_not_applicable:{ label:'工艺不适用', tone:'muted', description:'当前水厂不存在对应工艺或法定义务，按适用权重规则处理。' },
  insufficient_data:{ label:'数据不足', tone:'muted', description:'应有数据缺失，不能按不适用或0分处理。' },
  data_abnormal:{ label:'数据异常', tone:'warning', description:'出现物理不合理值或边界不一致，结果等待核查。' },
  calculation_invalid:{ label:'计算无效', tone:'warning', description:'评分前提或公式前提不成立，暂不形成正式得分。' },
  actual_zero:{ label:'真实值为0', tone:'normal', description:'业务实际值经核验确实为0，不代表得分为0。' },
  score_zero:{ label:'得分为0', tone:'risk', description:'数据有效且适用，但按当前讨论稿规则得分为0。' }
}

export const qualityMetricRules: QualityMetricRule[] = [
  {
    code:'MQ-L01', dimension:'compliance', name:'环境许可与法定义务履约率', maxScore:8, unit:'%',
    definition:'评价水厂在适用排污许可和环境管理要求下，是否按期、有效完成全部法定义务。',
    purpose:'把“证照齐全”落实到许可有效、监测执行、报告公开和异常报告等可核验履约结果。',
    period:'月度监控；滚动12个月正式评分', sourceModules:['基础信息','合规台账'],
    baseline:'按水厂许可证、地方要求和实际业务范围形成的适用义务清单及权重。',
    formula:'履约率＝Σ（适用义务权重×履约系数）÷Σ适用义务权重×100%。',
    scoringRule:'按期完成且证据有效系数1；逾期完成且未形成监管后果系数0.5；未完成、证据无效或实质不符合系数0。得分＝8×履约率。应持证但无证、过期或重大变更后未依法重新申请时，本项0分。',
    applicability:'不适用义务从分母剔除；本项0分不触发总分归零。',
    resultMeaning:'低分表示环境基础义务未完成或证据无效，不直接等同已经发生污染物超标。',
    pendingValidation:'义务权重、逾期系数和“重大变更”的系统判定条件。'
  },
  {
    code:'MQ-L02', dimension:'compliance', name:'环境监管事件严重度', maxScore:6, unit:'评价值',
    definition:'评价期内已生效、正式环境监管结果及其严重程度。', purpose:'区分一般整改、行政处罚和停产整治等法律后果，不以罚款金额简单评价。',
    period:'滚动12个月', sourceModules:['合规事件台账'], baseline:'以评价期内最严重监管结果确定基础评价值，再对其他独立事件附加扣减。',
    formula:'指标得分＝6×监管事件评价值÷100。',
    scoringRule:'无事件100；正式责令整改80；行政处罚60；按日连续处罚、限制生产等30；停产整治、许可证撤销、关闭或刑事责任0。每增加一起独立事件再扣10，最低0。',
    applicability:'仅纳入已生效正式监管结果；同一事实多份文书合并，内部检查问题不进入本项。',
    resultMeaning:'反映技术或管理问题是否已经转化为外部监管后果。', pendingValidation:'责令改正、约谈、通报等地方监管形式的统一映射。'
  },
  {
    code:'MQ-L03', dimension:'compliance', name:'污泥与危险废物全过程合规率', maxScore:6, unit:'%',
    definition:'评价污泥和危险废物从产生、暂存、转运到最终接收处置是否形成数量一致、主体合格、证据完整的闭环。', purpose:'覆盖污泥与危废最终去向这一关键环境风险。',
    period:'月度监控；滚动12个月正式评分', sourceModules:['生产运行','库存管理','合规台账'], baseline:'污泥与适用危废类别全过程台账、联单和合格处置主体。',
    formula:'污泥闭环率＝合规完成转运及最终处置数量÷全部出厂污泥数量；危废闭环率＝（合规转移处置量＋合规期末库存量）÷（期初库存量＋当期产生量）；综合率暂按污泥70%＋危废30%。',
    scoringRule:'得分＝6×综合合规率。确认非法倾倒、去向不明或交由无资质单位处置时，本项0分。', applicability:'无适用危废类别时仅按污泥评分并保持总权重；质量平衡偏差只作为核查信号。',
    resultMeaning:'低分表示固体产物未形成可追溯闭环，或处置主体、数量、凭证存在问题。', pendingValidation:'污泥/危废权重、允许数量偏差和第三方处置证据标准。'
  },
  {
    code:'MQ-S01', dimension:'stability', name:'日均综合达标率', maxScore:12, unit:'%',
    definition:'以自然日为单位，评价所有适用日均污染物是否同时满足具有法律约束力的排放限值。', purpose:'形成“有多少天实现全因子日均达标”的严格结果。',
    period:'月度监控；滚动12个月正式评分', sourceModules:['化验管理','工艺管理'], baseline:'适用排放限值库与应评价有效天数。',
    formula:'日均综合达标率＝全部适用日均指标均达标的有效天数÷应评价有效天数×100%。',
    scoringRule:'暂定得分＝12×max[0，（达标率－95%）÷5%]。100%得12分，99%得9.6分，98%得7.2分，95%及以下得0分。',
    applicability:'同一天多个因子超标只计一个不达标日；缺少法定监测数据不得静默剔除，并关联MQ-L01。', resultMeaning:'反映日尺度综合达标稳定性，不区分是否形成行政处罚。',
    pendingValidation:'95%零分边界、线性曲线及单月样本量引起的波动。'
  },
  {
    code:'MQ-S02', dimension:'stability', name:'瞬时值达标率', maxScore:5, unit:'%',
    definition:'评价适用瞬时限值的污染物在有效瞬时监测记录中的达标情况。', purpose:'识别日均值无法反映的短时冲击和瞬时超标风险。',
    period:'月度监控；滚动12个月正式评分', sourceModules:['化验管理','数据接口'], baseline:'适用瞬时限值库及各污染物有效瞬时记录。',
    formula:'单项达标率＝达标有效瞬时记录数÷全部有效瞬时记录数；综合指数＝70%×各适用污染物达标率平均值＋30%×最低单项达标率。',
    scoringRule:'得分＝5×瞬时综合指数÷100。第一期可填报各污染物有效记录数和超标记录数。', applicability:'不能由日均值推导；不同频率先分别计算；无有效瞬时数据不得按满分或不适用。',
    resultMeaning:'反映短时波动是否越过法定瞬时界限，与日均综合达标率互补。', pendingValidation:'平均值与最低值70/30权重及异常数据有效性识别规则。'
  },
  {
    code:'MQ-S03', dimension:'stability', name:'水质稳定裕度指数', maxScore:8, unit:'指数',
    definition:'通过限值占用率和波动幅度评价尚未超标时距离风险边界的空间。', purpose:'提前发现长期贴线运行和波动扩大的风险。',
    period:'月度计算；滚动12个月正式评分；近30日趋势', sourceModules:['化验管理','工艺管理'], baseline:'核心污染物适用法律限值、内部控制目标及同口径水质序列。',
    formula:'上限型污染物占用率＝实际浓度÷限值；单项稳定分＝70%×裕度分＋30%×波动分；综合指数＝70%×单项平均分＋30%×最低单项分。',
    scoringRule:'暂定P95占用率≤60%裕度100，60%—80%线性降至80，80%—100%线性降至0，≥100%为0；归一化波动≤10%为100，10%—30%线性降至0，≥30%为0。得分＝8×综合指数÷100。',
    applicability:'默认核心污染物COD、氨氮、总氮、总磷；范围型/下限型指标使用到最近边界的归一化距离。', resultMeaning:'低分表示运行裕度不足或波动较大，即使当前仍可能达标。', pendingValidation:'P95、60%/80%边界、波动阈值及核心指标集合。'
  },
  {
    code:'MQ-S04', dimension:'stability', name:'处理保障与核心设备可靠性指数', maxScore:5, unit:'指数',
    definition:'评价应处理来水是否有效处理、处理能力是否连续可用及核心设备是否可靠。', purpose:'补充水质达标无法反映的减产、旁路、停运和频繁故障。',
    period:'月度计算；滚动12个月正式评分', sourceModules:['生产运行','设备管理'], baseline:'调整后应处理水量、当期可用处理能力和核心设备运行台时。',
    formula:'综合指数＝50%×来水有效处理率＋30%×连续运行保障率＋20%×核心设备可靠性。', scoringRule:'前两项按百分比计分；核心设备可靠性按故障频度满分/零分边界插值；得分＝5×综合指数÷100。',
    applicability:'正式确认的上游停水、政府调度、不可抗力等可调整；厂内设备、工艺或人员原因损失不得扣除。', resultMeaning:'低分表示处理能力、运行连续性或核心设备可靠性不足。', pendingValidation:'外部事件证明、等效能力损失算法、核心设备范围和故障零分线。'
  },
  {
    code:'MQ-A01', dimension:'safety', name:'生产安全事故严重度指数', maxScore:8, unit:'评价值',
    definition:'评价责任范围内人员伤害、急性中毒、火灾爆炸及生产中断或损失事故后果。', purpose:'以实际事故后果评价安全运行，并区别严重程度。',
    period:'滚动12个月正式评分；近36个月趋势', sourceModules:['安全管理'], baseline:'按评价期内最严重事故确定基础评价值，其他独立可记录事故附加扣减。',
    formula:'得分＝8×事故严重度评价值÷100。', scoringRule:'无事故100；可记录轻微事件85；停工伤害或较严重设备/火灾事件60；一般生产安全事故20；较大及以上事故0。每增加一起独立可记录事故再扣10。',
    applicability:'正式员工、承包商、临时人员均纳入；同一事件只按最高后果计算。', resultMeaning:'反映已经发生的安全后果，不因未遂事件主动报告较多而扣分。', pendingValidation:'内部事件分级、经济损失边界及多事件附加扣分。'
  },
  {
    code:'MQ-A02', dimension:'safety', name:'重大事故隐患闭环受控率', maxScore:7, unit:'%',
    definition:'评价重大事故隐患在整改期间是否受控、按期完成并经复核关闭。', purpose:'以重大风险是否持续暴露作为事故低频下的关键前置结果。',
    period:'月度计算；滚动12个月正式评分', sourceModules:['安全管理','改进提升'], baseline:'重大隐患台账、临时管控、整改计划、验收和复核记录。',
    formula:'综合指数＝60%×按期闭环率＋40%×当前受控率。', scoringRule:'得分＝7×综合指数。当期无重大隐患且已完成应开展排查按100%；未完成排查不能凭“零隐患”满分。',
    applicability:'完成但未复核不算闭环；逾期但有临时措施仅计入当前受控率；漏报按应识别日期起算。', resultMeaning:'低分表示重大风险长期存在、超期或缺少有效临时控制。', pendingValidation:'重大隐患标准库、临时措施有效性和漏识别起算日期。'
  },
  {
    code:'MQ-A03', dimension:'safety', name:'关键安全屏障有效率', maxScore:5, unit:'%',
    definition:'评价气体检测、通风、联锁、急停、消防、电气保护等关键设施是否通过真实功能测试并保持可用。', purpose:'避免只看设施存在，不验证保护功能。',
    period:'规定测试周期记录；月度汇总、滚动12个月评分', sourceModules:['安全管理','设备管理'], baseline:'按水厂风险辨识配置的适用屏障清单、权重和应测试次数。',
    formula:'单项有效率＝功能测试合格次数÷应测试次数；综合指数＝70%×加权平均有效率＋30%×最高风险屏障中的最低有效率。', scoringRule:'得分＝5×综合指数÷100；核心/重要/一般屏障暂按权重3/2/1。',
    applicability:'未到周期不重复计次；应测试未测试不能按不适用；失效需记录起止和临时控制。', resultMeaning:'低分表示阻止严重事故的关键保护层失效或验证不足。', pendingValidation:'安全屏障标准清单、风险权重和分场景功能测试方法。'
  },
  {
    code:'MQ-E01', dimension:'efficiency', name:'综合吨水电耗效率', maxScore:2, unit:'kWh/m³',
    definition:'评价全厂边界内单位处理水量总体用电及其相对基线偏差。', purpose:'覆盖子系统外其他用电，并控制与子系统指标重复权重。',
    period:'滚动12个月', sourceModules:['生产运行','经营管理'], baseline:'同边界历史基线，并按主要进水负荷变化修正。',
    formula:'综合吨水电耗＝（生产电量＋办公电量）÷处理水量。', scoringRule:'沿用原量化标准中按边界、进水氨氮变化率设置满分值和零分值并区间插值的规则，本项仅保留2分。',
    applicability:'新增、扩建、边界重大变化或计量范围不一致时列为边界不适用；同时展示总电耗和已评价子系统占比。', resultMeaning:'反映全厂最终用电结果，但不单独定位偏差系统。', pendingValidation:'边界变化、负荷修正变量及子系统能耗重复程度。'
  },
  {
    code:'MQ-E02', dimension:'efficiency', name:'生化池曝气系统能效', maxScore:5, unit:'kWh/m³',
    definition:'评价完成生物处理和硝化功能条件下，曝气系统单位处理水量能耗是否合理。', purpose:'控制主要能耗系统，并以动态负荷基线修正边界差异。',
    period:'月度计算；滚动12个月正式评分', sourceModules:['工艺管理','设备管理'], baseline:'理论需气量÷处理水量÷风机单位能耗产气量，并按污染负荷、水深、水温等修正。',
    formula:'曝气电单耗＝曝气充氧设备电量÷处理水量。', scoringRule:'实际值处于基线15%—100%得满分；超过2倍基线或低于15%基线得0；其余线性插值，满分5分。',
    applicability:'氨氮、硝化或必要DO控制明显失效时，不认可低能耗高效率；异常低值核查停运、电量边界和水量。', resultMeaning:'低分通常指向供气效率低、曝气过量、设备性能或运行控制不匹配。', pendingValidation:'理论需气量模型、风机性能参数和季节水温修正系数。'
  },
  {
    code:'MQ-E03', dimension:'efficiency', name:'提升输送系统效率', maxScore:4, unit:'%',
    definition:'评价各适用提升系统把电能转化为有效输送功的效率。', purpose:'使用水力效率消除不同扬程水厂的直接吨水电耗差异。',
    period:'月度计算；滚动12个月正式评分', sourceModules:['生产运行','设备管理'], baseline:'按实际扬程区间配置合理效率满分区间和零分区间。',
    formula:'系统效率＝9.81×（流量÷3600×平均扬程）÷系统电量；综合得分按系统用电量加权。', scoringRule:'沿用原标准扬程区间规则，中间插值；异常超过90%的效率按0分并触发核查。',
    applicability:'扬程低于下限或无对应系统的子系统不参评；各系统使用一致周期和计量边界。', resultMeaning:'低分可能来自泵选型、运行点、管损、液位控制或计量异常。', pendingValidation:'平均扬程算法、管路损失和分扬程满分效率范围。'
  },
  {
    code:'MQ-E04', dimension:'efficiency', name:'混合系统能效', maxScore:3, unit:'W/m³',
    definition:'评价厌氧、缺氧等混合区域单位有效容积的持续混合能耗。', purpose:'控制连续搅拌能耗，同时防止停运设备获得低能耗。',
    period:'月度计算；滚动12个月按运行天数加权', sourceModules:['工艺管理','基础信息'], baseline:'暂用3 W/m³基线。',
    formula:'单位容积能耗＝混合系统电量×1000÷有效容积÷运行天数÷24。', scoringRule:'实际值处于基线15%—100%得满分；超过2倍基线或低于15%基线得0；其余线性插值。',
    applicability:'无厌氧缺氧混合系统时工艺不适用；池容读取基础信息；异常低值核查停运、池容和混合功能。', resultMeaning:'低分反映搅拌能效或控制不合理；异常低值可能意味着功能未实现。', pendingValidation:'3 W/m³基线及不同池型、设备和间歇运行适用范围。'
  },
  {
    code:'MQ-E05', dimension:'efficiency', name:'污泥脱水综合效率', maxScore:6, unit:'综合得分',
    definition:'评价完成规定脱水效果所需的单位干泥电耗和调理药剂耗用水平。', purpose:'在同一产出下统一评价能源和药剂，避免重复计分。',
    period:'月度计算；滚动12个月正式评分', sourceModules:['生产运行','设备管理','库存管理'], baseline:'按带式、离心、板框设备及PAM、石灰、无机药剂路线配置基线。',
    formula:'综合得分由脱水比能耗3分和调理药耗3分组成；比能耗＝系统电量÷产干泥量；药耗按有效成分量÷产干泥量。', scoringRule:'采用对应设备/药剂路线基线和零分倍数，中间线性插值；多路线按处理量在6分内分配。',
    applicability:'泥饼含水率须满足处置或合同要求；产干泥量边界不一致或含水率异常时暂停出分。', resultMeaning:'低分指向设备运行点、污泥性质、药剂选型或投加控制效率问题。', pendingValidation:'分设备基线、宽标准、多设备权重及含水率合格前提。'
  },
  {
    code:'MQ-E06', dimension:'efficiency', name:'碳源利用效率', maxScore:4, unit:'△C/△N',
    definition:'评价完成脱氮目标条件下，外加碳源对实际氮去除的贡献是否经济合理。', purpose:'识别无需投加、投加效率低和单位脱氮碳耗偏高。',
    period:'月度计算；滚动12个月正式评分', sourceModules:['工艺管理','库存管理'], baseline:'△C/△N暂用基线5，并统一按有效COD折算。',
    formula:'△C/△N＝（进水COD－出水COD＋外加COD）÷（进水TN－出水TN＋外加TN）。', scoringRule:'无需投加且TN达标满分；进水COD/TN≥5仍持续投加为0；确需投加时≤基线满分，达到1.4倍基线为0，中间插值。',
    applicability:'TN或脱氮目标未实现时，低投加量不得高分，标记“合格产出前提未满足”。', resultMeaning:'低分表示需求判断、品种、投加位置或反硝化控制可能不合理。', pendingValidation:'应急投加2 mg/L边界、COD/TN条件、有效COD系数和TN目标。'
  },
  {
    code:'MQ-E07', dimension:'efficiency', name:'除磷效率', maxScore:4, unit:'kg/kgTP',
    definition:'评价生物除磷贡献基础上，完成剩余TP去除的化学药剂耗用是否合理。', purpose:'避免只看药剂单耗而忽略进水条件、生物除磷和实际TP去除。',
    period:'月度计算；滚动12个月正式评分', sourceModules:['工艺管理','化验管理','库存管理'], baseline:'按进水碳磷比、生化出水TP、最终出水TP和投加位置计算。',
    formula:'核心量化值＝以Al₂O₃计的药剂耗用量÷实际化学去除TP量。', scoringRule:'实际值≤适用基线满分；达到3倍基线0分；中间线性插值。无需化学投加且生物除磷稳定达标可满分。',
    applicability:'最终TP未达到控制要求时不得以低药耗高分；药剂统一按有效Al₂O₃折算。', resultMeaning:'低分表示生物除磷不足、药剂利用率低或投加混凝条件不合理。', pendingValidation:'药剂有效成分、投加位置、化学去除量下限和采样频次。'
  },
  {
    code:'MQ-E08', dimension:'efficiency', name:'消毒资源利用效率', maxScore:2, unit:'路线折算',
    definition:'评价达到适用消毒效果条件下，化学消毒或紫外消毒的单位资源消耗。', purpose:'控制过度消毒和浪费，并防止少投药、少开设备获得虚假高分。',
    period:'月度计算；滚动12个月正式评分', sourceModules:['工艺管理','化验管理','库存管理'], baseline:'有效氯暂用2 mg/L；紫外暂用0.014 kWh/m³。',
    formula:'有效氯吨水药耗＝有效氯药剂量÷处理水量；紫外吨水电耗＝紫外设备电量÷处理水量。', scoringRule:'有效氯达到2.5倍基线0分；紫外达到1.43倍基线0分；中间插值。',
    applicability:'消毒效果不满足要求时不得获得效率高分；双路线按短板或实际水量/周期加权。', resultMeaning:'低分表示药剂过量、紫外设备效率低、联合配置不合理或效果前提未满足。', pendingValidation:'微生物限值、余氯控制、双路线判定和不同出水去向基线。'
  }
]
