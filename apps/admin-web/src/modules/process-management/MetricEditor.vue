<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { WxButton, WxDialog, WxField, WxSelect, WxInput, WxTableSurface } from '../../components/waterx'
import { type Metric, type Target, type Cell, type TargetMode, modeLabels } from './types'
import { dailyBasis, dailyHelp, emptyTarget } from './daily-input'
import { entryPasteChanges, groupMetricBoards } from './metric-boards'

const props=defineProps<{metrics:Metric[];mode:'design'|'condition'|'entry';values:Record<string,string>;targets:Record<string,Target>;cells:Record<string,Cell>;editable:boolean}>()
const emit=defineEmits<{design:[id:string,value:string];target:[id:string,value:Target];cell:[id:string,value:Cell]}>()
const uid=useId(),host=ref<HTMLElement|null>(null),widths=ref<number[]>([])
const left=ref('进水水质'),right=ref('水量控制'),detailId=ref(''),pasteNotice=ref(''),pasteError=ref(false)
const detail=computed(()=>props.metrics.find(m=>m.id===detailId.value))
const headers=computed(()=>props.mode==='entry'?['指标','实际值']:['指标','单位',props.mode==='design'?'设计值':'目标值','指标意义'])
const cellFor=(id:string):Cell=>props.cells[id]||{value:'',state:'VALID',source:'MANUAL',note:''}
const targetFor=(metric:Metric)=>props.targets[metric.id]||emptyTarget(metric)
const display=(value:unknown)=>value===null||value===undefined||String(value).trim()===''?'—':String(value)
const boards=computed(()=>groupMetricBoards(props.metrics,left.value,right.value).map(board=>{
  const width=(text:string)=>[...text].reduce((n,c)=>n+(/[^\x00-\xff]/.test(c)?12:7),14)
  const widest=(pick:(m:Metric)=>string,floor:number,cap:number)=>Math.min(cap,Math.max(floor,...board.rows.map(m=>width(pick(m)))))
  const columns=props.mode==='entry'?[widest(m=>m.name,140,230),150]:[widest(m=>m.name,90,180),widest(m=>m.unit,50,110),130,140]
  return {...board,columns,minimum:columns.reduce((sum,n)=>sum+n,0)}
}))
const columnStyle=(width:number,minimum:number,index:number)=>({width:`${width+Math.max(0,(widths.value[index]||minimum)-minimum)/headers.value.length}px`})
function selectTab(process:boolean,name:string){if(process)right.value=name;else left.value=name;pasteNotice.value=''}
function tabKey(event:KeyboardEvent,process:boolean,names:string[],index:number){
  const move=event.key==='ArrowRight'?1:event.key==='ArrowLeft'?-1:0
  if(!move&&!['Home','End'].includes(event.key))return
  event.preventDefault()
  const next=event.key==='Home'?0:event.key==='End'?names.length-1:(index+move+names.length)%names.length
  selectTab(process,names[next]!)
  ;(event.currentTarget as HTMLElement).parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus()
}
function setValue(metric:Metric,value:string){
  if(!props.editable)return
  if(props.mode==='design')emit('design',metric.id,value)
  else if(props.mode==='condition')emit('target',metric.id,{...targetFor(metric),value})
  else if(cellFor(metric.id).state!=='NA')emit('cell',metric.id,{...cellFor(metric.id),value,source:'MANUAL'})
}
function paste(event:ClipboardEvent,rows:Metric[],metric:Metric){
  if(props.mode!=='entry'||!props.editable)return
  const text=event.clipboardData?.getData('text/plain')||''
  if(!/[\t\n\r]/.test(text))return
  event.preventDefault()
  try{const changes=entryPasteChanges(text,rows,metric.id,props.cells);for(const change of changes)emit('cell',change.id,change.cell);pasteError.value=false;pasteNotice.value=`已粘贴 ${changes.length} 项到当前草稿，尚未保存。`}
  catch(error){pasteError.value=true;pasteNotice.value=(error as Error).message}
}
function nextValue(rows:Metric[],index:number){
  const next=rows.slice(index+1).find(m=>props.mode!=='entry'||cellFor(m.id).state!=='NA')
  if(next){const input=host.value?.querySelector<HTMLInputElement>(`input[data-value-id="${CSS.escape(next.id)}"]`);input?.focus();input?.select()}
}
function changeTarget(metric:Metric,patch:Partial<Target>){if(props.editable)emit('target',metric.id,{...targetFor(metric),...patch})}
function changeCell(metric:Metric,patch:Partial<Cell>){if(props.editable)emit('cell',metric.id,{...cellFor(metric.id),...patch})}
let observer:ResizeObserver|undefined
function alignHeaders(){host.value?.querySelectorAll<HTMLElement>('.pm-board').forEach((board,index)=>{
  const body=board.querySelector<HTMLElement>('.pm-board-body'),viewport=board.querySelector<HTMLElement>('.pm-board-table')
  if(body&&viewport){const gutter=body.offsetWidth-body.clientWidth;board.style.setProperty('--pm-body-gutter',`${gutter}px`);widths.value[index]=viewport.getBoundingClientRect().width-gutter}
})}
onMounted(()=>{observer=new ResizeObserver(alignHeaders);host.value?.querySelectorAll('.pm-board-body,.pm-board-table').forEach(node=>observer!.observe(node));alignHeaders()})
watch(()=>[props.metrics,props.mode],()=>{if(!detail.value)detailId.value='';void nextTick(alignHeaders)})
watch(()=>props.mode,()=>{left.value='进水水质';right.value='水量控制';detailId.value='';pasteNotice.value=''})
onBeforeUnmount(()=>observer?.disconnect())
</script>

