<script setup lang="ts">
import {computed,onBeforeUnmount,onMounted,ref,shallowRef,watch} from 'vue'
import type {ApiClient,DailyLine,DailySummary} from '@safety/api-client'
const props=defineProps<{explicitLineSelection?:boolean;api:ApiClient;site:string;siteName:string;rights:string[];line:string;date:string;canChange:()=>boolean}>()
const emit=defineEmits<{choose:[line:string,date:string]}>()
const lines=ref<DailyLine[]>([]),record=ref<DailySummary|null>(null),state=ref('loading'),message=ref(''),ticket=ref(0)
const line=computed(()=>lines.value.find(l=>l.id===props.line))
const labels:Record<string,string>={loading:'正在读取正式档案',select:'请选择可用厂线后查看趋势',denied:'权限不足',empty:'当前可见范围无记录',date:'请选择业务日期',error:'正式数据读取失败',pending:'尚未确认',correcting:'正在更正，暂停新分析',confirmed:'已确认',cancelled:'候选已终止'}
const scopedApi = shallowRef<ApiClient>()
watch(() => [props.site, record.value?.id, record.value?.revision, state.value], (_, __, onCleanup) => {
  const source = record.value
  if (!source || state.value !== 'confirmed') { scopedApi.value = undefined; return }
  const lifetime = new AbortController()
  onCleanup(() => lifetime.abort())
  scopedApi.value = props.api.forConfirmedDay(props.site, source, lifetime.signal, () => void read(false, source))
}, {flush:'sync'})
let generation=0
function choose(l:string,d:string,e:Event){if(props.canChange())emit('choose',l,d);else (e.target as HTMLInputElement).value=e.target instanceof HTMLSelectElement?props.line:props.date}
function clearLineSelection() {
  generation++
  record.value = null
  state.value = 'select'
  message.value = ''
  if (props.line) {
    lines.value = lines.value.filter(item => item.id !== props.line)
    emit('choose', '', props.date)
  }
}
async function read(quiet=false, changedSource?:DailySummary){
 const g=++generation;if(!quiet){record.value=null;lines.value=[];state.value='loading';message.value=''}
 if(!props.rights.some(p=>p.startsWith('process:daily:'))){record.value=null;state.value='denied';return}
 try{
  const api=props.api.forSite(props.site),allowed=await api.processDailyContext();if(g!==generation)return
  lines.value=allowed.filter(item => item.id === props.line)
  if (props.explicitLineSelection && !allowed.some(item => item.id === props.line)) {
    clearLineSelection()
    if (!allowed.length) state.value = 'denied'
    return
  }

  if(!allowed.some(l=>l.id===props.line)){record.value=null;state.value='denied';return}
  if(!/^\d{4}-\d{2}-\d{2}$/.test(props.date)){state.value='date';return}
  const rows=await api.processDailyList(props.line);if(g!==generation)return
  const matches=rows.filter(r=>r.business_date===props.date&&r.line_id===props.line)
  if(matches.length>1)throw Error('该业务键对应多条记录，需要核查')
  const r=matches[0];
  if (r && (!r.id || !Number.isSafeInteger(r.revision) || !Number.isSafeInteger(r.confirmed_version) ||
      typeof r.analysisBlocked !== 'boolean')) throw Error('日记录来源字段无效，请核查后刷新')
  // Inconsistent replies must stop here, rather than continuously remounting a child.
  if (r && changedSource && r.id === changedSource.id && r.revision === changedSource.revision &&
      r.confirmed_version === changedSource.confirmed_version && r.state === 'CONFIRMED' && !r.analysisBlocked)
    throw Error('两次读取的确认来源不一致，请重新刷新')


  record.value=r||null;message.value=''
  state.value=!r?'empty':r.state==='CANCELLED'&&!r.confirmed_version?'cancelled':r.analysisBlocked?(r.confirmed_version?'correcting':'pending') : r.state==='CONFIRMED' && r.confirmed_version > 0 ? 'confirmed' : 'pending'
 }catch(e){if(g===generation){record.value=null;lines.value=[];state.value=(e as {status?:number}).status===403?'denied':'error';message.value=(e as Error).message}}
}
watch(()=>[props.site,props.line,props.date,props.rights.join('|'),ticket.value],()=>read(),{immediate:true})
let inFlight=false
async function recheck(){if(document.hidden||inFlight||state.value==='loading')return;inFlight=true;try{await read(true)}finally{inFlight=false}}
onMounted(()=>{window.addEventListener('focus',recheck);document.addEventListener('visibilitychange',recheck)})
onBeforeUnmount(()=>{generation++;window.removeEventListener('focus',recheck);document.removeEventListener('visibilitychange',recheck)})
function refresh(){if(props.canChange())ticket.value++}
</script>
<template>
<section class="formal-record pm-toolbar" aria-label="正式日记录来源">
<strong>协作档案 · 合成演练</strong><span>{{siteName}}</span>
<label>厂线 <select aria-label="正式厂线" :value="props.line" @change="choose(($event.target as HTMLSelectElement).value,props.date,$event)"><option v-if="explicitLineSelection" disabled value="">请选择厂线</option><option v-for="l in lines" :key="l.id" :value="l.id">{{l.name}}</option></select></label>
<label>业务日 <input aria-label="正式业务日" type="date" :value="date" @change="choose(props.line,($event.target as HTMLInputElement).value,$event)"></label>
<b role="status">{{labels[state]}}<template v-if="record?.confirmed_version"> · V{{record.confirmed_version}}</template></b>
<button type="button" @click="refresh">刷新正式记录</button>
<details v-if="record"><summary>来源</summary>工艺日数据 · {{record.id}} · 办理修订 R{{record.revision}}</details>
<small v-if="message">{{message}}</small>
</section>
<slot v-if="state==='confirmed' && record && scopedApi" :scoped-api="scopedApi" :record="record" :state="state" :refresh="()=>ticket++" :clearLineSelection="clearLineSelection"></slot>
</template>
<style scoped>.formal-record{padding:10px 14px;margin-bottom:10px;flex-wrap:wrap;align-items:center;background:#f3f8fb;border:1px solid #d0dfe8;border-radius:6px}.formal-record label{display:flex;align-items:center;gap:5px}.formal-record details,.formal-record small{max-width:100%;overflow-wrap:anywhere}</style>
