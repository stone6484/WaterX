<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { WxButton, WxDialog, WxField, WxInput, WxTableSurface } from '../../components/waterx'
import { formulaDependencies } from './engine'
const props = defineProps<{open:boolean;hidden:string[];metrics:Array<{id:string;name:string;category:string;unit:string;source?:string}>}>()
const emit = defineEmits<{close:[];save:[ids:string[]]}>()
const draft = ref<string[]>([]), search = ref('')
watch(()=>props.open, open=>{if(open){draft.value=[...props.hidden];search.value=''}})
const visible = computed(()=>props.metrics.filter(m=>`${m.category} ${m.name}`.includes(search.value)))
function toggle(id:string, show:boolean){draft.value=show?draft.value.filter(x=>x!==id):[...new Set([...draft.value,id])]}
function sourceLabel(m:{id:string;source?:string}){return m.source==='CALCULATED'?(formulaDependencies(m.id).length?'内置计算':'规则待确认'):m.source==='DESIGN'?'设计参考':'原始记录'}
</script>
<template>
  <WxDialog :open="open" label="选用已有指标" placement="right" @close="emit('close')">
    <section class="pm-picker">
      <header><strong>选用已有指标</strong><WxButton @click="emit('close')">取消</WxButton></header>
      <p>选择本项目各工艺页面的显示指标。隐藏不停止计算、不删除数据，也不改变历史日报或评价得分。</p>
      <WxField label="查找指标"><WxInput v-model="search" placeholder="分类或名称" /></WxField>
      <WxTableSurface><table class="pm-table"><thead><tr><th>显示</th><th>指标</th><th>单位</th><th>取值方式</th></tr></thead><tbody><tr v-for="m in visible" :key="m.id"><td><input type="checkbox" :aria-label="`显示${m.category} ${m.name}`" :checked="!draft.includes(m.id)" @change="toggle(m.id,($event.target as HTMLInputElement).checked)" /></td><td>{{m.name}}<small>{{m.category}}</small></td><td>{{m.unit}}</td><td>{{sourceLabel(m)}}</td></tr><tr v-if="!visible.length"><td colspan="4">没有匹配指标</td></tr></tbody></table></WxTableSurface>
      <footer><WxButton @click="draft=[]">显示全部</WxButton><WxButton variant="primary" @click="emit('save',draft)">保存选用</WxButton></footer>
    </section>
  </WxDialog>
</template>
<style scoped>
.pm-picker{width:min(680px,94vw);height:100%;display:flex;flex-direction:column;gap:16px;padding:20px;background:var(--wx-n0);color:var(--wx-n700)}
.pm-picker td small{display:block;color:var(--wx-n500);margin-top:3px}
.pm-picker header,.pm-picker footer{display:flex;justify-content:space-between;gap:8px}.pm-picker p{margin:0;font-size:12px;color:var(--wx-n500)}.pm-picker :deep(.wx-table-surface){overflow:auto;min-height:0;flex:1}.pm-picker table{width:100%}.pm-picker footer{margin-top:auto}
</style>
