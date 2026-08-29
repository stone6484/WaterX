<script setup lang="ts">
import { computed, ref } from 'vue'
import { getQualityScenarioView } from './adapter'
import { DEFAULT_SCENARIO_ID } from './demo-data'
import { QUALITY_RULE_VERSION, QUALITY_STANDARD_SCORE, dataStatusMeta, qualityPages } from './rules'
import type { ImprovementDraft, QualityMetricView, QualityPageId, QualitySourceFact } from './types'

const props = defineProps<{
  activePage: QualityPageId
  siteName?: string
  siteCode?: string
}>()

const emit = defineEmits<{
  'update:activePage':[page:QualityPageId]
  'start-improvement':[draft:ImprovementDraft]
}>()

const selectedMetric = ref<QualityMetricView | null>(null)
const selectedFact = ref<QualitySourceFact | null>(null)
const detailTab = ref<'overview'|'standard'|'interpretation'|'data'>('overview')

const view = computed(()=>getQualityScenarioView(DEFAULT_SCENARIO_ID))
const currentPage = computed(()=>qualityPages[props.activePage])
const visibleMetrics = computed(()=>view.value.metrics.filter(metric=>metric.dimension===currentPage.value.dimension))

function openMetric(metric:QualityMetricView, tab:typeof detailTab.value = 'overview') {
  selectedMetric.value = metric
  selectedFact.value = null
  detailTab.value = tab
}

function openFact(metric:QualityMetricView) {
  openMetric(metric,'data')
  selectedFact.value = metric.facts[0] ?? null
}

function startImprovement(metric:QualityMetricView) {
  emit('start-improvement',{
    sourceModule:'管理质量',
    sourceMetricCode:metric.code,
    sourceMetricName:metric.name,
    currentValue:metric.actual,
    baseline:metric.baseline,
    currentScore:metric.scoreText,
    problemDescription:`${metric.code} ${metric.name}：${metric.interpretation}`,
    suggestedGoal:`恢复至适用基线（${metric.baseline}）并完成一个评价周期的效果验证`,
    evaluationPeriod:view.value.scenario.evaluationPeriod,
    ruleVersion:QUALITY_RULE_VERSION
  })
  selectedMetric.value = null
}

function scoreWidth(metric:QualityMetricView) {
  return metric.score===null ? '0%' : `${Math.max(0,Math.min(100,metric.score / metric.maxScore * 100))}%`
}

function trendHeight(metric:QualityMetricView, value:number) {
  const max = Math.max(metric.maxScore,...metric.trend)
  return `${Math.max(8,Math.round(value / max * 100))}%`
}
</script>

