/* Axis-aligned site surfaces. Curbs follow the UNION boundary, never road seams. */

 'use strict';
 const bounds=([x,z,w,d],m=0)=>[x-w/2-m,z-d/2-m,x+w/2+m,z+d/2+m];
 const contains=(r,x,z)=>x>r[0]+1e-7&&x<r[2]-1e-7&&z>r[1]+1e-7&&z<r[3]-1e-7;
 function subtract(rect,obstacles){let pieces=[bounds(rect)];for(const obstacle of obstacles){const b=bounds(obstacle);pieces=pieces.flatMap(a=>{const x=Math.max(a[0],b[0]),z=Math.max(a[1],b[1]),X=Math.min(a[2],b[2]),Z=Math.min(a[3],b[3]);if(X<=x||Z<=z)return [a];return [[a[0],a[1],x,a[3]],[X,a[1],a[2],a[3]],[x,a[1],X,z],[x,Z,X,a[3]]].filter(p=>p[2]-p[0]>1e-6&&p[3]-p[1]>1e-6);});}return pieces.map(a=>[(a[0]+a[2])/2,(a[1]+a[3])/2,a[2]-a[0],a[3]-a[1]]);}
 function layout(roads){
  const rs=roads.map(r=>bounds(r)),xs=[...new Set(rs.flatMap(r=>[r[0],r[2]]))].sort((a,b)=>a-b),zs=[...new Set(rs.flatMap(r=>[r[1],r[3]]))].sort((a,b)=>a-b);
  const cells=zs.slice(1).map((z,j)=>xs.slice(1).map((x,i)=>rs.some(r=>contains(r,(x+xs[i])/2,(z+zs[j])/2))));
  const tiles=[],edges=[];const inside=(i,j)=>!!cells[j]?.[i];
  for(let j=0;j<zs.length-1;j++)for(let i=0;i<xs.length-1;i++){if(!inside(i,j))continue;const x=xs[i],X=xs[i+1],z=zs[j],Z=zs[j+1];tiles.push([(x+X)/2,(z+Z)/2,X-x,Z-z]);if(!inside(i-1,j))edges.push([x-.18,(z+Z)/2,.35,Z-z]);if(!inside(i+1,j))edges.push([X+.18,(z+Z)/2,.35,Z-z]);if(!inside(i,j-1))edges.push([(x+X)/2,z-.18,X-x,.35]);if(!inside(i,j+1))edges.push([(x+X)/2,Z+.18,X-x,.35]);}
  const curbs=edges.flatMap(r=>subtract(r,roads));
  const markings=[];roads.forEach((r,index)=>{const [x,z,w,d]=r,along=w>d,len=Math.max(w,d);for(let t=-len/2+5;t<len/2-3;t+=9){const mark=[x+(along?t:0),z+(along?0:t),along?3.5:.11,along?.11:3.5];const intersections=roads.filter((other,k)=>k!==index&&(other[2]>other[3])!==along).map(([a,b,c,d])=>[a,b,c+2,d+2]);markings.push(...subtract(mark,intersections));}});
  return {tiles,curbs,markings};
 }
 const api={bounds,contains,subtract,layout};


export const WaterXSiteGeometry=api;
