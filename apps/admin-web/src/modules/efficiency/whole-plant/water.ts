import type { Draft, Metric } from './types'
import { combine, derive, finish, number, readFact, result, structuralIssues, threshold } from './calculation'

export function waterAnalysis(d: Draft) {
  const selected = d.facts.filter(f => f.selected && f.role !== 'STOCK' && f.state !== 'NA')
  const external = selected.filter(f => f.role === 'IN' || f.role === 'OUT')
  const externalIssues = structuralIssues(d.facts, external)
  const internalIssues = structuralIssues(d.facts, selected.filter(f => f.role === 'INTERNAL'))
  const facts = d.facts.map(f => {
    if (f.role !== 'STOCK') return readFact(f, d, 'm³')
    const opening = number(f.values.start), closing = number(f.values.end)
    if (f.state === 'NA') return result(f.id, f.name, 'm³', null, [f.id], '期末−期初库存', f.note.trim() ? 'NA' : 'INVALID')
    const valid = f.date === d.date && f.unit === 'm³' && f.source.trim() && f.name.trim() && (f.state === 'VALID' || f.state === 'ESTIMATED')
    return result(f.id, f.name, 'm³', valid && opening !== null && closing !== null && opening >= 0 && closing >= 0 ? closing - opening : null, [f.id], '期末−期初库存', valid ? (opening !== null && closing !== null && (opening < 0 || closing < 0) ? 'INVALID' : f.state) : 'INVALID')
  })
  const group = (role: string) => facts.filter(m => d.facts.some(f => f.id === m.id && f.selected && f.role === role))
  const input = combine('WB-02', '外部流入', 'm³', group('IN'))
  const output = combine('WB-03', '外部流出', 'm³', group('OUT'))
  if (externalIssues.length) for (const m of [input, output]) { m.value = null; m.status = 'INVALID'; m.note = externalIssues.join('；') }
  const stock = combine('WB-04', '储量变化', 'm³', group('STOCK'))
  const residual = derive('WB-05', '未解释差额', 'm³', [input, output, stock], '外入−外出−储量变化', ([i, o, s]) => i! - o! - s!)
  if (!d.complete || !d.basis.trim()) { residual.value = null; residual.status = 'MISSING'; residual.note = '边界完整清单及依据尚未确认' }
  const ratio = derive('WB-06', '差额相对量', '%', [residual, input], '差额/外入×100', ([r, i]) => i! > 0 ? r! / i! * 100 : null)
  const recycle = combine('WB-07-Q', '选定内部回水', 'm³', group('INTERNAL'))
  if (internalIssues.length) { recycle.value = null; recycle.status = 'INVALID'; recycle.note = internalIssues.join('；') }
  const returnRatio = derive('WB-07', '指定回水比', '%', [recycle, input], '选定互斥内部回水/外入×100', ([r, i]) => i! > 0 ? r! / i! * 100 : null)
  const metrics: Metric[] = [input, output, stock, residual, ratio, recycle, returnRatio, ...facts]
  return finish(metrics, [...externalIssues, ...internalIssues, ...threshold(d, residual, '绝对差额'), '内部回水不计入全厂外部输入；未解释差额不是漏损。首版不推算缺少完整计量的工段流量。'])
}
