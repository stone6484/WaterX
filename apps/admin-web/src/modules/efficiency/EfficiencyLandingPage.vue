<script setup lang="ts">
import { computed } from 'vue'
import { WxCard, WxState } from '../../components/waterx'
import { efficiencyPlanningPages, efficiencyTopics, efficiencyUnits, type EfficiencyPageId, type EfficiencyPlanningPageId } from './navigation'

const props = defineProps<{ page: EfficiencyPlanningPageId }>()
const emit = defineEmits<{ navigate: [page: EfficiencyPageId] }>()
const definition = computed(() => efficiencyPlanningPages[props.page])
</script>

<template>
  <section class="efficiency-landing" aria-label="提质增效工作区">
    <header class="efficiency-heading"><div><h1>{{ definition.title }}</h1><p>{{ definition.purpose }}</p></div><span>{{ page === 'efficiencyOverview' ? '分类入口 · 汇总待接入' : '规划中 · 尚未接入' }}</span></header>
    <WxState compact>{{ definition.limitation }}</WxState>
    <template v-if="page === 'efficiencyOverview'">
      <WxCard class="efficiency-section"><header><h2>单体分析</h2><span>已有演示原型</span></header><div class="efficiency-links">
        <button v-for="item in efficiencyUnits" :key="item.id" @click="emit('navigate', item.id)"><span>{{ item.name }}</span><span aria-hidden="true">→</span></button>
      </div><p>保留原页面、五页签和本地演示记录；不代表已接入真实生产数据。</p></WxCard>
      <WxCard class="efficiency-section"><header><h2>全厂分析</h2><span>分批本地实现</span></header><div class="efficiency-links">
        <button v-for="item in efficiencyTopics" :key="item.id" @click="emit('navigate', item.id)"><span>{{ item.name }}</span><small>进入核算 →</small></button>
      </div></WxCard>
      <WxCard class="efficiency-section"><header><h2>优化与效果</h2><span>同源闭环规划</span></header><div class="efficiency-links">
        <button @click="emit('navigate', 'efficiencyTasks')"><span>优化任务</span><small>查看范围 →</small></button>
        <button @click="emit('navigate', 'efficiencyResults')"><span>效果台账</span><small>查看范围 →</small></button>
      </div></WxCard>
    </template>
    <WxCard v-else class="efficiency-section"><header><h2>已确定的建设范围</h2><span>功能待实施</span></header><ul><li v-for="item in definition.scope" :key="item">{{ item }}</li></ul><p>本页用于确认分类与业务边界，暂不提供填报、计算、任务保存或收益汇总。</p></WxCard>
  </section>
</template>

<style scoped>
.efficiency-landing { display:grid; gap:16px; color:var(--wx-n700); font-size:13px; min-width:0; }
.efficiency-heading { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; }
.efficiency-landing header { background:transparent; padding:0; border:0; box-shadow:none; }
.efficiency-heading h1 { font-size:20px; margin:0 0 8px; color:var(--wx-n800); }
.efficiency-heading p,.efficiency-section p { margin:0; line-height:1.7; color:var(--wx-n500); }
.efficiency-heading>span { color:var(--wx-n500); font-size:12px; flex-shrink:0; }
.efficiency-section { padding:16px; }
.efficiency-section header { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:12px; }
.efficiency-section h2 { font-size:14px; margin:0; font-weight:600; }
.efficiency-section header>span { font-size:12px; color:var(--wx-n500); }
.efficiency-links { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; }
.efficiency-links button { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:12px; min-width:0; text-align:left; font:inherit; color:var(--wx-n700); border:1px solid var(--wx-border-default); border-radius:8px; background:var(--wx-n0); cursor:pointer; }
.efficiency-links button:hover { background:var(--wx-n25); border-color:var(--wx-blue-500); }
.efficiency-links button:focus-visible { outline:2px solid var(--wx-blue-500); outline-offset:2px; }
.efficiency-links small { flex-shrink:0; color:var(--wx-blue-700); font-size:12px; }
.efficiency-section ul { padding-left:20px; margin:0 0 12px; line-height:2; }
.efficiency-links+p { margin-top:12px; }
@media(max-width:700px) { .efficiency-heading { flex-direction:column; gap:8px; } .efficiency-links { grid-template-columns:minmax(0,1fr); } }
</style>
