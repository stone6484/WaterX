<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  activeTask, createEvaluationTask, latestModuleResults, latestTaskForModule, loadProcessEvaluationState,
  lockEvaluationTask, moduleResults, moduleSummaries, removeOrVoidEvaluationTask, selectEvaluationTask, updateEvaluationTask,
} from './adapter'
import { PROCESS_MODULE_MAP, PROCESS_PAGE_MODULE } from './rules'
import type { EvaluationTask, ProcessEvaluationPageId, ProcessModuleKey, TaskDraft } from './types'
import EvaluationResultsManager from './EvaluationResultsManager.vue'
import ProcessIssueCenter from './ProcessIssueCenter.vue'
import ProcessReport from './ProcessReport.vue'
import ProcessScoreDock from './ProcessScoreDock.vue'
import ProcessTaskWorkspace from './ProcessTaskWorkspace.vue'
import TaskCreateModal from './TaskCreateModal.vue'

const props = defineProps<{ activePage: ProcessEvaluationPageId; siteName: string; siteCode: string }>()
const emit = defineEmits<{
  'update:activePage': [page: ProcessEvaluationPageId]
  'navigate:app': [page: string]
}>()

const state = ref(loadProcessEvaluationState(props.siteName))
const view = ref<'results' | 'module' | 'issues' | 'report'>('results')
const selectedModule = ref<ProcessModuleKey>('operations')
const showTaskModal = ref(false)
const editingTask = ref<EvaluationTask | null>(null)
const toast = ref('')
let toastTimer = 0

const task = computed(() => activeTask(state.value))
const summaries = computed(() => moduleSummaries(state.value, task.value.id))
const scoreSummaries = computed(() => latestModuleResults(state.value))
const resultRows = computed(() => moduleResults(state.value))
const taskReadonly = computed(() => ['已锁定', '已作废', '撤销'].includes(task.value.status))
let preserveSelectedTask = false

function showToast(message: string) {
  toast.value = message
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => { toast.value = '' }, 2800)
}

function syncFromPage(page: ProcessEvaluationPageId) {
  if (page === 'evaluationResults') view.value = 'results'
  else if (page === 'evaluationRectification') view.value = 'issues'
  else if (page === 'evaluationReport') view.value = 'report'
  else {
    const module = PROCESS_PAGE_MODULE[page]
    if (module) {
      selectedModule.value = module
      if (!preserveSelectedTask) {
        const latest = latestTaskForModule(state.value, module)
        if (latest) selectEvaluationTask(state.value, latest.id)
      }
      preserveSelectedTask = false
      view.value = 'module'
    }
  }
}

watch(() => props.activePage, syncFromPage, { immediate: true })
watch(view, () => window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'auto' })))

function openResult(taskId: string, module: ProcessModuleKey) {
  const selected = selectEvaluationTask(state.value, taskId)
  if (!selected || !selected.moduleKeys.includes(module)) return
  selectedModule.value = module
  view.value = 'module'
  preserveSelectedTask = true
  emit('update:activePage', PROCESS_MODULE_MAP.get(module)!.pageId)
}

function openModule(module: ProcessModuleKey) {
  const latest = latestTaskForModule(state.value, module)
  if (!latest) { showToast('该模块暂无可打开的评价记录。'); return }
  openResult(latest.id, module)
}

function openCurrentTaskModule(module: ProcessModuleKey) {
  if (!task.value.moduleKeys.includes(module)) { showToast('当前评价任务不包含该模块。'); return }
  openResult(task.value.id, module)
}

function openIssues() {
  view.value = 'issues'
  emit('update:activePage', 'evaluationRectification')
}

function openReport() {
  view.value = 'report'
  emit('update:activePage', 'evaluationReport')
}

function openNewTask() {
  editingTask.value = null
  showTaskModal.value = true
}

function openEditTask(target: EvaluationTask) {
  editingTask.value = target
  showTaskModal.value = true
}

function saveTask(draft: TaskDraft) {
  if (editingTask.value) {
    const updated = updateEvaluationTask(state.value, editingTask.value.id, draft)
    showTaskModal.value = false
    editingTask.value = null
    showToast(updated ? '评价任务信息已更新。' : '当前任务不可编辑。')
    return
  }
  const created = createEvaluationTask(state.value, draft, props.siteName)
  showTaskModal.value = false
  selectedModule.value = created.moduleKeys[0]
  openResult(created.id, selectedModule.value)
  showToast('评价任务已创建，规则版本和检查范围已冻结。')
}

function removeTask(target: EvaluationTask) {
  const action = ['草稿', '待执行'].includes(target.status) ? '删除' : '作废'
  if (!window.confirm(`确定${action}“${target.name}”吗？${action === '作废' ? '历史结果将保留并标记为已作废。' : ''}`)) return
  const result = removeOrVoidEvaluationTask(state.value, target.id)
  showToast(result === 'deleted' ? '未开展的评价任务已删除。' : result === 'voided' ? '评价任务已作废，历史记录继续保留。' : '该任务已锁定或已作废，不能执行此操作。')
}

function lockTask(target: EvaluationTask) {
  if (!window.confirm(`确定锁定“${target.name}”吗？锁定后评价内容只读。`)) return
  const blockers = lockEvaluationTask(state.value, target.id)
  showToast(blockers.length ? `暂不能锁定：${blockers[0]}` : '评价任务已锁定，历史内容进入只读状态。')
}

function openSource(module: ProcessModuleKey) {
  const targets: Partial<Record<ProcessModuleKey, string>> = { operations: 'operationEntry', laboratory: 'labRecords', safety: 'hazard' }
  const target = targets[module]
  if (!target) {
    showToast(`${PROCESS_MODULE_MAP.get(module)?.shortName}专业明细入口尚在规划中，当前以评价演示事实承接。`)
    return
  }
  emit('navigate:app', target)
}
</script>

<template>
  <div class="pe-root">
    <ProcessScoreDock :summaries="scoreSummaries" :selected-module="view === 'module' ? selectedModule : null" @open-result="openResult" />
    <EvaluationResultsManager v-if="view === 'results'" :state="state" :rows="resultRows" @new-task="openNewTask" @edit-task="openEditTask" @open-result="openResult" @remove-task="removeTask" @lock-task="lockTask" />
    <ProcessTaskWorkspace v-else-if="view === 'module'" :state="state" :task="task" :module-key="selectedModule" :readonly="taskReadonly" @open-source="openSource" @notify="showToast" />
    <ProcessIssueCenter v-else-if="view === 'issues'" :state="state" :task="task" :readonly="taskReadonly" @open-module="openCurrentTaskModule" @open-report="openReport" @notify="showToast" />
    <ProcessReport v-else :state="state" :task="task" :summaries="summaries" :readonly="taskReadonly" @open-issues="openIssues" @open-module="openCurrentTaskModule" @notify="showToast" />
    <TaskCreateModal v-if="showTaskModal" :task="editingTask" @close="showTaskModal = false" @save="saveTask" />
    <div class="pe-toast" :class="{ visible: toast }" role="status">{{ toast }}</div>
  </div>
</template>

<style src="./process-evaluation.css"></style>
