<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type { ApiClient } from '@safety/api-client'
import { WxButton, WxCard, WxState } from '../../components/waterx'
import { currentItems, dailyItems, overdue, safetyItems, scheduledItems, uniqueItems, type WorkItem, type WorkbenchTarget } from './model'

const props=defineProps<{api:ApiClient;siteId:string;userId:string;permissions:string[]}>()
const emit=defineEmits<{navigate:[target:WorkbenchTarget]}>()
type SourceState='loading'|'ready'|'unavailable'|'error'
type Source={name:string;state:SourceState;note:string;items:WorkItem[];links:WorkbenchTarget['page'][]}
const sources=ref<Source[]>([]),tab=ref<'pending'|'completed'|'started'>('pending'),period=ref<'today'|'week'>('today')
const now=ref(new Date())
let generation=0
const items=computed(()=>uniqueItems(sources.value.flatMap(s=>s.items)))
const pending=computed(()=>currentItems(items.value,now.value))
const listed=computed(()=>tab.value==='pending'?pending.value:items.value.filter(i=>tab.value==='completed'?i.completed:i.started))
const planned=computed(()=>scheduledItems(items.value,period.value,now.value))
const alerts=computed(()=>pending.value.filter(i=>overdue(i,now.value)))
const loading=computed(()=>sources.value.some(s=>s.state==='loading'))
const ready=computed(()=>sources.value.some(s=>s.state==='ready'))
const partial=computed(()=>sources.value.some(s=>s.state==='error'))
const shortcuts=computed(()=>[...new Set(sources.value.flatMap(s=>s.state==='ready'?s.links:[]))])
const names={operationEntry:'运行数据填报',inspection:'安全检查',hazard:'隐患治理'}
const count=(n:number)=>ready.value?String(n):'—'
const formatDue=(value?:string)=>!value?'期限未设置':value.length===10?value:new Date(value).toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})
async function load(){
  const ticket=++generation,client=props.api.forSite(props.siteId)
  now.value=new Date();tab.value='pending'
  const hasDaily=props.permissions.some(p=>p.startsWith('process:daily:'))
  const hasSafety=props.permissions.some(p=>p==='inspection:read'||p==='hazard:read')
  sources.value=[{name:'工艺日数据',state:hasDaily?'loading':'unavailable',note:hasDaily?'读取本人分派':'当前账号无工艺日数据权限',items:[],links:[]},{name:'安全检查与隐患',state:hasSafety?'loading':'unavailable',note:hasSafety?'读取范围与职责':'当前账号无安全读取权限',items:[],links:[]}]
  if(!props.siteId||!props.userId){sources.value=[];return}
  async function read(index:number,fn:()=>Promise<{items:WorkItem[];links:WorkbenchTarget['page'][];note:string}>){
    try{const result=await fn();if(ticket===generation)sources.value[index]={name:sources.value[index]!.name,state:'ready',...result}}
    catch(e){if(ticket===generation)sources.value[index]={...sources.value[index]!,state:'error',note:e instanceof Error?e.message:'读取失败，请重试',items:[],links:[]}}
  }
  await Promise.all([
    hasDaily?read(0,async()=>{
      const lines=await client.processDailyContext()
      const batches=await Promise.all(lines.map(async l=>dailyItems(l,await client.processDailyList(l.id))))
      return {items:batches.flat(),links:lines.length?['operationEntry']:[],note:lines.length?'按工艺线授权及本人执行／审核分派读取；日数据未设截止时间，不推断逾期':'当前项目没有获授权的工艺线'}
    }):Promise.resolve(),
    hasSafety?read(1,async()=>{
      const context=await client.safetyContext()
      if(context.userId!==props.userId)throw new Error('登录身份发生变化，请重新登录')
      const checks=props.permissions.includes('inspection:read'),hazards=props.permissions.includes('hazard:read')
      const [tasks,issues]=await Promise.all([checks?client.workflowTasks():Promise.resolve([]),hazards?client.workflowHazards():Promise.resolve([])])
      return {items:safetyItems(context,tasks,issues),links:[...(checks?['inspection' as const]:[]),...(hazards?['hazard' as const]:[])],note:context.canManage?'本人检查与整改 + 安全岗位受理／独立复核职责':'仅本人分派、整改及本人上报；不将全厂事项计入个人统计'}
    }):Promise.resolve(),
  ])
}
watch(()=>[props.siteId,props.userId,props.permissions.join('|')],load,{immediate:true})
onBeforeUnmount(()=>{generation++})
function go(item:WorkItem){emit('navigate',item.target)}
</script>

