<script setup lang="ts">
withDefaults(defineProps<{
  as?: string
  kind?: 'loading' | 'empty' | 'error' | 'forbidden'
  compact?: boolean
}>(), {
  as: 'div',
  kind: 'empty',
  compact: false
})
</script>

<template>
  <component :is="as" :class="['wx-state', `is-${kind}`, { 'is-compact': compact }]" :role="kind === 'error' ? 'alert' : 'status'">
    <slot />
  </component>
</template>
