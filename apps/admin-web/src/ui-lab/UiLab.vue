<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { WxButton, WxField, WxInput, WxSelect, WxState, WxTable, WxTableSurface, WxTag } from '../components/waterx'
import QualityLab from './QualityLab.vue'
import ProcessEditorLab from './ProcessEditorLab.vue'

const scenario = ref('short')
const width = ref('full')
const value = ref('')
const attempted = ref(false)
const saved = ref(false)
const saving = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined
const fieldError = computed(() => attempted.value && (!value.value.trim() || !Number.isFinite(Number(value.value)) || Number(value.value) < 0) ? '请输入大于或等于 0 的数值；没有采样数据时请保持缺失。' : '')
function saveDemo() {
  if (saving.value) return
  attempted.value = true
  saved.value = false
  if (fieldError.value) return
  saving.value = true
  timer = setTimeout(() => { saving.value = false; saved.value = true }, 900)
}
onBeforeUnmount(() => clearTimeout(timer))

type DemoRow = { name: string; actual: string; unit: string; note: string; status: string; tone: 'neutral' | 'normal' | 'warning' | 'alarm' }
const samples: Record<string, DemoRow[]> = {
  short: [
    { name: 'COD', actual: '18', unit: 'mg/L', note: '本次化验结果', status: '正常', tone: 'normal' },
    { name: 'NH₃-N', actual: '4.2', unit: 'mg/L', note: '演示告警样式，不作为业务阈值', status: '告警', tone: 'alarm' },
    { name: '总磷', actual: '0.42', unit: 'mg/L', note: '演示预警样式', status: '预警', tone: 'warning' },
  ],
  long: [
    { name: '填料区游离污泥 MLVSS', actual: '2730', unit: 'mg/L', note: '完整指标名与单位各占一列；备注允许换行', status: '正常', tone: 'normal' },
    { name: '污泥比耗氧速率 SOUR', actual: '12.8', unit: 'mg O₂/(g MLVSS·h)', note: '长单位不可挤入实际值或指标列', status: '待复核', tone: 'neutral' },
    { name: '污泥脱水综合效率', actual: '92 / 8.7', unit: 'kWh/tDS / kg/tDS', note: '电耗 / PAM 单耗分别有单位，不能合成没有定义的分数', status: '待评价', tone: 'neutral' },
  ],
  missing: [
    { name: 'COD', actual: '—', unit: 'mg/L', note: '尚未采样；不计算偏差、不显示正常色', status: '数据缺失', tone: 'neutral' },
    { name: '日排泥量', actual: '0', unit: 'm³/d', note: '有效记录为 0；不等于缺失，也不能自动判定正常', status: '待评价', tone: 'neutral' },
    { name: 'NH₃-N', actual: '<0.02', unit: 'mg/L', note: '低于检出限，保留限定符；不替换成 0', status: '低于检出限', tone: 'neutral' },
    { name: '溶解氧', actual: '2.1', unit: 'mg/L', note: '上一采样时点数据，当前时点尚未更新', status: '历史数据', tone: 'neutral' },
  ],
}
const rows = computed(() => scenario.value === 'many' ? Array.from({ length: 18 }, (_, i) => ({ ...samples.short[i % 3], name: `${samples.short[i % 3].name} · 采样点 ${i + 1}` })) : samples[scenario.value] || [])
const stateKind = computed(() => ({ empty: 'empty', loading: 'loading', error: 'error', forbidden: 'forbidden' } as const)[scenario.value as 'empty' | 'loading' | 'error' | 'forbidden'])
const stateText = computed(() => ({ empty: '当前筛选条件下没有记录。调整日期或项目后重试。', loading: '正在读取本次分析数据，请稍候。', error: '读取失败。本次没有形成诊断结论，请重新读取。', forbidden: '当前角色无权查看该数据。请联系项目管理员。' } as Record<string, string>)[scenario.value])
const longContent = computed(() => scenario.value === 'long')
const columns = [
  { key: 'name', label: '指标' }, { key: 'actual', label: '实际值' },
  { key: 'unit', label: '单位' }, { key: 'state', label: '数据 / 结果状态' }, { key: 'note', label: '数据说明' },
]
</script>

