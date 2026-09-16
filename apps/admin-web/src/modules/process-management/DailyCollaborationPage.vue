<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { ApiClient, type DailyLine, type DailyRecord, type DailySummary, type DailyCell } from '@safety/api-client'
import { WxButton, WxField, WxInput, WxSelect, WxTableSurface } from '../../components/waterx'
import MetricEditor from './MetricEditor.vue'
import type { Metric, ProcessPage } from './types'
import { businessToday } from './types'
import './process-management.css'

const props=defineProps<{api:ApiClient;siteId:string;siteName:string;page:ProcessPage}>()
const emit=defineEmits<{navigate:[page:ProcessPage]}>()
const lines=ref<DailyLine[]>([]),lineId=ref(''),records=ref<DailySummary[]>([]),detail=ref<DailyRecord|null>(null)
const error=ref(''),notice=ref(''),busy=ref(false),blocked=ref(false),dirty=ref(false)
const date=ref(businessToday()),assignee=ref(''),reviewer=ref(''),note=ref(''),search=ref(''),stateFilter=ref('')
const cells=ref<Record<string,DailyCell>>({}),historical=ref(false),historyLabel=ref(''),historyTemplate=ref<Metric[]>([])
let epoch=0
const client=()=>props.api.forSite(props.siteId)
const line=computed(()=>lines.value.find(x=>x.id===lineId.value))
const manage=computed(()=>line.value?.permissions.includes('process:daily:manage')??false)
const actions=computed(()=>blocked.value||historical.value?[]:detail.value?.actions||[])
const can=(action:string)=>actions.value.includes(action)
const editable=computed(()=>can('save')&&props.page==='operationEntry')
const category=ref('全部')
const allEntryMetrics=computed(()=>(historical.value?historyTemplate.value:(detail.value?.template||line.value?.template||[])).filter(m=>m.source==='MANUAL'&&m.scopes.includes('entry')))
const categories=computed(()=>['全部',...new Set(allEntryMetrics.value.map(m=>m.category))])
const dataCounts=computed(()=>{const counts={filled:0,missing:0,invalid:0,na:0};for(const m of allEntryMetrics.value){const c=cells.value[m.id];if(c?.state==='NA')counts.na++;else if(c?.state==='INVALID')counts.invalid++;else if(c?.value.trim())counts.filled++;else counts.missing++}return counts})
const metricList=computed(()=>(historical.value?historyTemplate.value:(detail.value?.template||line.value?.template||[])).filter(m=>m.source==='MANUAL'&&m.scopes.includes('entry')&&(category.value==='全部'||m.category===category.value)&&(!search.value||`${m.category} ${m.name} ${m.code}`.includes(search.value))))
const listing=computed(()=>records.value.filter(r=>!stateFilter.value||r.state===stateFilter.value))
const labels:Record<string,string>={DRAFT:'待填报',RETURNED:'已退回',SUBMITTED:'待审核',CONFIRMED:'已确认',CANCELLED:'候选已终止'}
const actionLabels:Record<string,string>={create:'分派任务',assign:'改派责任人',save:'保存草稿',submit:'提交审核',return:'退回修改',confirm:'审核确认',correct:'发起更正',cancel:'终止候选'}
const counts=computed(()=>({pending:records.value.filter(r=>['DRAFT','RETURNED'].includes(r.state)).length,review:records.value.filter(r=>r.state==='SUBMITTED').length,confirmed:records.value.filter(r=>r.confirmed_version>0).length}))
const sourcePage=computed(()=>props.page==='processAnalysis'||props.page==='processReport')
const deferred=computed(()=>props.page==='processDesign'||props.page==='conditionMatrix')
const clone=<T,>(v:T):T=>JSON.parse(JSON.stringify(v))
const hasPendingChanges=computed(()=>dirty.value||busy.value)
function canLeave(){
  if(!hasPendingChanges.value)return true
  notice.value=busy.value?'正在读取或保存，请完成后再切换页面或退出。':'当前日数据尚未保存。请先保存草稿，或点击“刷新最新状态”确认放弃后再离开。'
  return false
}
defineExpose({canLeave,hasPendingChanges})
function beforeUnload(event:BeforeUnloadEvent){if(hasPendingChanges.value){event.preventDefault();event.returnValue=''}}
window.addEventListener('beforeunload',beforeUnload)
onBeforeUnmount(()=>{epoch++;window.removeEventListener('beforeunload',beforeUnload)})
// A reply from a previous project/page must not restore its records or actions.
async function readCurrent<T>(request:Promise<T>,ticket=epoch):Promise<T>{const result=await request;if(ticket!==epoch)throw new Error('旧页面请求已失效');return result}
function apply(d:DailyRecord,preferConfirmed=true){detail.value=d;cells.value=clone(d.cells||{});assignee.value=d.assignee_id;reviewer.value=d.reviewer_id;historical.value=false;dirty.value=false;blocked.value=false;note.value='';historyLabel.value='当前候选';if(preferConfirmed&&!manage.value&&!line.value?.permissions.includes('process:daily:execute')&&d.confirmed_version)showVersion(d.confirmed_version)}
async function run(fn:()=>Promise<void>){if(busy.value)return;const ticket=epoch;busy.value=true;error.value='';notice.value='';try{await fn()}catch(e){if(ticket===epoch){error.value=(e as Error).message;blocked.value=true}}finally{if(ticket===epoch)busy.value=false}}
async function load(){const ticket=++epoch,api=client();detail.value=null;lines.value=[];records.value=[];cells.value={};historyTemplate.value=[];historical.value=false;historyLabel.value='';assignee.value='';reviewer.value='';note.value='';notice.value='';category.value='全部';search.value='';dirty.value=false;blocked.value=true;busy.value=true;error.value='';try{const values=await api.processDailyContext();if(ticket!==epoch)return;lines.value=values;lineId.value=values.some(l=>l.id===lineId.value)?lineId.value:values[0]?.id||'';if(lineId.value){const rows=await api.processDailyList(lineId.value);if(ticket!==epoch)return;records.value=rows}blocked.value=false}catch(e){if(ticket===epoch)error.value=(e as Error).message}finally{if(ticket===epoch)busy.value=false}}
watch(()=>[props.siteId,props.page],()=>{void load()},{immediate:true})
async function changeLine(){await run(async()=>{detail.value=null;records.value=[];assignee.value='';reviewer.value='';records.value=await readCurrent(client().processDailyList(lineId.value));blocked.value=false})}
async function open(id:string){await run(async()=>{apply(await readCurrent(client().processDailyDetail(id)));if(sourcePage.value&&detail.value?.versions.length)showVersion(detail.value.confirmed_version)})}
async function refresh(){if(dirty.value&&!window.confirm('当前修改尚未保存。刷新会放弃本次输入，是否继续？'))return;if(!lineId.value){await load();return}await run(async()=>{if(detail.value)apply(await readCurrent(client().processDailyDetail(detail.value.id)));records.value=await readCurrent(client().processDailyList(lineId.value));blocked.value=false})}
async function create(){await run(async()=>{const result=await readCurrent(client().processDailyCreate({lineId:lineId.value,date:date.value,assigneeId:assignee.value,reviewerId:reviewer.value,note:note.value}));records.value=await readCurrent(client().processDailyList(lineId.value));apply(await readCurrent(client().processDailyDetail(result.id)));notice.value='任务已分派，执行人员可在自己的账号中填报。'})}
async function act(action:string){if(!detail.value)return;const id=detail.value.id,site=props.siteId,api=client();await run(async()=>{
  const next=await readCurrent(api.processDailyAction(id,action,{revision:detail.value!.revision,note:note.value,assigneeId:assignee.value,reviewerId:reviewer.value,...(action==='save'?{cells:cells.value}:{})}));
  if(site!==props.siteId)return;apply(next);records.value=await readCurrent(api.processDailyList(lineId.value));notice.value=`${actionLabels[action]}已完成，记录已保存。`
})}
function setCell(id:string,value:DailyCell){cells.value[id]=value;dirty.value=true}
function showVersion(version:number){const v=detail.value?.versions.find(v=>v.version===version);if(!v)return;cells.value=clone(v.cells);historyTemplate.value=v.template;historical.value=true;dirty.value=false;historyLabel.value=`已确认 V${version}（${version===detail.value?.confirmed_version?'当前有效引用':'历史版本'}）`}
function showEvent(index:number){const e=detail.value?.events[index];if(!e)return;cells.value=clone(e.snapshot.cells||{});historyTemplate.value=e.snapshot.template||[];historical.value=true;dirty.value=false;historyLabel.value=`办理历史 R${e.revision} · ${actionLabels[e.action]||e.action}`}
async function checkSource(){if(!detail.value)return;await run(async()=>{const source=await readCurrent(client().processDailySource(detail.value!.id));notice.value=`已核查：可引用已确认 V${source.version}。本批完成日数据闭环，设计/目标协作及分析快照接入另批实施。`})}
async function download(){if(!detail.value)return;await run(async()=>{const payload=await readCurrent(client().processDailyExport(detail.value!.id));const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`${props.siteName}-${detail.value!.business_date}-日数据及历史.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notice.value='已导出当前记录、确认版本及办理历史。'})}
</script>
<template>
  <section class="pm-workspace daily-collaboration">
    <p v-if="error" class="pm-message pm-error" role="alert">{{error}}。请刷新核对最新状态后继续，未保存内容仍保留在当前表单。</p>
    <p v-if="notice" class="pm-message" role="status">{{notice}}</p>
    <template v-if="deferred"><p>首批只开放日数据填报、独立审核和更正闭环。设计标准、工况目标及规则派单沿用已确认方案，后续批次接入；本试点不引用浏览器中的旧参数作为正式依据。</p><WxButton @click="emit('navigate','operationEntry')">进入日数据协作</WxButton></template>
    <template v-else>
      <div v-if="!lines.length" class="pm-empty"><span v-if="busy">正在读取当前账号的工艺线与日数据范围…</span><span v-else-if="error">读取失败，暂不能判断授权和任务状态。<WxButton @click="load">重新读取</WxButton></span><span v-else>当前账号没有本厂工艺线的日数据授权。</span></div>
      <template v-else>
        <div class="pm-toolbar daily-list-controls"><WxField label="工艺线"><WxSelect v-model="lineId" :disabled="busy||dirty" @change="changeLine"><option v-for="l in lines" :key="l.id" :value="l.id">{{l.name}}</option></WxSelect></WxField><WxField v-if="!detail" label="办理状态"><WxSelect v-model="stateFilter"><option value="">全部</option><option v-for="(label,key) in labels" :key="key" :value="key">{{label}}</option></WxSelect></WxField><WxButton :disabled="busy" @click="refresh">刷新最新状态</WxButton><span class="pm-muted">待填报 {{counts.pending}} · 待审核 {{counts.review}} · 有确认版 {{counts.confirmed}}</span></div>
        <p v-if="sourcePage" class="pm-message">此处核查日数据来源及确认历史。设计/目标协作与分析日报快照尚未接入；不会用待审核数据或浏览器旧档案生成正式分析。</p>
        <template v-if="!detail">
          <div v-if="manage&&!sourcePage" class="daily-assignment" role="group" aria-label="分派日数据任务"><div class="pm-toolbar">
            <WxField label="业务日期"><WxInput v-model="date" type="date" /></WxField>
            <WxField label="执行人员"><WxSelect v-model="assignee"><option value="">请选择运行工</option><option v-for="a in line?.actors.filter(a=>a.execute)" :key="a.id" :value="a.id">{{a.name}}</option></WxSelect></WxField>
            <WxField label="独立审核人"><WxSelect v-model="reviewer"><option value="">请选择工艺经理</option><option v-for="a in line?.actors.filter(a=>a.review)" :key="a.id" :value="a.id">{{a.name}}</option></WxSelect></WxField>
            <WxField label="分派说明"><WxInput v-model="note" placeholder="填报要求或资料依据" /></WxField><WxButton variant="primary" :disabled="busy||blocked||!assignee||!reviewer||!note.trim()" @click="create">分派任务</WxButton>
          </div></div>
          <WxTableSurface><table class="pm-table"><thead><tr><th>业务日期</th><th>执行责任人</th><th>独立审核人</th><th>办理状态</th><th>确认版本 / 使用限制</th><th>操作</th></tr></thead><tbody><tr v-for="r in listing" :key="r.id"><td>{{r.business_date}}</td><td>{{r.assigneeName}}</td><td>{{r.reviewerName}}</td><td>{{labels[r.state]}}</td><td>{{r.confirmed_version?`V${r.confirmed_version}`:'尚未确认'}}<small>{{r.analysisBlocked?'暂停新业务分析':'已确认来源可用'}}</small></td><td><WxButton :disabled="busy" @click="open(r.id)">查看记录</WxButton></td></tr><tr v-if="!listing.length"><td colspan="6">当前范围没有日数据任务。</td></tr></tbody></table></WxTableSurface>
        </template>
        <template v-else>
          <div class="pm-toolbar"><WxButton :disabled="busy||dirty" @click="detail=null">返回列表</WxButton><b>{{detail.business_date}} · {{labels[detail.state]}}</b><span>执行：{{detail.assigneeName}}；审核：{{detail.reviewerName}}</span><span class="pm-muted">办理修订 R{{detail.revision}} · 确认版 {{detail.confirmed_version?`V${detail.confirmed_version}`:'无'}}</span></div>
          <p v-if="detail.correction_reason" class="pm-muted">更正依据：{{detail.correction_reason}}</p><p v-if="detail.review_note" class="pm-message">审核意见：{{detail.review_note}}</p>
          <div class="pm-toolbar"><strong>{{historical?historyLabel:detail.state==='CONFIRMED'?`已确认 V${detail.confirmed_version}`:detail.state==='CANCELLED'?'已终止候选内容':'当前候选内容'}}</strong><WxButton v-if="historical" :disabled="busy" @click="apply(detail,false)">返回当前候选</WxButton><WxButton v-for="v in detail.versions" :key="v.version" :disabled="busy||dirty" @click="showVersion(v.version)">确认版 V{{v.version}}</WxButton><WxButton v-if="detail.actions.includes('export')" :disabled="busy||blocked" @click="download">导出记录与历史</WxButton></div>
          <p v-if="detail.confirmed_version&&detail.analysisBlocked" class="pm-message">更正办理中。原确认版保留，新的业务分析暂停，直到更正被确认或终止。</p>
          <div class="pm-toolbar"><WxField label="指标分类"><WxSelect v-model="category"><option v-for="c in categories" :key="c" :value="c">{{c}}</option></WxSelect></WxField><WxField label="查找指标"><WxInput v-model="search" placeholder="指标名称、分类或编码" /></WxField></div><p class="pm-muted">整份记录：已填 {{dataCounts.filled}} · 缺失 {{dataCounts.missing}} · 异常 {{dataCounts.invalid}} · 不适用 {{dataCounts.na}}。确认代表记录已复核，不能据此推定全部数据完整或指标达标。</p>
          <MetricEditor :metrics="metricList" mode="entry" :values="{}" :targets="{}" :cells="cells" :editable="editable&&!busy" @cell="setCell" />
          <p v-if="dirty" class="pm-message">有未保存修改，请先保存草稿，再提交审核。</p>
          <div v-if="!sourcePage&&!historical&&actions.some(a=>a!=='export')" class="daily-actions">
            <WxField label="办理说明 / 更正依据"><WxInput v-model="note" placeholder="提交、退回、确认、更正及终止均须填写说明" /></WxField>
            <div v-if="can('assign')" class="pm-toolbar"><WxField label="执行人员"><WxSelect v-model="assignee"><option v-for="a in line?.actors.filter(a=>a.execute)" :key="a.id" :value="a.id">{{a.name}}</option></WxSelect></WxField><WxField label="独立审核人"><WxSelect v-model="reviewer"><option v-for="a in line?.actors.filter(a=>a.review)" :key="a.id" :value="a.id">{{a.name}}</option></WxSelect></WxField><WxButton :disabled="busy||!note.trim()" @click="act('assign')">保存改派</WxButton></div>
            <div class="pm-toolbar"><WxButton v-if="can('save')" :disabled="busy||!dirty" @click="act('save')">保存草稿</WxButton><WxButton v-if="can('submit')" variant="primary" :disabled="busy||dirty||!note.trim()" @click="act('submit')">提交审核</WxButton><WxButton v-if="can('return')" :disabled="busy||!note.trim()" @click="act('return')">退回修改</WxButton><WxButton v-if="can('confirm')" variant="primary" :disabled="busy||!note.trim()" @click="act('confirm')">审核确认</WxButton><WxButton v-if="can('correct')" :disabled="busy||!note.trim()" @click="act('correct')">{{detail.confirmed_version?'发起更正':'重新填报'}}</WxButton><WxButton v-if="can('cancel')" :disabled="busy||dirty||!note.trim()" @click="act('cancel')">终止当前候选</WxButton></div>
          </div>
          <WxButton v-if="sourcePage&&manage" :disabled="busy||blocked||detail.analysisBlocked" @click="checkSource">核查可用分析来源</WxButton>
          <h3>办理历史</h3><WxTableSurface><table class="pm-table"><thead><tr><th>修订</th><th>时间</th><th>人员</th><th>动作</th><th>说明</th><th>当时内容</th></tr></thead><tbody><tr v-for="(e,i) in detail.events" :key="e.revision"><td>R{{e.revision}}</td><td>{{new Date(e.created_at).toLocaleString('zh-CN',{hour12:false})}}</td><td>{{e.actor_name}}</td><td>{{actionLabels[e.action]||e.action}}</td><td>{{e.note}}</td><td><WxButton :disabled="busy||dirty" @click="showEvent(i)">查看快照</WxButton></td></tr></tbody></table></WxTableSurface>
        </template>
      </template>
    </template>
  </section>
</template>
<style scoped>
.daily-collaboration{min-width:0;gap:8px}.daily-collaboration p,.daily-collaboration h2{margin:0}.daily-actions{padding:16px 0;border-top:var(--wx-border-subtle);border-bottom:var(--wx-border-subtle)}
.daily-assignment{padding:0;border:0}
.daily-collaboration .pm-toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;margin:0;padding:0;border:0}
.daily-collaboration .pm-toolbar .wx-field{min-width:0}
.daily-collaboration .pm-toolbar :deep(.wx-field-control){width:160px}
.daily-collaboration .daily-assignment :deep(.wx-field-control){width:160px}
.daily-collaboration h3{font-size:14px;margin:8px 0}.daily-collaboration .pm-table small{display:block;color:var(--wx-n500);margin-top:4px}.daily-collaboration .pm-table td{overflow-wrap:anywhere}.daily-actions>.wx-field{max-width:720px}
</style>
