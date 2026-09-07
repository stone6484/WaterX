<script setup lang="ts">
import { computed, ref } from 'vue'
import { WxField, WxSelect, WxTableSurface } from '../components/waterx'
import MetricEditor from '../modules/process-management/MetricEditor.vue'
import type { Cell, Metric, Target } from '../modules/process-management/types'
import '../modules/process-management/process-management.css'

const mode=ref<'design'|'condition'|'entry'>('design'), width=ref('full'), scenario=ref('long'), editable=ref(false)
const examples=[['COD','mg/L'],['日进水量','万m³/d'],['填料区游离污泥 MLVSS','mg/L'],['污泥比耗氧速率 SOUR','mg O₂/(g MLVSS·h)']]
const fixtures:Metric[]=Array.from({length:20},(_,i)=>({id:`lab-${i}`,code:`UI-${String(i+1).padStart(3,'0')}`,category:'界面验收样例',name:i<4?examples[i][0]:`采样点 ${i-3} · COD`,unit:i<4?examples[i][1]:'mg/L',design:'',target:'',actual:'',meaning:'仅用于界面检验',formula:'',scopes:['design','condition','entry','diagnosis'],source:'MANUAL',text:false}))
const metrics=computed(()=>scenario.value==='empty'?[]:scenario.value==='short'?fixtures.slice(0,2):fixtures)
const values=ref<Record<string,string>>(Object.fromEntries(fixtures.map((m,i)=>[m.id,i===1?'0':i===3?'':'20'])))
const targets=ref<Record<string,Target>>(Object.fromEntries(fixtures.map(m=>[m.id,{value:'10',mode:'POINT',warning:10,alarm:50}])))
const cells=ref<Record<string,Cell>>(Object.fromEntries(fixtures.map((m,i)=>[m.id,{value:i===1?'0':i===3?'':'18',state:'VALID',source:'MANUAL',note:i===3?'未取得数据，保持空白':'仅用于界面验证'}])))
</script>

<template>
  <section id="process" class="lab-section">
    <div class="lab-section-title"><div><p class="lab-eyebrow">06 / 工艺维护表格</p><h2>设计、目标与日数据，沿用同一套表格。</h2></div><span>真实组件 · 内存样例 · 不保存业务数据</span></div>
    <p class="lab-note">这里直接加载主产品的维护组件。切换三种模式检查独立单位列、长字段、固定表头及只读／编辑状态；所有数值和容差仅供界面演示，不构成工艺标准。</p>
    <div class="lab-toolbar">
      <WxField label="维护模式"><WxSelect :model-value="mode" @update:model-value="mode=$event as typeof mode"><option value="design">工艺设计标准</option><option value="condition">工况目标参数</option><option value="entry">人工日数据</option></WxSelect></WxField>
      <WxField label="测试内容"><WxSelect v-model="scenario"><option value="long">长字段与多行</option><option value="short">短字段与真实 0</option><option value="empty">空数据</option></WxSelect></WxField>
      <WxField label="维护表工作区"><WxSelect v-model="width"><option value="full">铺满工作区</option><option value="1040">1040px</option><option value="760">760px</option></WxSelect></WxField>
      <label><input v-model="editable" type="checkbox"> 编辑演示值（仅内存）</label>
    </div>
    <div class="pm-workspace" :style="{maxWidth:width==='full'?'100%':`${width}px`}"><WxTableSurface><MetricEditor :metrics="metrics" :mode="mode" :values="values" :targets="targets" :cells="cells" :editable="editable" @design="(id,value)=>values[id]=value" @target="(id,value)=>targets[id]=value" @cell="(id,value)=>cells[id]=value" /></WxTableSurface></div>
  </section>
</template>

<style scoped>
.lab-note{margin:0 0 16px}.lab-toolbar>label{font-size:12px;color:var(--wx-n600);display:flex;align-items:center;gap:6px}
</style>
