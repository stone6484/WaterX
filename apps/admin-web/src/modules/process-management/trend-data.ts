import type { Metric, ProjectState, ResultRow } from './types'
import type { ApiClient, DailySummary } from '@safety/api-client'
import { generateDiagnosis } from './adapter'
import { calculateRows, numeric } from './engine'
export interface TrendDay { date:string; rows:ResultRow[]; demo:boolean; version:number }
export async function remoteTrendDay(api:Pick<ApiClient,'processDailyDetail'|'processReports'|'processReport'>,record:DailySummary,lineId:string):Promise<TrendDay|null>{
  const detail=await api.processDailyDetail(record.id)
  if(detail.analysisBlocked||detail.line_id!==lineId||detail.business_date!==record.business_date)return null
  const source=detail.versions.find(v=>v.version===detail.confirmed_version)
  if(!source)throw new Error('已确认的日数据快照缺失，请刷新后重试。')
  const reports=await api.processReports(record.id)
  const saved=reports.filter(r=>r.status==='SAVED'&&!r.sourceChanged&&r.source.entry.version===source.version).sort((a,b)=>b.version-a.version)[0]
  const report=saved?await api.processReport(saved.id):null
  const rows=report&&!report.sourceChanged&&report.source.entry.version===source.version?report.rows:calculateRows(source.template,{},undefined,source.cells)
  // Recheck after dependent reads: a correction must not leave an obsolete confirmed point visible.
  const latest=await api.processDailyDetail(record.id)
  if(latest.analysisBlocked||latest.revision!==detail.revision||latest.confirmed_version!==source.version)return null
  return {date:record.business_date,rows,demo:Object.values(source.cells).some(c=>c.source==='DEMO'),version:source.version}
}
export const DAY=86400000
export const stamp=(date:string)=>Date.parse(`${date}T00:00:00Z`)
export const iso=(time:number)=>new Date(time).toISOString().slice(0,10)
export function validDate(value:string){return /^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(stamp(value))&&iso(stamp(value))===value}
export function periodStart(end:string,period:string){
  if(!validDate(end))return ''
  if(period!=='month')return iso(stamp(end)-(Number(period)-1)*DAY)
  const d=new Date(stamp(end)),day=d.getUTCDate();d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()-1)
  const last=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate()
  d.setUTCDate(Math.min(day,last));return iso(d.getTime()+DAY)
}
export function localTrend(state:ProjectState,metrics:Metric[],line:string,from:string,to:string):TrendDay[]{
  return state.entries.filter(e=>e.line===line&&e.date>=from&&e.date<=to).sort((a,b)=>a.date.localeCompare(b.date)).map(e=>{
    const result=generateDiagnosis(state,metrics,line,e.date,'趋势只读查询')
    return {date:e.date,rows:result.rows,demo:result.demo,version:e.versions.at(-1)!.version}
  })
}
export function pointValue(row?:ResultRow,unit?:string){return row?.data==='VALID'&&(unit===undefined||row.unit===unit)?numeric(row.actual):null}
// Missing calendar days and invalid readings both break the line; zero remains a point.
export function linePath(days:TrendDay[],id:string,x:(date:string)=>number,y:(value:number)=>number,unit?:string){
  let previous=NaN
  return days.map(day=>{const value=pointValue(day.rows.find(r=>r.id===id),unit);if(value===null){previous=NaN;return ''}
    const command=stamp(day.date)-previous===DAY?'L':'M';previous=stamp(day.date)
    return `${command}${x(day.date).toFixed(2)},${y(value).toFixed(2)}`}).join(' ')
}
export function selectedIds(metrics:{id:string}[],saved:unknown){
  if(!Array.isArray(saved)||!saved.every(id=>typeof id==='string'))return metrics.map(m=>m.id)
  return metrics.filter(m=>saved.includes(m.id)).map(m=>m.id)
}
