import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
const require=createRequire(import.meta.url),ts=require('typescript'),Module=require('node:module')
const dir=path.dirname(fileURLToPath(import.meta.url)),cache=new Map()
function load(name,from=dir){const file=path.resolve(from,name+'.ts');if(cache.has(file))return cache.get(file).exports;const m=new Module(file);m.filename=file;m.paths=Module._nodeModulePaths(path.dirname(file));m.require=id=>id.startsWith('.')?load(id,path.dirname(file)):require(id);cache.set(file,m);m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);return m.exports}
const engine=load('./engine'),quality=load('../management-quality/builtin-calculations'),adapter=load('../management-quality/adapter')
let count=0
function test(name,fn){fn();count++;console.log('PASS '+name)}
test('18项质量规则均有输入缺口与版本记录',()=>{const c=quality.qualityCalculationCatalog();assert.equal(c.length,18);assert.equal(new Set(c.map(x=>x.code)).size,18);assert.ok(c.every(x=>x.missing&&x.version&&x.formula))})
test('合规天数不接受空、负、小数、分子超分母、0分母',()=>{for(const pair of [[null,2],[1,null],[-1,2],[1.5,2],[3,2],[0,0]])assert.equal(quality.complianceRate(...pair),null);assert.equal(quality.complianceRate(0,2),0)})
test('达标率评分边界可复核',()=>{for(const [rate,score] of [[0,0],[.95,0],[.975,6],[1,12]])assert.ok(Math.abs(quality.dailyComplianceScore(rate)-score)<1e-9);for(const rate of [-1,1.1,NaN,Infinity])assert.equal(quality.dailyComplianceScore(rate),null)})
test('空隐患台账不是满分',()=>{assert.equal(quality.controlledHazardsScore(0,0,0),null);assert.equal(quality.controlledHazardsScore(2,2,2),7);assert.equal(quality.controlledHazardsScore(3,2,2),null)})
test('单耗保留真实0、拒绝零产出或非法量',()=>{assert.equal(quality.consumptionPerOutput(0,2),0);for(const pair of [[1,0],[null,2],[-1,2],[1,-2],[Infinity,2]])assert.equal(quality.consumptionPerOutput(...pair),null)})
test('月度事实计算不伪装为全年、不从文字推算基线',()=>{const r=quality.calculateQualitySample('MQ-E02','stable_economy_gap');assert.equal(r.actual,'0.1910 kWh/m³');assert.match(r.period,/2026-08.*不代表/);assert.equal(r.score,null)})
test('PAM按商品质量换算，未冒充有效成分',()=>{const r=quality.calculateQualitySample('MQ-E05','stable_economy_gap');assert.match(r.actual,/92 kWh\/tDS.*8.69 kg\/tDS/);assert.match(r.actual,/商品/);assert.equal(r.score,null)})
test('质量四项可算实际值、仅两项试算得分，总分不发布',()=>{const v=adapter.getQualityScenarioView('stable_economy_gap',true);assert.equal(v.metrics.filter(m=>m.calculation.state==='CALCULATED').length,4);assert.equal(v.metrics.filter(m=>m.score!==null).length,2);assert.equal(v.totalScore,null);assert.ok(v.dimensions.every(d=>d.score===null));assert.match(v.trendSummary,/暂不生成/)})
test('其他场景不偷用场景A的事实',()=>{for(const id of ['low_cost_compliance_risk','data_quality_gap']){const r=quality.calculateQualitySample('MQ-S01',id);assert.equal(r.actual,null);assert.equal(r.score,null)}})
test('旧固定样例保留、口径切换不改原数据',()=>{const original=JSON.stringify(load('../management-quality/demo-data').qualityScenarios);const v=adapter.getQualityScenarioView('stable_economy_gap');assert.equal(v.totalScore,88.5);assert.ok(v.metrics.filter(m=>m.score!==null).every(m=>m.scoreText.includes('示例')));adapter.getQualityScenarioView('stable_economy_gap',true);assert.equal(JSON.stringify(load('../management-quality/demo-data').qualityScenarios),original)})
test('依赖来自执行公式、设计输入单独标识',()=>{assert.deepEqual(engine.formulaDependencies('水量控制::厌氧段HRT'),[{id:'水量控制::厌氧段有效池容',design:true},{id:'水量控制::日进水量',design:false}]);assert.deepEqual(engine.formulaDependencies('未知::公式'),[])})
const raw=(category,name,formula='')=>({category,name,formula,code:name,unit:'mg/L',design:'',target:'',actual:'999',meaning:'',scopes:['entry','diagnosis']})
const metrics=engine.makeCatalog([raw('进水水质','COD'),raw('出水水质','COD'),raw('处理效能','COD去除率','builtin'),raw('污泥性状','SRT','pending')])
const cell=value=>({value:String(value),state:'VALID',source:'MANUAL',note:''})
test('自动目录区分直接数据、已内置、待确认规则',()=>{assert.deepEqual(engine.builtinProcessCatalog(metrics).map(m=>m.state),['DIRECT','DIRECT','BUILTIN','PENDING'])})
test('目标变更不改实际值、隐藏仅过滤显示',()=>{const cells={'进水水质::COD':cell(100),'出水水质::COD':cell(20)};const a=engine.calculateRows(metrics,{},undefined,cells);const b=engine.calculateRows(metrics,{}, {'进水水质::COD':{value:'50',mode:'UPPER',warning:10,alarm:50}},cells);assert.deepEqual(a.map(x=>x.actual),b.map(x=>x.actual));const visible=a.filter(x=>x.id!=='进水水质::COD');assert.equal(visible.find(x=>x.id==='处理效能::COD去除率').actual,'80');assert.equal(a.length,4)})
const {effectScope,ref,nextTick}=require('vue'),preferences=load('./indicator-selection')
const store=new Map();globalThis.localStorage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)}
const site=ref('A'),scope=effectScope();let selection
scope.run(()=>{selection=preferences.useIndicatorSelection(()=>site.value)})
test('指标选用只写专用项目键',()=>{assert.equal(selection.saveSelection(['x','x']),true);assert.equal(store.size,1);assert.deepEqual(JSON.parse(store.get(preferences.indicatorPreferenceKey('A'))),['x'])})
site.value='B';await nextTick()
test('跨项目显示设置隔离',()=>assert.deepEqual(selection.hidden.value,[]))
test('保存失败可见，不改当前选择',()=>{const set=localStorage.setItem;localStorage.setItem=()=>{throw Error('full')};assert.equal(selection.saveSelection(['y']),false);assert.deepEqual(selection.hidden.value,[]);assert.match(selection.selectionError.value,/保存失败/);localStorage.setItem=set})
store.set(preferences.indicatorPreferenceKey('C'),'not-json');site.value='C';await nextTick()
test('旧设置损坏不覆盖原值且显示全部',()=>{assert.deepEqual(selection.hidden.value,[]);assert.equal(store.get(preferences.indicatorPreferenceKey('C')),'not-json');assert.match(selection.selectionError.value,/读取失败/)})
scope.stop()
test('已取消模型实验入口及客户端接口已移除',()=>{assert.equal(fs.existsSync(path.resolve(dir,'../model-library/ModelLibraryPage.vue')),false);assert.doesNotMatch(fs.readFileSync(path.resolve(dir,'../../App.vue'),'utf8'),/ModelLibraryPage|modelAlgorithms|modelExperimentsEnabled/);assert.doesNotMatch(fs.readFileSync(path.resolve(dir,'../../../../../packages/api-client/src/index.ts'),'utf8'),/modelRequest/);})
const lab=load('../lab-raw-records/formula-engine'),templates=load('../lab-raw-records/templates').labTemplates
test('化验18模板全部空白不产出虚假0',()=>{assert.equal(templates.length,18);for(const t of templates){const record={observations:Object.fromEntries(t.fields.map(f=>[f.key,'']))};assert.ok(lab.calculateLabResults(record,t).every(r=>r.value===null),t.code)}})
test('化验真实0保留，缺项不再压低pH均值',()=>{const t=templates.find(t=>t.code==='Y01');assert.equal(lab.calculateLabResults({observations:{reading1:'0',reading2:'0'}},t)[0].value,0);for(const missing of ['', ' ',null,undefined])assert.equal(lab.calculateLabResults({observations:{reading1:missing,reading2:'7'}},t)[0].value,null)})
test('化验SS除0与称量缺失不生成结果',()=>{const t=templates.find(t=>t.code==='Y04');assert.equal(lab.calculateLabResults({observations:{loaded2:'2',tare2:'1',sampleVolume:'0'}},t)[0].value,null);assert.equal(lab.calculateLabResults({observations:{loaded2:'2',tare2:'',sampleVolume:'100'}},t)[0].value,null)})
test('化验缺项质控不显示NaN或冒称平行检查通过',()=>{const t=templates[0],r={observations:{reading1:'',reading2:'7'}};const qc=lab.evaluateLabQc(r,t,lab.calculateLabResults(r,t));assert.ok(!JSON.stringify(qc).includes('NaN'));assert.equal(qc.checks.find(x=>x.id==='observation-qc').status,'待完成')})
test('真实工艺目录153项：138项诊断、36项计算已内置、28项待确认',()=>{const template=JSON.parse(fs.readFileSync(new URL('../../../../../backend/src/test/resources/process-daily-template.json',import.meta.url),'utf8'));const c=engine.builtinProcessCatalog(template);assert.equal(c.length,153);assert.equal(c.filter(x=>x.scopes.includes('diagnosis')).length,138);assert.equal(c.filter(x=>x.state==='BUILTIN').length,36);assert.equal(c.filter(x=>x.state==='PENDING').length,28);assert.ok(c.every(x=>x.inputs.every(i=>template.some(m=>m.id===i.id))))})
console.log(`内置规则与显示隔离：${count} 项检查通过。`)
