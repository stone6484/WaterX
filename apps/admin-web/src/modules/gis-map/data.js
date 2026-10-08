// Spatially coherent demonstration fixture centered on an approximate Qing Shan Lake example point.
// Nothing in this module represents surveyed or connected customer assets.
export const CENTER=[119.755,30.252]
const km=(east,north)=>[CENTER[0]+east/(111.32*Math.cos(CENTER[1]*Math.PI/180)),CENTER[1]+north/110.574]
const feature=(id,type,name,coords,props={})=>({type:'Feature',id,geometry:{type:'Point',coordinates:coords},properties:{id,type,name,...props}})
const districts=[
 {id:'district-north',name:'北部片区',east:-8,north:8},
 {id:'district-west',name:'西部片区',east:-8,north:-7},
 {id:'district-east',name:'东部片区',east:8,north:-6},
 {id:'district-south',name:'南部片区',east:8,north:8}
].map((d,index)=>{const [lng,lat]=km(d.east,d.north),dx=2.2/(111.32*Math.cos(lat*Math.PI/180)),dy=2.2/110.574;return {...d,index,center:[lng,lat],geometry:{type:'Polygon',coordinates:[[[lng-dx,lat-dy],[lng+dx,lat-dy],[lng+dx,lat+dy],[lng-dx,lat+dy],[lng-dx,lat-dy]]]}}})

const plants=[
 ['WWTP-01','青山湖中心水厂',-13,-4,'district-west'],
 ['WWTP-02','北部水厂',-5,14,'district-north'],
 ['WWTP-03','东部水厂',14,-7,'district-east'],
 ['WWTP-04','南部水厂',8,13,'district-south']
].map(([id,name,east,north,districtId],i)=>feature(id,'plant',name,km(east,north),{districtId,districtName:districts.find(d=>d.id===districtId).name,maintainer:['运营一组','运营二组'][i%2],params:{capacity:`${[5,2,1.5,1.2][i]} 万 m³/d`,process:['A²/O','AAO+MBR','氧化沟','A²/O'][i]},demo:true}))

const pumps=Array.from({length:18},(_,i)=>{const angle=(i*137.507)*Math.PI/180,radius=4.2+(i%6)*2.1,east=Math.cos(angle)*radius,north=Math.sin(angle)*radius;const d=districts.reduce((best,x)=>Math.hypot(x.east-east,x.north-north)<Math.hypot(best.east-east,best.north-north)?x:best,districts[0]);return feature(`PS-${String(i+1).padStart(3,'0')}`, 'pump',`${['滨湖','城西','科技园','北片区','南河','河东'][i%6]}提升泵站 ${String(i+1).padStart(2,'0')}`,km(east,north),{districtId:d.id,districtName:d.name,maintainer:i%2?'管网一组':'管网二组',params:{capacity:`${(0.5+(i%5)*.2).toFixed(1)} 万 m³/d`,equipment:'潜污泵 3 台'},demo:true})})

const gates=Array.from({length:6},(_,i)=>{const angle=(i*58-125)*Math.PI/180,east=Math.cos(angle)*(11+i%2*2),north=Math.sin(angle)*(11+i%2*2),d=districts[i%4];return feature(`GS-${String(i+1).padStart(3,'0')}`,'gate',`${['滨湖','东河','南河','城西','北河','南苑'][i]}水系闸站`,km(east,north),{districtId:d.id,districtName:d.name,maintainer:'水系管理组',params:{gates:`${i%2?2:3} 孔`,waterway:'片区河道（示意）'},demo:true})})

const nodes=[]
for(const d of districts){
 for(let row=0;row<4;row++)for(let col=0;col<5;col++){
   const east=d.east+(col-2)*.48,north=d.north+(row-1.5)*.48
   nodes.push(feature(`MH-${String(d.index+1).padStart(2,'0')}-${String(row*5+col+1).padStart(2,'0')}`,'node',`检查井 ${d.index+1}-${row*5+col+1}`,km(east,north),{districtId:d.id,districtName:d.name,depth:`${(2.4+((row+col)%5)*.35).toFixed(1)} m`,demo:true}))
 }
}

