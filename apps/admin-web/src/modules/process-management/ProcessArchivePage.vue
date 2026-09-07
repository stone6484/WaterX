<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { ApiClient, type DailyLine, type DailySummary, type ProcessParameter, type ProcessParameterContent, type ProcessReport, type ProcessReportSummary } from '@safety/api-client'
import { WxButton, WxField, WxInput, WxSelect, WxTableSurface } from '../../components/waterx'
import MetricEditor from './MetricEditor.vue'
import DiagnosisBoards from './DiagnosisBoards.vue'
import { businessToday, dataLabels, stateLabels, type ProcessPage, type ResultRow, type Target } from './types'
import './process-management.css'
const props=defineProps<{api:ApiClient;siteId:string;siteName:string;page:ProcessPage}>()
const lines=ref<DailyLine[]>([]),lineId=ref(''),parameters=ref<ProcessParameter[]>([]),records=ref<DailySummary[]>([]),recordId=ref('')
const reports=ref<ProcessReportSummary[]>([]),report=ref<ProcessReport|null>(null),selectedRow=ref<ResultRow|null>(null)
const busy=ref(false),blocked=ref(false),dirty=ref(false),error=ref(''),notice=ref(''),note=ref(''),category=ref('全部'),search=ref(''),history=ref('draft')
const blank=():ProcessParameterContent=>({name:'',basis:'',reason:'',from:businessToday(),to:businessToday(),status:'ACTIVE',impact:'ROUTINE',values:{},targets:{}})
const form=ref<ProcessParameterContent>(blank())
const clone=<T,>(v:T):T=>JSON.parse(JSON.stringify(v))
const client=()=>props.api.forSite(props.siteId)
const line=computed(()=>lines.value.find(l=>l.id===lineId.value))
const parameterPage=computed(()=>props.page==='processDesign'||props.page==='conditionMatrix')
const kind=computed(()=>props.page==='processDesign'?'DESIGN':'TARGET')
const detailsOpen=ref(false)
const draftSelected=computed(()=>maintain.value&&history.value==='draft')
const parameter=computed(()=>parameters.value.find(p=>p.kind===kind.value))
const maintain=computed(()=>line.value?.permissions.includes('process:parameter:maintain')??false)
const generateAllowed=computed(()=>line.value?.permissions.includes('process:report:generate')??false)
const editable=computed(()=>maintain.value&&history.value==='draft'&&!busy.value&&!blocked.value)
const record=computed(()=>records.value.find(r=>r.id===recordId.value))
const metrics=computed(()=>line.value?.template.filter(m=>m.scopes.includes(kind.value==='DESIGN'?'design':'condition'))||[])
const categories=computed(()=>['全部',...new Set(metrics.value.map(m=>m.category))])
const visibleMetrics=computed(()=>metrics.value.filter(m=>(category.value==='全部'||category.value===m.category)&&(!search.value||`${m.category} ${m.name} ${m.code}`.includes(search.value))))
const designReference=computed(()=>[...(parameters.value.find(p=>p.kind==='DESIGN')?.versions||[])].reverse().find(v=>v.content.from<=form.value.from&&v.content.to>=form.value.from)?.content)
const designValues=computed(()=>kind.value==='DESIGN'?form.value.values||{}:designReference.value?.status==='ACTIVE'?designReference.value.values||{}:{})
const meanings=computed(()=>Object.fromEntries((report.value?.source.entry.template||[]).map(m=>[m.id,m.meaning])))
const counts=computed(()=>{const rows=report.value?.rows||[];return {normal:rows.filter(r=>r.state==='normal').length,warning:rows.filter(r=>r.state==='warning').length,alarm:rows.filter(r=>r.state==='alarm').length,pending:rows.filter(r=>r.state==='pending').length,reference:rows.filter(r=>r.state==='reference').length}})
let epoch=0
const hasPendingChanges=computed(()=>dirty.value||busy.value)
function canLeave(){if(!hasPendingChanges.value)return true;notice.value=busy.value?'正在读取或保存，请完成后再离开。':'参数尚未保存，请先保存草稿，或刷新确认放弃后再离开。';return false}
defineExpose({hasPendingChanges,canLeave})
function beforeUnload(event:BeforeUnloadEvent){if(hasPendingChanges.value){event.preventDefault();event.returnValue=''}}
window.addEventListener('beforeunload',beforeUnload)
onBeforeUnmount(()=>{epoch++;window.removeEventListener('beforeunload',beforeUnload)})
async function run(fn:()=>Promise<void>){if(busy.value)return;busy.value=true;error.value='';notice.value='';try{await fn()}catch(e){error.value=(e as Error).message;blocked.value=true}finally{busy.value=false}}
function applyParameter(){const p=parameter.value;if(maintain.value){history.value='draft';form.value=clone(p?.draft||blank())}else{const latest=p?.versions.at(-1);history.value=latest?String(latest.version):'';form.value=clone(latest?.content||blank())}dirty.value=false}
async function load(){const ticket=++epoch,api=client();busy.value=true;blocked.value=true;error.value='';report.value=null;reports.value=[];records.value=[];parameters.value=[];lines.value=[];try{const context=await api.processDailyContext();if(ticket!==epoch)return;lines.value=context;lineId.value=context.some(l=>l.id===lineId.value)?lineId.value:context[0]?.id||'';if(lineId.value){const p=await api.processParameters(lineId.value);if(ticket!==epoch)return;parameters.value=p;applyParameter();const list=await api.processDailyList(lineId.value);if(ticket!==epoch)return;records.value=list;recordId.value=list.some(r=>r.id===recordId.value)?recordId.value:list[0]?.id||'';if(recordId.value&&!parameterPage.value){const list=await api.processReports(recordId.value);if(ticket!==epoch)return;reports.value=list;if(list[0]){const r=await api.processReport(list[0].id);if(ticket!==epoch)return;report.value=r}}}blocked.value=false}catch(e){if(ticket===epoch)error.value=(e as Error).message}finally{if(ticket===epoch)busy.value=false}}
watch(()=>props.siteId,()=>{void load()},{immediate:true})
watch(busy,value=>{if(!value&&notice.value==='正在读取或保存，请完成后再离开。')notice.value=''})
async function refresh(){if(dirty.value&&!window.confirm('当前参数尚未保存，刷新将放弃本次输入，是否继续？'))return;await run(load)}
async function changeLine(){await run(load)}
function selectVersion(){const p=parameter.value;form.value=clone(history.value==='draft'?p?.draft||blank():p?.versions.find(v=>String(v.version)===history.value)?.content||blank());dirty.value=false}
function setDesign(id:string,value:string){form.value.values||={};form.value.values[id]=value;dirty.value=true}
function setTarget(id:string,value:Target){form.value.targets||={};form.value.targets[id]=value;dirty.value=true}
async function saveParameter(publish:boolean){await run(async()=>{parameters.value=await client().processParameterSave(lineId.value,kind.value,publish,parameter.value?.revision||0,form.value);applyParameter();notice.value=publish?`已发布 V${parameter.value?.published_version}。新分析按业务日期匹配；历史日报保留原引用。`:'草稿已保存，现行参数与历史日报引用不变。'})}
async function selectRecord(){await run(async()=>{report.value=null;reports.value=await client().processReports(recordId.value);if(reports.value[0])report.value=await client().processReport(reports.value[0].id);blocked.value=false})}
async function openReport(id:string){await run(async()=>{report.value=await client().processReport(id);selectedRow.value=null;blocked.value=false})}
async function generate(){await run(async()=>{report.value=await client().processReportGenerate(recordId.value,note.value);reports.value=await client().processReports(recordId.value);notice.value='分析已生成并记录来源版本。请核对结果、填写说明后保存日报。'})}
async function saveReport(){if(!report.value)return;await run(async()=>{report.value=await client().processReportSave(report.value!.id,report.value!.source_stamp,note.value);reports.value=await client().processReports(recordId.value);notice.value='日报已保存，历史内容与来源快照固定。'})}
async function download(){if(!report.value)return;await run(async()=>{const data=await client().processReportExport(report.value!.id);const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`${props.siteName}-${data.source.date}-分析日报V${data.version}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notice.value='已导出日报结果与完整来源快照。'})}
</script>
<template>
<section class="pm-workspace process-archive">
  <p v-if="error" class="pm-message pm-error" role="alert">{{error}}。请核对最新状态后继续。</p>
  <p v-if="notice" class="pm-message" role="status">{{notice}}</p>
  <div v-if="!lines.length" class="pm-empty"><span v-if="busy">正在读取当前工艺线授权…</span><span v-else-if="error">读取失败，暂不能判断授权状态。<WxButton @click="load">重新读取</WxButton></span><span v-else>当前账号没有本厂工艺线的授权。</span></div>
  <template v-else>
    <!-- 数据诊断模式：范围、版本和操作集中，表格优先；追溯信息按需展开。 -->
    <div class="pm-toolbar archive-controls">
      <WxField label="工艺线"><WxSelect v-model="lineId" :disabled="busy||dirty" @change="changeLine"><option v-for="l in lines" :key="l.id" :value="l.id">{{l.name}}</option></WxSelect></WxField>
      <WxField v-if="!parameterPage" label="匹配工况"><WxInput :model-value="report?.source.target.content.name||'尚未匹配'" :title="report?.source.target.content.name||'尚未匹配'" readonly /></WxField>
      <WxField v-if="parameterPage" label="查看版本"><WxSelect v-model="history" :disabled="busy||dirty" @change="selectVersion"><option v-if="maintain" value="draft">当前草稿（不生效）</option><option v-for="v in parameter?.versions" :key="v.version" :value="String(v.version)">发布 V{{v.version}} · {{v.content.status==='ACTIVE'?'启用':'停用'}}</option></WxSelect></WxField>
      <template v-else>
        <WxField label="分析日期"><WxSelect v-model="recordId" :disabled="busy" @change="selectRecord"><option v-for="r in records" :key="r.id" :value="r.id">{{r.business_date}} · {{r.confirmed_version?`确认 V${r.confirmed_version}`:'尚未确认'}}{{r.analysisBlocked?' · 暂停新分析':''}}</option></WxSelect></WxField>
        <WxField v-if="generateAllowed" label="分析 / 保存说明"><WxInput v-model="note" placeholder="分析目的、异常说明或核查意见" /></WxField>
      </template>
      <div class="archive-actions" :class="{'archive-report-actions':!parameterPage}">
        <WxField v-if="!parameterPage&&reports.length" label="日报版本"><WxSelect :model-value="report?.id||''" :disabled="busy" @update:model-value="openReport"><option v-for="r in reports" :key="r.id" :value="r.id">V{{r.version}} · {{r.status==='SAVED'?'已保存':'待保存'}}</option></WxSelect></WxField>
        <WxButton v-if="!parameterPage&&generateAllowed" :disabled="busy||blocked||!record||record.analysisBlocked||!note.trim()" @click="generate">重新计算</WxButton>
        <WxButton v-if="!parameterPage&&generateAllowed&&report?.canSave" variant="primary" :disabled="busy||blocked||!note.trim()" @click="saveReport">保存日报</WxButton>
      <WxButton :disabled="busy" @click="refresh">刷新状态</WxButton>
      <template v-if="parameterPage&&draftSelected">
        <WxButton :disabled="busy||blocked||!dirty" @click="saveParameter(false)">保存草稿</WxButton>
        <WxButton variant="primary" :disabled="busy||blocked||form.impact!=='ROUTINE'||!form.basis.trim()||!form.reason.trim()||!form.name.trim()" @click="saveParameter(true)">发布参数</WxButton>
      </template>
      <WxButton v-if="!parameterPage&&report?.canExport" :disabled="busy||blocked" @click="download">导出日报</WxButton>
      <WxButton v-if="parameterPage||report" :aria-expanded="detailsOpen" aria-controls="archive-source-details" @click="detailsOpen=!detailsOpen">{{detailsOpen?'收起详情':'来源与历史'}}</WxButton>
      </div>
    </div>
    <template v-if="parameterPage">
      <div v-if="!draftSelected" class="archive-parameter-summary">
        <strong>{{form.name||'未维护名称'}}</strong><span>{{form.from}} 至 {{form.to}}</span>
        <span>{{form.status==='ACTIVE'?'启用':'停用'}}</span><span v-if="!history" class="pending">尚未发布</span>
      </div>
      <div v-else class="archive-edit-fields" @input="dirty=editable||dirty" @change="dirty=editable||dirty">
        <WxField label="名称"><WxInput v-model="form.name" :disabled="!editable" /></WxField>
        <WxField label="生效起始日期"><WxInput v-model="form.from" type="date" :disabled="!editable" /></WxField>
        <WxField label="生效截止日期"><WxInput v-model="form.to" type="date" :disabled="!editable" /></WxField>
        <WxField label="使用状态"><WxSelect v-model="form.status" :disabled="!editable"><option value="ACTIVE">启用</option><option value="RETIRED">停用该日期范围</option></WxSelect></WxField>
        <WxField label="变更影响"><WxSelect v-model="form.impact" :disabled="!editable"><option value="ROUTINE">授权范围内日常调整</option><option value="MAJOR">重大边界变更（待配置审批）</option></WxSelect></WxField>
        <WxField label="依据"><WxInput v-model="form.basis" :disabled="!editable" placeholder="设计文件、工艺方案或经核实的运行依据" /></WxField>
        <WxField label="修订原因"><WxInput v-model="form.reason" :disabled="!editable" /></WxField>
      </div>
      <p v-if="form.impact==='MAJOR'" class="pm-message">重大边界变更可以保存草稿；必要审批尚未配置，当前不能发布生效。</p>
      <p v-if="dirty" class="archive-unsaved" role="status">有未保存的参数修改。</p>
      <div v-if="detailsOpen" id="archive-source-details" class="archive-details">
        <h3>参数依据与历史</h3>
        <p>每条工艺线按业务日期匹配已发布参数。草稿不参与分析；同一日期有多次发布时取覆盖该日期的最新版本。运行目标容差须按项目依据校核。</p>
        <p>发布版本 {{parameter?.published_version||0}} · 办理修订 R{{parameter?.revision||0}}</p>
        <p>依据：{{form.basis||'未填写'}} · 修订原因：{{form.reason||'未填写'}}</p>
        <p>变更影响：{{form.impact==='MAJOR'?'重大边界变更':'授权范围内日常调整'}}</p>
      <template v-if="parameter?.events?.length"><h3>办理历史</h3><WxTableSurface><table class="pm-table"><thead><tr><th>修订</th><th>人员</th><th>动作</th><th>原因</th><th>时间</th></tr></thead><tbody><tr v-for="e in parameter.events" :key="e.revision"><td>R{{e.revision}}</td><td>{{e.actor_name}}</td><td>{{e.action==='PUBLISH'?'发布版本':'保存草稿'}}</td><td>{{e.note}}</td><td>{{new Date(e.created_at).toLocaleString('zh-CN',{hour12:false})}}</td></tr></tbody></table></WxTableSurface></template>
      </div>
      <div class="pm-toolbar">
        <WxField label="指标分类"><WxSelect v-model="category"><option v-for="c in categories" :key="c">{{c}}</option></WxSelect></WxField>
        <WxField label="查找指标"><WxInput v-model="search" placeholder="名称、分类或编码" /></WxField>
      </div>
      <MetricEditor :metrics="visibleMetrics" :mode="kind==='DESIGN'?'design':'condition'" :values="designValues" :targets="form.targets||{}" :cells="{}" :editable="editable" @design="setDesign" @target="setTarget" />
    </template>
    <template v-else>
      <p v-if="!record" class="pm-empty">当前范围没有可查看的日数据。请先完成日数据任务。</p>
      <p v-else-if="record.analysisBlocked" class="pm-message">日数据尚未确认或更正办理中。可以查看已保存的历史日报，暂不能形成新的业务分析。</p>
      <p v-if="!report" class="pm-empty">暂无可查看的日报。生成分析需要已确认日数据，以及业务日期适用的设计参考、运行目标发布版本。</p>
      <template v-else>
        <div class="archive-result-summary">
          <div class="archive-counts" aria-label="诊断状态汇总">
            <span class="normal">正常 {{counts.normal}}</span><span class="warning">预警 {{counts.warning}}</span><span class="alarm">告警 {{counts.alarm}}</span><span class="pending">未判定 {{counts.pending}}</span><span class="reference">仅参考 {{counts.reference}}</span>
          </div>
        </div>
        <p v-if="report.sourceChanged" class="pm-message" role="status">{{report.sourceNotice}}。当前展示的历史结果未自动更新。</p>
        <div v-if="detailsOpen" id="archive-source-details" class="archive-details">
          <h3>来源与历史</h3>
          <p>依据：日数据 V{{report.source.entry.version}} · 设计参考 V{{report.source.design.version}} · 运行目标 V{{report.source.target.version}} · {{report.rule_version}}</p>
          <p>{{report.sourceNotice}}</p>
          <p>生成：{{report.creator_name}} · {{new Date(report.created_at).toLocaleString('zh-CN',{hour12:false})}}</p>
          <p v-if="report.note">办理说明：{{report.note}}</p>
          <p>判定说明：缺失、异常、不适用及待配置项不会按正常计数。</p><p>设计：{{report.source.design.content.name}} · {{report.source.design.content.basis}} · 发布人 {{report.source.design.actor_name}}</p><p>目标：{{report.source.target.content.name}} · {{report.source.target.content.basis}} · 发布人 {{report.source.target.actor_name}}</p><p>确认说明：{{report.source.entry.reason}}</p><WxTableSurface><table class="pm-table"><thead><tr><th>日数据指标</th><th>确认值</th><th>记录状态</th><th>说明</th></tr></thead><tbody><tr v-for="(c,id) in report.source.entry.cells" :key="id"><td>{{id}}</td><td>{{c.value||'未取得'}}</td><td>{{c.state==='NA'?'不适用':c.state==='INVALID'?'数据异常':'已记录'}}</td><td>{{c.note}}</td></tr></tbody></table></WxTableSurface></div>
        <DiagnosisBoards v-if="page==='processAnalysis'" :rows="report.rows" :meanings="meanings" :configurable="false" @detail="selectedRow=$event" />
        <WxTableSurface v-else><div class="pm-table-scroll"><table class="pm-table"><thead><tr><th>指标</th><th>单位</th><th>设计参考</th><th>运行目标</th><th>实际值</th><th>数据状态</th><th>判定</th><th>说明</th></tr></thead><tbody><tr v-for="r in report.rows" :key="r.id"><td>{{r.name}}<small>{{r.category}} · {{r.code}}</small></td><td>{{r.unit}}</td><td>{{r.design}}</td><td>{{r.target}}</td><td>{{r.actual||'未取得'}}</td><td>{{dataLabels[r.data]}}</td><td>{{stateLabels[r.state]}}</td><td><WxButton @click="selectedRow=r">规则与来源</WxButton></td></tr></tbody></table></div></WxTableSurface>
      </template>
    </template>
  </template>
  <div v-if="selectedRow" class="pm-overlay" @click.self="selectedRow=null"><section class="pm-dialog" role="dialog" aria-modal="true" aria-label="指标规则与来源"><header><strong>{{selectedRow.name}}</strong><WxButton @click="selectedRow=null">关闭</WxButton></header><dl><dt>数据来源与状态</dt><dd>{{selectedRow.source}} · {{dataLabels[selectedRow.data]}}</dd><dt>公式</dt><dd>{{selectedRow.formula||'直接引用确认值'}}</dd><dt>规则</dt><dd>{{selectedRow.rule}}</dd><dt>结果说明</dt><dd>{{selectedRow.explanation||'缺少可用数据，暂不形成结论'}}</dd><dt>来源版本</dt><dd>日数据 V{{report?.source.entry.version}} / 设计 V{{report?.source.design.version}} / 目标 V{{report?.source.target.version}}</dd></dl></section></div>
</section>
</template>
<style scoped>
.process-archive{min-width:0;gap:8px}
.process-archive p,.process-archive h2{margin:0}
.process-archive h3{font-size:14px;margin:4px 0}
.process-archive .pm-toolbar{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center;border-bottom:0;padding:0}
.process-archive .pm-toolbar .wx-field{min-width:0}
.process-archive .pm-toolbar :deep(.wx-field-control){width:160px}
.archive-actions{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px}
.archive-report-actions{flex-basis:100%}
.process-archive .pm-muted{padding:0}
.archive-parameter-summary,.archive-result-summary{display:flex;flex-wrap:wrap;align-items:center;gap:8px 16px;font-size:13px;min-height:28px}
.archive-parameter-summary>span{color:var(--wx-n500)}
.archive-result-summary{justify-content:space-between}
.archive-counts{display:flex;flex-wrap:wrap;gap:8px 16px}
.archive-edit-fields{display:flex;flex-wrap:wrap;gap:8px 12px;padding:0}
.archive-edit-fields .wx-field{grid-template-columns:72px 160px;flex:none}
.archive-edit-fields :deep(.wx-input),.archive-edit-fields :deep(.wx-select){min-width:0;width:100%}
.archive-details{min-width:0;padding:12px 16px;background:var(--wx-n0);border:var(--wx-border-subtle);border-radius:var(--wx-radius-sm)}
.archive-details p{margin:8px 0;line-height:1.6;font-size:13px;overflow-wrap:anywhere}
.archive-unsaved{color:var(--wx-warning-strong);font-size:13px}
.process-archive .pm-table small{display:block;color:var(--wx-n500);margin-top:4px}
.process-archive .pm-table td{overflow-wrap:anywhere}
@media(max-width:720px){.archive-edit-fields .wx-field{grid-template-columns:72px minmax(0,1fr);width:100%}}
</style>