<template>
<section class="personal-workbench">
  <WxState v-if="!siteId" compact>请先选择有权限的项目</WxState>
  <WxState v-if="partial" kind="error" compact>部分来源读取失败，以下仅为成功读取的事项，请刷新重试。</WxState>
  <div class="wb-kpis">
    <WxCard v-for="stat in [{name:'待处理',value:pending.length},{name:'已逾期',value:alerts.length},{name:'待复核',value:pending.filter(i=>i.review).length},{name:'今日安排',value:scheduledItems(items,'today',now).length}]" :key="stat.name"><span>{{stat.name}}</span><strong>{{loading?'…':count(stat.value)}}</strong><small>{{ready?'已接入来源 · 当前项目':'尚无可用的个人数据'}}{{partial?' · 不完整':''}}</small></WxCard>
  </div>
  <div class="wb-grid">
    <WxCard class="wb-tasks"><header><h2>我的事项</h2><WxButton :loading="loading" @click="load">刷新</WxButton></header>
      <div class="wb-tabs" role="tablist" aria-label="个人事项类别"><button v-for="t in (['pending','completed','started'] as const)" :key="t" role="tab" :aria-selected="tab===t" :class="{selected:tab===t}" @click="tab=t">{{({pending:'待处理',completed:'已完成／确认',started:'我上报'})[t]}}</button></div>
      <div class="wb-list"><div v-for="item in listed" :key="item.key" class="wb-row"><div><b>{{item.title}}</b><small>{{item.module}} · {{item.responsibility}} · {{item.status}}</small><small :class="{late:overdue(item,now)}">{{overdue(item,now)?'已逾期 · ':''}}{{formatDue(item.due)}}</small></div><WxButton @click="go(item)">{{item.action}}</WxButton></div><p v-if="!listed.length" class="wb-empty">{{loading?'正在读取…':ready?'当前已接入来源没有这类个人事项':'暂无可用来源，请查看下方接入状态'}}</p></div>
    </WxCard>
    <WxCard><header><h2>今日及近期计划</h2><div class="wb-tabs"><button :class="{selected:period==='today'}" @click="period='today'">今日</button><button :class="{selected:period==='week'}" @click="period='week'">本周</button></div></header>
      <p class="wb-hint">已分派日数据和检查安排；与待办同源，不重复计数。</p>
      <div class="wb-list"><div v-for="item in planned" :key="item.key" class="wb-row"><div><small>{{item.date}} · {{item.status}}</small><b>{{item.title}}</b><small>{{formatDue(item.due)}}</small></div><WxButton @click="go(item)">打开</WxButton></div><p v-if="!planned.length" class="wb-empty">{{loading?'正在读取…':ready?'当前已接入来源无此期间的本人安排':'个人计划来源暂不可用'}}</p></div>
      <details><summary>未接入的计划</summary><p>周期检查计划未返回稳定责任人标识，暂不按姓名归属；尚未生成的计划，以及保养、培训等计划未接入，不表示没有这些工作。</p></details>
    </WxCard>
    <WxCard><header><h2>预警与告警</h2><span>本人事项的期限风险</span></header><div class="wb-list"><div v-for="item in alerts" :key="item.key" class="wb-row"><div><b>{{item.title}}</b><small class="late">期限 {{formatDue(item.due)}} · 仍待处理</small></div><WxButton @click="go(item)">查看</WxButton></div><p v-if="!alerts.length" class="wb-empty">{{ready?'已接入个人事项暂无逾期提醒':'期限风险暂不可用'}}</p></div><p class="wb-hint">工艺超限、设备风险等个人告警来源尚未接入，不以“无告警”代表全厂正常。</p></WxCard>
    <WxCard><header><h2>常用功能</h2><span>当前项目已获准入口</span></header><div class="wb-shortcuts"><WxButton v-for="page in shortcuts" :key="page" @click="emit('navigate',{page})">{{names[page]}}</WxButton><p v-if="!shortcuts.length" class="wb-empty">暂无已确认可用的办理入口</p></div><details class="wb-sources"><summary>数据接入状态</summary><div v-for="source in sources" :key="source.name"><b>{{source.name}} · {{({loading:'读取中',ready:'已读取',unavailable:'无权限',error:'读取失败'})[source.state]}}</b><p>{{source.note}}</p></div><p>“我上报”目前仅接安全隐患；已完成／确认是当前本人责任关联记录，不替代人员办理审计。</p></details></WxCard>
  </div>
