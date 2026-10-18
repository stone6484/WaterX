<script setup lang="ts">
import { computed, nextTick, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { WxTableSurface } from '../../components/waterx'
import { groupMetricBoards } from './metric-boards'
import type { Metric } from './types'
import { dataLabels } from './types'
import { DAY, stamp, iso, pointValue, linePath, selectedIds, type TrendDay } from './trend-data'
const props=defineProps<{metrics:Metric[];days:TrendDay[];from:string;to:string;scope:string}>()
const host=ref<HTMLElement|null>(null)
const activeUnit=ref('')
const tooltip=ref<HTMLElement|null>(null)
const tooltipPosition=ref({left:'0px',top:'0px',visibility:'hidden' as 'hidden'|'visible'})
function setTooltip(element:unknown){tooltip.value=element as HTMLElement|null}
function closeOutside(event:PointerEvent){host.value?.querySelectorAll<HTMLDetailsElement>('.trend-picker[open]').forEach(picker=>{if(!picker.contains(event.target as Node))picker.open=false})}
onMounted(()=>document.addEventListener('pointerdown',closeOutside))
onBeforeUnmount(()=>document.removeEventListener('pointerdown',closeOutside))
const left=ref('进水水质'),right=ref('水量控制'),selection=ref<Record<string,string[]>>({}),storageError=ref('')
const hover=ref<Record<string,string>>({})
const colors=['#2677B8','#E38930','#39A18C','#8B6AC8','#D66783','#527C90','#A28A36','#5E9AC0','#BD6A45','#6C8D56','#A8649B','#6172AF','#4F9BBA','#B79D69','#68605C','#C58F96','#507D72','#A77E4D','#707BB4','#9874A0']
const key=()=>`waterx-process-trend-selection:v1:${props.scope}`
watch(()=>props.scope,()=>{selection.value={};storageError.value='';hover.value={};try{const raw=localStorage.getItem(key());const parsed=raw?JSON.parse(raw):{};if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed))selection.value=parsed;else throw Error()}catch{storageError.value='指标偏好读取失败，当前按全选显示；原记录未覆盖。'}},{immediate:true})
function chosen(category:string,metrics:Metric[]){return selectedIds(metrics,selection.value[category])}
function select(category:string,metrics:Metric[],id?:string){
  const ids=chosen(category,metrics);selection.value={...selection.value,[category]:id?(ids.includes(id)?ids.filter(v=>v!==id):[...ids,id]):metrics.map(m=>m.id)}
  try{localStorage.setItem(key(),JSON.stringify(selection.value));storageError.value=''}catch{storageError.value='勾选已应用，但浏览器未能保存偏好，下次打开可能无法恢复。'}
}
function clear(category:string){selection.value={...selection.value,[category]:[]};try{localStorage.setItem(key(),JSON.stringify(selection.value));storageError.value=''}catch{storageError.value='浏览器未能保存偏好。'}}
const boards=computed(()=>groupMetricBoards(props.metrics,left.value,right.value).map(board=>{
  const selected=chosen(board.active||'',board.rows),visible=board.rows.filter(m=>selected.includes(m.id))
  const units=[...new Set(visible.filter(m=>!m.text).map(m=>m.unit))]
  return {...board,selected,visible,groups:units.map(unit=>{
    const metrics=visible.filter(m=>!m.text&&m.unit===unit)
    const values=props.days.flatMap(d=>metrics.map(m=>pointValue(d.rows.find(r=>r.id===m.id),m.unit))).filter((v):v is number=>v!==null)
    const low=values.length?values.reduce((a,b)=>Math.min(a,b),Infinity):0,high=values.length?values.reduce((a,b)=>Math.max(a,b),-Infinity):1,pad=(high-low||Math.max(Math.abs(high),1))*.12
    return {unit,metrics,min:low>=0?Math.max(0,low-pad):low-pad,max:high+pad,hasValues:values.length>0}
  })}
}))
function x(date:string){return 58+(stamp(date)-stamp(props.from))/Math.max(DAY,stamp(props.to)-stamp(props.from))*510}
function y(value:number,group:{min:number;max:number}){return 162-(value-group.min)/(group.max-group.min)*132}
function pointer(event:PointerEvent,category:string,unit:string){
  const key=category+unit
  if(activeUnit.value!==key)tooltipPosition.value.visibility='hidden'
  activeUnit.value=key
  const svg=event.currentTarget as SVGSVGElement,box=svg.getBoundingClientRect()
  const ratio=Math.max(0,Math.min(1,((event.clientX-box.left)/box.width*600-58)/510))
  hover.value[category]=iso(stamp(props.from)+Math.round(ratio*(stamp(props.to)-stamp(props.from))/DAY)*DAY)
  const {clientX,clientY}=event
  void nextTick(()=>{
    if(!tooltip.value||activeUnit.value!==key)return
    const {width,height}=tooltip.value.getBoundingClientRect(),gap=16,edge=8
    const viewport=document.documentElement
    const maxX=viewport.clientWidth-edge-width,maxY=viewport.clientHeight-edge-height
    let left=clientX+gap
    if(left>maxX)left=clientX-gap-width
    left=Math.max(edge,Math.min(left,maxX))
    let top=Math.max(edge,Math.min(clientY+gap,maxY))
    // If neither horizontal side fits, place the card above or below the pointer.
    if(clientX>=left&&clientX<=left+width){
      top=clientY+gap+height<=viewport.clientHeight-edge?clientY+gap:clientY-gap-height
    }
    tooltipPosition.value={left:`${left}px`,top:`${Math.max(edge,Math.min(top,maxY))}px`,visibility:'visible'}
  })
}
const ticks=computed(()=>[...new Set([0,.25,.5,.75,1].map(r=>iso(stamp(props.from)+Math.round((stamp(props.to)-stamp(props.from))/DAY*r)*DAY)))])
const color=(rows:Metric[],id:string)=>colors[rows.findIndex(m=>m.id===id)%colors.length]
const displayDay=(category:string)=>hover.value[category]||props.to
function reading(category:string,id:string){const d=props.days.find(d=>d.date===displayDay(category)),row=d?.rows.find(r=>r.id===id);return row?(row.data==='VALID'?((row.actual||'未取得')):`${row.actual?row.actual+' · ':''}${dataLabels[row.data]}`):'数据缺失'}
function readingUnit(category:string,id:string){return props.days.find(d=>d.date===displayDay(category))?.rows.find(r=>r.id===id)?.unit||props.metrics.find(m=>m.id===id)?.unit}
function tabKey(event:KeyboardEvent,process:boolean,names:string[],index:number){if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?names.length-1:(index+(event.key==='ArrowRight'?1:-1)+names.length)%names.length;if(process)right.value=names[next];else left.value=names[next];(event.currentTarget as HTMLElement).parentElement?.querySelectorAll<HTMLButtonElement>('button')[next]?.focus()}
</script>
<template>
  <p v-if="storageError" role="status" class="trend-warning">{{storageError}}</p>
  <div ref="host" class="pm-diagnosis-boards trend-boards">
    <WxTableSurface v-for="board in boards" :key="String(board.process)" class="pm-board">
      <div class="pm-board-tabs" role="tablist" :aria-label="board.process?'关键控制分类':'结果指标分类'">
        <button v-for="(name,i) in board.categories" :key="name" :id="`trend-tab-${board.process}-${i}`" :aria-controls="`trend-panel-${board.process}`" role="tab" :aria-selected="board.active===name" :tabindex="board.active===name?0:-1" :class="{selected:board.active===name}" @click="board.process?right=name:left=name" @keydown="tabKey($event,board.process,board.categories,i)">{{name}}</button>
      </div>
      <div :id="`trend-panel-${board.process}`" role="tabpanel" :aria-labelledby="`trend-tab-${board.process}-${board.categories.indexOf(board.active!)}`" class="trend-panel">
        <div class="trend-panel-head">
          <details class="trend-picker" @keydown.esc="($event.currentTarget as HTMLDetailsElement).open=false">
            <summary>指标选择 <b>{{board.selected.length}} / {{board.rows.length}}</b><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3.5 6 4.5 4.5L12.5 6" /></svg></summary>
            <div class="trend-options"><div class="trend-picker-actions"><button @click="select(board.active!,board.rows)">全选</button><button @click="clear(board.active!)">清空</button></div>
              <label v-for="m in board.rows" :key="m.id"><input type="checkbox" :checked="board.selected.includes(m.id)" @change="select(board.active!,board.rows,m.id)"><span>{{m.name}}<small>{{m.unit}}</small></span></label>
            </div>
          </details>
        </div>
        <div class="trend-scroll">
          <p v-if="!board.visible.length" class="trend-empty">{{board.rows.length?'未选择指标':'暂无指标'}}</p>
          <section v-for="group in board.groups" :key="group.unit" class="trend-unit">
            <div class="trend-unit-title">{{group.unit==='—'?'无量纲':group.unit}}</div>
            <svg viewBox="0 0 600 196" role="img" :aria-label="`${board.active} ${group.unit}实际值趋势，${from}至${to}`" @pointermove="pointer($event,board.active!,group.unit)" @pointerleave="activeUnit=''">
              <g v-for="r in [0,.25,.5,.75,1]" :key="r"><line x1="58" x2="568" :y1="30+r*132" :y2="30+r*132" class="trend-grid"/><text x="50" :y="34+r*132" text-anchor="end">{{Number((group.max-r*(group.max-group.min)).toPrecision(3))}}</text></g>
              <text v-for="tick in ticks" :key="tick" :x="x(tick)" y="185" text-anchor="middle">{{tick.slice(5)}}</text>
              <template v-for="m in group.metrics" :key="m.id"><path :d="linePath(days,m.id,x,v=>y(v,group),m.unit)" fill="none" :stroke="color(board.rows,m.id)" stroke-width="1.8"/>
                <template v-for="d in days" :key="d.date"><circle v-if="pointValue(d.rows.find(r=>r.id===m.id),m.unit)!==null" :cx="x(d.date)" :cy="y(pointValue(d.rows.find(r=>r.id===m.id),m.unit)!,group)" r="2.6" :fill="color(board.rows,m.id)"><title>{{d.date}} · {{m.name}}：{{readingValue(d,m.id)}} {{m.unit}}</title></circle></template>
              </template>
              <text v-if="!group.hasValues" x="310" y="100" text-anchor="middle">暂无数据</text>
              <line v-if="hover[board.active!]" :x1="x(hover[board.active!])" :x2="x(hover[board.active!])" y1="24" y2="162" class="trend-cursor"/>
            </svg>
            <Teleport to="body"><div v-if="activeUnit===board.active!+group.unit" :ref="setTooltip" class="trend-hover" :style="tooltipPosition" aria-hidden="true"><b>{{displayDay(board.active!)}}</b><span v-for="m in group.metrics" :key="m.id">{{m.name}}<strong>{{reading(board.active!,m.id)}}</strong></span></div></Teleport>
            <div class="trend-legend"><span v-for="m in group.metrics" :key="m.id"><i :style="{background:color(board.rows,m.id)}"/>{{m.name}}</span></div>
          </section>
        </div>
        <details v-if="board.visible.length" class="trend-readings"><summary>{{displayDay(board.active!)}} · 实际值明细</summary><div class="trend-reading-list"><span v-for="m in board.visible" :key="m.id">{{m.name}}<strong>{{reading(board.active!,m.id)}} <small>{{readingUnit(board.active!,m.id)}}</small></strong></span></div></details>
      </div>
    </WxTableSurface>
  </div>
