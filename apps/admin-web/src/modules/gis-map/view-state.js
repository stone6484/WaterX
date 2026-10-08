import {CENTER,items} from './data.js'

// In-memory user/site isolation only; no telemetry or business record is persisted here.
const views=new Map()
export const contextKey=(siteId,userId)=>JSON.stringify([siteId,userId])
const validIds=new Set(items.map(item=>item.id))
const layerDefaults={plant:true,pump:true,gate:true,pipe:true,node:true,monitor:true,district:true}
export function restoreView(saved={}){
 const lng=Number(saved.center?.[0]),lat=Number(saved.center?.[1]),zoom=Number(saved.zoom)
 return {
  center:Number.isFinite(lng)&&Number.isFinite(lat)?[lng,lat]:[...CENTER],zoom:Number.isFinite(zoom)?Math.max(8,Math.min(18,zoom)):12,
  theme:saved.theme==='monitoring'?'monitoring':'facility',metric:['flow','liquidLevel','waterDepth','velocity'].includes(saved.metric)?saved.metric:'flow',
  layers:Object.fromEntries(Object.keys(layerDefaults).map(key=>[key,typeof saved.layers?.[key]==='boolean'?saved.layers[key]:layerDefaults[key]])),
  selected:validIds.has(saved.selected)?saved.selected:null,selectedIds:Array.isArray(saved.selectedIds)?saved.selectedIds.filter(id=>validIds.has(id)).slice(0,200):[],
  tick:Number.isFinite(Number(saved.tick))?Math.max(0,Math.floor(Number(saved.tick))):0,
  scenario:['inflow-rise','pump-cycle','partial-outage'].includes(saved.scenario)?saved.scenario:'normal',
  baseMode:saved.baseMode==='local'?'local':'osm',filterType:saved.filterType||'all',filterDistrict:saved.filterDistrict||'all',filterMaintainer:saved.filterMaintainer||'all',filterQuality:saved.filterQuality||'all',currentExtent:saved.currentExtent===true,
  compareIds:Array.isArray(saved.compareIds)?saved.compareIds.filter(id=>validIds.has(id)).slice(0,3):[]
 }
}
export const getView=key=>restoreView(views.get(key))
export const saveView=(key,state)=>views.set(key,restoreView(state))
