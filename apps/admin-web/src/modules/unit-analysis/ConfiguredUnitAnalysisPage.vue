<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import UnitAnalysisTabs from './UnitAnalysisTabs.vue'
import { getImprovementModelVersion } from './model-registry'
import { getRemainingUnitDefinition } from './remaining-unit-config'
import type { RemainingUnitCode } from './remaining-unit-config'
import {
  buildRemainingUnitView,
  getRemainingUnitScenarios,
  loadRemainingUnitState,
  resetRemainingUnitState,
  saveRemainingUnitState,
  updateRemainingCause
} from './remaining-unit-engine'
import type { RemainingRuleView } from './remaining-unit-engine'
import { advanceUnitPlan, decideUnitVerification, rollbackUnitPlan } from './state-machine'
import type { UnitAnalysisTab, UnitCauseState, UnitEvaluationStatus, UnitTabDefinition } from './types'

const props = defineProps<{ modelCode: RemainingUnitCode; siteName?: string; siteCode?: string }>()

const state = reactive(loadRemainingUnitState(props.modelCode))
const activeTab = ref<UnitAnalysisTab>('overview')
const activeDataGroup = ref('')
const activeRuleGroup = ref('全部')
const selectedRuleCode = ref('')
const causeNotes = reactive<Record<string, string>>({})
const toast = ref('')

const definition = computed(() => getRemainingUnitDefinition(props.modelCode))
const model = computed(() => getImprovementModelVersion(props.modelCode, '0.1.0'))
const scenarios = computed(() => getRemainingUnitScenarios(props.modelCode))
const view = computed(() => buildRemainingUnitView(props.modelCode, state))
const tabs = computed<UnitTabDefinition[]>(() => [
  { id: 'overview', name: '分析概览', note: '核心状态与机会' },
  { id: 'data', name: '数据与计算', note: `${model.value.fields.length}字段 / ${model.value.metrics.length}指标` },
  { id: 'diagnosis', name: '偏差诊断', note: `${model.value.rules.length}条受控规则` },
  { id: 'plan', name: '优化方案', note: '生产性试验与回退' },
  { id: 'verification', name: '效果跟踪', note: '前后可比验证' }
])

const statusMeta: Record<UnitEvaluationStatus, { label: string; tone: string }> = {
  NOT_APPLICABLE: { label: '不适用', tone: 'neutral' },
  DATA_INSUFFICIENT: { label: '数据不足', tone: 'data' },
  NORMAL: { label: '正常', tone: 'good' },
  TRIGGERED: { label: '已触发', tone: 'warn' },
  SUPPRESSED: { label: '已抑制', tone: 'suppressed' }
}
const causeStateOptions: Array<{ value: UnitCauseState; label: string }> = [
  { value: 'PENDING', label: '待核验' }, { value: 'CONFIRMED', label: '已确认' },
  { value: 'REJECTED', label: '已排除' }, { value: 'INCONCLUSIVE', label: '证据不足' },
  { value: 'NOT_APPLICABLE', label: '不适用' }
]

const fieldGroups = computed(() => Array.from(new Set(view.value.fields.map(item => item.group))))
const visibleFields = computed(() => view.value.fields.filter(item => item.group === activeDataGroup.value))
const ruleGroups = computed(() => ['全部', ...Array.from(new Set(view.value.rules.map(item => item.group)))])
const visibleRules = computed(() => activeRuleGroup.value === '全部' ? view.value.rules : view.value.rules.filter(item => item.group === activeRuleGroup.value))
const selectedRule = computed(() => view.value.rules.find(item => item.ruleCode === selectedRuleCode.value) ?? visibleRules.value[0])
const selectedCauses = computed(() => view.value.causes.filter(item => item.ruleCode === selectedRule.value?.ruleCode))
const triggeredRules = computed(() => view.value.rules.filter(item => item.status === 'TRIGGERED'))
const dataRules = computed(() => view.value.rules.filter(item => item.status === 'DATA_INSUFFICIENT'))
const suppressedRules = computed(() => view.value.rules.filter(item => item.status === 'SUPPRESSED'))
const missingFields = computed(() => view.value.fields.filter(item => item.reviewState !== 'VERIFIED'))
const dataCoverage = computed(() => Math.round(view.value.fields.reduce((sum, item) => sum + item.coverage, 0) / view.value.fields.length * 100))
const coreMetrics = computed(() => view.value.metrics.filter(item => item.status === 'VALID').slice(0, 7))
const pendingBenchmarks = computed(() => model.value.benchmarks.filter(item => !item.publishable))

