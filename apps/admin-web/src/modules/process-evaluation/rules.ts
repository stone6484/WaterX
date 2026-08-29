import type {
  EvaluationCategory,
  ProcessEvaluationPageId,
  ProcessModuleDefinition,
  ProcessModuleKey,
  ProcessRule,
  RequirementImportance,
} from './types'
import { PROCESS_RULE_DETAILS } from './rule-details'

export const PROCESS_RULE_VERSION = 'PX-V0.2（检查要求可执行化）'

const categories = (rows: Array<[string, string, string, number]>): EvaluationCategory[] =>
  rows.map(([key, shortName, name, weight]) => ({ key, shortName, name, weight }))

export const PROCESS_MODULES: ProcessModuleDefinition[] = [
  {
    key: 'operations', name: '运行管理评价', shortName: '运行管理', pageId: 'evaluationOperations', icon: '运',
    description: '检查生产组织、工艺控制、异常响应、污泥药剂和运行改进过程是否受控。',
    boundary: '化验方法与数据质量、设备维修质量和危险作业控制分别由对应专业模块主评。达标率、能耗和药耗结果不在本模块重复评分。',
    categories: categories([
      ['A', '体系计划', '管理体系与运行计划', 12], ['B', '生产组织', '生产组织与交接班', 12], ['C', '工艺控制', '工艺运行控制', 28],
      ['D', '异常处置', '异常响应与应急处置', 18], ['E', '污泥药剂', '污泥与药剂过程控制', 12], ['F', '现场中控', '现场运行与中控管理', 10],
      ['G', '分析改进', '运行分析与持续改进', 8],
    ]),
  },
  {
    key: 'equipment', name: '设备管理评价', shortName: '设备管理', pageId: 'evaluationEquipment', icon: '设',
    description: '检查设备资产基础、点检状态、维护维修、自控、备件和改造过程是否受控。',
    boundary: '在线水质监测比对和第三方运维监督归化验管理；危险作业许可与人员防护归安全管理；资产账务与采购程序归综合管理。',
    categories: categories([
      ['A', '体系资产', '管理体系与资产基础', 10], ['B', '点检状态', '点检与状态管理', 22], ['C', '维护维修', '维护维修与工单管理', 24],
      ['D', '仪表自控', '计量仪表与自控管理', 14], ['E', '备件委外', '备件与委外管理', 10], ['F', '大修改造', '大修重置与改造', 12],
      ['G', '分析现场', '分析改进与现场规范', 8],
    ]),
  },
  {
    key: 'laboratory', name: '化验管理评价', shortName: '化验管理', pageId: 'evaluationLaboratory', icon: '化',
    description: '检查采样、检测、质控、数据可信、实验室安全和在线监测协同过程是否受控。',
    boundary: '第三方在线监测运维监督全部归本模块；运行和设备模块只共享事实。最终出水是否达标属于管理质量，不在本模块重复评分。',
    categories: categories([
      ['A', '体系能力', '管理体系与人员能力', 10], ['B', '计划采样', '监测计划与采样管理', 15], ['C', '检测记录', '检测实施与原始记录', 20],
      ['D', '质量控制', '质量控制与数据可信', 25], ['E', '仪器试剂', '仪器、标准物质与试剂', 12], ['F', '实验安全', '实验室安全与废物管理', 10],
      ['G', '在线协同', '在线监测及外部协同', 8],
    ]),
  },
  {
    key: 'safety', name: '安全管理评价', shortName: '安全管理', pageId: 'evaluationSafety', icon: '安',
    description: '检查安全责任、培训资质、风险隐患、危险作业、应急和重点场所过程是否受控。',
    boundary: '设备联锁等功能状态归设备管理；实验室专业危化品和废液归化验管理；工艺异常处置归运行管理。',
    categories: categories([
      ['A', '责任投入', '责任体系与安全投入', 10], ['B', '培训资质', '培训资质与安全沟通', 10], ['C', '风险隐患', '风险管控与隐患治理', 18],
      ['D', '危险作业', '危险作业与相关方', 20], ['E', '应急事故', '应急与事故事件管理', 12], ['F', '职业健康', '职业健康与个体防护', 8],
      ['G', '现场安全', '重点场所与现场安全', 22],
    ]),
  },
  {
    key: 'general', name: '综合管理评价', shortName: '综合管理', pageId: 'evaluationComprehensive', icon: '综',
    description: '检查治理授权、证照合同、档案印章、人事、采购资产和行政督办过程是否受控。',
    boundary: '利润、回款、成本预算完成率和创收金额属于经营结果，不进入过程评价；专业技术状态由对应业务模块主评。',
    categories: categories([
      ['A', '组织制度', '组织治理与制度体系', 12], ['B', '证照合同', '证照、合同与合规事项', 18], ['C', '文档印章', '文档、印章与信息记录', 16],
      ['D', '人事发展', '人事基础与人员发展', 18], ['E', '采购资产', '采购、库房与资产管理', 16], ['F', '行政后勤', '行政后勤与厂区秩序', 10],
      ['G', '会议改进', '会议督办与持续改进', 10],
    ]),
  },
]