<template>
  <div ref="host" class="pm-diagnosis-boards pm-metric-boards" :data-editor-mode="mode">
    <WxTableSurface v-for="(board,bi) in boards" :key="String(board.process)" class="pm-board">
      <div class="pm-board-tabs" role="tablist" :aria-label="board.process?'关键控制分类':'结果指标分类'">
        <button v-for="(name,index) in board.categories" :id="`${uid}-tab-${bi}-${index}`" :key="name" role="tab" :aria-selected="board.active===name" :aria-controls="`${uid}-panel-${bi}`" :tabindex="board.active===name?0:-1" :class="{selected:board.active===name}" @click="selectTab(board.process,name)" @keydown="tabKey($event,board.process,board.categories,index)"><span class="pm-tab-title">{{name}}</span></button>
      </div>
      <div :id="`${uid}-panel-${bi}`" class="pm-board-table" role="tabpanel" :aria-labelledby="board.active?`${uid}-tab-${bi}-${board.categories.indexOf(board.active)}`:undefined" :aria-label="board.active?undefined:board.process?'关键控制，无匹配指标':'结果指标，无匹配指标'" tabindex="0">
        <div :style="{minWidth:`calc(${board.minimum}px + var(--pm-body-gutter))`}">
          <div class="pm-fixed-head"><table class="pm-table" aria-hidden="true"><colgroup><col v-for="(w,i) in board.columns" :key="i" :style="columnStyle(w,board.minimum,bi)"></colgroup><thead><tr><th v-for="h in headers" :key="h">{{h}}</th></tr></thead></table></div>
          <div class="pm-board-body" role="region" :aria-label="`${board.active||'指标'}记录，可上下滚动`" tabindex="0">
            <table class="pm-table" :aria-label="`${mode==='design'?'工艺设计标准':mode==='condition'?'工况目标值':'运行数据填报'}：${board.active||'无数据'}`">
              <colgroup><col v-for="(w,i) in board.columns" :key="i" :style="columnStyle(w,board.minimum,bi)"></colgroup>
              <thead class="pm-accessible-head"><tr><th v-for="h in headers" :key="h" scope="col">{{h}}</th></tr></thead>
              <tbody>
                <tr v-for="(m,index) in board.rows" :key="m.id" :data-metric-id="m.id">
                  <td><b v-if="mode==='design'">{{m.name}}</b><button v-else class="pm-link" :title="mode==='entry'?`${m.unit} · ${dailyBasis(m)}${cellFor(m.id).note?' · '+cellFor(m.id).note:''}`:m.meaning" :aria-label="`${m.name}${mode==='condition'?'控制参数':'数据状态与说明'}`" @click="detailId=m.id">{{m.name}}</button><small>{{m.code}}</small><small v-if="mode==='entry'&&cellFor(m.id).state!=='VALID'" :class="cellFor(m.id).state==='INVALID'?'pm-input-invalid':''">{{cellFor(m.id).state==='NA'?'工艺不适用':'数据异常'}}</small></td>
                  <td v-if="mode!=='entry'">{{m.unit}}</td>
                  <td class="pm-edit-value">
                    <input v-if="editable" :data-value-id="m.id" :aria-label="`${m.name}${mode==='design'?'设计值':mode==='condition'?'目标值':'实际值'}`" :value="mode==='design'?values[m.id]??'':mode==='condition'?targets[m.id]?.value??'':cellFor(m.id).value" :disabled="mode==='entry'&&cellFor(m.id).state==='NA'" :title="mode==='entry'?`${m.unit} · ${dailyBasis(m)}；${dailyHelp(m)}`:m.meaning" :placeholder="mode==='entry'?'待填报':mode==='design'?'未维护':'未配置'" @input="setValue(m,($event.target as HTMLInputElement).value)" @paste="paste($event,board.rows,m)" @keydown.enter.prevent="nextValue(board.rows,index)" />
                    <strong v-else>{{mode==='design'?display(values[m.id]):mode==='condition'?display(targets[m.id]?.value):cellFor(m.id).state==='NA'?'不适用':display(cellFor(m.id).value)}}</strong>
                  </td>
                  <td v-if="mode!=='entry'" class="pm-meaning">{{m.meaning||'—'}}</td>
                </tr>
                <tr v-if="!board.rows.length"><td :colspan="headers.length" class="pm-empty">当前分类没有需要{{mode==='entry'?'填报':'维护'}}的指标。</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </WxTableSurface>
  </div>
  <p v-if="pasteNotice" class="pm-paste-notice" :class="{'pm-input-invalid':pasteError}" :role="pasteError?'alert':'status'">{{pasteNotice}}</p>
  <WxDialog :open="!!detail" :label="detail?`${detail.name} · ${mode==='condition'?'控制参数':'数据状态与说明'}`:'指标详情'" placement="right" @close="detailId=''">
    <section v-if="detail" class="pm-metric-detail">
      <header><strong>{{detail.name}}</strong><WxButton @click="detailId=''">关闭</WxButton></header>
      <p>{{detail.code}} · {{detail.unit}} · {{detail.meaning||'—'}}</p>
      <template v-if="mode==='condition'">
        <WxField label="设计参考"><span>{{display(values[detail.id])}}</span></WxField>
        <WxField label="控制方式"><WxSelect :disabled="!editable" :model-value="targetFor(detail).mode" @update:model-value="changeTarget(detail,{mode:$event as TargetMode})"><option v-for="(label,key) in modeLabels" :key="key" :value="key">{{label}}</option></WxSelect></WxField>
        <WxField label="预警容差 %"><WxInput type="number" min="0" :disabled="!editable" :model-value="String(targetFor(detail).warning)" @update:model-value="changeTarget(detail,{warning:Number($event)})" /></WxField>
        <WxField label="告警容差 %"><WxInput type="number" min="0" :disabled="!editable" :model-value="String(targetFor(detail).alarm)" @update:model-value="changeTarget(detail,{alarm:Number($event)})" /></WxField>
      </template>
      <template v-else>
        <p>{{dailyBasis(detail)}} · {{dailyHelp(detail)}}</p>
        <WxField label="数据状态"><WxSelect :disabled="!editable" :model-value="cellFor(detail.id).state" @update:model-value="changeCell(detail,{state:$event as Cell['state']})"><option value="VALID">适用</option><option value="INVALID">数据异常</option><option value="NA">工艺不适用</option></WxSelect></WxField>
        <WxField label="数据说明"><WxInput :disabled="!editable" :model-value="cellFor(detail.id).note" placeholder="异常或不适用须说明原因" @update:model-value="changeCell(detail,{note:$event})" /></WxField>
        <p>来源：{{cellFor(detail.id).source==='DEMO'?'演示填入':cellFor(detail.id).source==='IMPORT'?'表格导入':'人工填报'}}</p>
      </template>
      <p v-if="editable">修改随本页草稿一并保存。</p>
    </section>
  </WxDialog>
