<script setup lang="ts">
import { computed, reactive } from 'vue'
import { PROCESS_MODULES, PROCESS_RULE_VERSION } from './rules'
import type { EvaluationCadence, EvaluationTask, ProcessModuleKey, TaskDraft, TaskType } from './types'

const props = defineProps<{ task?: EvaluationTask | null }>()
const emit = defineEmits<{ close: []; save: [draft: TaskDraft] }>()
const today = '2026-08-29'
const draft = reactive<TaskDraft>({
  name: props.task?.name || '2026年9月综合过程评价', type: props.task?.type || '综合检查',
  periodStart: props.task?.periodStart || today, periodEnd: props.task?.periodEnd || '2026-09-30',
  evaluationDate: props.task?.evaluationDate || '2026-09-30', cadence: props.task?.cadence || '月度评价',
  moduleKeys: props.task ? [...props.task.moduleKeys] : PROCESS_MODULES.map((module) => module.key), owner: props.task?.owner || '运营负责人',
})
const editing = computed(() => Boolean(props.task))
const canEditScope = computed(() => !props.task || ['草稿', '待执行'].includes(props.task.status))

function toggleModule(module: ProcessModuleKey) {
  if (!canEditScope.value) return
  const index = draft.moduleKeys.indexOf(module)
  if (index >= 0) draft.moduleKeys.splice(index, 1)
  else draft.moduleKeys.push(module)
}

function submit() {
  if (!draft.name.trim() || !draft.moduleKeys.length || !draft.periodStart || !draft.periodEnd) return
  emit('save', { ...draft, moduleKeys: [...draft.moduleKeys] })
}
</script>

<template>
  <div class="pe-modal-mask" @click.self="emit('close')">
    <section class="pe-modal pe-task-modal" role="dialog" aria-modal="true" aria-labelledby="pe-task-title">
      <header><div><p class="pe-eyebrow">评价任务</p><h2 id="pe-task-title">{{ editing ? '编辑评价任务' : '新建评价任务' }}</h2><p>{{ editing ? '修改任务信息；已开始的任务保持原评价范围和规则版本。' : '先确定评价时间、范围和规则版本，再进入逐项检查。' }}</p></div><button class="pe-close" aria-label="关闭" @click="emit('close')">×</button></header>
      <div class="pe-form-grid">
        <label class="pe-span-2">任务名称<input v-model="draft.name" /></label>
        <label>任务类型<select v-model="draft.type"><option v-for="type in (['综合检查','专项检查','整改复核'] as TaskType[])" :key="type">{{ type }}</option></select></label>
        <label>评价频次<select v-model="draft.cadence"><option v-for="cadence in (['月度评价','季度评价','半年度评价','专项评价','整改复核'] as EvaluationCadence[])" :key="cadence">{{ cadence }}</option></select></label>
        <label>任务负责人<input v-model="draft.owner" /></label>
        <label>评价日期<input v-model="draft.evaluationDate" type="date" /></label>
        <label>开始日期<input v-model="draft.periodStart" type="date" /></label>
        <label>结束日期<input v-model="draft.periodEnd" type="date" /></label>
      </div>
      <div class="pe-field-block">
        <b>评价范围</b><small>{{ canEditScope ? '五个模块独立评分，可按专项任务选择部分模块。' : '任务已开始，评价范围已冻结；仍可修改名称、日期、频次和负责人。' }}</small>
        <div class="pe-module-choice">
          <button v-for="module in PROCESS_MODULES" :key="module.key" type="button" :disabled="!canEditScope" :class="{ selected: draft.moduleKeys.includes(module.key) }" @click="toggleModule(module.key)">
            <span>{{ module.icon }}</span><b>{{ module.shortName }}</b><small>{{ module.categories.length }} 类 · {{ module.key === 'laboratory' ? 29 : module.key === 'safety' ? 27 : 25 }} 项</small>
          </button>
        </div>
      </div>
      <div class="pe-rule-note"><b>任务规则</b><span>{{ PROCESS_RULE_VERSION }}</span><small>任务创建后冻结版本；后续调整不回写历史评价。</small></div>
      <footer><button class="pe-button" @click="emit('close')">取消</button><button class="pe-button pe-button-primary" :disabled="!draft.moduleKeys.length || !draft.name.trim() || !draft.evaluationDate" @click="submit">{{ editing ? '保存修改' : '创建并进入检查' }}</button></footer>
    </section>
  </div>
</template>
