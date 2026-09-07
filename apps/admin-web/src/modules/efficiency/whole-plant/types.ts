export type Topic = 'water' | 'sludge' | 'energy' | 'chemical' | 'capacity' | 'hydraulic'
export type Status = 'VALID' | 'ESTIMATED' | 'MISSING' | 'INVALID' | 'NA'
export interface SourceRef { entryId: string; version: number; metricId: string; line: string; original: string; factor: number }
export interface Fact {
  id: string; name: string; role: string; path: string; parent: string; selected: boolean
  date: string; unit: string; method: string; state: Status; source: string; note: string
  values: Record<string, string>; reference?: SourceRef
}
export interface Review {
  evidence: string; cause: 'UNREVIEWED' | 'SUPPORTED' | 'EXCLUDED' | 'INSUFFICIENT'
  action: string; owner: string; due: string; protection: string; stop: string; recovery: string
  execution: string; comparison: string; protectionEvidence: string
  outcome: 'PENDING' | 'OBSERVE' | 'REJECTED' | 'CONFIRMED'
}
export interface Draft {
  topic: Topic; boundary: string; boundaryVersion: string; date: string; basis: string
  complete: boolean; checks: Record<string, boolean>; parameters: Record<string, string>
  facts: Fact[]; review: Review; demo: boolean
}
export interface Metric {
  id: string; name: string; value: number | null; unit: string; status: Status
  formula: string; dependencies: string[]; note: string
}
export interface Analysis { rule: string; metrics: Metric[]; issues: string[] }
export interface Snapshot { id: string; version: number; at: string; by: string; reason: string; draft: Draft; result: Analysis }
export interface Archive { schema: 1; siteId: string; revision: number; snapshots: Snapshot[] }
export interface Field { key: string; label: string; unit?: string }
export interface TopicDefinition {
  name: string; shortName: string; scope: string; roles: Record<string, string>
  methods: Record<string, string>; units: string[]; fields: Field[]
  parameters: Field[]; checks: { key: string; label: string }[]
}
export const statusNames: Record<Status, string> = { VALID: '有效', ESTIMATED: '估算', MISSING: '数据不足', INVALID: '数据异常 / 计算无效', NA: '不适用' }
export const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))
export const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
export function emptyDraft(topic: Topic): Draft {
  return { topic, boundary: '全厂', boundaryVersion: '1', date: today(), basis: '', complete: false, checks: {}, parameters: {}, facts: [], demo: false,
    review: { evidence: '', cause: 'UNREVIEWED', action: '', owner: '', due: '', protection: '', stop: '', recovery: '', execution: '', comparison: '', protectionEvidence: '', outcome: 'PENDING' } }
}
export function newFact(date: string, role: string, unit: string, method = 'DIRECT'): Fact {
  return { id: crypto.randomUUID(), name: '', role, path: '', parent: '', selected: true, date, unit, method, state: 'VALID', source: '', note: '', values: {} }
}
