import { createCauseVerifications, calculateMetrics, evaluateRules, mapFields } from './engine'
import { createDemoPlan, createDemoVerification, DEFAULT_HSC_SCENARIO_ID, hscScenarios } from './demo-data'
import type {
  HscCauseState,
  HscModelView,
  HscOptimizationPlan,
  HscScenarioId,
  HscVerification
} from './types'

const STORAGE_KEY = 'waterx-hsc-v1-demo-state'

interface PersistedHscState {
  scenarioId: HscScenarioId
  causes: HscModelView['causes']
  plan: HscOptimizationPlan
  verification: HscVerification
}

function defaultState(scenarioId: HscScenarioId = DEFAULT_HSC_SCENARIO_ID): PersistedHscState {
  return {
    scenarioId,
    causes: createCauseVerifications(),
    plan: createDemoPlan(),
    verification: createDemoVerification()
  }
}

export function loadHscState(): PersistedHscState {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') as PersistedHscState | null
    if (stored && hscScenarios.some(item => item.id === stored.scenarioId)) return stored
  } catch {
    // 固定演示数据损坏时回退到基线，不影响主产品其他本地数据。
  }
  return defaultState()
}

export function saveHscState(state: PersistedHscState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function resetHscState(scenarioId: HscScenarioId = DEFAULT_HSC_SCENARIO_ID): PersistedHscState {
  const state = defaultState(scenarioId)
  saveHscState(state)
  return state
}

export function buildHscView(state: PersistedHscState): HscModelView {
  const scenario = hscScenarios.find(item => item.id === state.scenarioId) ?? hscScenarios[0]
  const metrics = calculateMetrics(scenario)
  return {
    scenario,
    fields: mapFields(scenario),
    metrics,
    rules: evaluateRules(scenario, metrics),
    causes: state.causes,
    plan: state.plan,
    verification: state.verification
  }
}

export function updateCauseState(state: PersistedHscState, causeCode: string, nextState: HscCauseState, note: string) {
  const cause = state.causes.find(item => item.causeCode === causeCode)
  if (!cause) return
  cause.state = nextState
  cause.note = note
  saveHscState(state)
}

export function updatePlan(state: PersistedHscState, plan: HscOptimizationPlan) {
  state.plan = plan
  saveHscState(state)
}

export function updateVerification(state: PersistedHscState, verification: HscVerification) {
  state.verification = verification
  saveHscState(state)
}

export type { PersistedHscState }
