import type { Draft, Metric } from './types'
import { combine, derive, finish, number, result } from './calculation'
export function capacityAnalysis(d: Draft) {
  const units = ['m³/h', 'kg/d', 't干固体/d'], metrics: Metric[] = [], issues: string[] = []
  const active = d.facts.filter(f => f.selected && (f.state !== 'NA' || !f.note.trim()))
  const facts = d.facts.map(f => {
    const n = number(f.values.value), valid = f.date === d.date && !!f.name.trim() && !!f.source.trim() && !!f.path.trim() && units.includes(f.unit) && (f.unit === 'm³/h' || !!f.values.substance?.trim()) && (f.state === 'VALID' || f.state === 'ESTIMATED')
    return result(f.id, f.name, f.unit, valid && n !== null && n >= 0 ? n : null, [f.id], '当前工况下经核验有效能力；停运实例不选入，同一阶段并联实例相加', f.state === 'NA' ? f.note.trim() ? 'NA' : 'INVALID' : n !== null && n < 0 || !valid ? 'INVALID' : f.state)
  })
  if (new Set(d.facts.map(f => f.id)).size !== d.facts.length) issues.push('实例标识重复，不能重复计入能力')
  if (active.some(f => !units.includes(f.unit))) issues.push('已选实例存在未知量纲，先核对单位后再形成完整流路上限')
  for (const unit of units) {
    const inUnit = active.filter(f => f.unit === unit)
    if (!inUnit.length) continue
    const paths = [...new Set(inUnit.map(f => f.path))]
    const sameSubstance = unit === 'm³/h' || new Set(inUnit.map(f => f.values.substance?.trim())).size === 1
    const stages = paths.map(path => {
      const stageFacts = facts.filter(m => inUnit.some(f => f.id === m.id && f.path === path))
      const m = combine(`CP-${unit}-${path}`, `阶段${path}可用能力`, unit, stageFacts)
      // Optional shared-stage limit is explicit and has the same unit as its stage.
      const limits = inUnit.filter(f => f.path === path).map(f => number(f.values.sharedLimit)).filter((v): v is number => v !== null)
      if (limits.some(n => n < 0) || inUnit.some(f => f.path === path && f.values.sharedLimit?.trim() && number(f.values.sharedLimit) === null)) { m.value = null; m.status = 'INVALID'; m.note = '共享能力约束必须为非负有效数字；不能将无法识别的约束忽略' }
      else if (limits.length && m.value !== null) { m.value = Math.min(m.value, ...limits); m.formula = '并联实例合计与已确认共享约束取小' }
      return m
    })
    const limit = result(`CP-LIMIT-${unit}`, `所声明串联流路上限（${unit}）`, unit, null, stages.flatMap(m => m.dependencies), '同量纲各串联阶段能力取最小；不是全厂统一扩容数字')
    if (d.complete && d.basis.trim() && d.checks.capacity && sameSubstance && !issues.length && stages.every(m => m.value !== null) && d.parameters.stages?.trim()) {
      const required = d.parameters.stages.split(/[,，\n]/).map(s => s.trim()).filter(Boolean)
      if (required.length && required.every(p => paths.includes(p)) && paths.every(p => required.includes(p))) { limit.value = Math.min(...stages.map(m => m.value!)); limit.status = stages.some(m => m.status === 'ESTIMATED') ? 'ESTIMATED' : 'VALID' }
      else limit.note = '已配置的串联阶段与所填计量阶段不完整匹配'
    } else limit.note = '请确认完整串联阶段、同工况能力、同污染物/进出料口径、并联关系与共享限制；未知关键段时只显示已知约束'
    const actual = number(d.parameters[`actual-${unit}`])
    const load = result(`CP-ACTUAL-${unit}`, '同工况实际负荷', unit, actual !== null && actual >= 0 ? actual : null, [], '同流路同量纲实测/明确日均参考；不由日量推算小时峰值')
    const margin = derive(`CP-MARGIN-${unit}`, `流路参考裕量（${unit}）`, unit, [limit, load], '流路上限−同口径负荷', ([c, q]) => c! - q!)
    if (margin.value !== null && margin.value < 0) issues.push(`${unit}流路负荷超过所声明当前能力，需核验数据和在线组合，不自动修改生产计划`)
    metrics.push(limit, margin, ...stages)
  }
  if (!metrics.length) issues.push('尚无适用能力记录；请按每条串联流路单独建立边界，不跨量纲比较')
  return finish([...metrics, ...facts], [...issues, '本版支持一条串联流路内的阶段并联与共享上限；复杂交叉分流需分别建立边界核验，不据此给精确全厂扩容量。'])
}
