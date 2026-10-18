import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {createRequire} from 'node:module'
const require=createRequire(new URL('../../../package.json',import.meta.url)),ts=require('typescript'),Module=require('node:module')
const file=new URL('./metric-boards.ts',import.meta.url)
const m=new Module(file.pathname)
m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file.pathname)
const {groupMetricBoards,entryPasteChanges,RESULT_CATEGORIES,CONTROL_CATEGORIES}=m.exports
const metric=(id,category='进水水质')=>({id,name:id,code:`CODE-${id}`,category})
const rows=[metric('COD'),metric('BOD'),metric('SS')]
const cell=(value,state='VALID',note='')=>({value,state,note,source:'MANUAL'})

test('左右各六类，分组只使用页面传入指标，不扩充目录',()=>{
 assert.equal(RESULT_CATEGORIES.length,6);assert.equal(CONTROL_CATEGORIES.length,6)
 const metrics=[...RESULT_CATEGORIES,...CONTROL_CATEGORIES].map((c,i)=>metric(String(i),c))
 const boards=groupMetricBoards(metrics,'进水水质','水量控制')
 assert.deepEqual(boards.map(b=>b.categories),[RESULT_CATEGORIES,CONTROL_CATEGORIES])
 assert.deepEqual(boards.map(b=>b.rows.map(r=>r.id)),[['0'],['6']])
 const limited=groupMetricBoards([metrics[2],metrics[7]],'进水水质','水量控制')
 assert.deepEqual(limited.map(b=>b.rows[0].id),['2','7'])
 assert.equal(groupMetricBoards([],'','').every(b=>!b.rows.length&&!b.categories.length),true)
})
test('分类切换不改指标和值，未知历史分类不丢失',()=>{
 const metrics=[metric('a','历史自定义分类'),metric('b','曝气控制')],before=JSON.stringify(metrics)
 const boards=groupMetricBoards(metrics,'不存在','曝气控制')
 assert.equal(boards[0].rows[0].id,'a');assert.equal(boards[1].rows[0].id,'b')
 assert.equal(JSON.stringify(metrics),before)
})
test('Excel一列与一行粘贴保留0、空白、限定符及精度',()=>{
 for(const input of ['0\r\n\r\n<0.02\r\n','0\t\t<0.02']){
  const result=entryPasteChanges(input,rows,'COD',{})
  assert.deepEqual(result.map(r=>r.cell.value),['0','','<0.02'])
  assert.ok(result.every(r=>r.cell.source==='IMPORT'))
 }
 assert.equal(entryPasteChanges('1.000\t2e-3',rows,'BOD',{})[0].cell.value,'1.000')
})
test('按名称两列粘贴校验指标顺序并保留异常状态和说明',()=>{
 const cells={COD:cell('7','INVALID','取样待复核')},before=JSON.stringify(cells)
 const result=entryPasteChanges('指标\t实际值\nCOD\t0\nBOD\t20',rows,'COD',cells)
 assert.equal(result[0].cell.value,'0');assert.equal(result[0].cell.state,'INVALID');assert.equal(result[0].cell.note,'取样待复核')
 assert.equal(JSON.stringify(cells),before)
 for(const text of ['指标\t实际值\nCOD\t0','COD\t0']){
  const single=entryPasteChanges(text,rows,'COD',cells)
  assert.equal(single.length,1);assert.equal(single[0].cell.value,'0')
 }
 assert.throws(()=>entryPasteChanges('BOD\t2\nCOD\t1',rows,'COD',cells),/顺序/)
})
test('批量粘贴越界、遇不适用或公式时整批拒绝，不变更原草稿',()=>{
 const cells={SS:cell('','NA','本线不适用')},before=JSON.stringify(cells)
 for(const input of ['1\t2\t3\t4','1\t=SUM(2)','1\t2\t3'])assert.throws(()=>entryPasteChanges(input,rows,'COD',cells))
 assert.throws(()=>entryPasteChanges('1\t2',rows,'不存在',cells))
 assert.throws(()=>entryPasteChanges('指标\t实际值\nCOD',rows,'COD',cells),/两列/)
 assert.equal(JSON.stringify(cells),before)
})
test('三页主表列精简、详情保留质量字段、诊断与录入共用看板样式',()=>{
 const editor=fs.readFileSync(new URL('./MetricEditor.vue',import.meta.url),'utf8')
 const diagnosis=fs.readFileSync(new URL('./DiagnosisBoards.vue',import.meta.url),'utf8')
 for(const source of [editor,diagnosis])assert.ok(source.includes('<style scoped src="./metric-boards.css">'))
 assert.ok(editor.includes("props.mode==='entry'?['指标','实际值']:['指标','单位',props.mode==='design'?'设计值':'目标值','指标意义']"))
 assert.ok(editor.includes('label="数据状态"'));assert.ok(editor.includes('label="数据说明"'))
 assert.ok(editor.includes('label="控制方式"'));assert.ok(editor.includes('label="预警容差 %"'))
 assert.ok(editor.includes('@paste="paste($event,board.rows,m)"'))
 for(const filename of ['ProcessArchivePage.vue','DailyCollaborationPage.vue','ProcessManagementPage.vue'])assert.ok(fs.readFileSync(new URL('./'+filename,import.meta.url),'utf8').includes('<MetricEditor'))
 const css=fs.readFileSync(new URL('./metric-boards.css',import.meta.url),'utf8')
 assert.ok(css.includes('repeat(2,minmax(0,1fr))'));assert.ok(css.includes('max-height:52vh'))
 assert.ok(css.includes('width:var(--wx-scrollbar-size)'))
})
