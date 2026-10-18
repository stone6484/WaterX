import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {createRequire} from 'node:module'
const require=createRequire(import.meta.url),ts=require('typescript'),Module=require('node:module'),dir=path.dirname(new URL(import.meta.url).pathname),cache=new Map()
function load(name){const file=path.resolve(dir,name+'.ts');if(cache.has(file))return cache.get(file).exports;const m=new Module(file);m.filename=file;m.paths=Module._nodeModulePaths(dir);m.require=id=>id.startsWith('.')?load(id):require(id);cache.set(file,m);m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);return m.exports}
const t=load('./trend-data'),a=load('./adapter'),e=load('./engine')
let count=0;function test(name,fn){fn();count++;console.log('PASS '+name)}
test('7/15天含结束日，跨年和闰月日期正确',()=>{assert.equal(t.periodStart('2026-01-03','7'),'2025-12-28');assert.equal(t.periodStart('2026-10-18','15'),'2026-10-04');assert.equal(t.periodStart('2024-03-31','month'),'2024-03-01');assert.equal(t.periodStart('2026-10-18','month'),'2026-09-19');assert.equal(t.validDate('2026-02-30'),false);assert.equal(t.validDate('2024-02-29'),true)})
test('空白/限定符/异常/缺失不画成0，真实0保留',()=>{for(const r of [{data:'MISSING',actual:'0'},{data:'INVALID',actual:'20'},{data:'NA',actual:'0'},{data:'VALID',actual:''},{data:'VALID',actual:'<0.02'}])assert.equal(t.pointValue(r),null);assert.equal(t.pointValue({data:'VALID',actual:'0'}),0);assert.equal(t.pointValue({data:'VALID',actual:'100',unit:'m³/d'},'万m³/d'),null)})
test('缺日与无效数据均断线，单点仍保留',()=>{const d=(date,value,data='VALID')=>({date,rows:[{id:'a',actual:value,data}]});const days=[d('2026-10-01','0'),d('2026-10-02','1'),d('2026-10-04','2'),d('2026-10-05','','MISSING'),d('2026-10-06','3')];assert.equal(t.linePath(days,'a',v=>Number(v.slice(-2)),v=>v),'M1.00,0.00 L2.00,1.00 M4.00,2.00  M6.00,3.00')})
test('首次全选、清空可记忆、旧指标忽略、损坏偏好回退全选',()=>{const m=[{id:'a'},{id:'b'}];assert.deepEqual(t.selectedIds(m,undefined),['a','b']);assert.deepEqual(t.selectedIds(m,[]),[]);assert.deepEqual(t.selectedIds(m,['b','deleted']),['b']);assert.deepEqual(t.selectedIds(m,'broken'),['a','b'])})
test('只读当前工艺线和日期，最新修订生效，不依赖已存诊断，不回填样例值',()=>{const metrics=e.makeCatalog([{code:'COD',category:'进水水质',name:'COD',unit:'mg/L',design:'',target:'',actual:'999',meaning:'',formula:'',scopes:['entry','diagnosis']}]);const cell=value=>({value,state:'VALID',source:'MANUAL',note:''});const version=(value,version=1)=>({version,cells:{[metrics[0].id]:cell(value)},demo:false});const state=a.emptyProject('a','A');state.entries=[{line:'L',date:'2026-10-01',versions:[version('9'),version('0',2)]},{line:'OTHER',date:'2026-10-01',versions:[version('100')]},{line:'L',date:'2026-09-30',versions:[version('300')]}];const before=JSON.stringify(state),days=t.localTrend(state,metrics,'L','2026-10-01','2026-10-07');assert.equal(days.length,1);assert.equal(days[0].rows[0].actual,'0');assert.equal(days[0].version,2);assert.equal(JSON.stringify(state),before);assert.deepEqual(t.localTrend(a.emptyProject('b','B'),metrics,'L','2026-10-01','2026-10-07'),[])})
const metric=e.makeCatalog([{code:'COD',category:'进水水质',name:'COD',unit:'mg/L',design:'',target:'',actual:'999',meaning:'',formula:'',scopes:['entry','diagnosis']}])[0]
const source={version:2,template:[metric],cells:{[metric.id]:{value:'0',state:'VALID',source:'MANUAL',note:''}}}
const record={id:'r',business_date:'2026-10-18'},detail={...record,line_id:'L',revision:4,confirmed_version:2,analysisBlocked:false,versions:[{...source,version:1,cells:{}},source]}
let reads=0
const api={processDailyDetail:async()=>{reads++;return detail},processReports:async()=>[],processReport:async()=>{throw Error('No report expected')}}
const zero=await t.remoteTrendDay(api,record,'L');assert.equal(zero.rows[0].actual,'0');assert.equal(zero.version,2);assert.equal(reads,2);count++;console.log('PASS 查看权限使用原日数据详情快照，不调用管理专用来源接口，真实0保留')
for(const changed of [{analysisBlocked:true},{line_id:'OTHER'},{business_date:'2026-10-17'}])assert.equal(await t.remoteTrendDay({...api,processDailyDetail:async()=>({...detail,...changed})},record,'L'),null)
await assert.rejects(()=>t.remoteTrendDay({...api,processDailyDetail:async()=>({...detail,versions:[]})},record,'L'),/快照缺失/)
count++;console.log('PASS 未确认、暂停、跨线、错日及快照缺失不伪造数据')
reads=0;assert.equal(await t.remoteTrendDay({...api,processDailyDetail:async()=>++reads===1?detail:{...detail,revision:5,analysisBlocked:true}},record,'L'),null)
count++;console.log('PASS 读取中发生更正，弃用旧确认数据')
const saved={id:'saved',version:3,status:'SAVED',sourceChanged:false,source:{entry:{version:2}},rows:[{id:metric.id,actual:'42',data:'VALID'}]}
const savedApi={...api,processReports:async()=>[saved,{...saved,id:'draft',status:'DRAFT',version:4}],processReport:async id=>{assert.equal(id,'saved');return saved}}
assert.equal((await t.remoteTrendDay(savedApi,record,'L')).rows[0].actual,'42')
assert.equal((await t.remoteTrendDay({...savedApi,processReport:async()=>({...saved,sourceChanged:true})},record,'L')).rows[0].actual,'0')
await assert.rejects(()=>t.remoteTrendDay({...api,processDailyDetail:async()=>{throw Error('403')}},record,'L'),/403/)
count++;console.log('PASS 仅同确认版本有效已保存结果可复用，来源变化回到确认输入，权限错误不吞掉')
console.log(`${count} trend tests passed`)
