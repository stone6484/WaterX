import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createPersonnel} from './personnel.js';
import {siteRouting as routing} from './site-routing.js';
const data=JSON.parse(fs.readFileSync(new URL('./case-data.json',import.meta.url)));
const key='waterx:twin:demo:v1:siteA:userA:personnel';
function boot(raw=null,fail=false,k=key,shared=new Map()){
  if(raw!==null)shared.set(k,raw);
  const storage={getItem:id=>shared.get(id)||null,setItem:(id,v)=>{if(fail)throw Error('denied');shared.set(id,v)}};
  return {p:createPersonnel(data,k,storage),mem:shared,storage};
}
let checks=0;function check(name,f){f();checks++;console.log('PASS '+name)}
const {p,mem}=boot();
check('12 unique people and 9 roles',()=>{assert.equal(p.people.length,12);assert.equal(new Set(p.people.map(p=>p.roleId)).size,9);assert.equal(new Set(p.people.map(p=>p.id)).size,12)});
check('11 placements; remote administrator has no invented position',()=>{assert.equal(p.people.filter(p=>p.onSite).length,11);assert.equal(p.people.find(p=>p.roleId==='admin').x,null)});
check('avatars are outside roads and facility interiors',()=>{for(const person of p.people.filter(p=>p.onSite)){for(const r of routing.roads)assert.ok(!routing.interval([person.x,0,person.z],[person.x,0,person.z],r,.35));for(const f of data.facilities){const inside=['clarifier','sludgetank'].includes(f.kind)?Math.hypot(person.x-f.x,person.z-f.z)<f.w/2+.3:Math.abs(person.x-f.x)<f.w/2+.3&&Math.abs(person.z-f.z)<f.d/2+.3;assert.ok(!inside,person.id+' in '+f.id)}}});
check('seed ownership uses stable IDs, with pending and done records',()=>{for(const person of p.people){assert.ok(p.pending(person.id).length);assert.ok(p.tasksFor(person.id).every(t=>t.ownerId===person.id));assert.ok(p.tasksFor(person.id).some(t=>t.state==='已完成'))}});
const input={ownerId:'PERSON-fix',kind:'工作工单',title:'核验风机记录',object:'BL-02',deadline:'2026-09-19 09:00',createdAt:'2026-09-19 08:00',note:'本地示例'};
check('assignment persists for correct recipient',()=>{p.createTask(input);assert.equal(p.pending('PERSON-fix').length,3);assert.equal(p.pending('PERSON-op1').length,1);assert.equal(boot(null,false,key,mem).p.pending('PERSON-fix').length,3)});
check('invalid recipient, object, title, kind and deadline rejected',()=>{for(const delta of [{ownerId:'missing'},{ownerId:'PERSON-admin'},{object:'fake'},{title:' '},{kind:'control'},{deadline:'2026-09-19 07:00'},{deadline:'2026-09-19 24:00'},{deadline:'2026-09-19 09:70'}])assert.throws(()=>p.createTask({...input,...delta}));assert.equal(p.pending('PERSON-fix').length,3)});
check('failed storage does not dispatch',()=>{const q=boot(null,true).p;assert.throws(()=>q.createTask(input),/保存失败/);assert.equal(q.pending('PERSON-fix').length,2)});
check('corrupt storage is retained, not overwritten',()=>{const q=boot('{bad');assert.throws(()=>q.p.createTask(input),/读取失败/);assert.equal(q.mem.get(key),'{bad')});
check('project, user and mode namespaces are isolated',()=>{for(const other of ['waterx:twin:demo:v1:siteB:userA:personnel','waterx:twin:demo:v1:siteA:userB:personnel','waterx:twin:other:v1:siteA:userA:personnel'])assert.equal(boot(null,false,other,mem).p.pending('PERSON-fix').length,2)});
check('same names do not merge identities, instances do not share mutable people',()=>{p.people.find(p=>p.id==='PERSON-op1').name=p.people.find(p=>p.id==='PERSON-fix').name;assert.equal(p.pending('PERSON-op1').length,1);assert.notEqual(boot().p.people.find(p=>p.id==='PERSON-op1').name,p.people.find(p=>p.id==='PERSON-op1').name)});
check('blocked storage read is contained',()=>{const q=createPersonnel(data,key,{getItem(){throw Error('denied')},setItem(){throw Error('must not write')}});assert.equal(q.people.length,12);assert.throws(()=>q.createTask(input),/读取失败/)});
check('bad persisted deadline and object are rejected without deleting data',()=>{for(const delta of [{deadline:'2026-09-19 25:00'},{object:'missing'}]){const raw=JSON.stringify([{...input,id:'LOCAL-example',state:'待接单',...delta}]);const q=boot(raw);assert.throws(()=>q.p.createTask(input),/读取失败/);assert.equal(q.mem.get(key),raw)}});
console.log(checks+' personnel integration checks passed');
