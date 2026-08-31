<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import UnitAnalysisTabs from '../unit-analysis/UnitAnalysisTabs.vue'
import { advanceUnitPlan, decideUnitVerification, rollbackUnitPlan } from '../unit-analysis/state-machine'
import type { UnitTabDefinition } from '../unit-analysis/types'
import {
  buildHscView,
  loadHscState,
  resetHscState,
  saveHscState,
  updateCauseState,
  updatePlan,
  updateVerification
} from './adapter'
import { createCauseVerifications } from './engine'
import { DEFAULT_HSC_SCENARIO_ID, hscScenarios } from './demo-data'
import { HSC_MODEL_LABEL, HSC_MODEL_STATUS, confirmedBenchmarks, hscModel, modelCounts, pendingBenchmarks } from './model'
import type { HscCauseState, HscEvaluationStatus, HscRuleResult, HscTab } from './types'

const props = defineProps<{ siteName?: string; siteCode?: string }>()

const state = reactive(loadHscState())
const activeTab = ref<HscTab>('overview')
const activeDataGroup = ref('构筑物')
const activeRuleGroup = ref('全部')
const selectedRuleCode = ref(state.scenarioId === 'chemical-data-gap'
  ? 'HSC-DATA-01'
  : state.scenarioId === 'sample-incomparable' ? 'HSC-DATA-02' : 'HSC-CHEM-04')
const causeNotes = reactive<Record<string, string>>({})
const toast = ref('')

const tabs: UnitTabDefinition[] = [
  { id: 'overview', name: '分析概览', note: '核心状态与机会' },
  { id: 'data', name: '数据与计算', note: '60字段 / 29指标' },
  { id: 'diagnosis', name: '偏差诊断', note: '20条受控规则' },
  { id: 'plan', name: '优化方案', note: '动作与安全边界' },
  { id: 'verification', name: '效果跟踪', note: '前后可比验证' }
]

const statusMeta: Record<HscEvaluationStatus, { label: string; tone: string }> = {
  NOT_APPLICABLE: { label: '不适用', tone: 'neutral' },
  DATA_INSUFFICIENT: { label: '数据不足', tone: 'data' },
  NORMAL: { label: '正常', tone: 'good' },
  TRIGGERED: { label: '已触发', tone: 'warn' },
  SUPPRESSED: { label: '已抑制', tone: 'suppressed' }
}

const causeStateOptions: Array<{ value: HscCauseState; label: string }> = [
  { value: 'PENDING', label: '待核验' },
  { value: 'CONFIRMED', label: '已确认' },
  { value: 'REJECTED', label: '已排除' },
  { value: 'INCONCLUSIVE', label: '证据不足' },
  { value: 'NOT_APPLICABLE', label: '不适用' }
]

const view = computed(() => buildHscView(state))
const fieldGroups = computed(() => Array.from(new Set(view.value.fields.map(item => item.group))))
const metricGroups = computed(() => Array.from(new Set(view.value.metrics.map(item => item.group))))
const visibleFields = computed(() => view.value.fields.filter(item => item.group === activeDataGroup.value))
const visibleMetrics = computed(() => activeDataGroup.value === '计算指标'
  ? view.value.metrics
  : view.value.metrics.filter(item => item.group === activeDataGroup.value || metricGroupForFieldGroup(activeDataGroup.value).includes(item.group)))
const ruleGroups = computed(() => ['全部', ...Array.from(new Set(view.value.rules.map(item => item.group)))])
const visibleRules = computed(() => activeRuleGroup.value === '全部'
  ? view.value.rules
  : view.value.rules.filter(item => item.group === activeRuleGroup.value))
