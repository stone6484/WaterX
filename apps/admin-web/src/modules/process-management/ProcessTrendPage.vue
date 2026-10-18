<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type { ApiClient } from '@safety/api-client'
import { WxButton, WxField, WxInput, WxSelect } from '../../components/waterx'
import TrendBoards from './TrendBoards.vue'
import { makeCatalog } from './engine'
import { loadProject } from './adapter'
import { businessToday, type LegacyMetric, type Metric } from './types'
import { validDate, periodStart, localTrend, remoteTrendDay, type TrendDay } from './trend-data'
import './process-management.css'
const props=defineProps<{siteId:string;siteName:string;legacyMetrics:LegacyMetric[];api?:ApiClient;remote?:boolean;previewDays?:TrendDay[]}>()
const line=ref('一期生化线'),lines=ref<{id:string;name:string}[]>([]),remoteMetrics=ref<Metric[]>([])
const period=ref('7'),end=ref(businessToday()),start=ref(periodStart(end.value,'7'))
const days=ref<TrendDay[]>([]),busy=ref(false),error=ref(''),refreshAt=ref('')
const metrics=computed(()=>(props.remote?remoteMetrics.value:makeCatalog(props.legacyMetrics)).filter(m=>m.scopes.includes('diagnosis')&&m.source!=='DESIGN'))
const rangeError=computed(()=>!validDate(start.value)||!validDate(end.value)?'请选择有效的开始和结束日期。':start.value>end.value?'开始日期不能晚于结束日期。':'')
watch([period,end],()=>{if(period.value!=='custom'&&validDate(end.value))start.value=periodStart(end.value,period.value)})
let epoch=0
onBeforeUnmount(()=>{epoch++})
async function load(){
  const ticket=++epoch;days.value=[];error.value='';refreshAt.value=''
  if(rangeError.value){busy.value=false;return}busy.value=true
  try{
    let result:TrendDay[]=[]
    if(props.previewDays){lines.value=[{id:'一期生化线',name:'一期生化线'},{id:'二期生化线',name:'二期生化线'}];result=line.value==='一期生化线'?props.previewDays.filter(d=>d.date>=start.value&&d.date<=end.value):[]}
    else if(props.remote&&props.api){
      const api=props.api.forSite(props.siteId),context=await api.processDailyContext();if(ticket!==epoch)return
      lines.value=context.map(l=>({id:l.id,name:l.name}));line.value=context.some(l=>l.id===line.value)?line.value:context[0]?.id||''
      const current=context.find(l=>l.id===line.value);remoteMetrics.value=current?.template||[]
      if(current){
        const list=await api.processDailyList(current.id);if(ticket!==epoch)return
        const records=list.filter(r=>r.business_date>=start.value&&r.business_date<=end.value&&r.confirmed_version>0&&!r.analysisBlocked)
        // Only read authorized confirmed source snapshots; never generate or save reports.
        for(let i=0;i<records.length;i+=6){
          const batch=await Promise.all(records.slice(i,i+6).map(r=>remoteTrendDay(api,r,current.id)))
          if(ticket!==epoch)return;result.push(...batch.filter((day):day is TrendDay=>day!==null))
        }
      }
    }else{
      const state=loadProject(props.siteId,props.siteName)
      lines.value=[...new Set(['一期生化线','二期生化线',...state.entries.map(e=>e.line)])].map(id=>({id,name:id}))
      result=localTrend(state,makeCatalog(props.legacyMetrics),line.value,start.value,end.value)
    }
    if(ticket!==epoch)return
    days.value=result.sort((a,b)=>a.date.localeCompare(b.date));refreshAt.value=new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',hour:'2-digit',minute:'2-digit'}).format(new Date())
  }catch(e){if(ticket===epoch){days.value=[];error.value=(e as Error).message}}finally{if(ticket===epoch)busy.value=false}
}
watch(()=>[props.siteId,line.value,start.value,end.value,props.remote],()=>{void load()},{immediate:true})
</script>
<template>
  <section class="pm-workspace trend-page">
    <div class="pm-toolbar trend-toolbar">
      <WxField label="工艺线"><WxSelect v-model="line"><option v-for="l in lines" :key="l.id" :value="l.id">{{l.name}}</option></WxSelect></WxField>
      <WxField label="时间范围"><WxSelect v-model="period"><option value="7">近7天</option><option value="15">近15天</option><option value="month">近1个月</option><option value="custom">自定义时段</option></WxSelect></WxField>
      <WxField label="开始日期"><WxInput v-model="start" type="date" :disabled="period!=='custom'" /></WxField>
      <WxField label="结束日期"><WxInput v-model="end" type="date" /></WxField>
      <WxButton :disabled="busy||!!rangeError" @click="load">{{busy?'正在读取…':'刷新数据'}}</WxButton>
      <div class="trend-status"><span v-if="refreshAt">更新于 {{refreshAt}}</span><span v-if="previewDays||days.some(d=>d.demo)" class="trend-demo">演示数据</span></div>
    </div>
    <p v-if="rangeError||error" role="alert" class="pm-error">{{rangeError||error}}</p>
    <p v-if="!busy&&!error&&!rangeError&&!days.length" class="trend-no-data" role="status">暂无日记录</p>
    <TrendBoards v-if="!rangeError&&!error" :metrics="metrics" :days="days" :from="start" :to="end" :scope="`${encodeURIComponent(siteId)}:${encodeURIComponent(line)}`" />
  </section>
</template>
<style scoped>
.trend-page{container-type:inline-size}.trend-toolbar{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center;padding:0;border:0}.trend-toolbar :deep(.wx-field-control){width:160px}.trend-status{display:flex;align-items:center;gap:12px;margin-left:auto;font-size:11px;color:var(--wx-n500);white-space:nowrap}.trend-demo{padding:3px 7px;border:1px solid var(--wx-warning-border);border-radius:var(--wx-radius-sm);color:var(--wx-warning-strong);background:var(--wx-warning-bg)}.trend-no-data{font-size:12px;color:var(--wx-n500);border:var(--wx-border-subtle);padding:12px 16px;background:var(--wx-n25);margin:0}
</style>
