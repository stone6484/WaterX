<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { type Metric, type Target, type Cell, type TargetMode, modeLabels } from './types'
import { dailyBasis, dailyHelp, emptyTarget } from './daily-input'
const props=defineProps<{ metrics: Metric[]; mode: 'design'|'condition'|'entry'; values: Record<string,string>; targets: Record<string,Target>; cells: Record<string,Cell>; editable: boolean }>()
const emit=defineEmits<{design:[id:string,value:string];target:[id:string,value:Target];cell:[id:string,value:Cell]}>()
const emptyCell=():Cell=>({value:'',state:'VALID',source:'MANUAL',note:''})
const host=ref<HTMLElement|null>(null), available=ref(0), gutter=ref(0)
const headers=computed(()=>props.mode==='design'?['指标','单位','设计值']:props.mode==='condition'?['指标','单位','设计参考','目标值','控制方式','预警 / 告警容差 %']:['指标','单位','设计参考','实际值','数据状态 / 来源','说明'])
const columns=computed(()=>{
  const textWidth=(text:string)=>[...text].reduce((n,c)=>n+(/[^\x00-\xff]/.test(c)?12:7),20)
  const name=Math.min(220,Math.max(props.mode==='entry'?160:120,...props.metrics.map(m=>textWidth(m.name))))
  const unit=Math.min(150,Math.max(64,...props.metrics.map(m=>textWidth(m.unit))))
  return props.mode==='design'?[name,unit,180]:props.mode==='condition'?[name,unit,110,130,120,164]:[name,unit,110,140,140,200]
})
const minimum=computed(()=>columns.value.reduce((a,b)=>a+b,0))
const columnStyle=(w:number)=>({width:`${w+Math.max(0,available.value-minimum.value)/columns.value.length}px`})
function measure(){
  const body=host.value?.querySelector<HTMLElement>('.pm-editor-body')
  if(host.value&&body){gutter.value=body.offsetWidth-body.clientWidth;available.value=host.value.getBoundingClientRect().width-gutter.value}
}
let observer:ResizeObserver|undefined
onMounted(()=>{observer=new ResizeObserver(measure);if(host.value){observer.observe(host.value);const body=host.value.querySelector('.pm-editor-body');if(body)observer.observe(body)};measure()})
watch(()=>[props.metrics,props.mode],()=>nextTick(measure))
onBeforeUnmount(()=>observer?.disconnect())
</script>
<template>
  <div ref="host" class="pm-editor-scroll" tabindex="0" role="region" aria-label="维护表格，可左右滚动"><div :style="{minWidth:`${minimum+gutter}px`}">
    <div class="pm-editor-head" :style="{paddingRight:`${gutter}px`}" aria-hidden="true"><table class="pm-table pm-editor"><colgroup><col v-for="(w,i) in columns" :key="i" :style="columnStyle(w)"></colgroup><thead><tr><th v-for="h in headers" :key="h">{{h}}</th></tr></thead></table></div>
    <div class="pm-table-scroll pm-editor-body" tabindex="0" role="region" aria-label="维护记录，可上下滚动"><table class="pm-table pm-editor" :aria-label="mode==='design'?'工艺设计标准':mode==='condition'?'工况目标参数':'人工日数据'"><colgroup><col v-for="(w,i) in columns" :key="i" :style="columnStyle(w)"></colgroup><thead class="pm-editor-sr"><tr><th v-for="h in headers" :key="h" scope="col">{{h}}</th></tr></thead><tbody>
    <tr v-for="m in metrics" :key="m.id"><td><b>{{m.name}}</b><small>{{m.code}}</small><small v-if="mode==='entry'" :title="dailyHelp(m)">{{dailyBasis(m)}} · 人工填报</small></td><td>{{m.unit}}</td><td v-if="mode!=='design'">{{values[m.id]||'未维护'}}</td>
      <template v-if="mode==='design'"><td><input :aria-label="`${m.name}设计值`" :disabled="!editable" :value="values[m.id]||''" @input="emit('design',m.id,($event.target as HTMLInputElement).value)" /></td></template>
      <template v-else-if="mode==='condition'"><td><input :aria-label="`${m.name}目标值`" :disabled="!editable" :value="targets[m.id]?.value||''" placeholder="未配置" @input="emit('target',m.id,{...(targets[m.id]||emptyTarget(m)),value:($event.target as HTMLInputElement).value})" /></td><td><select :aria-label="`${m.name}控制方式`" :disabled="!editable" :value="targets[m.id]?.mode||emptyTarget(m).mode" @change="emit('target',m.id,{...(targets[m.id]||emptyTarget(m)),mode:($event.target as HTMLSelectElement).value as TargetMode})"><option v-for="(label,mode) in modeLabels" :key="mode" :value="mode">{{label}}</option></select></td><td><div class="pm-tolerances"><input type="number" min="0" :aria-label="`${m.name}预警容差`" :disabled="!editable" :value="targets[m.id]?.warning??10" @input="emit('target',m.id,{...(targets[m.id]||emptyTarget(m)),warning:Number(($event.target as HTMLInputElement).value)})" /><span>/</span><input type="number" min="0" :aria-label="`${m.name}告警容差`" :disabled="!editable" :value="targets[m.id]?.alarm??50" @input="emit('target',m.id,{...(targets[m.id]||emptyTarget(m)),alarm:Number(($event.target as HTMLInputElement).value)})" /></div></td></template>
      <template v-else><td><input :aria-label="`${m.name}实际值`" :disabled="!editable||cells[m.id]?.state==='NA'" :value="cells[m.id]?.value||''" placeholder="待填报" @input="emit('cell',m.id,{...(cells[m.id]||emptyCell()),value:($event.target as HTMLInputElement).value,source:'MANUAL'})" /></td><td><select :aria-label="`${m.name}数据状态`" :disabled="!editable" :value="cells[m.id]?.state||'VALID'" @change="emit('cell',m.id,{...(cells[m.id]||emptyCell()),state:($event.target as HTMLSelectElement).value as Cell['state']})"><option value="VALID">适用</option><option value="INVALID">数据异常</option><option value="NA">工艺不适用</option></select><small>{{cells[m.id]?.source==='DEMO'?'示范填入':cells[m.id]?.source==='IMPORT'?'表格导入':'人工填报'}}</small></td><td><input :aria-label="`${m.name}数据说明`" :disabled="!editable" :value="cells[m.id]?.note||''" placeholder="异常或不适用须说明原因" @input="emit('cell',m.id,{...(cells[m.id]||emptyCell()),note:($event.target as HTMLInputElement).value})" /></td></template>
    </tr><tr v-if="!metrics.length"><td :colspan="headers.length" class="pm-empty">当前分类没有需要维护的指标。公式结果请在诊断中查看。</td></tr>
  </tbody></table></div></div></div>
  <p v-if="mode==='condition'" class="pm-editor-note">预警与告警容差为项目参数，需按业务要求校核。</p>
  <p v-if="mode==='entry'" class="pm-muted">水量、电量、药剂量填当日累计量，浓度等填人工整理的日均值；单次观测或特殊口径请在说明中注明。计算指标无需重复填报。</p>