</template>

<style scoped src="./metric-boards.css"></style>
<style scoped>
.pm-metric-boards .pm-edit-value input{width:100%;min-width:0;box-sizing:border-box;height:var(--wx-control-height);padding:5px 8px;border:var(--wx-border-default);border-radius:var(--wx-radius-sm);background:var(--wx-n0);color:var(--wx-n800);font:inherit}
.pm-metric-boards .pm-edit-value input:disabled{background:var(--wx-n25);color:var(--wx-n500)}
.pm-metric-boards .pm-edit-value input:focus-visible{outline:2px solid var(--wx-blue-500);outline-offset:1px}
.pm-input-invalid{color:var(--wx-danger-strong)!important}
.pm-paste-notice{margin:0;color:var(--wx-n600);font-size:12px}
.pm-metric-detail{display:grid;align-content:start;gap:16px;width:min(520px,100vw);height:100%;overflow:auto;padding:24px;background:var(--wx-n0);border-left:var(--wx-border-default);color:var(--wx-n700)}
.pm-metric-detail header{position:static;display:flex;align-items:center;justify-content:space-between;gap:12px;height:auto;min-height:0;margin:0;padding:0;background:transparent;box-shadow:none;color:inherit}
.pm-metric-detail header strong{font-size:18px}
.pm-metric-detail p{font-size:12px;line-height:1.6;color:var(--wx-n500);margin:0}
</style>
