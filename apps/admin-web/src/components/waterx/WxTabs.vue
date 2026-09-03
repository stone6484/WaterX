<script setup lang="ts">
defineProps<{ ariaLabel?: string }>()
</script>

<template>
  <nav class="wx-tabs" :aria-label="ariaLabel"><slot /></nav>
</template>