const rawRules: Record<ProcessModuleKey, string> = {
  operations: `
OPS-A01|运行职责、制度和作业指引|3
OPS-A02|运行基础资料|3
OPS-A03|年度、月度生产运行计划|5
OPS-A04|运行模式、控制限值和调整权限|3
OPS-B01|岗位配置、值班与授权|5
OPS-B02|交接班完整性|5
OPS-B03|日常运行任务执行与异常转办|3
OPS-C01|进水变化识别与策略调整|5
OPS-C02|预处理单元运行控制|3
OPS-C03|生化系统关键参数控制|5
OPS-C04|深度处理、消毒及其他适用单元控制|5
OPS-C05|重要调控和运行模式切换|5
OPS-C06|调控措施效果验证|5
OPS-D01|运行异常响应方案覆盖|5
OPS-D02|异常发现、分级、报告和启动响应|5
OPS-D03|异常处置过程记录与协同|5
OPS-D04|重大或重复异常复盘改进|5
OPS-E01|污泥产生、脱水和暂存过程|3
OPS-E02|污泥转运交接和去向追溯|5
OPS-E03|药剂投加策略、计量和记录|5
OPS-E04|药耗异常分析与纠偏|3
OPS-F01|处理单元现场运行状态|5
OPS-F02|中控画面、报警、趋势和运行支持|5
OPS-G01|月度运行分析|3
OPS-G02|改进任务跟踪与验证|5`,
  equipment: `
EQP-A01|设备及自控职责与专业分工|3
EQP-A02|制度、流程和技术规程|3
EQP-A03|设备设施台账、分级和编码|5
EQP-A04|重要设备技术档案|3
EQP-B01|点检标准、路线和周期|5
EQP-B02|点检任务执行与记录真实性|5
EQP-B03|点检异常转办与闭环|5
EQP-B04|关键设备状态、备用能力和风险评估|5
EQP-C01|年度维护计划及分解|5
EQP-C02|运维工单适用和内容完整|5
EQP-C03|作业技术标准、质量控制和完工验收|5
EQP-C04|修复验证、重复故障和重大故障分析|5
EQP-C05|专业协同和影响控制|3
EQP-D01|计量器具检定、校准或核查|5
EQP-D02|一般过程仪表状态和信号传输|3
EQP-D03|中控、PLC、通信和UPS功能|5
EQP-D04|联锁、保护、报警和急停功能测试|5
EQP-E01|关键备件和维修材料保障|3
EQP-E02|备件技术验收、领退和追溯|3
EQP-E03|委外维修技术管理|5
EQP-F01|项目依据、计划和变更控制|5
EQP-F02|项目实施、调试、验收和资料移交|5
EQP-F03|更换部件、闲置设备和报废技术建议|3
EQP-G01|月度设备管理分析|3
EQP-G02|设备、管线和检修现场规范|3`,
  laboratory: `
LAB-A01|制度、规程和作业指导书有效|3
LAB-A02|化验模式职责与检测能力覆盖|3
LAB-A03|人员授权与适用资格|5
LAB-A04|培训、能力确认和内部考核|1
LAB-B01|法定监测计划与内部检测计划完整|5
LAB-B02|采样点位设置和标识合理|3
LAB-B03|样品采集、保存、运输和交接受控|5
LAB-B04|外部监管取样响应闭环|3
LAB-C01|检测方法适用且版本受控|5
LAB-C02|方法关键控制条件执行|3
LAB-C03|原始记录及时、完整且可追溯|5
LAB-C04|结果复核、批准、锁定和更正受控|5
LAB-C05|异常结果复测、确认和升级闭环|5
LAB-D01|内部质量控制计划完整|3
LAB-D02|精密度质量控制有效|5
LAB-D03|准确度质量控制有效|5
LAB-D04|盲样、实验室间比对或能力验证有效|3
LAB-D05|质量控制失控处置闭环|5
LAB-D06|多源数据一致且修改可审计|5
LAB-E01|实验室环境和资源能力满足方法|3
LAB-E02|仪器检定、校准或核查有效|5
LAB-E03|仪器使用、维护、核查和故障处置完整|3
LAB-E04|标准物质、标准溶液和试剂受控|5
LAB-F01|实验室安全设施和应急控制有效|3
LAB-F02|危险化学品和受控药品账实及权限受控|5
LAB-F03|实验室废液分类、贮存和转移处置合规|5
LAB-G01|在线监测与实验室比对及纠偏有效|5
LAB-G02|在线异常期间手工监测和报告闭环|5
LAB-G03|第三方在线运维监督有效|3`,
  safety: `
SAF-A01|安全责任、机构和岗位落实|5
SAF-A02|年度目标和安全工作计划|3
SAF-A03|规章制度、操作规程和现场要求|5
SAF-A04|安全投入和资源保障|3
SAF-B01|新员工、转岗复岗和“四新”教育|5
SAF-B02|法定和内部资格有效性|5
SAF-B03|安全会议、班前提示和专项沟通|3
SAF-C01|风险辨识、分级和控制措施|5
SAF-C02|隐患排查计划和执行|3
SAF-C03|隐患治理“五落实”和复核关闭|5
SAF-C04|重大、重复和逾期隐患升级|5
SAF-D01|危险作业许可和审批|5
SAF-D02|作业前分析、隔离、检测和准备|5
SAF-D03|作业过程监护、持续检测和防护|5
SAF-D04|相关方安全准入和责任约定|5
SAF-D05|相关方作业过程监督|5
SAF-E01|应急预案、组织和物资|5
SAF-E02|演练、评估和改进|3
SAF-E03|事故、未遂事件报告和调查|5
SAF-F01|职业危害识别、检测和健康监护|5
SAF-F02|个体防护和应急救援装备|5
SAF-G01|通用作业环境和防护设施|5
SAF-G02|变配电、临时用电和防雷|5
SAF-G03|特种设备登记、检验和使用状态|5
SAF-G04|消防设施和疏散条件|5
SAF-G05|危化品、加药及危废重点场所|5
SAF-G06|有限空间辨识、警示和救援条件|5`,
  general: `
GEN-A01|组织架构、职责和授权|5
GEN-A02|综合管理制度覆盖和有效性|3
GEN-A03|制度及外部要求变更管理|3
GEN-A04|年度重点管理任务跟踪|3
GEN-B01|证照清单、保管和有效性|5
GEN-B02|运营协议及重要合同义务识别|5
GEN-B03|合同义务和外部合规事项办理|5
GEN-B04|重大经营、合规和诉讼风险跟踪|5
GEN-C01|档案收集、编目和保管|5
GEN-C02|收文、发文和承办闭环|3
GEN-C03|印章和重要证照使用|5
GEN-C04|资料借阅、移交、复制和销毁|3
GEN-D01|招聘至离职的人事流程|5
GEN-D02|劳动合同、员工档案和基础数据|5
GEN-D03|培训需求、计划和模块协同|3
GEN-D04|绩效过程和结果确认|3
GEN-E01|采购需求、程序、验收和归档|5
GEN-E02|库房出入库、盘点和账实一致|5
GEN-E03|固定资产全生命周期程序|5
GEN-E04|专业验收与综合程序证据衔接|3
GEN-F01|办公网络及公共设备保障|3
GEN-F02|门卫、来访、车辆和一般秩序|3
GEN-F03|食堂、宿舍、绿化和行政车辆|3
GEN-G01|会议决议和督办闭环|5
GEN-G02|内外部检查问题统一闭环|5`,
}

