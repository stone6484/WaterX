<script setup lang="ts">
import { computed, ref } from 'vue'
import ProcessTrendPage from '../modules/process-management/ProcessTrendPage.vue'
import DiagnosisBoards from '../modules/process-management/DiagnosisBoards.vue'
import raw from './trend-preview-catalog.json'
import { makeCatalog, numeric } from '../modules/process-management/engine'
import { businessToday, type LegacyMetric, type ResultRow } from '../modules/process-management/types'
import { DAY, stamp, iso, type TrendDay } from '../modules/process-management/trend-data'
const catalog=raw as LegacyMetric[],metrics=makeCatalog(catalog),mode=ref('trend'),sidebarCollapsed=ref(false)
const days:TrendDay[]=Array.from({length:95},(_,i)=>{
 const date=iso(stamp(businessToday())-(94-i)*DAY)
 const rows:ResultRow[]=metrics.map((m,j)=>{
  const base=numeric(m.actual),missing=i===91&&j===0,zero=i===93&&m.name==='NO₃-N'
  const actual=missing?'':base===null?m.actual:String(Number((zero?0:m.name==='pH'?7.1+Math.sin(i*.8)*.18:base*(1+Math.sin(i*.7+j)*.11+Math.cos(i*.25)*.045)).toPrecision(4)))
  return {...m,actual,data:missing?'MISSING':'VALID',state:'reference',deviation:null,difference:null,explanation:'独立演示数据',source:'演示',rule:'演示数据，不作生产依据'}
 })
 return {date,rows,demo:true,version:1}
})
const last=computed(()=>days.at(-1)!.rows)
const modules=[{name:'管理驾驶舱',icon:'home'},{name:'GIS一张图',icon:'gis-map'},{name:'数字孪生',icon:'digital-twin'},{name:'经营管理',icon:'business'},{name:'生产运行',icon:'operations'},{name:'工艺管理',icon:'process'},{name:'设备管理',icon:'equipment'},{name:'化验管理',icon:'laboratory'},{name:'安全管理',icon:'safety'},{name:'库存管理',icon:'inventory'},{name:'过程评价',icon:'evaluation'},{name:'管理质量',icon:'quality'},{name:'提质增效',icon:'efficiency'},{name:'改进提升',icon:'improvement'},{name:'基础信息',icon:'information'}]
</script>
<template>
  <div class="app-shell trend-preview-shell" :class="{sidebarCollapsed}">
    <header class="global-topbar">
      <div class="topbar-brand"><div class="topbar-logo-art"><img src="/waterx-logo-on-dark.png" alt="WaterX" /></div><span>智慧水务运营平台</span></div>
      <div class="topbar-actions"><div class="topbar-project"><small>当前项目</small><select aria-label="当前项目"><option>第一污水处理厂</option></select></div></div>
    </header>
    <aside>
      <button class="sidebar-toggle" :aria-label="sidebarCollapsed?'展开导航':'收起导航'" @click="sidebarCollapsed=!sidebarCollapsed"><span><svg aria-hidden="true"><use :href="`/waterx-nav-icons.svg#chevron-${sidebarCollapsed?'right':'left'}`" /></svg></span><b>收起导航</b></button>
      <nav class="module-nav" aria-label="主导航">
        <section v-for="module in modules" :key="module.icon" class="nav-group">
          <div class="nav-group-title" :class="{expanded:module.icon==='process'}"><span class="nav-icon"><svg aria-hidden="true"><use :href="`/waterx-nav-icons.svg#${module.icon}`" /></svg></span><span>{{module.name}}</span><i v-if="module.icon==='process'"><svg aria-hidden="true"><use href="/waterx-nav-icons.svg#chevron-down" /></svg></i></div>
          <div v-if="module.icon==='process'" class="nav-children"><span class="preview-nav-item">工艺参数概览</span><span class="preview-nav-item">工艺设计标准</span><span class="preview-nav-item">工况矩阵管理</span><span class="preview-nav-item">运行数据填报</span><button :class="{selected:mode==='diagnosis'}" @click="mode='diagnosis'">工艺诊断分析</button><button :class="{selected:mode==='trend'}" @click="mode='trend'">工艺趋势分析</button><span class="preview-nav-item">工艺分析日报</span></div>
        </section>
      </nav>
    </aside>
    <main class="workspace"><article>
      <ProcessTrendPage v-if="mode==='trend'" site-id="trend-preview-only" site-name="第一污水处理厂（演示）" :legacy-metrics="catalog" :preview-days="days" />
      <template v-else><div class="preview-date">{{businessToday()}}<span>演示数据</span></div><DiagnosisBoards :rows="last" :configurable="false" /></template>
    </article></main>
  </div>
</template>
<style scoped>
.preview-nav-item{display:block;min-height:34px;padding:7px 9px;color:#c1e0ed;font-size:13px;line-height:1.45}.nav-group-title:not(.expanded){cursor:default}.preview-date{display:flex;justify-content:space-between;align-items:center;font-size:12px;color:var(--wx-n600);margin-bottom:8px}.preview-date>span{color:var(--wx-warning-strong)}
@media(max-width:900px){.trend-preview-shell .sidebar-toggle b{display:none}.trend-preview-shell .sidebar-toggle{padding:5px 0}}
</style>
