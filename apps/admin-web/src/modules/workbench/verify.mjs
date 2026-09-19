import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'
import {createDemoRenderer,topics} from '../management-cockpit/demo-renderer.js'
const require=createRequire(import.meta.url),ts=require('typescript'),Module=require('node:module')
const file=fileURLToPath(new URL('./model.ts',import.meta.url)),m=new Module(file)
m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file)
const {dailyItems,safetyItems,currentItems,scheduledItems,overdue,uniqueItems}=m.exports
let tests=0;const test=(name,fn)=>{fn();tests++;console.log('PASS '+name)}
const now=new Date('2026-09-19T10:00:00+08:00'),line={id:'line',name:'一期',employeeId:'me'}
const row={id:'d',assignee_id:'me',reviewer_id:'other',state:'DRAFT',business_date:'2026-09-19',actions:['save']}
test('本人填报按ID归属',()=>assert.equal(dailyItems(line,[row])[0].pending,true))
test('同名不相关人员不归属',()=>assert.equal(dailyItems(line,[{...row,assignee_id:'other',assigneeName:'同名'}]).length,0))
test('管理员不默认拥有所有日数据',()=>assert.equal(dailyItems({...line,employeeId:'admin'},[row]).length,0))
test('独立复核须本人分派且后台允许',()=>{const r={...row,assignee_id:'other',reviewer_id:'me',state:'SUBMITTED',actions:['confirm']};assert.equal(dailyItems(line,[r])[0].review,true);assert.equal(dailyItems(line,[{...r,actions:[]}])[0].pending,false)})
test('缺责任映射不生成个人待办',()=>assert.equal(dailyItems({...line,employeeId:''},[row]).length,0))
test('业务日期不是期限，不推断逾期',()=>assert.equal(overdue(dailyItems(line,[{...row,business_date:'2020-01-01'}])[0],now),false))
test('未来任务只进计划，不算当前待办',()=>{const items=dailyItems(line,[{...row,business_date:'2026-09-20'}]);assert.equal(currentItems(items,now).length,0);assert.equal(scheduledItems(items,'week',now).length,1)})
test('今日计划和待办同一源去重',()=>{const items=dailyItems(line,[row]);assert.equal(uniqueItems([...items,...items]).length,1);assert.equal(scheduledItems(items,'today',now).length,1)})
const context={employeeId:'me',userId:'u',canManage:false},task={id:'t',title:'巡检',plannedStart:'2026-09-18',dueAt:'2026-09-18T17:00:00+08:00',status:'PENDING',canExecute:true,assigneeEmployeeId:'me'}
test('检查只取本人分派',()=>assert.equal(safetyItems(context,[task,{...task,id:'t2',assigneeEmployeeId:'other'}],[]).length,1))
test('期限超过且未完成才算逾期',()=>{const i=safetyItems(context,[task],[])[0];assert.equal(overdue(i,now),true);assert.equal(overdue({...i,pending:false},now),false)})
const hazard={id:'h',location:'现场',description:'护栏',status:'RECTIFYING',responsibleEmployeeId:'me',canRectify:true,canReceive:false,canReview:false,canAssign:false,dueDate:'2026-09-18'}
test('本人隐患整改进入待办',()=>assert.equal(safetyItems(context,[],[hazard])[0].pending,true))
test('全厂只读不等于个人责任',()=>assert.equal(safetyItems({...context,employeeId:'observer'},[],[hazard]).length,0))
test('岗位复核明确与本人分派区分',()=>{const i=safetyItems({...context,canManage:true},[],[{...hazard,responsibleEmployeeId:'other',canRectify:false,canReview:true,status:'REVIEW_PENDING'}])[0];assert.equal(i.responsibility,'岗位职责');assert.equal(i.review,true)})
test('本人上报不自动等于本人整改',()=>{const i=safetyItems(context,[],[{...hazard,responsibleEmployeeId:'other',reportedBy:'u',canRectify:false}])[0];assert.equal(i.started,true);assert.equal(i.pending,false)})
test('同对象可有待办与计划展示但不重复计数',()=>assert.equal(uniqueItems([...safetyItems(context,[task],[hazard]),...safetyItems(context,[task],[hazard])]).length,2))
test('11专题均4指标5面板且无无效数值',()=>{assert.equal(topics.length,11);const r=createDemoRenderer();for(const [topic] of topics){const html=r.render(topic);assert.equal((html.match(/<article class="kpi /g)||[]).length,4,topic);assert.equal((html.match(/<section class="panel /g)||[]).length,5,topic);assert.doesNotMatch(html,/NaN|undefined|Infinity/);assert.doesNotMatch(html,/<script|iframe/)}})
test('驾驶舱实例状态隔离，固定筛选可用',()=>{const a=createDemoRenderer(),b=createDemoRenderer();const original=b.render('operations');assert.notEqual(a.render('operations',{waterPeriod:'day'}),original);assert.equal(b.render('operations'),original);for(const [topic,filters] of [['process',{pollutant:'TN'}],['business',{businessView:'amount'}],['safety',{safetyView:'overdue'}]])assert.notEqual(a.render(topic,filters),b.render(topic))})
test('非法过滤值不进入HTML',()=>assert.doesNotMatch(createDemoRenderer().render('process',{pollutant:'<script>alert(1)</script>'}),/alert\(1\)/))
// Follow the existing collaboration SFC test harness: execute real Vue setup,
// substitute only network responses and lifecycle registration, not business logic.
const vue=require('vue'),{parse,compileScript}=require('vue/compiler-sfc')
const componentFile=fileURLToPath(new URL('./PersonalWorkbench.vue',import.meta.url))
const compiled=ts.transpileModule(compileScript(parse(fs.readFileSync(componentFile,'utf8')).descriptor,{id:'workbench-verification'}).content,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no});return {promise,resolve,reject}}
const settle=async()=>{await vue.nextTick();await new Promise(resolve=>setImmediate(resolve))}
function mount(clients={},permissions=['process:daily:execute','inspection:read','hazard:read']){
  const fallback={processDailyContext:async()=>[line],processDailyList:async()=>[row],safetyContext:async()=>context,workflowTasks:async()=>[task],workflowHazards:async()=>[]}
  const props=vue.reactive({api:{forSite:site=>({...fallback,...(clients[site]||{})})},siteId:'a',userId:'u',displayName:'验收人员',permissions})
  const output={exports:{}},cleanups=[],scope=vue.effectScope()
  vm.runInNewContext(compiled,{exports:output.exports,module:output,console,require:name=>name==='vue'?{...vue,onBeforeUnmount:fn=>cleanups.push(fn)}:name==='./model'?m.exports:{}},{filename:componentFile})
  const state=scope.run(()=>output.exports.default.setup(props,{expose:()=>{},emit:()=>{}}))
  return {props,state,stop:()=>{cleanups.forEach(fn=>fn());scope.stop()}}
}
async function asyncTest(name,fn){await fn();tests++;console.log('PASS '+name)}
await asyncTest('真实组件：读取中不显示真实零',async()=>{const d=deferred(),x=mount({a:{processDailyContext:()=>d.promise}},['process:daily:read']);assert.equal(x.state.loading.value,true);assert.equal(x.state.count(0),'—');d.resolve([]);await settle();assert.equal(x.state.loading.value,false);assert.equal(x.state.count(0),'0');x.stop()})
await asyncTest('真实组件：无权限不调用来源、不冒充零',async()=>{const x=mount({},[]);await settle();assert.equal(x.state.sources.value.every(s=>s.state==='unavailable'),true);assert.equal(x.state.ready.value,false);assert.equal(x.state.count(0),'—');x.stop()})
await asyncTest('真实组件：部分来源失败保持成功事项并标不完整',async()=>{const x=mount({a:{workflowTasks:async()=>{throw new Error('连接失败')}}});await settle();assert.equal(x.state.partial.value,true);assert.equal(x.state.items.value.length,1);assert.equal(x.state.sources.value[1].items.length,0);x.stop()})
await asyncTest('真实组件：项目切换清空旧数据，迟到成功不回灌',async()=>{const d=deferred(),x=mount({a:{processDailyContext:()=>d.promise},b:{processDailyContext:async()=>[]}},['process:daily:read']);x.props.siteId='b';await settle();assert.equal(x.state.items.value.length,0);d.resolve([line]);await settle();assert.equal(x.state.items.value.length,0);x.stop()})
await asyncTest('真实组件：迟到错误不覆盖新项目来源',async()=>{const d=deferred(),x=mount({a:{processDailyContext:()=>d.promise},b:{processDailyContext:async()=>[]}},['process:daily:read']);x.props.siteId='b';await settle();d.reject(new Error('旧失败'));await settle();assert.equal(x.state.partial.value,false);assert.equal(x.state.sources.value[0].state,'ready');x.stop()})
await asyncTest('真实组件：当前身份与安全上下文不一致则不出事项',async()=>{const x=mount({a:{safetyContext:async()=>({...context,userId:'other'})}});await settle();assert.equal(x.state.sources.value[1].state,'error');assert.equal(x.state.sources.value[1].items.length,0);x.stop()})
await asyncTest('真实组件：卸载后迟到来源不修改状态',async()=>{const d=deferred(),x=mount({a:{processDailyContext:()=>d.promise}},['process:daily:read']);const before=x.state.sources.value;x.stop();d.resolve([line]);await settle();assert.equal(x.state.sources.value,before);assert.equal(x.state.items.value.length,0)})
console.log(`${tests}项工作台/驾驶舱检查通过`)
