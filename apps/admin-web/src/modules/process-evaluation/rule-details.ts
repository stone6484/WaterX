import { EQUIPMENT_RULE_DETAILS } from './rule-details-equipment'
import { GENERAL_RULE_DETAILS } from './rule-details-general'
import { LABORATORY_RULE_DETAILS } from './rule-details-laboratory'
import { OPERATIONS_RULE_DETAILS } from './rule-details-operations'
import { SAFETY_RULE_DETAILS } from './rule-details-safety'
import type { ProcessModuleKey, ProcessRuleDetail } from './types'

export const PROCESS_RULE_DETAILS: Record<ProcessModuleKey, Record<string, ProcessRuleDetail>> = {
  operations: OPERATIONS_RULE_DETAILS,
  equipment: EQUIPMENT_RULE_DETAILS,
  laboratory: LABORATORY_RULE_DETAILS,
  safety: SAFETY_RULE_DETAILS,
  general: GENERAL_RULE_DETAILS,
}

export const PROCESS_RULE_DETAIL_COUNTS: Record<ProcessModuleKey, number> = {
  operations: Object.keys(OPERATIONS_RULE_DETAILS).length,
  equipment: Object.keys(EQUIPMENT_RULE_DETAILS).length,
  laboratory: Object.keys(LABORATORY_RULE_DETAILS).length,
  safety: Object.keys(SAFETY_RULE_DETAILS).length,
  general: Object.keys(GENERAL_RULE_DETAILS).length,
}