</section>
</template>
<style scoped>
.personal-workbench{display:flex;flex-direction:column;gap:12px;min-width:0;min-height:0;flex:1;color:var(--wx-n700)}
.personal-workbench header{height:auto;min-height:0;padding:0;background:transparent;box-shadow:none;border-radius:0}
.wb-hint,.wb-empty,.personal-workbench small{color:var(--wx-n500)}
.wb-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;flex-shrink:0}
.wb-kpis>.wx-card{padding:12px 16px;display:grid;gap:4px;margin:0;box-shadow:none}
.wb-kpis strong{font-size:28px;color:var(--wx-blue-700);line-height:1.2}
.wb-kpis small{font-size:11px}
.wb-grid{display:grid;grid-template-columns:3fr 2fr;gap:12px;min-height:0;flex:1}
.wb-grid>.wx-card{padding:12px 16px;min-width:0;min-height:0;margin:0;box-shadow:none;display:flex;flex-direction:column;overflow:auto;scrollbar-width:thin}
.wb-grid header{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:8px;flex-shrink:0}
.wb-grid h2{font-size:14px;line-height:22px;margin:0}
.wb-grid header>span{font-size:11px;color:var(--wx-n500)}
.wb-tabs{display:flex;gap:4px;flex-wrap:wrap;flex-shrink:0}
.wb-tabs button{background:transparent;border:0;padding:5px 8px;font:inherit;font-size:12px;color:var(--wx-n500);border-radius:4px;cursor:pointer}
.wb-tabs button.selected{color:var(--wx-blue-700);background:var(--wx-info-bg)}
.wb-list{min-height:0;max-height:330px;overflow:auto;scrollbar-width:thin;flex:1}
.wb-row{display:flex;align-items:center;justify-content:space-between;gap:10px;border-bottom:var(--wx-border-subtle);padding:9px 0}
.wb-row>div{min-width:0;display:grid;gap:3px}
.wb-row b{font-size:13px;font-weight:500;overflow-wrap:anywhere}
.wb-row small{font-size:11px}
.wb-row>.wx-button{flex-shrink:0}
.wb-empty{font-size:12px;padding:12px 0;margin:0}
.wb-hint{font-size:11px;line-height:1.6;margin:6px 0;flex-shrink:0}
.wb-shortcuts{display:flex;gap:8px;flex-wrap:wrap}
.personal-workbench details{font-size:12px;color:var(--wx-n500);line-height:1.7;margin-top:8px;flex-shrink:0}
.personal-workbench summary{cursor:pointer;color:var(--wx-blue-700)}
.personal-workbench .late{color:var(--wx-danger-strong)}
.wb-tabs button:focus-visible{outline:2px solid var(--wx-blue-500);outline-offset:2px}
@media(min-width:850px) and (min-height:700px){.wb-grid{grid-template-rows:minmax(0,1.35fr) minmax(0,1fr)}.wb-list{max-height:none}}
@media(max-width:849px){.wb-grid{grid-template-columns:1fr}.wb-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}}
</style>