function initializeSelection() {
  activeDataGroup.value = fieldGroups.value[0] ?? ''
  selectedRuleCode.value = view.value.rules.find(item => item.status === 'DATA_INSUFFICIENT')?.ruleCode
    ?? view.value.rules.find(item => item.status === 'TRIGGERED')?.ruleCode
    ?? view.value.rules[0]?.ruleCode
    ?? ''
}

function showToast(message: string) {
  toast.value = message
  window.setTimeout(() => { if (toast.value === message) toast.value = '' }, 2400)
}

function switchScenario() {
  state.causes.forEach(cause => { cause.state = 'PENDING'; cause.note = '' })
  saveRemainingUnitState(props.modelCode, state)
  initializeSelection()
  showToast('固定示范场景已切换，适用性、数据门槛和抑制状态已重新执行')
}

function resetDemo() {
  if (!window.confirm(`确定恢复${definition.value.name}固定演示数据吗？`)) return
  Object.assign(state, resetRemainingUnitState(props.modelCode))
  activeTab.value = 'overview'
  activeRuleGroup.value = '全部'
  initializeSelection()
  showToast('固定演示数据已恢复')
}

function openRule(rule: RemainingRuleView) {
  selectedRuleCode.value = rule.ruleCode
  activeTab.value = 'diagnosis'
}

function saveCause(causeCode: string, nextState: UnitCauseState) {
  updateRemainingCause(props.modelCode, state, causeCode, nextState, causeNotes[causeCode] || '')
  showToast('原因核验已保存；规则不会自动认定根因')
}

function createPlanFromRule(rule: RemainingRuleView) {
  if (['DATA_INSUFFICIENT', 'SUPPRESSED', 'NOT_APPLICABLE'].includes(rule.status)) return
  state.plan.sourceRuleCode = rule.ruleCode
  state.plan.title = `${rule.name} · 受控生产性试验`
  state.plan.objective = `${rule.recommendation}；遵守“${rule.constraint}”，不越过专业边界。`
  state.plan.status = '草稿'
  state.plan.actions.forEach(action => { action.guard = rule.constraint || action.guard; action.rollbackCondition = rule.recovery || action.rollbackCondition })
  saveRemainingUnitState(props.modelCode, state)
  activeTab.value = 'plan'
  showToast('已带入来源规则、证据、保护、停止与回退条件')
}

function advancePlan() {
  advanceUnitPlan(state.plan)
  saveRemainingUnitState(props.modelCode, state)
  showToast(`方案已进入“${state.plan.status}”`)
}

function rollbackPlan() {
  rollbackUnitPlan(state.plan)
  saveRemainingUnitState(props.modelCode, state)
  showToast('已恢复上一稳定参数并保留回退记录')
}

function persistChecks() {
  state.verification.comparable = state.verification.checks.every(item => item.passed)
  if (!state.verification.comparable) {
    state.verification.decision = 'NOT_COMPARABLE'
    state.verification.verifiedAnnualSaving = null
  } else if (state.verification.decision === 'NOT_COMPARABLE') {
    state.verification.decision = 'CONTINUE'
    state.verification.verifiedAnnualSaving = definition.value.annualSaving * 0.93
  }
  saveRemainingUnitState(props.modelCode, state)
}

function decideVerification(decision: typeof state.verification.decision) {
  if (!decideUnitVerification(state.plan, state.verification, decision, definition.value.annualSaving * 0.93)) {
    showToast('前后数据不可比，不能接受并固化候选目标')
    return
  }
  saveRemainingUnitState(props.modelCode, state)
  showToast('效果验证决策已保存')
}

