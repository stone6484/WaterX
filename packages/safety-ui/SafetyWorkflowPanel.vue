<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import type { ApiClient, SafetyContext, SafetyDirectory, WorkflowTask, WorkflowItem, WorkflowHazard, HazardDetail, SafetyAttachment, HazardAssignment } from '@safety/api-client'
import SignaturePad from './SignaturePad.vue'
import { hazardStatuses,levels,eventNames,time,exportTask,exportHazard,inspectionAnswer,resultNames } from './archive'
const props=defineProps<{api:ApiClient;context:SafetyContext;mode:'report'|'task'|'hazard';task?:WorkflowTask;hazardId?:string;hazards:WorkflowHazard[];directory?:SafetyDirectory;draftKey:string}>()
const emit=defineEmits<{ saved:[id?:string];close:[] }>()
const busy=ref(false),error=ref(''),message=ref(''),dirty=ref(false),askClose=ref(false),cancelOnly=ref(false)
const report=ref({requestKey:crypto.randomUUID(),location:'',description:'',temporaryMeasure:'',discoveredAt:new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16)})
const createdId=ref(''),files=ref<File[]>([]),items=ref<WorkflowItem[]>([]),detail=ref<HazardDetail|null>(null),attachments=ref<SafetyAttachment[]>([])
const location=ref(props.task?.inspectionLocation||''),participants=ref(props.task?.participants||''),signature=ref(''),note=ref(''),accepted=ref(true),action=ref('')
const assignment=ref<HazardAssignment>({revision:0,categoryMajor:'',hazardLevel:'',rectificationMeasure:'',temporaryMeasure:'',dueDate:'',responsibleOrgId:'',responsibleEmployeeId:'',legalMajorStatus:'UNDETERMINED',note:''})
const h=computed(()=>detail.value?.hazard)
const editable=computed(()=>props.mode==='report'||props.mode==='task'&&props.task?.canExecute||props.mode==='hazard'&&!!action.value)
const staff=computed(()=>props.directory?.employees.filter(e=>e.orgId===assignment.value.responsibleOrgId)||[])
function changed(){dirty.value=true}
function saveDraft(){try{sessionStorage.setItem(props.draftKey,JSON.stringify({report:report.value,createdId:createdId.value,items:items.value,location:location.value,participants:participants.value,note:note.value,assignment:assignment.value,action:action.value,accepted:accepted.value,revision:h.value?.revision}));message.value='草稿已保存在当前会话；附件和手写签字需重新选择';return true}catch{error.value='草稿保存失败，请保留当前页面';return false}}
function close(){if(busy.value)return;cancelOnly.value=false;if(dirty.value){askClose.value=true;return}emit('close')}
function cancelAction(){if(dirty.value){cancelOnly.value=true;askClose.value=true;return}action.value='';files.value=[]}
function leaveDraft(keep:boolean){if(keep&&!saveDraft())return;if(!keep)sessionStorage.removeItem(props.draftKey);dirty.value=false;askClose.value=false;if(cancelOnly.value){action.value='';files.value=[];note.value='';signature.value=''}else emit('close')}
function unload(e:BeforeUnloadEvent){if(dirty.value){saveDraft();e.preventDefault();e.returnValue=''}}
onBeforeUnmount(()=>{if(dirty.value)saveDraft();window.removeEventListener('beforeunload',unload)})
async function load(){if(props.mode==='task'&&props.task)items.value=await props.api.workflowTaskItems(props.task.id);if(props.mode==='hazard'&&props.hazardId){[detail.value,attachments.value]=await Promise.all([props.api.hazardDetail(props.hazardId),props.api.hazardAttachments(props.hazardId)]);const current=detail.value.hazard;assignment.value={revision:current.revision,categoryMajor:current.categoryMajor||'',hazardLevel:current.hazardLevel||'',rectificationMeasure:current.rectificationMeasure||'',temporaryMeasure:current.temporaryMeasure||'',dueDate:current.dueDate||'',estimatedCost:current.estimatedCost??undefined,responsibleOrgId:current.responsibleOrgId||'',responsibleEmployeeId:current.responsibleEmployeeId||'',legalMajorStatus:current.legalMajorStatus,legalMajorBasis:current.legalMajorBasis,riskHazardId:current.riskHazardId,note:''}}}
onMounted(async()=>{window.addEventListener('beforeunload',unload);busy.value=true;try{await load();const raw=sessionStorage.getItem(props.draftKey);if(raw){const d=JSON.parse(raw);let restored=false;if(props.mode==='report'){report.value=d.report;createdId.value=d.createdId||'';restored=true}if(props.mode==='task'&&props.task?.canExecute&&Array.isArray(d.items)&&d.items.length===items.value.length&&d.items.every((a:WorkflowItem)=>items.value.some(b=>b.id===a.id))){items.value=d.items;location.value=d.location;participants.value=d.participants;restored=true}if(props.mode==='hazard'&&h.value){const allowed:Record<string,boolean|undefined>={assign:h.value.canAssign,receive:h.value.canReceive,rectify:h.value.canRectify,review:h.value.canReview,remind:props.context.canManage&&!!h.value.responsibleEmployeeId&&h.value.status!=='CLOSED',discovery:h.value.status!=='CLOSED'&&(props.context.canManage||h.value.reportedBy===props.context.userId)};if(d.revision===h.value.revision&&allowed[d.action]){assignment.value=d.assignment;note.value=d.note||'';action.value=d.action;accepted.value=d.accepted!==false;restored=true}else message.value='记录版本或可操作状态已变化，旧草稿未覆盖当前记录，请按当前状态处理'}if(restored){dirty.value=true;message.value='已恢复当前会话草稿；附件及签字请重新确认'}}}catch(e){error.value=e instanceof Error?e.message:'记录加载失败'}finally{busy.value=false}})
function conditional(item:WorkflowItem){return !!item.conditionItemId&&items.value.find(i=>i.id===item.conditionItemId)?.answer==='NO'}
function problem(item:WorkflowItem){return !conditional(item)&&item.result!=='NOT_APPLICABLE'&&(item.questionType==='OBSERVATION'?item.answer==='YES':item.result==='NON_COMPLIANT'||['TEXT','NUMBER'].includes(item.questionType)&&!!item.problemDescription)}
function selectFiles(e:Event){files.value=Array.from((e.target as HTMLInputElement).files||[]);changed()}
async function upload(id:string,stage:'DISCOVERY'|'RECTIFICATION'|'REVIEW'){while(files.value.length){await props.api.uploadHazardAttachment(id,stage,files.value[0]);files.value=files.value.slice(1)}}
async function save(){
  if(busy.value)return;busy.value=true;error.value='';message.value=''
  try{
    if(props.mode==='report'){
      if(!createdId.value){createdId.value=(await props.api.reportSafetyHazard({...report.value,discoveredAt:new Date(report.value.discoveredAt).toISOString()})).id;saveDraft()}
      await upload(createdId.value,'DISCOVERY');sessionStorage.removeItem(props.draftKey);dirty.value=false;emit('saved',createdId.value);return
    }
    if(props.mode==='task'&&props.task){
      await props.api.completeWorkflowTask(props.task.id,{location:location.value,participants:participants.value,signatureData:signature.value,items:items.value.map(i=>({itemId:i.id,result:i.result,answer:i.answer,notApplicableReason:i.notApplicableReason,problemDescription:i.problemDescription,handlingMeasure:i.handlingMeasure,linkedHazardId:i.linkedHazardId||undefined}))});sessionStorage.removeItem(props.draftKey);dirty.value=false;emit('saved');return
    }
    if(!h.value)return
    const id=h.value.id,input={revision:h.value.revision,note:note.value,accepted:accepted.value,signatureData:signature.value}
    if(action.value==='assign')await props.api.assignHazard(id,{...assignment.value,revision:h.value.revision,riskHazardId:assignment.value.riskHazardId||undefined,estimatedCost:assignment.value.estimatedCost==null||String(assignment.value.estimatedCost)===''?undefined:Number(assignment.value.estimatedCost)})
    if(action.value==='receive')await props.api.receiveHazard(id,input)
    if(action.value==='rectify'){await upload(id,'RECTIFICATION');await props.api.rectifyHazard(id,input)}
    if(action.value==='review'){await upload(id,'REVIEW');await props.api.reviewWorkflowHazard(id,input)}
    if(action.value==='remind')await props.api.remindSafetyHazard(id,note.value)
    if(action.value==='discovery')await upload(id,'DISCOVERY')
    dirty.value=false;sessionStorage.removeItem(props.draftKey);await load();action.value='';signature.value='';note.value='';message.value='已保存，处理历史和待办同步更新';emit('saved',id)
  }catch(e){error.value=(createdId.value&&props.mode==='report'?'问题已保存，剩余附件尚未成功。可重试上传，不会重复上报。':'')+(e instanceof Error?e.message:'保存失败');if(props.mode==='hazard'&&props.hazardId)attachments.value=await props.api.hazardAttachments(props.hazardId).catch(()=>attachments.value)}finally{busy.value=false}
}
function begin(value:string){action.value=value;signature.value='';note.value='';accepted.value=true;dirty.value=false}
async function getFile(file:SafetyAttachment){try{await props.api.downloadHazardAttachment(props.hazardId!,file)}catch(e){error.value=(e as Error).message}}
</script>
<template>
<section class="sw-panel" @input="changed" @change="changed">
  <header><h2>{{mode==='report'?'现场问题上报':mode==='task'?task?.title:h?.hazardNo||'隐患详情'}}</h2><button type="button" :disabled="busy" @click="close">关闭</button></header>
  <p v-if="editable" class="sw-muted">切换页面时暂存文字草稿；附件和签字请在提交前重新确认。</p>
  <p v-if="error" class="sw-error" role="alert">{{error}}</p><p v-if="message" class="sw-message" role="status">{{message}}</p>
  <div v-if="askClose" class="sw-close"><p>还有未保存内容。附件和签字不会随草稿保存。</p><button type="button" @click="leaveDraft(true)">保存草稿并退出编辑</button><button type="button" @click="askClose=false">继续编辑</button><button type="button" @click="leaveDraft(false)">放弃本次编辑</button></div>
  <form v-if="mode==='report'" @submit.prevent="save">
    <p class="sw-muted">记录现场事实，由安全员确认分类、等级、责任和整改要求。</p>
    <label>位置<input v-model="report.location" required maxlength="200" :disabled="!!createdId" placeholder="例如：加药间东侧洗眼器"/></label>
    <label>发现时间<input v-model="report.discoveredAt" type="datetime-local" required :disabled="!!createdId"/></label>
    <label>现场现象<textarea v-model="report.description" required rows="3" maxlength="20000" :disabled="!!createdId"/></label>
    <label>已采取的临时措施（选填）<textarea v-model="report.temporaryMeasure" rows="2" :disabled="!!createdId"/></label>
    <label>现场照片或资料<input type="file" multiple accept="image/jpeg,image/png,image/webp,.pdf,.doc,.docx,.xls,.xlsx" @change="selectFiles"/><small>单个文件不超过10MB，尚待上传 {{files.length}} 个</small></label>
    <footer><button type="button" @click="saveDraft">暂存草稿</button><button class="sw-primary" :disabled="busy">{{busy?'正在保存…':createdId?'重试剩余附件':'提交待受理'}}</button></footer>
  </form>
  <form v-else-if="mode==='task'&&task" @submit.prevent="save">
    <p class="sw-muted">{{task.taskNo}} · {{task.templateName}} V{{task.templateVersion}} · {{task.assigneeName||'未指派'}}<br/>{{task.snapshotOrigin==='LEGACY_CAPTURE'?'此历史模板为升级时捕获，不能视为原始签署版本。':'记录按创建任务时的模板保存。'}}</p>
    <div class="sw-grid"><label>实际检查部位<input v-model="location" required :disabled="!task.canExecute"/></label><label>组织人及参加人员<input v-model="participants" required :disabled="!task.canExecute" placeholder="记录实际参加人员；本人签署不能代签其他人"/></label></div>
    <article v-for="(item,index) in items" :key="item.id" class="sw-check">
      <h3>{{index+1}}. {{item.category}}</h3><p>{{item.content}}</p><small class="sw-muted">{{item.sourceRef}}</small>
      <template v-if="task.canExecute">
        <p v-if="conditional(item)" class="sw-muted">前置条件确认不涉及，本项按不适用保存。</p>
        <template v-else>
          <label v-if="['CONDITION','OBSERVATION'].includes(item.questionType)">{{item.questionType==='CONDITION'?'场景是否涉及':'是否发现该问题'}}<select v-model="item.answer" required><option value="">请选择</option><option value="YES">是</option><option value="NO">否</option></select></label>
          <template v-else-if="['TEXT','NUMBER'].includes(item.questionType)"><label>检查记录<textarea v-if="item.questionType==='TEXT'" v-model="item.answer" required/><input v-else v-model="item.answer" type="number" step="any" required/></label><label>发现的问题（未发现留空）<textarea v-model="item.problemDescription"/></label></template>
          <label v-else>检查结论<select v-model="item.result" required><option value="">请选择</option><option value="COMPLIANT">符合</option><option value="NON_COMPLIANT">不符合</option><option value="NOT_APPLICABLE">不适用</option></select></label>
          <label v-if="item.result==='NOT_APPLICABLE'">不适用理由<input v-model="item.notApplicableReason" required/></label>
        </template>
        <template v-if="problem(item)"><label>存在问题<textarea v-model="item.problemDescription" required/></label><label>现场临时处置（选填）<textarea v-model="item.handlingMeasure"/></label><label>同一未关闭问题（选填）<select v-model="item.linkedHazardId"><option value="">形成新的待受理问题</option><option v-for="x in hazards.filter(h=>h.status!=='CLOSED')" :key="x.id" :value="x.id">{{x.hazardNo}} · {{x.location}} · {{x.name}}</option></select></label></template>
      </template>
      <template v-else><p>记录：{{item.answer?inspectionAnswer(item):resultNames[item.result||'']||'历史记录缺失'}}</p><p v-if="item.notApplicableReason">不适用依据：{{item.notApplicableReason}}</p><p v-if="item.problemDescription">问题：{{item.problemDescription}}</p><p v-if="item.handlingMeasure">临时处置：{{item.handlingMeasure}}</p></template>
    </article>
    <SignaturePad v-if="task.canExecute" v-model="signature" @update:model-value="changed"/>
    <footer v-if="task.canExecute"><button type="button" @click="saveDraft">暂存草稿</button><button class="sw-primary" :disabled="busy">{{busy?'正在提交…':'本人确认并完成检查'}}</button></footer>
    <footer v-else><button type="button" @click="exportTask(task,items)">导出可打印检查记录</button></footer>
  </form>
  <template v-else-if="h">
    <div class="sw-facts"><p><b>{{h.location}}</b> · {{h.description}}</p><p>{{hazardStatuses[h.status]}} <strong v-if="h.overdueDays" class="sw-warning"> · 逾期{{h.overdueDays}}天</strong> · 第{{h.revision}}版</p><p>分类：{{h.categoryMajor||'待专业确认'}} · 内部等级：{{levels[h.hazardLevel]||'待确认'}}</p><p>责任：{{h.responsibleOrg||'待明确'}} / {{h.responsiblePerson||'待派发'}} · 期限：{{h.dueDate||'待确认'}} · 预计费用：{{h.estimatedCost==null?'待确认':h.estimatedCost+'元'}}</p><p>整改要求：{{h.rectificationMeasure||'待专业确认'}}</p><p>临时措施：{{h.temporaryMeasure||'未记录'}}</p><p>法定重大认定：{{({YES:'认定为重大',NO:'认定为非重大',UNDETERMINED:'待核定'})[h.legalMajorStatus]}} · {{h.legalMajorBasis||'尚未记录依据'}}</p><p v-if="h.riskName">关联风险：{{h.riskName}}</p><p v-if="h.legacyCategoryMajor">原台账分类：{{h.legacyCategoryMajor}}</p></div>
    <div v-if="!action" class="sw-actions"><button v-if="h.canAssign" @click="begin('assign')">受理／重新派发</button><button v-if="h.canReceive" @click="begin('receive')">接收或退回责任</button><button v-if="h.canRectify" @click="begin('rectify')">提交整改</button><button v-if="h.canReview" @click="begin('review')">复查验收</button><button v-if="context.canManage&&h.responsibleEmployeeId&&h.status!=='CLOSED'" @click="begin('remind')">站内催办</button><button v-if="h.status!=='CLOSED'&&(context.canManage||h.reportedBy===context.userId)" @click="begin('discovery')">补现场资料</button><button @click="exportHazard(detail!,attachments)">导出整改记录</button></div>
    <form v-if="action" @submit.prevent="save">
      <template v-if="action==='assign'">
        <div class="sw-grid"><label>专家分类<select v-model="assignment.categoryMajor" required><option value="">请选择</option><option>人的不安全行为</option><option>物的不安全状态</option><option>管理缺陷</option><option>环境因素</option></select></label><label>内部等级<select v-model="assignment.hazardLevel" required><option value="">请选择</option><option v-for="(label,key) in levels" :key="key" :value="key">{{label}}</option></select></label></div>
        <label>整改要求<textarea v-model="assignment.rectificationMeasure" required/></label><label>临时措施或无需措施的理由<textarea v-model="assignment.temporaryMeasure" required/></label>
        <div class="sw-grid"><label>责任部门／班组<select v-model="assignment.responsibleOrgId" required @change="assignment.responsibleEmployeeId='' "><option value="">请选择</option><option v-for="org in directory?.units" :key="org.id" :value="org.id">{{org.name}}</option></select></label><label>责任人<select v-model="assignment.responsibleEmployeeId" required><option value="">请选择</option><option v-for="person in staff" :key="person.id" :value="person.id">{{person.displayName}}</option></select></label><label>完成期限<input v-model="assignment.dueDate" required type="date"/></label><label>预计费用（元，未知留空）<input v-model.number="assignment.estimatedCost" type="number" min="0" step="0.01"/></label></div>
        <label>法定重大隐患认定<select v-model="assignment.legalMajorStatus"><option value="UNDETERMINED">待核定</option><option value="YES">按适用依据认定为重大</option><option value="NO">按适用依据认定为非重大</option></select></label><label v-if="assignment.legalMajorStatus!=='UNDETERMINED'">判定依据及结论说明<textarea v-model="assignment.legalMajorBasis" required/></label>
        <label>关联风险（选填）<select v-model="assignment.riskHazardId"><option value="">暂不关联</option><option v-for="r in directory?.risks" :key="r.id" :value="r.id">{{r.name}}</option></select></label><label>受理／重新派发意见<textarea v-model="assignment.note" required/></label>
      </template>
      <template v-else>
        <label v-if="action==='receive'||action==='review'">处理结论<select v-model="accepted"><option :value="true">{{action==='receive'?'接收责任':'复查通过'}}</option><option :value="false">{{action==='receive'?'退回安全员受理':'退回继续整改'}}</option></select></label>
        <label v-if="action!=='discovery'">{{action==='rectify'?'整改完成情况':action==='remind'?'催办要求':'处理意见'}}<textarea v-model="note" required rows="3"/></label>
        <label v-if="['rectify','review','discovery'].includes(action)">{{action==='rectify'?'本轮整改照片／凭证（必需）':'现场资料（选填）'}}<input type="file" multiple accept="image/jpeg,image/png,image/webp,.pdf,.doc,.docx,.xls,.xlsx" @change="selectFiles"/><small>尚待上传{{files.length}}个。上传失败可重试；已成功附件保留。</small></label>
        <SignaturePad v-if="action==='rectify'||action==='review'" v-model="signature" @update:model-value="changed"/>
      </template>
      <footer><button type="button" :disabled="busy" @click="cancelAction">取消操作</button><button class="sw-primary" :disabled="busy">{{busy?'正在保存…':'确认保存'}}</button></footer>
    </form>
    <h3>附件与发现来源</h3><ul><li v-for="file in attachments" :key="file.id"><button type="button" @click="getFile(file)">{{file.originalName}}</button> · {{({DISCOVERY:'发现',RECTIFICATION:'整改',REVIEW:'复查'})[file.stage]}} · {{file.uploadedByName}} · {{time(file.uploadedAt)}}</li></ul><p v-if="!attachments.length" class="sw-muted">暂无附件</p><p v-for="origin in detail?.origins" :key="origin.taskId+origin.itemId">{{origin.taskNo}}：{{origin.description}}</p>
    <h3>处理历史</h3><article v-for="e in detail?.events" :key="e.id" class="sw-event"><b>{{eventNames[e.action]||e.action}}</b><small>{{time(e.occurredAt)}} · {{e.actorName}} · V{{e.revision}}</small><p>{{e.note}}</p><details><summary>当时的责任与结论</summary><p>责任人标识：{{e.snapshot.responsible_employee_id||'未记录'}}；期限：{{e.snapshot.due_date||'待确认'}}</p><p>整改要求：{{e.snapshot.rectification_measure||'待确认'}}</p><p>整改反馈：{{e.snapshot.completion_note||'未记录'}}；复查意见：{{e.snapshot.review_comment||'未记录'}}</p><small>附件索引：{{e.evidenceIds.join('、')||'无'}}</small></details></article>
  </template>
