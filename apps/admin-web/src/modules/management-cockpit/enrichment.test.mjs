import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {exBoards, exPanel, exDetailRows, getDetail} from './enrichment.js'
import {createDemoRenderer, topics} from './demo-renderer.js'
import {createIdleCarousel} from './idle-carousel.js'

test('11 topics preserve four KPIs and five existing panels; add exactly 33 panels',()=>{
 assert.deepEqual(Object.keys(exBoards),topics.map(t=>t[0]))
 const renderer=createDemoRenderer()
 for(const [id]of topics){
  const original=renderer.render(id)
  assert.equal((original.match(/<article class="kpi/g)||[]).length,4,id)
  assert.equal((original.match(/<section class="panel /g)||[]).length,5,id)
  assert.equal(exBoards[id].length,3,id)
 }
 assert.equal(Object.values(exBoards).flat().length,33)
})
for(const [topic,defs]of Object.entries(exBoards))test(topic+' render and detail data integrity',()=>{
 defs.forEach((d,i)=>{
  const html=exPanel(d,topic+':'+i),detail=getDetail(topic+':'+i)
  assert.ok(html.includes('示例'));assert.ok(html.includes('data-ex-detail'))
  assert.ok(!/NaN|undefined|Infinity/.test(html),d.title)
  assert.equal(detail.title,d.title);assert.ok(detail.note.length>10)
  const {heads,rows}=exDetailRows(d)
  for(const row of rows)assert.equal(row.length,heads.length,d.title)
  if(d.type==='waterfall')assert.ok(Math.abs(d.rows.slice(0,-1).reduce((n,r)=>n+r[1],0)-d.rows.at(-1)[1])<1e-8,d.title)
  if(d.type==='box')for(const row of d.rows)assert.deepEqual(row.slice(1),row.slice(1).sort((a,b)=>a-b))
  if(d.type==='scatter')for(const[,x,y]of d.rows){assert.ok(x>=d.xmin&&x<=d.xmax);assert.ok(y>=d.ymin&&y<=d.ymax)}
  if(d.type==='gantt')for(const[,a,b,p]of d.rows){assert.ok(a>=0&&a<=b&&b<d.cols.length);assert.ok(p>=0&&p<=100)}
 })
})
test('renderer remains instance isolated and validates existing filters',()=>{
 const a=createDemoRenderer(),b=createDemoRenderer()
 assert.ok(a.render('operations',{waterPeriod:'day'}).includes('m³/h'))
 assert.ok(b.render('operations').includes('09-01 至 09-18'))
 assert.ok(a.render('operations',{waterPeriod:'bad'}).includes('m³/h'))
 assert.ok(a.render('safety',{safetyView:'overdue'}).includes('逾期'))
 assert.equal(getDetail('unknown:0'),null)
})
test('demo enrichment cannot call APIs, mutate business storage or install global listeners',()=>{
 const js=fs.readFileSync(new URL('./enrichment.js',import.meta.url),'utf8')
 assert.ok(!/\b(fetch|localStorage|sessionStorage|XMLHttpRequest)\b/.test(js))
 assert.ok(!/document\.|window\.|addEventListener|new ResizeObserver/.test(js))
 assert.equal(exBoards.quality[1].rows.length,18)
 assert.ok(exBoards.quality[1].note.includes('不是对正式18项评分规则的改写'))
})
test('detail pauses the only idle timer, close starts a fresh five seconds, unmount disposes',()=>{
 let now=0,id=0,full=true,hidden=false,detail=false,advances=0
 const timers=new Map()
 const tick=ms=>{now+=ms;for(const[k,v]of [...timers])if(v.at<=now){timers.delete(k);v.fn()}}
 const c=createIdleCarousel({canRun:()=>full&&!hidden&&!detail,advance:()=>advances++,setTimer:(fn,ms)=>{timers.set(++id,{fn,at:now+ms});return id},clearTimer:id=>timers.delete(id)})
 c.reset();tick(4900);detail=true;c.reset();tick(10000);assert.equal(advances,0);assert.equal(timers.size,0)
 detail=false;c.reset();tick(4999);assert.equal(advances,0);tick(1);assert.equal(advances,1)
 hidden=true;c.reset();tick(6000);assert.equal(advances,1)
 hidden=false;full=false;c.reset();assert.equal(timers.size,0)
 full=true;c.reset();c.dispose();tick(6000);assert.equal(advances,1);assert.equal(timers.size,0)
})