const specialRequirements: Record<string, string> = {
  'OPS-C05': '关键工艺段启停、重要参数调整和运行模式切换应按授权履行审批或确认，记录原因、目标、步骤、风险、责任和恢复条件。',
  'OPS-E02': '污泥出厂计量、运输、接收、数量、去向和交接凭证应完整可追溯，并完成产生、转出与暂存数量勾稽。',
  'OPS-F02': '中控画面、报警、趋势和关键运行数据应支持运行值守与调控；在线水质比对及第三方运维监督不在本项评分。',
  'EQP-D02': '一般过程仪表的显示、探头、量程和信号传输应正常；法定在线水质监测仪表不在本项评分。',
  'EQP-D04': '关键联锁、保护、报警和急停应按计划测试并保持有效；旁路必须具备授权、风险措施、期限和恢复确认。',
  'LAB-C03': '原始记录应在检测过程中及时形成，并能追溯样品、人员、仪器、方法、试剂、环境条件、一手读数、计算和结果。',
  'LAB-D05': '质量控制失控后，应暂停或标记受影响结果，完成原因分析、纠正、复测和影响范围评估后方可发布。',
  'LAB-F03': '实验室废液应完成属性识别、分类、容器、标签、防渗防漏、台账、暂存期限和合规转移处置。',
  'LAB-G03': '第三方在线运维监督全部归化验管理，水厂应实质监督人员、取样系统、参数、校准维护、耗材、废液和数据完整性。',
  'SAF-D01': '动火、有限空间、高处、临时用电、吊装等适用危险作业开始前必须使用正确作业票，审批、范围、时间与人员应与现场一致。',
  'SAF-G06': '有限空间清单应与现场一致，出入口具备警示和物理防护，检测、通风、通信和救援装备与场所风险匹配。',
  'GEN-B02': '运营协议和重要合同的关键义务、期限、通知、保险、违约及争议应形成可执行清单；利润和回款结果不在本项评分。',
  'GEN-G02': '内外部检查、审计和评价问题应统一登记、去重、分派、整改和复核；跨模块问题确定唯一主责，不重复扣分。',
}

