<script setup lang="ts">
type WaterXStatusTone = 'normal' | 'warning' | 'alarm' | 'info' | 'muted'
type WaterXStatusItem = { label: string; value: string | number; tone: WaterXStatusTone }

defineProps<{
  items: WaterXStatusItem[]
  ariaLabel?: string
}>()
</script>

<template>
  <div class="wx-status-summary" role="status" :aria-label="ariaLabel || '状态汇总'">
    <span v-for="item in items" :key="`${item.tone}-${item.label}`">
      <i :class="['wx-status-dot', `is-${item.tone}`]" aria-hidden="true"></i>{{ item.value }} {{ item.label }}
    </span>
  </div>
</template>
