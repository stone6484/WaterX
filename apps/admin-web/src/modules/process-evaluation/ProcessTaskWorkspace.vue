<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { createOrUpdateIssue, saveCheckRecord } from './adapter'
import { importanceLabel, PROCESS_MODULE_MAP, PROCESS_MODULES, PROCESS_RULE_MAP, rulesForModule } from './rules'
import type {
  CheckRecord, CheckResult, EvaluationTask, IssueLevel, ProcessEvaluationState, ProcessModuleKey, RuleFactField,
} from './types'

const props = defineProps<{
  state: ProcessEvaluationState
  task: EvaluationTask
  moduleKey: ProcessModuleKey
  readonly?: boolean
}>()
const emit = defineEmits<{
  openSource: [module: ProcessModuleKey]
  notify: [message: string]
}>()

const selectedCategory = ref('A')
const selectedCode = ref('')
const issueLevel = ref<IssueLevel>('重要')
const issueAssignee = ref('专业负责人')
const issueDueDate = ref('2026-09-15')
const associatedModules = ref<ProcessModuleKey[]>([])

const moduleDefinition = computed(() => PROCESS_MODULE_MAP.get(props.moduleKey)!)
const moduleRules = computed(() => rulesForModule(props.moduleKey))
const categoryRules = computed(() => moduleRules.value.filter((rule) => rule.category === selectedCategory.value))
const selectedRule = computed(() => PROCESS_RULE_MAP.get(selectedCode.value) || categoryRules.value[0])
const existingRecord = computed(() => props.state.records.find((record) => record.taskId === props.task.id && record.ruleCode === selectedRule.value?.code))
const selectedIssue = computed(() => props.state.issues.find((issue) => issue.taskId === props.task.id && issue.primaryRuleCode === selectedRule.value?.code && issue.status !== '已关闭'))

const form = reactive<CheckRecord>({
  taskId: '', ruleCode: '', result: '待检查', sampleTotal: null, passedCount: null, factValues: {},
  objectName: '', facts: '', evidence: '', tags: [], notApplicableReason: '', updatedAt: '',
})
const tagsText = ref('')
const resultOptions: CheckResult[] = ['待检查', '证据不足', '符合', '部分符合', '不符合', '不适用']

