<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import UnitAnalysisTabs from '../unit-analysis/UnitAnalysisTabs.vue'
import { advanceUnitPlan, decideUnitVerification, rollbackUnitPlan } from '../unit-analysis/state-machine'
import type { UnitAnalysisTab, UnitTabDefinition } from '../unit-analysis/types'
import { vfRegisteredModel as vfModel } from '../unit-analysis/model-registry'
import { buildVfView, loadVfState, resetVfState, saveVfState, updateVfCause } from './adapter'
import { validateVfAcceptanceCases } from './acceptance'
import { createVfCauses } from './engine'
import { DEFAULT_VF_SCENARIO_ID, vfScenarios } from './demo-data'
import type { UnitCauseState, UnitEvaluationStatus, VfRuleResult } from './types'

const props = defineProps<{ siteName?: string; siteCode?: string }>()
const state = reactive(loadVfState())
const activeTab = ref<UnitAnalysisTab>('overview')
const activeDataGroup = ref('设计基线')
const activeRuleGroup = ref('全部')
const selectedRuleCode = ref('VF-WATER-01')
const causeNotes = reactive<Record<string, string>>({})
const toast = ref('')
const acceptance = validateVfAcceptanceCases()

const tabs: UnitTabDefinition[] = [
  { id: 'overview', name: '分析概览', note: '负荷、水力与优化机会' },
  { id: 'data', name: '数据与计算', note: '84字段 / 35指标' },
  { id: 'diagnosis', name: '偏差诊断', note: '24条受控规则' },
  { id: 'plan', name: '优化方案', note: '小步试验与回退' },
  { id: 'verification', name: '效果跟踪', note: '可比性与收益验证' }
]

const statusMeta: Record<UnitEvaluationStatus, { label: string; tone: string }> = {
  NOT_APPLICABLE: { label: '不适用', tone: 'neutral' }, DATA_INSUFFICIENT: { label: '数据不足', tone: 'data' },
  NORMAL: { label: '正常', tone: 'good' }, TRIGGERED: { label: '已触发', tone: 'warn' }, SUPPRESSED: { label: '已抑制', tone: 'suppressed' }
}
const causeStateOptions: Array<{ value: UnitCauseState; label: string }> = [
  { value: 'PENDING', label: '待核验' }, { value: 'CONFIRMED', label: '已确认' }, { value: 'REJECTED', label: '已排除' },
  { value: 'INCONCLUSIVE', label: '证据不足' }, { value: 'NOT_APPLICABLE', label: '不适用' }
]

const view = computed(() => buildVfView(state))
const fieldGroups = computed(() => Array.from(new Set(view.value.fields.map(item => item.group))))
const visibleFields = computed(() => view.value.fields.filter(item => item.group === activeDataGroup.value))
const ruleGroups = computed(() => ['全部', ...Array.from(new Set(view.value.rules.map(item => item.group)))])
const visibleRules = computed(() => activeRuleGroup.value === '全部' ? view.value.rules : view.value.rules.filter(item => item.group === activeRuleGroup.value))
const selectedRule = computed(() => view.value.rules.find(item => item.ruleCode === selectedRuleCode.value) ?? visibleRules.value[0])
const selectedCauses = computed(() => view.value.causes.filter(item => item.ruleCode === selectedRule.value?.ruleCode))
const triggeredRules = computed(() => view.value.rules.filter(item => item.status === 'TRIGGERED'))
const dataRules = computed(() => view.value.rules.filter(item => item.status === 'DATA_INSUFFICIENT'))
const suppressedRules = computed(() => view.value.rules.filter(item => item.status === 'SUPPRESSED'))
const missingFields = computed(() => view.value.fields.filter(item => item.reviewState === 'MISSING' || item.reviewState === 'ABNORMAL'))
const dataCoverage = computed(() => Math.round(view.value.fields.reduce((sum, item) => sum + item.coverage, 0) / view.value.fields.length * 100))
const coreMetrics = computed(() => ['NORMAL_FILTER_RATE', 'HEADLOSS_GROWTH', 'FILTER_CYCLE', 'TURBIDITY_REMOVAL', 'BACKWASH_WATER_RATIO', 'PUMP_SYSTEM_EFFICIENCY', 'UNIT_BACKWASH_ENERGY']
  .map(code => view.value.metrics.find(item => item.metricCode === code)).filter((item): item is NonNullable<typeof item> => Boolean(item)))

function showToast(message: string) {
  toast.value = message
  window.setTimeout(() => { if (toast.value === message) toast.value = '' }, 2600)
}

