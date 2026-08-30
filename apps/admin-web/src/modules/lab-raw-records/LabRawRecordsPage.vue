<script setup lang="ts">
import { computed, ref } from 'vue'
import { calculateLabResults, evaluateLabQc } from './formula-engine'
import { labCategories, labTemplates, templateByCode } from './templates'
import type { LabAuditEvent, LabCategory, LabRawRecord, LabRecordStatus, LabTemplate, LabTemplateCode } from './types'

const storageKey='waterx-lab-raw-records-v04'
const legacyStorageKey='waterx-lab-original-records'
const view=ref<'library'|'list'|'form'>('library')
const category=ref<'全部'|LabCategory>('全部')
const activeCode=ref<LabTemplateCode>('Y01')
const selectedId=ref('')
const keyword=ref('')
const statusFilter=ref('')
const form=ref<LabRawRecord|null>(null)
const showAudit=ref(false)
const showCorrection=ref(false)
const correctionReason=ref('')
const showReview=ref(false)
const reviewName=ref('化验主管01')

const now=()=>new Date().toLocaleString('zh-CN',{hour12:false})
const today=()=>new Date().toISOString().slice(0,10)
const clone=<T,>(value:T):T=>JSON.parse(JSON.stringify(value))
const audit=(operator:string,action:string,detail:string):LabAuditEvent=>({id:`audit-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,at:now(),operator,action,detail})

function createRecord(template:LabTemplate,date=today()):LabRawRecord{
  const observations=Object.fromEntries(template.fields.map(field=>[field.key,field.defaultValue||'']))
  return{
    id:`lab-v02-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,templateCode:template.code,
    recordNo:`CQSWHY-${template.code}-${date.replaceAll('-','')}-01`,version:1,sampleSource:'第一污水处理厂（示例）',sampleName:template.category==='药剂检测'?'到货药剂样':template.category==='污泥检测'?'生化池/脱水机样':'出水口',sampleDate:date,testDate:date,
    roomTemperature:'23',humidity:'48',instrumentNo:'LAB-INST-01',reagentBatch:'R-202608',observations,notes:'',analyst:'化验员01',reviewer:'',status:'草稿',locked:false,qcStatus:'待完成',createdAt:now(),updatedAt:now(),audit:[audit('化验员01','创建记录',`按 ${template.ledgerNo} 创建原始记录`)]
  }
}

type LegacyRow=Record<string,string>
type LegacyRecord={id?:string;type?:string;recordNo?:string;roomTemperature?:string;humidity?:string;sampleDate?:string;testDate?:string;analyst?:string;reviewer?:string;notes?:string;locked?:boolean;updatedAt?:string;samples?:LegacyRow[];blankStart?:string;blankEnd?:string;curveSlope?:string;curveIntercept?:string;a0?:string}
function migrateLegacy(record:LegacyRecord):LabRawRecord|null{
  const codeMap:Record<string,LabTemplateCode>={COD:'Y03',NH3:'Y06',SS:'Y04',FC:'Y09'}
  const code=codeMap[record.type||''];if(!code)return null
  const template=templateByCode[code];const migrated=createRecord(template,record.testDate||today());const row=record.samples?.[0]||{}
  migrated.id=`v02-${record.id||migrated.id}`;migrated.recordNo=record.recordNo||migrated.recordNo;migrated.roomTemperature=record.roomTemperature||'23';migrated.humidity=record.humidity||'48';migrated.sampleDate=record.sampleDate||migrated.sampleDate;migrated.testDate=record.testDate||migrated.testDate;migrated.analyst=(record.analyst||'化验员01').replace('运行工','化验员');migrated.reviewer=record.reviewer||'';migrated.notes=record.notes||'';migrated.locked=Boolean(record.locked);migrated.status=record.locked?'已锁定':'草稿';migrated.updatedAt=record.updatedAt||now();migrated.sampleSource=row.source||migrated.sampleSource;migrated.sampleName=row.name||migrated.sampleName
  if(code==='Y03')Object.assign(migrated.observations,{sampleVolume:row.volume||'10',dilution:row.dilution||'1',blankVolume:String(Number(record.blankEnd||0)-Number(record.blankStart||0)),sampleTitration:String(Number(row.end||0)-Number(row.start||0))})
  if(code==='Y06')Object.assign(migrated.observations,{sampleVolume:row.volume||'2',dilution:row.dilution||'1',sampleAbsorbance:row.absorbance||'0.203',blankAbsorbance:record.a0||'0.020',curveSlope:record.curveSlope||'0.006530',curveIntercept:record.curveIntercept||'0.003170'})
  if(code==='Y04')Object.assign(migrated.observations,{sampleVolume:row.volume||'100',tare1:row.tareFirst||'',tare2:row.tareSecond||'',loaded1:row.loadedFirst||'',loaded2:row.loadedSecond||''})
  if(code==='Y09')Object.assign(migrated.observations,{sampleVolume:row.volume||'20',dilution:row.dilution||'1',colonyCount:row.colonyCount||'1'})
  migrated.audit.push(audit('系统','迁移记录','从既有四类原始记录台账迁入统一受控模型'))
  return migrated
}

