<script setup lang="ts">
defineProps<{
  label: string
  help?: string
  required?: boolean
}>()
</script>

<template>
  <label class="wx-field">
    <span class="wx-field-label">{{ label }}<i v-if="required" aria-hidden="true">*</i></span>
    <span class="wx-field-control"><slot /></span>
    <small v-if="help" class="wx-field-help">{{ help }}</small>
  </label>
</template>
