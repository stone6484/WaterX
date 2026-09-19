import assert from 'node:assert/strict'
import {D,createSimulation} from './simulation.js'
const entities=new Set([...D.facilities,...D.equipment].map(x=>x.id))
assert.equal(D.facilities.length,25);assert.equal(D.equipment.length,96)
assert.equal(D.signals.length,547);assert.equal(D.pipes.length,45)
assert.equal(entities.size,121);assert.equal(new Set(D.signals.map(s=>s.id)).size,547)
for(const e of D.equipment)assert.ok(D.facilities.some(f=>f.id===e.parent))
for(const s of D.signals)assert.ok(entities.has(s.owner),s.id)
for(const p of D.pipes){assert.ok(entities.has(p.start));assert.ok(entities.has(p.end))}
assert.equal(D.route.length,7)
for(const stop of D.route){assert.ok(entities.has(stop.object));assert.equal(stop.checks.length,3)}
const a=createSimulation(),b=createSimulation(),signal=id=>D.signals.find(s=>s.id===id)
const counts={alerts:4,normal:0,fault:1,offline:1,temperature:1,gas:1}
let checks=0
for(const [scenario,count] of Object.entries(counts)){
 a.setScenario(scenario)
 for(let tick=0;tick<=24;tick++){
  a.setTick(tick);assert.equal(a.activeRisks().length,count)
  for(const s of D.signals){const value=a.signalValue(s);assert.ok(value===null||Number.isFinite(value),s.id)}
  for(const risk of a.activeRisks()){assert.ok(risk.test(a.signalValue(signal(risk.signal))));assert.ok(a.riskValue(risk))}
  assert.equal(a.signalValue(signal('DO-01.VALUE'))===null,scenario==='alerts'||scenario==='offline')
  if(scenario==='alerts'||scenario==='fault'){
   for(const tag of ['RUN','CURRENT','FREQ'])assert.equal(a.signalValue(signal('BL-02.'+tag)),0)
   assert.equal(a.signalValue(signal('BL-02.FAULT')),1)
  }
  checks++
 }
}
a.setScenario('normal');a.setTick(24)
assert.equal(a.currentTime(),'2026-09-19 14:00')
assert.equal(b.currentTime(),'2026-09-19 08:00');assert.equal(b.activeRisks().length,4)
assert.throws(()=>a.setTick(-1));assert.throws(()=>a.setTick(25));assert.throws(()=>a.setScenario('unknown'))
console.log(`PASS 数字孪生对象拓扑、${checks}个情景/回放组合、缺失与零值、实例隔离`)
