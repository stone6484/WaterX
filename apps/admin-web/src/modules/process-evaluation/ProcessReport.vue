<script setup lang="ts">
import { computed } from 'vue'
import { persistProcessEvaluationState, reportBlockers } from './adapter'
import { PROCESS_MODULE_MAP } from './rules'
import type { EvaluationTask, ModuleSummary, ProcessEvaluationState, ProcessModuleKey } from './types'

const props = defineProps<{ state: ProcessEvaluationState; task: EvaluationTask; summaries: ModuleSummary[]; readonly?: boolean }>()
const emit = defineEmits<{ openIssues: []; openModule: [module: ProcessModuleKey]; notify: [message: string] }>()

const blockers = computed(() => reportBlockers(props.state, props.task.id))
const taskIssues = computed(() => props.state.issues.filter((issue) => issue.taskId === props.task.id))
const priorityIssues = computed(() => taskIssues.value.filter((issue) => issue.status !== '已关闭').sort((a, b) => {
  const rank = { '关键控制失效': 4, '重大': 3, '重要': 2, '一般': 1 }
  return rank[b.level] - rank[a.level]
}))

const managementConclusion = computed(() => props.summaries.map((summary) => {
  const name = PROCESS_MODULE_MAP.get(summary.module)?.shortName
  if (summary.completed === 0) return `${name}尚未开始。`
  return `${name}${summary.status}，当前预估 ${summary.score?.toFixed(1)} 分，${summary.issueCount} 个问题。`
}).join(''))

function submitReport() {
  if (props.readonly) { emit('notify', '该评价任务已锁定或作废，报告仅可查看。'); return }
  if (blockers.value.length) { emit('notify', `报告暂不能发布：${blockers.value[0]}`); return }
  props.task.status = '待发布'
  persistProcessEvaluationState(props.state)
  emit('notify', '评价报告已提交审批')
}
</script>

<template>
  <section class="pe-report-page">
    <header class="pe-page-head">
      <div><div class="pe-inline"><span class="pe-status" :class="blockers.length ? 'is-待整改' : 'is-待发布'">{{ blockers.length ? '报告草稿' : '可提交审批' }}</span><span class="pe-tag">{{ task.ruleVersion }}</span></div><h1>{{ task.name }}报告</h1><p>{{ task.siteName }} · {{ task.periodStart }} 至 {{ task.periodEnd }} · {{ task.type }}</p></div>
      <div class="pe-head-actions"><button class="pe-button pe-button-primary" :disabled="blockers.length > 0 || readonly" @click="submitReport">{{ readonly ? '报告已锁定' : '提交审批' }}</button></div>
    </header>

    <div class="pe-report-grid">
      <section class="pe-panel">
        <div class="pe-panel-head"><div><h2>五模块过程画像</h2><p>各模块独立 100 分，不计算简单平均总分。</p></div></div>
        <button v-for="summary in summaries" :key="summary.module" class="pe-report-module" @click="emit('openModule', summary.module)">
          <span>{{ PROCESS_MODULE_MAP.get(summary.module)?.shortName }}</span>
          <div class="pe-report-bar"><i :style="{ width: `${summary.score || 0}%` }"></i></div>
          <b>{{ summary.score === null ? '待检查' : summary.score.toFixed(1) }}</b>
          <em class="pe-status" :class="`is-${summary.status}`">{{ summary.status }}</em>
        </button>
      </section>
      <section class="pe-panel">
        <div class="pe-panel-head"><div><h2>管理判断</h2><p>基于当前已完成检查项与问题等级形成。</p></div></div>
        <p class="pe-conclusion">{{ managementConclusion }}</p>
        <div class="pe-issue-counts"><span>重大/关键 <b>{{ taskIssues.filter((issue) => ['重大','关键控制失效'].includes(issue.level)).length }}</b></span><span>重要 <b>{{ taskIssues.filter((issue) => issue.level === '重要').length }}</b></span><span>一般 <b>{{ taskIssues.filter((issue) => issue.level === '一般').length }}</b></span></div>
      </section>
    </div>

    <section v-if="blockers.length" class="pe-panel pe-blocker-panel">
      <div class="pe-panel-head"><div><h2>发布前阻塞项</h2><p>以下条件处理完成后方可提交审批或正式发布。</p></div><span>{{ blockers.length }} 项</span></div>
      <ul><li v-for="item in blockers" :key="item">{{ item }}</li></ul>
    </section>

    <section class="pe-panel">
      <div class="pe-panel-head"><div><h2>优先整改事项</h2><p>按问题等级和当前状态排列，主责模块只扣一次。</p></div><button class="pe-button" @click="emit('openIssues')">查看问题与整改</button></div>
      <div class="pe-table-wrap"><table class="pe-table"><thead><tr><th>问题</th><th>主责 / 关联</th><th>等级</th><th>责任人</th><th>期限</th><th>状态</th></tr></thead><tbody>
        <tr v-for="issue in priorityIssues" :key="issue.id"><td><b>{{ issue.title }}</b><small>{{ issue.primaryRuleCode }}</small></td><td>{{ PROCESS_MODULE_MAP.get(issue.primaryModule)?.shortName }}<small>{{ issue.associatedModules.length ? `关联：${issue.associatedModules.map((module) => PROCESS_MODULE_MAP.get(module)?.shortName).join('、')}` : '无重复扣分' }}</small></td><td><span class="pe-level" :class="`is-${issue.level}`">{{ issue.level }}</span></td><td>{{ issue.assignee }}</td><td>{{ issue.dueDate }}</td><td><span class="pe-status" :class="`is-${issue.status}`">{{ issue.status }}</span></td></tr>
        <tr v-if="!priorityIssues.length"><td colspan="6" class="pe-empty">当前没有未关闭问题。</td></tr>
      </tbody></table></div>
    </section>

    <section class="pe-panel pe-method-note">
      <h2>评价方法与边界</h2>
      <div><p><b>计分：</b>分类权重 × 适用项重要程度系数占比 × 结果系数；关键控制失效不能被一般项高分抵消。</p><p><b>去重：</b>同一事实确定一个最早失效控制作为主责问题，其他模块仅关联风险。</p><p><b>排除：</b>达标率、电耗、利润和回款等结果指标不进入过程评价；在线水质第三方运维监督统一归化验管理。</p></div>
    </section>
  </section>
</template>
