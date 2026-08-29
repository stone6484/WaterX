<script setup lang="ts">
import type { ImprovementDraft } from './types'

defineProps<{ draft:ImprovementDraft; mode:'issue'|'plan' }>()
const emit = defineEmits<{ 'create-plan':[]; clear:[] }>()
</script>

<template>
  <section class="improvement-draft">
    <header>
      <div><p>管理质量下钻 · 演示链路</p><h2>{{mode==='issue'?'已生成问题草稿':'改进计划已自动带入来源信息'}}</h2></div>
      <span>未保存 · 固定样例</span>
    </header>
    <div class="draft-source">
      <span><small>来源模块</small><b>{{draft.sourceModule}}</b></span>
      <span><small>来源指标</small><b>{{draft.sourceMetricCode}} · {{draft.sourceMetricName}}</b></span>
      <span><small>评价周期</small><b>{{draft.evaluationPeriod}}</b></span>
      <span><small>规则版本</small><b>{{draft.ruleVersion}}</b></span>
    </div>
    <div class="draft-fields">
      <label><span>当前值</span><input :value="draft.currentValue" readonly /></label>
      <label><span>当前得分</span><input :value="draft.currentScore" readonly /></label>
      <label class="wide"><span>适用基线</span><input :value="draft.baseline" readonly /></label>
      <label class="wide"><span>问题描述</span><textarea :value="draft.problemDescription" rows="3" readonly></textarea></label>
      <label v-if="mode==='plan'" class="wide"><span>建议改进目标</span><textarea :value="draft.suggestedGoal" rows="2" readonly></textarea></label>
    </div>
    <footer>
      <p>{{mode==='issue'?'来源指标、当前值、基线和问题描述已自动带入，无需重复录入。':'下一批次将补齐责任人、措施、期限、执行和复核状态。'}}</p>
      <div><button type="button" @click="emit('clear')">清除草稿</button><button v-if="mode==='issue'" type="button" class="primary" @click="emit('create-plan')">转为改进计划</button></div>
    </footer>
  </section>
</template>

<style scoped>
.improvement-draft{margin-top:12px;overflow:hidden;border:1px solid #a9d3e4;border-radius:13px;background:#fff;box-shadow:0 8px 24px rgba(15,112,155,.05)}.improvement-draft>header{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px 18px;border-bottom:1px solid #dceaf0;background:linear-gradient(120deg,#f2faff,#fff)}.improvement-draft>header p{margin:0;color:#1883ad;font-size:9px}.improvement-draft>header h2{margin:4px 0 0;color:#214b63;font-size:16px}.improvement-draft>header>span{padding:5px 8px;border-radius:9px;background:#fff5df;color:#a1680e;font-size:8px}.draft-source{display:grid;grid-template-columns:.7fr 1.3fr 1.3fr .8fr;gap:8px;padding:12px 16px;background:#fbfdfe}.draft-source span{display:grid;gap:4px;padding:9px;border:1px solid #e1ebf0;border-radius:8px}.draft-source small{color:#8196a2;font-size:8px}.draft-source b{color:#31596f;font-size:9px}.draft-fields{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;padding:15px 16px}.draft-fields label{display:grid;gap:5px}.draft-fields label.wide{grid-column:1/-1}.draft-fields span{color:#6e8998;font-size:9px}.draft-fields input,.draft-fields textarea{padding:9px 10px;border:1px solid #d4e3ea;border-radius:7px;background:#f8fbfc;color:#355d73;font:inherit;font-size:10px;resize:vertical}.improvement-draft>footer{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:12px 16px;border-top:1px solid #e3edf2}.improvement-draft>footer p{margin:0;color:#718b99;font-size:9px}.improvement-draft>footer div{display:flex;gap:7px}.improvement-draft>footer button{height:31px;padding:0 12px;border:1px solid #c9dce6;border-radius:6px;background:#fff;color:#527184;font-size:9px;cursor:pointer}.improvement-draft>footer button.primary{border-color:#1683b0;background:#1683b0;color:#fff}@media(max-width:820px){.draft-source{grid-template-columns:1fr 1fr}.improvement-draft>footer{align-items:flex-start;flex-direction:column}}
</style>
