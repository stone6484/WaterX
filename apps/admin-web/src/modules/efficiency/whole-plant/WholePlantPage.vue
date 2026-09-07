<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { WxButton, WxCard, WxDialog, WxField, WxState, WxTabs } from '../../../components/waterx'
import { clone, emptyDraft, newFact, statusNames, type Archive, type Draft, type Fact, type Snapshot } from './types'
import { definitions, fieldsFor, demoDraft, type ImplementedTopic } from './definitions'
import { waterAnalysis } from './water'
import { energyAnalysis } from './energy'
import { sludgeAnalysis } from './sludge'
import { chemicalAnalysis } from './chemical'
import { capacityAnalysis } from './capacity'
import { hydraulicAnalysis } from './hydraulic'
import { number } from './calculation'
import { loadArchive, processSources, saveSnapshot, sourceChanges } from './storage'
import AnalysisTable from './AnalysisTable.vue'

const props = defineProps<{ siteId: string; actor: string; topic: ImplementedTopic }>()
const definition = computed(() => definitions[props.topic])
const engines = { water: waterAnalysis, energy: energyAnalysis, sludge: sludgeAnalysis, chemical: chemicalAnalysis, capacity: capacityAnalysis, hydraulic: hydraulicAnalysis }
const calculate = (d: Draft) => engines[d.topic](d)
const draft = ref<Draft>(emptyDraft(props.topic)), archive = ref<Archive>({ schema: 1, siteId: '', revision: 0, snapshots: [] })
const tab = ref('运行概览'), message = ref(''), error = ref(''), reason = ref(''), history = ref<Snapshot | null>(null)
const editor = ref<Fact | null>(null), sourceIndex = ref(''), factor = ref(''), trace = ref<string | null>(null)
const sources = ref<ReturnType<typeof processSources>>([]), changes = ref<string[]>([]), loaded = ref(false)
const tabs = ['运行概览', '数据与对标', '偏差分析', '优化方案', '效果验证', '已保存记录']
const visible = computed(() => history.value?.draft ?? draft.value)
const analysis = computed(() => history.value?.result ?? calculate(draft.value))
const headMetrics = computed(() => analysis.value.metrics.filter(m => props.topic==='hydraulic' || !visible.value.facts.some(f=>f.id===m.id)).slice(0,6))
const records = computed(() => archive.value.snapshots.filter(s => s.draft.topic === props.topic))
const latestRecords = computed(() => records.value.filter(s => !records.value.some(other => other.draft.boundary === s.draft.boundary && other.draft.date === s.draft.date && other.version > s.version)).slice().reverse())
const savedCurrent = computed(() => records.value.slice().reverse().find(s=>JSON.stringify(s.draft)===JSON.stringify(draft.value)))
const rowMetric = (id: string) => analysis.value.metrics.find(m => m.id === id)
const format = (n: number | null) => n === null ? '—' : new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 3 }).format(n)
const draftKey = (siteId: string) => `waterx-whole-plant-draft:${encodeURIComponent(siteId)}:${props.topic}`
function attempt(work: () => void) { error.value = ''; try { work() } catch (e) { error.value = e instanceof Error ? e.message : String(e) } }
function stash() { if (loaded.value && props.siteId) sessionStorage.setItem(draftKey(props.siteId), JSON.stringify(draft.value)) }
function load() {
  loaded.value = false; history.value = null; editor.value = null; trace.value = null; message.value = ''; changes.value = []
  draft.value = emptyDraft(props.topic)
  attempt(() => {
    archive.value = loadArchive(props.siteId)
    const raw = sessionStorage.getItem(draftKey(props.siteId))
    if (raw) { const parsed = JSON.parse(raw) as Draft; if (parsed.topic !== props.topic || !Array.isArray(parsed.facts)) throw new Error('会话草稿格式异常，请保留原数据核查'); draft.value = parsed }
    loaded.value = true; sources.value = processSources(props.siteId, draft.value.date); changes.value = sourceChanges(props.siteId, draft.value)
  })
}
watch(() => [props.siteId, props.topic], load, { immediate: true })
watch(draft, () => attempt(stash), { deep: true, flush: 'sync' })
onBeforeUnmount(() => { try { stash() } catch { /* Each edit already surfaced storage failures. */ } })
function save() { attempt(() => {
  if (history.value) throw new Error('历史版本只读，请先点击“以此版本更正”')
  if (sourceChanges(props.siteId, draft.value).length) throw new Error('引用的运行数据已变化，请先更新来源与计算，再保存新版本；历史结果保持不变')
  archive.value = saveSnapshot(archive.value, draft.value, calculate(draft.value), props.actor, reason.value)
  const saved = archive.value.snapshots[archive.value.snapshots.length - 1]!
  message.value = `已保存 V${saved.version}；旧版本保留。${draft.value.demo ? '此记录含演示数据。' : ''}`; reason.value = ''
}) }
function edit(f?: Fact) {
  editor.value = clone(f ?? newFact(draft.value.date, Object.keys(definition.value.roles)[0]!, definition.value.units[0]!, Object.keys(definition.value.methods)[0]!)); sourceIndex.value = ''; factor.value = ''
  attempt(() => { sources.value = processSources(props.siteId, draft.value.date) })
}
function keepFact() { attempt(() => {
  if (!editor.value) return
  if (!editor.value.name.trim()) throw new Error('请填写点位名称')
  if (editor.value.state === 'NA' && !editor.value.note.trim()) throw new Error('不适用须填写依据')
  const i = draft.value.facts.findIndex(f => f.id === editor.value!.id)
  if (i < 0) draft.value.facts.push(clone(editor.value)); else draft.value.facts[i] = clone(editor.value)
  editor.value = null
}) }
function importSource() { attempt(() => {
  const s = sources.value[Number(sourceIndex.value)], multiplier = number(factor.value)
  if (!editor.value || sourceIndex.value === '' || !s || multiplier === null || multiplier <= 0) throw new Error('请选择同日来源并显式填写已核对单位的换算倍数')
  editor.value.reference = { entryId: s.entryId, version: s.version, metricId: s.metricId, line: s.line, original: s.original, factor: multiplier }
  editor.value.values.value = number(s.original) === null ? '' : String(number(s.original)! * multiplier)
  editor.value.method = 'DIRECT'; editor.value.state = s.state === 'NA' ? 'NA' : s.state === 'INVALID' ? 'INVALID' : number(s.original) === null ? 'MISSING' : 'VALID'
  editor.value.note = s.note; editor.value.source = `运行数据 ${s.line} / ${s.metricId} / V${s.version}；原值${s.original}×${multiplier}`
  if (s.demo) draft.value.demo = true
}) }
function refreshSources() { attempt(() => {
  sources.value = processSources(props.siteId, draft.value.date)
  for (const f of draft.value.facts) if (f.reference) {
    const s = sources.value.find(s => s.entryId === f.reference!.entryId && s.metricId === f.reference!.metricId)
    if (!s) { f.state = 'MISSING'; continue }
    f.reference.version = s.version; f.reference.original = s.original
    f.values.value = number(s.original) === null ? '' : String(number(s.original)! * f.reference.factor)
    f.state = s.state === 'INVALID' ? 'INVALID' : s.state === 'NA' ? 'NA' : number(s.original) === null ? 'MISSING' : 'VALID'
    f.note = s.note; f.source = `运行数据 ${s.line} / ${s.metricId} / V${s.version}；原值${s.original}×${f.reference.factor}`
    if (s.demo) draft.value.demo = true
  }
  changes.value = sourceChanges(props.siteId, draft.value); message.value = '来源已更新并重新计算；尚未保存，不改历史版本。'
}) }
function read(s: Snapshot) { history.value = s; tab.value = '运行概览'; attempt(() => { changes.value = sourceChanges(props.siteId, s.draft) }) }
function correct() { if (!history.value || !confirm('将此历史版本载入当前草稿用于更正？原历史不会改变。')) return; draft.value = clone(history.value.draft); history.value = null; reason.value = ''; message.value = '已载入更正草稿，保存时将新增版本。' }
function clearDraft() { if (!confirm('新建空白分析？当前会话草稿将替换，已保存版本全部保留。')) return; draft.value = emptyDraft(props.topic); history.value = null; message.value = ''; reason.value = '' }
function demo() {
  if (!confirm('载入固定算例替换当前草稿？不会覆盖任何已保存版本。')) return
  const d = demoDraft(props.topic)
  draft.value = d; history.value = null; reason.value = '固定算例验收'; message.value = '已载入演示，尚未归档。'
}
function remove(id: string) { if (confirm('从当前草稿移除此点位？已保存版本不变。')) draft.value.facts = draft.value.facts.filter(f => f.id !== id) }
function cancelEditor() { if (!editor.value || confirm('关闭计量点编辑？未应用的输入将放弃，原记录不变。')) editor.value = null }
</script>