function loadRecords():LabRawRecord[]{
  try{const stored=JSON.parse(localStorage.getItem(storageKey)||'null') as LabRawRecord[]|null;if(stored?.length)return stored}catch{}
  let legacy:LabRawRecord[]=[]
  try{legacy=(JSON.parse(localStorage.getItem(legacyStorageKey)||'[]') as LegacyRecord[]).map(migrateLegacy).filter((item):item is LabRawRecord=>Boolean(item))}catch{}
  const migratedCodes=new Set(legacy.map(item=>item.templateCode))
  const seeds=labTemplates.filter(template=>!migratedCodes.has(template.code)).map((template,index)=>{
    const record=createRecord(template,`2026-08-${String(16+(index%10)).padStart(2,'0')}`)
    const result=calculateLabResults(record,template);record.qcStatus=evaluateLabQc(record,template,result).status
    record.audit.push(audit('系统','载入示范值','固定示范数据可在新建时恢复'))
    return record
  })
  const all=[...legacy,...seeds];localStorage.setItem(storageKey,JSON.stringify(all));return all
}

const records=ref<LabRawRecord[]>(loadRecords())
const libraryTemplates=computed(()=>category.value==='全部'?labTemplates:labTemplates.filter(item=>item.category===category.value))
const activeTemplate=computed(()=>templateByCode[activeCode.value])
const activeRecords=computed(()=>records.value.filter(item=>item.templateCode===activeCode.value).filter(item=>{
  const key=keyword.value.trim().toLowerCase();if(key&&![item.recordNo,item.sampleSource,item.sampleName,item.analyst,item.reviewer].some(value=>value.toLowerCase().includes(key)))return false
  return !statusFilter.value||item.status===statusFilter.value
}).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)))
const selectedRecord=computed(()=>records.value.find(item=>item.id===selectedId.value)||activeRecords.value[0]||null)
const formTemplate=computed(()=>form.value?templateByCode[form.value.templateCode]:activeTemplate.value)
const formResults=computed(()=>form.value?calculateLabResults(form.value,formTemplate.value):[])
const formQc=computed(()=>form.value?evaluateLabQc(form.value,formTemplate.value,formResults.value):{status:'待完成' as const,checks:[]})
const fieldGroups=computed(()=>['样品与环境','一手观测值','标准与试剂'].map(name=>({name,fields:formTemplate.value.fields.filter(field=>field.group===name)})).filter(group=>group.fields.length))
const statusCounts=computed(()=>({locked:records.value.filter(item=>item.locked).length,review:records.value.filter(item=>item.status==='待复核').length,warning:records.value.filter(item=>item.qcStatus==='警告'||item.qcStatus==='阻断').length}))
const currentAuditRecord=computed(()=>form.value||selectedRecord.value)

