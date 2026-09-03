<script setup lang="ts">
withDefaults(defineProps<{
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  loading?: boolean
  disabled?: boolean
}>(), {
  type: 'button',
  variant: 'secondary',
  loading: false,
  disabled: false
})
</script>

<template>
  <button
    :type="type"
    :class="['wx-button', `is-${variant}`, { 'is-loading': loading }]"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
  >
    <span v-if="loading" class="wx-button-spinner" aria-hidden="true"></span>
    <slot />
  </button>
</template>
