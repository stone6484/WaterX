<script setup lang="ts">
import {computed,nextTick,onBeforeUnmount,onMounted,reactive,ref,watch} from 'vue'
import {AttributionControl,GeoJSONSource,Map as MapLibreMap,Marker,setWorkerUrl} from 'maplibre-gl'
import mapWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import {WxInput,WxState,WxTabs} from '../../components/waterx'
import {CENTER,FEATURE_COUNTS,featureCollections,getItem,items,monitorsList,districtsList} from './data.js'
import {filterEntities,geometryIntersectsBounds,selectInBounds,selectInCircle,circlePolygon,distanceKm,pathDistanceKm,polygonAreaKm2} from './gis-model.js'
import {historyFor,metricCatalog,metricKeysFor,qualityNames,readMetric,signalQualityFor} from './signals.js'
import {contextKey,getView,saveView} from './view-state.js'
import cityBoundary from './hangzhou-boundary.json'
import {boundaryBounds,inCity,outsideCityMask} from './city-boundary.js'
import './gis-map.css'
import './layout.css'
import 'maplibre-gl/dist/maplibre-gl.css'

const props=defineProps<{siteId:string;userId:string}>()
const cityBounds=boundaryBounds(cityBoundary)
// Navigation padding lets the entire irregular city outline fit without cropping.
// The opaque polygon mask, not this envelope, defines what is displayed.
const navigationBounds:[[number,number],[number,number]]=[
 [cityBounds[0][0]-(cityBounds[1][0]-cityBounds[0][0])*.5,cityBounds[0][1]-(cityBounds[1][1]-cityBounds[0][1])*.5],
 [cityBounds[1][0]+(cityBounds[1][0]-cityBounds[0][0])*.5,cityBounds[1][1]+(cityBounds[1][1]-cityBounds[0][1])*.5]
]
const gisHost=ref<HTMLElement|null>(null),fullscreen=ref(false)
let disposed=false,fullscreenFallback=false
function syncFullscreen(){fullscreen.value=document.fullscreenElement===gisHost.value||fullscreenFallback;nextTick(()=>map?.resize())}
async function toggleFullscreen(){
 const host=gisHost.value;if(!host)return
 if(fullscreen.value){fullscreenFallback=false;if(document.fullscreenElement===host)await document.exitFullscreen().catch(()=>{});syncFullscreen();return}
 try{await host.requestFullscreen()}catch{if(!disposed)fullscreenFallback=true}
 if(!disposed)syncFullscreen()
}
function handleFullscreenKey(e:KeyboardEvent){if(e.key==='Escape'&&fullscreen.value)void toggleFullscreen()}
const expandedTypes=reactive<Record<string,boolean>>({})
const layersPinned=ref(true),detailPinned=ref(true)
let layersTimer:number|undefined,detailTimer:number|undefined
function cancelPanelTimer(side:'layers'|'detail'){const timer=side==='layers'?layersTimer:detailTimer;if(timer)window.clearTimeout(timer)}
function leavePanel(side:'layers'|'detail'){cancelPanelTimer(side);if(side==='layers'&&!layersPinned.value)layersTimer=window.setTimeout(()=>layersOpen.value=false,650);if(side==='detail'&&!detailPinned.value)detailTimer=window.setTimeout(()=>detailOpen.value=false,650)}
const layerEntries=[{id:'plant',name:'水厂',count:FEATURE_COUNTS.plants},{id:'pump',name:'泵站',count:FEATURE_COUNTS.pumps},{id:'gate',name:'闸站',count:FEATURE_COUNTS.gates},{id:'pipe',name:'污水管段',count:FEATURE_COUNTS.pipes},{id:'node',name:'检查井 / 节点',count:FEATURE_COUNTS.nodes},{id:'monitor',name:'监测位置',count:FEATURE_COUNTS.monitors},{id:'district',name:'片区',count:FEATURE_COUNTS.districts}]
function layerItems(type:string){return type==='district'?districtsList:filteredEntities.value.filter(x=>x.type===type)}
function focusLayerItem(item:any,type:string){if(type==='district'){map?.fitBounds([item.geometry.coordinates[0][0],item.geometry.coordinates[0][2]],{padding:70,duration:500});return}viewState.layers[type]=true;focusItem(item.id)}
function facilityCaption(item:any){const keys=metricKeysFor(item.feature).slice(0,2);return keys.map(k=>{const r=readMetric(item.feature,k,tick.value,scenario.value);return `${k==='liquidLevel'?'液位':r.label} ${r.value===null?metricStatusText(r.quality):`${r.value} ${r.unit}`}${r.quality==='stale'?'（超时）':''}`}).join(' · ')}
const emit=defineEmits<{'open-twin':[]}>()
const error=ref(''),mapHost=ref<HTMLElement|null>(null),search=ref(''),mapStatus=ref('在线街图 · 青山湖位置'),layersOpen=ref(true),detailOpen=ref(false),activeTab=ref<'basic'|'signals'|'materials'>('signals'),measureText=ref(''),measurePoints=ref<[number,number][]>([]),selectionBox=ref<HTMLElement|null>(null),hoverIndex=ref<number|null>(null),extentRevision=ref(0),documentText=ref(''),documentTitle=ref('')
const key=contextKey(props.siteId,props.userId),viewState=reactive(getView(key))
const mode=ref<'none'|'box'|'circle'|'distance'|'area'>('none'),circleCenter=ref<[number,number]|null>(null),boxAnchor=ref<[number,number]|null>(null),boxCurrent=ref<[number,number]|null>(null),selectionGeometry=ref<any>({type:'FeatureCollection',features:[]})
const tick=ref(viewState.tick),scenario=ref(viewState.scenario),theme=ref(viewState.theme),metric=ref(viewState.metric),baseMode=ref(viewState.baseMode),selectedId=ref(viewState.selected),selectedIds=ref<string[]>([...viewState.selectedIds]),compareIds=ref<string[]>([...viewState.compareIds]),filterType=ref(viewState.filterType),filterDistrict=ref('all'),filterMaintainer=ref(viewState.filterMaintainer),filterQuality=ref(viewState.filterQuality),currentExtent=ref(viewState.currentExtent)
let map:MapLibreMap|null=null,resizeObserver:ResizeObserver|null=null,simulationTimer:number|undefined,suppressMapClick=false,sourceReady=false,labelMarkers:Marker[]=[],labelFrame=0

