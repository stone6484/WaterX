<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
const props = defineProps<{ headers: string[]; widths: number[]; label: string }>()
const host = ref<HTMLElement | null>(null), body = ref<HTMLElement | null>(null), available = ref(0), gutter = ref(0)
const minimum = computed(() => props.widths.reduce((a, b) => a + b, 0))
const columnStyle = (w: number) => ({ width: `${w + Math.max(0, available.value - minimum.value - gutter.value) / props.widths.length}px` })
let observer: ResizeObserver | null = null
onMounted(() => { observer = new ResizeObserver(() => { available.value = host.value?.clientWidth || 0; gutter.value = body.value ? body.value.offsetWidth - body.value.clientWidth : 0 }); if (host.value) observer.observe(host.value); if (body.value) observer.observe(body.value) })
onBeforeUnmount(() => observer?.disconnect())
</script>
<template>
  <div ref="host" class="wp-grid-scroll" tabindex="0" role="region" :aria-label="label+'，可局部横向滚动'"><div :style="{minWidth:(minimum+gutter)+'px'}">
    <div :style="{paddingRight:gutter+'px'}" aria-hidden="true"><table class="wp-grid-table"><colgroup><col v-for="(w,i) in widths" :key="i" :style="columnStyle(w)" /></colgroup><thead><tr><th v-for="h in headers" :key="h">{{ h }}</th></tr></thead></table></div>
    <div ref="body" class="wp-grid-body" tabindex="0" role="region" :aria-label="label+'记录，可上下滚动'"><table class="wp-grid-table" :aria-label="label"><colgroup><col v-for="(w,i) in widths" :key="i" :style="columnStyle(w)" /></colgroup><thead class="wp-sr"><tr><th v-for="h in headers" :key="h" scope="col">{{ h }}</th></tr></thead><tbody><slot /></tbody></table></div>
  </div></div>
</template>
<style scoped>
.wp-grid-scroll{min-width:0;overflow-x:auto}.wp-grid-table{width:100%;table-layout:fixed;border-collapse:collapse}.wp-grid-table :deep(th),.wp-grid-table :deep(td){padding:10px 12px;text-align:left;vertical-align:middle;border:0;border-bottom:1px solid var(--wx-border-default);overflow-wrap:anywhere;box-sizing:border-box}.wp-grid-table th{height:44px;background:var(--wx-n25);border-top:1px solid var(--wx-border-default);font-weight:500;color:var(--wx-n500)}.wp-grid-table :deep(td){height:60px}.wp-grid-table :deep(td small){display:block}.wp-grid-body{overflow-y:auto;overflow-x:hidden;max-height:52vh;overscroll-behavior:contain}.wp-grid-body::-webkit-scrollbar{width:var(--wx-scrollbar-size)}.wp-grid-scroll::-webkit-scrollbar{height:var(--wx-scrollbar-horizontal-size)}.wp-grid-body::-webkit-scrollbar-thumb,.wp-grid-scroll::-webkit-scrollbar-thumb{background:var(--wx-n200);border-radius:99px}.wp-grid-body::-webkit-scrollbar-track,.wp-grid-scroll::-webkit-scrollbar-track{background:transparent}.wp-sr{position:absolute;width:1px;height:1px;clip-path:inset(50%);overflow:hidden}.wp-grid-scroll:focus-visible,.wp-grid-body:focus-visible{outline:2px solid var(--wx-blue-600);outline-offset:-2px}@supports not selector(::-webkit-scrollbar){.wp-grid-body,.wp-grid-scroll{scrollbar-width:thin}}
</style>
