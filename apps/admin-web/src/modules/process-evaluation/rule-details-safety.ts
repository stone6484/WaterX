import type { ProcessRuleDetail } from './types'

export const SAFETY_RULE_DETAILS: Record<string, ProcessRuleDetail> = {
  "SAF-A01": {
    "overview": "主要负责人、分管负责人、安全管理人员、部门及岗位责任清晰，适用岗位依法配置人员并落实履职。",
    "checkPoints": [
      "记录并核对：应覆盖责任数",
      "记录并核对：已覆盖数",
      "记录并核对：法定或内部关键岗位应配置数",
      "记录并核对：实际配置数",
      "抽查人员数",
      "记录并核对：能说明本岗责任人数"
    ],
    "sampling": [
      "执行本模块通用检查窗口与抽样基线；实际数量不足时全部检查。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "应覆盖责任数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录应覆盖责任数"
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
        "label": "法定或内部关键岗位应配置数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录法定或内部关键岗位应配置数"
      },
      {
        "key": "fact_4",
        "label": "实际配置数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录实际配置数"
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
        "label": "能说明本岗责任人数",
        "type": "number",
        "unit": "人",
        "placeholder": "记录能说明本岗责任人数"
      },
      {
        "key": "fact_7",
        "label": "履职记录完整数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录履职记录完整数"
      }
    ],
    "decision": {
      "compliant": "责任和关键岗位覆盖100%，抽查人员均能说明并有履职证据",
      "partial": "个别非关键职责不清",
      "nonCompliant": "主要责任缺失、法定人员未配置、责任长期悬空或材料与实际明显不符",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "责任缺失",
      "机构未设置",
      "人员未配置",
      "授权不清",
      "履职无证据",
      "责任与实际不符"
    ],
    "evidence": "责任制、任命授权和代表性履职记录",
    "closeCondition": "补齐后以至少3项真实工作验证。",
    "method": "清单型，系统辅助＋人工确认",
    "boundary": ""
  },
  "SAF-A02": {
    "overview": "年度安全目标和计划覆盖主要风险、法定任务及上年问题，明确责任、时间和资源并定期跟踪。",
    "checkPoints": [
      "记录并核对：应分解任务数",
      "记录并核对：已分解数",
      "记录并核对：当期应完成数",
      "按期完成数",
      "记录并核对：逾期数",
      "记录并核对：升级数"
    ],
    "sampling": [
      "执行本模块通用检查窗口与抽样基线；实际数量不足时全部检查。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "应分解任务数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录应分解任务数"
      },
      {
        "key": "fact_2",
        "label": "已分解数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录已分解数"
      },
      {
        "key": "fact_3",
        "label": "当期应完成数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录当期应完成数"
      },
      {
        "key": "fact_4",
        "label": "按期完成数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录按期完成数"
      },
      {
        "key": "fact_5",
        "label": "逾期数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录逾期数"
      },
      {
        "key": "fact_6",
        "label": "升级数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录升级数"
      },
      {
        "key": "fact_7",
        "label": "上年遗留问题纳入数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录上年遗留问题纳入数"
      }
    ],
    "decision": {
      "compliant": "目标任务覆盖且当期按期完成率100%",
      "partial": "一般任务少量逾期但受控",
      "nonCompliant": "计划与实际风险脱节、重大任务漏项或多项长期逾期未升级",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "目标未分解",
      "计划漏项",
      "责任期限缺失",
      "任务逾期",
      "遗留问题未纳入"
    ],
    "evidence": "年度计划、跟踪记录和完成证据",
    "closeCondition": "完成任务或批准调整并验证风险受控。",
    "method": "比例型＋清单型，系统预判＋人工确认",
    "boundary": ""
  },
  "SAF-A03": {
    "overview": "安全制度、操作规程和现场处置要求覆盖适用风险，版本有效、本地化并与岗位和现场一致。",
    "checkPoints": [
      "记录并核对：应覆盖主题数",
      "记录并核对：有效数",
      "抽查规程数",
      "记录并核对：现场适用数",
      "抽查人员正确掌握数",
      "记录并核对：旧版是否撤除"
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
        "label": "抽查规程数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录抽查规程数"
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
        "label": "抽查人员正确掌握数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录抽查人员正确掌握数"
      },
      {
        "key": "fact_6",
        "label": "旧版是否撤除",
        "type": "boolean",
        "placeholder": "请选择"
      }
    ],
    "decision": {
      "compliant": "覆盖率、有效率和现场一致率100%",
      "partial": "非关键要素不足",
      "nonCompliant": "危险作业或关键岗位无规程、规程与现场明显矛盾、失效文件继续使用",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "制度缺失",
      "规程缺失",
      "版本失效",
      "现场不适用",
      "旧版未撤",
      "人员不掌握"
    ],
    "evidence": "制度目录、代表性规程及现场访谈",
    "closeCondition": "修订宣贯后用真实作业验证。",
    "method": "比例型＋清单型，系统预判＋人工确认",
    "boundary": ""
  },
  "SAF-A04": {
    "overview": "安全投入计划能够覆盖已识别风险，审批、使用和验收可追溯；紧急安全需求具有快速处理机制。",
    "checkPoints": [
      "记录并核对：计划项目数",
      "记录并核对：已批准数",
      "记录并核对：已实施数",
      "记录并核对：风险清单中需投入事项数",
      "记录并核对：已落实数",
      "记录并核对：重大缺口数及临时措施"
    ],
    "sampling": [
      "执行本模块通用检查窗口与抽样基线；实际数量不足时全部检查。"
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
        "label": "已批准数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录已批准数"
      },
      {
        "key": "fact_3",
        "label": "已实施数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录已实施数"
      },
      {
        "key": "fact_4",
        "label": "风险清单中需投入事项数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录风险清单中需投入事项数"
      },
      {
        "key": "fact_5",
        "label": "已落实数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录已落实数"
      },
      {
        "key": "fact_6",
        "label": "重大缺口数及临时措施",
        "type": "number",
        "unit": "项",
        "placeholder": "记录重大缺口数及临时措施"
      }
    ],
    "decision": {
      "compliant": "风险相关投入均落实或有有效替代措施",
      "partial": "一般项目延期但风险受控",
      "nonCompliant": "重大风险因资源未落实而持续暴露、挪用安全投入或记录不实",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "投入计划缺失",
      "风险未覆盖",
      "资金未落实",
      "采购逾期",
      "临时措施缺失",
      "记录不实"
    ],
    "evidence": "计划审批、采购验收及现场状态",
    "closeCondition": "资源到位或临时措施验证有效。",
    "method": "清单型，系统辅助＋人工确认",
    "boundary": ""
  },
  "SAF-B01": {
    "overview": "新员工、转岗、复岗及采用新工艺、新技术、新材料、新设备涉及人员，在独立上岗前完成适用层级的教育、实操训练和考核。",
    "checkPoints": [
      "最近12个月相关人员全部或不少于10人。",
      "记录并核对：应培训人数",
      "记录并核对：完成并合格人数",
      "记录并核对：独立上岗前完成数",
      "记录并核对：培训内容与岗位风险匹配数",
      "记录并核对：补训数"
    ],
    "sampling": [
      "最近12个月相关人员全部或不少于10人。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "应培训人数",
        "type": "number",
        "unit": "人",
        "placeholder": "记录应培训人数"
      },
      {
        "key": "fact_2",
        "label": "完成并合格人数",
        "type": "number",
        "unit": "人",
        "placeholder": "记录完成并合格人数"
      },
      {
        "key": "fact_3",
        "label": "独立上岗前完成数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录独立上岗前完成数"
      },
      {
        "key": "fact_4",
        "label": "培训内容与岗位风险匹配数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录培训内容与岗位风险匹配数"
      },
      {
        "key": "fact_5",
        "label": "补训数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录补训数"
      }
    ],
    "decision": {
      "compliant": "覆盖率、合格率和上岗前完成率100%",
      "partial": "个别一般资料缺项",
      "nonCompliant": "未培训或考核不合格即独立从事高风险工作、培训明显代签或造假",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "培训漏项",
      "上岗前未完成",
      "内容不匹配",
      "考核缺失",
      "代签",
      "记录造假"
    ],
    "evidence": "人员变动清单、培训考核和访谈",
    "closeCondition": "补训合格并现场验证行为。",
    "method": "比例型＋清单型，系统预判＋人工确认",
    "boundary": ""
  },
  "SAF-B02": {
    "overview": "主要负责人、安全管理人员、特种作业和特种设备作业人员等适用人员资格有效，岗位、作业类别和证件范围相符。",
    "checkPoints": [
      "记录并核对：应持证人数",
      "记录并核对：有效人数",
      "记录并核对：证岗一致人数",
      "记录并核对：即将到期数",
      "记录并核对：已安排复审数",
      "记录并核对：无证或超范围作业数"
    ],
    "sampling": [
      "执行本模块通用检查窗口与抽样基线；实际数量不足时全部检查。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "应持证人数",
        "type": "number",
        "unit": "人",
        "placeholder": "记录应持证人数"
      },
      {
        "key": "fact_2",
        "label": "有效人数",
        "type": "number",
        "unit": "人",
        "placeholder": "记录有效人数"
      },
      {
        "key": "fact_3",
        "label": "证岗一致人数",
        "type": "number",
        "unit": "人",
        "placeholder": "记录证岗一致人数"
      },
      {
        "key": "fact_4",
        "label": "即将到期数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录即将到期数"
      },
      {
        "key": "fact_5",
        "label": "已安排复审数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录已安排复审数"
      },
      {
        "key": "fact_6",
        "label": "无证或超范围作业数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录无证或超范围作业数"
      }
    ],
    "decision": {
      "compliant": "有效率和证岗一致率100%",
      "partial": "证件临期但已安排且未影响作业",
      "nonCompliant": "无证、过期或超范围从事对应作业为不符合，并按关键控制失效处理。",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "无证上岗",
      "证件过期",
      "超范围作业",
      "证岗不符",
      "复审未安排",
      "证件信息不实"
    ],
    "evidence": "人员清单、证件核验和排班作业记录",
    "closeCondition": "取得有效资格并停止不合规作业后关闭。",
    "method": "比例型＋清单型，系统预判＋人工确认",
    "boundary": ""
  },
  "SAF-B03": {
    "overview": "安全会议、班前提示和专项沟通针对近期风险、异常作业、天气、事故教训和控制要求，传达到实际相关人员。",
    "checkPoints": [
      "记录并核对：应开展次数",
      "记录并核对：实际开展数",
      "抽查内容中有针对性数",
      "记录并核对：应参加人数",
      "记录并核对：实际覆盖数",
      "记录并核对：措施转任务数"
    ],
    "sampling": [
      "执行本模块通用检查窗口与抽样基线；实际数量不足时全部检查。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "应开展次数",
        "type": "number",
        "unit": "次",
        "placeholder": "记录应开展次数"
      },
      {
        "key": "fact_2",
        "label": "实际开展数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录实际开展数"
      },
      {
        "key": "fact_3",
        "label": "抽查内容中有针对性数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录抽查内容中有针对性数"
      },
      {
        "key": "fact_4",
        "label": "应参加人数",
        "type": "number",
        "unit": "人",
        "placeholder": "记录应参加人数"
      },
      {
        "key": "fact_5",
        "label": "实际覆盖数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录实际覆盖数"
      },
      {
        "key": "fact_6",
        "label": "措施转任务数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录措施转任务数"
      },
      {
        "key": "fact_7",
        "label": "闭环数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录闭环数"
      }
    ],
    "decision": {
      "compliant": "按计划开展、内容有针对性且任务闭环",
      "partial": "少量一般人员漏覆盖",
      "nonCompliant": "长期只签到无实质内容、重大风险未传达或措施无人落实",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "会议漏开",
      "内容空泛",
      "人员漏传达",
      "风险未提示",
      "任务未闭环",
      "记录代签"
    ],
    "evidence": "会议或班前记录、访谈和后续任务",
    "closeCondition": "连续抽查3次真实沟通验证。",
    "method": "清单型，系统辅助＋人工确认",
    "boundary": ""
  },
  "SAF-C01": {
    "overview": "持续辨识作业、设备、物料、场所和变更中的危险有害因素，形成风险清单并分级，控制措施具体到责任岗位。",
    "checkPoints": [
      "核对重点场所、有限空间和危险作业全部核对，一般区域不少于5处。",
      "记录并核对：应识别场所或作业数",
      "记录并核对：已识别数",
      "记录并核对：重大或较大风险数",
      "记录并核对：有措施数",
      "记录并核对：现场抽查风险与清单一致数"
    ],
    "sampling": [
      "重点场所、有限空间和危险作业全部核对，一般区域不少于5处。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "应识别场所或作业数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录应识别场所或作业数"
      },
      {
        "key": "fact_2",
        "label": "已识别数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录已识别数"
      },
      {
        "key": "fact_3",
        "label": "重大或较大风险数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录重大或较大风险数"
      },
      {
        "key": "fact_4",
        "label": "有措施数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录有措施数"
      },
      {
        "key": "fact_5",
        "label": "现场抽查风险与清单一致数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录现场抽查风险与清单一致数"
      },
      {
        "key": "fact_6",
        "label": "变更后更新数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录变更后更新数"
      }
    ],
    "decision": {
      "compliant": "重点风险覆盖100%、分级合理且现场措施一致",
      "partial": "一般风险少量漏项",
      "nonCompliant": "重大风险未识别、分级明显降低、清单与现场严重脱节",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "风险漏辨识",
      "分级不当",
      "措施空泛",
      "现场不一致",
      "变更未更新",
      "责任不明确"
    ],
    "evidence": "风险清单、评估记录和现场核对",
    "closeCondition": "重新评估并验证控制措施。",
    "method": "清单型，系统辅助＋人工确认",
    "boundary": ""
  },
  "SAF-C02": {
    "overview": "日常、综合、专项、季节性及重大活动前检查与实际风险匹配，按计划执行并真实记录发现的问题。",
    "checkPoints": [
      "记录并核对：计划检查数",
      "按期完成数",
      "抽查记录数",
      "记录并核对：真实有效数",
      "记录并核对：重点风险覆盖数",
      "核对现场明显问题与记录匹配情况"
    ],
    "sampling": [
      "执行本模块通用检查窗口与抽样基线；实际数量不足时全部检查。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "计划检查数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录计划检查数"
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
        "label": "抽查记录数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录抽查记录数"
      },
      {
        "key": "fact_4",
        "label": "真实有效数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录真实有效数"
      },
      {
        "key": "fact_5",
        "label": "重点风险覆盖数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录重点风险覆盖数"
      },
      {
        "key": "fact_6",
        "label": "现场明显问题与记录匹配情况",
        "type": "text",
        "placeholder": "记录现场明显问题与记录匹配情况"
      }
    ],
    "decision": {
      "compliant": "计划完成率和重点风险覆盖率100%、记录真实",
      "partial": "少量一般检查逾期",
      "nonCompliant": "重大专项漏查、长期零问题但现场存在明显缺陷、检查记录造假",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "检查漏做",
      "检查逾期",
      "重点风险漏查",
      "记录空泛",
      "零问题失真",
      "检查造假"
    ],
    "evidence": "计划、检查记录和现场反向核对",
    "closeCondition": "补查整改并验证后续检查质量。",
    "method": "比例型＋清单型，系统预判＋人工确认",
    "boundary": ""
  },
  "SAF-C03": {
    "overview": "隐患按等级落实责任、措施、资金、时限和适用预案，整改期间风险受控，完成后由适当人员复核关闭。",
    "checkPoints": [
      "核对重大隐患全部，最近3个月一般隐患不少于10项。",
      "记录并核对：隐患总数",
      "记录并核对：正确分级数",
      "记录并核对：五项要素完整数",
      "按期关闭数",
      "记录并核对：复核数"
    ],
    "sampling": [
      "重大隐患全部，最近3个月一般隐患不少于10项。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "隐患总数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录隐患总数"
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
        "label": "五项要素完整数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录五项要素完整数"
      },
      {
        "key": "fact_4",
        "label": "按期关闭数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录按期关闭数"
      },
      {
        "key": "fact_5",
        "label": "复核数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录复核数"
      },
      {
        "key": "fact_6",
        "label": "逾期天数",
        "type": "number",
        "unit": "天",
        "placeholder": "记录逾期天数"
      },
      {
        "key": "fact_7",
        "label": "临时措施有效数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录临时措施有效数"
      }
    ],
    "decision": {
      "compliant": "分级正确、按期闭环和复核率100%",
      "partial": "一般隐患少量逾期但有措施",
      "nonCompliant": "重大隐患无控制继续作业、虚假关闭或多项隐患长期逾期",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "分级错误",
      "五落实不全",
      "临时措施缺失",
      "整改逾期",
      "无复核",
      "虚假关闭"
    ],
    "evidence": "隐患台账、整改前后证据和复核",
    "closeCondition": "现场确认风险消除或控制有效。",
    "method": "比例型＋清单型，系统预判＋人工确认",
    "boundary": ""
  },
  "SAF-C04": {
    "overview": "重大、重复或超过规定期限的隐患及时升级报告，分析管理原因，必要时停止相关作业并采取防复发措施。",
    "checkPoints": [
      "记录并核对：应升级数",
      "记录并核对：及时升级数",
      "记录并核对：重复隐患数",
      "记录并核对：完成原因分析数",
      "记录并核对：停工条件触发数",
      "记录并核对：实际停工数"
    ],
    "sampling": [
      "执行本模块通用检查窗口与抽样基线；实际数量不足时全部检查。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "应升级数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录应升级数"
      },
      {
        "key": "fact_2",
        "label": "及时升级数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录及时升级数"
      },
      {
        "key": "fact_3",
        "label": "重复隐患数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录重复隐患数"
      },
      {
        "key": "fact_4",
        "label": "完成原因分析数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录完成原因分析数"
      },
      {
        "key": "fact_5",
        "label": "停工条件触发数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录停工条件触发数"
      },
      {
        "key": "fact_6",
        "label": "实际停工数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录实际停工数"
      },
      {
        "key": "fact_7",
        "label": "措施闭环数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录措施闭环数"
      }
    ],
    "decision": {
      "compliant": "应升级事项100%及时处理、重复问题有有效措施",
      "partial": "一般升级稍迟但风险受控",
      "nonCompliant": "重大隐患降级处理、应停未停或重复问题长期不分析",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "重大隐患未升级",
      "逾期未报告",
      "应停未停",
      "重复隐患",
      "原因分析不足",
      "措施无效"
    ],
    "evidence": "升级报告、会议决策、原因分析和验证",
    "closeCondition": "按规定复核且观察期无复发。",
    "method": "清单型，系统辅助＋人工确认",
    "boundary": ""
  },
  "SAF-D01": {
    "overview": "动火、有限空间、高处、临时用电、吊装及其他适用危险作业在开始前使用正确作业票，审批层级、范围、时间和人员与现场一致。",
    "checkPoints": [
      "记录并核对：实际作业数",
      "记录并核对：办票数",
      "抽查票数",
      "记录并核对：要素合规数",
      "核对超范围",
      "记录并核对：超时或代签数"
    ],
    "sampling": [
      "执行本模块通用检查窗口与抽样基线；实际数量不足时全部检查。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "实际作业数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录实际作业数"
      },
      {
        "key": "fact_2",
        "label": "办票数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录办票数"
      },
      {
        "key": "fact_3",
        "label": "抽查票数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录抽查票数"
      },
      {
        "key": "fact_4",
        "label": "要素合规数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录要素合规数"
      },
      {
        "key": "fact_5",
        "label": "超范围",
        "type": "text",
        "placeholder": "记录超范围"
      },
      {
        "key": "fact_6",
        "label": "超时或代签数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录超时或代签数"
      },
      {
        "key": "fact_7",
        "label": "无票作业数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录无票作业数"
      }
    ],
    "decision": {
      "compliant": "办票率和抽查合规率100%",
      "partial": "一般填写缺项且不影响控制",
      "nonCompliant": "无票实施有限空间或动火等高风险作业、越权审批、作业票与实际明显不符为不符合并触发关键控制失效。",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "无票作业",
      "票种错误",
      "越权审批",
      "代签",
      "超范围",
      "超时作业",
      "票实不符"
    ],
    "evidence": "作业清单、票证和现场或影像核对",
    "closeCondition": "纠正后通过不少于3项后续真实作业验证。",
    "method": "比例型＋清单型，系统预判＋人工确认",
    "boundary": ""
  },
  "SAF-D02": {
    "overview": "危险作业前完成风险分析、方案或措施、交底、能量和物料隔离、气体检测、设备工具检查及应急准备，相关条件由责任人确认。",
    "checkPoints": [
      "抽查作业数",
      "记录并核对：风险分析充分数",
      "记录并核对：隔离确认数",
      "记录并核对：检测符合数",
      "记录并核对：交底覆盖人数",
      "记录并核对：应急准备有效数"
    ],
    "sampling": [
      "执行本模块通用检查窗口与抽样基线；实际数量不足时全部检查。"
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
        "label": "风险分析充分数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录风险分析充分数"
      },
      {
        "key": "fact_3",
        "label": "隔离确认数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录隔离确认数"
      },
      {
        "key": "fact_4",
        "label": "检测符合数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录检测符合数"
      },
      {
        "key": "fact_5",
        "label": "交底覆盖人数",
        "type": "number",
        "unit": "人",
        "placeholder": "记录交底覆盖人数"
      },
      {
        "key": "fact_6",
        "label": "应急准备有效数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录应急准备有效数"
      }
    ],
    "decision": {
      "compliant": "适用要素全部完成并与现场一致",
      "partial": "非关键记录缺项",
      "nonCompliant": "有限空间未先通风检测、应隔离未隔离、检测仪器无效或重大风险未交底即作业",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "风险分析不足",
      "隔离缺失",
      "检测缺失",
      "仪器无效",
      "交底漏人",
      "应急准备不足"
    ],
    "evidence": "票证附件、检测和隔离记录、人员访谈",
    "closeCondition": "重新确认条件并验证后续作业。",
    "method": "清单型，系统辅助＋人工确认",
    "boundary": ""
  },
  "SAF-D03": {
    "overview": "危险作业期间监护人履职，按风险持续或定时检测，人员正确使用防护用品，作业条件变化时暂停并重新确认。",
    "checkPoints": [
      "记录并核对：现场或记录抽查作业数",
      "记录并核对：监护有效数",
      "记录并核对：应持续检测数",
      "记录并核对：实际完成数",
      "记录并核对：防护正确数",
      "记录并核对：条件变化后暂停确认数"
    ],
    "sampling": [
      "执行本模块通用检查窗口与抽样基线；实际数量不足时全部检查。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "现场或记录抽查作业数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录现场或记录抽查作业数"
      },
      {
        "key": "fact_2",
        "label": "监护有效数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录监护有效数"
      },
      {
        "key": "fact_3",
        "label": "应持续检测数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录应持续检测数"
      },
      {
        "key": "fact_4",
        "label": "实际完成数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录实际完成数"
      },
      {
        "key": "fact_5",
        "label": "防护正确数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录防护正确数"
      },
      {
        "key": "fact_6",
        "label": "条件变化后暂停确认数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录条件变化后暂停确认数"
      }
    ],
    "decision": {
      "compliant": "适用控制100%有效",
      "partial": "不影响关键控制的一般记录缺项",
      "nonCompliant": "监护人离岗、有限空间无持续监测、人员防护严重不足或条件变化仍冒险作业",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "监护离岗",
      "检测中断",
      "防护用品错误",
      "人员超限",
      "条件变化未停",
      "现场记录失真"
    ],
    "evidence": "现场检查、检测数据、影像或票证记录",
    "closeCondition": "立即纠正并以真实作业复核。",
    "method": "清单型，系统辅助＋人工确认",
    "boundary": ""
  },
  "SAF-D04": {
    "overview": "相关方进入项目前完成资质能力、安全条件审核，明确双方安全责任、管理接口和禁止事项，并完成入场教育。",
    "checkPoints": [
      "记录并核对：在场相关方数",
      "记录并核对：完成准入数",
      "记录并核对：应签安全协议数",
      "记录并核对：已签数",
      "记录并核对：入场人员数",
      "记录并核对：教育合格数"
    ],
    "sampling": [
      "执行本模块通用检查窗口与抽样基线；实际数量不足时全部检查。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "在场相关方数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录在场相关方数"
      },
      {
        "key": "fact_2",
        "label": "完成准入数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录完成准入数"
      },
      {
        "key": "fact_3",
        "label": "应签安全协议数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录应签安全协议数"
      },
      {
        "key": "fact_4",
        "label": "已签数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录已签数"
      },
      {
        "key": "fact_5",
        "label": "入场人员数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录入场人员数"
      },
      {
        "key": "fact_6",
        "label": "教育合格数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录教育合格数"
      },
      {
        "key": "fact_7",
        "label": "资质有效数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录资质有效数"
      }
    ],
    "decision": {
      "compliant": "准入、协议和教育覆盖率100%",
      "partial": "一般资料少量缺项",
      "nonCompliant": "不具备相应能力仍准入、高风险工作未约定责任或人员未教育即进场",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "资质不符",
      "准入缺失",
      "安全协议缺失",
      "责任不清",
      "教育漏人",
      "人员变更未更新"
    ],
    "evidence": "相关方清单、审核协议和教育记录",
    "closeCondition": "补齐并确认现场人员符合。",
    "method": "比例型＋清单型，系统预判＋人工确认",
    "boundary": ""
  },
  "SAF-D05": {
    "overview": "业主对相关方作业方案、许可、人员变化、现场行为、隐患整改和完工退出实施全过程安全监督，不以签订协议替代现场管理。",
    "checkPoints": [
      "抽查项目数",
      "记录并核对：监督记录完整数",
      "记录并核对：发现问题数",
      "按期闭环数",
      "记录并核对：人员变化及时审核数",
      "记录并核对：严重违章制止数"
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
        "label": "监督记录完整数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录监督记录完整数"
      },
      {
        "key": "fact_3",
        "label": "发现问题数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录发现问题数"
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
        "label": "人员变化及时审核数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录人员变化及时审核数"
      },
      {
        "key": "fact_6",
        "label": "严重违章制止数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录严重违章制止数"
      }
    ],
    "decision": {
      "compliant": "监督覆盖、问题闭环和人员变化审核率100%",
      "partial": "一般监督记录不足",
      "nonCompliant": "高风险作业无人监督、严重违章未制止、同类问题反复发生",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "以包代管",
      "现场监督缺失",
      "人员失控",
      "违章未制止",
      "隐患逾期",
      "退场未确认"
    ],
    "evidence": "监督检查、违章处置和复核记录",
    "closeCondition": "完成整改并通过后续现场抽查。",
    "method": "比例型＋清单型，系统预判＋人工确认",
    "boundary": ""
  },
  "SAF-E01": {
    "overview": "综合预案、专项预案和现场处置方案覆盖实际风险，应急组织、通信、外部联络、物资和救援条件保持有效。",
    "checkPoints": [
      "记录并核对：应覆盖风险数",
      "记录并核对：预案覆盖数",
      "抽查岗位能正确响应人数",
      "记录并核对：应急物资数",
      "记录并核对：有效可用数",
      "记录并核对：外部联络核验数"
    ],
    "sampling": [
      "执行本模块通用检查窗口与抽样基线；实际数量不足时全部检查。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "应覆盖风险数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录应覆盖风险数"
      },
      {
        "key": "fact_2",
        "label": "预案覆盖数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录预案覆盖数"
      },
      {
        "key": "fact_3",
        "label": "抽查岗位能正确响应人数",
        "type": "number",
        "unit": "人",
        "placeholder": "记录抽查岗位能正确响应人数"
      },
      {
        "key": "fact_4",
        "label": "应急物资数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录应急物资数"
      },
      {
        "key": "fact_5",
        "label": "有效可用数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录有效可用数"
      },
      {
        "key": "fact_6",
        "label": "外部联络核验数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录外部联络核验数"
      }
    ],
    "decision": {
      "compliant": "重点风险覆盖100%、物资有效且岗位掌握",
      "partial": "一般要素不足",
      "nonCompliant": "有限空间等重大风险无处置方案、关键救援装备不可用或组织通信失效",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "预案漏项",
      "岗位不掌握",
      "组织失效",
      "物资缺失",
      "装备过期",
      "外部联络失效"
    ],
    "evidence": "预案、物资现场和岗位访谈",
    "closeCondition": "补齐后开展针对性验证。",
    "method": "清单型，系统辅助＋人工确认",
    "boundary": ""
  },
  "SAF-E02": {
    "overview": "按适用要求和风险计划开展桌面或实战演练，真实检验人员、程序和资源，形成评估、整改和再验证。",
    "checkPoints": [
      "记录并核对：计划演练数",
      "按期完成数",
      "记录并核对：覆盖重点风险数",
      "记录并核对：发现问题数",
      "记录并核对：闭环数",
      "记录并核对：需要再验证数"
    ],
    "sampling": [
      "执行本模块通用检查窗口与抽样基线；实际数量不足时全部检查。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "计划演练数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录计划演练数"
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
        "label": "覆盖重点风险数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录覆盖重点风险数"
      },
      {
        "key": "fact_4",
        "label": "发现问题数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录发现问题数"
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
        "label": "需要再验证数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录需要再验证数"
      },
      {
        "key": "fact_7",
        "label": "已验证数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录已验证数"
      }
    ],
    "decision": {
      "compliant": "计划完成且问题闭环率100%",
      "partial": "一般问题整改稍迟",
      "nonCompliant": "演练长期未开展、演练造假、重大问题未整改或盲目施救行为未纠正",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "演练逾期",
      "场景不匹配",
      "演练走过场",
      "评估缺失",
      "问题未闭环",
      "未再验证"
    ],
    "evidence": "计划、过程记录、评估和整改",
    "closeCondition": "必要时补充演练验证。",
    "method": "比例型＋清单型，系统预判＋人工确认",
    "boundary": ""
  },
  "SAF-E03": {
    "overview": "事故、未遂事件和其他应报告安全事件及时如实报告，保护现场、调查原因、落实整改并向相关人员反馈教训。",
    "checkPoints": [
      "记录并核对：事件总数",
      "记录并核对：及时报告数",
      "记录并核对：应调查数",
      "记录并核对：完成数",
      "记录并核对：措施数",
      "记录并核对：闭环数"
    ],
    "sampling": [
      "执行本模块通用检查窗口与抽样基线；实际数量不足时全部检查。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "事件总数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录事件总数"
      },
      {
        "key": "fact_2",
        "label": "及时报告数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录及时报告数"
      },
      {
        "key": "fact_3",
        "label": "应调查数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录应调查数"
      },
      {
        "key": "fact_4",
        "label": "完成数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录完成数"
      },
      {
        "key": "fact_5",
        "label": "措施数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录措施数"
      },
      {
        "key": "fact_6",
        "label": "闭环数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录闭环数"
      },
      {
        "key": "fact_7",
        "label": "经验反馈覆盖人数",
        "type": "number",
        "unit": "人",
        "placeholder": "记录经验反馈覆盖人数"
      },
      {
        "key": "fact_8",
        "label": "迟报",
        "type": "text",
        "placeholder": "记录迟报"
      },
      {
        "key": "fact_9",
        "label": "漏报",
        "type": "text",
        "placeholder": "记录漏报"
      },
      {
        "key": "fact_10",
        "label": "瞒报数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录瞒报数"
      }
    ],
    "decision": {
      "compliant": "报告、调查和措施闭环100%",
      "partial": "一般事件个别资料不足",
      "nonCompliant": "迟报漏报影响处置、瞒报谎报、伪造调查或重大措施未落实为不符合并触发关键控制失效。",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "迟报",
      "漏报",
      "瞒报",
      "谎报",
      "调查不充分",
      "措施未落实",
      "经验未反馈"
    ],
    "evidence": "事件台账、报告调查和措施验证",
    "closeCondition": "完成法定及内部程序并确认措施有效。",
    "method": "清单型，系统辅助＋人工确认",
    "boundary": ""
  },
  "SAF-F01": {
    "overview": "识别适用岗位的职业病危害因素，依法或按项目适用要求完成申报、检测、告知、健康检查和档案管理，对异常人员采取措施。",
    "checkPoints": [
      "记录并核对：危害岗位数",
      "记录并核对：已识别数",
      "记录并核对：应检测点位数",
      "记录并核对：有效数",
      "记录并核对：应体检人数",
      "记录并核对：完成数"
    ],
    "sampling": [
      "执行本模块通用检查窗口与抽样基线；实际数量不足时全部检查。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "危害岗位数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录危害岗位数"
      },
      {
        "key": "fact_2",
        "label": "已识别数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录已识别数"
      },
      {
        "key": "fact_3",
        "label": "应检测点位数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录应检测点位数"
      },
      {
        "key": "fact_4",
        "label": "有效数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录有效数"
      },
      {
        "key": "fact_5",
        "label": "应体检人数",
        "type": "number",
        "unit": "人",
        "placeholder": "记录应体检人数"
      },
      {
        "key": "fact_6",
        "label": "完成数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录完成数"
      },
      {
        "key": "fact_7",
        "label": "异常人员数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录异常人员数"
      },
      {
        "key": "fact_8",
        "label": "处置数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录处置数"
      },
      {
        "key": "fact_9",
        "label": "告知覆盖数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录告知覆盖数"
      }
    ],
    "decision": {
      "compliant": "适用事项覆盖和有效率100%、异常均处置",
      "partial": "一般资料缺项",
      "nonCompliant": "危害岗位未识别、应检未检、体检长期漏人或异常继续暴露无措施",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "危害漏识别",
      "检测超期",
      "告知缺失",
      "体检漏人",
      "档案不全",
      "异常未处置"
    ],
    "evidence": "岗位清单、检测报告、体检覆盖和处置证据",
    "closeCondition": "完成补充控制并专业复核。",
    "method": "比例型＋清单型，系统预判＋人工确认",
    "boundary": ""
  },
  "SAF-F02": {
    "overview": "按风险选择、配备、发放、检查和更换劳动防护用品及救援装备，规格适用、数量满足、状态有效，人员能够正确使用。",
    "checkPoints": [
      "记录并核对：应配项目数",
      "记录并核对：有效项目数",
      "抽查人员数",
      "记录并核对：正确使用数",
      "记录并核对：装备账物一致数",
      "记录并核对：超期失效数"
    ],
    "sampling": [
      "执行本模块通用检查窗口与抽样基线；实际数量不足时全部检查。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "应配项目数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录应配项目数"
      },
      {
        "key": "fact_2",
        "label": "有效项目数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录有效项目数"
      },
      {
        "key": "fact_3",
        "label": "抽查人员数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录抽查人员数"
      },
      {
        "key": "fact_4",
        "label": "正确使用数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录正确使用数"
      },
      {
        "key": "fact_5",
        "label": "装备账物一致数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录装备账物一致数"
      },
      {
        "key": "fact_6",
        "label": "超期失效数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录超期失效数"
      },
      {
        "key": "fact_7",
        "label": "检查维护完成数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录检查维护完成数"
      }
    ],
    "decision": {
      "compliant": "配备、有效和正确使用率100%",
      "partial": "一般保管标识缺项",
      "nonCompliant": "关键呼吸、防坠落、气体检测或救援装备缺失失效，或人员不会使用",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "选型错误",
      "数量不足",
      "过期失效",
      "账实不符",
      "不会使用",
      "检查维护缺失"
    ],
    "evidence": "清单、发放检查、现场实操",
    "closeCondition": "补齐后进行使用能力验证。",
    "method": "比例型＋清单型，系统预判＋人工确认",
    "boundary": ""
  },
  "SAF-G01": {
    "overview": "道路、平台、护栏、盖板、爬梯、通风、照明、防滑和警示等通用条件完好，临边、孔洞和湿滑区域风险受控。",
    "checkPoints": [
      "核对覆盖预处理、生化、深度处理、污泥和辅助区域，不少于10处。",
      "抽查区域数",
      "记录并核对：符合数",
      "记录并核对：缺陷数及等级",
      "记录并核对：临时措施数",
      "记录并核对：有效数"
    ],
    "sampling": [
      "覆盖预处理、生化、深度处理、污泥和辅助区域，不少于10处。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "抽查区域数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录抽查区域数"
      },
      {
        "key": "fact_2",
        "label": "符合数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录符合数"
      },
      {
        "key": "fact_3",
        "label": "缺陷数及等级",
        "type": "number",
        "unit": "项",
        "placeholder": "记录缺陷数及等级"
      },
      {
        "key": "fact_4",
        "label": "临时措施数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录临时措施数"
      },
      {
        "key": "fact_5",
        "label": "有效数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录有效数"
      },
      {
        "key": "fact_6",
        "label": "重复缺陷数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录重复缺陷数"
      }
    ],
    "decision": {
      "compliant": "无重大缺陷且一般缺陷及时受控",
      "partial": "一般缺陷少量存在",
      "nonCompliant": "可能导致坠落、淹溺、机械伤害的关键防护缺失或长期失修",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "护栏缺失",
      "盖板缺失",
      "平台破损",
      "湿滑",
      "照明不足",
      "通风不足",
      "警示缺失"
    ],
    "evidence": "现场照片和位置",
    "closeCondition": "永久修复并现场复核。",
    "method": "清单型，系统辅助＋人工确认",
    "boundary": ""
  },
  "SAF-G02": {
    "overview": "变配电室、配电装置、接地防雷、电气安全用具和临时用电按适用规范管理，防护、检测、标识和操作条件有效。",
    "checkPoints": [
      "记录并核对：配电区域数",
      "记录并核对：符合数",
      "记录并核对：应检工具或装置数",
      "记录并核对：有效数",
      "记录并核对：临时用电点数",
      "记录并核对：审批规范数"
    ],
    "sampling": [
      "执行本模块通用检查窗口与抽样基线；实际数量不足时全部检查。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "配电区域数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录配电区域数"
      },
      {
        "key": "fact_2",
        "label": "符合数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录符合数"
      },
      {
        "key": "fact_3",
        "label": "应检工具或装置数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录应检工具或装置数"
      },
      {
        "key": "fact_4",
        "label": "有效数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录有效数"
      },
      {
        "key": "fact_5",
        "label": "临时用电点数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录临时用电点数"
      },
      {
        "key": "fact_6",
        "label": "审批规范数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录审批规范数"
      },
      {
        "key": "fact_7",
        "label": "重大电气缺陷数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录重大电气缺陷数"
      }
    ],
    "decision": {
      "compliant": "关键设施和工具有效、临时用电合规",
      "partial": "一般标识或整理缺项",
      "nonCompliant": "带电裸露、保护失效、违规接线、应检装置超期且继续使用",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "带电裸露",
      "保护失效",
      "违规接线",
      "检测超期",
      "安全用具失效",
      "配电室失控"
    ],
    "evidence": "现场、检验检测和许可记录",
    "closeCondition": "停用或修复后测试确认。",
    "method": "清单型，系统辅助＋人工确认",
    "boundary": ""
  },
  "SAF-G03": {
    "overview": "纳入法定范围的特种设备按现行安全技术规范完成使用登记、定期检验、经常性维护检查和安全附件管理，人员资格和现场状态符合要求。",
    "checkPoints": [
      "记录并核对：特种设备数",
      "记录并核对：登记数",
      "记录并核对：检验有效数",
      "记录并核对：安全附件数",
      "记录并核对：有效数",
      "记录并核对：人员有效持证数"
    ],
    "sampling": [
      "执行本模块通用检查窗口与抽样基线；实际数量不足时全部检查。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "特种设备数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录特种设备数"
      },
      {
        "key": "fact_2",
        "label": "登记数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录登记数"
      },
      {
        "key": "fact_3",
        "label": "检验有效数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录检验有效数"
      },
      {
        "key": "fact_4",
        "label": "安全附件数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录安全附件数"
      },
      {
        "key": "fact_5",
        "label": "有效数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录有效数"
      },
      {
        "key": "fact_6",
        "label": "人员有效持证数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录人员有效持证数"
      },
      {
        "key": "fact_7",
        "label": "停用或异常设备隔离数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录停用或异常设备隔离数"
      }
    ],
    "decision": {
      "compliant": "法定事项和现场状态100%符合",
      "partial": "非关键资料缺项",
      "nonCompliant": "未登记或检验超期继续使用、关键安全附件失效、无证人员操作",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "未登记",
      "检验超期",
      "附件失效",
      "无证操作",
      "异常未停用",
      "档案不一致"
    ],
    "evidence": "清单、登记检验、人员资格和现场核对",
    "closeCondition": "依法恢复有效状态后关闭。",
    "method": "清单型，系统辅助＋人工确认",
    "boundary": "技术规则版本按市场监管总局现行公告复核。"
  },
  "SAF-G04": {
    "overview": "消防设施器材、报警联动、疏散通道、安全出口和标识按适用要求配置、检查维护并保持随时可用。",
    "checkPoints": [
      "抽查场所数",
      "记录并核对：符合数",
      "记录并核对：设施器材数",
      "记录并核对：有效数",
      "记录并核对：通道出口堵塞数",
      "检查维护按期数"
    ],
    "sampling": [
      "执行本模块通用检查窗口与抽样基线；实际数量不足时全部检查。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "抽查场所数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录抽查场所数"
      },
      {
        "key": "fact_2",
        "label": "符合数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录符合数"
      },
      {
        "key": "fact_3",
        "label": "设施器材数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录设施器材数"
      },
      {
        "key": "fact_4",
        "label": "有效数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录有效数"
      },
      {
        "key": "fact_5",
        "label": "通道出口堵塞数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录通道出口堵塞数"
      },
      {
        "key": "fact_6",
        "label": "检查维护按期数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录检查维护按期数"
      },
      {
        "key": "fact_7",
        "label": "消防控制异常数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录消防控制异常数"
      }
    ],
    "decision": {
      "compliant": "关键设施和疏散条件有效",
      "partial": "一般标识或记录缺项",
      "nonCompliant": "消防设施大面积失效、通道或出口严重堵塞、重大火灾风险未控制",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "灭火器失效",
      "消防水失效",
      "报警联动异常",
      "通道堵塞",
      "出口锁闭",
      "检查逾期"
    ],
    "evidence": "现场和维护检测记录",
    "closeCondition": "恢复功能并现场试验或专业确认。",
    "method": "清单型，系统辅助＋人工确认",
    "boundary": ""
  },
  "SAF-G05": {
    "overview": "危化品库、加药间、储罐及危废暂存等适用场所的分类储存、兼容性、通风、防泄漏、洗眼冲淋、标识、出入和应急措施与物料风险匹配。",
    "checkPoints": [
      "记录并核对：重点场所数",
      "记录并核对：符合数",
      "记录并核对：物料数",
      "记录并核对：清单与现场一致数",
      "记录并核对：安全设施有效数",
      "记录并核对：不相容混存数"
    ],
    "sampling": [
      "执行本模块通用检查窗口与抽样基线；实际数量不足时全部检查。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "重点场所数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录重点场所数"
      },
      {
        "key": "fact_2",
        "label": "符合数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录符合数"
      },
      {
        "key": "fact_3",
        "label": "物料数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录物料数"
      },
      {
        "key": "fact_4",
        "label": "清单与现场一致数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录清单与现场一致数"
      },
      {
        "key": "fact_5",
        "label": "安全设施有效数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录安全设施有效数"
      },
      {
        "key": "fact_6",
        "label": "不相容混存数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录不相容混存数"
      },
      {
        "key": "fact_7",
        "label": "泄漏或超量储存数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录泄漏或超量储存数"
      }
    ],
    "decision": {
      "compliant": "重点风险控制100%有效",
      "partial": "一般标识或记录缺项",
      "nonCompliant": "不相容物料混存、重大泄漏无控制、关键洗消通风设施失效或危废严重失管",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "混存",
      "超量储存",
      "泄漏",
      "通风失效",
      "洗眼失效",
      "标识错误",
      "危废失管"
    ],
    "evidence": "物料清单、安全技术说明书和现场",
    "closeCondition": "消除风险并复核设施有效。",
    "method": "清单型，系统辅助＋人工确认",
    "boundary": ""
  },
  "SAF-G06": {
    "overview": "有限空间清单与现场一致，出入口设置风险告知和警示，采取物理防护，检测、通风、通信和救援装备与场所风险匹配。",
    "checkPoints": [
      "核对清单全部核对，现场至少抽查5处并覆盖池、井、罐或管廊等适用类型。",
      "记录并核对：有限空间数",
      "记录并核对：清单覆盖数",
      "记录并核对：现场抽查数",
      "记录并核对：标识防护符合数",
      "记录并核对：适用装备有效数"
    ],
    "sampling": [
      "清单全部核对，现场至少抽查5处并覆盖池、井、罐或管廊等适用类型。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "有限空间数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录有限空间数"
      },
      {
        "key": "fact_2",
        "label": "清单覆盖数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录清单覆盖数"
      },
      {
        "key": "fact_3",
        "label": "现场抽查数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录现场抽查数"
      },
      {
        "key": "fact_4",
        "label": "标识防护符合数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录标识防护符合数"
      },
      {
        "key": "fact_5",
        "label": "适用装备有效数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录适用装备有效数"
      },
      {
        "key": "fact_6",
        "label": "新增或变更及时更新数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录新增或变更及时更新数"
      }
    ],
    "decision": {
      "compliant": "清单覆盖100%、现场防护和救援条件有效",
      "partial": "一般标识损坏",
      "nonCompliant": "有限空间未辨识、入口无防护、关键检测救援装备缺失或现场条件可能诱发盲目进入",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "空间漏辨识",
      "警示缺失",
      "入口失控",
      "检测装备缺失",
      "通风不足",
      "救援条件缺失"
    ],
    "evidence": "清单、现场照片和装备测试",
    "closeCondition": "更新后全量核对新增漏项。",
    "method": "清单型，系统辅助＋人工确认",
    "boundary": ""
  }
}