<template>
  <section class="mq-page">
    <section class="mq-score-dock" aria-label="管理质量评分导航">
      <article class="mq-period-card">
        <span>评价周期</span>
        <strong>{{view.scenario.evaluationPeriod}}</strong>
        <small>规则讨论稿 {{QUALITY_RULE_VERSION}} · 待验证参数</small>
      </article>
      <article class="mq-total-score" :class="{incomplete:view.totalScore===null}">
        <span>标准总分</span>
        <strong>{{view.totalScore===null?'暂不发布':view.totalScore}}<small v-if="view.totalScore!==null"> / {{QUALITY_STANDARD_SCORE}}</small></strong>
        <small v-if="view.totalScore===null">当前可用分 {{view.availableScore}}</small>
        <small v-else>固定100分</small>
      </article>
      <button v-for="dimension in view.dimensions" :key="dimension.id" type="button" class="mq-dimension-card" :class="{selected:currentPage.dimension===dimension.id}" @click="emit('update:activePage',dimension.pageId)">
        <span>{{dimension.name}}<em>{{dimension.metricCount}}项</em></span>
        <strong>{{dimension.score===null?'待核查':dimension.score}}<small v-if="dimension.score!==null"> / {{dimension.maxScore}}</small></strong>
        <i><b :style="{width:dimension.score===null?'0%':`${dimension.score/dimension.maxScore*100}%`}"></b></i>
      </button>
    </section>

    <section class="mq-metric-panel">
      <header>
        <div><b>{{currentPage.title}}指标</b><span>统一结构展示实际值、基线、偏差、得分、状态与操作</span></div>
        <em>{{visibleMetrics.length}} 项 · 满分 {{view.dimensions.find(item=>item.id===currentPage.dimension)?.maxScore}}</em>
      </header>
      <div class="mq-table-wrap">
        <table>
          <thead><tr><th>指标</th><th>实际值</th><th>适用基线 / 偏差</th><th>得分</th><th>数据状态</th><th>操作</th></tr></thead>
          <tbody>
            <tr v-for="metric in visibleMetrics" :key="metric.code" :class="[`risk-${metric.riskLevel}`]">
              <td><button type="button" class="mq-metric-name" @click="openMetric(metric)"><i>{{metric.code}}</i><b>{{metric.name}}</b><small>{{metric.dimensionName}} · {{metric.maxScore}}分</small></button></td>
              <td><strong>{{metric.actual}}</strong><small>{{metric.period}}</small></td>
              <td><b>{{metric.baseline}}</b><small>偏差：{{metric.deviation}}</small></td>
              <td><strong>{{metric.scoreText}}</strong><i class="mq-score-track"><b :style="{width:scoreWidth(metric)}"></b></i></td>
              <td><span class="mq-status-chip" :class="dataStatusMeta[metric.status].tone">{{dataStatusMeta[metric.status].label}}</span><small>{{metric.statusNote}}</small></td>
              <td><div class="mq-row-actions"><button type="button" @click="openMetric(metric,'standard')">查看评分标准</button><button type="button" @click="openMetric(metric,'interpretation')">评分结果解读</button><button v-if="metric.facts.length" type="button" @click="openFact(metric)">查看业务事实</button></div></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div v-if="selectedMetric" class="mq-overlay" @click.self="selectedMetric=null">
      <aside class="mq-drawer" role="dialog" aria-modal="true" :aria-label="`${selectedMetric.code}指标详情`">
        <header>
          <div><p>{{selectedMetric.dimensionName}} · {{selectedMetric.code}}</p><h2>{{selectedMetric.name}}</h2><span>规则讨论稿 {{QUALITY_RULE_VERSION}}</span><em>待验证参数</em></div>
          <button type="button" aria-label="关闭" @click="selectedMetric=null">×</button>
        </header>
        <nav><button v-for="tab in [{id:'overview',name:'指标详情'},{id:'standard',name:'评分标准'},{id:'interpretation',name:'结果解读'},{id:'data',name:'数据与事实'}]" :key="tab.id" type="button" :class="{selected:detailTab===tab.id}" @click="detailTab=tab.id as typeof detailTab">{{tab.name}}</button></nav>
        <div class="mq-drawer-body">
          <template v-if="detailTab==='overview'">
            <section class="mq-detail-score"><div><span>当前得分</span><strong>{{selectedMetric.scoreText}}</strong></div><div><span>实际值</span><strong>{{selectedMetric.actual}}</strong></div><div><span>适用基线</span><strong>{{selectedMetric.baseline}}</strong></div><div><span>偏差</span><strong>{{selectedMetric.deviation}}</strong></div></section>
            <section class="mq-detail-card"><h3>定义与评价目的</h3><dl><div><dt>指标定义</dt><dd>{{selectedMetric.definition}}</dd></div><div><dt>评价目的</dt><dd>{{selectedMetric.purpose}}</dd></div><div><dt>分值 / 单位</dt><dd>{{selectedMetric.maxScore}}分 / {{selectedMetric.unit}}</dd></div><div><dt>计算周期</dt><dd>{{selectedMetric.period}}</dd></div><div><dt>数据状态</dt><dd><span class="mq-status-chip" :class="dataStatusMeta[selectedMetric.status].tone">{{dataStatusMeta[selectedMetric.status].label}}</span> {{selectedMetric.statusNote}}</dd></div><div><dt>来源模块</dt><dd>{{selectedMetric.sourceModules.join('、')}}</dd></div></dl></section>
          </template>

          <template v-else-if="detailTab==='standard'">
            <section class="mq-draft-warning"><b>规则讨论稿 {{QUALITY_RULE_VERSION}}</b><span>以下公式、阈值和适用条件用于DEMO验证，未经专家评审不得作为正式企业标准。</span></section>
            <section class="mq-detail-card"><h3>适用基线</h3><p>{{selectedMetric.baseline}}</p></section>
            <section class="mq-detail-card"><h3>计算公式</h3><p class="mq-formula">{{selectedMetric.formula}}</p></section>
            <section class="mq-detail-card"><h3>评分规则</h3><p>{{selectedMetric.scoringRule}}</p></section>
            <section class="mq-detail-card"><h3>适用与异常处理</h3><p>{{selectedMetric.applicability}}</p></section>
            <section class="mq-pending"><b>待验证参数</b><p>{{selectedMetric.pendingValidation}}</p></section>
          </template>

          <template v-else-if="detailTab==='interpretation'">
            <section class="mq-result-callout" :class="selectedMetric.riskLevel"><span>本期结果</span><strong>{{selectedMetric.actual}} · {{selectedMetric.scoreText}}</strong><p>{{selectedMetric.interpretation}}</p></section>
            <section class="mq-detail-card"><h3>结果应该如何理解</h3><p>{{selectedMetric.resultMeaning}}</p></section>
            <section class="mq-detail-card"><h3>历史趋势</h3><div class="mq-history-bars"><span v-for="(value,index) in selectedMetric.trend" :key="index"><i :style="{height:trendHeight(selectedMetric,value)}"></i><b>{{value}}</b><small>{{selectedMetric.trendLabels[index]}}</small></span></div></section>
            <section class="mq-detail-card"><h3>建议关注</h3><p>{{selectedMetric.statusNote}} 当前解释仅作为问题定位线索，不替代专业模块的业务诊断。</p></section>
          </template>

          <template v-else>
            <section class="mq-detail-card"><h3>数据来源</h3><dl><div><dt>责任模块</dt><dd>{{selectedMetric.sourceModules.join('、')}}</dd></div><div><dt>评价周期</dt><dd>{{view.scenario.evaluationPeriod}}</dd></div><div><dt>规则版本</dt><dd>{{QUALITY_RULE_VERSION}}</dd></div><div><dt>数据状态</dt><dd>{{dataStatusMeta[selectedMetric.status].label}}：{{dataStatusMeta[selectedMetric.status].description}}</dd></div></dl></section>
            <section class="mq-detail-card"><h3>原始业务事实</h3><div v-if="selectedMetric.facts.length" class="mq-fact-list"><button v-for="record in selectedMetric.facts" :key="record.id" type="button" :class="{selected:selectedFact?.id===record.id}" @click="selectedFact=record"><span>{{record.module}}</span><b>{{record.title}}</b><small>{{record.recordNo}} · {{record.recordedAt}}</small></button></div><p v-else class="mq-empty">本指标暂以固定演示汇总数据承接，专业模块详情接口将在后续批次接入。</p></section>
            <section v-if="selectedFact" class="mq-fact-detail"><header><div><span>专业模块演示明细</span><h3>{{selectedFact.title}}</h3></div><em>{{selectedFact.module}}</em></header><dl><div><dt>记录编号</dt><dd>{{selectedFact.recordNo}}</dd></div><div><dt>记录时间</dt><dd>{{selectedFact.recordedAt}}</dd></div><div><dt>责任人</dt><dd>{{selectedFact.owner}}</dd></div><div><dt>业务事实</dt><dd>{{selectedFact.detail}}</dd></div></dl><p>该明细引用专业模块事实，不在管理质量中复制新的专业管理表单。</p></section>
          </template>
        </div>
        <footer><span>样例水厂 · 固定可重置数据</span><div><button type="button" @click="selectedMetric=null">关闭</button><button v-if="selectedMetric.score!==null && selectedMetric.score<selectedMetric.maxScore" type="button" class="primary" @click="startImprovement(selectedMetric)">发起改进</button></div></footer>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.mq-page{display:grid;gap:12px;color:#244b62}.mq-page button,.mq-page select{font:inherit}.mq-hero{min-height:116px;display:flex;align-items:center;justify-content:space-between;gap:28px;padding:22px 24px;border:1px solid #d8e8f1;border-radius:14px;background:linear-gradient(135deg,#fff 0%,#f5fbfe 65%,#edf7fc 100%);box-shadow:0 7px 24px rgba(14,116,162,.05)}.mq-hero h1{margin:0;color:#173f58;font-size:24px}.mq-hero p{max-width:820px;margin:6px 0 0;color:#698292;font-size:12px}.mq-hero .mq-eyebrow{margin:0 0 4px;color:#1681b2;font-size:10px}.mq-version-tags{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:6px;max-width:330px}.mq-version-tags span,.mq-version-tags em,.mq-version-tags small{padding:6px 9px;border:1px solid #bfd8e5;border-radius:999px;background:#f1f8fb;color:#34738f;font-size:9px;font-style:normal}.mq-version-tags em{border-color:#efd199;background:#fff7e5;color:#a66a0b}.mq-version-tags small{border-color:#d7e3e9;background:#fff;color:#6f8795}.mq-context-bar{display:grid;grid-template-columns:1fr 1.25fr 1.4fr auto;gap:9px;padding:12px 14px;border:1px solid #dbe9f0;border-radius:12px;background:#fff}.mq-context-bar label{display:grid;gap:5px;color:#75909f;font-size:9px}.mq-context-bar select{height:34px;padding:0 10px;border:1px solid #d4e3eb;border-radius:7px;background:#fbfdfe;color:#31586e;font-size:10px}.mq-context-bar select:disabled{opacity:1}.mq-reset{align-self:end;height:34px;padding:0 13px;border:1px solid #bad8e7;border-radius:7px;background:#eff8fc;color:#147ca7;font-size:10px;cursor:pointer}.mq-scenario-note{display:flex;align-items:center;gap:8px;margin:-3px 3px 0;color:#718895;font-size:10px}.mq-scenario-note b{color:#31586e}.mq-scenario-note span{margin-left:auto;color:#91a2ac}.mq-tabs{display:grid;grid-template-columns:repeat(5,1fr);gap:7px;padding:6px;border:1px solid #d9e8f0;border-radius:11px;background:#fff}.mq-tabs button{min-height:36px;border:0;border-radius:7px;background:transparent;color:#617d8e;font-size:11px;cursor:pointer}.mq-tabs button.selected{background:#e7f5fb;color:#087cad;font-weight:700}.mq-score-board{display:grid;grid-template-columns:1.15fr repeat(4,1fr) 1fr;gap:9px}.mq-score-board>article,.mq-dimension-card{min-height:120px;padding:14px 15px;border:1px solid #dce9f1;border-radius:12px;background:#fff;text-align:left}.mq-total-score{background:linear-gradient(145deg,#117ead,#0e6f9b)!important;color:#fff}.mq-total-score.incomplete{background:linear-gradient(145deg,#536f7f,#3c5b6c)!important}.mq-score-board span{display:flex;justify-content:space-between;color:#718897;font-size:10px}.mq-total-score span{color:#dff3fb}.mq-score-board strong{display:block;margin-top:10px;color:#173f58;font-size:22px}.mq-total-score strong{color:#fff;font-size:29px}.mq-score-board strong small{font-size:10px;font-weight:500}.mq-score-board p{margin:8px 0 0;color:#8296a3;font-size:9px;line-height:1.5}.mq-total-score p{color:#d9eef7}.mq-dimension-card{display:block;cursor:pointer}.mq-dimension-card.selected{border-color:#76beda;background:#f2faff}.mq-dimension-card span em{font-size:8px;font-style:normal}.mq-dimension-card i{display:block;height:4px;margin-top:10px;overflow:hidden;border-radius:3px;background:#e8f0f4}.mq-dimension-card i b{display:block;height:100%;border-radius:3px;background:#1992bf}.mq-coverage strong{font-size:21px}.mq-overview-grid{display:grid;grid-template-columns:1.05fr .9fr 1.05fr;gap:10px}.mq-overview-grid>article{min-height:190px;padding:15px 16px;border:1px solid #dce9f1;border-radius:12px;background:#fff}.mq-overview-grid header,.mq-metric-panel>header{display:flex;justify-content:space-between;gap:10px}.mq-overview-grid header b,.mq-metric-panel>header b{font-size:12px}.mq-overview-grid header span,.mq-metric-panel>header span{color:#8498a4;font-size:9px}.mq-loss-item{width:100%;display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:8px;padding:7px 0;border:0;border-bottom:1px solid #edf2f5;background:transparent;text-align:left;cursor:pointer}.mq-loss-item span{display:grid;grid-template-columns:54px 1fr;align-items:center;justify-content:start}.mq-loss-item i{color:#1685b2;font-size:9px;font-style:normal}.mq-loss-item b{font-size:10px}.mq-loss-item strong{color:#c77720;font-size:10px}.mq-status-summary{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}.mq-status-summary span{min-width:86px;display:grid;gap:2px;padding:9px;border-radius:8px;background:#f4f8fa;color:#647d8c;font-size:9px}.mq-status-summary b{font-size:17px}.mq-status-summary .normal{background:#edf8f4;color:#207d61}.mq-status-summary .risk{background:#fff0ed;color:#b54837}.mq-status-summary .warning{background:#fff6e7;color:#a86a13}.mq-trend-summary{min-height:55px;margin:14px 0!important;color:#516d7d!important;font-size:10px!important}.mq-dimension-trends{display:grid;gap:7px}.mq-dimension-trends span{display:grid;grid-template-columns:62px 1fr;align-items:center;gap:8px;font-size:9px}.mq-dimension-trends i{height:5px;overflow:hidden;border-radius:3px;background:#e8f0f4}.mq-dimension-trends em{display:block;height:100%;border-radius:3px;background:#3aa1c6}.mq-metric-panel{overflow:hidden;border:1px solid #dce9f1;border-radius:13px;background:#fff}.mq-metric-panel>header{align-items:center;padding:14px 16px;border-bottom:1px solid #e6eef3}.mq-metric-panel>header div{display:grid;gap:3px}.mq-metric-panel>header em{color:#1786b3;font-size:10px;font-style:normal}.mq-table-wrap{overflow:auto}.mq-table-wrap table{width:100%;min-width:1000px;border-collapse:collapse}.mq-table-wrap th{padding:9px 10px;background:#f5f9fb;color:#76909f;font-size:9px;font-weight:600;text-align:left}.mq-table-wrap td{padding:11px 10px;border-top:1px solid #edf2f5;color:#385d72;font-size:9px;vertical-align:top}.mq-table-wrap td>strong,.mq-table-wrap td>b{display:block;color:#244d64;font-size:10px}.mq-table-wrap td>small{display:block;max-width:205px;margin-top:4px;color:#8498a4;line-height:1.4}.mq-metric-name{display:grid;gap:3px;padding:0;border:0;background:none;text-align:left;cursor:pointer}.mq-metric-name i{color:#1484b0;font-size:9px;font-style:normal}.mq-metric-name b{color:#284f66;font-size:10px}.mq-metric-name small{color:#8296a3;font-size:8px}.mq-score-track{display:block;width:70px;height:4px;margin-top:6px;overflow:hidden;border-radius:2px;background:#e9f0f4}.mq-score-track b{display:block;height:100%;background:#2a9bc3}.risk-risk .mq-score-track b{background:#d56750}.mq-status-chip{display:inline-block;padding:3px 7px;border-radius:9px;background:#edf8f4;color:#1f7d61;font-size:8px;white-space:nowrap}.mq-status-chip.muted{background:#f0f3f5;color:#687b86}.mq-status-chip.warning{background:#fff4df;color:#aa6b0f}.mq-status-chip.risk{background:#fff0ed;color:#b64836}.mq-row-actions{display:flex;flex-wrap:wrap;gap:4px;max-width:190px}.mq-row-actions button{padding:4px 6px;border:1px solid #cee1ea;border-radius:5px;background:#fff;color:#177ca5;font-size:8px;cursor:pointer}.mq-overlay{position:fixed;inset:0;z-index:1000;display:flex;justify-content:flex-end;background:rgba(14,34,46,.35);backdrop-filter:blur(2px)}.mq-drawer{width:min(700px,94vw);height:100%;display:grid;grid-template-rows:auto auto 1fr auto;background:#f5f8fa;box-shadow:-12px 0 40px rgba(12,45,63,.18)}.mq-drawer>header{min-height:102px;display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:20px 22px;background:#fff;border-bottom:1px solid #dfeaf0}.mq-drawer>header p{margin:0;color:#1785b1;font-size:9px}.mq-drawer>header h2{margin:4px 0 8px;color:#1d455c;font-size:19px}.mq-drawer>header span,.mq-drawer>header em{display:inline-block;margin-right:5px;padding:4px 7px;border-radius:8px;background:#edf6fa;color:#46758d;font-size:8px;font-style:normal}.mq-drawer>header em{background:#fff4df;color:#9e680f}.mq-drawer>header>button{border:0;background:none;color:#718896;font-size:24px;cursor:pointer}.mq-drawer>nav{display:grid;grid-template-columns:repeat(4,1fr);padding:6px 12px;border-bottom:1px solid #dfeaf0;background:#fff}.mq-drawer>nav button{height:34px;border:0;border-radius:7px;background:transparent;color:#6f8795;font-size:9px;cursor:pointer}.mq-drawer>nav button.selected{background:#e8f5fb;color:#087eae;font-weight:700}.mq-drawer-body{overflow:auto;display:grid;align-content:start;gap:10px;padding:14px 16px}.mq-detail-score{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.mq-detail-score div{min-height:76px;padding:12px;border:1px solid #dce8ee;border-radius:9px;background:#fff}.mq-detail-score span{color:#78909e;font-size:8px}.mq-detail-score strong{display:block;margin-top:7px;color:#214b62;font-size:12px}.mq-detail-card,.mq-pending,.mq-result-callout,.mq-draft-warning,.mq-fact-detail{padding:15px 17px;border:1px solid #dce8ee;border-radius:10px;background:#fff}.mq-detail-card h3,.mq-fact-detail h3{margin:0 0 10px;color:#294f65;font-size:11px}.mq-detail-card p,.mq-pending p,.mq-result-callout p,.mq-fact-detail p{margin:0;color:#587283;font-size:10px;line-height:1.7}.mq-detail-card dl,.mq-fact-detail dl{display:grid;gap:9px;margin:0}.mq-detail-card dl div,.mq-fact-detail dl div{display:grid;grid-template-columns:100px 1fr;gap:12px}.mq-detail-card dt,.mq-fact-detail dt{color:#7b919e;font-size:9px}.mq-detail-card dd,.mq-fact-detail dd{margin:0;color:#385d72;font-size:10px;line-height:1.6}.mq-formula{padding:12px;border-radius:7px;background:#f1f7fa;color:#24556f!important;font-weight:600}.mq-draft-warning{display:grid;gap:5px;border-color:#f0d59f;background:#fff8e9}.mq-draft-warning b,.mq-pending b{color:#98630d;font-size:10px}.mq-draft-warning span{color:#856d42;font-size:9px}.mq-pending{border-color:#efd49e;background:#fff9eb}.mq-result-callout{border-left:4px solid #2f9e79}.mq-result-callout.attention{border-left-color:#dda03c}.mq-result-callout.risk{border-left-color:#d66550}.mq-result-callout.unavailable{border-left-color:#8798a2}.mq-result-callout span{color:#79909e;font-size:8px}.mq-result-callout strong{display:block;margin:5px 0 8px;color:#214c63;font-size:16px}.mq-history-bars{height:150px;display:flex;align-items:flex-end;gap:9px;padding-top:8px}.mq-history-bars span{height:100%;flex:1;display:grid;grid-template-rows:1fr auto auto;justify-items:center;align-items:end;gap:3px}.mq-history-bars i{width:70%;min-height:8px;border-radius:5px 5px 2px 2px;background:linear-gradient(#3ba7cc,#1680af)}.mq-history-bars b{font-size:8px}.mq-history-bars small{color:#8498a4;font-size:8px}.mq-fact-list{display:grid;gap:7px}.mq-fact-list button{display:grid;grid-template-columns:80px 1fr;gap:3px 8px;padding:10px;border:1px solid #dce8ee;border-radius:8px;background:#fbfdfe;text-align:left;cursor:pointer}.mq-fact-list button.selected{border-color:#70bbd8;background:#eff9fd}.mq-fact-list span{grid-row:1/3;color:#1884ae;font-size:8px}.mq-fact-list b{font-size:10px}.mq-fact-list small{color:#8398a5;font-size:8px}.mq-empty{color:#8095a1!important}.mq-fact-detail{border-color:#a8d1e2;background:#f7fcfe}.mq-fact-detail>header{display:flex;justify-content:space-between;margin-bottom:12px}.mq-fact-detail>header span{color:#1884ae;font-size:8px}.mq-fact-detail>header h3{margin:4px 0 0}.mq-fact-detail>header em{color:#4d778d;font-size:9px;font-style:normal}.mq-fact-detail>p{margin-top:12px;padding-top:10px;border-top:1px dashed #cfe2eb;color:#71909f}.mq-drawer>footer{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-top:1px solid #dfeaf0;background:#fff}.mq-drawer>footer span{color:#8196a2;font-size:8px}.mq-drawer>footer div{display:flex;gap:7px}.mq-drawer>footer button{height:32px;padding:0 13px;border:1px solid #cbdde6;border-radius:6px;background:#fff;color:#527082;font-size:9px;cursor:pointer}.mq-drawer>footer button.primary{border-color:#1683b0;background:#1683b0;color:#fff}
.mq-score-dock{position:sticky;top:0;z-index:30;display:grid;grid-template-columns:minmax(190px,1.3fr) minmax(135px,.9fr) repeat(4,minmax(145px,1fr));gap:9px;align-self:start;overflow-x:auto;padding:10px;border:1px solid #d7e6ee;border-radius:13px;background:rgba(244,248,251,.96);box-shadow:0 8px 20px rgba(22,66,91,.08);backdrop-filter:blur(10px);scrollbar-width:thin;scrollbar-color:#b8d5e2 transparent}.mq-score-dock>article,.mq-score-dock>.mq-dimension-card{min-height:96px;padding:12px 13px;border:1px solid #dce9f1;border-radius:10px;background:#fff;text-align:left;scroll-snap-align:start}.mq-score-dock span{display:flex;align-items:center;justify-content:space-between;gap:6px;color:#718897;font-size:10px}.mq-score-dock strong{display:block;margin:9px 0 7px;color:#173f58;font-size:20px;line-height:1.2}.mq-score-dock strong small{font-size:10px;font-weight:500}.mq-score-dock article>small{display:block;color:#8296a3;font-size:8px;line-height:1.4}.mq-score-dock .mq-total-score{color:#fff;border-color:#117ead;background:linear-gradient(145deg,#117ead,#0e6f9b)!important}.mq-score-dock .mq-total-score.incomplete{border-color:#536f7f;background:linear-gradient(145deg,#536f7f,#3c5b6c)!important}.mq-score-dock .mq-total-score span,.mq-score-dock .mq-total-score strong,.mq-score-dock .mq-total-score>small{color:#fff}.mq-score-dock .mq-total-score strong{font-size:25px}.mq-period-card strong{font-size:13px;white-space:nowrap}.mq-score-dock .mq-dimension-card{display:block;cursor:pointer;transition:border-color .16s ease,background .16s ease,box-shadow .16s ease}.mq-score-dock .mq-dimension-card:hover{border-color:#8dc6dd;background:#f8fcfe}.mq-score-dock .mq-dimension-card.selected{border-color:#54afd2;background:#edf9fd;box-shadow:inset 0 0 0 1px rgba(54,163,204,.15)}.mq-score-dock .mq-dimension-card span em{font-size:8px;font-style:normal}.mq-score-dock .mq-dimension-card i{display:block;height:4px;overflow:hidden;border-radius:3px;background:#e8f0f4}.mq-score-dock .mq-dimension-card i b{display:block;height:100%;border-radius:inherit;background:#1992bf}
@media(max-width:1180px){.mq-score-board{grid-template-columns:repeat(3,1fr)}.mq-total-score{grid-column:span 2}.mq-context-bar{grid-template-columns:repeat(2,1fr)}}
@media(max-width:760px){.mq-score-dock{grid-template-columns:minmax(175px,1.25fr) minmax(125px,.9fr) repeat(4,minmax(135px,1fr));padding:8px;scroll-snap-type:x proximity}.mq-detail-score{grid-template-columns:repeat(2,1fr)}.mq-drawer>nav{grid-template-columns:repeat(2,1fr)}}
</style>