function stateLabel(value: string) {
  return ({ VERIFIED: '已核验', MISSING: '缺失', ABNORMAL: '异常', VALID: '有效', MISSING_INPUT: '缺少输入', NOT_APPLICABLE: '不适用' } as Record<string, string>)[value] ?? value
}

watch(() => props.modelCode, code => {
  Object.assign(state, loadRemainingUnitState(code))
  activeTab.value = 'overview'
  activeRuleGroup.value = '全部'
  initializeSelection()
})
watch(visibleRules, rules => {
  if (rules.length && !rules.some(item => item.ruleCode === selectedRuleCode.value)) selectedRuleCode.value = rules[0].ruleCode
})
initializeSelection()
</script>

<template>
  <section class="hsc-page remaining-unit-page">
    <header class="hsc-header">
      <div><p>提质增效 · {{props.siteCode || 'WX-DEMO-01'}} · {{model.modelCode}}单体</p><h1>{{definition.name}}</h1><span>{{definition.positioning}}</span></div>
      <div class="hsc-header-actions"><span class="hsc-model-badge">模型 {{model.version}}</span><span class="hsc-draft-badge">{{model.status}} · {{pendingBenchmarks.length}}项基准待确认</span><button type="button" @click="resetDemo">重置示范数据</button></div>
    </header>

    <section class="hsc-context-bar">
      <label><span>分析对象</span><strong>{{props.siteName || 'WaterX示范污水处理厂'}} · {{definition.objectName}}</strong></label>
      <label><span>分析周期</span><strong>2026-08-01—2026-08-31</strong></label>
      <label class="hsc-scenario-select"><span>固定演示场景</span><select v-model="state.scenarioId" @change="switchScenario"><option v-for="item in scenarios" :key="item.id" :value="item.id">{{item.name}}</option></select></label>
      <label><span>数据完整度</span><strong :class="{warning:dataCoverage<90}">{{dataCoverage}}%</strong></label>
    </section>
    <p class="hsc-scenario-note"><b>{{view.scenario.name}}</b>{{view.scenario.summary}}<small>更新：{{view.scenario.updatedAt}}</small></p>

    <UnitAnalysisTabs v-model="activeTab" :tabs="tabs" :label="`${definition.name}页面`" />

    <template v-if="activeTab==='overview'">
      <section class="hsc-overview-kpis">
        <article><span>字段覆盖</span><strong>{{model.fields.length-missingFields.length}} / {{model.fields.length}}</strong><small>{{missingFields.length ? `${missingFields.length}项待补充或修正` : '关键证据完整'}}</small></article>
        <article><span>受控计算</span><strong>{{view.metrics.filter(item=>item.status==='VALID').length}} / {{model.metrics.length}}</strong><small>公式与页面分离</small></article>
        <article class="is-warning"><span>触发诊断</span><strong>{{triggeredRules.length}}</strong><small>需完成人工原因核验</small></article>
        <article class="is-data"><span>数据不足</span><strong>{{dataRules.length}}</strong><small>抑制 {{suppressedRules.length}} 条依赖规则</small></article>
        <article><span>预计年化节约</span><strong>{{(view.plan.estimatedAnnualSaving/10000).toFixed(1)}}<i>万元</i></strong><small>固定演示试算</small></article>
      </section>
      <section class="hsc-panel"><header><div><h2>核心运行画像</h2><p>实际值与DRAFT候选基准分层展示，未经试点确认不发布生产阈值。</p></div><span>基准 {{model.benchmarks.length}}项 · 全部待确认</span></header><div class="hsc-metric-cards"><article v-for="metric in coreMetrics" :key="metric.metricCode"><span>{{metric.name}}</span><strong>{{metric.display}}</strong><small>{{metric.benchmark}}</small><i :class="metric.status.toLowerCase()">{{stateLabel(metric.status)}}</i></article></div></section>
      <section class="hsc-overview-grid">
        <article class="hsc-panel hsc-diagnosis-summary"><header><div><h2>优先诊断</h2><p>适用性和数据门槛先于业务偏差。</p></div><button type="button" @click="activeTab='diagnosis'">查看全部{{model.rules.length}}条</button></header><button v-for="rule in [...dataRules,...triggeredRules].slice(0,4)" :key="rule.ruleCode" type="button" @click="openRule(rule)"><span :class="['hsc-status',statusMeta[rule.status].tone]">{{statusMeta[rule.status].label}}</span><div><b>{{rule.ruleCode}} · {{rule.name}}</b><p>{{rule.conclusion}}</p></div><em>查看 →</em></button><p v-if="!dataRules.length&&!triggeredRules.length" class="hsc-empty">当前没有触发或数据不足规则。</p></article>
        <article class="hsc-panel hsc-boundary-card"><header><div><h2>单体诊断边界</h2><p>引用专业事实，不重复形成跨域主诊断。</p></div></header><dl><div><dt>本模块形成</dt><dd>{{model.boundary.owns.join('、')}}</dd></div><div><dt>只引用</dt><dd>{{model.boundary.references.join('、')}}</dd></div><div class="forbid"><dt>禁止重复形成</dt><dd>{{model.boundary.forbids.join('、')}}</dd></div></dl></article>
      </section>
    </template>

    <template v-else-if="activeTab==='data'">
      <section class="hsc-panel hsc-data-panel"><header><div><h2>数据与受控计算</h2><p>字段、来源、覆盖率、公式和候选基准均直接读取机器模型；演示值不作为生产数据。</p></div><div><span>字段 {{model.fields.length}}</span><span>指标 {{model.metrics.length}}</span><span>基准 {{model.benchmarks.length}}</span></div></header><nav class="hsc-subtabs"><button v-for="group in [...fieldGroups,'计算指标']" :key="group" :class="{selected:activeDataGroup===group}" @click="activeDataGroup=group">{{group}}</button></nav>
        <div v-if="activeDataGroup!=='计算指标'" class="hsc-table-wrap"><table><thead><tr><th>字段</th><th>当前值</th><th>来源 / 频次</th><th>覆盖率</th><th>核验状态</th><th>适用与边界</th></tr></thead><tbody><tr v-for="field in visibleFields" :key="field.fieldCode"><td><code>{{field.fieldCode}}</code><b>{{field.name}}</b></td><td><strong>{{field.value===null?'—':field.value}}</strong> <small>{{field.unit}}</small></td><td>{{field.source}}<small>{{field.cadence}}</small></td><td>{{Math.round(field.coverage*100)}}%</td><td><span :class="['hsc-data-state',field.reviewState.toLowerCase()]">{{stateLabel(field.reviewState)}}</span></td><td>{{field.applicability}} · {{field.boundary}}</td></tr></tbody></table></div>
        <div v-else class="hsc-table-wrap"><table><thead><tr><th>指标</th><th>演示结果</th><th>受控公式</th><th>候选基准</th><th>状态</th></tr></thead><tbody><tr v-for="metric in view.metrics" :key="metric.metricCode"><td><code>{{metric.metricCode}}</code><b>{{metric.name}}</b><small>{{metric.group}}</small></td><td><strong>{{metric.display}}</strong></td><td><code class="formula">{{metric.formula}}</code><small>依赖：{{metric.dependencies.join('、')}}</small></td><td>{{metric.benchmark}}</td><td><span :class="['hsc-data-state',metric.status.toLowerCase()]">{{stateLabel(metric.status)}}</span></td></tr></tbody></table></div>
      </section>
    </template>

    <template v-else-if="activeTab==='diagnosis'">
      <section v-if="dataRules.length" class="hsc-data-gate"><b>数据规则优先</b><span>{{dataRules.map(item=>item.ruleCode).join('、')}} 返回 DATA_INSUFFICIENT；仅输出补数要求，{{suppressedRules.length}}条依赖规则不发布偏差。</span></section>
      <nav class="hsc-rule-filters"><button v-for="group in ruleGroups" :key="group" :class="{selected:activeRuleGroup===group}" @click="activeRuleGroup=group">{{group}}<small>{{group==='全部'?view.rules.length:view.rules.filter(item=>item.group===group).length}}</small></button></nav>
      <section class="hsc-diagnosis-grid"><aside class="hsc-rule-list"><button v-for="rule in visibleRules" :key="rule.ruleCode" type="button" :class="{selected:selectedRule?.ruleCode===rule.ruleCode}" @click="selectedRuleCode=rule.ruleCode"><div><code>{{rule.ruleCode}}</code><span :class="['hsc-status',statusMeta[rule.status].tone]">{{statusMeta[rule.status].label}}</span></div><b>{{rule.name}}</b><small>{{rule.group}} · {{rule.severity}}</small></button></aside>
        <article v-if="selectedRule" class="hsc-rule-detail"><header><div><p>{{selectedRule.ruleCode}} · {{selectedRule.group}}</p><h2>{{selectedRule.name}}</h2></div><span :class="['hsc-status',statusMeta[selectedRule.status].tone]">{{statusMeta[selectedRule.status].label}}</span></header><section class="hsc-conclusion"><b>当前结论</b><p>{{selectedRule.conclusion}}</p><small>结论类型：{{selectedRule.conclusionType}}</small></section><section><h3>证据链</h3><ul class="hsc-evidence"><li v-for="item in selectedRule.evidence" :key="item">{{item}}</li></ul></section><section class="hsc-rule-grid"><div><b>{{selectedRule.status==='DATA_INSUFFICIENT'?'补数要求':'建议动作'}}</b><p>{{selectedRule.recommendation}}</p></div><div><b>约束 / 停止边界</b><p>{{selectedRule.constraint}}</p></div><div><b>恢复条件</b><p>{{selectedRule.recovery}}</p></div><div><b>专业边界</b><p>{{selectedRule.boundaryNote}}</p></div></section>
          <section v-if="selectedCauses.length" class="hsc-causes"><header><div><h3>原因核验</h3><p>原因只作为待核验证据，规则不会自动认定根因。</p></div><span>{{selectedCauses.filter(item=>item.state!=='PENDING').length}} / {{selectedCauses.length}}</span></header><article v-for="cause in selectedCauses" :key="cause.causeCode"><div><code>{{cause.causeCode}}</code><b>{{cause.category}} · {{cause.question}}</b><p>所需证据：{{cause.requiredEvidence}}</p><small>确认条件：{{cause.confirmationCriteria}}</small></div><div><select :value="cause.state" @change="saveCause(cause.causeCode,($event.target as HTMLSelectElement).value as UnitCauseState)"><option v-for="option in causeStateOptions" :key="option.value" :value="option.value">{{option.label}}</option></select><input v-model="causeNotes[cause.causeCode]" placeholder="核验备注（可选）" @change="saveCause(cause.causeCode,cause.state)" /></div></article></section>
          <footer><span>{{['DATA_INSUFFICIENT','SUPPRESSED','NOT_APPLICABLE'].includes(selectedRule.status)?'当前只允许补齐证据，不生成业务方案。':'方案将带入来源、证据、保护、停止和回退条件。'}}</span><button type="button" :disabled="['DATA_INSUFFICIENT','SUPPRESSED','NOT_APPLICABLE'].includes(selectedRule.status)" @click="createPlanFromRule(selectedRule)">发起优化方案</button></footer>
        </article>
      </section>
    </template>

    <template v-else-if="activeTab==='plan'">
      <section class="hsc-panel hsc-plan-head"><header><div><p>{{view.plan.id}} · 来源 {{view.plan.sourceRuleCode}}</p><h2>{{view.plan.title}}</h2><span>{{view.plan.objective}}</span></div><em>{{view.plan.status}}</em></header><div><span>预计年化节约</span><strong>{{view.plan.estimatedAnnualSaving.toLocaleString('zh-CN')}} 元</strong><small>演示试算，不作财务确认</small></div></section><section class="hsc-plan-actions"><article v-for="(action,index) in view.plan.actions" :key="action.id"><header><span>{{index+1}}</span><div><b>{{action.title}}</b><small>{{action.id}} · {{action.owner}}</small></div><em>{{action.status}}</em></header><dl><div><dt>当前 / 目标</dt><dd>{{action.currentValue}} → <b>{{action.targetValue}}</b></dd></div><div><dt>执行步骤</dt><dd>{{action.step}}</dd></div><div class="guard"><dt>保护指标</dt><dd>{{action.guard}}</dd></div><div class="stop"><dt>停止条件</dt><dd>{{action.stopCondition}}</dd></div><div class="rollback"><dt>回退条件</dt><dd>{{action.rollbackCondition}}</dd></div></dl></article></section><section class="hsc-decision"><div><b>方案状态机</b><span>草稿 → 待审批 → 执行中 → 待验证 → 已完成；全程可回退</span></div><button type="button" @click="rollbackPlan">执行回退</button><button type="button" class="primary" :disabled="['已完成','已回退'].includes(view.plan.status)" @click="advancePlan">推进下一状态</button></section>
    </template>

    <template v-else>
      <section class="hsc-panel hsc-verification-head"><header><div><h2>前后效果可比性</h2><p>对象、负荷、数据方法和保护指标全部可比后才能认定收益。</p></div><span :class="['hsc-status',view.verification.comparable?'good':'data']">{{view.verification.comparable?'可比':'不可比'}}</span></header><div class="hsc-checks"><article v-for="check in view.verification.checks" :key="check.name" :class="{passed:check.passed}"><input type="checkbox" v-model="check.passed" @change="persistChecks" /><b>{{check.name}}</b><span>{{check.note}}</span></article></div></section><section class="hsc-compare-grid"><article class="hsc-panel"><header><h2>基线期</h2><span>受控快照V1</span></header><dl><div v-for="item in view.verification.before" :key="item.name"><dt>{{item.name}}</dt><dd>{{item.value}}</dd></div></dl></article><article class="hsc-panel after"><header><h2>试验期</h2><span>生产性试验T1</span></header><dl><div v-for="item in view.verification.after" :key="item.name"><dt>{{item.name}}</dt><dd>{{item.value}}</dd></div></dl></article><article class="hsc-panel saving"><span>验证年化节约</span><strong>{{view.verification.verifiedAnnualSaving?.toLocaleString('zh-CN') || '待验证'}}<small> 元/年</small></strong><p>{{view.verification.note}}</p></article></section><section class="hsc-decision"><div><b>验证决策</b><span>当前：{{view.verification.decision}}</span></div><button type="button" @click="decideVerification('CONTINUE')">继续观察</button><button type="button" @click="decideVerification('NOT_COMPARABLE')">标记不可比</button><button type="button" @click="decideVerification('ROLLBACK')">回退</button><button type="button" class="primary" :disabled="!view.verification.comparable" @click="decideVerification('ACCEPT')">接受并固化候选目标</button></section>
    </template>
    <transition name="hsc-toast"><div v-if="toast" class="hsc-toast">{{toast}}</div></transition>
  </section>
</template>

<style src="../high-efficiency-sedimentation/high-efficiency-sedimentation.css"></style>
<style scoped>
.remaining-unit-page :deep(.hsc-metric-cards){grid-template-columns:repeat(7,minmax(0,1fr))}.remaining-unit-page :deep(.hsc-checks article){grid-template-columns:23px minmax(0,1fr);align-items:start}.remaining-unit-page :deep(.hsc-checks input){margin-top:3px;accent-color:#21866c}.remaining-unit-page :deep(.hsc-table-wrap td:nth-child(3) small){display:block;margin-top:4px}@media(max-width:1280px){.remaining-unit-page :deep(.hsc-metric-cards){grid-template-columns:repeat(4,minmax(0,1fr))}}@media(max-width:800px){.remaining-unit-page :deep(.hsc-metric-cards){grid-template-columns:repeat(2,minmax(0,1fr))}}
</style>