function switchScenario() {
  state.causes = createVfCauses()
  saveVfState(state)
  selectedRuleCode.value = view.value.rules.find(item => item.status === 'DATA_INSUFFICIENT')?.ruleCode
    ?? view.value.rules.find(item => item.status === 'TRIGGERED')?.ruleCode ?? 'VF-WATER-01'
  showToast('已按数据门槛优先级重新计算规则状态')
}

function resetDemo() {
  if (!window.confirm('确定恢复V型滤池V1.0固定演示数据吗？')) return
  Object.assign(state, resetVfState(DEFAULT_VF_SCENARIO_ID))
  activeTab.value = 'overview'
  selectedRuleCode.value = 'VF-WATER-01'
  showToast('固定演示数据已恢复')
}

function openRule(rule: VfRuleResult) {
  selectedRuleCode.value = rule.ruleCode
  activeTab.value = 'diagnosis'
}

function saveCause(causeCode: string, nextState: UnitCauseState) {
  updateVfCause(state, causeCode, nextState, causeNotes[causeCode] || '')
  showToast('原因证据核验已保存')
}

function createPlanFromRule(rule: VfRuleResult) {
  if (['DATA_INSUFFICIENT', 'SUPPRESSED', 'NOT_APPLICABLE'].includes(rule.status)) {
    showToast('当前状态只允许补齐证据，不生成业务优化方案')
    return
  }
  state.plan.sourceRuleCode = rule.ruleCode
  state.plan.title = `${rule.name} · V型滤池受控验证`
  state.plan.objective = `${rule.recommendation}；全程遵守“${rule.constraint}”。`
  state.plan.status = '草稿'
  saveVfState(state)
  activeTab.value = 'plan'
  showToast('已带入来源规则、证据、约束和回退要求')
}

function advancePlan() {
  advanceUnitPlan(state.plan)
  saveVfState(state)
  showToast(`优化方案已进入“${state.plan.status}”`)
}

function rollbackPlan() {
  rollbackUnitPlan(state.plan)
  saveVfState(state)
  showToast('已回退到上一稳定程序版本')
}

function decideVerification(decision: typeof state.verification.decision) {
  if (!decideUnitVerification(state.plan, state.verification, decision, 67100)) {
    showToast('前后数据不可比，不能接受并固化新目标')
    return
  }
  saveVfState(state)
  showToast('效果验证决策已保存')
}

function stateLabel(value: string) {
  return ({ VERIFIED: '已核验', PENDING: '待核验', MISSING: '缺失', ABNORMAL: '异常', VALID: '有效', MISSING_INPUT: '缺少输入', NOT_APPLICABLE: '不适用', CALCULATION_INVALID: '计算无效' } as Record<string, string>)[value] ?? value
}

watch(visibleRules, rules => {
  if (rules.length && !rules.some(item => item.ruleCode === selectedRuleCode.value)) selectedRuleCode.value = rules[0].ruleCode
})
</script>