</section>
</template>
<style scoped>
.sw-panel{font:13px/1.65 -apple-system,BlinkMacSystemFont,'PingFang SC',sans-serif;color:var(--wx-n700);background:var(--wx-n0);min-width:0;padding:20px;overflow-wrap:anywhere}
.sw-panel *{box-sizing:border-box}
.wx-dialog>.sw-panel{width:min(680px,94vw);height:100dvh;max-height:100dvh;overflow-y:auto;scrollbar-width:thin;box-sizing:border-box}
.sw-panel header,.sw-panel footer,.sw-actions{display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap}
.sw-panel header{position:sticky;top:-20px;z-index:2;background:var(--wx-n0);color:var(--wx-n800);padding:12px 0;margin:0;border-radius:0;border-bottom:var(--wx-border-subtle);height:auto}
.sw-panel h2{font-size:18px;margin:0}.sw-panel h3{font-size:14px;margin:14px 0 8px}
.sw-panel form{display:grid;gap:14px;margin-top:16px}.sw-panel label{display:grid;gap:5px;font-size:13px;color:var(--wx-n700)}
.sw-panel input,.sw-panel select,.sw-panel textarea{max-width:100%;width:100%;font:inherit;min-height:36px;padding:7px 10px;background:var(--wx-n0);border:var(--wx-border-default);border-radius:var(--wx-radius-xs);color:inherit}
.sw-panel textarea{resize:vertical;min-height:72px}
.sw-panel button{font:inherit;cursor:pointer;border:var(--wx-border-default);border-radius:var(--wx-radius-xs);padding:6px 12px;color:var(--wx-blue-700);background:var(--wx-n0);width:auto;min-height:36px}
.sw-panel button:hover{background:var(--wx-n25)}.sw-panel .sw-primary{background:var(--wx-blue-700);border-color:var(--wx-blue-700);color:var(--wx-n0)}
.sw-panel button:disabled{background:var(--wx-n50);color:var(--wx-n400);border-color:var(--wx-n200);cursor:default}
.sw-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:14px}
.sw-check{border-bottom:var(--wx-border-subtle);padding:10px 0 18px;display:grid;gap:8px;margin:0;max-width:none}
.sw-check p{margin:0}.sw-muted,.sw-panel small{color:var(--wx-n500);overflow-wrap:anywhere}
.sw-error{color:var(--wx-danger-strong);background:var(--wx-danger-bg);padding:12px}
.sw-message{color:var(--wx-blue-700);background:var(--wx-info-bg);padding:10px}
.sw-warning{color:var(--wx-warning-strong)}.sw-facts{padding:12px 0;margin:8px 0;border-bottom:var(--wx-border-subtle)}
.sw-facts p{margin:6px 0}.sw-actions{justify-content:flex-start}
.sw-event{padding:12px 0;border-bottom:var(--wx-border-subtle);margin:0;max-width:none}.sw-event small{display:block}
.sw-close{padding:12px;background:var(--wx-warning-bg);border:1px solid var(--wx-warning-border)}.sw-panel ul{padding-left:20px}.sw-panel li{margin-bottom:6px}
.sw-panel input:disabled,.sw-panel select:disabled,.sw-panel textarea:disabled{background:var(--wx-n50);color:var(--wx-n600)}
.sw-panel :focus-visible{outline:2px solid var(--wx-blue-500);outline-offset:2px}
.sw-panel footer{position:sticky;bottom:-20px;background:var(--wx-n0);border-top:var(--wx-border-subtle);padding:12px 0;z-index:1}
@media(max-width:600px){.sw-panel{padding:14px}.sw-grid{grid-template-columns:minmax(0,1fr)}.sw-panel footer{bottom:0;position:static}.sw-panel footer button{flex:1;min-height:44px}.sw-panel header{top:0}.sw-panel li{overflow-wrap:anywhere}.sw-panel input,.sw-panel select,.sw-panel textarea{font-size:16px;min-height:44px}}
</style>