const categoryOutcomeHints: Record<ProcessModuleKey, Record<string, string>> = {
  operations: { A: '要素覆盖率与现场一致率', B: '任务或记录抽查符合率', C: '参数受控率与调控闭环率', D: '事件响应与闭环率', E: '记录符合率与异常闭环率', F: '现场功能与报警闭环率', G: '分析覆盖与改进闭环率' },
  equipment: { A: '台账或制度覆盖率', B: '点检完成与异常闭环率', C: '工单、质量与验证符合率', D: '功能有效率与测试完成率', E: '保障覆盖与追溯符合率', F: '项目过程符合率', G: '分析或现场抽查符合率' },
  laboratory: { A: '能力与授权覆盖率', B: '计划或采样符合率', C: '检测记录符合率', D: '质控完成、合格与闭环率', E: '资源有效与物料符合率', F: '安全清单与账实符合率', G: '在线事件与监督闭环率' },
  safety: { A: '责任、计划与资源覆盖率', B: '培训资质覆盖与有效率', C: '风险覆盖与隐患闭环率', D: '作业和相关方合规率', E: '事件与演练闭环率', F: '职业健康与防护覆盖率', G: '重点场所抽查符合率' },
  general: { A: '职责制度与任务覆盖率', B: '证照合同事项有效率', C: '文档印章抽查符合率', D: '人事事项覆盖与合规率', E: '采购资产程序与账实符合率', F: '后勤事项闭环率', G: '督办与问题闭环率' },
}

