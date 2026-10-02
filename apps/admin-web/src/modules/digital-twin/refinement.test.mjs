import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {WaterXSiteGeometry as geometry} from './site-geometry.js';
import {WaterXSiteRouting as routing} from './site-routing.js';
const data=JSON.parse(fs.readFileSync(new URL('./case-data.json',import.meta.url)));
const overlap=(a,b)=>{a=geometry.bounds(a);b=geometry.bounds(b);return Math.min(a[2],b[2])-Math.max(a[0],b[0])>1e-6&&Math.min(a[3],b[3])-Math.max(a[1],b[1])>1e-6;};
test('T junction curbs never cross a carriageway; union surface has no overlapping tiles',()=>{
 const roads=[[0,0,40,8],[0,14,8,28]],{tiles,curbs}=geometry.layout(roads);
 assert(curbs.length);for(const curb of curbs)assert(!roads.some(r=>overlap(r,curb)));
 assert.equal(tiles.reduce((area,r)=>area+r[2]*r[3],0),40*8+8*28-8*4);
 for(let i=0;i<tiles.length;i++)for(let j=i+1;j<tiles.length;j++)assert(!overlap(tiles[i],tiles[j]));
});
test('all site curbs and facility structural footprints clear the roads',()=>{
 const {curbs}=geometry.layout(routing.roads);for(const curb of curbs)assert(!routing.roads.some(r=>overlap(r,curb)));
 for(const f of data.facilities.filter(f=>!['clarifier','sludgetank'].includes(f.kind)))assert(!routing.roads.some(r=>overlap([f.x,f.z,f.w+1,f.d+1],r)),f.id);
});
test('every service road connects into the same road network',()=>{
 const visited=new Set([0]),queue=[0];while(queue.length){const i=queue.shift();routing.roads.forEach((r,j)=>{if(!visited.has(j)&&overlap(r,routing.roads[i])){visited.add(j);queue.push(j);}});}assert.equal(visited.size,routing.roads.length);
});
test('pipe crowns cross roads below ground, including new service entrance',()=>{
 for(const original of data.pipes){const p=routing.reroute(original);for(let i=1;i<p.points.length;i++){const a=p.points[i-1],b=p.points[i];for(const r of routing.roads){const cut=routing.interval(a,b,r,.3);if(cut&&cut[1]-cut[0]>.0001)assert(Math.max(a[1],b[1])+routing.radius(p)<0,p.id);}}}
});
test('service paving subtraction preserves area without encroachment',()=>{
 const pieces=geometry.subtract([0,0,20,10],[[0,0,4,20]]);assert.equal(pieces.reduce((a,r)=>a+r[2]*r[3],0),160);assert(pieces.every(r=>!overlap(r,[0,0,4,20])));
});
