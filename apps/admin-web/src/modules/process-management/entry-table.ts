import type { Cell, Metric } from './types'
import { dailyBasis } from './daily-input'

export interface EntryContext { siteId: string; line: string; date: string }
export const safeSpreadsheetText = (value: unknown) => typeof value === 'string' && /^[=+@-]/.test(value) ? `'${value}` : value
const text = (value: unknown) => String(value ?? '').replace(/^'(?=[=+@-])/, '')

export function entryTable(metrics: Metric[], cells: Record<string, Cell>, context: EntryContext) {
  return metrics.filter(m => m.source === 'MANUAL').map(m => ({
    '项目ID': context.siteId, '工艺线': context.line, '日期': context.date,
    '指标ID': m.id, '指标': m.name, '单位': m.unit, '填报口径': dailyBasis(m),
    '实际值': cells[m.id]?.value ?? '', '状态': cells[m.id]?.state ?? 'VALID', '说明': cells[m.id]?.note ?? '',
  }))
}

// Validate the whole sheet before returning a replacement draft; never mutate input.
export function parseEntryTable(rows: Record<string, unknown>[], metrics: Metric[], current: Record<string, Cell>, context: EntryContext) {
  if (!rows.length) throw new Error('表格中没有数据')
  const next = Object.fromEntries(Object.entries(current).map(([id, cell]) => [id, { ...cell }]))
  const seen = new Set<string>()
  for (const row of rows) {
    if (text(row['项目ID']) !== context.siteId || text(row['工艺线']) !== context.line || text(row['日期']) !== context.date) throw new Error('项目、工艺线或日期不匹配；请使用本页导出的模板')
    const id = text(row['指标ID'])
    if (seen.has(id)) throw new Error(`重复指标：${id}`)
    seen.add(id)
    const m = metrics.find(m => m.id === id && m.source === 'MANUAL')
    if (!m || text(row['单位']) !== m.unit) throw new Error(`指标或单位不匹配：${id}`)
    if (row['填报口径'] && text(row['填报口径']) !== dailyBasis(m)) throw new Error(`填报口径不匹配：${m.name}；请重新导出模板`)
    const status = text(row['状态'] || 'VALID'), note = text(row['说明'])
    if (!['VALID', 'INVALID', 'NA'].includes(status)) throw new Error('状态必须为 VALID、INVALID 或 NA')
    if (status !== 'VALID' && !note.trim()) throw new Error(`${m.name}：异常或不适用须填写原因`)
    const value = text(row['实际值'])
    if (/^\s*=/.test(value)) throw new Error(`${m.name}：请填一手观测值，不接受表格公式`)
    next[id] = { value, state: status as Cell['state'], source: 'IMPORT', note }
  }
  return next
}