const moduleSampleHints: Record<ProcessModuleKey, string> = {
  operations: '默认检查最近3个月记录，不少于5份；重大事件检查最近12个月全部事件。',
  equipment: '每类工单不少于5份；关键设备全部识别，现场至少抽查5台。',
  laboratory: '最近3个月至少3个项目、每项目不少于3份记录；异常与监管事项优先。',
  safety: '危险作业票每类不少于5份；事故、重大隐患及重点场所按规则全查。',
  general: '最近3个月每类事项不少于5件；人员名册全量核对，重点物资和资产优先。',
}

function buildRules(module: ProcessModuleKey): ProcessRule[] {
  return rawRules[module].trim().split('\n').map((line) => {
    const [code, title, importanceText] = line.split('|')
    const category = code.split('-')[1].slice(0, 1)
    const detail = PROCESS_RULE_DETAILS[module][code]
    if (!detail) throw new Error(`缺少过程评价规则详情：${code}`)
    return {
      code,
      module,
      category,
      title,
      importance: Number(importanceText) as RequirementImportance,
      requirement: specialRequirements[code] || `核对“${title}”是否覆盖全部适用对象，按批准规则真实执行，并对发现的异常形成可验证闭环。`,
      outcomeHint: categoryOutcomeHints[module][category],
      sampleHint: moduleSampleHints[module],
      evidenceHint: '引用现有专业模块记录、台账、工单、事件材料或现场证据；评价页不重复建立专业业务表单。',
      ruleVersion: PROCESS_RULE_VERSION,
      detail,
    }
  })
}

export const PROCESS_RULES: ProcessRule[] = PROCESS_MODULES.flatMap((module) => buildRules(module.key))

export const PROCESS_RULE_MAP = new Map(PROCESS_RULES.map((rule) => [rule.code, rule]))
export const PROCESS_MODULE_MAP = new Map(PROCESS_MODULES.map((module) => [module.key, module]))

export const PROCESS_PAGE_MODULE: Partial<Record<ProcessEvaluationPageId, ProcessModuleKey>> = {
  evaluationOperations: 'operations',
  evaluationEquipment: 'equipment',
  evaluationLaboratory: 'laboratory',
  evaluationSafety: 'safety',
  evaluationComprehensive: 'general',
}

export const PROCESS_EVALUATION_PAGE_IDS: ProcessEvaluationPageId[] = [
  'evaluationResults', 'evaluationOperations', 'evaluationEquipment', 'evaluationLaboratory',
  'evaluationSafety', 'evaluationComprehensive', 'evaluationRectification', 'evaluationReport',
]

export function isProcessEvaluationPageId(value: string): value is ProcessEvaluationPageId {
  return PROCESS_EVALUATION_PAGE_IDS.includes(value as ProcessEvaluationPageId)
}

export function rulesForModule(module: ProcessModuleKey): ProcessRule[] {
  return PROCESS_RULES.filter((rule) => rule.module === module)
}

export function importanceLabel(value: RequirementImportance): string {
  return value === 5 ? '关键要求' : value === 3 ? '重要要求' : '一般要求'
}
