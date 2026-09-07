import type { Draft } from './types'
import { combine, derive, finish, number, readFact, result, structuralIssues, threshold } from './calculation'
export function energyAnalysis(d: Draft) {
  const facts = d.facts.map(f => readFact(f, d, f.role === 'WATER' ? 'm³' : 'kWh'))
  const group = (role: string) => facts.filter(m => d.facts.some(f => f.id === m.id && f.selected && f.role === role))
  const mains = group('MAIN').filter(m => m.status !== 'NA')
  const main = mains.length === 1 ? { ...mains[0]!, id: 'EN-02', name: '全厂消耗电量' } : result('EN-02', '全厂消耗电量', 'kWh', null, [], '选定一个同边界消耗总表', mains.length > 1 ? 'INVALID' : 'MISSING', '必须选定一个同边界消耗总表，不叠加购电和设备子表')
  if (!d.complete || !d.basis.trim()) { main.value = null; main.status = 'MISSING'; main.note = '请确认消耗总表边界，购电不能未经核验视作消耗' }
  const waters = group('WATER'), water = combine('EN-Q', '同周期处理水量', 'm³', waters)
  const qIssues = structuralIssues(d.facts, d.facts.filter(f => f.selected && f.role === 'WATER' && f.state !== 'NA'))
  if (qIssues.length) { water.value = null; water.status = 'INVALID'; water.note = qIssues.join('；') }
  const parts = group('PART'), measured = combine('EN-04', '实测分项合计', 'kWh', parts.filter(m => m.status !== 'ESTIMATED'))
  const estimated = combine('EN-EST', '估算分项合计', 'kWh', parts.filter(m => m.status === 'ESTIMATED'), true)
  const issues = structuralIssues(d.facts, d.facts.filter(f => f.selected && f.role === 'PART' && f.state !== 'NA'))
  if (issues.length) for (const m of [measured, estimated]) { m.value = null; m.status = 'INVALID'; m.note = issues.join('；') }
  const intensity = derive('EN-03', '单位处理量电耗', 'kWh/m³', [main, water], '消耗电量/同日处理水量', ([e, q]) => q! > 0 ? e! / q! : null)
  const unallocated = derive('EN-05', '未计量分配差额', 'kWh', [main, measured], '消耗总量−互斥实测分项', ([e, m]) => e! - m!)
  const unexplained = derive('EN-UNKNOWN', '扣除估算后待解释', 'kWh', [unallocated, estimated], '未计量差额−不重叠估算（估算不变实测）', ([e, m]) => e! - m!)
  if (unallocated.value !== null && unallocated.value < 0 || unexplained.value !== null && unexplained.value < 0) issues.push('分项超过总量：保留负差额，请核验包含关系、同期性和仪表；不是负损耗')
  const p = (key: string, name: string, unit: string) => { const n = number(d.parameters[key]); return result(`EN-${key}`, name, unit, n !== null && n >= 0 ? n : null, [], '已确认同期参数；来源：' + (d.parameters.costSource || '待提供'), n !== null && n < 0 ? 'INVALID' : 'VALID') }
  const price = p('price', '本期已确认均价', '元/kWh'), previous = p('previousEnergy', '对照期电量', 'kWh'), oldPrice = p('previousPrice', '对照期均价', '元/kWh')
  if (!d.checks.price || !d.parameters.costSource?.trim()) { price.value = oldPrice.value = null; price.status = oldPrice.status = 'MISSING' }
  const cost = derive('EN-08', '所列电量费用', '元', [main, price], '电量×已确认周期均价；不含固定及需量费', ([e, p]) => e! * p!)
  const volumeEffect = derive('EN-09-E', '电量因素费用变化', '元', [main, previous, oldPrice], '(本期电量−对照电量)×对照均价', ([e, old, p]) => (e! - old!) * p!)
  const priceEffect = derive('EN-09-P', '价格因素费用变化', '元', [main, price, oldPrice], '本期电量×(本期均价−对照均价)', ([e, p, old]) => e! * (p! - old!))
  return finish([main, water, intensity, measured, estimated, unallocated, unexplained, cost, volumeEffect, priceEffect, ...facts], [...issues, ...qIssues, ...threshold(d, intensity, '单位处理量电耗'), '本页首期仅电能日核算；费用变化不是可归因节约。不将月均量拆成实测日数据。'])
}
export function periodIntensity(days: { energy: number | null; water: number | null }[]): number | null {
  if (!days.length || days.some(d => d.energy === null || d.water === null || !Number.isFinite(d.energy) || !Number.isFinite(d.water) || d.energy < 0 || d.water < 0)) return null
  const water = days.reduce((s, d) => s + d.water!, 0)
  return water > 0 ? days.reduce((s, d) => s + d.energy!, 0) / water : null
}
