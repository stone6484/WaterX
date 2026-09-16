import { type ProjectState, type Metric, type Cell, type Target, type DesignVersion, type ConditionVersion, type EntryVersion, type DiagnosisVersion, latest } from './types'
import { calculateRows, conditionError, matchCondition, matchDesign, RULE_VERSION, targetFor } from './engine'

export const FIXED_DEMO_DATE = '2026-09-08'
export const FIXED_DEMO_LINE = '一期生化线'

export const clone=<T>(value:T):T=>JSON.parse(JSON.stringify(value))
export function emptyProject(siteId:string,siteName:string):ProjectState { return { schema:1,revision:0,siteId,siteName,designs:[],conditions:[],entries:[],diagnoses:[] } }
export function fixedDemoProject(siteId:string,siteName:string,metrics:Metric[],by:string):ProjectState {
  const revision={version:0,at:'2026-09-08T08:00:00.000Z',by,reason:'载入固定演示数据'}
  const designValues=Object.fromEntries(metrics.filter(m=>m.scopes.includes('design')&&m.source!=='CALCULATED'&&m.design&&m.design!=='—').map(m=>[m.id,m.design]))
  const targets:Record<string,Target>={}
  for(const metric of metrics.filter(m=>m.scopes.includes('diagnosis')&&m.source!=='DESIGN')){
    const target=targetFor(metric)
    if(target.value&&target.value!=='—')targets[metric.id]=target
  }
  let state=saveDesign(emptyProject(siteId,siteName),{...revision,effective:'2026-01-01',reference:'WaterX固定演示资料（非生产参数）',lines:{[FIXED_DEMO_LINE]:designValues},demo:true})
  state=saveCondition(state,'waterx-fixed-demo-condition',{...revision,name:'日常运行演示工况',line:FIXED_DEMO_LINE,from:'2026-01-01',to:'2026-12-31',status:'ACTIVE',description:'固定演示场景；仅用于产品展示，参数须按真实项目重新维护。',targets,demo:true})
  state=saveEntry(state,FIXED_DEMO_LINE,FIXED_DEMO_DATE,{...revision,cells:demoCells(metrics,'complete'),demo:true})
  state=saveDiagnosis(state,metrics,FIXED_DEMO_LINE,FIXED_DEMO_DATE,generateDiagnosis(state,metrics,FIXED_DEMO_LINE,FIXED_DEMO_DATE,by))
  return state
}
export const storageKey=(siteId:string)=>`waterx-process-mvp-v1:${encodeURIComponent(siteId)}`
export function loadProject(siteId:string,siteName:string,storage:Storage=localStorage):ProjectState {
  const raw=storage.getItem(storageKey(siteId))
  if(!raw)return emptyProject(siteId,siteName)
  const state=JSON.parse(raw) as ProjectState
  if(state.schema!==1||state.siteId!==siteId||!Number.isInteger(state.revision)||!Array.isArray(state.designs)||!Array.isArray(state.conditions)||!Array.isArray(state.entries)||!Array.isArray(state.diagnoses))throw new Error('本地工艺档案格式不兼容，原数据已保留；请导出备份后检查')
  return state
}
// Read back immediately before writing. A stale tab cannot silently overwrite newer edits.
export function persistProject(state:ProjectState,storage:Storage=localStorage):ProjectState {
  if(!state.siteId)throw new Error('尚未选择项目')
  const stored=storage.getItem(storageKey(state.siteId))
  const revision=stored?(JSON.parse(stored) as ProjectState).revision:0
  if(revision!==state.revision)throw new Error('此项目已在其他窗口更新，请刷新页面后重试；当前输入尚未保存')
  const next=clone({...state,revision:state.revision+1})
  storage.setItem(storageKey(state.siteId),JSON.stringify(next))
  return next
}
export function saveDesign(state:ProjectState,value:DesignVersion):ProjectState {
  if(!value.reference.trim()||!value.reason.trim()||!value.effective)throw new Error('请填写设计文件来源、生效日期和修改原因')
  const next=clone(state);next.designs.push({...clone(value),version:next.designs.length+1});return next
}
export function saveCondition(state:ProjectState,id:string,value:ConditionVersion):ProjectState {
  const error=conditionError(state,id,value);if(error)throw new Error(error)
  if(!value.reason.trim())throw new Error('请填写工况修改原因')
  const next=clone(state), found=next.conditions.find(c=>c.id===id)
  if(found)found.versions.push({...clone(value),version:found.versions.length+1})
  else next.conditions.push({id,versions:[{...clone(value),version:1}]})
  return next
}
export function saveEntry(state:ProjectState,line:string,date:string,value:EntryVersion,correction=false):ProjectState {
  if(!date||!line)throw new Error('请填写工艺线和业务日期')
  const next=clone(state),found=next.entries.find(e=>e.line===line&&e.date===date)
  if(found?.locked&&!correction)throw new Error('日数据已锁定，须通过更正并填写原因')
  if(found&&!value.reason.trim())throw new Error('修改已保存数据须填写原因')
  for(const c of Object.values(value.cells))if((c.state==='NA'||c.state==='INVALID')&&!c.note.trim())throw new Error('不适用或异常数据必须填写原因')
  if(found){found.versions.push({...clone(value),version:found.versions.length+1});found.locked=false}
  else next.entries.push({id:crypto.randomUUID(),line,date,locked:false,versions:[{...clone(value),version:1}]})
  return next
}
export function sourceStamp(state:ProjectState,metrics:Metric[],line:string,date:string) {
  const design=matchDesign(state,date),condition=matchCondition(state,line,date),entry=state.entries.find(e=>e.line===line&&e.date===date)
  return JSON.stringify({design:design?.version,condition:condition?.id,cv:condition?.value.version,entry:entry?.id,ev:entry?latest(entry.versions).version:null,metrics:metrics.map(m=>[m.id,m.unit,m.scopes,m.formula,m.source]),rule:RULE_VERSION})
}
export function generateDiagnosis(state:ProjectState,metrics:Metric[],line:string,date:string,by:string):DiagnosisVersion {
  const candidate=matchDesign(state,date),design=candidate&&Object.keys(candidate.lines[line]||{}).length?candidate:undefined
  const condition=matchCondition(state,line,date),entry=state.entries.find(e=>e.line===line&&e.date===date)
  const ev=entry?latest(entry.versions):undefined
  const rows=calculateRows(metrics,design?.lines[line]||{},condition?.value.targets,ev?.cells||{})
  const invalid=rows.filter(r=>r.data!=='VALID'&&r.data!=='NA').length, unassessed=rows.filter(r=>r.state==='pending').length
  const warning=rows.filter(r=>r.state==='warning').length,alarm=rows.filter(r=>r.state==='alarm').length
  return {version:0,at:new Date().toISOString(),by,reason:'',designVersion:design?.version??null,conditionId:condition?.id??null,conditionVersion:condition?.value.version??null,conditionName:condition?.value.name||'未匹配工况',entryId:entry?.id??null,entryVersion:ev?.version??null,ruleVersion:RULE_VERSION,rows,demo:!!(design?.demo||condition?.value.demo||ev?.demo),generatedAt:new Date().toISOString(),sourceStamp:sourceStamp(state,metrics,line,date),summary:`${rows.length} 项指标；${invalid} 项数据待补充/校核；${unassessed} 项未判定；预警 ${warning} 项，告警 ${alarm} 项。${!entry?'当日运行数据未保存。':''}${!condition?'未匹配有效工况。':''}${!design?'缺少已生效设计版本。':''}`}
}
export function saveDiagnosis(state:ProjectState,metrics:Metric[],line:string,date:string,value:DiagnosisVersion,correction=false):ProjectState {
  if(value.sourceStamp!==sourceStamp(state,metrics,line,date))throw new Error('来源已变化，请先更新诊断后保存')
  if(!value.entryId||!value.designVersion||!value.conditionId)throw new Error('缺少已保存运行数据、有效设计标准或有效工况，暂不能保存正式日报')
  const next=clone(state),found=next.diagnoses.find(d=>d.line===line&&d.date===date)
  if(found?.locked&&!correction)throw new Error('诊断已锁定，须通过更正并填写原因')
  if(found&&!value.reason.trim())throw new Error('再次保存须填写更新或更正原因')
  const version={...clone(value),version:(found?.versions.length||0)+1,at:new Date().toISOString()}
  if(found){found.versions.push(version);found.locked=false}
  else next.diagnoses.push({id:crypto.randomUUID(),line,date,locked:false,versions:[version]})
  return next
}
export function lockRecord(state:ProjectState,type:'entry'|'diagnosis',id:string,by='本地验收用户'):ProjectState {
  const next=clone(state),item=type==='entry'?next.entries.find(e=>e.id===id):next.diagnoses.find(d=>d.id===id)
  if(!item)throw new Error('记录不存在')
  item.locked=true;(next.events??=[]).push({at:new Date().toISOString(),by,action:`锁定${type==='entry'?'运行数据':'诊断结果'}`,recordId:id});return next
}
export function deleteEntry(state:ProjectState,id:string):ProjectState {
  const entry=state.entries.find(e=>e.id===id)
  if(!entry||entry.locked||state.diagnoses.some(d=>d.versions.some(v=>v.entryId===id)))throw new Error('已锁定或被诊断引用的日数据不可删除')
  const next=clone(state);next.entries=next.entries.filter(e=>e.id!==id);return next
}
export function demoCells(metrics:Metric[],scenario:'complete'|'missing'):Record<string,Cell> {
  return Object.fromEntries(metrics.filter(m=>m.source==='MANUAL').map((m,index)=>[m.id,{value:scenario==='missing'&&index%4===0?'':m.actual==='—'?'':m.actual,state:'VALID',source:'DEMO',note:'固定示范值，供业务校核'}]))
}
export function readLegacy(storage:Storage=localStorage) {
  const names=['waterx-process-design-values','waterx-condition-plans','waterx-operation-entry-records','waterx-process-analysis-reports']
  return Object.fromEntries(names.map(k=>{const raw=storage.getItem(k);try{return [k,raw?JSON.parse(raw):null]}catch{return [k,{error:'格式错误，原始键保留'}]}}))
}
