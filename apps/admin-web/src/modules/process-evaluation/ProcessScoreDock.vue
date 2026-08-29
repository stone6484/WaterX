<script setup lang="ts">
import { PROCESS_MODULE_MAP } from './rules'
import type { ModuleResultSummary, ProcessModuleKey } from './types'

defineProps<{
  summaries: ModuleResultSummary[]
  selectedModule: ProcessModuleKey | null
}>()

const emit = defineEmits<{
  openResult: [taskId: string, module: ProcessModuleKey]
}>()
</script>

<template>
  <nav class="pe-score-dock" aria-label="过程评价模块评分导航">
    <button
      v-for="item in summaries"
      :key="item.module"
      type="button"
      class="pe-score-tile"
      :class="{ selected: selectedModule === item.module }"
      @click="item.taskId && emit('openResult', item.taskId, item.module)"
    >
      <span><b>{{ PROCESS_MODULE_MAP.get(item.module)?.shortName }}</b><em class="pe-status" :class="`is-${item.status}`">{{ item.status }}</em></span>
      <strong>{{ item.score === null ? '待检查' : item.score.toFixed(1) }}<small v-if="item.score !== null"> / 100</small></strong>
      <div class="pe-progress"><i :style="{ width: `${item.score || 0}%` }"></i></div>
      <small>{{ item.evaluationDate || '暂无评价' }} · {{ item.completed }}/{{ item.applicable }} 项完成</small>
    </button>
  </nav>
</template>