<template>
  <section class="hsc-page vf-page">
    <header class="hsc-header">
      <div><p>提质增效 · {{props.siteCode || 'WX-DEMO-01'}} · VF单体</p><h1>V型滤池分析</h1><span>聚焦滤速与水头、过滤周期、三阶段反洗、局部效果、水耗能耗与优化验证。</span></div>
      <div class="hsc-header-actions"><span class="hsc-model-badge">VF {{vfModel.version}}</span><span class="hsc-draft-badge">DRAFT · 20项基准待确认</span><button type="button" @click="resetDemo">重置示范数据</button></div>
    </header>

    <section class="hsc-context-bar">
      <label><span>分析对象</span><strong>{{props.siteName || 'WaterX示范污水处理厂'}} · 1#V型滤池</strong></label>
      <label><span>分析周期</span><strong>{{view.scenario.values.analysis_period}}</strong></label>
      <label class="hsc-scenario-select"><span>固定演示场景</span><select v-model="state.scenarioId" @change="switchScenario"><option v-for="item in vfScenarios" :key="item.id" :value="item.id">{{item.name}}</option></select></label>
      <label><span>数据完整度</span><strong :class="{warning:dataCoverage<90}">{{dataCoverage}}%</strong></label>
    </section>
    <p class="hsc-scenario-note"><b>{{view.scenario.name}}</b>{{view.scenario.summary}}<small>更新：{{view.scenario.updatedAt}}</small></p>
    <UnitAnalysisTabs v-model="activeTab" :tabs="tabs" label="V型滤池分析页面" />

    <template v-if="activeTab==='overview'">
      <section class="hsc-overview-kpis">
        <article><span>字段覆盖</span><strong>{{vfModel.fields.length-missingFields.length}} / {{vfModel.fields.length}}</strong><small>{{missingFields.length ? `${missingFields.length}项待补充或修正` : '关键证据完整'}}</small></article>
        <article><span>计算指标</span><strong>{{view.metrics.filter(item=>item.status==='VALID').length}} / {{vfModel.metrics.length}}</strong><small>公式、单位和依赖可追溯</small></article>
        <article class="is-warning"><span>触发诊断</span><strong>{{triggeredRules.length}}</strong><small>草案试算，需原因核验</small></article>
        <article class="is-data"><span>数据不足</span><strong>{{dataRules.length}}</strong><small>抑制 {{suppressedRules.length}} 条依赖规则</small></article>
        <article><span>192例合同回归</span><strong>{{acceptance.passed}} / {{acceptance.total}}</strong><small>{{acceptance.allPassed?'规则、边界、抑制通过':'存在待修正项'}}</small></article>
      </section>
      <section class="hsc-panel"><header><div><h2>核心运行画像</h2><p>候选基准仅用于演示试算，未批准前不发布正式诊断。</p></div><span>84字段 · 35指标 · 24规则</span></header><div class="hsc-metric-cards"><article v-for="metric in coreMetrics" :key="metric.metricCode"><span>{{metric.name}}</span><strong>{{metric.display}}</strong><small>{{metric.benchmark}}</small><i :class="metric.status.toLowerCase()">{{stateLabel(metric.status)}}</i></article></div></section>
      <section class="hsc-overview-grid">
        <article class="hsc-panel hsc-diagnosis-summary"><header><div><h2>优先诊断</h2><p>三类数据门槛先于业务规则。</p></div><button type="button" @click="activeTab='diagnosis'">查看全部24条</button></header><button v-for="rule in [...dataRules,...triggeredRules].slice(0,5)" :key="rule.ruleCode" type="button" @click="openRule(rule)"><span :class="['hsc-status',statusMeta[rule.status].tone]">{{statusMeta[rule.status].label}}</span><div><b>{{rule.ruleCode}} · {{rule.name}}</b><p>{{rule.conclusion}}</p></div><em>查看 →</em></button></article>
        <article class="hsc-panel hsc-boundary-card"><header><div><h2>单体诊断边界</h2><p>COD/TP只是局部观察，不作全厂原因或合规判断。</p></div></header><dl><div><dt>本模块形成</dt><dd>{{vfModel.boundary.owns.join('、')}}</dd></div><div><dt>只引用</dt><dd>{{vfModel.boundary.references.join('、')}}</dd></div><div class="forbid"><dt>禁止重复形成</dt><dd>{{vfModel.boundary.forbids.join('、')}}</dd></div></dl></article>
      </section>
    </template>

    <template v-else-if="activeTab==='data'">
      <section class="hsc-panel hsc-data-panel"><header><div><h2>数据与受控计算</h2><p>气水同时反洗只保留一个 combined_duration；反洗事件将流量、台数、时长、有效面积和程序版本同步固化。</p></div><div><span>字段 84</span><span>指标 35</span><span>候选基准 20</span></div></header>
        <section class="vf-contract-strip"><b>当前反洗事件</b><span>{{view.scenario.values.backwash_event_id || '待补充'}}</span><span>程序 {{view.scenario.values.backwash_program_version || '缺失'}}</span><span>combined_duration {{view.scenario.values.combined_duration ?? '—'}} min</span></section>
        <nav class="hsc-subtabs"><button v-for="group in [...fieldGroups,'计算指标']" :key="group" :class="{selected:activeDataGroup===group}" @click="activeDataGroup=group">{{group}}</button></nav>
        <div v-if="activeDataGroup!=='计算指标'" class="hsc-table-wrap"><table><thead><tr><th>字段</th><th>当前值</th><th>来源</th><th>覆盖率</th><th>核验状态</th><th>边界</th></tr></thead><tbody><tr v-for="field in visibleFields" :key="field.fieldCode"><td><code>{{field.fieldCode}}</code><b>{{field.name}}</b></td><td><strong>{{field.value===null?'—':field.value}}</strong> <small>{{field.unit}}</small></td><td>{{field.source}}</td><td>{{Math.round(field.coverage*100)}}%</td><td><span :class="['hsc-data-state',field.reviewState.toLowerCase()]">{{stateLabel(field.reviewState)}}</span></td><td>{{vfModel.fields.find(item=>item.fieldCode===field.fieldCode)?.boundary}}</td></tr></tbody></table></div>
        <div v-else class="hsc-table-wrap"><table><thead><tr><th>指标</th><th>计算结果</th><th>受控公式</th><th>适用基准</th><th>状态</th></tr></thead><tbody><tr v-for="metric in view.metrics" :key="metric.metricCode"><td><code>{{metric.metricCode}}</code><b>{{metric.name}}</b><small>{{metric.group}}</small></td><td><strong>{{metric.display}}</strong></td><td><code class="formula">{{metric.formula}}</code></td><td>{{metric.benchmark}}</td><td><span :class="['hsc-data-state',metric.status.toLowerCase()]">{{stateLabel(metric.status)}}</span></td></tr></tbody></table></div>
      </section>
    </template>

    <template v-else-if="activeTab==='diagnosis'">
      <section v-if="dataRules.length" class="hsc-data-gate"><b>数据规则优先</b><span>{{dataRules.map(item=>item.ruleCode).join('、')}} 命中 DATA_INSUFFICIENT；只输出补数要求，{{suppressedRules.length}}条依赖业务规则已抑制。</span></section>
      <nav class="hsc-rule-filters"><button v-for="group in ruleGroups" :key="group" :class="{selected:activeRuleGroup===group}" @click="activeRuleGroup=group">{{group}}<small>{{group==='全部'?view.rules.length:view.rules.filter(item=>item.group===group).length}}</small></button></nav>
      <section class="hsc-diagnosis-grid"><aside class="hsc-rule-list"><button v-for="rule in visibleRules" :key="rule.ruleCode" type="button" :class="{selected:selectedRule?.ruleCode===rule.ruleCode}" @click="selectedRuleCode=rule.ruleCode"><div><code>{{rule.ruleCode}}</code><span :class="['hsc-status',statusMeta[rule.status].tone]">{{statusMeta[rule.status].label}}</span></div><b>{{rule.name}}</b><small>{{rule.group}} · {{rule.severity}}</small></button></aside>
        <article v-if="selectedRule" class="hsc-rule-detail"><header><div><p>{{selectedRule.ruleCode}} · {{selectedRule.group}}</p><h2>{{selectedRule.name}}</h2></div><span :class="['hsc-status',statusMeta[selectedRule.status].tone]">{{statusMeta[selectedRule.status].label}}</span></header><section class="hsc-conclusion"><b>当前结论</b><p>{{selectedRule.conclusion}}</p><small>结论类型：{{selectedRule.conclusionType}}</small></section><section><h3>证据链</h3><ul class="hsc-evidence"><li v-for="item in selectedRule.evidence" :key="item">{{item}}</li></ul></section><section class="hsc-rule-grid"><div><b>{{selectedRule.status==='DATA_INSUFFICIENT'?'补数要求':'建议动作'}}</b><p>{{selectedRule.recommendation}}</p></div><div><b>约束 / 停止边界</b><p>{{selectedRule.constraint}}</p></div><div><b>恢复条件</b><p>{{selectedRule.recovery}}</p></div><div><b>专业边界</b><p>{{selectedRule.boundaryNote}}</p></div></section>
          <section v-if="selectedCauses.length" class="hsc-causes"><header><div><h3>原因核验</h3><p>原因不由规则直接认定，需以同期证据确认。</p></div><span>{{selectedCauses.filter(item=>item.state!=='PENDING').length}} / {{selectedCauses.length}}</span></header><article v-for="cause in selectedCauses" :key="cause.causeCode"><div><code>{{cause.causeCode}}</code><b>{{cause.category}} · {{cause.question}}</b><p>所需证据：{{cause.requiredEvidence}}</p><small>确认条件：{{cause.confirmationCriteria}}</small></div><div><select :value="cause.state" @change="saveCause(cause.causeCode,($event.target as HTMLSelectElement).value as UnitCauseState)"><option v-for="option in causeStateOptions" :key="option.value" :value="option.value">{{option.label}}</option></select><input v-model="causeNotes[cause.causeCode]" placeholder="核验备注（可选）" @change="saveCause(cause.causeCode,cause.state)" /></div></article></section>
          <footer><span>{{['DATA_INSUFFICIENT','SUPPRESSED','NOT_APPLICABLE'].includes(selectedRule.status)?'当前只允许补齐证据，不生成业务方案。':'方案将带入来源、证据、保护、停止和回退条件。'}}</span><button type="button" :disabled="['DATA_INSUFFICIENT','SUPPRESSED','NOT_APPLICABLE'].includes(selectedRule.status)" @click="createPlanFromRule(selectedRule)">发起优化方案</button></footer></article>
      </section>
    </template>

    <template v-else-if="activeTab==='plan'">
      <section class="hsc-panel hsc-plan-head"><header><div><p>{{view.plan.id}} · 来源 {{view.plan.sourceRuleCode}}</p><h2>{{view.plan.title}}</h2><span>{{view.plan.objective}}</span></div><em>{{view.plan.status}}</em></header><div><span>预计年化节约</span><strong>{{view.plan.estimatedAnnualSaving.toLocaleString('zh-CN')}} 元</strong><small>演示试算，不作财务收益确认</small></div></section>
      <section class="hsc-plan-actions"><article v-for="(action,index) in view.plan.actions" :key="action.id"><header><span>{{index+1}}</span><div><b>{{action.title}}</b><small>{{action.id}} · {{action.owner}}</small></div><em>{{action.status}}</em></header><dl><div><dt>当前 / 目标</dt><dd>{{action.currentValue}} → <b>{{action.targetValue}}</b></dd></div><div><dt>执行步骤</dt><dd>{{action.step}}</dd></div><div class="guard"><dt>守护指标</dt><dd>{{action.guard}}</dd></div><div class="stop"><dt>停止条件</dt><dd>{{action.stopCondition}}</dd></div><div class="rollback"><dt>回退条件</dt><dd>{{action.rollbackCondition}}</dd></div></dl></article></section>
      <section class="hsc-decision"><div><b>方案状态机</b><span>当前：{{view.plan.status}}</span></div><button type="button" @click="rollbackPlan">执行回退</button><button type="button" class="primary" :disabled="['已完成','已回退'].includes(view.plan.status)" @click="advancePlan">推进下一状态</button></section>
    </template>

    <template v-else>
      <section class="hsc-comparability" :class="{invalid:!view.verification.comparable}"><header><div><h2>前后效果可比性</h2><p>点位、采样时间、水力时滞、方法、负荷和程序版本一致后才能认定收益。</p></div><span>{{view.verification.comparable?'可比':'不可比'}}</span></header><div><label v-for="check in view.verification.checks" :key="check.name"><input type="checkbox" v-model="check.passed" @change="saveVfState(state)" /><span><b>{{check.name}}</b><small>{{check.note}}</small></span></label></div></section>
      <section class="hsc-before-after"><article><header><h2>基线期</h2><span>程序 BW-P03</span></header><dl><div v-for="item in view.verification.before" :key="item.name"><dt>{{item.name}}</dt><dd>{{item.value}}</dd></div></dl></article><article><header><h2>试验期</h2><span>程序 BW-P03-T1</span></header><dl><div v-for="item in view.verification.after" :key="item.name"><dt>{{item.name}}</dt><dd>{{item.value}}</dd></div></dl></article><article class="result"><header><h2>验证结果</h2><span>{{view.verification.decision}}</span></header><strong>{{view.verification.verifiedAnnualSaving?.toLocaleString('zh-CN') || '待验证'}}<small> 元/年</small></strong><p>{{view.verification.note}}</p></article></section>
      <section class="hsc-decision"><div><b>验证决策</b><span>当前：{{view.verification.decision}}</span></div><button type="button" @click="decideVerification('CONTINUE')">继续观察</button><button type="button" @click="decideVerification('NOT_COMPARABLE')">标记不可比</button><button type="button" @click="decideVerification('ROLLBACK')">回退</button><button type="button" class="primary" :disabled="!view.verification.comparable" @click="decideVerification('ACCEPT')">接受并固化目标</button></section>
    </template>
    <transition name="hsc-toast"><div v-if="toast" class="hsc-toast">{{toast}}</div></transition>
  </section>
</template>

<style src="../high-efficiency-sedimentation/high-efficiency-sedimentation.css"></style>
<style scoped>
.vf-contract-strip{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:14px 16px 0;padding:11px 14px;border:1px solid #cfe2ef;border-radius:10px;background:#f3f9fc;color:#49697e;font-size:13px}.vf-contract-strip b{color:#123f5b}.vf-contract-strip span{padding-left:10px;border-left:1px solid #d8e7f0}.vf-page :deep(.hsc-tabs button small){white-space:normal}.vf-page :deep(.hsc-metric-cards){grid-template-columns:repeat(7,minmax(0,1fr))}@media(max-width:1280px){.vf-page :deep(.hsc-metric-cards){grid-template-columns:repeat(4,minmax(0,1fr))}}@media(max-width:800px){.vf-page :deep(.hsc-metric-cards){grid-template-columns:repeat(2,minmax(0,1fr))}.vf-contract-strip{align-items:flex-start;flex-direction:column}.vf-contract-strip span{padding-left:0;border-left:0}}
</style>
