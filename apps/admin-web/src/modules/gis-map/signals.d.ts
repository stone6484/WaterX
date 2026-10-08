export const metricCatalog: Record<string, { label: string; unit: string; basis: string; color: string }>
export const qualityNames: Record<string, string>
export function historyFor(entity: any, key: string, hours?: number, tick?: number, scenario?: string): any[]
export function metricKeysFor(entity: any): string[]
export function readMetric(entity: any, key: string, tick?: number, scenario?: string): any
export function signalQualityFor(entity: any): string