function persist(){localStorage.setItem(storageKey,JSON.stringify(records.value))}
function openTemplate(code:LabTemplateCode){activeCode.value=code;selectedId.value='';keyword.value='';statusFilter.value='';view.value='list'}
function newRecord(){form.value=createRecord(activeTemplate.value);view.value='form'}
function editRecord(record=selectedRecord.value){if(!record)return;if(record.locked){window.alert('已锁定记录不可直接修改，请通过“发起更正”创建新版本。');return}form.value=clone(record);view.value='form'}
function saveRecord(message='保存草稿'){
  if(!form.value)return
  form.value.updatedAt=now();form.value.qcStatus=formQc.value.status
  if(form.value.status!=='更正中'&&form.value.status!=='待复核')form.value.status='草稿'
  form.value.audit.push(audit(form.value.analyst||'当前用户',message,`质控状态：${form.value.qcStatus}；公式版本：${formTemplate.value.formulaVersion}`))
  const index=records.value.findIndex(item=>item.id===form.value?.id);if(index>=0)records.value.splice(index,1,clone(form.value));else records.value.push(clone(form.value))
  selectedId.value=form.value.id;persist();view.value='list'
}
function submitReview(){if(!form.value)return;if(formQc.value.status==='阻断'||formQc.value.status==='待完成'){window.alert('存在缺失或无效计算，不能提交复核。');return}form.value.status='待复核';form.value.qcStatus=formQc.value.status;form.value.updatedAt=now();form.value.audit.push(audit(form.value.analyst||'当前用户','提交复核',`质控状态：${formQc.value.status}`));upsertForm();view.value='list'}
function upsertForm(){if(!form.value)return;const index=records.value.findIndex(item=>item.id===form.value?.id);if(index>=0)records.value.splice(index,1,clone(form.value));else records.value.push(clone(form.value));selectedId.value=form.value.id;persist()}
function reviewSelected(){const record=selectedRecord.value;if(!record||record.status!=='待复核')return;reviewName.value=record.reviewer||'化验主管01';showReview.value=true}
function confirmReview(){const record=selectedRecord.value;const reviewer=reviewName.value.trim();if(!record||!reviewer)return;if(reviewer===record.analyst){window.alert('复核人与检测人不能为同一人。');return}record.reviewer=reviewer;record.status='已复核';record.updatedAt=now();record.audit.push(audit(reviewer,'完成复核','确认原始观测值、受控计算结果和质控检查'));persist();showReview.value=false}
function lockSelected(){const record=selectedRecord.value;if(!record||record.status!=='已复核')return;const template=templateByCode[record.templateCode];if(template.methodState==='待确认'){window.alert('该模板的方法适用性仍待确认，当前不能作为正式记录锁定。');return}record.locked=true;record.status='已锁定';record.lockedAt=now();record.updatedAt=record.lockedAt;record.audit.push(audit(record.reviewer||'复核人','锁定记录',`锁定版本 V${record.version}，后续只能通过更正流程修改`));persist()}
function deleteSelected(){const record=selectedRecord.value;if(!record)return;if(record.locked||!['草稿','更正中'].includes(record.status)){window.alert('仅草稿或更正中的未锁定记录可以删除。');return}if(!window.confirm(`确定删除 ${record.recordNo} 吗？`))return;records.value=records.value.filter(item=>item.id!==record.id);selectedId.value='';persist()}
function resetDemo(){if(!window.confirm(`确定重置 ${activeTemplate.value.shortName} 的固定示范记录吗？`))return;records.value=records.value.filter(item=>item.templateCode!==activeCode.value);const record=createRecord(activeTemplate.value,'2026-08-30');record.qcStatus=evaluateLabQc(record,activeTemplate.value,calculateLabResults(record,activeTemplate.value)).status;records.value.push(record);selectedId.value=record.id;persist()}
function beginCorrection(){const source=selectedRecord.value;if(!source||!source.locked)return;correctionReason.value='';showCorrection.value=true}
function createCorrection(){const source=selectedRecord.value;const reason=correctionReason.value.trim();if(!source||!reason){window.alert('请填写更正原因。');return}const corrected=clone(source);corrected.id=`${source.id}-r${source.version+1}-${Date.now()}`;corrected.parentRecordId=source.id;corrected.version=source.version+1;corrected.recordNo=`${source.recordNo.replace(/-R\d+$/,'')}-R${corrected.version}`;corrected.correctionReason=reason;corrected.locked=false;corrected.lockedAt='';corrected.status='更正中';corrected.reviewer='';corrected.updatedAt=now();corrected.audit.push(audit(corrected.analyst||'当前用户','发起更正',`由锁定版本 V${source.version} 派生；原因：${reason}`));records.value.push(corrected);selectedId.value=corrected.id;form.value=clone(corrected);persist();showCorrection.value=false;view.value='form'}
function openFormRecord(record:LabRawRecord){selectedId.value=record.id;if(record.locked){form.value=clone(record);view.value='form';return}editRecord(record)}
function printRecord(){if(!form.value)return;window.print()}
function statusClass(status:LabRecordStatus){return status==='已锁定'?'locked':status==='待复核'?'pending':status==='已复核'?'reviewed':status==='更正中'?'correcting':'draft'}
</script>