<template>
  <header class="lab-brand"><img src="/waterx-logo-on-dark.png" alt="WaterX"><span>UI 交互验收台</span><small>设计样例 · 不连接业务数据</small></header>
  <main class="lab-main">
    <div class="lab-intro"><p class="lab-eyebrow">DESIGN SYSTEM · 1.0 核心基线 / 1.1 工程补充候选</p><h1>把清晰、克制和可信，落实到每一种状态。</h1><p>这里直接使用主产品的共享组件与设计令牌。切换长内容、缺失数据、加载失败，检验页面是否仍然可读、可操作。</p></div>
    <nav class="lab-links" aria-label="验收分区"><a href="#tables">数据与表格</a><a href="#forms">字段与反馈</a><a href="#buttons">操作状态</a><a href="#rules">迁移准则</a><a href="#quality">经济高效回归</a><a href="#process">工艺维护回归</a></nav>

    <section id="tables" class="lab-section">
      <div class="lab-section-title"><div><p class="lab-eyebrow">01 / 数据判断</p><h2>空间不足时滚动，数据不足时说明。</h2></div><span>保留单位 · 备注换行 · 禁止遮挡</span></div>
      <div class="lab-toolbar">
        <WxField label="数据场景"><WxSelect v-model="scenario" aria-label="数据场景"><option value="short">常规指标</option><option value="long">长指标与长单位</option><option value="missing">缺失、零值与检出限</option><option value="many">多行滚动</option><option value="empty">空数据</option><option value="loading">加载中</option><option value="error">读取失败</option><option value="forbidden">无权限</option></WxSelect></WxField>
        <WxField label="容器宽度"><WxSelect v-model="width" aria-label="容器宽度"><option value="full">铺满工作区</option><option value="840">840px 内容区</option><option value="560">560px 内容区</option></WxSelect></WxField>
        <span class="lab-muted">仅改变本页演示</span>
      </div>
      <div class="lab-canvas" :style="{ maxWidth: width === 'full' ? '100%' : `${width}px` }">
        <WxTableSurface>
          <div class="lab-table-scroll" tabindex="0" role="region" aria-label="数据表格，可使用左右方向键滚动">
            <div :class="['lab-table-stack', { 'is-long': longContent }]">
              <WxTable class="lab-table lab-table-head" aria-hidden="true">
                <colgroup><col v-for="column in columns" :key="column.key" :class="`col-${column.key}`"></colgroup>
                <thead><tr><th v-for="column in columns" :key="column.key">{{ column.label }}</th></tr></thead>
              </WxTable>
              <div class="lab-table-body" tabindex="0" role="region" aria-label="表格记录，可使用上下方向键滚动">
                <WxTable class="lab-table" aria-label="指标展示样例">
                  <colgroup><col v-for="column in columns" :key="column.key" :class="`col-${column.key}`"></colgroup>
                  <thead class="lab-sr-only"><tr><th v-for="column in columns" :key="column.key" scope="col">{{ column.label }}</th></tr></thead>
                  <tbody><tr v-for="row in rows" :key="row.name"><th scope="row">{{ row.name }}</th><td><strong>{{ row.actual }}</strong></td><td>{{ row.unit }}</td><td><WxTag :tone="row.tone">{{ row.status }}</WxTag></td><td>{{ row.note }}</td></tr></tbody>
                </WxTable>
              </div>
            </div>
          </div>
          <WxState v-if="stateKind" :kind="stateKind"><span>{{ stateText }}</span></WxState>
        </WxTableSurface>
      </div>
      <p class="lab-note">沿用固定表头、独立表体的结构；纵向滚动条从表头下方开始。预警 / 告警标签仅演示色彩，不定义工艺阈值。</p>
    </section>

    <section id="forms" class="lab-section">
      <div class="lab-section-title"><div><p class="lab-eyebrow">02 / 任务反馈</p><h2>错误贴近字段，保存状态明确。</h2></div><span>试试空值、负数，以及有效的 0</span></div>
      <form class="lab-form" novalidate @submit.prevent="saveDemo">
        <WxField v-slot="{ controlProps }" label="实测值（mg/L）" layout="stacked" required help="演示输入；0 是有效数值。" :error="fieldError"><WxInput v-model="value" v-bind="controlProps" inputmode="decimal" :disabled="saving" @input="saved = false" /></WxField>
        <WxField v-slot="{ controlProps }" label="匹配工况" layout="stacked" help="系统根据日期自动匹配，当前只读。"><WxSelect v-bind="controlProps" model-value="summer" disabled><option value="summer">夏季工况</option></WxSelect></WxField>
        <div class="lab-form-actions"><WxButton type="submit" variant="primary" :loading="saving">{{ saving ? '演示保存中' : '演示保存' }}</WxButton><span v-if="saved" role="status">演示校验通过，未写入任何业务记录。</span></div>
      </form>
    </section>

    <section id="buttons" class="lab-section">
      <div class="lab-section-title"><div><p class="lab-eyebrow">03 / 组件完整性</p><h2>同一套按钮，状态一致。</h2></div><span>Tab 键可检查焦点 · 禁用按钮不可触发</span></div>
      <div class="lab-button-matrix" role="group" aria-label="按钮状态对照">
        <div v-for="variant in (['primary', 'secondary', 'ghost', 'danger'] as const)" :key="variant"><span>{{ {primary:'主操作',secondary:'次操作',ghost:'文字操作',danger:'危险操作'}[variant] }}</span><WxButton :variant="variant">状态样例</WxButton><WxButton :variant="variant" disabled>不可操作</WxButton><WxButton :variant="variant" loading>处理中</WxButton></div>
      </div>
    </section>

    <section id="rules" class="lab-section lab-rules">
      <p class="lab-eyebrow">04 / 后续开发约束</p><h2>继承已确认的设计，再承接业务变化。</h2>
      <ol><li>深水蓝导航、浅色工作区、橙色 X 和固定行业图标继续作为品牌基线。</li><li>表格先保证各列可读，再分配剩余空间；只在内容确实放不下时启用局部横向滚动。</li><li>数据质量和运行状态分开表达；缺失、历史数据、待复核不能显示成正常。</li><li>先标明页面任务，再选工作台、数据诊断、指标评价、主从详情或编辑模式。</li><li>新增模块需补齐默认、悬停、焦点、禁用、加载、空数据与错误状态。</li></ol>
      <p>本轮没有重新定义数值阈值、评分公式或权限策略；这些判断由相应业务模块提供。</p>
    </section>
    <QualityLab />
    <ProcessEditorLab />
  </main>
</template>
