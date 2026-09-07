<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { WxTableSurface } from '../../components/waterx'
import { type ResultRow, stateLabels, dataLabels } from './types'

const props = withDefaults(defineProps<{ rows: ResultRow[]; meanings?: Record<string, string>; configurable?: boolean }>(), { meanings: () => ({}), configurable: true })
const emit = defineEmits<{ detail: [row: ResultRow]; configure: [] }>()
const left = ref('进水水质'), right = ref('水量控制')
const host = ref<HTMLElement | null>(null)
const availableWidths = ref<number[]>([])
const uid = useId()
const processCategories = ['水量控制', '曝气控制', '回流控制', '排泥控制', '加药控制', '搅拌控制']
const headers = ['指标', '单位', '设计值', '目标值', '实际值', '偏差 / 状态', '指标意义']
const boards = computed(() => [false, true].map(process => {
  const rows = props.rows.filter(r => processCategories.includes(r.category) === process)
  const categories = [...new Set(rows.map(r => r.category))]
  const selection = process ? right.value : left.value
  const active = categories.includes(selection) ? selection : categories[0]
  const visible = rows.filter(r => r.category === active)
  // Only the active category influences widths. Extra space is shared, never dumped into the first column.
  const width = (value: string) => [...value].reduce((n, c) => n + (/[^\x00-\xff]/.test(c) ? 12 : 7), 0) + 14
  const widest = (pick: (r: ResultRow) => string, floor: number, cap: number) =>
    Math.min(cap, Math.max(floor, ...visible.map(r => width(pick(r)))))
  const columns = [
    widest(r => r.name, 70, 200), widest(r => r.unit, 48, 170),
    widest(r => r.design, 50, 110), widest(r => r.target, 50, 130),
    widest(r => r.actual, 66, 150), 86, 94,
  ]
  const minimum = columns.reduce((sum, n) => sum + n, 0)
  return { process, categories, active, rows: visible, columns, minimum,
    counts: Object.fromEntries(categories.map(name => [name, {
      warning: rows.filter(r => r.category === name && r.state === 'warning').length,
      alarm: rows.filter(r => r.category === name && r.state === 'alarm').length,
    }])) }
}))
const columnStyle = (width: number, minimum: number, boardIndex: number) => ({ width: `${width + Math.max(0, (availableWidths.value[boardIndex] || minimum) - minimum) / headers.length}px` })
const quantitative = (r: ResultRow) => r.data === 'VALID' && !['pending', 'reference'].includes(r.state) && r.deviation !== null && Number.isFinite(r.deviation)
const inRange = (r: ResultRow) => r.state === 'normal' && r.explanation.startsWith('范围内')
const deviationText = (r: ResultRow) => `${r.deviation! > 0 ? '+' : ''}${r.deviation!.toFixed(1)}%`
// Same visual scale as the frozen diagnostic board. This never calculates or changes business severity.
const barWidth = (r: ResultRow) => `${Math.min(100, Math.max(8, Math.abs(r.deviation!)))}%`
const statusText = (r: ResultRow) => r.data !== 'VALID' ? dataLabels[r.data] : inRange(r) ? '范围内' : r.explanation === '文本一致' ? '文本一致' : stateLabels[r.state]
function selectTab(process: boolean, name: string) {
  if (process) right.value = name
  else left.value = name
}
function tabKey(event: KeyboardEvent, process: boolean, names: string[], index: number) {
  const move = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
  if (!move && !['Home', 'End'].includes(event.key)) return
  event.preventDefault()
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? names.length - 1 : (index + move + names.length) % names.length
  selectTab(process, names[next]!)
  const buttons = (event.currentTarget as HTMLElement).parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
  buttons?.[next]?.focus()
}
let observer: ResizeObserver | undefined
function alignHeaders() {
  host.value?.querySelectorAll<HTMLElement>('.pm-board').forEach((board, i) => {
    const body = board.querySelector<HTMLElement>('.pm-board-body')
    const viewport = board.querySelector<HTMLElement>('.pm-board-table')
    if (body && viewport) {
      const gutter = body.offsetWidth - body.clientWidth
      board.style.setProperty('--pm-body-gutter', `${gutter}px`)
      availableWidths.value[i] = viewport.getBoundingClientRect().width - gutter
    }
  })
}
onMounted(() => {
  observer = new ResizeObserver(alignHeaders)
  host.value?.querySelectorAll('.pm-board-body,.pm-board-table').forEach(node => observer!.observe(node))
  alignHeaders()
})
watch(() => props.rows, () => nextTick(alignHeaders))
onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <div ref="host" class="pm-diagnosis-boards pm-no-print">
    <WxTableSurface v-for="(board, bi) in boards" :key="String(board.process)" class="pm-board">
      <div class="pm-board-tabs" :aria-label="board.process ? '关键控制分类' : '结果指标分类'" role="tablist">
        <button v-for="(name, i) in board.categories" :id="`${uid}-tab-${bi}-${i}`" :key="name" role="tab"
          :aria-controls="`${uid}-panel-${bi}`" :aria-selected="board.active === name" :tabindex="board.active === name ? 0 : -1"
          :class="{selected: board.active === name}" @click="selectTab(board.process, name)" @keydown="tabKey($event, board.process, board.categories, i)">
          <span class="pm-tab-title">{{ name }}</span>
          <span v-if="board.counts[name]!.warning || board.counts[name]!.alarm" class="pm-tab-counts">
            <i v-if="board.counts[name]!.warning" class="warning" :aria-label="`预警 ${board.counts[name]!.warning} 项`">{{ board.counts[name]!.warning }}</i>
            <i v-if="board.counts[name]!.alarm" class="alarm" :aria-label="`告警 ${board.counts[name]!.alarm} 项`">{{ board.counts[name]!.alarm }}</i>
          </span>
        </button>
      </div>
      <div :id="`${uid}-panel-${bi}`" class="pm-board-table" role="tabpanel"
        :aria-labelledby="board.active ? `${uid}-tab-${bi}-${board.categories.indexOf(board.active)}` : undefined"
        :aria-label="board.active ? undefined : `${board.process ? '关键控制' : '结果指标'}，无匹配数据`" tabindex="0">
        <div :style="{minWidth: `calc(${board.minimum}px + var(--pm-body-gutter))`}">
          <div class="pm-fixed-head">
            <table class="pm-table" aria-hidden="true"><colgroup><col v-for="(w,i) in board.columns" :key="i" :style="columnStyle(w,board.minimum,bi)"></colgroup>
              <thead><tr><th v-for="(label,i) in headers" :key="label"><div v-if="i===6" class="pm-meaning-head">{{ label }}</div><template v-else>{{ label }}</template></th></tr></thead>
            </table>
            <button v-if="configurable" class="pm-board-configure" :aria-label="board.process ? '配置关键控制指标' : '配置结果指标'" @click="emit('configure')" title="配置指标">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9.6 3-.6 2.2-2 .9-2-.6-2 3.4 1.5 1.6-.2 2.3L3 14.4l2 3.4 2.2-.5 1.8 1.3.6 2.4h4.8l.6-2.4 1.8-1.3 2.2.5 2-3.4-1.3-1.6-.2-2.3L21 8.9l-2-3.4-2 .6-2-.9L14.4 3Z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
          <div class="pm-board-body" role="region" :aria-label="`${board.active || '指标'}记录，可上下滚动`" tabindex="0">
            <table class="pm-table" :aria-label="`${board.process ? '关键控制' : '结果指标'}：${board.active || '无数据'}`">
              <colgroup><col v-for="(w,i) in board.columns" :key="i" :style="columnStyle(w,board.minimum,bi)"></colgroup>
              <thead class="pm-accessible-head"><tr><th v-for="label in headers" :key="label" scope="col">{{label}}</th></tr></thead>
              <tbody>
                <tr v-for="r in board.rows" :key="r.id">
                  <td><button class="pm-link" :aria-label="`查看${r.category}${r.name}规则与来源`" @click="emit('detail',r)">{{r.name}}</button><small>{{r.code}}</small></td>
                  <td>{{r.unit}}</td><td>{{r.design}}</td><td>{{r.target}}</td>
                  <td><strong>{{r.actual || '未取得'}}</strong><small>{{r.data==='VALID' ? r.source : dataLabels[r.data]}}</small></td>
                  <td>
                    <div v-if="quantitative(r) && !inRange(r)" class="pm-deviation" :class="r.state" :aria-label="`${stateLabels[r.state]}，偏差 ${deviationText(r)}`" :title="stateLabels[r.state]">
                      <b>{{deviationText(r)}}</b><span class="pm-deviation-track" aria-hidden="true"><i :style="{width:barWidth(r)}"></i></span>
                    </div>
                    <template v-else><span class="pm-range-chip" :class="r.state" :title="r.explanation">{{statusText(r)}}</span><small v-if="r.data==='VALID' && r.difference!==null && !inRange(r)">差值 {{r.difference}} {{r.unit}}</small></template>
                  </td>
                  <td class="pm-meaning">{{meanings[r.id] || '—'}}</td>
                </tr>
                <tr v-if="!board.rows.length"><td colspan="7" class="pm-empty">当前没有符合条件的指标</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </WxTableSurface>
  </div>