<template>
  <section class="lab-raw-module">
    <header class="lab-raw-header">
      <div><span>化验管理 · 原始记录管理</span><h2>原始记录台账</h2><p>人工填写一手观测值，受控公式自动生成结果；保留方法、质控、复核、锁定与更正轨迹。</p></div>
      <div class="lab-raw-summary"><span><b>18</b>类记录</span><span><b>14</b>类本轮新增</span><span><b>{{statusCounts.locked}}</b>条已锁定</span><span><b>{{statusCounts.review}}</b>条待复核</span></div>
    </header>

    <template v-if="view==='library'">
      <nav class="lab-template-tabs"><button :class="{selected:category==='全部'}" @click="category='全部'">全部 18</button><button v-for="item in labCategories" :key="item" :class="{selected:category===item}" @click="category=item">{{item}} {{labTemplates.filter(t=>t.category===item).length}}</button></nav>
      <section class="lab-template-grid">
        <button v-for="template in libraryTemplates" :key="template.code" class="lab-template-card" @click="openTemplate(template.code)">
          <div><code>{{template.code}}</code><span :class="['method-state',template.methodState==='现行方法'?'active':template.methodState==='项目方法'?'project':'pending']">{{template.methodState}}</span></div>
          <h3>{{template.shortName}}</h3><p>{{template.title}}</p><small>{{template.method}}</small>
          <footer><span>{{template.ledgerNo}}</span><em>{{records.filter(record=>record.templateCode===template.code).length}} 条</em></footer>
        </button>
      </section>
    </template>

    <template v-else-if="view==='list'">
      <section class="lab-raw-toolbar"><div><button @click="view='library'">← 返回项目</button><button class="primary" @click="newRecord">＋ 新建记录</button><button @click="editRecord()">编辑</button><button :disabled="selectedRecord?.status!=='待复核'" @click="reviewSelected">复核通过</button><button :disabled="selectedRecord?.status!=='已复核'" @click="lockSelected">锁定归档</button><button :disabled="!selectedRecord?.locked" @click="beginCorrection">发起更正</button><button class="danger" @click="deleteSelected">删除</button></div><div><b>{{activeTemplate.code}} · {{activeTemplate.shortName}}</b><span :class="['method-state',activeTemplate.methodState==='现行方法'?'active':activeTemplate.methodState==='项目方法'?'project':'pending']">{{activeTemplate.methodState}}</span></div></section>
      <section v-if="activeTemplate.scopeNote" class="lab-method-warning"><b>适用性说明</b><span>{{activeTemplate.scopeNote}}</span></section>
      <section class="lab-record-filter"><label>关键词<input v-model="keyword" placeholder="编号、样品、检测人或复核人" /></label><label>记录状态<select v-model="statusFilter"><option value="">全部状态</option><option>草稿</option><option>待复核</option><option>已复核</option><option>已锁定</option><option>更正中</option></select></label><button @click="keyword='';statusFilter=''">清空</button><button @click="resetDemo">重置示范数据</button></section>
      <section class="lab-record-table-wrap"><table class="lab-record-table"><thead><tr><th>记录编号</th><th>版本</th><th>样品</th><th>检测日期</th><th>方法/公式版本</th><th>质控</th><th>状态</th><th>检测人</th><th>复核人</th><th>更新时间</th><th>操作</th></tr></thead><tbody><tr v-for="record in activeRecords" :key="record.id" :class="{selected:selectedRecord?.id===record.id}" @click="selectedId=record.id" @dblclick="openFormRecord(record)"><td><code>{{record.recordNo}}</code></td><td>V{{record.version}}</td><td><b>{{record.sampleName}}</b><small>{{record.sampleSource}}</small></td><td>{{record.testDate}}</td><td><small>{{activeTemplate.methodVersion}}</small><small>{{activeTemplate.formulaVersion}}</small></td><td><span :class="['qc-chip',record.qcStatus]">{{record.qcStatus}}</span></td><td><span :class="['record-status',statusClass(record.status)]">{{record.status}}</span></td><td>{{record.analyst}}</td><td>{{record.reviewer||'—'}}</td><td>{{record.updatedAt}}</td><td><button @click.stop="openFormRecord(record)">{{record.locked?'查看':'打开'}}</button><button @click.stop="selectedId=record.id;showAudit=true">留痕</button></td></tr><tr v-if="!activeRecords.length"><td colspan="11" class="empty">暂无符合条件的原始记录</td></tr></tbody></table></section>
      <section v-if="selectedRecord" class="lab-record-preview"><div><b>{{selectedRecord.recordNo}}</b><span>{{selectedRecord.sampleSource}} · {{selectedRecord.sampleName}}</span></div><div><span>质控：<b>{{selectedRecord.qcStatus}}</b></span><span>状态：<b>{{selectedRecord.status}}</b></span><span>审计事件：<b>{{selectedRecord.audit.length}}</b></span><button @click="showAudit=true">查看完整留痕</button></div></section>
    </template>

    <template v-else-if="form">
      <section class="lab-raw-toolbar lab-form-actions"><div><button @click="view='list'">← 返回台账</button><button v-if="!form.locked" class="primary" @click="saveRecord()">保存草稿</button><button v-if="!form.locked" :disabled="formQc.status==='阻断'||formQc.status==='待完成'" @click="submitReview">提交复核</button><button @click="printRecord">打印 / 预览</button><button @click="showAudit=true">查看留痕</button></div><div><span :class="['record-status',statusClass(form.status)]">{{form.status}}</span><span :class="['qc-chip',formQc.status]">质控 {{formQc.status}}</span><span>V{{form.version}}</span></div></section>
      <section v-if="form.locked" class="lab-lock-notice">🔒 本版本已锁定，只读展示。需要修改时请返回台账发起更正。</section>
      <section class="lab-raw-paper-wrap">
        <article class="lab-paper lab-raw-paper">
          <header><div><small>WaterX 化验管理受控原始记录</small><h1>{{formTemplate.title}}</h1><p>{{formTemplate.ledgerNo}}</p></div><div><span>{{formTemplate.methodState}}</span><b>V{{form.version}}</b></div></header>
          <table class="lab-paper-meta-table"><tbody><tr><th>记录编号</th><td><input v-model="form.recordNo" :disabled="form.locked" /></td><th>样品来源</th><td><input v-model="form.sampleSource" :disabled="form.locked" /></td><th>样品名称</th><td><input v-model="form.sampleName" :disabled="form.locked" /></td></tr><tr><th>取样日期</th><td><input v-model="form.sampleDate" type="date" :disabled="form.locked" /></td><th>检测日期</th><td><input v-model="form.testDate" type="date" :disabled="form.locked" /></td><th>室温 / 湿度</th><td><input v-model="form.roomTemperature" :disabled="form.locked" /> ℃ / <input v-model="form.humidity" :disabled="form.locked" /> %</td></tr><tr><th>仪器编号</th><td><input v-model="form.instrumentNo" :disabled="form.locked" /></td><th>试剂批号</th><td><input v-model="form.reagentBatch" :disabled="form.locked" /></td><th>状态</th><td>{{form.status}}</td></tr></tbody></table>
          <section class="lab-method-control"><div><b>方法版本</b><span>{{formTemplate.methodVersion}}</span></div><div><b>公式版本</b><span>{{formTemplate.formulaVersion}}</span></div><div><b>计算规则</b><span>{{formTemplate.formulaText}}</span></div></section>
          <section v-if="formTemplate.scopeNote" class="lab-paper-scope"><b>适用性声明：</b>{{formTemplate.scopeNote}}</section>
          <table v-for="group in fieldGroups" :key="group.name" class="lab-observation-table"><thead><tr><th colspan="5">{{group.name}}</th></tr><tr><th>观测项目</th><th>符号</th><th>单位</th><th>人工填写的一手观测值</th><th>填写说明</th></tr></thead><tbody><tr v-for="field in group.fields" :key="field.key"><td>{{field.label}}</td><td>{{field.symbol}}</td><td>{{field.unit}}</td><td class="manual-cell"><select v-if="field.inputType==='select'" v-model="form.observations[field.key]" :disabled="form.locked"><option v-for="option in field.options" :key="option.value" :value="option.value">{{option.label}}</option></select><input v-else v-model="form.observations[field.key]" :type="field.inputType==='text'?'text':'number'" :step="field.step" :disabled="form.locked" /></td><td>{{field.hint||'现场读数/称量/滴定或仪器示值'}}</td></tr></tbody></table>
          <table class="lab-result-table"><thead><tr><th colspan="4">受控计算结果（自动生成，不可人工改写）</th></tr><tr><th>结果项目</th><th>计算值</th><th>单位</th><th>公式版本</th></tr></thead><tbody><tr v-for="result in formResults" :key="result.key"><td>{{result.label}}</td><td class="calculated result">{{result.display}}</td><td>{{result.unit}}</td><td>{{formTemplate.formulaVersion}}</td></tr></tbody></table>
          <section class="lab-qc-block"><h3>质量控制检查</h3><div v-for="check in formQc.checks" :key="check.id"><span :class="['qc-chip',check.status]">{{check.status}}</span><b>{{check.label}}</b><p>{{check.message}}</p></div></section>
          <table class="lab-paper-sign"><tbody><tr><th>备注</th><td colspan="5"><textarea v-model="form.notes" :disabled="form.locked" rows="2"></textarea></td></tr><tr><th>检测人</th><td><input v-model="form.analyst" :disabled="form.locked" /></td><th>复核人</th><td><input v-model="form.reviewer" disabled /></td><th>锁定时间</th><td>{{form.lockedAt||'—'}}</td></tr><tr v-if="form.correctionReason"><th>更正原因</th><td colspan="5">{{form.correctionReason}}</td></tr></tbody></table>
          <footer>说明：黄色区域为人工录入的一手观测值，蓝灰区域为受控公式自动结果；打印件统一转为黑白并保留方法、公式、签字和版本信息。</footer>
        </article>
      </section>
    </template>

    <div v-if="showAudit&&currentAuditRecord" class="lab-modal" @click.self="showAudit=false"><section><header><div><b>原始记录审计留痕</b><span>{{currentAuditRecord.recordNo}} · V{{currentAuditRecord.version}}</span></div><button @click="showAudit=false">×</button></header><ol><li v-for="event in [...currentAuditRecord.audit].reverse()" :key="event.id"><time>{{event.at}}</time><div><b>{{event.action}}</b><span>{{event.operator}}</span><p>{{event.detail}}</p></div></li></ol></section></div>
    <div v-if="showCorrection" class="lab-modal" @click.self="showCorrection=false"><form class="lab-correction" @submit.prevent="createCorrection"><header><div><b>发起更正</b><span>锁定原版本不变，系统创建下一版本继续编辑。</span></div><button type="button" @click="showCorrection=false">×</button></header><label>更正原因<textarea v-model="correctionReason" rows="5" required placeholder="说明错误位置、原因和更正依据"></textarea></label><footer><button type="button" @click="showCorrection=false">取消</button><button class="primary">创建更正版本</button></footer></form></div>
    <div v-if="showReview&&selectedRecord" class="lab-modal" @click.self="showReview=false"><form class="lab-correction" @submit.prevent="confirmReview"><header><div><b>复核原始记录</b><span>{{selectedRecord.recordNo}} · 检测人 {{selectedRecord.analyst}}</span></div><button type="button" @click="showReview=false">×</button></header><label>复核人<input v-model="reviewName" required placeholder="复核人必须与检测人不同" /></label><section class="lab-review-confirm"><b>复核确认</b><p>已核对一手观测值、方法与公式版本、自动计算结果、质控状态和异常说明。</p></section><footer><button type="button" @click="showReview=false">取消</button><button class="primary">确认复核通过</button></footer></form></div>
  </section>
</template>

<style src="./lab-raw-records.css"></style>
