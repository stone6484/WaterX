<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { WxButton, WxField, WxSelect } from '../components/waterx'
import ManagementQualityPage from '../modules/management-quality/ManagementQualityPage.vue'
import type { ImprovementDraft, QualityPageId } from '../modules/management-quality/types'
const page = ref<QualityPageId>('qualityEfficiency')
const width = ref('full')
const message = ref('')
const qualityRoot = ref<HTMLElement | null>(null)
const audit = ref<{ passed:boolean; details:string[] } | null>(null)
watch([page, width], () => { audit.value = null })

async function checkTable() {
  await nextTick()
  const root = qualityRoot.value
  const header = root?.querySelector('.mq-table-head')
  const row = root?.querySelector('.mq-table-body tbody tr')
  const scroller = root?.querySelector('.mq-table-x-scroll')
  if (!root || !header || !row || !scroller) {
    audit.value = { passed:false, details:['未找到可检查的表格，不能把空结果当作通过。'] }
    return
  }
  const heads = [...header.querySelectorAll('th')]
  const cells = [...row.children]
  const aligned = heads.length === cells.length && heads.every((cell,index) => {
    const a = cell.getBoundingClientRect(), b = cells[index].getBoundingClientRect()
    return Math.abs(a.left - b.left) <= 1 && Math.abs(a.width - b.width) <= 1
  })
  const overlaps = [...root.querySelectorAll('.mq-table-body tbody td')].filter(cell => {
    const range = document.createRange()
    range.selectNodeContents(cell)
    const text = range.getBoundingClientRect(), bounds = cell.getBoundingClientRect()
    return text.width > 0 && (text.left < bounds.left + 4 || text.right > bounds.right - 4)
  })
  const wrapped = [...root.querySelectorAll('.mq-row-actions')].filter(group => new Set([...group.children].map(button => Math.round(button.getBoundingClientRect().top))).size > 1)
  const pageOverflow = document.documentElement.scrollWidth > window.innerWidth + 1
  audit.value = {
    passed:aligned && !overlaps.length && !wrapped.length && !pageOverflow,
    details:[`表头 / 表体对齐：${aligned ? '通过' : '未通过'}`, `内容越界：${overlaps.length} 处`, `操作换行：${wrapped.length} 行`, `整页横向溢出：${pageOverflow ? '存在' : '无'}`, `表格横向滚动：${scroller.scrollWidth > scroller.clientWidth + 1 ? '限于局部容器' : '不需要'}`]
  }
}
function improvement(draft: ImprovementDraft) {
  message.value = `已演示“${draft.sourceMetricName}”发起改进动作；本验收页不创建改进记录。`
}
</script>

<template>
  <section id="quality" class="lab-section">
    <div class="lab-section-title"><div><p class="lab-eyebrow">05 / 真实模块回归</p><h2>经济高效：从指标进入证据。</h2></div><span>原模块 · 固定演示数据 · 不创建业务记录</span></div>
    <p class="lab-note quality-lab-note">点击评分标准、结果解读或业务事实。抽屉支持 Esc、遮罩关闭、键盘页签和关闭后返回原按钮；无需登录即可检查真实组件。</p>
    <p v-if="message" class="quality-lab-result" role="status">{{ message }}</p>
    <div class="lab-toolbar"><WxField label="工作区宽度"><WxSelect v-model="width" aria-label="真实模块工作区宽度"><option value="full">铺满工作区</option><option value="1040">1040px（紧凑桌面）</option><option value="760">760px（窄工作区）</option></WxSelect></WxField><WxButton @click="checkTable">检查当前表格</WxButton></div>
    <div v-if="audit" class="quality-lab-audit" :class="{ 'has-failure':!audit.passed }" :role="audit.passed ? 'status' : 'alert'"><b>{{audit.passed ? '当前页样例检查通过' : '发现需要处理的问题'}}</b><span v-for="detail in audit.details" :key="detail">{{detail}}</span><small>仅检查当前数据与容器；不替代键盘、截图和真实业务验收。</small></div>
    <div ref="qualityRoot" :style="{ maxWidth:width === 'full' ? '100%' : `${width}px` }"><ManagementQualityPage v-model:active-page="page" @start-improvement="improvement" /></div>
  </section>
</template>

<style scoped>
.quality-lab-note{margin:0 0 16px}.quality-lab-result{padding:12px 0;color:var(--wx-blue-700);font-size:12px}
.quality-lab-audit{display:flex;flex-wrap:wrap;gap:8px 20px;padding:12px 0 16px;color:var(--wx-n600);font-size:12px}.quality-lab-audit b,.quality-lab-audit small{flex-basis:100%}.quality-lab-audit b{color:var(--wx-success-strong)}.quality-lab-audit.has-failure b{color:var(--wx-danger-strong)}.quality-lab-audit small{color:var(--wx-n500)}
</style>
