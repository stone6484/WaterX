<script setup lang="ts">
import { useId } from 'vue'

withDefaults(defineProps<{
  label: string
  help?: string
  error?: string
  layout?: 'inline' | 'stacked'
  required?: boolean
}>(), { layout: 'inline' })

const controlId = useId()
const messageId = `${controlId}-message`
</script>

<template>
  <label :class="['wx-field', `is-${layout}`, { 'has-error': !!error }]">
    <span class="wx-field-label">{{ label }}<i v-if="required" aria-hidden="true">*</i></span>
    <span class="wx-field-control"><slot :control-props="{ id: controlId, required: required || undefined, 'aria-invalid': error ? 'true' : undefined, 'aria-describedby': error || help ? messageId : undefined }" /></span>
    <small v-if="error || help" :id="messageId" :class="['wx-field-help', { 'wx-field-error': !!error }]" :role="error ? 'alert' : undefined">{{ error || help }}</small>
  </label>
</template>