<template>
  <section class="whole-plant" :aria-label="definition.name+'分析'">
    <div class="wp-toolbar"><strong>{{ definition.name }}</strong><span>{{ visible.date }}</span><span>日核算 · {{ analysis.rule }}</span><span v-if="history">历史 V{{ history.version }} · 只读</span><span v-else>{{ savedCurrent ? '已保存 V'+savedCurrent.version : '当前草稿 · 未保存更改' }}</span><span v-if="visible.demo">演示数据</span><div class="wp-actions"><WxButton v-if="history" @click="correct">以此版本更正</WxButton><WxButton v-if="history" @click="history=null">返回草稿</WxButton><WxButton v-else @click="clearDraft">新建分析</WxButton><WxButton :disabled="!!history || !loaded" @click="refreshSources">更新来源与计算</WxButton><WxButton :disabled="!!history || !loaded" variant="primary" @click="save">保存新版本</WxButton></div></div>
    <WxState v-if="error" kind="error" compact>{{ error }}</WxState><WxState v-else-if="message" compact>{{ message }}</WxState>
    <div v-if="changes.length" class="wp-notice">{{ changes.join('；') }}</div>
    <p class="wp-caption">{{ definition.scope }} 草稿只保留在本浏览器会话，归档保留旧版本；清理站点数据会丢失本地档案。</p>
    <WxTabs :aria-label="definition.name+'页签'"><button v-for="name in tabs" :key="name" :class="{active:tab===name}" @click="tab=name">{{ name }}</button></WxTabs>
    <template v-if="tab==='运行概览'">
      <div class="wp-context"><span>边界：{{ visible.boundary }} · V{{ visible.boundaryVersion }}</span><span>日期：{{ visible.date }}（北京时间自然日）</span><span>{{ visible.complete ? '清单已人工确认' : '边界清单待确认' }}</span></div>
      <div class="wp-metrics"><WxCard v-for="m in headMetrics" :key="m.id"><span>{{ m.name }}</span><strong>{{ format(m.value) }} <small>{{ m.unit }}</small></strong><span :class="{'wp-warning':m.value===null}">{{ statusNames[m.status] }}</span><WxButton variant="ghost" @click="trace=m.id">计算与来源</WxButton></WxCard></div>
      <WxCard class="wp-panel"><h2>当前核验事项</h2><ul><li v-for="item in analysis.issues" :key="item">{{ item }}</li></ul><WxButton @click="tab='数据与对标'">补充数据与边界</WxButton></WxCard>
    </template>
    <template v-else-if="tab==='数据与对标'">
      <WxCard class="wp-panel"><div class="wp-fields"><WxField label="边界名称" layout="stacked"><input v-model="visible.boundary" :disabled="!!history" class="wx-input" /></WxField><WxField label="边界版本" layout="stacked"><input v-model="visible.boundaryVersion" :disabled="!!history" class="wx-input" /></WxField><WxField label="评价日期" layout="stacked"><input v-model="visible.date" :disabled="!!history" type="date" class="wx-input" /></WxField><WxField label="边界依据" layout="stacked"><input v-model="visible.basis" :disabled="!!history" class="wx-input" placeholder="流向图/计量点清单版本" /></WxField></div><label><input v-model="visible.complete" :disabled="!!history" type="checkbox" /> 已核对分析边界及全部适用计量清单；不存在的类型须登记“不适用”并说明依据</label>
        <div class="wp-fields"><WxField v-for="f in definition.parameters" :key="f.key" :label="f.label+(f.unit ? '（'+f.unit+'）':'')" layout="stacked"><input v-model="visible.parameters[f.key]" :disabled="!!history" class="wx-input" /></WxField></div><label v-for="check in definition.checks" :key="check.key"><input v-model="visible.checks[check.key]" :disabled="!!history" type="checkbox" /> {{ check.label }}</label>
      </WxCard>
      <WxCard class="wp-panel"><div class="wp-actions"><h2>计量事实</h2><WxButton :disabled="!!history || !loaded" @click="edit()">新增点位</WxButton><WxButton :disabled="!!history" @click="demo">载入固定算例</WxButton></div><p class="wp-caption">仅勾选互斥贡献项。上级表和所含支路不能同时计入；库存允许减少。能效总表独立于分项，不将总表加入分项之和。</p>
        <AnalysisTable :headers="['计入','点位 / 流向','类别','计算值','单位','数据状态','操作']" :widths="[48,180,110,90,80,130,180]" label="计量事实"><tr v-for="f in visible.facts" :key="f.id"><td><input v-model="f.selected" :disabled="!!history" type="checkbox" :aria-label="'计入'+f.name" /></td><td><b>{{ f.name }}</b><small>{{ f.path }} · {{ f.date }}</small></td><td>{{ definition.roles[f.role] }}</td><td><b>{{ format(rowMetric(f.id)?.value ?? null) }}</b></td><td>{{ rowMetric(f.id)?.unit || f.unit }}</td><td>{{ statusNames[rowMetric(f.id)?.status ?? 'MISSING'] }}</td><td><div class="wp-actions"><WxButton variant="ghost" @click="trace=f.id">来源</WxButton><WxButton v-if="!history" variant="ghost" @click="edit(f)">编辑</WxButton><WxButton v-if="!history" variant="ghost" @click="remove(f.id)">移除</WxButton></div></td></tr><tr v-if="!visible.facts.length"><td colspan="7">尚无数据。请新增计量点，不会自动填入演示值。</td></tr></AnalysisTable>
      </WxCard>
    </template>
    <WxCard v-else-if="tab==='偏差分析'" class="wp-panel"><h2>先核验事实，再判断原因</h2><ul><li v-for="item in analysis.issues" :key="item">{{ item }}</li></ul><WxField label="核验事实与证据" layout="stacked"><textarea v-model="visible.review.evidence" :disabled="!!history" class="wx-input" /></WxField><WxField label="原因核验" layout="stacked"><select v-model="visible.review.cause" :disabled="!!history" class="wx-select"><option value="UNREVIEWED">未核验</option><option value="SUPPORTED">证据支持</option><option value="EXCLUDED">证据排除</option><option value="INSUFFICIENT">证据不足</option></select></WxField><p>差额形成计量/边界核验事项，不自动推断漏损或设备效率。此记录不复制专业工单。</p></WxCard>
    <WxCard v-else-if="tab==='优化方案'" class="wp-panel"><h2>人工核验与试验草稿</h2><p>首期优先计量核验。不会自动改变设备、生产计划或生成节约收益；统一任务库待接入。</p><div class="wp-fields"><WxField label="核验 / 试验步骤" layout="stacked"><textarea v-model="visible.review.action" :disabled="!!history" class="wx-input" /></WxField><WxField label="责任人" layout="stacked"><input v-model="visible.review.owner" :disabled="!!history" class="wx-input" /></WxField><WxField label="期限" layout="stacked"><input v-model="visible.review.due" :disabled="!!history" type="date" class="wx-input" /></WxField><WxField label="保护条件" layout="stacked"><textarea v-model="visible.review.protection" :disabled="!!history" class="wx-input" /></WxField><WxField label="停止条件" layout="stacked"><textarea v-model="visible.review.stop" :disabled="!!history" class="wx-input" /></WxField><WxField label="恢复措施" layout="stacked"><textarea v-model="visible.review.recovery" :disabled="!!history" class="wx-input" /></WxField></div></WxCard>
    <WxCard v-else-if="tab==='效果验证'" class="wp-panel"><h2>人员记录，不代表设备已执行</h2><WxField label="执行时间、人员与凭据" layout="stacked"><textarea v-model="visible.review.execution" :disabled="!!history" class="wx-input" /></WxField><WxField label="前后周期、事实变化与可比性证据" layout="stacked"><textarea v-model="visible.review.comparison" :disabled="!!history" class="wx-input" /></WxField><WxField label="保护条件核验结果" layout="stacked"><textarea v-model="visible.review.protectionEvidence" :disabled="!!history" class="wx-input" /></WxField><WxField label="观察结论" layout="stacked"><select v-model="visible.review.outcome" :disabled="!!history" class="wx-select"><option value="PENDING">待核验</option><option value="OBSERVE">继续观察</option><option value="REJECTED">不接受效果</option></select></WxField><p>当前只记录观察事实；尚未实现独立收益归因，不提供“确认节约”或自动通过。</p></WxCard>
    <WxCard v-else class="wp-panel"><h2>每日每边界一条当前记录，旧版本可展开</h2><div v-for="s in latestRecords" :key="s.id" class="wp-record"><div><b>{{ s.draft.date }} · {{ s.draft.boundary }}</b><small>{{ s.by }} · {{ s.at }} · {{ s.draft.demo ? '演示' : '人工记录' }}</small></div><WxButton @click="read(s)">打开 V{{ s.version }}</WxButton><details><summary>历史版本</summary><p v-for="old in records.filter(o=>o.draft.date===s.draft.date && o.draft.boundary===s.draft.boundary)" :key="old.id"><WxButton variant="ghost" @click="read(old)">V{{ old.version }} · {{ old.reason }}</WxButton></p></details></div><p v-if="!latestRecords.length">尚无已保存记录。</p></WxCard>
    <WxCard v-if="tab==='数据与对标'" class="wp-panel"><h2>计算结果与适用口径</h2><AnalysisTable :headers="['指标','实际值','单位','数据状态','公式 / 口径 / 限制','追溯']" :widths="[170,90,100,130,260,80]" label="计算结果"><tr v-for="m in analysis.metrics" :key="m.id"><td>{{ m.name }}</td><td><b>{{ format(m.value) }}</b></td><td>{{ m.unit }}</td><td>{{ statusNames[m.status] }}</td><td>{{ m.formula }}<small>{{ m.note }}</small></td><td><WxButton variant="ghost" @click="trace=m.id">来源</WxButton></td></tr></AnalysisTable></WxCard>
    <div v-if="!history" class="wp-save"><WxField label="保存 / 更正原因"><input v-model="reason" class="wx-input" placeholder="每次保存新增版本，不覆盖历史" /></WxField><span>记录人：{{ actor || '未登录' }}</span></div>
    <WxDialog :open="!!editor" :label="'编辑'+definition.shortName+'计量点'" placement="right" :close-on-backdrop="false" @close="cancelEditor"><section v-if="editor" class="whole-plant wp-editor"><h2>编辑计量点</h2><WxState v-if="error" kind="error" compact>{{ error }}</WxState><div class="wp-fields"><WxField label="名称" layout="stacked"><input v-model="editor.name" class="wx-input" /></WxField><WxField label="流向类别" layout="stacked"><select v-model="editor.role" class="wx-select"><option v-for="(label,key) in definition.roles" :key="key" :value="key">{{ label }}</option></select></WxField><WxField :label="topic==='capacity' ? '阶段名（同阶段实例并联）' : '物理路径 / 覆盖范围'" layout="stacked"><input v-model="editor.path" class="wx-input" placeholder="同一水流使用相同路径名" /></WxField><WxField v-if="!['capacity','hydraulic'].includes(topic)" label="包含此点的上级表" layout="stacked"><select v-model="editor.parent" class="wx-select"><option value="">无上级表</option><option v-for="f in draft.facts.filter(f=>f.id!==editor!.id)" :key="f.id" :value="f.id">{{ f.name }}</option></select></WxField><WxField label="计量日期" layout="stacked"><input v-model="editor.date" type="date" class="wx-input" /></WxField><WxField label="数据状态" layout="stacked"><select v-model="editor.state" :disabled="!!editor.reference" class="wx-select"><option v-for="(name,key) in statusNames" :key="key" :value="key">{{ name }}</option></select></WxField><WxField label="单位" layout="stacked"><select v-model="editor.unit" class="wx-select"><option v-for="unit in definition.units" :key="unit">{{ unit }}</option></select></WxField><WxField v-if="editor.role!=='STOCK'" label="计量方式" layout="stacked"><select v-model="editor.method" :disabled="!!editor.reference" class="wx-select"><option v-for="(label,key) in definition.methods" :key="key" :value="key">{{ label }}</option></select></WxField></div>
      <div class="wp-fields"><WxField v-for="f in fieldsFor(topic,editor)" :key="f.key" :label="f.label+(f.unit?'（'+f.unit+'）':'')" layout="stacked"><input v-model="editor.values[f.key]" :disabled="!!editor.reference" inputmode="decimal" class="wx-input" placeholder="留空表示缺失，0须明确填写" /></WxField></div>
      <WxField label="来源凭据 / 方法依据" layout="stacked"><input v-model="editor.source" :disabled="!!editor.reference" class="wx-input" /></WxField><WxField label="说明 / 不适用依据" layout="stacked"><textarea v-model="editor.note" class="wx-input" /></WxField>
      <details v-if="['water','energy'].includes(topic) && editor.role!=='STOCK'"><summary>引用同日已保存运行数据（不重复录入）</summary><p>确认原指标单位、物理边界和换算关系后引用；不会把工艺线流量自动当成全厂外来水。</p><select v-model="sourceIndex" class="wx-select" aria-label="选择运行数据来源"><option value="">请选择来源</option><option v-for="(s,i) in sources" :key="s.entryId+s.metricId" :value="String(i)">{{ s.line }} / {{ s.metricId }} = {{ s.original }} · V{{ s.version }}</option></select><WxField :label="'原值转换为'+editor.unit+'的倍数'" layout="stacked"><input v-model="factor" class="wx-input" placeholder="显式填入，如1或10000，不默认" /></WxField><WxButton @click="importSource">引用选中来源</WxButton><WxButton v-if="editor.reference" @click="delete editor.reference; editor.source=''; editor.values={}">解除引用并清空值</WxButton></details>
      <div class="wp-actions"><WxButton @click="cancelEditor">取消</WxButton><WxButton variant="primary" @click="keepFact">应用到草稿</WxButton></div></section></WxDialog>
    <WxDialog :open="!!trace" label="计算与来源" placement="right" @close="trace=null">
      <section class="whole-plant wp-editor">
        <h2>{{ rowMetric(trace || '')?.name }}</h2>
        <p>规则：{{ analysis.rule }} · {{ trace }}</p>
        <p>公式：{{ rowMetric(trace || '')?.formula }}</p><p>{{ rowMetric(trace || '')?.note }}</p>
        <div class="wp-record"><b>本次核算口径</b><p>{{ visible.boundary }} · 边界 V{{ visible.boundaryVersion }} · {{ visible.date }}</p><p>{{ visible.basis || '依据待补充' }}</p><p v-if="history">归档 V{{ history.version }} · {{ history.at }} · {{ history.by }}；{{ history.reason }}</p><p v-else>当前草稿；以保存后的版本作为归档依据。</p></div>
        <div v-for="f in visible.facts.filter(f=>rowMetric(trace || '')?.dependencies.includes(f.id))" :key="f.id" class="wp-record"><b>{{ f.name }}</b><p>{{ f.date }} · {{ f.path }} · {{ statusNames[f.state] }}</p><p>{{ f.source }}</p><p v-for="field in fieldsFor(props.topic,f)" :key="field.key">{{ field.label }}：{{ f.values[field.key] || '未填' }} {{ field.unit }}</p><p>{{ f.note }}</p></div>
        <details><summary>本次配置参数与确认状态（非全部参与当前指标）</summary><p v-for="field in definition.parameters" :key="field.key">{{ field.label }}：{{ visible.parameters[field.key] || '未填' }} {{ field.unit }}</p><p v-for="check in definition.checks" :key="check.key">{{ check.label }}：{{ visible.checks[check.key] ? '已确认' : '未确认' }}</p></details>
        <WxButton @click="trace=null">关闭</WxButton>
      </section>
    </WxDialog>
  </section>
</template>

<style src="./whole-plant.css"></style>
