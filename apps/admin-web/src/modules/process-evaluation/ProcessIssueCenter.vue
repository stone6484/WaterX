<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { reviewIssue, submitIssueCorrection } from './adapter'
import { PROCESS_MODULE_MAP } from './rules'
import type { EvaluationIssue, EvaluationTask, IssueStatus, ProcessEvaluationState, ProcessModuleKey, ReviewConclusion } from './types'

const props = defineProps<{ state: ProcessEvaluationState; task: EvaluationTask; readonly?: boolean }>()
const emit = defineEmits<{ openModule: [module: ProcessModuleKey]; openReport: []; notify: [message: string] }>()

const filter = ref<'全部' | IssueStatus>('全部')
const selectedIssueId = ref('')
const correction = ref('')
const reviewer = ref('')
const reviewNote = ref('')
const filters: Array<'全部' | IssueStatus> = ['全部', '待整改', '整改中', '待复核', '已关闭', '升级处理']

const taskIssues = computed(() => props.state.issues.filter((issue) => issue.taskId === props.task.id))
const visibleIssues = computed(() => filter.value === '全部' ? taskIssues.value : taskIssues.value.filter((issue) => issue.status === filter.value))
const selectedIssue = computed(() => taskIssues.value.find((issue) => issue.id === selectedIssueId.value) || null)

watch(selectedIssue, (issue) => {
  correction.value = issue?.correction || ''
  reviewer.value = issue?.reviewer || ''
  reviewNote.value = issue?.reviewNote || ''
})

function countFor(status: '全部' | IssueStatus): number {
  return status === '全部' ? taskIssues.value.length : taskIssues.value.filter((issue) => issue.status === status).length
}

function openIssue(issue: EvaluationIssue) {
  selectedIssueId.value = issue.id
}

function submitCorrection() {
  if (props.readonly) { emit('notify', '该评价任务已锁定或作废，问题记录仅可查看。'); return }
  const issue = selectedIssue.value
  if (!issue || !correction.value.trim() || !reviewer.value.trim()) { emit('notify', '请填写整改措施并指定复核人。'); return }
  if (reviewer.value.trim() === issue.assignee.trim()) { emit('notify', '整改责任人不能复核自己的整改结果。'); return }
  submitIssueCorrection(props.state, issue.id, correction.value, reviewer.value)
  emit('notify', '整改已提交复核')
}

function conclude(conclusion: ReviewConclusion) {
  if (props.readonly) { emit('notify', '该评价任务已锁定或作废，问题记录仅可查看。'); return }
  const issue = selectedIssue.value
  if (!issue || !reviewNote.value.trim()) { emit('notify', '请先填写复核意见。'); return }
  if (issue.reviewer.trim() === issue.assignee.trim()) { emit('notify', '整改责任人不能复核自己的整改结果。'); return }
  reviewIssue(props.state, issue.id, conclusion, reviewNote.value)
  emit('notify', conclusion === '关闭' ? '复核通过，问题已关闭' : conclusion === '退回整改' ? '问题已退回整改' : '问题已升级处理')
}
</script>