const entityFilters=computed(()=>({query:search.value,type:filterType.value,district:filterDistrict.value,maintainer:filterMaintainer.value,quality:filterQuality.value}))
const filteredEntities=computed(()=>filterEntities(entityFilters.value))
const boundsNow=()=>map?map.getBounds().toArray().flat():null
const selectedEntity=computed(()=>selectedId.value?getItem(selectedId.value):null)
const signalEntity=computed(()=>{const selected=selectedEntity.value;if(!selected)return null;if(selected.type==='monitor')return selected.feature;const monitor=monitorsList.find(m=>m.properties.assetId===selected.id);return monitor?.feature||selected.feature})
const availableMetrics=computed(()=>signalEntity.value?metricKeysFor(signalEntity.value):[])
const activeMetric=computed(()=>availableMetrics.value.includes(metric.value)?metric.value:availableMetrics.value[0]||'flow')
const activeReading=computed(()=>signalEntity.value?readMetric(signalEntity.value,activeMetric.value,tick.value,scenario.value):null)
const signalRows=computed(()=>signalEntity.value?availableMetrics.value.map(k=>readMetric(signalEntity.value!,k,tick.value,scenario.value)):[])
const comparisonCandidates=computed(()=>{const current=metricCatalog[activeMetric.value];if(!current)return [];return monitorsList.filter(item=>item.id!==signalEntity.value?.properties?.id&&metricKeysFor(item.feature).includes(activeMetric.value)&&metricCatalog[activeMetric.value].unit===current.unit&&metricCatalog[activeMetric.value].basis===current.basis)})
const comparisonSeries=computed(()=>{if(!signalEntity.value)return [];const currentId=signalEntity.value.properties.id;const current=historyFor(signalEntity.value,activeMetric.value,rangeHours.value,tick.value,scenario.value);const series=[{id:currentId,name:signalEntity.value.properties.name,color:'#1687ad',samples:current}];for(const id of compareIds.value.slice(0,2)){const item=getItem(id);if(item&&item.type==='monitor'&&metricKeysFor(item.feature).includes(activeMetric.value))series.push({id,name:item.name,color:['#d78a28','#7a65bd'][series.length-1],samples:historyFor(item.feature,activeMetric.value,rangeHours.value,tick.value,scenario.value)})}return series})
const rangeHours=ref(24)
const maintainerOptions=computed(()=>[...new Set(items.map(x=>x.properties.maintainer).filter(Boolean))].sort())
const matchedSuggestion=computed(()=>search.value.trim()?filteredEntities.value.slice(0,8):[])
const sampleClock=computed(()=>{const minute=(8*60+tick.value*5)%1440;return `2026-10-08 ${String(Math.floor(minute/60)).padStart(2,'0')}:${String(minute%60).padStart(2,'0')}`})
const chartBounds=computed(()=>{const numbers=comparisonSeries.value.flatMap(s=>s.samples.map(x=>x.value).filter((n):n is number=>n!==null));if(!numbers.length)return {min:0,max:1};const min=Math.min(...numbers),max=Math.max(...numbers),pad=Math.max((max-min)*.15,.02);return {min:min-pad,max:max+pad}})
const chartPaths=computed<any[]>(()=>comparisonSeries.value.map(series=>{const {min,max}=chartBounds.value,points=series.samples.map((sample,index)=>({sample,index,x:42+index*(538/Math.max(1,series.samples.length-1)),y:20+(max-(sample.value??min))/(max-min)*112}));let d='',open=false;for(const p of points){if(p.sample.value===null){open=false;continue}d+=`${open?'L':'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)} `;open=true}return {...series,d,points}}))
const hoveredSamples=computed(()=>{const index=hoverIndex.value;return index===null?[]:comparisonSeries.value.map(s=>({id:s.id,name:s.name,color:s.color,sample:s.samples[index]})).filter(x=>x.sample)})
const detailFields=computed(()=>{const item=selectedEntity.value;if(!item)return [];const p=item.properties;return [
 ['对象编号',item.id],['所在片区',p.districtName||'未关联片区'],['维护归属',p.maintainer||'未配置'],['坐标',`${item.coords[1].toFixed(5)}, ${item.coords[0].toFixed(5)}`],
 ...(item.type==='plant'?[['设计规模',p.params?.capacity],['处理工艺',p.params?.process]]:[]),
 ...(item.type==='pump'?[['设计输送能力',p.params?.capacity],['主要设备',p.params?.equipment]]:[]),
 ...(item.type==='gate'?[['所属水系',p.params?.waterway],['闸孔数量',p.params?.gates]]:[]),
 ...(item.type==='pipe'?[['起止节点',`${p.fromNodeId} → ${p.toNodeId}`],['管径 / 材质',`${p.diameter} / ${p.material}`],['流向',p.flowDirection]]:[]),
 ...(item.type==='node'?[['井深',p.depth],['关联管段',items.filter(x=>x.type==='pipe'&&(x.properties.fromNodeId===item.id||x.properties.toNodeId===item.id)).map(x=>x.id).join('、')||'暂无连接']]:[]),
 ['数据标记','演示数据 · 未接入现场']
]})

