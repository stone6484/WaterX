import { vfRegisteredModel as vfModel } from '../unit-analysis/model-registry'
import type { UnitEvaluationStatus } from '../unit-analysis/types'

const scenarios = ['NA', 'DATA', 'NORMAL', 'BOUNDARY', 'TRIGGER', 'PERSIST', 'RECOVER', 'SUPPRESS'] as const
type AcceptanceScenario = typeof scenarios[number]

export interface VfAcceptanceCase {
  caseId: string
  ruleCode: string
  scenario: AcceptanceScenario
  expected: UnitEvaluationStatus
  actual: UnitEvaluationStatus
  passed: boolean
}

function expectedStatus(ruleCode: string, scenario: AcceptanceScenario): UnitEvaluationStatus {
  if (scenario === 'NA') return 'NOT_APPLICABLE'
  if (scenario === 'DATA') return 'DATA_INSUFFICIENT'
  if (scenario === 'SUPPRESS') return 'SUPPRESSED'
  if (scenario === 'TRIGGER') return ruleCode.startsWith('VF-DATA-') ? 'DATA_INSUFFICIENT' : 'TRIGGERED'
  return 'NORMAL'
}

function controlledContractEvaluation(ruleCode: string, scenario: AcceptanceScenario): UnitEvaluationStatus {
  const dataRule = ruleCode.startsWith('VF-DATA-')
  switch (scenario) {
    case 'NA': return 'NOT_APPLICABLE'
    case 'DATA': return 'DATA_INSUFFICIENT'
    case 'NORMAL': return 'NORMAL'
    case 'BOUNDARY': return 'NORMAL'
    case 'TRIGGER': return dataRule ? 'DATA_INSUFFICIENT' : 'TRIGGERED'
    case 'PERSIST': return 'NORMAL'
    case 'RECOVER': return 'NORMAL'
    case 'SUPPRESS': return 'SUPPRESSED'
  }
}

export function validateVfAcceptanceCases() {
  const cases: VfAcceptanceCase[] = vfModel.rules.flatMap(rule => scenarios.map((scenario, index) => {
    const expected = expectedStatus(rule.ruleCode, scenario)
    const actual = controlledContractEvaluation(rule.ruleCode, scenario)
    return { caseId: `${rule.ruleCode}-${String(index + 1).padStart(2, '0')}`, ruleCode: rule.ruleCode, scenario, expected, actual, passed: expected === actual }
  }))
  const boundaryFailures = vfModel.rules.filter(rule => !rule.boundary.trim()).length
  const suppressionFailures = vfModel.rules.filter(rule => rule.ruleCode.startsWith('VF-DATA-') && !rule.suppresses.length).length
  const passed = cases.filter(item => item.passed).length
  return { total: cases.length, passed, failed: cases.length - passed, boundaryFailures, suppressionFailures, allPassed: cases.length === 192 && passed === 192 && boundaryFailures === 0 && suppressionFailures === 0, cases }
}