<template>
  <section class="pe-issues-page">
    <header class="pe-page-head">
      <div><p class="pe-eyebrow">{{ task.name }} · 统一问题台账</p><h1>问题与整改</h1><p>同一事实只形成一个主责问题和一次主扣分，其他模块仅保留关联风险。</p></div>
      <div class="pe-head-actions"><button class="pe-button pe-button-primary" @click="emit('openReport')">查看评价报告</button></div>
    </header>
    <div v-if="readonly" class="pe-readonly-banner"><b>历史结果只读</b><span>该评价任务已锁定或作废，问题与整改记录不可再修改。</span></div>

    <div class="pe-filter-tabs">
      <button v-for="item in filters" :key="item" :class="{ selected: filter === item }" @click="filter = item">{{ item }} <span>{{ countFor(item) }}</span></button>
    </div>

    <section class="pe-panel pe-issue-table-panel">
      <div class="pe-table-wrap">
        <table class="pe-table">
          <thead><tr><th>问题与来源</th><th>主责模块</th><th>关联风险</th><th>等级</th><th>责任与期限</th><th>状态</th><th></th></tr></thead>
          <tbody>
            <tr v-for="issue in visibleIssues" :key="issue.id">
              <td><b>{{ issue.title }}</b><small>{{ issue.primaryRuleCode }} · {{ issue.objectName }}</small></td>
              <td>{{ PROCESS_MODULE_MAP.get(issue.primaryModule)?.shortName }}<small>本模块主扣分</small></td>
              <td><span v-if="issue.associatedModules.length" class="pe-risk-links"><i v-for="module in issue.associatedModules" :key="module">{{ PROCESS_MODULE_MAP.get(module)?.shortName }}</i></span><span v-else>—</span></td>
              <td><span class="pe-level" :class="`is-${issue.level}`">{{ issue.level }}</span><small v-if="issue.repeat">重复问题</small></td>
              <td>{{ issue.assignee }}<small>{{ issue.dueDate }}</small></td>
              <td><span class="pe-status" :class="`is-${issue.status}`">{{ issue.status }}</span></td>
              <td><button class="pe-link" @click="openIssue(issue)">{{ issue.status === '待复核' ? '复核' : issue.status === '已关闭' ? '查看' : '整改' }}</button></td>
            </tr>
            <tr v-if="!visibleIssues.length"><td colspan="7" class="pe-empty">当前筛选条件下没有问题。</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <div v-if="selectedIssue" class="pe-modal-mask" @click.self="selectedIssueId = ''">
      <section class="pe-modal pe-issue-modal" role="dialog" aria-modal="true">
        <header><div><p class="pe-eyebrow">{{ selectedIssue.id }} · {{ selectedIssue.primaryRuleCode }}</p><h2>{{ selectedIssue.title }}</h2><p>{{ PROCESS_MODULE_MAP.get(selectedIssue.primaryModule)?.shortName }}主责扣分</p></div><button class="pe-close" @click="selectedIssueId = ''">×</button></header>
        <div class="pe-issue-summary">
          <span><small>问题等级</small><b>{{ selectedIssue.level }}</b></span><span><small>整改责任</small><b>{{ selectedIssue.assignee }}</b></span>
          <span><small>整改期限</small><b>{{ selectedIssue.dueDate }}</b></span><span><small>当前状态</small><b>{{ selectedIssue.status }}</b></span>
        </div>
        <div class="pe-detail-block"><b>问题事实</b><p>{{ selectedIssue.facts }}</p></div>
        <div class="pe-detail-block"><b>检查证据</b><p>{{ selectedIssue.evidence }}</p></div>
        <div v-if="selectedIssue.associatedModules.length" class="pe-detail-block"><b>关联风险（不重复扣分）</b><p>{{ selectedIssue.associatedModules.map((module) => PROCESS_MODULE_MAP.get(module)?.shortName).join('、') }}</p></div>
        <button class="pe-source-link" @click="emit('openModule', selectedIssue.primaryModule)">↗ 返回主责检查项所在模块</button>

        <div v-if="!readonly && ['待整改','整改中','升级处理'].includes(selectedIssue.status)" class="pe-rectify-form">
          <label>整改措施与完成证据<textarea v-model="correction" rows="4" placeholder="说明采取的措施、完成结果和验证材料"></textarea></label>
          <label>复核人<input v-model="reviewer" placeholder="必须与整改责任人不同" /></label>
          <button class="pe-button pe-button-primary" @click="submitCorrection">提交复核</button>
        </div>
        <div v-else-if="!readonly && selectedIssue.status === '待复核'" class="pe-rectify-form">
          <div class="pe-detail-block"><b>整改反馈</b><p>{{ selectedIssue.correction }}</p></div>
          <label>复核意见<textarea v-model="reviewNote" rows="3" placeholder="说明现场或资料验证结果"></textarea></label>
          <div class="pe-review-actions"><button class="pe-button pe-button-danger" @click="conclude('升级处理')">升级处理</button><button class="pe-button" @click="conclude('退回整改')">退回整改</button><button class="pe-button pe-button-primary" @click="conclude('关闭')">复核通过并关闭</button></div>
        </div>
        <div v-else class="pe-closed-result"><b>{{ selectedIssue.status === '已关闭' ? `复核结论：${selectedIssue.reviewConclusion}` : '历史整改记录' }}</b><p>{{ selectedIssue.reviewNote || selectedIssue.correction || '当前无补充整改记录。' }}</p><small>{{ selectedIssue.closedAt }}</small></div>
      </section>
    </div>
  </section>
</template>
