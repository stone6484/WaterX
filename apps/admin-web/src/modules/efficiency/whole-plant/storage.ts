import { clone, type Archive, type Draft, type Snapshot } from './types'
import type { Analysis } from './types'
import { loadProject } from '../../process-management/adapter'

const key = (siteId: string) => `waterx-whole-plant-v1:${encodeURIComponent(siteId)}`
export function loadArchive(siteId: string, storage: Storage = localStorage): Archive {
  const raw = storage.getItem(key(siteId))
  if (!raw) return { schema: 1, siteId, revision: 0, snapshots: [] }
  const archive = JSON.parse(raw) as Archive
  if (archive.schema !== 1 || archive.siteId !== siteId || !Number.isInteger(archive.revision) || !Array.isArray(archive.snapshots) || archive.snapshots.some(s => !s.draft || !s.result || !Array.isArray(s.draft.facts))) throw new Error('全厂分析档案格式异常；原记录保留，请先备份核查')
  return archive
}
export function saveSnapshot(archive: Archive, draft: Draft, analysis: Analysis, by: string, reason: string, storage: Storage = localStorage): Archive {
  const date = new Date(draft.date + 'T00:00:00Z')
  if (!archive.siteId || !draft.boundary.trim() || !draft.boundaryVersion.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(draft.date) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0,10) !== draft.date || !by.trim()) throw new Error('请填写项目、边界、边界版本、有效日期和记录人')
  if (!reason.trim()) throw new Error('请填写保存或更正原因')
  const current = loadArchive(archive.siteId, storage)
  if (current.revision !== archive.revision) throw new Error('其他窗口已更新档案，请重新读取后保存；当前草稿未覆盖')
  const versions = archive.snapshots.filter(s => s.draft.topic === draft.topic && s.draft.boundary === draft.boundary && s.draft.date === draft.date)
  const snapshot: Snapshot = { id: crypto.randomUUID(), version: versions.length + 1, at: new Date().toISOString(), by, reason, draft: clone(draft), result: clone(analysis) }
  const next = clone(archive); next.revision++; next.snapshots.push(snapshot)
  storage.setItem(key(archive.siteId), JSON.stringify(next))
  return next
}
export function processSources(siteId: string, date: string, storage: Storage = localStorage) {
  const project = loadProject(siteId, '', storage)
  return project.entries.filter(e => e.date === date).flatMap(e => {
    const v = e.versions[e.versions.length - 1]!
    return Object.entries(v.cells).map(([id, cell]) => ({ entryId: e.id, version: v.version, metricId: id, line: e.line, original: cell.value, state: cell.state, note: cell.note, demo: v.demo }))
  })
}
export function sourceChanges(siteId: string, draft: Draft, storage: Storage = localStorage): string[] {
  if (!draft.facts.some(f => f.reference)) return []
  const sources = processSources(siteId, draft.date, storage)
  return draft.facts.filter(f => f.reference && !sources.some(s => s.entryId === f.reference!.entryId && s.version === f.reference!.version && s.metricId === f.reference!.metricId && s.original === f.reference!.original)).map(f => `${f.name}：运行数据来源已变化或不可读取，历史快照保持原值`)
}