const selectedRule = computed(() => view.value.rules.find(item => item.ruleCode === selectedRuleCode.value) ?? visibleRules.value[0])
const selectedCauses = computed(() => view.value.causes.filter(item => item.ruleCode === selectedRule.value?.ruleCode))
const triggeredRules = computed(() => view.value.rules.filter(item => item.status === 'TRIGGERED'))
const dataRules = computed(() => view.value.rules.filter(item => item.status === 'DATA_INSUFFICIENT'))
const suppressedRules = computed(() => view.value.rules.filter(item => item.status === 'SUPPRESSED'))
const missingFields = computed(() => view.value.fields.filter(item => item.reviewState === 'MISSING' || item.reviewState === 'ABNORMAL'))
const dataCoverage = computed(() => Math.round(view.value.fields.reduce((sum, item) => sum + item.coverage, 0) / view.value.fields.length * 100))
const coreMetrics = computed(() => ['ACT_SURFACE_LOAD', 'SS_REMOVAL', 'TP_REMOVAL', 'COAG_DOSAGE', 'RETURN_RATIO', 'UNIT_ENERGY_INTENSITY', 'TOTAL_COST_PER_WATER']
  .map(code => view.value.metrics.find(item => item.metricCode === code))
  .filter((item): item is NonNullable<typeof item> => Boolean(item)))

function metricGroupForFieldGroup(group: string): string[] {
  const mapping: Record<string, string[]> = {
    '设计基线': ['能力'],
    '构筑物': ['能力', '控制'],
    '周期运行': ['能力', '效率'],
    '水质': ['效果'],
    '运行控制': ['控制'],
    '药剂基线': ['效率'],
    '污泥控制': ['污泥'],
    '能耗成本': ['能耗', '成本', '收益']
  }
  return mapping[group] ?? []
}

function showToast(message: string) {
  toast.value = message
  window.setTimeout(() => { if (toast.value === message) toast.value = '' }, 2600)
}

function switchScenario() {
  state.causes = createCauseVerifications()
  saveHscState(state)
  const firstImportant = view.value.rules.find(item => item.status === 'DATA_INSUFFICIENT')
    ?? view.value.rules.find(item => item.status === 'TRIGGERED')
  selectedRuleCode.value = firstImportant?.ruleCode ?? 'HSC-CHEM-04'
  showToast('已切换固定演示场景，规则状态已按优先级重新计算')
}

function resetDemo() {
  if (!window.confirm('确定恢复高效沉淀池V1.0固定演示数据吗？')) return
  Object.assign(state, resetHscState(DEFAULT_HSC_SCENARIO_ID))
  activeTab.value = 'overview'
  selectedRuleCode.value = 'HSC-CHEM-04'
  showToast('固定演示数据已恢复')
}

function openRule(rule: HscRuleResult) {
  selectedRuleCode.value = rule.ruleCode
  activeTab.value = 'diagnosis'
}

function saveCause(causeCode: string, nextState: HscCauseState) {
  updateCauseState(state, causeCode, nextState, causeNotes[causeCode] || '')
  showToast('原因核验状态已保存到本地演示数据')
}

function createPlanFromRule(rule: HscRuleResult) {
  if (rule.status === 'DATA_INSUFFICIENT' || rule.status === 'SUPPRESSED') {
    showToast('数据规则只允许提出补数要求，不能生成业务优化方案')
    return
  }
  state.plan.sourceRuleCode = rule.ruleCode
  state.plan.title = `${rule.name} · 单体优化验证`
  state.plan.objective = `${rule.recommendation}；全过程遵守“${rule.constraint}”。`
  state.plan.status = '草稿'
  updatePlan(state, state.plan)
  activeTab.value = 'plan'
  showToast('已带入来源规则、证据和约束条件')
}

function advancePlan() {
  advanceUnitPlan(state.plan)
  updatePlan(state, state.plan)
  showToast(`优化方案已进入“${state.plan.status}”`)
}

function rollbackPlan() {
  rollbackUnitPlan(state.plan)
  updatePlan(state, state.plan)
  showToast('已执行示范回退：恢复上一稳定档位并保留验证记录')
}

