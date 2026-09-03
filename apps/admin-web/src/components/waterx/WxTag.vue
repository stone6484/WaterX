<script setup lang="ts">
withDefaults(defineProps<{ tone?: 'neutral' | 'normal' | 'warning' | 'alarm' }>(), { tone: 'neutral' })
</script>

<template>
  <span :class="['wx-tag', `is-${tone}`]"><slot /></span>
</template>
