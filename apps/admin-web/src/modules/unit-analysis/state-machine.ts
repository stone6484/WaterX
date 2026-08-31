import type { UnitOptimizationPlan, UnitVerification } from './types'

export function advanceUnitPlan(plan: UnitOptimizationPlan) {
  const next = { 草稿: '待审批', 待审批: '执行中', 执行中: '待验证', 待验证: '已完成' } as const
  if (!(plan.status in next)) return plan
  plan.status = next[plan.status as keyof typeof next]
  if (plan.status === '执行中') plan.actions.forEach(action => { action.status = '执行中' })
  if (plan.status === '待验证') plan.actions.forEach(action => { action.status = '已完成' })
  return plan
}

export function rollbackUnitPlan(plan: UnitOptimizationPlan) {
  plan.status = '已回退'
  plan.actions.forEach(action => { action.status = '已停止' })
  return plan
}

export function decideUnitVerification(
  plan: UnitOptimizationPlan,
  verification: UnitVerification,
  decision: UnitVerification['decision'],
  acceptedSaving: number
) {
  if (!verification.comparable && decision === 'ACCEPT') return false
  if (decision === 'NOT_COMPARABLE') {
    verification.comparable = false
    verification.verifiedAnnualSaving = null
    plan.status = '待验证'
  }
  if (decision === 'CONTINUE' && verification.checks.every(item => item.passed)) {
    verification.comparable = true
    verification.verifiedAnnualSaving = acceptedSaving
    plan.status = '待验证'
  }
  verification.decision = decision
  if (decision === 'ACCEPT') plan.status = '已完成'
  if (decision === 'ROLLBACK') plan.status = '已回退'
  return true
}
