<script setup lang="ts">
import { computed } from 'vue'
import { formulaDependencies, RULE_VERSION } from './engine'
import type { Cell } from './types'
import { dataLabels } from './types'
const props=defineProps<{id:string;version?:string;metrics:Array<{id:string;name:string;unit:string}>;values:Record<string,string>;cells:Record<string,Cell>}>()
const inputs=computed(()=>props.version===RULE_VERSION?formulaDependencies(props.id).map(dep=>({
  ...dep,metric:props.metrics.find(m=>m.id===dep.id),value:dep.design?props.values[dep.id]:props.cells[dep.id]?.value,
  state:dep.design?'引用设计版本':dataLabels[props.cells[dep.id]?.state||'MISSING'],source:dep.design?'设计标准':props.cells[dep.id]?.source==='DEMO'?'示范填入':props.cells[dep.id]?.source==='IMPORT'?'表格导入':'原始填报'
})):[])
</script>
<template><section v-if="inputs.length"><h3>计算输入（所选版本）</h3><dl><template v-for="input in inputs" :key="input.id"><dt>{{input.metric?.name||input.id}}</dt><dd>{{input.value===undefined||input.value===''?'未取得':input.value}} {{input.metric?.unit||''}} · {{input.source}} · {{input.state}}</dd></template></dl></section><p v-else-if="version!==RULE_VERSION">历史规则版本与当前目录不同，保留原快照，不以新规则反推历史输入。</p></template>