const pipes=[]
for(const d of districts){
 const base=d.index*20,edges=[]
 for(let row=0;row<3;row++)for(let col=0;col<4;col++)edges.push([row*5+col,row*5+col+1])
 for(let row=0;row<3;row++)edges.push([row*5,row*5+5])
 for(let n=0;n<15;n++){
   const [a,b]=edges[n],from=nodes[base+a],to=nodes[base+b],coords=[from.geometry.coordinates,km((from.geometry.coordinates[0]-CENTER[0])*(111.32*Math.cos(CENTER[1]*Math.PI/180))+.01,(from.geometry.coordinates[1]-CENTER[1])*110.574+.025),to.geometry.coordinates]
   pipes.push({type:'Feature',id:`WW-${String(pipes.length+1).padStart(3,'0')}`,geometry:{type:'LineString',coordinates:coords},properties:{id:`WW-${String(pipes.length+1).padStart(3,'0')}`,type:'pipe',name:`${d.name.replace('片区','')}管段 ${String(n+1).padStart(2,'0')}`,districtId:d.id,districtName:d.name,fromNodeId:from.properties.id,toNodeId:to.properties.id,diameter:`DN${[400,600,800][(n+d.index)%3]}`,material:['球墨铸铁','HDPE','钢管'][n%3],flowDirection:'方向',maintainer:'管网运维组',demo:true}})
 }
}

const monitorAssets=[...plants,...pumps,...gates]
const monitors=monitorAssets.map((asset,i)=>({type:'Feature',id:`MP-${String(i+1).padStart(3,'0')}`,geometry:asset.geometry,properties:{id:`MP-${String(i+1).padStart(3,'0')}`,type:'monitor',name:`${asset.properties.name.replace('','')}测点`,assetId:asset.id,assetType:asset.properties.type,districtId:asset.properties.districtId,districtName:asset.properties.districtName,maintainer:asset.properties.maintainer,demo:true}}))
for(let i=0;i<2;i++){const p=pipes[i*11+6],coords=p.geometry.coordinates[1];monitors.push({type:'Feature',id:`MP-${String(monitors.length+1).padStart(3,'0')}`,geometry:{type:'Point',coordinates:coords},properties:{id:`MP-${String(monitors.length+1).padStart(3,'0')}`,type:'monitor',name:`${p.properties.name}监测点`,assetId:p.id,assetType:'pipe',districtId:p.properties.districtId,districtName:p.properties.districtName,maintainer:p.properties.maintainer,demo:true}})}

const allAssets=[...plants,...pumps,...gates]
const allEntities=[...allAssets,...pipes,...nodes,...monitors]
const byId=new Map(allEntities.map(item=>[item.properties.id,item]))
const fallbackRoads=[]
for(let i=-18;i<=18;i+=3){const eastId=`road-e-${i}`,northId=`road-n-${i}`;fallbackRoads.push({type:'Feature',id:eastId,geometry:{type:'LineString',coordinates:[km(i,-19),km(i,19)]},properties:{id:eastId,kind:'local-road'}});fallbackRoads.push({type:'Feature',id:northId,geometry:{type:'LineString',coordinates:[km(-19,i),km(19,i)]},properties:{id:northId,kind:'local-road'}})}

export const FEATURE_COUNTS={plants:plants.length,pumps:pumps.length,gates:gates.length,pipes:pipes.length,nodes:nodes.length,monitors:monitors.length,districts:districts.length}
export const featureCollections={plants:{type:'FeatureCollection',features:plants},pumps:{type:'FeatureCollection',features:pumps},gates:{type:'FeatureCollection',features:gates},assets:{type:'FeatureCollection',features:allAssets},pipes:{type:'FeatureCollection',features:pipes},nodes:{type:'FeatureCollection',features:nodes},monitors:{type:'FeatureCollection',features:monitors},districts:{type:'FeatureCollection',features:districts.map(d=>({type:'Feature',id:d.id,geometry:d.geometry,properties:{id:d.id,type:'district',name:d.name,districtId:d.id,districtName:d.name,demo:true}}))},fallbackRoads:{type:'FeatureCollection',features:fallbackRoads}}
export const items=allEntities.map(f=>({id:f.properties.id,name:f.properties.name,type:f.properties.type,coords:f.geometry.type==='Point'?f.geometry.coordinates:f.geometry.coordinates[0],properties:f.properties,feature:f}))
export const points=items.filter(x=>x.feature.geometry.type==='Point')
export const pipesList=pipes.map(f=>({id:f.properties.id,name:f.properties.name,type:'pipe',coords:f.geometry.coordinates,properties:f.properties,feature:f}))
export const monitorsList=monitors.map(f=>({id:f.properties.id,name:f.properties.name,type:'monitor',coords:f.geometry.coordinates,properties:f.properties,feature:f}))
export const districtsList=districts
const itemById=new Map(items.map(item=>[item.id,item]))
export const getItem=id=>itemById.get(id)||null