</template>

<style scoped>
.pm-editor-scroll{min-width:0;overflow-x:auto;scrollbar-width:auto;scrollbar-color:auto}
.pm-editor-head{background:var(--wx-n25);border-top:var(--wx-border-subtle);border-bottom:var(--wx-border-subtle)}
.pm-editor{min-width:0;width:100%;table-layout:fixed;border-collapse:collapse}
.pm-editor th{position:static;width:auto;height:42px;padding:7px 10px;border:0;background:var(--wx-n25);font-size:12px;font-weight:400;color:var(--wx-n600)}
.pm-editor td{height:var(--wx-table-row-complex);padding:7px 10px;border:0;border-bottom:var(--wx-border-subtle);font-size:12px;color:var(--wx-n700);overflow-wrap:anywhere}
.pm-editor td small{font-size:10px;color:var(--wx-n500)}
.pm-editor input,.pm-editor select{height:var(--wx-control-height);border-color:var(--wx-n200);border-radius:var(--wx-radius-sm);color:var(--wx-n700);font:inherit}
.pm-editor input:disabled,.pm-editor select:disabled{background:var(--wx-n25);color:var(--wx-n600)}
.pm-editor-body{max-height:52vh;overflow-y:auto;overflow-x:hidden;scrollbar-width:auto;scrollbar-color:auto;overscroll-behavior:contain}
.pm-editor-scroll::-webkit-scrollbar{height:var(--wx-scrollbar-horizontal-size)}
.pm-editor-body::-webkit-scrollbar{width:var(--wx-scrollbar-size)}
.pm-editor-scroll::-webkit-scrollbar-thumb,.pm-editor-body::-webkit-scrollbar-thumb{background:var(--wx-n200);border-radius:99px}
.pm-editor-scroll::-webkit-scrollbar-track,.pm-editor-body::-webkit-scrollbar-track{background:transparent}
.pm-editor-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
.pm-editor-note{margin:12px 0 0;color:var(--wx-n500);font-size:12px}
.pm-editor-scroll:focus-visible,.pm-editor-body:focus-visible{outline:2px solid var(--wx-blue-600);outline-offset:-2px}
@supports not selector(::-webkit-scrollbar){.pm-editor-scroll,.pm-editor-body{scrollbar-width:thin;scrollbar-color:var(--wx-n200) transparent}}
</style>
