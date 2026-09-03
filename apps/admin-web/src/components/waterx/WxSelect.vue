<script setup lang="ts">
withDefaults(defineProps<{
  modelValue?: string
  disabled?: boolean
}>(), {
  modelValue: '',
  disabled: false
})

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

function updateValue(event: Event) {
  emit('update:modelValue', (event.target as HTMLSelectElement).value)
}
</script>

<template>
  <select class="wx-select" :value="modelValue" :disabled="disabled" @change="updateValue"><slot /></select>
</template>
