import type { Cell, Metric, Target } from './types'
import { targetFor } from './engine'

// MVP records are entered daily; labels describe the input, not automatic aggregation.
export function dailyBasis(m: Metric): string {
  if (m.source === 'DESIGN') return '设计固定值'
  if (m.source === 'CALCULATED') return '同日日数据计算'
  if (/日曝气量|日.*量|投加量|药剂量|回流量|排泥量|用电量|电耗量|运行时长/.test(m.name) || /(?:\/d|\/天|kW[·.]?h)$/i.test(m.unit)) return '日累计'
  if (m.text || /台|套|座|个/.test(m.unit)) return '当日记录'
  if (/水质|污泥性状/.test(m.category) || /浓度|溶解氧|DO|ORP|压力|升压|温度|流量|风量|平均频率/.test(m.name)) return '日均值'
  return '当日记录'
}
export function dailyHelp(m: Metric): string {
  const basis = dailyBasis(m)
  if (basis === '日累计') return /时长/.test(m.name) ? '填写当日合计设备小时；多台设备可超过24小时，需在说明中注明台数口径。' : '填写当天累计量，不是累计表底读数；沿用所示单位。'
  if (basis === '日均值') return '填写人工整理的当日代表性均值；只有单次观测时请在说明中注明，不把单次值冒充日均值。'
  return '填写所选业务日期的实际记录；存在时点或范围差异时在说明中注明。'
}
export function emptyTarget(m: Metric): Target { return { ...targetFor(m), value: '' } }
const blank = (value: string | undefined) => value === undefined || !value.trim() || value === '—'

export function fillDesignBlanks(metrics: Metric[], current: Record<string, string>) {
  const values = { ...current }; let count = 0
  for (const m of metrics.filter(m => m.scopes.includes('design') && m.source !== 'CALCULATED')) {
    if (blank(values[m.id]) && !blank(m.design)) { values[m.id] = m.design; count++ }
  }
  return { values, count }
}
export function fillTargetBlanks(metrics: Metric[], current: Record<string, Target>) {
  const targets = Object.fromEntries(Object.entries(current).map(([id, target]) => [id, { ...target }])); let count = 0
  for (const m of metrics.filter(m => m.scopes.includes('diagnosis') && m.source !== 'DESIGN')) {
    const sample = targetFor(m)
    if (blank(targets[m.id]?.value) && !blank(sample.value)) {
      // Existing control choices/tolerances belong to the user, including zero.
      targets[m.id] = { ...(targets[m.id] || sample), value: sample.value }; count++
    }
  }
  return { targets, count }
}
export function fillCellBlanks(current: Record<string, Cell>, sample: Record<string, Cell>) {
  const cells = Object.fromEntries(Object.entries(current).map(([id, cell]) => [id, { ...cell }])); let count = 0
  for (const [id, value] of Object.entries(sample)) {
    const existing = cells[id]
    if ((!existing || (blank(existing.value) && existing.state === 'VALID' && !existing.note.trim())) && !blank(value.value)) {
      cells[id] = { ...value }; count++
    }
  }
  return { cells, count }
}
