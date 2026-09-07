export type ProcessPage = 'processDesign' | 'conditionMatrix' | 'operationEntry' | 'processAnalysis' | 'processReport'
export type MetricScope = 'design' | 'condition' | 'entry' | 'diagnosis'
export interface LegacyMetric { code: string; category: string; name: string; unit: string; design: string; target: string; actual: string; meaning: string; formula: string; scopes: MetricScope[] }
export interface Metric extends LegacyMetric { id: string; source: 'MANUAL' | 'CALCULATED' | 'DESIGN'; text: boolean }
export type DataState = 'VALID' | 'MISSING' | 'INVALID' | 'NA' | 'CALC_INVALID' | 'UNCONFIGURED'
export type BusinessState = 'normal' | 'warning' | 'alarm' | 'pending' | 'reference'
export interface Cell { value: string; state: 'VALID' | 'INVALID' | 'NA'; source: 'MANUAL' | 'IMPORT' | 'DEMO'; note: string }
export type TargetMode = 'POINT' | 'RANGE' | 'UPPER' | 'LOWER' | 'TEXT' | 'REFERENCE'
export interface Target { value: string; mode: TargetMode; warning: number; alarm: number }
export interface Revision { version: number; at: string; by: string; reason: string }
export interface DesignVersion extends Revision { effective: string; reference: string; lines: Record<string, Record<string, string>>; demo: boolean }
export interface ConditionVersion extends Revision { name: string; line: string; from: string; to: string; status: 'DRAFT' | 'ACTIVE' | 'RETIRED'; description: string; targets: Record<string, Target>; demo: boolean }
export interface Condition { id: string; versions: ConditionVersion[] }
export interface EntryVersion extends Revision { cells: Record<string, Cell>; demo: boolean }
export interface Entry { id: string; line: string; date: string; locked: boolean; versions: EntryVersion[] }
export interface ResultRow { id: string; code: string; category: string; name: string; unit: string; design: string; target: string; actual: string; data: DataState; state: BusinessState; deviation: number | null; difference: number | null; explanation: string; source: string; formula: string; rule: string }
export interface DiagnosisVersion extends Revision { designVersion: number | null; conditionId: string | null; conditionVersion: number | null; conditionName: string; entryId: string | null; entryVersion: number | null; ruleVersion: string; rows: ResultRow[]; demo: boolean; generatedAt: string; sourceStamp: string; summary: string }
export interface Diagnosis { id: string; line: string; date: string; locked: boolean; versions: DiagnosisVersion[] }
export interface ProjectState { schema: 1; revision: number; siteId: string; siteName: string; designs: DesignVersion[]; conditions: Condition[]; entries: Entry[]; diagnoses: Diagnosis[]; events?: {at:string;by:string;action:string;recordId:string}[] }
export const latest = <T>(versions: T[]): T => versions[versions.length - 1]!
export const dataLabels: Record<DataState, string> = { VALID: '有效', MISSING: '数据缺失', INVALID: '数据异常', NA: '工艺不适用', CALC_INVALID: '计算无效', UNCONFIGURED: '计算待配置' }
export const stateLabels: Record<BusinessState, string> = { normal: '正常', warning: '预警', alarm: '告警', pending: '未判定', reference: '仅参考' }
export const modeLabels: Record<TargetMode, string> = { POINT: '定值', RANGE: '区间', UPPER: '上限', LOWER: '下限', TEXT: '文本匹配', REFERENCE: '仅参考' }
export function businessToday() { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()) }
