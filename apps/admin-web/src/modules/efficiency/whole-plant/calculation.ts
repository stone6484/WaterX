import type { Analysis, Draft, Fact, Metric, Status } from './types'
export const RULE = '全厂分析 V2.1 · 本地核算'
export function number(value: string | undefined): number | null {
  if (value === undefined || !value.trim() || !/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(value.trim())) return null
  const n = Number(value); return Number.isFinite(n) ? n : null
}
export function result(id: string, name: string, unit: string, value: number | null, dependencies: string[], formula: string, status: Status = 'VALID', note = ''): Metric {
  const finite = value !== null && Number.isFinite(value)
  return { id, name, unit, value: finite ? value : null, dependencies, formula, status: value !== null && !finite ? 'INVALID' : value === null && (status === 'VALID' || status === 'ESTIMATED') ? 'MISSING' : status, note }
}
export function readFact(f: Fact, d: Draft, unit: string): Metric {
  const base = (n: number | null, state: Status, formula = '', note = '') => result(f.id, f.name || '未命名点位', unit, n, [f.id], formula, state, note)
  if (f.state === 'NA') return base(null, f.note.trim() ? 'NA' : 'INVALID', '', '不适用须填写依据，不参与汇总')
  if (f.state === 'MISSING' || f.state === 'INVALID') return base(null, f.state)
  if (f.date !== d.date || f.unit !== unit || !f.name.trim() || !f.source.trim()) return base(null, 'INVALID', '', '请核对名称、同日周期、单位和来源凭据')
  if (f.method === 'METER') {
    const start = number(f.values.start), end = number(f.values.end), multiplier = number(f.values.multiplier)
    if (start === null || end === null || multiplier === null) return base(null, 'MISSING', '(末读数−初读数)×已确认倍率', '缺读数或倍率；不默认1')
    if (start < 0 || end < start || multiplier <= 0) return base(null, 'INVALID', '', '负增量/回零/换表需拆段核验，不能取绝对值')
    return base((end - start) * multiplier, f.state, '(末读数−初读数)×已确认倍率')
  }
  const value = number(f.values.value)
  return base(value !== null && value < 0 ? null : value, value !== null && value < 0 ? 'INVALID' : value === null ? 'MISSING' : f.state, '同周期直接计量值')
}
export function combine(id: string, name: string, unit: string, list: Metric[], allowEmpty = false): Metric {
  const used = list.filter(m => m.status !== 'NA'), missing = used.some(m => m.value === null)
  const status: Status = used.some(m => m.status === 'INVALID') ? 'INVALID' : missing || (!list.length && !allowEmpty) ? 'MISSING' : used.some(m => m.status === 'ESTIMATED') ? 'ESTIMATED' : 'VALID'
  return result(id, name, unit, status === 'INVALID' || status === 'MISSING' ? null : used.reduce((n, m) => n + (m.value ?? 0), 0), list.flatMap(m => m.dependencies), '互斥且适用的已选项求和', status,
    `已知小计 ${used.reduce((n, m) => n + (m.value ?? 0), 0)} ${unit}；不以小计冒充完整总量`)
}
export function derive(id: string, name: string, unit: string, list: Metric[], formula: string, compute: (values: number[]) => number | null): Metric {
  const bad = list.find(m => m.value === null)
  if (bad) return result(id, name, unit, null, list.flatMap(m => m.dependencies), formula, bad.status === 'INVALID' ? 'INVALID' : 'MISSING', `依赖待核验：${bad.name}`)
  const n = compute(list.map(m => m.value!))
  return result(id, name, unit, n, list.flatMap(m => m.dependencies), formula, n === null || !Number.isFinite(n) ? 'INVALID' : list.some(m => m.status === 'ESTIMATED') ? 'ESTIMATED' : 'VALID', n === null ? '分母为0或不满足计算条件' : '')
}
export function structuralIssues(facts: Fact[], selected: Fact[]): string[] {
  const issues: string[] = [], ids = new Set<string>()
  for (const f of selected) {
    if (ids.has(f.id) || facts.filter(other => other.id === f.id).length > 1) issues.push('点位标识重复'); ids.add(f.id)
    let p = f.parent; const seen = new Set([f.id])
    while (p) {
      if (seen.has(p)) { issues.push(`${f.name}：计量包含关系成环`); break }
      seen.add(p); const ancestor = facts.find(x => x.id === p)
      if (!ancestor) { issues.push(`${f.name}：上级点位不存在`); break }
      p = ancestor.parent
    }
  }
  for (const f of selected) {
    if (!f.path.trim()) issues.push(`${f.name}：请登记物理路径/计量覆盖范围`)
    if (selected.some(other => other.id !== f.id && other.path.trim() && other.path === f.path)) issues.push(`${f.name}：同一物理路径重复选入`)
    let p = f.parent; const seen = new Set<string>()
    while (p && !seen.has(p)) {
      seen.add(p)
      if (selected.some(x => x.id === p)) { issues.push(`${f.name}：总表与所含支路重复选入，请只选一个计量切面`); break }
      p = facts.find(x => x.id === p)?.parent || ''
    }
  }
  return [...new Set(issues)]
}
export function threshold(d: Draft, metric: Metric, name: string): string[] {
  const limit = number(d.parameters.limit)
  if (!d.checks.target || limit === null || limit < 0 || !d.parameters.targetSource?.trim()) return [`${name}：判定基准待确认；不使用通用合格线`]
  if (metric.value === null) return []
  return Math.abs(metric.value) > limit ? [`${name}超过项目已确认阈值${limit}${metric.unit}，需核验计量、边界与来源；不是原因诊断`] : [`${name}在项目已确认阈值内，仅代表所声明边界的数值比较`]
}
export function finish(metrics: Metric[], issues: string[]): Analysis {
  return { rule: RULE, metrics, issues: [...new Set([...issues, ...metrics.filter(m => m.value === null && m.status !== 'NA').map(m => `${m.name}：${m.note || '数据不足，请补充依赖事实'}`)])] }
}
