<script setup lang="ts">
import { computed, ref } from 'vue'
import { PROCESS_MODULE_MAP, PROCESS_MODULES } from './rules'
import type { EvaluationCadence, EvaluationTask, ModuleResultSummary, ProcessEvaluationState, ProcessModuleKey, TaskStatus } from './types'

const props = defineProps<{ state: ProcessEvaluationState; rows: ModuleResultSummary[] }>()
const emit = defineEmits<{
  newTask: []
  editTask: [task: EvaluationTask]
  openResult: [taskId: string, module: ProcessModuleKey]
  removeTask: [task: EvaluationTask]
  lockTask: [task: EvaluationTask]
}>()

const keyword = ref('')
const moduleFilter = ref<'all' | ProcessModuleKey>('all')
const cadenceFilter = ref<'all' | EvaluationCadence>('all')
const statusFilter = ref<'all' | TaskStatus>('all')

const taskMap = computed(() => new Map(props.state.tasks.map((task) => [task.id, task])))
const statuses = computed(() => Array.from(new Set(props.rows.map((row) => row.taskStatus))))
const filteredRows = computed(() => {
  const query = keyword.value.trim().toLowerCase()
  return props.rows.filter((row) => {
    if (moduleFilter.value !== 'all' && row.module !== moduleFilter.value) return false
    if (cadenceFilter.value !== 'all' && row.cadence !== cadenceFilter.value) return false
    if (statusFilter.value !== 'all' && row.taskStatus !== statusFilter.value) return false
    return !query || `${row.taskName}${row.taskId}${row.owner}${PROCESS_MODULE_MAP.get(row.module)?.shortName}`.toLowerCase().includes(query)
  })
})

function taskFor(row: ModuleResultSummary): EvaluationTask {
  return taskMap.value.get(row.taskId)!
}

function canEdit(task: EvaluationTask): boolean {
  return !['已锁定', '已作废', '撤销'].includes(task.status)
}

function canLock(task: EvaluationTask): boolean {
  return !['已锁定', '已作废', '撤销'].includes(task.status)
}

function removeLabel(task: EvaluationTask): string {
  return ['草稿', '待执行'].includes(task.status) ? '删除' : '作废'
}
</script>

<template>
  <section class="pe-results-page">
    <header class="pe-results-head">
      <div><h1>评价结果管理</h1><p>按评价任务和专业模块归集历次结果；点击任一行可打开当期评价快照。</p></div>
      <button type="button" class="pe-button pe-button-primary" @click="emit('newTask')">+ 新建评价任务</button>
    </header>

    <div class="pe-result-filters">
      <label class="pe-search-field"><span>搜索</span><input v-model="keyword" placeholder="任务名称、编号、负责人" /></label>
      <label><span>评价模块</span><select v-model="moduleFilter"><option value="all">全部模块</option><option v-for="module in PROCESS_MODULES" :key="module.key" :value="module.key">{{ module.shortName }}</option></select></label>
      <label><span>评价频次</span><select v-model="cadenceFilter"><option value="all">全部频次</option><option value="月度评价">月度评价</option><option value="季度评价">季度评价</option><option value="半年度评价">半年度评价</option><option value="专项评价">专项评价</option><option value="整改复核">整改复核</option></select></label>
      <label><span>任务状态</span><select v-model="statusFilter"><option value="all">全部状态</option><option v-for="status in statuses" :key="status" :value="status">{{ status }}</option></select></label>
      <span class="pe-filter-count">共 {{ filteredRows.length }} 条模块评价</span>
    </div>

    <div class="pe-results-table-wrap">
      <table class="pe-table pe-results-table">
        <thead><tr><th>评价日期</th><th>任务名称 / 编号</th><th>评价模块</th><th>任务性质</th><th>评价周期</th><th>结果</th><th>状态</th><th>负责人</th><th>操作</th></tr></thead>
        <tbody>
          <tr v-for="row in filteredRows" :key="`${row.taskId}-${row.module}`" :class="{ 'is-voided': row.taskStatus === '已作废' }" @click="emit('openResult', row.taskId, row.module)">
            <td><b>{{ row.evaluationDate }}</b><small>{{ row.cadence }}</small></td>
            <td><button type="button" class="pe-result-name" @click.stop="emit('openResult', row.taskId, row.module)">{{ row.taskName }}</button><small>{{ row.taskId }} · {{ row.ruleVersion }}</small></td>
            <td><span class="pe-module-pill">{{ PROCESS_MODULE_MAP.get(row.module)?.shortName }}</span></td>
            <td>{{ row.taskType }}</td>
            <td>{{ row.periodStart }}<small>至 {{ row.periodEnd }}</small></td>
            <td><b class="pe-result-score">{{ row.score === null ? '待检查' : `${row.score.toFixed(1)}分` }}</b><small>{{ row.completed }}/{{ row.applicable }} 项完成</small></td>
            <td><span class="pe-status" :class="`is-${row.taskStatus}`">{{ row.taskStatus }}</span></td>
            <td>{{ row.owner }}</td>
            <td>
              <div class="pe-row-actions">
                <button type="button" @click.stop="emit('openResult', row.taskId, row.module)">查看</button>
                <button v-if="canEdit(taskFor(row))" type="button" @click.stop="emit('editTask', taskFor(row))">编辑</button>
                <button v-if="canLock(taskFor(row))" type="button" @click.stop="emit('lockTask', taskFor(row))">锁定</button>
                <button v-if="canEdit(taskFor(row))" type="button" class="danger" @click.stop="emit('removeTask', taskFor(row))">{{ removeLabel(taskFor(row)) }}</button>
              </div>
            </td>
          </tr>
          <tr v-if="!filteredRows.length"><td colspan="9" class="pe-empty">没有符合当前筛选条件的评价记录。</td></tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
