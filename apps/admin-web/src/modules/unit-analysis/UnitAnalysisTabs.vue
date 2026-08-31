<script setup lang="ts">
import type { UnitAnalysisTab, UnitTabDefinition } from './types'

defineProps<{ modelValue: UnitAnalysisTab; tabs: UnitTabDefinition[]; label: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: UnitAnalysisTab] }>()
</script>

<template>
  <nav class="hsc-tabs" :aria-label="label">
    <button v-for="tab in tabs" :key="tab.id" type="button" :class="{selected:modelValue===tab.id}" @click="emit('update:modelValue',tab.id)"><b>{{tab.name}}</b><small>{{tab.note}}</small></button>
  </nav>
</template>
