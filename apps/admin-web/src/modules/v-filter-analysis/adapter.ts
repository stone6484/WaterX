import { calculateVfMetrics, createVfCauses, evaluateVfRules, mapVfFields } from './engine'
import { createVfPlan, createVfVerification, DEFAULT_VF_SCENARIO_ID, vfScenarios } from './demo-data'
import type { UnitCauseState, UnitOptimizationPlan, UnitVerification, VfModelView, VfScenarioId } from './types'

const STORAGE_KEY = 'waterx-vf-v1-demo-state'

export interface PersistedVfState {
  scenarioId: VfScenarioId
  causes: VfModelView['causes']
  plan: UnitOptimizationPlan
  verification: UnitVerification
}

function defaults(scenarioId: VfScenarioId = DEFAULT_VF_SCENARIO_ID): PersistedVfState {
  return { scenarioId, causes: createVfCauses(), plan: createVfPlan(), verification: createVfVerification() }
}

export function loadVfState() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') as PersistedVfState | null
    if (stored && vfScenarios.some(item => item.id === stored.scenarioId)) return stored
  } catch {
    // 本地演示状态异常时回退到固定样例。
  }
  return defaults()
}

export function saveVfState(state: PersistedVfState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function resetVfState(scenarioId: VfScenarioId = DEFAULT_VF_SCENARIO_ID) {
  const state = defaults(scenarioId)
  saveVfState(state)
  return state
}

export function buildVfView(state: PersistedVfState): VfModelView {
  const scenario = vfScenarios.find(item => item.id === state.scenarioId) ?? vfScenarios[0]
  const metrics = calculateVfMetrics(scenario)
  return {
    scenario,
    fields: mapVfFields(scenario),
    metrics,
    rules: evaluateVfRules(scenario, metrics),
    causes: state.causes,
    plan: state.plan,
    verification: state.verification
  }
}

export function updateVfCause(state: PersistedVfState, causeCode: string, nextState: UnitCauseState, note: string) {
  const cause = state.causes.find(item => item.causeCode === causeCode)
  if (!cause) return
  cause.state = nextState
  cause.note = note
  saveVfState(state)
}
