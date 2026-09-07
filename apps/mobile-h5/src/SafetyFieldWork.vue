<script setup lang="ts">
import {ref,onMounted,watch} from 'vue'
import type {ApiClient,SafetyContext,SafetyDirectory,WorkflowTask,WorkflowHazard} from '@safety/api-client'
import SafetyWorkflowPanel from '@safety/workflow-ui'
import {hazardStatuses,time} from '@safety/workflow-ui/archive'
const props=defineProps<{api:ApiClient;siteId:string;page:'inspection'|'report'|'rectification'}>()
const emit=defineEmits<{updated:[]}>()
const api=props.api.forSite(props.siteId)
const context=ref<SafetyContext|null>(null),directory=ref<SafetyDirectory>(),tasks=ref<WorkflowTask[]>([]),hazards=ref<WorkflowHazard[]>([]),error=ref(''),message=ref(''),loading=ref(false)
const mode=ref<'report'|'task'|'hazard'|null>(null),selectedTask=ref<WorkflowTask>(),hazardId=ref('')
async function load(){loading.value=true;error.value='';try{context.value=await api.safetyContext();[tasks.value,hazards.value]=await Promise.all([api.workflowTasks(),api.workflowHazards()]);if(context.value.canManage)directory.value=await api.safetyDirectory()}catch(e){error.value=(e as Error).message}finally{loading.value=false}}
onMounted(async()=>{await load();if(props.page==='report'&&context.value?.canReport!==false)mode.value='report'})
watch(()=>props.page,()=>{mode.value=props.page==='report'&&context.value?.canReport!==false?'report':null})
async function saved(){if(mode.value!=='hazard'){mode.value=null;message.value='保存成功，待办与记录已同步'}else message.value='';await load();emit('updated')}
function task(t:WorkflowTask){selectedTask.value=t;mode.value='task'}
function hazard(h:WorkflowHazard){hazardId.value=h.id;mode.value='hazard'}
</script>
<template><section class="field-work"><p v-if="error" role="alert">{{error}}</p><p v-if="message" role="status">{{message}}</p><SafetyWorkflowPanel v-if="mode&&context" :key="mode+(mode==='task'?selectedTask?.id:mode==='report'?'new':hazardId)" :api="api" :context="context" :mode="mode" :task="selectedTask" :hazard-id="hazardId" :hazards="hazards" :directory="directory" :draft-key="`safety-mobile:${context.userId}:${siteId}:${mode}:${mode==='task'?selectedTask?.id:mode==='report'?'new':hazardId}`" @close="mode=null" @saved="saved"/><template v-else><div class="field-toolbar"><span>{{context?.displayName}} · {{page==='inspection'?'检查记录':'现场问题与整改'}}</span><button @click="load" :disabled="loading">刷新</button></div><button v-if="page==='report'&&context?.canReport!==false" @click="mode='report'">报告新的现场问题</button><template v-if="page==='inspection'"><article v-for="t in tasks" :key="t.id"><b>{{t.title}}</b><p>{{t.templateName}} V{{t.templateVersion}}</p><small>{{t.assigneeName}} · 截止{{time(t.dueAt)}}</small><button @click="task(t)">{{t.canExecute?'执行检查':'查看记录'}}</button></article><p v-if="!tasks.length">暂无检查任务</p></template><template v-else><article v-for="h in hazards" :key="h.id"><small>{{h.hazardNo}}</small><b>{{h.location}} · {{h.description}}</b><p>{{hazardStatuses[h.status]}} {{h.overdueDays?'· 逾期'+h.overdueDays+'天':''}}</p><p>{{h.rectificationMeasure||'等待安全员受理并明确整改要求'}}</p><small>责任人：{{h.responsiblePerson||'待派发'}} · 期限：{{h.dueDate||'待确认'}}</small><button @click="hazard(h)">{{h.canReceive?'接收责任':h.canRectify?'反馈整改':h.canReview?'复查验收':'查看记录'}}</button></article><p v-if="!hazards.length">暂无相关问题或整改任务</p></template></template></section></template>
<style scoped>.field-work{padding:0 12px 80px;font-size:14px}.field-work article{padding:16px;background:white;border-bottom:1px solid #d4e0e6;display:grid;gap:8px}.field-work article p{margin:0}.field-work button{padding:9px 14px;border:1px solid #d4e0e6;border-radius:5px;background:#0877a7;color:#fff;font:inherit}.field-work small{color:#607b89}.field-toolbar{display:flex;justify-content:space-between;align-items:center;padding:12px 0}.field-work [role=alert]{color:#b83232}</style>
