import type { ProcessRuleDetail } from './types'

export const EQUIPMENT_RULE_DETAILS: Record<string, ProcessRuleDetail> = {
  "EQP-A01": {
    "overview": "设备、自控和运维岗位职责、授权、替岗及专业支持关系清晰，覆盖水厂实际设备管理需要。",
    "checkPoints": [
      "记录并核对：应覆盖职责数",
      "记录并核对：已覆盖数",
      "记录并核对：关键岗位配置数",
      "记录并核对：实际数",
      "抽查人员数",
      "记录并核对：正确掌握人数"
    ],
    "sampling": [
      "执行本模块通用检查窗口与抽样基线；实际数量不足时全部检查。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "应覆盖职责数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录应覆盖职责数"
      },
      {
        "key": "fact_2",
        "label": "已覆盖数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录已覆盖数"
      },
      {
        "key": "fact_3",
        "label": "关键岗位配置数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录关键岗位配置数"
      },
      {
        "key": "fact_4",
        "label": "实际数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录实际数"
      },
      {
        "key": "fact_5",
        "label": "抽查人员数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录抽查人员数"
      },
      {
        "key": "fact_6",
        "label": "正确掌握人数",
        "type": "number",
        "unit": "人",
        "placeholder": "记录正确掌握人数"
      },
      {
        "key": "fact_7",
        "label": "缺岗是否有批准的支持措施",
        "type": "boolean",
        "placeholder": "请选择"
      }
    ],
    "decision": {
      "compliant": "职责和关键岗位覆盖100%",
      "partial": "个别非关键分工不清",
      "nonCompliant": "关键职责无人承担、长期依赖未明确的临时人员或多数人员不清楚职责",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "职责缺失",
      "分工交叉",
      "关键岗位空缺",
      "替岗无授权",
      "专业支持不明确"
    ],
    "evidence": "组织职责、授权、排班或支持协议",
    "closeCondition": "补齐职责和资源后，用至少3项真实工作验证。",
    "method": "清单型，系统辅助＋人工确认",
    "boundary": ""
  },
  "EQP-A02": {
    "overview": "设备分级、点检、维护、维修、故障、事故、大修、报废建议、备件和自控运维等制度及技术规程有效、本地化，与设备实际一致。",
    "checkPoints": [
      "记录并核对：应覆盖主题数",
      "记录并核对：有效数",
      "抽查设备规程数",
      "记录并核对：现场适用数",
      "记录并核对：是否存在失效版本继续使用"
    ],
    "sampling": [
      "执行本模块通用检查窗口与抽样基线；实际数量不足时全部检查。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "应覆盖主题数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录应覆盖主题数"
      },
      {
        "key": "fact_2",
        "label": "有效数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录有效数"
      },
      {
        "key": "fact_3",
        "label": "抽查设备规程数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录抽查设备规程数"
      },
      {
        "key": "fact_4",
        "label": "现场适用数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录现场适用数"
      },
      {
        "key": "fact_5",
        "label": "是否存在失效版本继续使用",
        "type": "boolean",
        "placeholder": "请选择"
      }
    ],
    "decision": {
      "compliant": "覆盖和现场适用率100%",
      "partial": "一般缺项",
      "nonCompliant": "关键设备无操作维护规程、规程与设备明显不符或大面积失效",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "制度缺失",
      "规程缺失",
      "版本失效",
      "规程与设备不符",
      "定额不合理"
    ],
    "evidence": "制度目录、代表性规程和现场核对",
    "closeCondition": "修订批准、旧版停用并验证实际使用。",
    "method": "比例型＋清单型，系统预判＋人工确认",
    "boundary": "安全作业制度不在本项重复评价。"
  },
  "EQP-A03": {
    "overview": "设备设施台账、专业分类、风险或重要度分级、关键设备清单和唯一编码完整准确，与现场一致并及时更新。",
    "checkPoints": [
      "核对关键设备全部核对清单，现场抽查不少于10台设备，覆盖机械、电气、自控和不同工段。",
      "记录并核对：现场设备总数或抽查数",
      "记录并核对：台账覆盖数",
      "记录并核对：一致数",
      "记录并核对：关键设备识别数",
      "核对新增"
    ],
    "sampling": [
      "关键设备全部核对清单，现场抽查不少于10台设备，覆盖机械、电气、自控和不同工段。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "现场设备总数或抽查数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录现场设备总数或抽查数"
      },
      {
        "key": "fact_2",
        "label": "台账覆盖数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录台账覆盖数"
      },
      {
        "key": "fact_3",
        "label": "一致数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录一致数"
      },
      {
        "key": "fact_4",
        "label": "关键设备识别数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录关键设备识别数"
      },
      {
        "key": "fact_5",
        "label": "新增",
        "type": "text",
        "placeholder": "记录新增"
      },
      {
        "key": "fact_6",
        "label": "移装",
        "type": "text",
        "placeholder": "记录移装"
      },
      {
        "key": "fact_7",
        "label": "停用设备及时更新数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录停用设备及时更新数"
      }
    ],
    "decision": {
      "compliant": "台账覆盖率和一致率100%、关键设备识别合理",
      "partial": "少量一般设备信息缺项",
      "nonCompliant": "关键设备未建账、编码混乱、账实大面积不符或分级不能支撑维护策略",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "设备漏账",
      "编码重复",
      "信息错误",
      "分级不合理",
      "变更未更新",
      "账实不符"
    ],
    "evidence": "设备台账、关键设备清单和现场核对记录",
    "closeCondition": "完成更新并重新抽查不少于10台。",
    "method": "比例型＋清单型，系统预判＋人工确认",
    "boundary": ""
  },
  "EQP-A04": {
    "overview": "重要设备档案包含适用的图纸、说明书、参数、合格证明、调试、履历、故障、维修、大修和改造资料，能够支持运行维护。",
    "checkPoints": [
      "核对不少于5台关键设备，优先抽查故障多、改造过或资料移交复杂的设备。",
      "抽查档案数",
      "记录并核对：完整数",
      "记录并核对：必要要素数",
      "记录并核对：具备数",
      "记录并核对：档案与设备现状一致数"
    ],
    "sampling": [
      "不少于5台关键设备，优先抽查故障多、改造过或资料移交复杂的设备。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "抽查档案数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录抽查档案数"
      },
      {
        "key": "fact_2",
        "label": "完整数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录完整数"
      },
      {
        "key": "fact_3",
        "label": "必要要素数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录必要要素数"
      },
      {
        "key": "fact_4",
        "label": "具备数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录具备数"
      },
      {
        "key": "fact_5",
        "label": "档案与设备现状一致数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录档案与设备现状一致数"
      }
    ],
    "decision": {
      "compliant": "抽查档案完整且一致",
      "partial": "一般资料缺失",
      "nonCompliant": "关键技术资料缺失导致无法安全维护、档案与设备明显不符或维修改造履历无法追溯",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "说明书缺失",
      "图纸缺失",
      "参数错误",
      "履历缺失",
      "改造未归档",
      "档案与现状不符"
    ],
    "evidence": "抽查设备档案",
    "closeCondition": "补齐或重建必要资料并经现场验证。",
    "method": "清单型，系统辅助＋人工确认",
    "boundary": ""
  },
  "EQP-B01": {
    "overview": "依据设备分级、制造商要求、环境和历史故障制定点检标准、路线、周期、项目和异常判定条件，并随设备变化更新。",
    "checkPoints": [
      "核对全部关键设备覆盖，抽查不少于5份点检标准。",
      "记录并核对：应纳入点检设备数",
      "记录并核对：已纳入数",
      "抽查标准数",
      "记录并核对：要素完整数",
      "记录并核对：关键设备点检周期符合数"
    ],
    "sampling": [
      "核对全部关键设备覆盖，抽查不少于5份点检标准。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "应纳入点检设备数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录应纳入点检设备数"
      },
      {
        "key": "fact_2",
        "label": "已纳入数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录已纳入数"
      },
      {
        "key": "fact_3",
        "label": "抽查标准数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录抽查标准数"
      },
      {
        "key": "fact_4",
        "label": "要素完整数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录要素完整数"
      },
      {
        "key": "fact_5",
        "label": "关键设备点检周期符合数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录关键设备点检周期符合数"
      }
    ],
    "decision": {
      "compliant": "覆盖率和标准完整率100%",
      "partial": "一般设备或一般要素缺失",
      "nonCompliant": "关键设备无点检标准、周期明显不合理或仅有形式化清单无判定条件",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "关键设备未覆盖",
      "点检项目缺失",
      "周期不合理",
      "异常标准不清",
      "设备变化未更新"
    ],
    "evidence": "点检计划和标准",
    "closeCondition": "修订后用一个完整点检周期验证。",
    "method": "比例型＋清单型，系统预判＋人工确认",
    "boundary": ""
  },
  "EQP-B02": {
    "overview": "点检任务按计划执行，记录真实反映温度、振动、声音、电流、压力、液位、泄漏和其他适用状态，不以批量勾选替代实际检查。",
    "checkPoints": [
      "最近3个月不少于10份点检工单，覆盖关键设备、不同人员和班次。",
      "记录并核对：应完成工单数",
      "按期完成数",
      "抽查工单数",
      "记录并核对：真实完整数",
      "记录并核对：异常值与现场或趋势一致数"
    ],
    "sampling": [
      "最近3个月不少于10份点检工单，覆盖关键设备、不同人员和班次。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "应完成工单数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录应完成工单数"
      },
      {
        "key": "fact_2",
        "label": "按期完成数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录按期完成数"
      },
      {
        "key": "fact_3",
        "label": "抽查工单数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录抽查工单数"
      },
      {
        "key": "fact_4",
        "label": "真实完整数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录真实完整数"
      },
      {
        "key": "fact_5",
        "label": "异常值与现场或趋势一致数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录异常值与现场或趋势一致数"
      },
      {
        "key": "fact_6",
        "label": "是否存在批量补填",
        "type": "boolean",
        "placeholder": "请选择"
      }
    ],
    "decision": {
      "compliant": "完成率和记录符合率100%",
      "partial": "少量一般逾期或缺项",
      "nonCompliant": "关键点检长期漏做、记录明显复制或伪造、现场严重缺陷但记录一直正常",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。",
      "critical": "确认造假按关键控制失效。"
    },
    "problemTags": [
      "点检漏做",
      "点检逾期",
      "记录不完整",
      "记录复制",
      "状态记录不实",
      "异常未记录"
    ],
    "evidence": "点检计划、工单、现场或趋势核对",
    "closeCondition": "纠正机制后连续抽查10份工单。",
    "method": "比例型＋清单型，系统预判＋人工确认",
    "boundary": ""
  },
  "EQP-B03": {
    "overview": "点检发现的异常按风险分级，及时转为观察、维护、维修、停机或其他明确任务，设定责任和期限并验证关闭。",
    "checkPoints": [
      "最近3个月异常全部或不少于10项，重大异常全部。",
      "记录并核对：发现异常数",
      "记录并核对：正确分级数",
      "记录并核对：形成任务数",
      "按期闭环数",
      "记录并核对：关闭后验证数"
    ],
    "sampling": [
      "最近3个月异常全部或不少于10项，重大异常全部。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "发现异常数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录发现异常数"
      },
      {
        "key": "fact_2",
        "label": "正确分级数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录正确分级数"
      },
      {
        "key": "fact_3",
        "label": "形成任务数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录形成任务数"
      },
      {
        "key": "fact_4",
        "label": "按期闭环数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录按期闭环数"
      },
      {
        "key": "fact_5",
        "label": "关闭后验证数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录关闭后验证数"
      },
      {
        "key": "fact_6",
        "label": "逾期和重复异常数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录逾期和重复异常数"
      }
    ],
    "decision": {
      "compliant": "异常转办率、按期闭环率、验证率均100%",
      "partial": "少量一般逾期",
      "nonCompliant": "关键异常未转办、虚假关闭或带重大缺陷继续运行无措施",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "异常未分级",
      "未转工单",
      "责任期限缺失",
      "整改逾期",
      "关闭无验证",
      "虚假关闭"
    ],
    "evidence": "点检异常、后续工单和验证记录",
    "closeCondition": "完成真实维修或控制并复核。",
    "method": "比例型＋清单型，系统预判＋人工确认",
    "boundary": ""
  },
  "EQP-B04": {
    "overview": "定期评估关键设备健康状态、故障风险、备用能力和对生产的影响；无备用、降能力或带病运行时具有经批准的控制措施和恢复计划。",
    "checkPoints": [
      "核对关键设备全部检查清单，现场重点抽查不少于5台。",
      "记录并核对：关键设备数",
      "记录并核对：完成评估数",
      "记录并核对：状态异常数",
      "记录并核对：有控制措施数",
      "记录并核对：应具备备用数"
    ],
    "sampling": [
      "关键设备全部检查清单，现场重点抽查不少于5台。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "关键设备数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录关键设备数"
      },
      {
        "key": "fact_2",
        "label": "完成评估数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录完成评估数"
      },
      {
        "key": "fact_3",
        "label": "状态异常数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录状态异常数"
      },
      {
        "key": "fact_4",
        "label": "有控制措施数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录有控制措施数"
      },
      {
        "key": "fact_5",
        "label": "应具备备用数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录应具备备用数"
      },
      {
        "key": "fact_6",
        "label": "有效备用数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录有效备用数"
      },
      {
        "key": "fact_7",
        "label": "风险逾期数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录风险逾期数"
      }
    ],
    "decision": {
      "compliant": "评估覆盖100%，重大风险有有效措施",
      "partial": "一般评估或措施不足",
      "nonCompliant": "关键设备状态不明、无备用且无控制、重大缺陷长期带病运行或虚报备用能力",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "状态未评估",
      "备用失效",
      "无备用措施",
      "带病运行",
      "恢复计划缺失",
      "风险逾期"
    ],
    "evidence": "状态评估、备用试验和风险措施",
    "closeCondition": "恢复功能或验证临时措施有效。",
    "method": "清单型，系统辅助＋人工确认",
    "boundary": ""
  },
  "EQP-C01": {
    "overview": "所有适用设备具有与分级相匹配的年度维护计划，关键设备依据制造商、标准和状态要求制定，并分解到月度或周期任务。",
    "checkPoints": [
      "记录并核对：应制定计划设备数",
      "记录并核对：已制定数",
      "记录并核对：关键设备计划覆盖率",
      "记录并核对：当期应执行数",
      "记录并核对：实际按期数",
      "记录并核对：计划变更批准数"
    ],
    "sampling": [
      "执行本模块通用检查窗口与抽样基线；实际数量不足时全部检查。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "应制定计划设备数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录应制定计划设备数"
      },
      {
        "key": "fact_2",
        "label": "已制定数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录已制定数"
      },
      {
        "key": "fact_3",
        "label": "关键设备计划覆盖率",
        "type": "number",
        "unit": "%",
        "placeholder": "记录关键设备计划覆盖率"
      },
      {
        "key": "fact_4",
        "label": "当期应执行数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录当期应执行数"
      },
      {
        "key": "fact_5",
        "label": "实际按期数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录实际按期数"
      },
      {
        "key": "fact_6",
        "label": "计划变更批准数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录计划变更批准数"
      }
    ],
    "decision": {
      "compliant": "覆盖率和当期执行率100%",
      "partial": "一般设备少量缺项",
      "nonCompliant": "关键设备无计划、计划与分级无关或大面积逾期",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "维护计划缺失",
      "关键设备未覆盖",
      "周期不合理",
      "计划未分解",
      "计划变更无批准"
    ],
    "evidence": "年度月度计划及完成记录",
    "closeCondition": "补强计划并完成一个周期验证。",
    "method": "比例型＋清单型，系统预判＋人工确认",
    "boundary": ""
  },
  "EQP-C02": {
    "overview": "点检、维护、维修、大修及其他设备作业使用适当工单，真实记录设备、故障或任务、作业内容、人员、时间、物料、风险衔接和结果。",
    "checkPoints": [
      "记录并核对：各主要工单类型不少于3份，总数不少于10份。",
      "记录并核对：应使用工单事项数",
      "记录并核对：实际使用数",
      "抽查工单数",
      "记录并核对：内容完整数",
      "记录并核对：工单与现场或设备履历一致数"
    ],
    "sampling": [
      "各主要工单类型不少于3份，总数不少于10份。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "应使用工单事项数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录应使用工单事项数"
      },
      {
        "key": "fact_2",
        "label": "实际使用数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录实际使用数"
      },
      {
        "key": "fact_3",
        "label": "抽查工单数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录抽查工单数"
      },
      {
        "key": "fact_4",
        "label": "内容完整数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录内容完整数"
      },
      {
        "key": "fact_5",
        "label": "工单与现场或设备履历一致数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录工单与现场或设备履历一致数"
      }
    ],
    "decision": {
      "compliant": "工单使用率、完整率和一致率100%",
      "partial": "一般要素缺失",
      "nonCompliant": "大量作业无工单、工单与实际不符或不能追溯设备履历",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "作业无工单",
      "工单类型错误",
      "要素缺失",
      "内容不实",
      "物料不可追溯",
      "履历未更新"
    ],
    "evidence": "工单、现场或履历核对",
    "closeCondition": "连续抽查10份后续工单符合。",
    "method": "比例型＋清单型，系统预判＋人工确认",
    "boundary": ""
  },
  "EQP-C03": {
    "overview": "维护维修执行适用技术标准和工序要求，关键拆装、测试、调试和质量点有记录；完工后确认质量、功能、现场恢复和移交。",
    "checkPoints": [
      "最近3个月不少于5项维修和5项维护作业，重大维修全部。",
      "抽查作业数",
      "记录并核对：具有技术依据数",
      "记录并核对：关键质量点记录数",
      "记录并核对：完成验收数",
      "记录并核对：返工或遗留缺陷数"
    ],
    "sampling": [
      "最近3个月不少于5项维修和5项维护作业，重大维修全部。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "抽查作业数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录抽查作业数"
      },
      {
        "key": "fact_2",
        "label": "具有技术依据数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录具有技术依据数"
      },
      {
        "key": "fact_3",
        "label": "关键质量点记录数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录关键质量点记录数"
      },
      {
        "key": "fact_4",
        "label": "完成验收数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录完成验收数"
      },
      {
        "key": "fact_5",
        "label": "返工或遗留缺陷数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录返工或遗留缺陷数"
      }
    ],
    "decision": {
      "compliant": "技术依据、质量记录和验收完整",
      "partial": "非关键要素不足",
      "nonCompliant": "关键维修无技术控制、未验收即投运或维修后遗留重大缺陷",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "技术依据缺失",
      "关键工序无记录",
      "测试缺失",
      "验收缺失",
      "现场未恢复",
      "维修质量不合格"
    ],
    "evidence": "工单、技术记录、测试验收",
    "closeCondition": "重新验证功能和质量后关闭。",
    "method": "清单型，系统辅助＋人工确认",
    "boundary": ""
  },
  "EQP-C04": {
    "overview": "故障修复后验证设备功能和稳定运行；重复或重大故障识别根因、影响和预防措施，跟踪复发情况。",
    "checkPoints": [
      "最近12个月重大故障全部，重复故障全部，一般故障不少于5件。",
      "记录并核对：故障数",
      "记录并核对：完成修复验证数",
      "记录并核对：重复或重大故障数",
      "记录并核对：完成根因分析数",
      "记录并核对：措施闭环数"
    ],
    "sampling": [
      "最近12个月重大故障全部，重复故障全部，一般故障不少于5件。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "故障数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录故障数"
      },
      {
        "key": "fact_2",
        "label": "完成修复验证数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录完成修复验证数"
      },
      {
        "key": "fact_3",
        "label": "重复或重大故障数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录重复或重大故障数"
      },
      {
        "key": "fact_4",
        "label": "完成根因分析数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录完成根因分析数"
      },
      {
        "key": "fact_5",
        "label": "措施闭环数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录措施闭环数"
      },
      {
        "key": "fact_6",
        "label": "观察期内复发数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录观察期内复发数"
      }
    ],
    "decision": {
      "compliant": "修复验证和应分析故障闭环100%",
      "partial": "少量分析或观察不足",
      "nonCompliant": "重大或重复故障只换件不分析、修复后未验证、同类故障持续发生未升级",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "修复未验证",
      "重复故障未识别",
      "根因分析表面化",
      "措施无效",
      "观察期不足",
      "复发未升级"
    ],
    "evidence": "故障工单、根因分析、措施和观察记录",
    "closeCondition": "达到设定稳定运行期并确认措施有效。",
    "method": "清单型，系统辅助＋人工确认",
    "boundary": ""
  },
  "EQP-C05": {
    "overview": "设备作业识别对生产运行、工艺水质、人员安全和环境的影响；涉及停机、切换、危险作业或检测验证时，运行、安全、化验等相关方完成确认和移交。",
    "checkPoints": [
      "最近6个月关键设备维修和停机作业不少于5项，重大作业全部。",
      "记录并核对：需要协同作业数",
      "记录并核对：完成协同数",
      "记录并核对：停机切换确认数",
      "记录并核对：作业前后移交数",
      "记录并核对：遗留风险是否明确"
    ],
    "sampling": [
      "最近6个月关键设备维修和停机作业不少于5项，重大作业全部。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "需要协同作业数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录需要协同作业数"
      },
      {
        "key": "fact_2",
        "label": "完成协同数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录完成协同数"
      },
      {
        "key": "fact_3",
        "label": "停机切换确认数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录停机切换确认数"
      },
      {
        "key": "fact_4",
        "label": "作业前后移交数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录作业前后移交数"
      },
      {
        "key": "fact_5",
        "label": "遗留风险是否明确",
        "type": "boolean",
        "placeholder": "请选择"
      }
    ],
    "decision": {
      "compliant": "应协同事项全部闭环",
      "partial": "一般移交要素缺失",
      "nonCompliant": "关键停机、切换或危险作业未经相关专业确认，造成重大风险",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "运行未确认",
      "安全未交底",
      "化验验证缺失",
      "停机切换未协调",
      "完工未移交",
      "遗留风险不明"
    ],
    "evidence": "工单协同记录、调控或作业许可关联、移交记录",
    "closeCondition": "通过后续真实作业验证。",
    "method": "清单型，系统辅助＋人工确认",
    "boundary": ""
  },
  "EQP-D01": {
    "overview": "进出水流量计及其他适用计量器具具有清单和周期要求，按法律、技术规范、合同或内部控制要求检定、校准或核查；状态标识有效，超期或失准器具受到限制。",
    "checkPoints": [
      "核对进出水流量计全部，其他关键计量器具不少于5台。",
      "记录并核对：应管理器具数",
      "记录并核对：有效数",
      "记录并核对：超期数",
      "记录并核对：异常器具隔离数",
      "记录并核对：证书与现场一致数"
    ],
    "sampling": [
      "进出水流量计全部，其他关键计量器具不少于5台。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "应管理器具数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录应管理器具数"
      },
      {
        "key": "fact_2",
        "label": "有效数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录有效数"
      },
      {
        "key": "fact_3",
        "label": "超期数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录超期数"
      },
      {
        "key": "fact_4",
        "label": "异常器具隔离数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录异常器具隔离数"
      },
      {
        "key": "fact_5",
        "label": "证书与现场一致数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录证书与现场一致数"
      }
    ],
    "decision": {
      "compliant": "有效覆盖率100%且异常受控",
      "partial": "非关键器具少量超期且已隔离",
      "nonCompliant": "关键计量器具超期仍用于正式计量、证书与设备不符或失准未处理",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "检定校准超期",
      "证书不匹配",
      "状态标识错误",
      "失准未隔离",
      "核查缺失"
    ],
    "evidence": "器具清单、证书、状态和异常处置",
    "closeCondition": "恢复有效状态并评估受影响数据。",
    "method": "比例型＋清单型，系统预判＋人工确认",
    "boundary": ""
  },
  "EQP-D02": {
    "overview": "液位、流量、压力、温度、DO等一般过程仪表外观、探头、量程、显示和信号传输正常，异常及时发现、标记和处置。在线水质法定监测仪表不在本项评分。",
    "checkPoints": [
      "记录并核对：不少于10台，覆盖不同工段和参数类型。",
      "抽查仪表数",
      "记录并核对：现场状态正常数",
      "记录并核对：现场与中控一致数",
      "记录并核对：异常数",
      "记录并核对：闭环数"
    ],
    "sampling": [
      "不少于10台，覆盖不同工段和参数类型。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "抽查仪表数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录抽查仪表数"
      },
      {
        "key": "fact_2",
        "label": "现场状态正常数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录现场状态正常数"
      },
      {
        "key": "fact_3",
        "label": "现场与中控一致数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录现场与中控一致数"
      },
      {
        "key": "fact_4",
        "label": "异常数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录异常数"
      },
      {
        "key": "fact_5",
        "label": "闭环数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录闭环数"
      },
      {
        "key": "fact_6",
        "label": "临时替代措施数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录临时替代措施数"
      }
    ],
    "decision": {
      "compliant": "现场正常率、信号一致率和异常闭环率100%",
      "partial": "一般缺陷",
      "nonCompliant": "关键过程仪表大面积失效、长期显示错误且无替代措施",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "探头污染",
      "显示异常",
      "量程不合理",
      "信号中断",
      "现场中控不一致",
      "异常未处理"
    ],
    "evidence": "现场核对、趋势或维修记录",
    "closeCondition": "恢复功能并完成现场—中控一致性复核。",
    "method": "比例型＋清单型，系统预判＋人工确认",
    "boundary": ""
  },
  "EQP-D03": {
    "overview": "中控主机、PLC、通信网络、UPS和适用冗余功能满足生产需要，配置和程序变更受控，故障具有备份、恢复和事件记录。",
    "checkPoints": [
      "核对关键PLC和通信链路全部或不少于5组，最近12个月变更全部。",
      "记录并核对：适用系统数",
      "记录并核对：功能正常数",
      "抽查通信点数",
      "记录并核对：正常数",
      "记录并核对：配置或程序变更数"
    ],
    "sampling": [
      "关键PLC和通信链路全部或不少于5组，最近12个月变更全部。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "适用系统数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录适用系统数"
      },
      {
        "key": "fact_2",
        "label": "功能正常数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录功能正常数"
      },
      {
        "key": "fact_3",
        "label": "抽查通信点数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录抽查通信点数"
      },
      {
        "key": "fact_4",
        "label": "正常数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录正常数"
      },
      {
        "key": "fact_5",
        "label": "配置或程序变更数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录配置或程序变更数"
      },
      {
        "key": "fact_6",
        "label": "批准验证数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录批准验证数"
      },
      {
        "key": "fact_7",
        "label": "备份恢复测试情况",
        "type": "text",
        "placeholder": "记录备份恢复测试情况"
      }
    ],
    "decision": {
      "compliant": "关键功能正常、变更受控、备份可恢复",
      "partial": "一般通信或记录缺陷",
      "nonCompliant": "核心控制系统不可靠、程序变更无控制、备份不可恢复或故障长期无措施",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "通信异常",
      "PLC故障",
      "UPS失效",
      "变更无审批",
      "程序未验证",
      "备份缺失",
      "恢复测试失败"
    ],
    "evidence": "系统状态、变更和备份恢复记录",
    "closeCondition": "完成功能及恢复测试。",
    "method": "清单型，系统辅助＋人工确认",
    "boundary": ""
  },
  "EQP-D04": {
    "overview": "关键设备和系统的联锁、保护、报警和急停功能形成清单和测试周期，按计划测试并保持有效；临时旁路具有授权、风险措施、期限和恢复确认。",
    "checkPoints": [
      "所有关键保护清单复核，现场或记录抽查不少于10个功能点。",
      "记录并核对：应测试功能点数",
      "按期测试数",
      "记录并核对：有效数",
      "记录并核对：旁路数",
      "记录并核对：经批准数"
    ],
    "sampling": [
      "所有关键保护清单复核，现场或记录抽查不少于10个功能点。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "应测试功能点数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录应测试功能点数"
      },
      {
        "key": "fact_2",
        "label": "按期测试数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录按期测试数"
      },
      {
        "key": "fact_3",
        "label": "有效数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录有效数"
      },
      {
        "key": "fact_4",
        "label": "旁路数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录旁路数"
      },
      {
        "key": "fact_5",
        "label": "经批准数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录经批准数"
      },
      {
        "key": "fact_6",
        "label": "按期恢复数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录按期恢复数"
      },
      {
        "key": "fact_7",
        "label": "失效功能是否停止相关运行",
        "type": "boolean",
        "placeholder": "请选择"
      }
    ],
    "decision": {
      "compliant": "测试完成率和有效率100%，旁路全部受控",
      "partial": "非关键功能短期缺陷且有措施",
      "nonCompliant": "关键保护、联锁或急停失效仍继续运行，无控制旁路或虚假测试为不符合，严重情形按关键控制失效。",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "测试逾期",
      "保护失效",
      "联锁失效",
      "急停失效",
      "报警失效",
      "旁路无批准",
      "旁路超期",
      "测试记录不实"
    ],
    "evidence": "功能清单、测试记录、现场抽测和旁路记录",
    "closeCondition": "恢复并完成独立复测。",
    "method": "比例型＋清单型，系统预判＋人工确认",
    "boundary": ""
  },
  "EQP-E01": {
    "overview": "依据关键设备风险、维护计划、交付周期、通用性和历史消耗建立备件保障清单，明确最低保障方式；缺件风险具有替代或采购措施。",
    "checkPoints": [
      "核对关键设备全部核对策略，现场抽查不少于10项关键备件。",
      "记录并核对：关键设备数",
      "记录并核对：备件策略覆盖数",
      "记录并核对：应保障备件数",
      "记录并核对：满足数",
      "记录并核对：缺件风险数"
    ],
    "sampling": [
      "关键设备全部核对策略，现场抽查不少于10项关键备件。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "关键设备数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录关键设备数"
      },
      {
        "key": "fact_2",
        "label": "备件策略覆盖数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录备件策略覆盖数"
      },
      {
        "key": "fact_3",
        "label": "应保障备件数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录应保障备件数"
      },
      {
        "key": "fact_4",
        "label": "满足数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录满足数"
      },
      {
        "key": "fact_5",
        "label": "缺件风险数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录缺件风险数"
      },
      {
        "key": "fact_6",
        "label": "有措施数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录有措施数"
      },
      {
        "key": "fact_7",
        "label": "超储或失效备件数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录超储或失效备件数"
      }
    ],
    "decision": {
      "compliant": "策略覆盖100%，重大缺件风险有措施",
      "partial": "一般缺口",
      "nonCompliant": "关键设备无备件保障且无替代措施、账面有货实际失效或长期无法支持维修",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "关键备件未识别",
      "库存不足",
      "备件失效",
      "替代方案缺失",
      "超储积压",
      "设备与备件不匹配"
    ],
    "evidence": "备件策略、库存及采购计划",
    "closeCondition": "补足保障或验证替代措施。",
    "method": "清单型，系统辅助＋人工确认",
    "boundary": ""
  },
  "EQP-E02": {
    "overview": "备件和维修材料的技术验收、入库、领用、退库、以旧换新和修旧利废记录完整，能够追溯到设备和工单，关键备件储存状态适宜。",
    "checkPoints": [
      "核对不少于10项物料，优先抽查高价值、关键和近期领用物料。",
      "抽查物料数",
      "记录并核对：技术验收数",
      "记录并核对：与工单关联数",
      "记录并核对：账物一致数",
      "记录并核对：以旧换新适用数"
    ],
    "sampling": [
      "不少于10项物料，优先抽查高价值、关键和近期领用物料。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "抽查物料数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录抽查物料数"
      },
      {
        "key": "fact_2",
        "label": "技术验收数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录技术验收数"
      },
      {
        "key": "fact_3",
        "label": "与工单关联数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录与工单关联数"
      },
      {
        "key": "fact_4",
        "label": "账物一致数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录账物一致数"
      },
      {
        "key": "fact_5",
        "label": "以旧换新适用数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录以旧换新适用数"
      },
      {
        "key": "fact_6",
        "label": "执行数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录执行数"
      }
    ],
    "decision": {
      "compliant": "技术和追溯符合率100%",
      "partial": "少量一般缺项",
      "nonCompliant": "关键备件无验收、来源去向不明、账物重大不符或不合格件投入使用",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "技术验收缺失",
      "工单未关联",
      "领退记录缺失",
      "账物不符",
      "以旧换新未执行",
      "储存不当"
    ],
    "evidence": "验收、出入库、工单和现场实物",
    "closeCondition": "完成核对和流程验证。",
    "method": "比例型＋清单型，系统预判＋人工确认",
    "boundary": "采购审批程序由综合管理评分。"
  },
  "EQP-E03": {
    "overview": "委外维护维修具有必要性和技术范围，承包方能力满足要求，水厂对方案、过程质量、关键工序、测试和验收实施技术监督。",
    "checkPoints": [
      "最近12个月重大项目全部，一般项目不少于3个。",
      "记录并核对：委外项目数",
      "记录并核对：完成必要性评估数",
      "记录并核对：技术范围清楚数",
      "记录并核对：过程监督数",
      "记录并核对：验收合格数"
    ],
    "sampling": [
      "最近12个月重大项目全部，一般项目不少于3个。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "委外项目数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录委外项目数"
      },
      {
        "key": "fact_2",
        "label": "完成必要性评估数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录完成必要性评估数"
      },
      {
        "key": "fact_3",
        "label": "技术范围清楚数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录技术范围清楚数"
      },
      {
        "key": "fact_4",
        "label": "过程监督数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录过程监督数"
      },
      {
        "key": "fact_5",
        "label": "验收合格数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录验收合格数"
      },
      {
        "key": "fact_6",
        "label": "遗留问题闭环数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录遗留问题闭环数"
      }
    ],
    "decision": {
      "compliant": "项目技术过程完整",
      "partial": "一般监督记录不足",
      "nonCompliant": "重大委外无技术范围、无过程监督或未验收即投运",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "委外必要性不清",
      "技术范围不清",
      "能力不满足",
      "过程监督缺失",
      "验收缺失",
      "遗留问题未关闭"
    ],
    "evidence": "技术方案、监督、测试验收和遗留清单",
    "closeCondition": "完成质量复核并验证运行。",
    "method": "清单型，系统辅助＋人工确认",
    "boundary": "合同采购程序归综合管理，承包方安全归安全管理。"
  },
  "EQP-F01": {
    "overview": "大修、重置和改造以设备状态、故障风险、寿命、生产需要和经济合理性为依据；年度计划、取消、追加和重要变更履行相应批准。",
    "checkPoints": [
      "最近12个月重大项目全部，一般项目不少于3个。",
      "记录并核对：计划项目数",
      "记录并核对：依据充分数",
      "记录并核对：取消追加变更数",
      "记录并核对：批准数",
      "记录并核对：非正常提前大修数"
    ],
    "sampling": [
      "最近12个月重大项目全部，一般项目不少于3个。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "计划项目数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录计划项目数"
      },
      {
        "key": "fact_2",
        "label": "依据充分数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录依据充分数"
      },
      {
        "key": "fact_3",
        "label": "取消追加变更数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录取消追加变更数"
      },
      {
        "key": "fact_4",
        "label": "批准数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录批准数"
      },
      {
        "key": "fact_5",
        "label": "非正常提前大修数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录非正常提前大修数"
      },
      {
        "key": "fact_6",
        "label": "完成专项分析数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录完成专项分析数"
      }
    ],
    "decision": {
      "compliant": "项目依据和变更控制完整",
      "partial": "一般项目资料不足",
      "nonCompliant": "重大项目无状态依据、随意取消追加或异常提前大修未分析",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "状态依据缺失",
      "计划无批准",
      "取消无评估",
      "追加无批准",
      "预算变更未审批",
      "非正常大修未分析"
    ],
    "evidence": "状态评估、计划和变更批准",
    "closeCondition": "完成补充评估并落实决策。",
    "method": "清单型，系统辅助＋人工确认",
    "boundary": ""
  },
  "EQP-F02": {
    "overview": "项目方案、采购技术配合、施工、调试、性能验证、验收、培训和资料移交完整；改造后的台账、图纸、程序和维护要求同步更新。",
    "checkPoints": [
      "抽查项目数",
      "记录并核对：关键阶段完整数",
      "记录并核对：性能验证合格数",
      "记录并核对：资料移交数",
      "记录并核对：台账图纸更新数",
      "记录并核对：遗留问题闭环数"
    ],
    "sampling": [
      "执行本模块通用检查窗口与抽样基线；实际数量不足时全部检查。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "抽查项目数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录抽查项目数"
      },
      {
        "key": "fact_2",
        "label": "关键阶段完整数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录关键阶段完整数"
      },
      {
        "key": "fact_3",
        "label": "性能验证合格数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录性能验证合格数"
      },
      {
        "key": "fact_4",
        "label": "资料移交数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录资料移交数"
      },
      {
        "key": "fact_5",
        "label": "台账图纸更新数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录台账图纸更新数"
      },
      {
        "key": "fact_6",
        "label": "遗留问题闭环数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录遗留问题闭环数"
      }
    ],
    "decision": {
      "compliant": "关键阶段、性能和资料全部闭环",
      "partial": "非关键资料不足",
      "nonCompliant": "重大项目未调试验收即投运、性能未达目标无处理、资料完全缺失",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "方案不完整",
      "调试缺失",
      "性能未验证",
      "验收缺失",
      "培训缺失",
      "资料未移交",
      "台账图纸未更新"
    ],
    "evidence": "项目全过程和性能资料",
    "closeCondition": "完成验证、移交和更新后关闭。",
    "method": "清单型，系统辅助＋人工确认",
    "boundary": ""
  },
  "EQP-F03": {
    "overview": "更换下的关键部件、闲置设备和拟报废设备完成状态鉴定、分类、标识和技术建议，可修复利用的得到保护，移交处置过程可追溯。",
    "checkPoints": [
      "核对现场全部重大闲置或拟报废设备，另抽查不少于5项更换部件。",
      "抽查对象数",
      "记录并核对：状态鉴定数",
      "记录并核对：分类标识数",
      "记录并核对：技术建议数",
      "记录并核对：已移交数"
    ],
    "sampling": [
      "现场全部重大闲置或拟报废设备，另抽查不少于5项更换部件。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "抽查对象数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录抽查对象数"
      },
      {
        "key": "fact_2",
        "label": "状态鉴定数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录状态鉴定数"
      },
      {
        "key": "fact_3",
        "label": "分类标识数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录分类标识数"
      },
      {
        "key": "fact_4",
        "label": "技术建议数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录技术建议数"
      },
      {
        "key": "fact_5",
        "label": "已移交数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录已移交数"
      },
      {
        "key": "fact_6",
        "label": "可利用对象保养数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录可利用对象保养数"
      }
    ],
    "decision": {
      "compliant": "对象状态清楚、技术建议和移交完整",
      "partial": "一般标识或记录缺陷",
      "nonCompliant": "关键部件去向不明、闲置设备严重损坏无人管理或报废无技术依据",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "状态未鉴定",
      "分类标识缺失",
      "关键部件去向不明",
      "闲置设备未保养",
      "报废依据不足",
      "移交记录缺失"
    ],
    "evidence": "状态清单、现场和移交记录",
    "closeCondition": "完成鉴定分类及正式移交。",
    "method": "清单型，系统辅助＋人工确认",
    "boundary": "资产审批和账务处理归综合管理。"
  },
  "EQP-G01": {
    "overview": "月度分析覆盖计划和工单执行、故障停机、重复故障、维护维修费用、大修、备件、关键风险、资源需求和上月改进，结论可追溯并形成下月重点。",
    "checkPoints": [
      "最近3个月应完成数",
      "按期数",
      "记录并核对：适用要素数",
      "记录并核对：覆盖数",
      "抽查结论数",
      "记录并核对：可追溯数"
    ],
    "sampling": [
      "执行本模块通用检查窗口与抽样基线；实际数量不足时全部检查。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "最近3个月应完成数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录最近3个月应完成数"
      },
      {
        "key": "fact_2",
        "label": "按期数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录按期数"
      },
      {
        "key": "fact_3",
        "label": "适用要素数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录适用要素数"
      },
      {
        "key": "fact_4",
        "label": "覆盖数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录覆盖数"
      },
      {
        "key": "fact_5",
        "label": "抽查结论数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录抽查结论数"
      },
      {
        "key": "fact_6",
        "label": "可追溯数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录可追溯数"
      },
      {
        "key": "fact_7",
        "label": "改进事项形成数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录改进事项形成数"
      }
    ],
    "decision": {
      "compliant": "完成率、覆盖率和结论可追溯率100%",
      "partial": "个别要素不足",
      "nonCompliant": "无分析、只罗列工单数量、结论无依据或连续复制",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "分析缺失",
      "要素不全",
      "只统计不分析",
      "结论无依据",
      "故障未分析",
      "改进未形成"
    ],
    "evidence": "最近3个月分析和基础工单",
    "closeCondition": "连续完成2个月有效分析。",
    "method": "比例型＋清单型，系统预判＋人工确认",
    "boundary": "费用结果高低本身不直接决定得分。"
  },
  "EQP-G02": {
    "overview": "设备、管线、阀门、控制柜和适用状态标识清楚准确；机修和检修区域分区合理，工具、备件和拆卸件有序，检修结束后现场恢复。",
    "checkPoints": [
      "核对不少于10台设备或管线点位及全部适用检修区域。",
      "抽查设备或管线数",
      "记录并核对：标识符合数",
      "抽查区域数",
      "记录并核对：现场符合数",
      "记录并核对：检修结束恢复数"
    ],
    "sampling": [
      "不少于10台设备或管线点位及全部适用检修区域。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "抽查设备或管线数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录抽查设备或管线数"
      },
      {
        "key": "fact_2",
        "label": "标识符合数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录标识符合数"
      },
      {
        "key": "fact_3",
        "label": "抽查区域数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录抽查区域数"
      },
      {
        "key": "fact_4",
        "label": "现场符合数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录现场符合数"
      },
      {
        "key": "fact_5",
        "label": "检修结束恢复数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录检修结束恢复数"
      },
      {
        "key": "fact_6",
        "label": "影响操作或误操作风险数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录影响操作或误操作风险数"
      }
    ],
    "decision": {
      "compliant": "标识和现场符合率100%",
      "partial": "一般缺陷",
      "nonCompliant": "关键设备标识错误可能导致误操作、检修现场长期混乱影响维护或遗留重大风险",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "设备标识缺失",
      "编号错误",
      "介质流向错误",
      "状态标识错误",
      "检修区域混乱",
      "拆卸件无标识",
      "完工未恢复"
    ],
    "evidence": "现场检查和代表性照片",
    "closeCondition": "整改后现场复核。",
    "method": "比例型＋清单型，系统预判＋人工确认",
    "boundary": "安全警示标志由安全模块主评。"
  }
}
