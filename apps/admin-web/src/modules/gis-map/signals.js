export const metricCatalog={
 flow:{label:'流量',unit:'m³/h',basis:'体积流量',color:'#1687ad'},
 liquidLevel:{label:'集水井液位',unit:'m',basis:'相对井底液位',color:'#7a65bd'},
 waterDepth:{label:'水深',unit:'m',basis:'相对断面底部水深',color:'#159b8a'},
 velocity:{label:'流速',unit:'m/s',basis:'断面平均流速',color:'#d78a28'}
}
const metricSets={plant:['flow','liquidLevel','velocity'],pump:['flow','liquidLevel','velocity'],gate:['waterDepth','velocity'],pipe:['flow','waterDepth','velocity'],node:['liquidLevel'],monitor:['flow','liquidLevel','waterDepth','velocity']}
const bases={flow:[500,180],liquidLevel:[2.4,.42],waterDepth:[.65,.14],velocity:[.8,.22]}
const seedFor=id=>[...String(id)].reduce((hash,char)=>(hash*31+char.charCodeAt(0))>>>0,7)
const qualityFor=(entity,key)=>{
 const id=entity?.properties?.assetId||entity?.properties?.id||entity?.id||''
 if(id==='WWTP-03'&&key==='flow')return 'unconfigured'
 if(id==='PS-018'&&key==='velocity')return 'interrupted'
 if(id==='PS-002'&&key==='liquidLevel')return 'stale'
 if(id==='PS-006'&&key==='flow')return 'zero'
 return 'normal'
}
export const qualityNames={normal:'正常采样',stale:'超时未更新',interrupted:'信号中断',unconfigured:'未配置测点',zero:'有效数值为 0'}
export const metricKeysFor=entity=>metricSets[entity?.properties?.assetType||entity?.properties?.type||entity?.type]||[]
export const signalQualityFor=entity=>{const qs=metricKeysFor(entity).map(key=>qualityFor(entity,key));return qs.includes('interrupted')?'interrupted':qs.includes('unconfigured')?'unconfigured':qs.includes('stale')?'stale':qs.includes('zero')?'zero':'normal'}
export const readMetric=(entity,key,tick=0,scenario='normal')=>{
 const metric=metricCatalog[key],q=qualityFor(entity,key)
 if(!metric)return {key,label:'未知指标',unit:'',basis:'',value:null,quality:'unconfigured',sampleTime:'—',period:'5 分钟',source:'本地固定演示数据'}
 if(q==='unconfigured'||q==='interrupted')return {key,...metric,value:null,quality:q,sampleTime:q==='interrupted'?'07:25（中断）':'—',period:'5 分钟',source:'本地固定演示数据'}
 const [base,amplitude]=bases[key],id=entity?.properties?.assetId||entity?.properties?.id||entity?.id||'sample',assetType=entity?.properties?.assetType||entity?.properties?.type||entity?.type
 const seed=seedFor(id)
 let factor=1
 if(scenario==='inflow-rise'&&key==='flow'&&(assetType==='plant'||assetType==='pump'))factor=1.2
 if(scenario==='pump-cycle'&&assetType==='pump'&&key==='flow')factor=1+Math.sin((tick+seed)*Math.PI/6)*.25
 if(scenario==='partial-outage'&&id==='PS-018'&&key==='flow')return {key,...metric,value:null,quality:'interrupted',sampleTime:'07:25（中断）',period:'5 分钟',source:'本地固定演示数据'}
 const value=q==='zero'?0:(base*(1+(seed%5)*.035)+amplitude*(Math.sin(tick*.33+seed)*.62+Math.sin(tick*.11+seed*.5)*.38))*factor
 const rounded=key==='flow'?Math.round(value):Number(value.toFixed(2))
 const minute=Math.round(8*60+tick*5-(q==='stale'?20:0))
 const h=String(Math.floor(((minute%1440)+1440)%1440/60)).padStart(2,'0'),m=String(((minute%1440)+1440)%1440%60).padStart(2,'0')
 return {key,...metric,value:rounded,quality:q,sampleTime:`2026-10-08 ${h}:${m}`,period:'5 分钟',source:'本地固定演示数据'}
}
export const metricValue=(entity,key,tick=0,scenario='normal')=>readMetric(entity,key,tick,scenario).value
export const historyFor=(entity,key,hours=24,tick=0,scenario='normal')=>{
 const count=hours===1?13:hours===6?37:49,step=hours/(count-1),start=8*60+tick*5-hours*60
 return Array.from({length:count},(_,index)=>{
  const sampleTick=tick-(hours*12)+(index*(hours*12/(count-1)))
  const reading=readMetric(entity,key,sampleTick,scenario)
  const minute=Math.round(start+index*step*60),dayShift=Math.floor(minute/1440),norm=(minute%1440+1440)%1440
  const day=dayShift<0?'2026-10-07':'2026-10-08',label=`${day} ${String(Math.floor(norm/60)).padStart(2,'0')}:${String(Math.floor(norm%60)).padStart(2,'0')}`
  const stalePoint=reading.quality==='stale'&&index===count-1
  const interrupted=reading.quality==='interrupted'&&index>=Math.floor(count*.82)
  return {time:label,value:stalePoint||interrupted||reading.quality==='unconfigured'?null:reading.value,quality:stalePoint?'stale':interrupted?'interrupted':reading.quality}
 })
}
export const formatReading=reading=>reading.value===null?'—':`${reading.value} ${reading.unit}`