function decideVerification(decision: typeof state.verification.decision) {
  if (!decideUnitVerification(state.plan, state.verification, decision, 96900)) {
    showToast('前后数据不可比，不能接受并固化新目标')
    return
  }
  updateVerification(state, state.verification)
  updatePlan(state, state.plan)
  showToast('效果验证决策已保存')
}

function stateLabel(stateName: string) {
  const labels: Record<string, string> = {
    VERIFIED: '已核验', PENDING: '待核验', MISSING: '缺失', ABNORMAL: '异常',
    VALID: '有效', MISSING_INPUT: '缺少输入', NOT_APPLICABLE: '不适用', CALCULATION_INVALID: '计算无效'
  }
  return labels[stateName] ?? stateName
}

watch(visibleRules, rules => {
  if (rules.length && !rules.some(item => item.ruleCode === selectedRuleCode.value)) selectedRuleCode.value = rules[0].ruleCode
})
</script>

<template>
  <section class="hsc-page">
    <header class="hsc-header">
      <div>
        <p>提质增效 · {{props.siteCode || 'WX-DEMO-01'}} · HSC单体</p>
        <h1>高效沉淀池分析</h1>
        <span>聚焦单体水力、混合絮凝、沉淀、药剂、排泥、能耗成本与优化验证。</span>
      </div>
      <div class="hsc-header-actions">
        <span class="hsc-model-badge">模型 {{HSC_MODEL_LABEL}}</span>
        <span class="hsc-draft-badge">{{HSC_MODEL_STATUS}} · 待试点确认</span>
        <button type="button" @click="resetDemo">重置示范数据</button>
      </div>
    </header>

    <section class="hsc-context-bar">
      <label><span>分析对象</span><strong>{{props.siteName || 'WaterX示范污水处理厂'}} · 1#高效沉淀池</strong></label>
      <label><span>分析周期</span><strong>{{view.scenario.values.analysis_period}}</strong></label>
      <label class="hsc-scenario-select"><span>固定演示场景</span><select v-model="state.scenarioId" @change="switchScenario"><option v-for="item in hscScenarios" :key="item.id" :value="item.id">{{item.name}}</option></select></label>
      <label><span>数据完整度</span><strong :class="{warning:dataCoverage<90}">{{dataCoverage}}%</strong></label>
    </section>
    <p class="hsc-scenario-note"><b>{{view.scenario.name}}</b>{{view.scenario.summary}}<small>更新：{{view.scenario.updatedAt}}</small></p>

    <UnitAnalysisTabs v-model="activeTab" :tabs="tabs" label="高效沉淀池分析页面" />

    <template v-if="activeTab==='overview'">
      <section class="hsc-overview-kpis">
        <article><span>字段覆盖</span><strong>{{modelCounts.fields-missingFields.length}} / {{modelCounts.fields}}</strong><small>{{missingFields.length ? `${missingFields.length}项待补充或修正` : '关键证据完整'}}</small></article>
        <article><span>计算指标</span><strong>{{view.metrics.filter(item=>item.status==='VALID').length}} / {{modelCounts.metrics}}</strong><small>未确认参数不伪装成正式结果</small></article>
        <article class="is-warning"><span>触发诊断</span><strong>{{triggeredRules.length}}</strong><small>需完成原因核验</small></article>
        <article class="is-data"><span>数据不足</span><strong>{{dataRules.length}}</strong><small>抑制 {{suppressedRules.length}} 条依赖规则</small></article>
        <article><span>预计年化节约</span><strong>{{(view.plan.estimatedAnnualSaving/10000).toFixed(1)}}<i>万元</i></strong><small>示范测算，待效果验证</small></article>
      </section>

      <section class="hsc-panel">
        <header><div><h2>核心运行画像</h2><p>设计 / 目标 / 实际分层展示，目标与经验基准均保留确认状态。</p></div><span>{{confirmedBenchmarks.length}}项已确认 · {{pendingBenchmarks.length}}项待确认</span></header>
        <div class="hsc-metric-cards"><article v-for="metric in coreMetrics" :key="metric.metricCode"><span>{{metric.name}}</span><strong>{{metric.display}}</strong><small>{{metric.benchmark}}</small><i :class="metric.status.toLowerCase()">{{stateLabel(metric.status)}}</i></article></div>
      </section>

      <section class="hsc-overview-grid">
        <article class="hsc-panel hsc-diagnosis-summary">
          <header><div><h2>优先诊断</h2><p>数据规则优先于业务规则执行。</p></div><button type="button" @click="activeTab='diagnosis'">查看全部20条</button></header>
          <button v-for="rule in [...dataRules,...triggeredRules].slice(0,4)" :key="rule.ruleCode" type="button" @click="openRule(rule)"><span :class="['hsc-status',statusMeta[rule.status].tone]">{{statusMeta[rule.status].label}}</span><div><b>{{rule.ruleCode}} · {{rule.name}}</b><p>{{rule.conclusion}}</p></div><em>查看 →</em></button>
          <p v-if="!dataRules.length&&!triggeredRules.length" class="hsc-empty">当前没有触发或数据不足规则。</p>
        </article>
        <article class="hsc-panel hsc-boundary-card">
          <header><div><h2>单体诊断边界</h2><p>引用专业事实，不重复形成跨域主诊断。</p></div></header>
          <dl><div><dt>本模块形成</dt><dd>{{hscModel.boundary.owns.join('、')}}</dd></div><div><dt>只引用</dt><dd>{{hscModel.boundary.references.join('、')}}</dd></div><div class="forbid"><dt>禁止重复形成</dt><dd>{{hscModel.boundary.forbids.join('、')}}</dd></div></dl>
        </article>
      </section>
    </template>

    <template v-else-if="activeTab==='data'">
      <section class="hsc-panel hsc-data-panel">
        <header><div><h2>数据与受控计算</h2><p>一手事实、来源、覆盖率和计算结果分开呈现；本页不把待确认化学参数发布为正式值。</p></div><div><span>字段 {{modelCounts.fields}}</span><span>指标 {{modelCounts.metrics}}</span><span>基准 {{modelCounts.benchmarks}}</span></div></header>
        <nav class="hsc-subtabs"><button v-for="group in [...fieldGroups,'计算指标']" :key="group" :class="{selected:activeDataGroup===group}" @click="activeDataGroup=group">{{group}}</button></nav>
        <div v-if="activeDataGroup!=='计算指标'" class="hsc-table-wrap"><table><thead><tr><th>字段</th><th>当前值</th><th>来源</th><th>覆盖率</th><th>核验状态</th><th>说明</th></tr></thead><tbody><tr v-for="field in visibleFields" :key="field.fieldCode"><td><code>{{field.fieldCode}}</code><b>{{field.name}}</b></td><td><strong>{{field.value===null?'—':field.value}}</strong> <small>{{field.unit}}</small></td><td>{{field.source}}</td><td>{{Math.round(field.coverage*100)}}%</td><td><span :class="['hsc-data-state',field.reviewState.toLowerCase()]">{{stateLabel(field.reviewState)}}</span></td><td>{{hscModel.fields.find(item=>item.fieldCode===field.fieldCode)?.boundaryNote}}</td></tr></tbody></table></div>
        <div v-else class="hsc-table-wrap"><table><thead><tr><th>指标</th><th>计算结果</th><th>公式</th><th>适用基准</th><th>状态</th></tr></thead><tbody><tr v-for="metric in view.metrics" :key="metric.metricCode"><td><code>{{metric.metricCode}}</code><b>{{metric.name}}</b><small>{{metric.group}}</small></td><td><strong>{{metric.display}}</strong></td><td><code class="formula">{{metric.formula}}</code></td><td>{{metric.benchmark}}</td><td><span :class="['hsc-data-state',metric.status.toLowerCase()]">{{stateLabel(metric.status)}}</span></td></tr></tbody></table></div>
      </section>
    </template>

    <template v-else-if="activeTab==='diagnosis'">
      <section v-if="dataRules.length" class="hsc-data-gate"><b>数据规则优先</b><span>{{dataRules.map(item=>item.ruleCode).join('、')}} 命中 DATA_INSUFFICIENT；仅输出补数要求，{{suppressedRules.length}}条依赖业务规则不发布偏差。</span></section>
      <nav class="hsc-rule-filters"><button v-for="group in ruleGroups" :key="group" :class="{selected:activeRuleGroup===group}" @click="activeRuleGroup=group">{{group}}<small>{{group==='全部'?view.rules.length:view.rules.filter(item=>item.group===group).length}}</small></button></nav>
      <section class="hsc-diagnosis-grid">
        <aside class="hsc-rule-list"><button v-for="rule in visibleRules" :key="rule.ruleCode" type="button" :class="{selected:selectedRule?.ruleCode===rule.ruleCode}" @click="selectedRuleCode=rule.ruleCode"><div><code>{{rule.ruleCode}}</code><span :class="['hsc-status',statusMeta[rule.status].tone]">{{statusMeta[rule.status].label}}</span></div><b>{{rule.name}}</b><small>{{rule.group}} · {{rule.severity}}</small></button></aside>
        <article v-if="selectedRule" class="hsc-rule-detail">
          <header><div><p>{{selectedRule.ruleCode}} · {{selectedRule.group}}</p><h2>{{selectedRule.name}}</h2></div><span :class="['hsc-status',statusMeta[selectedRule.status].tone]">{{statusMeta[selectedRule.status].label}}</span></header>
          <section class="hsc-conclusion"><b>当前结论</b><p>{{selectedRule.conclusion}}</p><small>结论类型：{{selectedRule.conclusionType}}</small></section>
          <section><h3>证据链</h3><ul class="hsc-evidence"><li v-for="item in selectedRule.evidence" :key="item">{{item}}</li></ul></section>
          <section class="hsc-rule-grid"><div><b>{{selectedRule.status==='DATA_INSUFFICIENT'?'补数要求':'建议动作'}}</b><p>{{selectedRule.recommendation}}</p></div><div><b>约束 / 停止边界</b><p>{{selectedRule.constraint}}</p></div><div><b>恢复条件</b><p>{{selectedRule.recovery}}</p></div><div><b>专业边界</b><p>{{selectedRule.boundaryNote}}</p></div></section>
          <section v-if="selectedCauses.length" class="hsc-causes"><header><div><h3>原因核验</h3><p>先核验客观事实，再决定是否形成优化动作。</p></div><span>{{selectedCauses.filter(item=>item.state!=='PENDING').length}} / {{selectedCauses.length}}</span></header><article v-for="cause in selectedCauses" :key="cause.causeCode"><div><code>{{cause.causeCode}}</code><b>{{cause.category}} · {{cause.question}}</b><p>所需证据：{{cause.requiredEvidence}}</p><small>确认条件：{{cause.confirmationCriteria}}</small></div><div><select :value="cause.state" @change="saveCause(cause.causeCode,($event.target as HTMLSelectElement).value as HscCauseState)"><option v-for="option in causeStateOptions" :key="option.value" :value="option.value">{{option.label}}</option></select><input v-model="causeNotes[cause.causeCode]" placeholder="核验备注（可选）" @change="saveCause(cause.causeCode,cause.state)" /></div></article></section>
          <footer><span v-if="selectedRule.status==='DATA_INSUFFICIENT'||selectedRule.status==='SUPPRESSED'">当前只允许补齐证据，不能发起业务优化。</span><span v-else>方案将自动带入来源规则、证据、约束和回退要求。</span><button type="button" :disabled="selectedRule.status==='DATA_INSUFFICIENT'||selectedRule.status==='SUPPRESSED'||selectedRule.status==='NOT_APPLICABLE'" @click="createPlanFromRule(selectedRule)">发起优化方案</button></footer>
        </article>
      </section>
    </template>

    <template v-else-if="activeTab==='plan'">
      <section class="hsc-panel hsc-plan-head"><header><div><p>{{view.plan.id}} · 来源 {{view.plan.sourceRuleCode}}</p><h2>{{view.plan.title}}</h2><span>{{view.plan.objective}}</span></div><em>{{view.plan.status}}</em></header><div><span>预计年化节约</span><strong>{{view.plan.estimatedAnnualSaving.toLocaleString('zh-CN')}} 元</strong><small>示范测算，不作为财务收益确认</small></div></section>
      <section class="hsc-plan-actions"><article v-for="(action,index) in view.plan.actions" :key="action.id"><header><span>{{index+1}}</span><div><b>{{action.title}}</b><small>{{action.id}} · {{action.owner}}</small></div><em>{{action.status}}</em></header><dl><div><dt>当前 / 目标</dt><dd>{{action.currentValue}} → <b>{{action.targetValue}}</b></dd></div><div><dt>执行步骤</dt><dd>{{action.step}}</dd></div><div class="guard"><dt>守护指标</dt><dd>{{action.guard}}</dd></div><div class="stop"><dt>停止条件</dt><dd>{{action.stopCondition}}</dd></div><div class="rollback"><dt>回退条件</dt><dd>{{action.rollbackCondition}}</dd></div></dl></article></section>
      <section class="hsc-plan-footer"><div><b>受控执行原则</b><span>小步调整 · 每档等待HRT稳定 · 守护指标不恶化 · 随时可停止和回退</span></div><button type="button" @click="rollbackPlan">执行回退</button><button type="button" class="primary" :disabled="['已完成','已回退'].includes(view.plan.status)" @click="advancePlan">推进至下一状态</button></section>
    </template>

    <template v-else>
      <section class="hsc-panel hsc-verification-head"><header><div><h2>前后效果验证</h2><p>只有数据可比、守护指标不恶化且结论被接受，才允许固化新的单体目标。</p></div><span :class="['hsc-status',view.verification.comparable?'good':'data']">{{view.verification.comparable?'数据可比':'不可比'}}</span></header><div class="hsc-checks"><article v-for="check in view.verification.checks" :key="check.name" :class="{passed:check.passed}"><i>{{check.passed?'✓':'!'}}</i><b>{{check.name}}</b><span>{{check.note}}</span></article></div></section>
      <section class="hsc-compare-grid"><article class="hsc-panel"><header><h2>优化前</h2><span>稳定基线窗口</span></header><dl><div v-for="item in view.verification.before" :key="item.name"><dt>{{item.name}}</dt><dd>{{item.value}}</dd></div></dl></article><article class="hsc-panel after"><header><h2>优化后</h2><span>同口径验证窗口</span></header><dl><div v-for="item in view.verification.after" :key="item.name"><dt>{{item.name}}</dt><dd>{{item.value}}</dd></div></dl></article><article class="hsc-panel saving"><span>验证年化节约</span><strong>{{view.verification.verifiedAnnualSaving?.toLocaleString('zh-CN') || '待验证'}}<small> 元/年</small></strong><p>{{view.verification.note}}</p></article></section>
      <section class="hsc-decision"><div><b>验证决策</b><span>当前：{{view.verification.decision}}</span></div><button type="button" @click="decideVerification('CONTINUE')">继续观察</button><button type="button" @click="decideVerification('NOT_COMPARABLE')">标记不可比</button><button type="button" @click="decideVerification('ROLLBACK')">回退</button><button type="button" class="primary" :disabled="!view.verification.comparable" @click="decideVerification('ACCEPT')">接受并固化目标</button></section>
    </template>

    <transition name="hsc-toast"><div v-if="toast" class="hsc-toast">{{toast}}</div></transition>
  </section>
</template>

<style src="./high-efficiency-sedimentation.css"></style>
