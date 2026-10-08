export function filterEntities(filters: any): any[]
export function geometryIntersectsBounds(geometry: any, bounds: number[]): boolean
export function selectInBounds(bounds: number[], entities?: any[]): string[]
export function selectInCircle(center: number[], radiusKm: number, entities?: any[]): string[]
export function distanceKm(a: number[], b: number[]): number
export function pathDistanceKm(points: number[][]): number
export function polygonAreaKm2(points: number[][]): number
export function circlePolygon(center: number[], radiusKm: number): number[][]
