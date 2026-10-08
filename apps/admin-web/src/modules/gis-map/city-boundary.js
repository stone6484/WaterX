// Public DataV boundary is a visual scope, not a survey or an asset-position authority.
export function boundaryBounds(feature) {
 const points=feature.geometry.coordinates.flat(2)
 return [[Math.min(...points.map(p=>p[0])),Math.min(...points.map(p=>p[1]))],[Math.max(...points.map(p=>p[0])),Math.max(...points.map(p=>p[1]))]]
}
function inRing(point,ring) {
 let inside=false
 for(let i=0,j=ring.length-1;i<ring.length;j=i++){
  const a=ring[i],b=ring[j]
  if((a[1]>point[1])!==(b[1]>point[1])&&point[0]<(b[0]-a[0])*(point[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside
 }
 return inside
}
export function inCity(point,feature) {
 return feature.geometry.coordinates.some(rings=>inRing(point,rings[0])&&!rings.slice(1).some(ring=>inRing(point,ring)))
}
export function outsideCityMask(feature) {
 const world=[[-180,-85],[180,-85],[180,85],[-180,85],[-180,-85]]
 const features=[{type:'Feature',properties:{},geometry:{type:'Polygon',coordinates:[world,...feature.geometry.coordinates.map(rings=>rings[0])]}}]
 for(const rings of feature.geometry.coordinates)for(const hole of rings.slice(1))features.push({type:'Feature',properties:{},geometry:{type:'Polygon',coordinates:[hole]}})
 return {type:'FeatureCollection',features}
}