</template>
<script lang="ts">
function readingValue(day:TrendDay,id:string){return day.rows.find(r=>r.id===id)?.actual||'未取得'}
</script>
<style scoped src="./metric-boards.css"></style>
<style scoped>
.trend-panel{border-top:var(--wx-border-subtle);padding:12px;min-height:360px}.trend-panel-head{display:flex;align-items:center;justify-content:flex-end;gap:8px;font-size:12px;margin-bottom:8px}.trend-picker{position:relative;font-size:12px}.trend-picker summary{display:flex;align-items:center;gap:8px;cursor:pointer;list-style:none;border:var(--wx-border-default);border-radius:var(--wx-radius-sm);padding:0 10px;height:var(--wx-control-height);min-width:160px;background:var(--wx-n0)}.trend-picker summary::-webkit-details-marker{display:none}.trend-picker summary svg{width:14px;height:14px;margin-left:auto;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}.trend-picker b{font-weight:500;color:var(--wx-blue-700)}.trend-options{position:absolute;top:36px;right:0;width:250px;max-height:330px;overflow:auto;padding:8px;background:var(--wx-n0);border:var(--wx-border-default);box-shadow:0 6px 24px #17324d20;z-index:5;border-radius:var(--wx-radius-sm)}.trend-options label{display:flex;gap:8px;padding:7px 4px;cursor:pointer}.trend-options label>span{flex:1}.trend-options small{float:right;color:var(--wx-n500);font-size:11px}.trend-picker-actions{display:flex;gap:12px;padding:5px;border-bottom:var(--wx-border-subtle)}.trend-picker-actions button{border:0;background:none;color:var(--wx-blue-700);cursor:pointer;font:inherit}.trend-scroll{max-height:52vh;overflow:auto;overscroll-behavior:contain;scrollbar-width:thin;scrollbar-color:var(--wx-n200) transparent}.trend-unit{position:relative;padding:6px 0 14px}.trend-unit+.trend-unit{border-top:var(--wx-border-subtle);padding-top:14px}.trend-unit-title{font-size:11px;color:var(--wx-n600)}svg{display:block;width:100%;touch-action:pan-y}svg text{fill:var(--wx-n500);font-size:14px}.trend-grid{stroke:var(--wx-n200);stroke-dasharray:3 4;stroke-width:.6}.trend-cursor{stroke:var(--wx-n400);stroke-dasharray:3 3}.trend-legend{display:flex;gap:7px 15px;flex-wrap:wrap;padding:0 8px 0 48px;font-size:12px;color:var(--wx-n600)}.trend-legend span{display:flex;align-items:center;gap:5px}.trend-legend i{width:15px;height:3px;border-radius:2px}.trend-hover{position:fixed;z-index:1000;min-width:175px;max-width:calc(100vw - 16px);max-height:calc(100vh - 16px);overflow:hidden;color:var(--wx-n700);padding:9px 12px;border:var(--wx-border-default);border-radius:var(--wx-radius-sm);background:var(--wx-n0);box-shadow:0 4px 14px #17324d18;pointer-events:none;font-size:10px}.trend-hover b{display:block;margin-bottom:6px;font-weight:500}.trend-hover span{display:flex;justify-content:space-between;gap:16px;line-height:1.65}.trend-hover strong{font-weight:600}.trend-empty{padding:90px 12px;text-align:center;color:var(--wx-n500);font-size:12px}.trend-readings{border-top:var(--wx-border-subtle);padding-top:10px;font-size:11px;color:var(--wx-n600)}.trend-readings summary{cursor:pointer}.trend-reading-list{display:grid;gap:8px;margin-top:12px}.trend-reading-list>span{display:flex;justify-content:space-between;gap:8px}.trend-reading-list strong{font-weight:600;color:var(--wx-n800)}.trend-reading-list small{font-weight:400;color:var(--wx-n500)}.trend-warning{font-size:12px;color:var(--wx-n500);line-height:1.6}.trend-warning{color:var(--wx-warning-strong)}
@container(max-width:900px){.trend-boards{grid-template-columns:minmax(0,1fr)}}
</style>