function setVisibility(id:string,visible:boolean){if(map?.getLayer(id))map.setLayoutProperty(id,'visibility',visible?'visible':'none')}
function enriched(item:any){const keys=metricKeysFor(item.feature),chosen=keys.includes(metric.value)?metric.value:keys[0],reading=chosen?readMetric(item.feature,chosen,tick.value,scenario.value):null;return {...item.feature,properties:{...item.properties,quality:reading?.quality||signalQualityFor(item.feature),metricAvailable:Boolean(reading?.value!==null&&reading),metricLabel:reading?.label||'未配置测点',unit:reading?.unit||'',value:reading?.value===null||!reading?'—':String(reading.value),selected:selectedIds.value.includes(item.id)||selectedId.value===item.id}}}
function byType(type:string,layer=type){return filteredEntities.value.filter(item=>item.type===type&&viewState.layers[layer]).map(enriched)}
function setCollection(id:string,features:any[]){const src=map?.getSource(id) as GeoJSONSource|undefined;src?.setData({type:'FeatureCollection',features} as any)}
function refreshSources(){if(!map||!sourceReady)return;setCollection('assets',filteredEntities.value.filter(x=>['plant','pump','gate'].includes(x.type)&&viewState.layers[x.type]).map(enriched));setCollection('pipes',byType('pipe'));setCollection('nodes',byType('node'));setCollection('monitors',byType('monitor'));setCollection('districts',viewState.layers.district?featureCollections.districts.features:[]);refreshSelection();updateThemeLayers()}
function refreshSelection(){if(!map)return;const keys:Record<string,string>={pipes:'pipe',nodes:'node',monitors:'monitor',districts:'district'};for(const source of ['assets','pipes','nodes','monitors','districts']){const layerIds=map.getStyle()?.layers?.filter(l=>'source'in l&&(l as any).source===source).map(l=>l.id)||[],visible=source==='assets'?['plant','pump','gate'].some(t=>viewState.layers[t]):Boolean(viewState.layers[keys[source]]);for(const id of layerIds)setVisibility(id,visible)}}
function updateThemeLayers(){if(!map)return;setVisibility('monitor-points',theme.value==='monitoring'&&viewState.layers.monitor);setVisibility('monitor-clusters',theme.value==='monitoring'&&viewState.layers.monitor);if(map.getLayer('pipe-line'))map.setPaintProperty('pipe-line','line-color',theme.value==='monitoring'?['match',['get','quality'],'stale','#d78a28','interrupted','#d64b4b','unconfigured','#9ba8ae','#1687ad']:'#1687ad');if(map.getLayer('asset-circles'))map.setPaintProperty('asset-circles','circle-opacity',theme.value==='monitoring'?.76:1);scheduleLabels()}
function setSource(id:string,data:any,cluster=false){map?.addSource(id,{type:'geojson',data, ...(cluster?{cluster:true,clusterMaxZoom:12,clusterRadius:42}:{}),promoteId:'id'} as any)}
function addMapLayers(){if(!map)return
 setSource('assets',featureCollections.assets,true);setSource('pipes',featureCollections.pipes);setSource('nodes',featureCollections.nodes);setSource('monitors',featureCollections.monitors,true);setSource('districts',featureCollections.districts);setSource('fallback-roads',featureCollections.fallbackRoads);setSource('selection',{type:'FeatureCollection',features:[]});setSource('measure',{type:'FeatureCollection',features:[]})
 map.addLayer({id:'district-fill',type:'fill',source:'districts',paint:{'fill-color':'#77b78d','fill-opacity':.06}} as any)
 map.addLayer({id:'district-line',type:'line',source:'districts',paint:{'line-color':'#6b9b84','line-width':1.4,'line-dasharray':[3,2]}} as any)
 map.addLayer({id:'fallback-roads',type:'line',source:'fallback-roads',layout:{visibility:baseMode.value==='local'?'visible':'none'},paint:{'line-color':'#c6d0c8','line-width':1,'line-dasharray':[2,2]}} as any)
 map.addLayer({id:'pipe-casing',type:'line',source:'pipes',layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#f9fbf8','line-width':['interpolate',['linear'],['zoom'],8,3,14,8]}} as any)
 map.addLayer({id:'pipe-line',type:'line',source:'pipes',layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#1687ad','line-width':['interpolate',['linear'],['zoom'],8,1.5,14,4], 'line-opacity':.88}} as any)
 map.addLayer({id:'node-circles',type:'circle',source:'nodes',minzoom:14,paint:{'circle-radius':3.2,'circle-color':'#f4f8f3','circle-stroke-color':'#348699','circle-stroke-width':1.2}} as any)
 map.addLayer({id:'asset-clusters',type:'circle',source:'assets',filter:['has','point_count'],paint:{'circle-color':'#087fac','circle-radius':['step',['get','point_count'],18,20,24,50,31],'circle-stroke-color':'#fff','circle-stroke-width':2,'circle-opacity':.88}} as any)
 map.addLayer({id:'asset-circles',type:'circle',source:'assets',filter:['!', ['has','point_count']],paint:{'circle-radius':['case',['==',['get','type'],'plant'],9,['==',['get','type'],'pump'],7,6],'circle-color':['match',['get','type'],'plant','#087fac','pump','#159b8a','gate','#8473b0','#1687ad'],'circle-stroke-color':['case',['get','selected'],'#ef9a33','#fff'],'circle-stroke-width':['case',['get','selected'],3,1.7],'circle-opacity':1}} as any)
 map.addLayer({id:'monitor-clusters',type:'circle',source:'monitors',filter:['has','point_count'],layout:{visibility:theme.value==='monitoring'?'visible':'none'},paint:{'circle-color':'#5f7b89','circle-radius':['step',['get','point_count'],17,12,23,24,28],'circle-stroke-color':'#fff','circle-stroke-width':2}} as any)
 map.addLayer({id:'monitor-points',type:'circle',source:'monitors',filter:['!', ['has','point_count']],layout:{visibility:theme.value==='monitoring'?'visible':'none'},paint:{'circle-radius':['case',['get','selected'],9,6],'circle-color':['match',['get','quality'],'stale','#d78a28','interrupted','#d64b4b','unconfigured','#a7b1b6','zero','#1687ad','#149b8a'],'circle-stroke-color':['case',['get','selected'],'#ef9a33','#fff'],'circle-stroke-width':['case',['get','selected'],3,1.7]}} as any)
 map.addLayer({id:'selection-fill',type:'fill',source:'selection',paint:{'fill-color':'#1386b1','fill-opacity':.13}} as any)
 map.addLayer({id:'selection-line',type:'line',source:'selection',paint:{'line-color':'#087fac','line-width':2,'line-dasharray':[2,1]}} as any)
 map.addLayer({id:'measure-fill',type:'fill',source:'measure',paint:{'fill-color':'#e29a3e','fill-opacity':.15}} as any)
 map.addLayer({id:'measure-line',type:'line',source:'measure',paint:{'line-color':'#d87924','line-width':2.5,'line-dasharray':[2,1]}} as any)
 map.addLayer({id:'measure-points',type:'circle',source:'measure',paint:{'circle-radius':4,'circle-color':'#d87924','circle-stroke-color':'#fff','circle-stroke-width':1.5}} as any)
 setSource('city-boundary',cityBoundary)
 setSource('outside-city',outsideCityMask(cityBoundary))
 // Opaque outer mask hides neighbouring areas in every zoom/theme/base-map mode.
 map.addLayer({id:'outside-city-mask',type:'fill',source:'outside-city',paint:{'fill-color':'#edf2f5','fill-opacity':1}} as any)
 map.addLayer({id:'city-outline',type:'line',source:'city-boundary',paint:{'line-color':'#527b8e','line-width':1.5}} as any)
 sourceReady=true;refreshSources();setBaseMode(baseMode.value);scheduleLabels()
}
function scheduleLabels(){if(labelFrame)cancelAnimationFrame(labelFrame);labelFrame=requestAnimationFrame(updateDomLabels)}
async function expandCluster(sourceId:string,id:number,point:[number,number]){try{const source=map?.getSource(sourceId) as GeoJSONSource|undefined;if(!source)return;const zoom=await source.getClusterExpansionZoom(id);map?.easeTo({center:point,zoom:zoom+.2})}catch{error.value='聚合点暂未就绪，请缩放地图查看设施。'}}
function updateDomLabels(){if(!map||!sourceReady)return;for(const marker of labelMarkers)marker.remove();labelMarkers=[];const z=map.getZoom(),features:any[]=[],occupied:{x:number;y:number;w:number;h:number}[]=[]
 const add=(coord:[number,number],text:string,className:string,priority:number,onClick?:()=>void)=>{if(Array.isArray(coord)&&Number.isFinite(coord[0])&&Number.isFinite(coord[1])&&inCity(coord,cityBoundary))features.push({coord,text,className,priority,onClick})}
 if(viewState.layers.district)for(const d of districtsList)add(d.center,d.name,'gis-map-label district-label',1)
 if(z>=10.5){for(const item of filteredEntities.value.filter(x=>['plant','pump','gate'].includes(x.type)&&viewState.layers[x.type])){const priority=item.id===selectedId.value?20:item.type==='plant'?10:5;add(item.coords,`${item.name}\n${facilityCaption(item)}`,'gis-map-label asset-label',priority,()=>selectEntity(item.id))}}
 if(theme.value==='monitoring'&&z>=12){for(const item of monitorsList.filter(x=>viewState.layers.monitor)){const props=enriched(item).properties;add(item.coords,`${props.value} ${props.unit}`,'gis-map-label monitor-label',selectedId.value===item.id?9:4,()=>selectEntity(item.id))}}
 if(z>=14){for(const item of filteredEntities.value.filter(x=>x.type==='pipe'&&viewState.layers.pipe)){const mid=item.feature.geometry.coordinates[Math.floor(item.feature.geometry.coordinates.length/2)];add(mid,`${item.id} · ${item.properties.diameter}`,'gis-map-label pipe-label',1,()=>selectEntity(item.id))}}
 if(z>=15){for(const item of filteredEntities.value.filter(x=>x.type==='node'&&viewState.layers.node))add(item.coords,item.id,'gis-map-label node-label',1,()=>selectEntity(item.id))}
 const clusterLayers=['asset-clusters',...(theme.value==='monitoring'?['monitor-clusters']:[])];for(const layer of clusterLayers){if(!map.getLayer(layer))continue;for(const f of map.queryRenderedFeatures({layers:[layer]})){const point=(f.geometry as any).coordinates as [number,number],count=String(f.properties?.point_count_abbreviated||f.properties?.point_count||'');add(point,count,'gis-cluster-label',10,()=>expandCluster(layer==='asset-clusters'?'assets':'monitors',Number(f.properties?.cluster_id),point))}}
 features.sort((a,b)=>b.priority-a.priority);for(const feature of features){const point=map.project({lng:feature.coord[0],lat:feature.coord[1]}),lines=feature.text.split('\n'),w=feature.className.includes('cluster')?30:Math.min(320,Math.max(...lines.map((x:string)=>x.length))*12+20),h=feature.className.includes('cluster')?30:lines.length>1?54:28,rect={x:point.x-w/2,y:point.y-h/2,w,h};if(rect.x<0||rect.y<0||rect.x+w>map.getCanvas().clientWidth||rect.y+h>map.getCanvas().clientHeight)continue;if(occupied.some(r=>rect.x<r.x+r.w+5&&rect.x+rect.w+5>r.x&&rect.y<r.y+r.h+4&&rect.y+rect.h+4>r.y))continue;occupied.push(rect);const hasTwin=feature.text.startsWith('青山湖中心水厂\n'),el=document.createElement(hasTwin?'div':feature.onClick?'button':'span');el.className=feature.className;el.title=feature.text;for(const [index,line] of lines.entries()){const part=document.createElement(index?'small':'strong');part.textContent=line;if(hasTwin&&index===0){const name=document.createElement('button');name.type='button';name.className='facility-name';name.textContent=line;name.addEventListener('click',e=>{e.stopPropagation();feature.onClick?.()});part.textContent='';part.appendChild(name);const link=document.createElement('button');link.type='button';link.className='twin-name-link';link.title='进入数字孪生';link.setAttribute('aria-label','进入青山湖中心水厂数字孪生');const svg=document.createElementNS('http://www.w3.org/2000/svg','svg'),use=document.createElementNS('http://www.w3.org/2000/svg','use');svg.setAttribute('aria-hidden','true');use.setAttribute('href','/waterx-nav-icons.svg?v=20261008-v11#digital-twin');svg.appendChild(use);link.appendChild(svg);link.addEventListener('click',e=>{e.stopPropagation();openTwin('WWTP-01')});part.appendChild(link)}el.appendChild(part)}if(feature.onClick){if(el instanceof HTMLButtonElement)el.type='button';el.addEventListener('click',e=>{e.stopPropagation();feature.onClick?.()})}const marker=new Marker({element:el,anchor:'center'}).setLngLat(feature.coord as [number,number]).addTo(map);labelMarkers.push(marker)}}
function setBaseMode(modeValue:string){if(!map)return;baseMode.value=modeValue==='local'?'local':'osm';viewState.baseMode=baseMode.value;setVisibility('osm-base',baseMode.value==='osm');setVisibility('fallback-roads',baseMode.value==='local');mapStatus.value=baseMode.value==='osm'?'在线街图 · 青山湖位置':'本地空间示意 · 道路为示意线';persist()}
function persist(){if(!map)return;const center=map.getCenter();viewState.center=[center.lng,center.lat];viewState.zoom=map.getZoom();viewState.theme=theme.value;viewState.metric=metric.value;viewState.tick=tick.value;viewState.scenario=scenario.value;viewState.selected=selectedId.value;viewState.selectedIds=[...selectedIds.value];viewState.compareIds=[...compareIds.value];viewState.filterType=filterType.value;viewState.filterDistrict=filterDistrict.value;viewState.filterMaintainer=filterMaintainer.value;viewState.filterQuality=filterQuality.value;viewState.currentExtent=currentExtent.value;viewState.baseMode=baseMode.value;saveView(key,viewState)}
function updateSelectionData(){const features=selectionGeometry.value.features||[];setCollection('selection',features)}
function refreshMeasureData(){if(!map)return;const features:any[]=[];if(measurePoints.value.length){const coords=measurePoints.value;if(mode.value==='area'&&coords.length>=3)features.push({type:'Feature',geometry:{type:'Polygon',coordinates:[[...coords,coords[0]]]},properties:{kind:'area'}});else features.push({type:'Feature',geometry:{type:'LineString',coordinates:coords},properties:{kind:'line'}});for(const coord of coords)features.push({type:'Feature',geometry:{type:'Point',coordinates:coord},properties:{kind:'point'}})}setCollection('measure',features)}
function refreshMapData(){refreshSources();extentRevision.value++}
function mapStyle(){return {version:8,sources:{osm:{type:'raster',tiles:['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],tileSize:256,bounds:cityBounds.flat(),attribution:'© OpenStreetMap contributors'}},layers:[{id:'local-background',type:'background',paint:{'background-color':'#edf1ec'}},{id:'osm-base',type:'raster',source:'osm',paint:{'raster-saturation':-.15,'raster-contrast':0,'raster-opacity':1,'raster-resampling':'linear'}}]} as any}
function displayType(type:string){return ({plant:'水厂',pump:'泵站',gate:'闸站',pipe:'管段',node:'检查井',monitor:'监测点',district:'片区'} as Record<string,string>)[type]||type}
function selectEntity(id:string){const item=getItem(id);if(!item)return;selectedId.value=id;detailOpen.value=true;activeTab.value='signals';documentText.value='';if(!selectedIds.value.includes(id)&&selectedIds.value.length)selectedIds.value=[...selectedIds.value];refreshSources();persist()}
function focusItem(id:string){const item=getItem(id);if(!item||!map)return;const coords=item.feature.geometry.type==='Point'?item.feature.geometry.coordinates:item.feature.geometry.coordinates[Math.floor(item.feature.geometry.coordinates.length/2)];map.flyTo({center:coords,zoom:Math.max(map.getZoom(),14),offset:[-Math.min(170,map.getCanvas().clientWidth*.22),55],duration:550});selectEntity(id)}
const showFullCity=ref(false)
function toggleMapExtent(){if(showFullCity.value)returnHome();else fitAll();showFullCity.value=!showFullCity.value}
function fitAll(){if(!map)return;detailOpen.value=false;map.fitBounds(cityBounds,{padding:{top:60,bottom:65,left:layersOpen.value&&map.getCanvas().clientWidth>750?280:55,right:65},duration:650})}
function returnHome(){if(!map)return;map.flyTo({center:CENTER as [number,number],zoom:12,duration:650});selectedId.value='WWTP-01';detailOpen.value=true;persist()}
function openTwin(id=selectedId.value){if(id!=='WWTP-01')return;selectedId.value=id;persist();emit('open-twin')}
function setTheme(value:'facility'|'monitoring'){theme.value=value;viewState.theme=value;updateThemeLayers();refreshSources();persist()}
function setMetric(value:string){metric.value=value;viewState.metric=value;hoverIndex.value=null;refreshSources();persist()}
function setMode(value:'none'|'box'|'circle'|'distance'|'area'){mode.value=value;circleCenter.value=null;boxAnchor.value=null;boxCurrent.value=null;if(map){value==='none'?map.dragPan.enable():map.dragPan.disable();map.getCanvas().style.cursor=value==='none'?'grab':'crosshair'}if(value==='none'){if(selectionBox.value)selectionBox.value.style.display='none'}measurePoints.value=[];measureText.value='';refreshMeasureData()}
function chooseMapTool(event:Event){const value=(event.target as HTMLSelectElement).value;if(value==='clear'){clearSelection();(event.target as HTMLSelectElement).value='none';return}setMode(value as 'none'|'box'|'circle'|'distance'|'area')}
function finishCircle(center:[number,number],edge:[number,number]){const radius=distanceKm(center,edge);selectionGeometry.value={type:'FeatureCollection',features:[{type:'Feature',geometry:{type:'Polygon',coordinates:[circlePolygon(center,radius)]},properties:{radiusKm:Number(radius.toFixed(2))}}]};selectedIds.value=selectInCircle(center,radius);selectedId.value=selectedIds.value[0]||null;detailOpen.value=Boolean(selectedId.value);updateSelectionData();setMode('none');persist()}
function finishBox(a:[number,number],b:[number,number]){const west=Math.min(a[0],b[0]),east=Math.max(a[0],b[0]),south=Math.min(a[1],b[1]),north=Math.max(a[1],b[1]);if(Math.abs(east-west)<1e-6||Math.abs(north-south)<1e-6)return;selectionGeometry.value={type:'FeatureCollection',features:[{type:'Feature',geometry:{type:'Polygon',coordinates:[[[west,south],[east,south],[east,north],[west,north],[west,south]]]},properties:{kind:'box'}}]};selectedIds.value=selectInBounds([west,south,east,north]);selectedId.value=selectedIds.value[0]||null;detailOpen.value=Boolean(selectedId.value);updateSelectionData();setMode('none');persist()}
function addMeasurePoint(coord:[number,number]){if(mode.value==='area'&&measurePoints.value.length>=3&&measurePoints.value.length>0&&distanceKm(measurePoints.value[0],coord)<.08){finishMeasurement();return}measurePoints.value=[...measurePoints.value,coord];if(mode.value==='distance'&&measurePoints.value.length>=2)measureText.value=`距离 ${pathDistanceKm(measurePoints.value).toFixed(2)} km`;if(mode.value==='area'&&measurePoints.value.length>=3)measureText.value=`面积 ${polygonAreaKm2(measurePoints.value).toFixed(2)} km²`;refreshMeasureData()}
function finishMeasurement(){if(mode.value==='distance'&&measurePoints.value.length>=2)measureText.value=`距离 ${pathDistanceKm(measurePoints.value).toFixed(2)} km`;if(mode.value==='area'&&measurePoints.value.length>=3)measureText.value=`面积 ${polygonAreaKm2(measurePoints.value).toFixed(2)} km²`;mode.value='none';if(map){map.dragPan.enable();map.getCanvas().style.cursor='grab'}persist()}
function clearSelection(){selectedIds.value=[];selectedId.value=null;selectionGeometry.value={type:'FeatureCollection',features:[]};detailOpen.value=false;measurePoints.value=[];measureText.value='';setMode('none');updateSelectionData();refreshMeasureData();persist()}
function beginBox(e:any){if(mode.value!=='box')return;e.originalEvent.preventDefault();boxAnchor.value=[e.lngLat.lng,e.lngLat.lat];boxCurrent.value=[e.lngLat.lng,e.lngLat.lat];if(selectionBox.value){const p=map!.project(e.lngLat);selectionBox.value.style.display='block';selectionBox.value.style.left=`${p.x}px`;selectionBox.value.style.top=`${p.y}px`;selectionBox.value.style.width='0';selectionBox.value.style.height='0'}}
function moveBox(e:any){if(mode.value!=='box'||!boxAnchor.value||!selectionBox.value)return;boxCurrent.value=[e.lngLat.lng,e.lngLat.lat];const a=map!.project({lng:boxAnchor.value[0],lat:boxAnchor.value[1]}),b=map!.project(e.lngLat);selectionBox.value.style.left=`${Math.min(a.x,b.x)}px`;selectionBox.value.style.top=`${Math.min(a.y,b.y)}px`;selectionBox.value.style.width=`${Math.abs(a.x-b.x)}px`;selectionBox.value.style.height=`${Math.abs(a.y-b.y)}px`}
function endBox(e:any){if(mode.value!=='box'||!boxAnchor.value)return;const end:[number,number]=[e.lngLat.lng,e.lngLat.lat];finishBox(boxAnchor.value,end);if(selectionBox.value)selectionBox.value.style.display='none';suppressMapClick=true;window.setTimeout(()=>suppressMapClick=false,0)}
function showMapClick(e:any){if(mode.value==='box'||suppressMapClick)return;const p:[number,number]=[e.lngLat.lng,e.lngLat.lat];if(mode.value==='circle'){if(!circleCenter.value){circleCenter.value=p;measureText.value='已选圆心，再点一次确定半径'}else finishCircle(circleCenter.value,p);return}if(mode.value==='distance'||mode.value==='area'){addMeasurePoint(p);return}const features=map!.queryRenderedFeatures(e.point,{layers:['asset-circles','monitor-points','pipe-line','node-circles']});if(features.length){const f=features[0],id=String(f.properties?.id||'');if(id)selectEntity(id)}}
function openDocument(title:string,body:string){documentTitle.value=title;documentText.value=body}
function selectSuggestion(id:string){search.value='';focusItem(id)}
function toggleComparison(id:string,event:Event){const checked=(event.target as HTMLInputElement).checked;if(checked){if(compareIds.value.length>=2){(event.target as HTMLInputElement).checked=false;return}compareIds.value=[...compareIds.value.filter(x=>x!==id),id]}else compareIds.value=compareIds.value.filter(x=>x!==id);viewState.compareIds=[...compareIds.value];persist()}
function setRange(hours:number){rangeHours.value=hours;hoverIndex.value=null;compareIds.value=[];persist()}
function handleChartMove(e:MouseEvent){const rect=(e.currentTarget as SVGElement).getBoundingClientRect(),x=(e.clientX-rect.left)/rect.width*600;hoverIndex.value=Math.max(0,Math.min(comparisonSeries.value[0]?.samples.length-1||0,Math.round((x-42)/538*Math.max(0,(comparisonSeries.value[0]?.samples.length||1)-1))))}
function handleChartLeave(){hoverIndex.value=null}
function metricStatusText(q:string){return qualityNames[q as keyof typeof qualityNames]||'状态未知'}
function getDocs(item:any){if(!item)return [];return [
 {title:`${item.name}空间档案（演示）`,kind:'空间资料说明',date:'2026-10-08',body:`对象：${item.name}\n编号：${item.id}\n片区：${item.properties.districtName||'未关联'}\n说明：本条为空间展示用的固定资料，不代表真实资产档案。`},
 {title:`${item.name}监测口径（演示）`,kind:'监测资料说明',date:'2026-10-08',body:`对象：${item.name}\n数据来源：本地固定演示数据\n采样周期：5 分钟（模拟）\n口径：读数、时间与质量状态来自同一演示快照；缺测不补零，结论不得用于运行决策。`}
]}
function setFilters(){search.value='';filterType.value='all';filterDistrict.value='all';filterMaintainer.value='all';filterQuality.value='all';currentExtent.value=false;selectedIds.value=[];refreshMapData();persist()}

watch([filteredEntities,()=>viewState.layers,theme,metric,tick,scenario,selectedId,selectedIds],()=>refreshSources(),{deep:true})
watch([filterType,filterDistrict,filterMaintainer,filterQuality,currentExtent,search],()=>{refreshMapData();persist()})
watch([theme,metric],()=>persist())

onMounted(async()=>{
 document.addEventListener('fullscreenchange',syncFullscreen)
 document.addEventListener('keydown',handleFullscreenKey)
 if(!props.siteId||!props.userId){error.value='请先登录并选择已授权的项目。';return}
 await nextTick()
 try{
  setWorkerUrl(mapWorkerUrl)
  map=new MapLibreMap({container:mapHost.value!,style:mapStyle(),center:viewState.center,zoom:viewState.zoom,minZoom:7,maxZoom:18,maxBounds:navigationBounds,attributionControl:false,dragRotate:false,touchPitch:false,renderWorldCopies:false,cooperativeGestures:false})
  map.addControl(new AttributionControl({compact:false,customAttribution:'演示数据'}),'bottom-right')
  map.on('load',()=>{addMapLayers();map!.resize();refreshSources();mapStatus.value='在线街图 · 杭州范围'})
  map.on('error',(e:any)=>{if(e?.sourceId==='osm'||String(e?.error?.message||'').toLowerCase().includes('tile'))mapStatus.value='在线底图暂不可用 · 请检查网络后重试'})
  map.on('click','asset-clusters',(e:any)=>{const f=e.features?.[0];if(f)expandCluster('assets',Number(f.properties.cluster_id),(f.geometry as any).coordinates)})
  map.on('click','monitor-clusters',(e:any)=>{const f=e.features?.[0];if(f)expandCluster('monitors',Number(f.properties.cluster_id),(f.geometry as any).coordinates)})
  map.on('mouseenter','asset-circles',()=>{if(map)map.getCanvas().style.cursor='pointer'});map.on('mouseleave','asset-circles',()=>{if(map&&mode.value==='none')map.getCanvas().style.cursor='grab'})
  map.on('mouseenter','monitor-points',()=>{if(map)map.getCanvas().style.cursor='pointer'});map.on('mouseleave','monitor-points',()=>{if(map&&mode.value==='none')map.getCanvas().style.cursor='grab'})
  map.on('mousedown',beginBox);map.on('mousemove',moveBox);map.on('mouseup',endBox);map.on('click',showMapClick)
  map.on('moveend',()=>{extentRevision.value++;persist()})
  map.on('move',scheduleLabels);map.on('zoom',scheduleLabels);map.on('sourcedata',(e:any)=>{if(e.sourceId==='assets'||e.sourceId==='monitors')scheduleLabels()})
  map.doubleClickZoom.disable();map.on('dblclick',(e:any)=>{if(mode.value==='area'||mode.value==='distance'){e.preventDefault();finishMeasurement()}})
  map.on('mousemove',(e:any)=>{if(mode.value==='circle'&&circleCenter.value){measureText.value=`半径 ${distanceKm(circleCenter.value,[e.lngLat.lng,e.lngLat.lat]).toFixed(2)} km`}})
  resizeObserver=new ResizeObserver(()=>map?.resize());if(mapHost.value)resizeObserver.observe(mapHost.value)
  simulationTimer=window.setInterval(()=>{tick.value++;viewState.tick=tick.value;refreshSources();persist()},30000)
 }catch{error.value='地图组件未能启动，请刷新页面或切换回其他模块。'}
})
onBeforeUnmount(()=>{disposed=true;document.removeEventListener('fullscreenchange',syncFullscreen);document.removeEventListener('keydown',handleFullscreenKey);if(document.fullscreenElement===gisHost.value)void document.exitFullscreen().catch(()=>{});cancelPanelTimer('layers');cancelPanelTimer('detail');if(simulationTimer)window.clearInterval(simulationTimer);if(labelFrame)cancelAnimationFrame(labelFrame);for(const marker of labelMarkers)marker.remove();labelMarkers=[];resizeObserver?.disconnect();persist();map?.remove();map=null})
</script>

<template>
 <section ref="gisHost" class="gis-map" :class="{'is-fullscreen':fullscreen}" aria-label="GIS 一张图">
  <WxState v-if="error" kind="error" compact>{{error}}</WxState>
  <header class="gis-toolbar">
   <div class="toolbar-filters">
   <div class="toolbar-search"><WxInput id="gisSearch" v-model="search" aria-label="搜索设施" placeholder="搜索名称或编号"/><div v-if="matchedSuggestion.length" class="suggestions"><button v-for="item in matchedSuggestion" :key="item.id" @click="selectSuggestion(item.id)"><span>{{item.name}}</span><small>{{item.id}} · {{displayType(item.type)}}</small></button><p v-if="!matchedSuggestion.length">没有匹配对象</p></div></div>
   <label>类型<select v-model="filterType"><option value="all">全部</option><option value="plant">水厂</option><option value="pump">泵站</option><option value="gate">闸站</option><option value="pipe">管段</option><option value="node">检查井</option><option value="monitor">监测点</option></select></label>
   <label>维护归属<select v-model="filterMaintainer"><option value="all">全部</option><option v-for="name in maintainerOptions" :key="name" :value="name">{{name}}</option></select></label>
   <label>信号质量<select v-model="filterQuality"><option value="all">全部状态</option><option value="normal">正常采样</option><option value="stale">超时未更新</option><option value="interrupted">信号中断</option><option value="unconfigured">未配置测点</option><option value="zero">有效数值为 0</option></select></label>
   <label>地图工具<select :value="mode" @change="chooseMapTool" aria-label="地图工具"><option value="none">浏览地图</option><option value="box">框选</option><option value="circle">圈选</option><option value="distance">量距离</option><option value="area">量面积</option><option value="clear">清除选区 / 量算</option></select></label>
   <label class="extent-check"><input v-model="currentExtent" type="checkbox">仅查当前视野</label>
   <label v-if="theme==='monitoring'" class="metric-select">指标<select :value="metric" @change="setMetric(($event.target as HTMLSelectElement).value)"><option value="flow">流量</option><option value="liquidLevel">集水井液位</option><option value="waterDepth">水深</option><option value="velocity">流速</option></select></label>
   </div>
   <div class="toolbar-actions">
    <div class="theme-switch" role="group" aria-label="地图主题"><button :class="{active:theme==='facility'}" @click="setTheme('facility')">设施分布</button><button :class="{active:theme==='monitoring'}" @click="setTheme('monitoring')">监测态势</button></div>
    <button class="base-toggle" @click="setFilters">清除筛选</button>
    <button class="base-toggle" @click="toggleMapExtent">{{showFullCity?'回到中心':'复位全图'}}</button>
    <button class="fullscreen-action wx-fullscreen-action" :aria-pressed="fullscreen" @click="toggleFullscreen"><span aria-hidden="true">⛶</span><span>{{fullscreen?'退出全屏':'全屏'}}</span></button>
   </div>
  </header>
  <div class="gis-body" :class="{'layers-expanded':layersOpen,'detail-expanded':detailOpen&&selectedEntity}">
    <aside class="map-layer-panel" :class="{closed:!layersOpen}" @mouseenter="cancelPanelTimer('layers')" @mouseleave="leavePanel('layers')" @focusin="cancelPanelTimer('layers')">
     <div v-if="layersOpen" class="gis-panel-tools"><b><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 9 5-9 5-9-5Zm-9 9 9 5 9-5m-18 5 9 5 9-5"/></svg>图层与设施</b><button :class="{active:layersPinned}" :aria-pressed="layersPinned" aria-label="固定图层与设施" @click="layersPinned=!layersPinned">{{layersPinned?'已固定':'固定'}}</button><button aria-label="收起图层与设施" @click="layersOpen=false">‹ 收起</button></div>
     <button v-else class="gis-panel-orb layer-orb" aria-label="展开图层与设施" @click="layersOpen=true"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 9 5-9 5-9-5Zm-9 9 9 5 9-5m-18 5 9 5 9-5"/></svg></button>
     <template v-if="layersOpen">
      <p class="panel-kicker">地图对象 · 固定数量</p>
      <div v-for="entry in layerEntries" :key="entry.id" class="layer-group">
       <div class="layer-choice"><input v-model="viewState.layers[entry.id]" :aria-label="`显示${entry.name}`" type="checkbox"><button :aria-expanded="!!expandedTypes[entry.id]" @click="expandedTypes[entry.id]=!expandedTypes[entry.id]">{{expandedTypes[entry.id]?'▾':'▸'}} {{entry.name}}</button><small>{{entry.count}}</small></div>
       <div v-if="expandedTypes[entry.id]" class="layer-children"><button v-for="item in layerItems(entry.id)" :key="item.id" :class="{chosen:selectedId===item.id}" @click="focusLayerItem(item,entry.id)"><span>{{item.name}}</span><small>{{item.id}}</small></button><p v-if="!layerItems(entry.id).length">当前筛选无匹配设施</p></div>
      </div>
      <div class="layer-note">数量固定；筛选和图层显隐不会改动全区总量。</div>
     </template>
    </aside>
   <div class="map-canvas-wrap">
    <div ref="mapHost" class="map-canvas" aria-label="可平移和缩放的二维设施地图"></div>
    <div ref="selectionBox" class="selection-rectangle" aria-hidden="true"></div>
    <button v-if="selectedEntity&&!detailOpen" class="gis-panel-orb detail-orb" aria-label="展开对象详情" @click="detailOpen=true"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M13 13h3v12M12 25h8M16 6v.1"/></svg></button>
    <div class="map-status"><i :class="baseMode==='osm'?'online':'local'"></i>{{mapStatus}}<span> · 设施与测点</span></div>
    <div v-if="mode!=='none'||measureText" class="measure-result"><b>{{mode==='box'?'框选':mode==='circle'?'圈选':mode==='distance'?'距离量算':'面积量算'}}</b><span>{{measureText||({box:'按住并拖动框选地图对象',circle:circleCenter?'再点地图确定圈选半径':'点击地图设置圆心，再点确定半径',distance:'依次点击地图上的距离节点',area:'依次点击边界点，双击或回到起点闭合'} as Record<string,string>)[mode]}}</span><small v-if="selectedIds.length">已选 {{selectedIds.length}} 项</small></div>
    <div v-if="theme==='monitoring'" class="quality-legend"><b>{{metricCatalog[metric]?.label}}状态</b><span><i class="q-normal"></i>正常</span><span><i class="q-stale"></i>超时</span><span><i class="q-offline"></i>中断</span><span><i class="q-missing"></i>未配置</span><span><i class="q-zero"></i>有效 0</span></div>
    <div class="scope-note">演示数据 · 未接入现场信号</div>
    <div v-if="theme==='monitoring'" class="scenario-bar"><label>演示情景<select v-model="scenario"><option value="normal">日常采样</option><option value="inflow-rise">来水变化</option><option value="pump-cycle">泵站周期输送</option><option value="partial-outage">局部信号中断</option></select></label><span>模拟时刻 {{sampleClock}} · 每30秒推进5分钟</span></div>
   </div>
   <aside v-if="detailOpen&&selectedEntity" class="detail-panel" aria-label="对象详情" @mouseenter="cancelPanelTimer('detail')" @mouseleave="leavePanel('detail')" @focusin="cancelPanelTimer('detail')">
    <div class="gis-panel-tools"><b><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.1"/></svg>对象详情</b><button :class="{active:detailPinned}" :aria-pressed="detailPinned" aria-label="固定对象详情" @click="detailPinned=!detailPinned">{{detailPinned?'已固定':'固定'}}</button><button aria-label="收起对象详情" @click="detailOpen=false">收起 ›</button></div>
    <header class="detail-head"><div><span class="type-tag">{{displayType(selectedEntity.type)}}</span><h2>{{selectedEntity.name}}<button v-if="selectedEntity.id==='WWTP-01'" class="twin-name-link" aria-label="进入数字孪生" title="进入数字孪生" @click="openTwin()"><svg aria-hidden="true"><use :href="'/waterx-nav-icons.svg?v=20261008-v11#digital-twin'"/></svg></button></h2><p>{{selectedEntity.id}}　·　{{selectedEntity.properties.districtName||'未关联片区'}}</p></div></header>
    <WxTabs class="detail-tabs" aria-label="对象资料"><button :class="{active:activeTab==='signals'}" @click="activeTab='signals'">监测信号</button><button :class="{active:activeTab==='basic'}" @click="activeTab='basic'">基本信息</button><button :class="{active:activeTab==='materials'}" @click="activeTab='materials'">关联资料</button></WxTabs>
    <div v-if="activeTab==='basic'" class="detail-content"><div v-for="[label,value] in detailFields" :key="label" class="detail-field"><span>{{label}}</span><b>{{value||'—'}}</b></div><div class="asset-caution">以上为展示用假设数据，不代表现场核实、工程测绘或实际管网关系。</div></div>
    <div v-else-if="activeTab==='signals'" class="detail-content signal-detail">
     <template v-if="signalEntity&&availableMetrics.length">
      <div class="reading-list"><button v-for="row in signalRows" :key="row.key" class="reading-card" :class="{active:activeMetric===row.key}" @click="setMetric(row.key)"><span>{{row.label}}</span><b>{{row.value===null?'—':row.value}} <small>{{row.unit}}</small></b><em :class="row.quality">{{metricStatusText(row.quality)}}</em></button></div>
      <div class="sample-meta"><span>模拟时刻 {{sampleClock}}</span><span>采样周期 5 分钟</span><span>来源 本地固定演示</span><span>口径 {{metricCatalog[activeMetric]?.basis}}</span></div>
      <div class="trend-head"><b>{{metricCatalog[activeMetric]?.label}}趋势</b><span>最近 {{rangeHours}} 小时 · 质量缺口留空</span></div>
      <div class="range-tabs"><button v-for="hours in [1,6,24]" :key="hours" :class="{active:rangeHours===hours}" @click="setRange(hours)">{{hours}} 小时</button></div>
      <div class="chart-wrap"><svg v-if="chartPaths.length" viewBox="0 0 600 160" role="img" :aria-label="`${metricCatalog[activeMetric]?.label}最近${rangeHours}小时固定演示趋势`" @mousemove="handleChartMove" @mouseleave="handleChartLeave"><path v-for="y in [24,64,104,144]" :key="y" :d="`M42 ${y}H580`" class="chart-grid"/><path v-for="seriesLine in chartPaths" :key="seriesLine.id" :d="seriesLine.d" :stroke="seriesLine.color" class="chart-line"/><line v-if="hoverIndex!==null" :x1="chartPaths[0]?.points[hoverIndex]?.x||42" y1="12" :x2="chartPaths[0]?.points[hoverIndex]?.x||42" y2="140" class="chart-cursor"/><template v-for="seriesLine in chartPaths" :key="`hover-${seriesLine.id}`"><circle v-if="hoverIndex!==null&&seriesLine.points[hoverIndex]?.sample.value!==null" :cx="seriesLine.points[hoverIndex]?.x" :cy="seriesLine.points[hoverIndex]?.y" r="4" :fill="seriesLine.color" class="chart-point"/></template><text x="42" y="158">{{chartPaths[0]?.samples[0]?.time.slice(11)}}</text><text x="510" y="158">{{chartPaths[0]?.samples.at(-1)?.time.slice(11)}}</text></svg><div v-else class="chart-empty">没有可展示的连续趋势</div></div>
      <div v-if="hoveredSamples.length" class="chart-tooltip"><b>{{hoveredSamples[0].sample?.time}}</b><span v-for="sample in hoveredSamples" :key="sample.id" :style="{color:sample.color}">{{sample.name}}：{{sample.sample?.value??'—'}} {{metricCatalog[activeMetric]?.unit}}</span></div>
      <div class="compare-block"><div class="compare-title"><b>同口径对比</b><small>最多比较3个测点（含当前）</small></div><div class="compare-options"><label v-for="candidate in comparisonCandidates.slice(0,12)" :key="candidate.id"><input type="checkbox" :checked="compareIds.includes(candidate.id)" :disabled="!compareIds.includes(candidate.id)&&compareIds.length>=2" @change="toggleComparison(candidate.id,$event)"><span>{{candidate.name}}</span></label><p v-if="!comparisonCandidates.length">暂无同指标、同单位和同基准的可比测点。</p></div></div>
      <div class="status-definitions"><span><i class="q-normal"></i>正常采样</span><span><i class="q-stale"></i>超时未更新</span><span><i class="q-offline"></i>信号中断</span><span><i class="q-missing"></i>未配置</span><span><i class="q-zero"></i>有效数值0</span></div>
     </template><div v-else class="chart-empty">该对象没有配置监测点；缺失值不补零。</div>
    </div>
    <div v-else class="detail-content materials-content"><h3>关联资料</h3><p class="materials-note">本页展示两份本地样例资料，不包含真实联系人或现场档案。</p><article v-for="doc in getDocs(selectedEntity)" :key="doc.title" class="document-card"><div><b>{{doc.title}}</b><small>{{doc.kind}} · {{doc.date}}</small></div><button @click="openDocument(doc.title,doc.body)">查看内容</button></article><article v-if="documentText" class="document-view"><h4>{{documentTitle}}</h4><pre>{{documentText}}</pre></article><p class="no-real-docs">真实资料接入后，应在此展示经授权的档案来源与更新时间。</p></div>
   </aside>
  </div>
 </section>
</template>
