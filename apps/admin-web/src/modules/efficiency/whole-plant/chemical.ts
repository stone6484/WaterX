import type { Draft, Metric } from './types'
import { combine, derive, finish, number, readFact, result, structuralIssues } from './calculation'
export function chemicalAnalysis(d: Draft) {
  const metrics: Metric[] = [], costs: Metric[] = []
  const selected = d.facts.filter(f => f.selected && ['DOSING', 'CARBON', 'COST'].includes(f.role) && f.state !== 'NA')
  const issues = structuralIssues(d.facts, selected)
  const waterFacts = d.facts.filter(f => f.selected && f.role === 'WATER')
  const water = combine('CH-WATER', '同日处理水量', 'm³', waterFacts.map(f => readFact(f, d, 'm³')))
  const waterIssues = structuralIssues(d.facts, waterFacts.filter(f => f.state !== 'NA'))
  if (waterIssues.length) { water.value = null; water.status = 'INVALID'; water.note = waterIssues.join('；') }
  for (const f of d.facts) {
    if (f.role === 'WATER') { metrics.push(readFact(f, d, 'm³')); continue }
    if (f.role === 'COST') {
      const cost = readFact(f, d, '元'); metrics.push(cost); if (f.selected) costs.push(cost); continue
    }
    const v = number(f.values.value), density = number(f.values.density), active = number(f.values.active), equivalence = number(f.values.equivalence), price = number(f.values.price)
    const valid = f.date === d.date && !!f.source.trim() && !!f.name.trim() && (f.state === 'VALID' || f.state === 'ESTIMATED')
    const negative = v !== null && v < 0 || density !== null && density <= 0
    const unitOK = f.method === 'VOLUME' ? f.unit === 'L' : f.unit === 'kg商品'
    const mass = result(f.id, f.name + (f.role === 'PURCHASE' ? '（采购口径）' : f.role === 'ISSUED' ? '（领用口径）' : '实际商品量'), 'kg商品', valid && unitOK && !negative && v !== null ? f.method === 'VOLUME' ? density !== null ? v * density : null : v : null, [f.id], f.method === 'VOLUME' ? '体积L×适用密度kg/L' : '实测商品质量kg', f.state === 'NA' ? f.note.trim() ? 'NA' : 'INVALID' : negative || !unitOK ? 'INVALID' : f.state, '采购、领用不作为实际投加；液体体积必须有密度')
    metrics.push(mass)
    if (!['DOSING', 'CARBON'].includes(f.role) || !f.selected) continue
    const fraction = result(`${f.id}-fraction`, f.role === 'CARBON' ? '实测可利用当量' : '有效质量分数', f.role === 'CARBON' ? 'kg有效当量/kg商品' : '%', f.role === 'CARBON' ? equivalence !== null && equivalence >= 0 ? equivalence : null : active !== null && active >= 0 && active <= 100 ? active / 100 : null, [f.id], '批次化验依据记于来源；碳源不得用商品纯度替代可利用当量')
    const effective = derive(`${f.id}-active`, f.name + (f.role === 'CARBON' ? '可利用当量' : '有效量'), 'kg', [mass, fraction], '商品质量×本药剂已核验质量分数/当量', ([m, r]) => m! * r!)
    const dose = derive(`${f.id}-dose`, f.name + '有效投加表征', 'mg/L', [effective, water], '有效kg/同日处理m³×1000', ([m, q]) => q! > 0 ? m! / q! * 1000 : null)
    const unitPrice = result(`${f.id}-price`, '同期商品单价', '元/kg商品', price !== null && price >= 0 ? price : null, [f.id], '凭据记于来源；未提供不按0')
    const cost = derive(`${f.id}-cost`, f.name + '实际药费', '元', [mass, unitPrice], '实际投加商品kg×元/kg', ([m, p]) => m! * p!)
    metrics.push(effective, dose, cost); costs.push(cost)
  }
  const subtotal = combine('CH-COST', '所列药剂及运行费用', '元', costs)
  if (issues.length) { subtotal.value = null; subtotal.status = 'INVALID'; subtotal.note = issues.join('；') }
  const intensity = derive('CH-UNIT', '所列单位水量费用', '元/m³', [subtotal, water], '所列互斥费用/处理水量；不含未登记人工折旧等', ([c, q]) => q! > 0 ? c! / q! : null)
  return finish([water, subtotal, intensity, ...metrics], [...issues, ...waterIssues, '不同药种有效成分分别显示，不相加。所列费用不是完整经营成本，省药不能直接判定处理效果改善。'])
}
