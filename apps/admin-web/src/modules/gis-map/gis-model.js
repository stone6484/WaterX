import {items} from './data.js'
import {signalQualityFor} from './signals.js'

export const TYPES=['plant','pump','gate','pipe','node','monitor','district']
const inside=(p,b)=>p[0]>=b[0]&&p[0]<=b[2]&&p[1]>=b[1]&&p[1]<=b[3]
const orient=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])
function segmentsIntersect(a,b,c,d){const o1=orient(a,b,c),o2=orient(a,b,d),o3=orient(c,d,a),o4=orient(c,d,b);return Math.max(a[0],b[0])>=Math.min(c[0],d[0])&&Math.max(c[0],d[0])>=Math.min(a[0],b[0])&&Math.max(a[1],b[1])>=Math.min(c[1],d[1])&&Math.max(c[1],d[1])>=Math.min(a[1],b[1])&&o1*o2<=0&&o3*o4<=0}
export function geometryIntersectsBounds(geometry,bounds){
 if(geometry.type==='Point')return inside(geometry.coordinates,bounds)
 const lines=geometry.type==='LineString'?[geometry.coordinates]:geometry.coordinates
 for(const line of lines){if(line.some(p=>inside(p,bounds)))return true;const corners=[[bounds[0],bounds[1]],[bounds[2],bounds[1]],[bounds[2],bounds[3]],[bounds[0],bounds[3]]];for(let i=1;i<line.length;i++)for(let j=0;j<4;j++)if(segmentsIntersect(line[i-1],line[i],corners[j],corners[(j+1)%4]))return true}
 return false
}
export function distanceKm(a,b){const R=6371,toRad=n=>n*Math.PI/180,dl=toRad(b[0]-a[0]),dp=toRad(b[1]-a[1]),s=Math.sin(dp/2)**2+Math.cos(toRad(a[1]))*Math.cos(toRad(b[1]))*Math.sin(dl/2)**2;return 2*R*Math.asin(Math.sqrt(Math.min(1,s)))}
export function pathDistanceKm(points){return points.slice(1).reduce((sum,p,i)=>sum+distanceKm(points[i],p),0)}
export function polygonAreaKm2(points){if(points.length<3)return 0;const R=6371,rad=n=>n*Math.PI/180,ring=[...points,points[0]];let sum=0;for(let i=0;i<ring.length-1;i++){const [lon1,lat1]=ring[i],[lon2,lat2]=ring[i+1];sum+=rad(lon2-lon1)*(2+Math.sin(rad(lat1))+Math.sin(rad(lat2)))}return Math.abs(sum*R*R/2)}
const pointSegmentKm=(p,a,b)=>{const cos=Math.cos(p[1]*Math.PI/180),xy=q=>[(q[0]-p[0])*111.32*cos,(q[1]-p[1])*110.574],P=[0,0],A=xy(a),B=xy(b),dx=B[0]-A[0],dy=B[1]-A[1],t=Math.max(0,Math.min(1,((P[0]-A[0])*dx+(P[1]-A[1])*dy)/(dx*dx+dy*dy||1))),x=A[0]+t*dx,y=A[1]+t*dy;return Math.hypot(x,y)}
export function geometryIntersectsCircle(geometry,center,radiusKm){if(geometry.type==='Point')return distanceKm(center,geometry.coordinates)<=radiusKm;const lines=geometry.type==='LineString'?[geometry.coordinates]:geometry.coordinates;for(const line of lines){if(line.some(p=>distanceKm(center,p)<=radiusKm))return true;for(let i=1;i<line.length;i++)if(pointSegmentKm(center,line[i-1],line[i])<=radiusKm)return true}return false}
export function filterEntities({query='',type='all',district='all',maintainer='all',quality='all',currentExtent=false,bounds=null,entities=items}){
 const q=query.trim().toLocaleLowerCase()
 return entities.filter(item=>{
  const p=item.properties||{},text=`${item.id} ${item.name} ${p.districtName||''}`.toLocaleLowerCase()
  if(q&&!text.includes(q))return false
  if(type!=='all'&&item.type!==type)return false
  if(district!=='all'&&p.districtId!==district)return false
  if(maintainer!=='all'&&p.maintainer!==maintainer)return false
  if(quality!=='all'&&signalQualityFor(item.feature)!==quality)return false
  if(currentExtent&&bounds&&!geometryIntersectsBounds(item.feature.geometry,bounds))return false
  return true
 })
}
export function selectInBounds(bounds,entities=items){return entities.filter(item=>geometryIntersectsBounds(item.feature.geometry,bounds)).map(item=>item.id)}
export function selectInCircle(center,radiusKm,entities=items){return entities.filter(item=>geometryIntersectsCircle(item.feature.geometry,center,radiusKm)).map(item=>item.id)}
export function getEntity(id){return items.find(item=>item.id===id)||null}
export function selectedCounts(ids){const counts={plant:0,pump:0,gate:0,pipe:0,node:0,monitor:0,district:0};for(const id of ids){const item=getEntity(id);if(item&&counts[item.type]!==undefined)counts[item.type]++}return counts}
export function circlePolygon(center,radiusKm){const coords=[];for(let i=0;i<64;i++){const angle=2*Math.PI*i/64,bearing=angle,R=6371,lat1=center[1]*Math.PI/180,lon1=center[0]*Math.PI/180,d=radiusKm/R,lat2=Math.asin(Math.sin(lat1)*Math.cos(d)+Math.cos(lat1)*Math.sin(d)*Math.cos(bearing)),lon2=lon1+Math.atan2(Math.sin(bearing)*Math.sin(d)*Math.cos(lat1),Math.cos(d)-Math.sin(lat1)*Math.sin(lat2));coords.push([lon2*180/Math.PI,lat2*180/Math.PI])}coords.push(coords[0]);return coords}
