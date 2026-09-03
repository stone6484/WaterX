<script setup lang="ts">
withDefaults(defineProps<{ as?: string }>(), { as: 'section' })
</script>

<template>
  <component :is="as" class="wx-card"><slot /></component>
</template>