</template>

<style scoped>
.pm-diagnosis-boards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--wx-board-gap)}
.pm-board{position:relative;min-width:0;--pm-body-gutter:0px}
.pm-board-tabs{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:0;margin:0;overflow:visible}
.pm-board-tabs button{min-width:0;height:var(--wx-table-row-height);display:flex;flex-wrap:wrap;align-content:center;align-items:center;justify-content:center;gap:2px 4px;padding:2px 3px;border:1px solid transparent;border-top:3px solid transparent;border-bottom:0;border-radius:14px 14px 0 0;background:var(--wx-n0);color:var(--wx-n700);font:inherit;font-size:12px;line-height:14px;cursor:pointer}
.pm-tab-title{white-space:nowrap}
.pm-board-tabs button:hover{background:var(--wx-n25);border-color:var(--wx-n200);border-top-color:var(--wx-n200)}
.pm-board-tabs button.selected{background:var(--wx-n25);border-color:var(--wx-n300);border-top-color:var(--wx-blue-500);color:var(--wx-blue-700);font-weight:600}
.pm-board-tabs .pm-tab-title,.pm-board-tabs .pm-tab-counts{margin:0;padding:0;background:none;border-radius:0;color:inherit;font-size:inherit}
.pm-tab-counts{display:inline-flex;gap:3px}
.pm-tab-counts i{width:14px;height:14px;display:grid;place-items:center;border-radius:50%;color:var(--wx-n0);font:600 8px/1 Inter,sans-serif}
.pm-tab-counts i.warning{background:var(--wx-warning);color:var(--wx-n0)}
.pm-tab-counts i.alarm{background:var(--wx-danger);color:var(--wx-n0)}
.pm-board-table{overflow-x:auto;outline:0;scrollbar-width:auto;scrollbar-color:auto}
.pm-fixed-head{position:relative;padding-right:var(--pm-body-gutter);background:var(--wx-n25);border-top:var(--wx-border-subtle);border-bottom:var(--wx-border-subtle)}
.pm-board .pm-table{width:100%;table-layout:fixed;border-collapse:collapse;color:var(--wx-n700);font-size:12px}
.pm-board .pm-table th,.pm-board .pm-table td{padding:7px;border:0;border-bottom:var(--wx-border-subtle);text-align:left;line-height:1.45;overflow-wrap:anywhere}
.pm-board .pm-table th{position:static;height:calc(var(--wx-table-row-height) - 2px);background:var(--wx-n25);font-weight:400;color:var(--wx-n600);border:0}
.pm-board .pm-table td{height:var(--wx-table-row-complex)}
.pm-board .pm-table strong{color:var(--wx-n800);font-size:13px;font-weight:600}
.pm-board .pm-link{font-size:12px;color:var(--wx-n700)!important;font-weight:500;line-height:1.45}
.pm-board .pm-link:hover{color:var(--wx-blue-700)!important}
.pm-board .pm-table small{font-size:10px;color:var(--wx-n500);line-height:1.45;margin-top:3px}
.pm-board .pm-meaning{color:var(--wx-n500)}
.pm-board-body{max-height:52vh;overflow-y:auto;overflow-x:hidden;scrollbar-width:auto;scrollbar-color:auto;overscroll-behavior:contain}
.pm-board-table::-webkit-scrollbar{height:var(--wx-scrollbar-horizontal-size)}
.pm-board-body::-webkit-scrollbar{width:var(--wx-scrollbar-size)}
.pm-board-table::-webkit-scrollbar-track,.pm-board-body::-webkit-scrollbar-track{background:transparent}
.pm-board-table::-webkit-scrollbar-thumb,.pm-board-body::-webkit-scrollbar-thumb{background:var(--wx-n200);border-radius:99px}
.pm-accessible-head{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
.pm-deviation{display:grid;gap:4px}
.pm-deviation b{font-size:11px;font-weight:600;white-space:nowrap}
.pm-deviation.normal{color:var(--wx-success-strong)}
.pm-deviation.warning{color:var(--wx-warning-strong)}
.pm-deviation.alarm{color:var(--wx-danger-strong)}
.pm-deviation-track{height:3px;background:var(--wx-n100);border-radius:99px;overflow:hidden}
.pm-deviation-track i{display:block;height:100%;background:var(--wx-success);border-radius:inherit}
.pm-deviation.warning .pm-deviation-track i{background:var(--wx-warning)}
.pm-deviation.alarm .pm-deviation-track i{background:var(--wx-danger)}
.pm-range-chip{display:inline-block;border:var(--wx-border-default);border-radius:99px;padding:2px 7px;color:var(--wx-n600);background:var(--wx-n25);font-size:11px}
.pm-range-chip.normal{color:var(--wx-success-strong);border-color:var(--wx-success-border);background:var(--wx-success-bg)}
.pm-range-chip.warning{color:var(--wx-warning-strong);border-color:var(--wx-warning-border);background:var(--wx-warning-bg)}
.pm-range-chip.alarm{color:var(--wx-danger-strong);border-color:var(--wx-danger-border);background:var(--wx-danger-bg)}
.pm-board-configure{position:absolute;top:50%;transform:translateY(-50%);right:calc(var(--pm-body-gutter) + 4px);width:23px;height:23px;padding:1px;border:0;background:transparent;color:var(--wx-blue-700);cursor:pointer}
.pm-board-configure svg{width:21px;height:21px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
.pm-meaning-head{padding-right:24px}
.pm-board button:focus-visible,.pm-board-table:focus-visible,.pm-board-body:focus-visible{outline:2px solid var(--wx-blue-600);outline-offset:-2px}
@supports not selector(::-webkit-scrollbar){.pm-board-body,.pm-board-table{scrollbar-width:thin;scrollbar-color:var(--wx-n200) transparent}}
@media(max-width:1050px){.pm-diagnosis-boards{grid-template-columns:minmax(0,1fr)}}
</style>
