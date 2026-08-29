import type { ProcessRuleDetail } from './types'

export const GENERAL_RULE_DETAILS: Record<string, ProcessRuleDetail> = {
  "GEN-A01": {
    "overview": "组织架构、部门岗位、职责边界和授权关系与当前运营模式一致，重大事项具有清晰决策和报告路径。",
    "checkPoints": [
      "记录并核对：应设置职责数",
      "记录并核对：已覆盖数",
      "记录并核对：授权事项数",
      "记录并核对：有效数",
      "抽查人员数",
      "记录并核对：正确掌握职责授权数"
    ],
    "sampling": [
      "执行本模块通用检查窗口与抽样基线；实际数量不足时全部检查。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "应设置职责数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录应设置职责数"
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
        "label": "授权事项数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录授权事项数"
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
        "label": "抽查人员数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录抽查人员数"
      },
      {
        "key": "fact_6",
        "label": "正确掌握职责授权数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录正确掌握职责授权数"
      },
      {
        "key": "fact_7",
        "label": "兼岗或缺岗有措施数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录兼岗或缺岗有措施数"
      }
    ],
    "decision": {
      "compliant": "职责和关键授权覆盖100%、实际执行一致",
      "partial": "一般职责交叉",
      "nonCompliant": "重大事项无人负责、越权决策、授权失效仍使用或组织图与实际严重不符",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "职责缺失",
      "职责交叉",
      "授权缺失",
      "越权",
      "授权过期",
      "组织与实际不符"
    ],
    "evidence": "组织职责、授权清单和真实审批事项",
    "closeCondition": "修订后用至少3项业务验证。",
    "method": "清单型，系统辅助＋人工确认",
    "boundary": ""
  },
  "GEN-A02": {
    "overview": "行政、人事、采购、档案、印章、合同、资产、车辆和后勤等适用制度完整、有效、本地化，与上级制度和实际流程衔接。",
    "checkPoints": [
      "记录并核对：适用主题数",
      "记录并核对：制度覆盖数",
      "记录并核对：有效版本数",
      "抽查流程与制度一致数",
      "记录并核对：冲突或失效文件数"
    ],
    "sampling": [
      "执行本模块通用检查窗口与抽样基线；实际数量不足时全部检查。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "适用主题数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录适用主题数"
      },
      {
        "key": "fact_2",
        "label": "制度覆盖数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录制度覆盖数"
      },
      {
        "key": "fact_3",
        "label": "有效版本数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录有效版本数"
      },
      {
        "key": "fact_4",
        "label": "抽查流程与制度一致数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录抽查流程与制度一致数"
      },
      {
        "key": "fact_5",
        "label": "冲突或失效文件数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录冲突或失效文件数"
      }
    ],
    "decision": {
      "compliant": "适用主题覆盖率和有效率100%",
      "partial": "非关键制度个别缺项",
      "nonCompliant": "印章、合同、采购或人事等关键过程无规则、版本冲突导致失控",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "制度缺失",
      "版本失效",
      "上下级冲突",
      "流程不适用",
      "职责接口缺失"
    ],
    "evidence": "制度目录、版本记录和流程抽查",
    "closeCondition": "修订批准并验证执行。",
    "method": "比例型＋清单型，系统预判＋人工确认",
    "boundary": ""
  },
  "GEN-A03": {
    "overview": "识别适用法律、上级制度和组织流程变化，评估影响，更新文件、授权和表单，并传达到相关岗位。",
    "checkPoints": [
      "记录并核对：已识别变更数",
      "记录并核对：完成影响评估数",
      "记录并核对：应更新文件数",
      "记录并核对：已更新数",
      "记录并核对：应传达人数",
      "记录并核对：已覆盖数"
    ],
    "sampling": [
      "执行本模块通用检查窗口与抽样基线；实际数量不足时全部检查。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "已识别变更数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录已识别变更数"
      },
      {
        "key": "fact_2",
        "label": "完成影响评估数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录完成影响评估数"
      },
      {
        "key": "fact_3",
        "label": "应更新文件数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录应更新文件数"
      },
      {
        "key": "fact_4",
        "label": "已更新数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录已更新数"
      },
      {
        "key": "fact_5",
        "label": "应传达人数",
        "type": "number",
        "unit": "人",
        "placeholder": "记录应传达人数"
      },
      {
        "key": "fact_6",
        "label": "已覆盖数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录已覆盖数"
      },
      {
        "key": "fact_7",
        "label": "逾期变更数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录逾期变更数"
      }
    ],
    "decision": {
      "compliant": "变更识别、更新和传达闭环率100%",
      "partial": "一般更新稍迟但风险受控",
      "nonCompliant": "重大外部要求漏识别、旧流程继续执行造成合规风险",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "变更漏识别",
      "影响未评估",
      "文件未更新",
      "表单未更新",
      "人员未传达",
      "旧版继续使用"
    ],
    "evidence": "变更台账、评估更新和宣贯记录",
    "closeCondition": "以真实事项验证新规则生效。",
    "method": "比例型＋清单型，系统预判＋人工确认",
    "boundary": ""
  },
  "GEN-A04": {
    "overview": "年度重点管理任务覆盖组织治理、证照合同、人员、采购资产和行政保障，明确责任、时间和成果并定期跟踪。",
    "checkPoints": [
      "记录并核对：重点任务数",
      "记录并核对：已分解数",
      "记录并核对：当期应完成数",
      "记录并核对：完成数",
      "记录并核对：逾期数",
      "记录并核对：升级数"
    ],
    "sampling": [
      "执行本模块通用检查窗口与抽样基线；实际数量不足时全部检查。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "重点任务数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录重点任务数"
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
        "label": "完成数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录完成数"
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
        "label": "变更批准数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录变更批准数"
      }
    ],
    "decision": {
      "compliant": "任务分解和当期按期完成率100%",
      "partial": "少量一般逾期",
      "nonCompliant": "关键任务漏项、多项长期逾期或通过修改记录掩盖未完成",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "任务漏项",
      "责任缺失",
      "期限缺失",
      "任务逾期",
      "未升级",
      "记录不实"
    ],
    "evidence": "年度计划、跟踪台账和成果",
    "closeCondition": "完成或批准调整并验证。",
    "method": "比例型＋清单型，系统预判＋人工确认",
    "boundary": ""
  },
  "GEN-B01": {
    "overview": "运营所需营业、产权、开户及其他适用证照建立清单，明确持有人、保管位置、有效期、年审和变更责任，状态与实际一致。",
    "checkPoints": [
      "记录并核对：适用证照数",
      "记录并核对：纳入清单数",
      "记录并核对：有效数",
      "记录并核对：即将到期数",
      "记录并核对：已安排数",
      "记录并核对：变更事项数"
    ],
    "sampling": [
      "执行本模块通用检查窗口与抽样基线；实际数量不足时全部检查。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "适用证照数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录适用证照数"
      },
      {
        "key": "fact_2",
        "label": "纳入清单数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录纳入清单数"
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
        "label": "即将到期数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录即将到期数"
      },
      {
        "key": "fact_5",
        "label": "已安排数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录已安排数"
      },
      {
        "key": "fact_6",
        "label": "变更事项数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录变更事项数"
      },
      {
        "key": "fact_7",
        "label": "及时更新数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录及时更新数"
      },
      {
        "key": "fact_8",
        "label": "账实一致数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录账实一致数"
      }
    ],
    "decision": {
      "compliant": "清单覆盖率、有效率和一致率100%",
      "partial": "一般信息缺项",
      "nonCompliant": "重要证照缺失、失效仍开展受限业务、去向不明或信息严重不实",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "证照漏管",
      "证照过期",
      "年审逾期",
      "变更未办",
      "保管失控",
      "清单与实物不符"
    ],
    "evidence": "证照清单、原件或合法凭证和办理记录",
    "closeCondition": "恢复有效并评估影响。",
    "method": "比例型＋清单型，系统预判＋人工确认",
    "boundary": ""
  },
  "GEN-B02": {
    "overview": "对运营协议和重要合同识别履约主体、服务范围、期限、通知、付款、调价、保底、保险、违约和争议等关键义务，形成可执行清单。",
    "checkPoints": [
      "记录并核对：重要合同数",
      "记录并核对：已建立义务清单数",
      "记录并核对：应识别义务数",
      "记录并核对：已识别数",
      "记录并核对：责任和期限明确数",
      "记录并核对：变更补充协议已更新数"
    ],
    "sampling": [
      "执行本模块通用检查窗口与抽样基线；实际数量不足时全部检查。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "重要合同数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录重要合同数"
      },
      {
        "key": "fact_2",
        "label": "已建立义务清单数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录已建立义务清单数"
      },
      {
        "key": "fact_3",
        "label": "应识别义务数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录应识别义务数"
      },
      {
        "key": "fact_4",
        "label": "已识别数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录已识别数"
      },
      {
        "key": "fact_5",
        "label": "责任和期限明确数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录责任和期限明确数"
      },
      {
        "key": "fact_6",
        "label": "变更补充协议已更新数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录变更补充协议已更新数"
      }
    ],
    "decision": {
      "compliant": "重要合同义务覆盖率100%、责任期限清晰",
      "partial": "一般义务少量缺项",
      "nonCompliant": "核心义务未识别、补充协议未纳入或清单与合同明显冲突",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "合同漏管",
      "核心义务漏识别",
      "责任不明",
      "期限不明",
      "补充协议未更新",
      "清单错误"
    ],
    "evidence": "合同台账、义务清单和代表性合同核对",
    "closeCondition": "经授权复核并更新。",
    "method": "比例型＋清单型，系统预判＋人工确认",
    "boundary": ""
  },
  "GEN-B03": {
    "overview": "合同通知、续签、报告、保险及其他外部合规事项在适用期限内办理，异常、争议和到期风险及时报告并采取措施。",
    "checkPoints": [
      "记录并核对：当期应办理数",
      "按期完成数",
      "记录并核对：逾期数及天数",
      "记录并核对：应升级风险数",
      "记录并核对：及时升级数",
      "记录并核对：补救措施有效数"
    ],
    "sampling": [
      "执行本模块通用检查窗口与抽样基线；实际数量不足时全部检查。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "当期应办理数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录当期应办理数"
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
        "label": "逾期数及天数",
        "type": "number",
        "unit": "天",
        "placeholder": "记录逾期数及天数"
      },
      {
        "key": "fact_4",
        "label": "应升级风险数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录应升级风险数"
      },
      {
        "key": "fact_5",
        "label": "及时升级数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录及时升级数"
      },
      {
        "key": "fact_6",
        "label": "补救措施有效数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录补救措施有效数"
      }
    ],
    "decision": {
      "compliant": "按期完成率和应升级及时率100%",
      "partial": "一般事项轻微逾期且已补救",
      "nonCompliant": "重要义务逾期无措施、隐瞒争议或擅自承诺超授权事项",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "履约逾期",
      "续签遗漏",
      "通知遗漏",
      "风险未升级",
      "越权承诺",
      "补救不足"
    ],
    "evidence": "履约台账、对外文件和审批",
    "closeCondition": "完成补救并确认法律或合同影响受控。",
    "method": "比例型＋清单型，系统预判＋人工确认",
    "boundary": ""
  },
  "GEN-B04": {
    "overview": "重大经营、合规、诉讼仲裁及其他可能影响持续运营的事项统一登记，明确责任、应对方案、里程碑和报告机制。",
    "checkPoints": [
      "记录并核对：已知重大风险数",
      "记录并核对：登记数",
      "记录并核对：有责任和措施数",
      "记录并核对：到期里程碑数",
      "记录并核对：完成数",
      "记录并核对：应报告数"
    ],
    "sampling": [
      "执行本模块通用检查窗口与抽样基线；实际数量不足时全部检查。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "已知重大风险数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录已知重大风险数"
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
        "label": "有责任和措施数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录有责任和措施数"
      },
      {
        "key": "fact_4",
        "label": "到期里程碑数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录到期里程碑数"
      },
      {
        "key": "fact_5",
        "label": "完成数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录完成数"
      },
      {
        "key": "fact_6",
        "label": "应报告数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录应报告数"
      },
      {
        "key": "fact_7",
        "label": "已报告数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录已报告数"
      }
    ],
    "decision": {
      "compliant": "风险登记、措施和报告覆盖率100%",
      "partial": "一般更新稍迟",
      "nonCompliant": "重大风险故意不登记、不报告、无责任措施或未经授权擅自处置",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "风险漏报",
      "台账漏项",
      "责任缺失",
      "措施缺失",
      "里程碑逾期",
      "越权处置"
    ],
    "evidence": "风险台账、法律或业务意见、决策和进展",
    "closeCondition": "按里程碑验证风险下降。",
    "method": "比例型＋清单型，系统预判＋人工确认",
    "boundary": ""
  },
  "GEN-C01": {
    "overview": "文书、运营、基建、会计及其他适用档案按归档范围和保管要求及时收集、整理、编目和保管，电子与纸质载体可检索、防损毁。",
    "checkPoints": [
      "核对各主要类别不少于5卷或件，重大项目档案重点抽查。",
      "记录并核对：应归档事项数",
      "记录并核对：已归档数",
      "按期数",
      "抽查档案数",
      "记录并核对：完整可检索数"
    ],
    "sampling": [
      "各主要类别不少于5卷或件，重大项目档案重点抽查。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "应归档事项数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录应归档事项数"
      },
      {
        "key": "fact_2",
        "label": "已归档数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录已归档数"
      },
      {
        "key": "fact_3",
        "label": "按期数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录按期数"
      },
      {
        "key": "fact_4",
        "label": "抽查档案数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录抽查档案数"
      },
      {
        "key": "fact_5",
        "label": "完整可检索数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录完整可检索数"
      },
      {
        "key": "fact_6",
        "label": "保管环境缺陷数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录保管环境缺陷数"
      },
      {
        "key": "fact_7",
        "label": "电子备份有效数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录电子备份有效数"
      }
    ],
    "decision": {
      "compliant": "归档完整率、及时率和可检索率100%",
      "partial": "一般资料缺项",
      "nonCompliant": "核心档案大量缺失、损毁风险未控制、擅自销毁或无法追溯",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "归档遗漏",
      "归档逾期",
      "编目错误",
      "无法检索",
      "保管环境不当",
      "备份缺失"
    ],
    "evidence": "归档清单、实体电子档案和保管现场",
    "closeCondition": "补归档或依法重建并复核。",
    "method": "比例型＋清单型，系统预判＋人工确认",
    "boundary": ""
  },
  "GEN-C02": {
    "overview": "收文、发文履行登记、拟办或审批、承办、签发、发送和归档等适用程序，重要来文要求形成跟踪任务。",
    "checkPoints": [
      "记录并核对：收发文件数",
      "记录并核对：登记数",
      "抽查文件数",
      "记录并核对：程序完整数",
      "记录并核对：需承办数",
      "按期闭环数"
    ],
    "sampling": [
      "执行本模块通用检查窗口与抽样基线；实际数量不足时全部检查。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "收发文件数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录收发文件数"
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
        "label": "抽查文件数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录抽查文件数"
      },
      {
        "key": "fact_4",
        "label": "程序完整数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录程序完整数"
      },
      {
        "key": "fact_5",
        "label": "需承办数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录需承办数"
      },
      {
        "key": "fact_6",
        "label": "按期闭环数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录按期闭环数"
      },
      {
        "key": "fact_7",
        "label": "归档数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录归档数"
      }
    ],
    "decision": {
      "compliant": "抽查程序和承办闭环率100%",
      "partial": "一般文件个别要素缺失",
      "nonCompliant": "重要来文漏办、未经授权发文、文件内容或日期造假",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "收文漏登",
      "承办遗漏",
      "发文未审批",
      "签发越权",
      "发送无证据",
      "归档缺失"
    ],
    "evidence": "收发文登记、审批承办和归档",
    "closeCondition": "补办并验证影响已处理。",
    "method": "比例型＋清单型，系统预判＋人工确认",
    "boundary": ""
  },
  "GEN-C03": {
    "overview": "印章和重要证照专人保管，领用、用印、外借和归还按授权审批并逐项登记，用印内容与批准文件一致。",
    "checkPoints": [
      "记录并核对：印章证照数",
      "记录并核对：账实一致数",
      "记录并核对：用印或借用事项数",
      "记录并核对：审批完整数",
      "按期归还数",
      "核对空白用印"
    ],
    "sampling": [
      "执行本模块通用检查窗口与抽样基线；实际数量不足时全部检查。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "印章证照数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录印章证照数"
      },
      {
        "key": "fact_2",
        "label": "账实一致数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录账实一致数"
      },
      {
        "key": "fact_3",
        "label": "用印或借用事项数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录用印或借用事项数"
      },
      {
        "key": "fact_4",
        "label": "审批完整数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录审批完整数"
      },
      {
        "key": "fact_5",
        "label": "按期归还数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录按期归还数"
      },
      {
        "key": "fact_6",
        "label": "空白用印",
        "type": "text",
        "placeholder": "记录空白用印"
      },
      {
        "key": "fact_7",
        "label": "越权或私自携出数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录越权或私自携出数"
      }
    ],
    "decision": {
      "compliant": "保管、审批和登记符合率100%",
      "partial": "非关键登记缺项",
      "nonCompliant": "印章证照丢失失控、空白用印、越权用印或记录造假为不符合并触发关键控制失效。",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "保管失控",
      "审批缺失",
      "越权用印",
      "空白用印",
      "借出逾期",
      "账实不符"
    ],
    "evidence": "实物盘点、使用台账和审批文件",
    "closeCondition": "追回、换控或风险处置后复核。",
    "method": "比例型＋清单型，系统预判＋人工确认",
    "boundary": ""
  },
  "GEN-C04": {
    "overview": "重要资料借阅、岗位移交、对外复制和到期销毁有授权、有清单、有交接和去向记录，保密及保存期限得到遵守。",
    "checkPoints": [
      "抽查事项数",
      "记录并核对：授权完整数",
      "记录并核对：应归还数",
      "按期归还数",
      "记录并核对：岗位变动数",
      "记录并核对：完成移交数"
    ],
    "sampling": [
      "执行本模块通用检查窗口与抽样基线；实际数量不足时全部检查。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "抽查事项数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录抽查事项数"
      },
      {
        "key": "fact_2",
        "label": "授权完整数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录授权完整数"
      },
      {
        "key": "fact_3",
        "label": "应归还数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录应归还数"
      },
      {
        "key": "fact_4",
        "label": "按期归还数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录按期归还数"
      },
      {
        "key": "fact_5",
        "label": "岗位变动数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录岗位变动数"
      },
      {
        "key": "fact_6",
        "label": "完成移交数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录完成移交数"
      },
      {
        "key": "fact_7",
        "label": "销毁事项批准见证数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录销毁事项批准见证数"
      }
    ],
    "decision": {
      "compliant": "事项可追溯率100%",
      "partial": "一般登记缺项",
      "nonCompliant": "核心资料去向不明、擅自复制销毁、离岗未移交造成重大缺失",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "借阅无审批",
      "归还逾期",
      "移交缺失",
      "擅自复制",
      "擅自销毁",
      "去向不明"
    ],
    "evidence": "借阅移交销毁记录和实物核对",
    "closeCondition": "追回、重建或依法处置风险。",
    "method": "比例型＋清单型，系统预判＋人工确认",
    "boundary": ""
  },
  "GEN-D01": {
    "overview": "招聘、录用、入职、试用转正、异动、离职、退休和返聘等事项按适用法律及授权流程及时办理，人员身份和岗位信息一致。",
    "checkPoints": [
      "记录并核对：当期人事事项数",
      "记录并核对：流程完整数",
      "按期数",
      "记录并核对：审批授权符合数",
      "记录并核对：离职移交完成数",
      "记录并核对：异常事项升级数"
    ],
    "sampling": [
      "执行本模块通用检查窗口与抽样基线；实际数量不足时全部检查。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "当期人事事项数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录当期人事事项数"
      },
      {
        "key": "fact_2",
        "label": "流程完整数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录流程完整数"
      },
      {
        "key": "fact_3",
        "label": "按期数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录按期数"
      },
      {
        "key": "fact_4",
        "label": "审批授权符合数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录审批授权符合数"
      },
      {
        "key": "fact_5",
        "label": "离职移交完成数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录离职移交完成数"
      },
      {
        "key": "fact_6",
        "label": "异常事项升级数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录异常事项升级数"
      }
    ],
    "decision": {
      "compliant": "事项合规率和及时率100%",
      "partial": "一般资料缺项",
      "nonCompliant": "违法或越权录用解聘、关键手续长期未办、伪造人员流程",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "招聘越权",
      "入职手续缺失",
      "转正逾期",
      "异动未更新",
      "离职移交缺失",
      "程序违法"
    ],
    "evidence": "人员变动清单、审批和交接",
    "closeCondition": "补正程序并处理劳动风险。",
    "method": "比例型＋清单型，系统预判＋人工确认",
    "boundary": ""
  },
  "GEN-D02": {
    "overview": "依法及时订立和管理劳动合同及适用协议，员工档案、社保公积金、考勤和岗位信息完整准确，敏感信息受控。",
    "checkPoints": [
      "核对人员名册全量核对，档案不少于10人并覆盖入职、异动和离职人员。",
      "记录并核对：在册人数",
      "记录并核对：合同有效人数",
      "记录并核对：应参保人数",
      "记录并核对：已办理人数",
      "记录并核对：档案完整人数"
    ],
    "sampling": [
      "人员名册全量核对，档案不少于10人并覆盖入职、异动和离职人员。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "在册人数",
        "type": "number",
        "unit": "人",
        "placeholder": "记录在册人数"
      },
      {
        "key": "fact_2",
        "label": "合同有效人数",
        "type": "number",
        "unit": "人",
        "placeholder": "记录合同有效人数"
      },
      {
        "key": "fact_3",
        "label": "应参保人数",
        "type": "number",
        "unit": "人",
        "placeholder": "记录应参保人数"
      },
      {
        "key": "fact_4",
        "label": "已办理人数",
        "type": "number",
        "unit": "人",
        "placeholder": "记录已办理人数"
      },
      {
        "key": "fact_5",
        "label": "档案完整人数",
        "type": "number",
        "unit": "人",
        "placeholder": "记录档案完整人数"
      },
      {
        "key": "fact_6",
        "label": "考勤与人员状态一致数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录考勤与人员状态一致数"
      },
      {
        "key": "fact_7",
        "label": "合同到期预警数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录合同到期预警数"
      }
    ],
    "decision": {
      "compliant": "法定与制度事项覆盖率100%、数据一致",
      "partial": "一般档案要素不足",
      "nonCompliant": "未依法及时订立合同、多人漏缴应缴项目、考勤或人员数据造假",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "合同未签",
      "合同过期",
      "档案缺失",
      "参保遗漏",
      "考勤异常",
      "个人信息失控"
    ],
    "evidence": "名册、合同、参保和考勤核对",
    "closeCondition": "依法补正并确认影响处理。",
    "method": "比例型＋清单型，系统预判＋人工确认",
    "boundary": ""
  },
  "GEN-D03": {
    "overview": "年度培训计划基于岗位需求、能力差距和法规制度变化制定，明确专业培训归属，避免综合模块重复评价专业效果。",
    "checkPoints": [
      "记录并核对：岗位需求数",
      "记录并核对：纳入计划数",
      "记录并核对：计划课程数",
      "按期完成数",
      "记录并核对：应参加人数",
      "记录并核对：实际人数"
    ],
    "sampling": [
      "执行本模块通用检查窗口与抽样基线；实际数量不足时全部检查。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "岗位需求数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录岗位需求数"
      },
      {
        "key": "fact_2",
        "label": "纳入计划数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录纳入计划数"
      },
      {
        "key": "fact_3",
        "label": "计划课程数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录计划课程数"
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
        "label": "应参加人数",
        "type": "number",
        "unit": "人",
        "placeholder": "记录应参加人数"
      },
      {
        "key": "fact_6",
        "label": "实际人数",
        "type": "number",
        "unit": "人",
        "placeholder": "记录实际人数"
      },
      {
        "key": "fact_7",
        "label": "转交专业模块事项数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录转交专业模块事项数"
      },
      {
        "key": "fact_8",
        "label": "完成数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录完成数"
      }
    ],
    "decision": {
      "compliant": "需求覆盖和计划完成率100%、归属清晰",
      "partial": "一般课程延期",
      "nonCompliant": "关键通用培训漏项、计划与岗位无关或同一培训在多个模块重复计分",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "需求未识别",
      "计划漏项",
      "培训逾期",
      "人员漏训",
      "模块归属错误",
      "重复计分"
    ],
    "evidence": "需求分析、计划记录和模块映射",
    "closeCondition": "补训或转交并验证。",
    "method": "比例型＋清单型，系统预判＋人工确认",
    "boundary": ""
  },
  "GEN-D04": {
    "overview": "绩效目标、指标口径、过程沟通、结果确认、申诉和档案管理按适用制度执行，评价依据可追溯。",
    "checkPoints": [
      "记录并核对：应考核人数",
      "记录并核对：完成数",
      "记录并核对：目标确认数",
      "记录并核对：过程反馈数",
      "记录并核对：结果签认或告知数",
      "记录并核对：申诉按期处理数"
    ],
    "sampling": [
      "执行本模块通用检查窗口与抽样基线；实际数量不足时全部检查。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "应考核人数",
        "type": "number",
        "unit": "人",
        "placeholder": "记录应考核人数"
      },
      {
        "key": "fact_2",
        "label": "完成数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录完成数"
      },
      {
        "key": "fact_3",
        "label": "目标确认数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录目标确认数"
      },
      {
        "key": "fact_4",
        "label": "过程反馈数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录过程反馈数"
      },
      {
        "key": "fact_5",
        "label": "结果签认或告知数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录结果签认或告知数"
      },
      {
        "key": "fact_6",
        "label": "申诉按期处理数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录申诉按期处理数"
      }
    ],
    "decision": {
      "compliant": "程序覆盖率100%、依据可追溯",
      "partial": "一般记录缺项",
      "nonCompliant": "大面积无依据打分、结果篡改、越权决定或申诉机制失效",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "目标未确认",
      "依据不清",
      "过程无反馈",
      "结果未告知",
      "申诉逾期",
      "结果篡改"
    ],
    "evidence": "绩效文件、沟通确认和申诉记录",
    "closeCondition": "补正程序并复核影响。",
    "method": "比例型＋清单型，系统预判＋人工确认",
    "boundary": ""
  },
  "GEN-E01": {
    "overview": "采购需求合理明确，按适用规则完成计划、比价或采购方式、审批、合同或订单、到货验收和归档，紧急采购有补充控制。",
    "checkPoints": [
      "记录并核对：采购事项数",
      "记录并核对：程序合规数",
      "记录并核对：审批授权符合数",
      "记录并核对：应验收数",
      "记录并核对：已验收数",
      "记录并核对：紧急采购数"
    ],
    "sampling": [
      "执行本模块通用检查窗口与抽样基线；实际数量不足时全部检查。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "采购事项数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录采购事项数"
      },
      {
        "key": "fact_2",
        "label": "程序合规数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录程序合规数"
      },
      {
        "key": "fact_3",
        "label": "审批授权符合数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录审批授权符合数"
      },
      {
        "key": "fact_4",
        "label": "应验收数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录应验收数"
      },
      {
        "key": "fact_5",
        "label": "已验收数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录已验收数"
      },
      {
        "key": "fact_6",
        "label": "紧急采购数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录紧急采购数"
      },
      {
        "key": "fact_7",
        "label": "补办完整数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录补办完整数"
      },
      {
        "key": "fact_8",
        "label": "拆分规避数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录拆分规避数"
      }
    ],
    "decision": {
      "compliant": "采购程序和验收覆盖率100%",
      "partial": "一般资料缺项",
      "nonCompliant": "规避审批或采购程序、虚假比价验收、未经授权采购或记录造假",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "需求不清",
      "采购方式错误",
      "越权审批",
      "拆分规避",
      "验收缺失",
      "虚假资料"
    ],
    "evidence": "采购全套资料和实物",
    "closeCondition": "依法依规纠正并验证交付。",
    "method": "比例型＋清单型，系统预判＋人工确认",
    "boundary": ""
  },
  "GEN-E02": {
    "overview": "库房按物资属性分类标识，出入库有授权和单据，定期盘点并处理差异；专业储存条件由相应模块协同确认。",
    "checkPoints": [
      "记录并核对：重点、高值和易耗物资各覆盖，总数不少于15项。",
      "抽查物资数",
      "记录并核对：账实一致数",
      "记录并核对：出入库单数",
      "记录并核对：合规数",
      "记录并核对：盘点差异数"
    ],
    "sampling": [
      "重点、高值和易耗物资各覆盖，总数不少于15项。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "抽查物资数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录抽查物资数"
      },
      {
        "key": "fact_2",
        "label": "账实一致数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录账实一致数"
      },
      {
        "key": "fact_3",
        "label": "出入库单数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录出入库单数"
      },
      {
        "key": "fact_4",
        "label": "合规数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录合规数"
      },
      {
        "key": "fact_5",
        "label": "盘点差异数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录盘点差异数"
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
        "label": "呆滞或过期物资数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录呆滞或过期物资数"
      }
    ],
    "decision": {
      "compliant": "账实一致率和差异闭环率100%",
      "partial": "少量一般差异已查明",
      "nonCompliant": "重要物资大量短缺、无单出库、账目篡改或差异长期不处理",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "账实不符",
      "无单出入库",
      "标识错误",
      "盘点缺失",
      "差异未处理",
      "呆滞过期"
    ],
    "evidence": "账卡单物核对和盘点处理",
    "closeCondition": "复盘确认一致。",
    "method": "比例型＋清单型，系统预判＋人工确认",
    "boundary": ""
  },
  "GEN-E03": {
    "overview": "固定资产建卡、编号、盘点、调拨、闲置、报废和处置审批完整，财务或资产台账与实物一致，技术判断由专业部门提供。",
    "checkPoints": [
      "记录并核对：资产数",
      "记录并核对：建卡数",
      "抽查资产数",
      "记录并核对：账实一致数",
      "记录并核对：调拨报废事项数",
      "记录并核对：程序完整数"
    ],
    "sampling": [
      "执行本模块通用检查窗口与抽样基线；实际数量不足时全部检查。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "资产数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录资产数"
      },
      {
        "key": "fact_2",
        "label": "建卡数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录建卡数"
      },
      {
        "key": "fact_3",
        "label": "抽查资产数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录抽查资产数"
      },
      {
        "key": "fact_4",
        "label": "账实一致数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录账实一致数"
      },
      {
        "key": "fact_5",
        "label": "调拨报废事项数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录调拨报废事项数"
      },
      {
        "key": "fact_6",
        "label": "程序完整数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录程序完整数"
      },
      {
        "key": "fact_7",
        "label": "闲置资产数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录闲置资产数"
      },
      {
        "key": "fact_8",
        "label": "已处置或有计划数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录已处置或有计划数"
      }
    ],
    "decision": {
      "compliant": "资产覆盖、账实和事项程序符合率100%",
      "partial": "一般信息缺项",
      "nonCompliant": "重要资产去向不明、未经批准处置、虚构资产或重大盘亏未报告",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "资产漏卡",
      "编号错误",
      "账实不符",
      "调拨无手续",
      "擅自处置",
      "盘亏未报告"
    ],
    "evidence": "资产台账、现场盘点和处置资料",
    "closeCondition": "补正并经授权确认。",
    "method": "比例型＋清单型，系统预判＋人工确认",
    "boundary": ""
  },
  "GEN-E04": {
    "overview": "采购和资产流程明确“专业部门负责技术验收、综合部门保留程序证据”，重要物资设备未经适当技术确认不得正式接收或使用。",
    "checkPoints": [
      "记录并核对：需专业验收事项数",
      "记录并核对：完成数",
      "记录并核对：验收人员权限符合数",
      "记录并核对：不合格品隔离数",
      "记录并核对：综合档案完整数"
    ],
    "sampling": [
      "执行本模块通用检查窗口与抽样基线；实际数量不足时全部检查。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "需专业验收事项数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录需专业验收事项数"
      },
      {
        "key": "fact_2",
        "label": "完成数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录完成数"
      },
      {
        "key": "fact_3",
        "label": "验收人员权限符合数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录验收人员权限符合数"
      },
      {
        "key": "fact_4",
        "label": "不合格品隔离数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录不合格品隔离数"
      },
      {
        "key": "fact_5",
        "label": "综合档案完整数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录综合档案完整数"
      }
    ],
    "decision": {
      "compliant": "专业验收和程序归档覆盖率100%",
      "partial": "一般附件缺项",
      "nonCompliant": "以签收代替技术验收、验收人员无能力或不合格物资直接投入使用",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "技术验收缺失",
      "验收权限不当",
      "不合格未隔离",
      "验收结论不清",
      "程序证据缺失"
    ],
    "evidence": "验收、隔离处置和采购档案",
    "closeCondition": "补验并确认使用风险。",
    "method": "比例型＋清单型，系统预判＋人工确认",
    "boundary": ""
  },
  "GEN-F01": {
    "overview": "办公设施、网络和公共设备故障具有报修、审批、处理和恢复记录，影响核心业务时有替代措施和升级机制。",
    "checkPoints": [
      "记录并核对：报修数",
      "按期完成数",
      "记录并核对：重大故障数",
      "记录并核对：有替代措施数",
      "记录并核对：重复故障数",
      "记录并核对：升级数"
    ],
    "sampling": [
      "执行本模块通用检查窗口与抽样基线；实际数量不足时全部检查。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "报修数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录报修数"
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
        "label": "重大故障数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录重大故障数"
      },
      {
        "key": "fact_4",
        "label": "有替代措施数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录有替代措施数"
      },
      {
        "key": "fact_5",
        "label": "重复故障数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录重复故障数"
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
        "label": "完工确认数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录完工确认数"
      }
    ],
    "decision": {
      "compliant": "重大影响均及时控制、一般报修按期闭环",
      "partial": "少量一般逾期",
      "nonCompliant": "关键办公或通信能力长期中断无措施、虚假关闭",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "报修遗漏",
      "维修逾期",
      "替代措施缺失",
      "重复故障未升级",
      "完工未确认"
    ],
    "evidence": "报修工单、恢复确认和现场",
    "closeCondition": "恢复或验证替代措施。",
    "method": "清单型，系统辅助＋人工确认",
    "boundary": ""
  },
  "GEN-F02": {
    "overview": "门卫值守、来访、车辆和厂区一般秩序按适用规则登记、授权和异常处置；专业安全风险转安全模块形成主问题。",
    "checkPoints": [
      "抽查班次或记录数",
      "记录并核对：符合数",
      "记录并核对：异常进出数",
      "记录并核对：处置数",
      "记录并核对：车辆授权数",
      "记录并核对：有效数"
    ],
    "sampling": [
      "执行本模块通用检查窗口与抽样基线；实际数量不足时全部检查。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "抽查班次或记录数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录抽查班次或记录数"
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
        "label": "异常进出数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录异常进出数"
      },
      {
        "key": "fact_4",
        "label": "处置数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录处置数"
      },
      {
        "key": "fact_5",
        "label": "车辆授权数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录车辆授权数"
      },
      {
        "key": "fact_6",
        "label": "有效数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录有效数"
      },
      {
        "key": "fact_7",
        "label": "记录与现场一致数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录记录与现场一致数"
      }
    ],
    "decision": {
      "compliant": "记录和异常处置符合率100%",
      "partial": "一般登记缺项",
      "nonCompliant": "重要区域长期失控、未经授权人员车辆反复进入或记录造假",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "门卫脱岗",
      "来访漏登",
      "车辆无授权",
      "异常未处置",
      "记录不实",
      "重要区域失控"
    ],
    "evidence": "登记、授权和现场核对",
    "closeCondition": "纠正后连续抽查不少于5个班次。",
    "method": "比例型＋清单型，系统预判＋人工确认",
    "boundary": ""
  },
  "GEN-F03": {
    "overview": "食堂、宿舍、绿化和行政车辆等适用后勤事项具有责任、计划、检查和问题整改；食堂依法落实食品安全主体责任。",
    "checkPoints": [
      "记录并核对：适用后勤事项数",
      "记录并核对：制度责任覆盖数",
      "记录并核对：计划检查数",
      "记录并核对：完成数",
      "记录并核对：问题数",
      "记录并核对：闭环数"
    ],
    "sampling": [
      "执行本模块通用检查窗口与抽样基线；实际数量不足时全部检查。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "适用后勤事项数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录适用后勤事项数"
      },
      {
        "key": "fact_2",
        "label": "制度责任覆盖数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录制度责任覆盖数"
      },
      {
        "key": "fact_3",
        "label": "计划检查数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录计划检查数"
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
        "label": "问题数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录问题数"
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
        "label": "食堂人员",
        "type": "text",
        "placeholder": "记录食堂人员"
      },
      {
        "key": "fact_8",
        "label": "采购留样或环境等适用要素符合数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录采购留样或环境等适用要素符合数"
      }
    ],
    "decision": {
      "compliant": "适用事项受控、问题闭环",
      "partial": "一般管理缺项",
      "nonCompliant": "确认存在重大食品安全风险、行政车辆严重失管或后勤重大问题长期不整改",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "责任缺失",
      "检查漏做",
      "食品安全缺陷",
      "宿舍失管",
      "车辆失管",
      "整改逾期"
    ],
    "evidence": "后勤计划检查、现场和整改",
    "closeCondition": "消除风险并复核。",
    "method": "清单型，系统辅助＋人工确认",
    "boundary": ""
  },
  "GEN-G01": {
    "overview": "例会和专项会议形成具体决议，明确责任、期限和完成标准；逾期事项及时提醒、升级或批准调整。",
    "checkPoints": [
      "最近3个月到期决议不少于10项，重大事项全部。",
      "记录并核对：决议数",
      "记录并核对：责任期限完整数",
      "记录并核对：到期数",
      "按期完成数",
      "记录并核对：逾期数"
    ],
    "sampling": [
      "最近3个月到期决议不少于10项，重大事项全部。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "决议数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录决议数"
      },
      {
        "key": "fact_2",
        "label": "责任期限完整数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录责任期限完整数"
      },
      {
        "key": "fact_3",
        "label": "到期数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录到期数"
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
        "label": "关闭验证数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录关闭验证数"
      }
    ],
    "decision": {
      "compliant": "要素完整、按期闭环和验证率100%",
      "partial": "少量一般逾期",
      "nonCompliant": "重大决议无人负责、长期逾期未升级或仅口头确认关闭",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "决议不具体",
      "责任缺失",
      "期限缺失",
      "督办缺失",
      "逾期未升级",
      "关闭无验证"
    ],
    "evidence": "会议纪要、督办和成果",
    "closeCondition": "验证真实完成。",
    "method": "比例型＋清单型，系统预判＋人工确认",
    "boundary": ""
  },
  "GEN-G02": {
    "overview": "内外部检查、审计和评价问题统一登记、去重、分派、整改和复核，重复或跨模块问题确定唯一主责并升级改进。",
    "checkPoints": [
      "记录并核对：问题数",
      "记录并核对：统一登记数",
      "记录并核对：重复问题数",
      "记录并核对：合并数",
      "记录并核对：到期数",
      "按期闭环数"
    ],
    "sampling": [
      "执行本模块通用检查窗口与抽样基线；实际数量不足时全部检查。"
    ],
    "factFields": [
      {
        "key": "fact_1",
        "label": "问题数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录问题数"
      },
      {
        "key": "fact_2",
        "label": "统一登记数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录统一登记数"
      },
      {
        "key": "fact_3",
        "label": "重复问题数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录重复问题数"
      },
      {
        "key": "fact_4",
        "label": "合并数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录合并数"
      },
      {
        "key": "fact_5",
        "label": "到期数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录到期数"
      },
      {
        "key": "fact_6",
        "label": "按期闭环数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录按期闭环数"
      },
      {
        "key": "fact_7",
        "label": "跨模块问题主责明确数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录跨模块问题主责明确数"
      },
      {
        "key": "fact_8",
        "label": "复发数",
        "type": "number",
        "unit": "项",
        "placeholder": "记录复发数"
      }
    ],
    "decision": {
      "compliant": "登记、主责和闭环率100%",
      "partial": "一般问题少量逾期",
      "nonCompliant": "重大问题漏登、同一问题多头重复扣分、虚假关闭或重复问题持续不升级",
      "notApplicable": "设施、工艺、业务模式或评价期客观事实决定本项不适用，并已记录可验证原因。"
    },
    "problemTags": [
      "问题漏登",
      "重复建单",
      "主责不清",
      "整改逾期",
      "虚假关闭",
      "重复问题"
    ],
    "evidence": "统一问题台账、关联关系和复核",
    "closeCondition": "完成整改并观察无复发。",
    "method": "比例型＋清单型，系统预判＋人工确认",
    "boundary": ""
  }
}
