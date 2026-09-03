<script setup lang="ts">
withDefaults(defineProps<{
  modelValue?: string
  type?: string
  disabled?: boolean
}>(), {
  modelValue: '',
  type: 'text',
  disabled: false
})

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

function updateValue(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}
</script>

<template>
  <input class="wx-input" :type="type" :value="modelValue" :disabled="disabled" @input="updateValue" />
</template>