function numericValue(field: RuleFactField): number | null {
  const value = form.factValues[field.key]
  if (value === '' || value === null || value === undefined) return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

const ratioPair = computed(() => {
  const fields = selectedRule.value?.detail.factFields.filter((field) => field.type === 'number') || []
  const totalPattern = /应|总|抽查|适用|计划|事件|任务|对象|项目|岗位|设备|记录|样本|工单|批次/
  const passedPattern = /已|符合|有效|完成|一致|覆盖|通过|闭环|正确|实际|按期|合格|纳入/
  for (let index = 0; index < fields.length; index += 1) {
    const denominator = fields[index]
    if (!totalPattern.test(denominator.label)) continue
    const numerator = fields.slice(index + 1).find((field) => passedPattern.test(field.label))
    if (numerator) return { denominator, numerator }
  }
  if (fields.length >= 2) return { denominator: fields[0], numerator: fields[1] }
  return null
})

const suggestedResult = computed<CheckResult | null>(() => {
  const pair = ratioPair.value
  if (!pair) return null
  const total = numericValue(pair.denominator)
  const passed = numericValue(pair.numerator)
  if (total === null || passed === null || total <= 0 || passed < 0 || passed > total) return null
  if (passed === total) return '符合'
  if (passed === 0) return '不符合'
  return '部分符合'
})

const issueRequired = computed(() => ['部分符合', '不符合'].includes(form.result))

function loadRecord() {
  const rule = selectedRule.value
  if (!rule) return
  const record = existingRecord.value || {
    taskId: props.task.id, ruleCode: rule.code, result: '待检查' as const, sampleTotal: null, passedCount: null, factValues: {},
    objectName: '', facts: '', evidence: '', tags: [], notApplicableReason: '', updatedAt: '',
  }
  Object.assign(form, JSON.parse(JSON.stringify({ ...record, factValues: record.factValues || {} })))
  const pair = ratioPair.value
  if (pair && form.sampleTotal !== null && form.factValues[pair.denominator.key] === undefined) {
    form.factValues[pair.denominator.key] = form.sampleTotal
    form.factValues[pair.numerator.key] = form.passedCount
  }
  tagsText.value = record.tags.join('、')
  const issue = selectedIssue.value
  issueLevel.value = issue?.level || (rule.importance === 5 ? '重要' : '一般')
  issueAssignee.value = issue?.assignee || `${moduleDefinition.value.shortName}负责人`
  issueDueDate.value = issue?.dueDate || '2026-09-15'
  associatedModules.value = issue ? [...issue.associatedModules] : []
}

function ensureSelection() {
  if (!moduleDefinition.value.categories.some((item) => item.key === selectedCategory.value)) selectedCategory.value = moduleDefinition.value.categories[0].key
  const rules = categoryRules.value
  if (!rules.some((rule) => rule.code === selectedCode.value)) selectedCode.value = rules[0]?.code || ''
  loadRecord()
}

watch(() => props.moduleKey, () => {
  selectedCategory.value = moduleDefinition.value.categories[0].key
  selectedCode.value = ''
  ensureSelection()
}, { immediate: true })
watch(() => props.task.id, () => ensureSelection())
watch(selectedCategory, ensureSelection)
watch(selectedCode, loadRecord)

const categoryProgress = computed(() => {
  const records = new Map(props.state.records.filter((record) => record.taskId === props.task.id).map((record) => [record.ruleCode, record]))
  const done = categoryRules.value.filter((rule) => !['待检查', '证据不足'].includes(records.get(rule.code)?.result || '待检查')).length
  return { done, total: categoryRules.value.length, percent: categoryRules.value.length ? Math.round(done / categoryRules.value.length * 100) : 0 }
})

function setResult(result: CheckResult) {
  if (!props.readonly) form.result = result
}

function useSuggestion() {
  if (!props.readonly && suggestedResult.value) form.result = suggestedResult.value
}

function toggleAssociated(module: ProcessModuleKey) {
  if (props.readonly || module === props.moduleKey) return
  const index = associatedModules.value.indexOf(module)
  if (index >= 0) associatedModules.value.splice(index, 1)
  else associatedModules.value.push(module)
}

function selectedTags(): string[] {
  return tagsText.value.split(/[、,，]/).map((item) => item.trim()).filter(Boolean)
}

function toggleTag(tag: string) {
  if (props.readonly) return
  const values = selectedTags()
  const index = values.indexOf(tag)
  if (index >= 0) values.splice(index, 1)
  else values.push(tag)
  tagsText.value = values.join('、')
}

function issueCountFor(code: string): number {
  return props.state.issues.filter((issue) => issue.taskId === props.task.id && issue.primaryRuleCode === code).length
}

function syncLegacyCounts() {
  const pair = ratioPair.value
  form.sampleTotal = pair ? numericValue(pair.denominator) : null
  form.passedCount = pair ? numericValue(pair.numerator) : null
}

function validate(): string {
  if (form.result === '待检查') return '请选择正式检查结果，或使用“暂存”。'
  if (form.result === '证据不足' && !form.evidence.trim()) return '证据不足时请说明待补证据。'
  if (form.result === '不适用' && !form.notApplicableReason.trim()) return '不适用必须填写客观原因。'
  if (issueRequired.value && (!form.objectName.trim() || !form.facts.trim() || !form.evidence.trim())) return '形成问题时请填写问题对象、异常事实和证据。'
  return ''
}

function save(next = false, draft = false) {
  if (props.readonly) { emit('notify', '该评价任务已锁定或作废，仅可查看历史结果。'); return }
  if (!draft) {
    const message = validate()
    if (message) { emit('notify', message); return }
  }
  syncLegacyCounts()
  form.tags = selectedTags()
  form.updatedAt = new Date().toLocaleString('zh-CN', { hour12: false })
  saveCheckRecord(props.state, form)
  if (!draft && issueRequired.value) createOrUpdateIssue(props.state, form, issueLevel.value, issueAssignee.value, issueDueDate.value, associatedModules.value)
  emit('notify', draft ? '已暂存当前检查项' : issueRequired.value ? '检查结果已保存，主责问题已生成或更新' : '检查结果已保存')
  if (next) {
    const index = categoryRules.value.findIndex((rule) => rule.code === selectedRule.value.code)
    if (index < categoryRules.value.length - 1) selectedCode.value = categoryRules.value[index + 1].code
    else {
      const categoryIndex = moduleDefinition.value.categories.findIndex((category) => category.key === selectedCategory.value)
      if (categoryIndex < moduleDefinition.value.categories.length - 1) selectedCategory.value = moduleDefinition.value.categories[categoryIndex + 1].key
    }
  }
}

function stateFor(code: string): CheckResult {
  return props.state.records.find((record) => record.taskId === props.task.id && record.ruleCode === code)?.result || '待检查'
}
</script>

<template>
  <section class="pe-workspace-page" :class="{ 'is-readonly': readonly }">
    <div v-if="readonly" class="pe-readonly-banner"><b>历史结果只读</b><span>{{ task.status === '已锁定' ? `已由 ${task.lockedBy || '管理员'} 于 ${task.lockedAt || task.updatedAt} 锁定` : `任务已作废${task.voidReason ? `：${task.voidReason}` : ''}` }}</span></div>
    <div class="pe-category-tabs">
      <button v-for="category in moduleDefinition.categories" :key="category.key" :class="{ selected: selectedCategory === category.key }" @click="selectedCategory = category.key">
        {{ category.shortName }}<small>{{ category.weight }}分</small>
      </button>
    </div>

    <div class="pe-execution-grid">
      <aside class="pe-rule-list">
        <header><div><b>{{ moduleDefinition.categories.find((item) => item.key === selectedCategory)?.name }}</b><small>{{ categoryProgress.done }}/{{ categoryProgress.total }} 项</small></div><div class="pe-progress"><i :style="{ width: `${categoryProgress.percent}%` }"></i></div></header>
        <button v-for="rule in categoryRules" :key="rule.code" :class="{ selected: selectedCode === rule.code }" @click="selectedCode = rule.code">
          <span>{{ rule.code.split('-')[1] }}</span><b>{{ rule.title }}</b>
          <span class="pe-rule-list-meta"><small v-if="issueCountFor(rule.code)" class="pe-issue-count">{{ issueCountFor(rule.code) }}个问题</small><small class="pe-result-text" :class="`is-${stateFor(rule.code)}`">{{ stateFor(rule.code) }}</small></span>
        </button>
      </aside>

      <section v-if="selectedRule" class="pe-check-detail">
        <header>
          <div class="pe-inline"><code>{{ selectedRule.code }}</code><span class="pe-v02-badge">V0.2 可执行检查</span><span class="pe-tag">{{ importanceLabel(selectedRule.importance) }}</span><span class="pe-tag">分类权重 {{ moduleDefinition.categories.find((item) => item.key === selectedRule.category)?.weight }}分</span></div>
          <h2>{{ selectedRule.title }}</h2>
        </header>
        <div class="pe-check-body">
          <section class="pe-rule-overview"><b>要求概述</b><p>{{ selectedRule.detail.overview }}</p></section>

          <section class="pe-checkpoints">
            <div class="pe-section-title"><b>具体核查要点</b><small>逐项核对，默认展开</small></div>
            <ol><li v-for="(point, index) in selectedRule.detail.checkPoints" :key="`${selectedRule.code}-point-${index}`"><span>{{ index + 1 }}</span><p>{{ point }}</p></li></ol>
          </section>

          <div class="pe-guidance-grid">
            <section class="pe-guidance-card"><b>检查范围与抽样</b><ul><li v-for="item in selectedRule.detail.sampling" :key="item">{{ item }}</li></ul></section>
            <section class="pe-guidance-card"><b>检查提示</b><dl><div><dt>判定方式</dt><dd>{{ selectedRule.detail.method }}</dd></div><div><dt>最低证据</dt><dd>{{ selectedRule.detail.evidence }}</dd></div></dl></section>
          </div>

          <section class="pe-fact-section">
            <div class="pe-section-title"><b>客观事实记录</b><small>记录数量、天数、日期、状态等业务事实，不直接输入任意分数</small></div>
            <div class="pe-fact-grid">
              <label v-for="field in selectedRule.detail.factFields" :key="field.key" class="pe-fact-field">
                <span>{{ field.label }}<small v-if="field.unit">{{ field.unit }}</small></span>
                <select v-if="field.type === 'boolean'" v-model="form.factValues[field.key]" :disabled="readonly"><option value="">请选择</option><option value="是">是</option><option value="否">否</option></select>
                <input v-else v-model="form.factValues[field.key]" :disabled="readonly" :type="field.type" :min="field.type === 'number' ? 0 : undefined" :placeholder="field.placeholder" />
              </label>
            </div>
            <div v-if="suggestedResult && !readonly" class="pe-suggestion"><span>依据已录入的数量关系，系统建议判定为“{{ suggestedResult }}”；最终结果仍由检查人员确认。</span><button class="pe-link" @click="useSuggestion">采用建议</button></div>
          </section>

          <div class="pe-field-block"><b>检查结果判定</b><small>“证据不足”和“不适用”必须分别说明，不能混用。</small>
            <div class="pe-result-buttons"><button v-for="result in resultOptions" :key="result" :disabled="readonly" :class="[{ selected: form.result === result }, `is-${result}`]" @click="setResult(result)">{{ result }}</button></div>
          </div>

          <label v-if="form.result === '不适用'" class="pe-full-label">不适用原因<textarea v-model="form.notApplicableReason" :disabled="readonly" rows="2" placeholder="填写工艺、设施、业务模式或评价期内事件不存在等客观原因"></textarea></label>
          <label v-if="form.result === '证据不足'" class="pe-full-label">待补证据<textarea v-model="form.evidence" :disabled="readonly" rows="2" :placeholder="selectedRule.detail.evidence"></textarea></label>

          <div v-if="form.result === '符合'" class="pe-compliant-evidence">
            <label>最低证据引用（可简写）<input v-model="form.evidence" :disabled="readonly" :placeholder="selectedRule.detail.evidence" /></label>
            <p>符合项只保留能够证明检查实施和结论的最低证据，不要求填写长说明。</p>
          </div>

          <div v-if="issueRequired" class="pe-issue-builder">
            <div><b>{{ selectedIssue ? '更新唯一主责问题' : '记录异常并形成一个主责问题' }}</b><p>本项只在 {{ moduleDefinition.shortName }} 扣分，其他模块仅关联风险，不再重复扣分。</p></div>
            <div class="pe-form-grid">
              <label class="pe-span-2">问题对象<input v-model="form.objectName" :disabled="readonly" placeholder="具体设备、记录、事件、岗位或场所" /></label>
              <label class="pe-span-2">异常事实<textarea v-model="form.facts" :disabled="readonly" rows="3" placeholder="记录对象、时间、数量、持续天数、等级或实际状态"></textarea></label>
              <label class="pe-span-2">证据引用<textarea v-model="form.evidence" :disabled="readonly" rows="3" :placeholder="selectedRule.detail.evidence"></textarea></label>
              <div class="pe-tag-options pe-span-2"><span>建议问题标签</span><div><button v-for="tag in selectedRule.detail.problemTags" :key="tag" type="button" :disabled="readonly" :class="{ selected: selectedTags().includes(tag) }" @click="toggleTag(tag)">{{ tag }}</button></div></div>
              <label class="pe-span-2">已选标签<input v-model="tagsText" :disabled="readonly" placeholder="可补充标签，多个标签用顿号分隔" /></label>
              <label>问题等级<select v-model="issueLevel" :disabled="readonly"><option>一般</option><option>重要</option><option>重大</option><option>关键控制失效</option></select></label>
              <label>整改责任人<input v-model="issueAssignee" :disabled="readonly" /></label>
              <label>整改期限<input v-model="issueDueDate" :disabled="readonly" type="date" /></label>
              <div class="pe-associated"><span>关联风险模块</span><div><button v-for="module in PROCESS_MODULES.filter((item) => item.key !== moduleKey)" :key="module.key" :disabled="readonly" :class="{ selected: associatedModules.includes(module.key) }" @click="toggleAssociated(module.key)">{{ module.shortName }}</button></div></div>
            </div>
          </div>

          <details class="pe-decision-panel" open>
            <summary>客观判定依据与关闭条件</summary>
            <div class="pe-decision-list">
              <div class="is-good"><b>符合</b><p>{{ selectedRule.detail.decision.compliant }}</p></div>
              <div class="is-warn"><b>部分符合</b><p>{{ selectedRule.detail.decision.partial }}</p></div>
              <div class="is-bad"><b>不符合</b><p>{{ selectedRule.detail.decision.nonCompliant }}</p></div>
              <div class="is-neutral"><b>不适用</b><p>{{ selectedRule.detail.decision.notApplicable }}</p></div>
              <div v-if="selectedRule.detail.decision.critical" class="is-critical"><b>关键控制</b><p>{{ selectedRule.detail.decision.critical }}</p></div>
            </div>
            <div class="pe-close-condition"><b>关闭条件</b><p>{{ selectedRule.detail.closeCondition }}</p><small v-if="selectedRule.detail.boundary">模块边界：{{ selectedRule.detail.boundary }}</small></div>
          </details>

          <button class="pe-source-link" @click="emit('openSource', moduleKey)">↗ 查看对应专业模块或原始业务事实</button>
          <footer class="pe-save-row"><span>最近保存：{{ form.updatedAt || '尚未保存' }}</span><div v-if="!readonly"><button class="pe-button" @click="save(false, true)">暂存</button><button class="pe-button pe-button-primary" @click="save(true)">保存并检查下一项</button></div></footer>
        </div>
      </section>
    </div>
  </section>
</template>
