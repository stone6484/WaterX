<script setup lang="ts">
import { ref, watch } from 'vue'
import { efficiencyTopics, efficiencyUnits, type EfficiencyPageId } from './navigation'

const props = defineProps<{ active: string }>()
const emit = defineEmits<{ navigate: [page: EfficiencyPageId] }>()
const unitsOpen = ref(false)
const topicsOpen = ref(true)
watch(() => props.active, page => {
  if (efficiencyUnits.some(item => item.id === page)) unitsOpen.value = true
  if (efficiencyTopics.some(item => item.id === page)) topicsOpen.value = true
}, { immediate: true })
</script>

<template>
  <div class="efficiency-nav" role="group" aria-label="提质增效分类导航">
    <button :class="{ selected: active === 'efficiencyOverview' }" :aria-current="active === 'efficiencyOverview' ? 'page' : undefined" @click="emit('navigate', 'efficiencyOverview')">提质增效总览</button>
    <button class="efficiency-nav-group" :aria-expanded="unitsOpen" aria-controls="efficiency-unit-links" @click="unitsOpen = !unitsOpen">
      <span>单体分析</span><svg aria-hidden="true"><use :href="`/waterx-nav-icons.svg#chevron-${unitsOpen ? 'down' : 'right'}`" /></svg>
    </button>
    <div v-show="unitsOpen" id="efficiency-unit-links" class="efficiency-nav-items" role="group" aria-label="单体分析">
      <button v-for="item in efficiencyUnits" :key="item.id" :class="{ selected: active === item.id }" :aria-current="active === item.id ? 'page' : undefined" @click="emit('navigate', item.id)">{{ item.name }}</button>
    </div>
    <button class="efficiency-nav-group" :aria-expanded="topicsOpen" aria-controls="efficiency-topic-links" @click="topicsOpen = !topicsOpen">
      <span>全厂分析</span><svg aria-hidden="true"><use :href="`/waterx-nav-icons.svg#chevron-${topicsOpen ? 'down' : 'right'}`" /></svg>
    </button>
    <div v-show="topicsOpen" id="efficiency-topic-links" class="efficiency-nav-items" role="group" aria-label="全厂分析">
      <button v-for="item in efficiencyTopics" :key="item.id" :class="{ selected: active === item.id }" :aria-current="active === item.id ? 'page' : undefined" @click="emit('navigate', item.id)"><span>{{ item.name }}</span></button>
    </div>
    <button :class="{ selected: active === 'efficiencyTasks' }" :aria-current="active === 'efficiencyTasks' ? 'page' : undefined" @click="emit('navigate', 'efficiencyTasks')"><span>优化任务</span><small>规划</small></button>
    <button :class="{ selected: active === 'efficiencyResults' }" :aria-current="active === 'efficiencyResults' ? 'page' : undefined" @click="emit('navigate', 'efficiencyResults')"><span>效果台账</span><small>规划</small></button>
  </div>
</template>

<style scoped>
.efficiency-nav,.efficiency-nav-items { display:grid; gap:2px; min-width:0; }
.efficiency-nav-items { margin-left:6px; padding-left:6px; border-left:1px solid var(--wx-deep-600); }
.efficiency-nav button { display:flex; align-items:center; justify-content:space-between; gap:4px; width:100%; min-width:0; overflow-wrap:anywhere; }
.efficiency-nav-items button { padding-left:5px; padding-right:5px; }
.efficiency-nav .efficiency-nav-group { color:var(--wx-n0); font-weight:500; margin-top:4px; }
.efficiency-nav button small { float:none; flex-shrink:0; color:var(--wx-n300); font-size:10px; }
.efficiency-nav svg { flex-shrink:0; width:14px; height:14px; fill:none; stroke:currentColor; stroke-width:1.7; }
.efficiency-nav button:focus-visible { outline:2px solid var(--wx-blue-400); outline-offset:-2px; }
</style>
