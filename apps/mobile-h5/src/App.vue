<script setup lang="ts">
import SafetyFieldWork from './SafetyFieldWork.vue'
import { computed, ref } from 'vue'
import { ApiClient, type ControlMeasure, type Hazard, type InspectionTask, type InspectionTaskItem, type RiskAcknowledgement, type SafetyCommitment, type WorkflowHazard, type WorkflowTask, type Site, type TrainingAssignment, type VisitorBriefing, type WorkPermit, type WorkPermitMeasure } from '@safety/api-client'

const api = new ApiClient()
const signedInPermissions=ref<string[]>([])
const token = ref(sessionStorage.getItem('h5AccessToken') || '')
const refreshToken = ref(sessionStorage.getItem('h5RefreshToken') || '')
api.onTokenRefresh(pair=>{token.value=pair.accessToken;refreshToken.value=pair.refreshToken;sessionStorage.setItem('h5AccessToken',pair.accessToken);sessionStorage.setItem('h5RefreshToken',pair.refreshToken)})
const username = ref('platform_admin')
const password = ref('')
const sites = ref<Site[]>([])
const siteId = ref(sessionStorage.getItem('h5SiteId') || '')
const hazards = ref<Hazard[]>([])
const measures = ref<Record<string, ControlMeasure[]>>({})
const acknowledgements = ref<RiskAcknowledgement[]>([])
const safetyHazards = ref<WorkflowHazard[]>([])
const inspectionTasks = ref<WorkflowTask[]>([])
const workPermits=ref<WorkPermit[]>([])
const trainingAssignments=ref<TrainingAssignment[]>([])
const commitments=ref<SafetyCommitment[]>([])
const visitorToken=new URLSearchParams(window.location.search).get('visitor')||''
const publicBriefing=ref<VisitorBriefing|null>(null);const visitorRegistered=ref(false)
const visitorForm=ref({visitorName:'',mobile:'',companyName:'',visitPurpose:'',hostName:'',acknowledged:false})
const currentPermit=ref<WorkPermit|null>(null)
const permitMeasures=ref<WorkPermitMeasure[]>([])
const gasForm=ref({oxygen:undefined as number|undefined,carbonMonoxide:undefined as number|undefined,hydrogenSulfide:undefined as number|undefined,combustibleGas:undefined as number|undefined,testPoint:'作业入口',testedBy:''})
const briefingForm=ref({content:'已说明作业风险、安全措施、应急撤离和禁止事项',participantNames:''})
const page = ref<'home' | 'risk' | 'inspection' | 'report' | 'rectification'|'permit'|'training'>('home')
const riskLoaded=ref(false)
const actionableHazards=computed(()=>safetyHazards.value.filter(h=>h.canReceive||h.canRectify||h.canReview||h.canAssign&&h.status==='PENDING_ACCEPTANCE'))
const loading = ref(false)
const error = ref('')
const activeHazards = computed(() => hazards.value.filter(item => item.status === 'ACTIVE'))
const highRisks = computed(() => activeHazards.value.filter(item => item.riskLevel && item.riskLevel <= 2).length)
const currentSite = computed(() => sites.value.find(site => site.id === siteId.value))
const acknowledgedIds = computed(() => new Set(acknowledgements.value.map(item => item.hazardId)))
const colorName: Record<string, string> = { RED: '一级红色', ORANGE: '二级橙色', YELLOW: '三级黄色', BLUE: '四级蓝色' }
const measureName: Record<string, string> = { ENGINEERING: '工程技术', MANAGEMENT: '管理', TRAINING: '培训教育', PPE: '个体防护', EMERGENCY: '应急处置' }

async function login() {
  loading.value = true; error.value = ''
  try {
    const pair = await api.login(username.value, password.value)
    token.value = pair.accessToken
    refreshToken.value = pair.refreshToken
    sessionStorage.setItem('h5AccessToken', pair.accessToken)
    sessionStorage.setItem('h5RefreshToken', pair.refreshToken)
    await loadSites()
  } catch (e) { error.value = e instanceof Error ? e.message : '登录失败' }
  finally { loading.value = false }
}

async function loadSites() {
  api.setSession(token.value, siteId.value, refreshToken.value)
  sites.value = await api.sites()
  signedInPermissions.value=(await api.currentUser()).permissions
  if (!siteId.value && sites.value.length) siteId.value = sites.value[0].id
  await changeSite()
}

async function changeSite() {
  if (!siteId.value) return
  sessionStorage.setItem('h5SiteId', siteId.value)
  api.setSite(siteId.value)
  loading.value = true; error.value='';riskLoaded.value=false
  try {
    if(!signedInPermissions.value.includes('role:manage')&&signedInPermissions.value.includes('inspection:read')){
      [safetyHazards.value,inspectionTasks.value]=await Promise.all([api.workflowHazards(),api.workflowTasks()]);return
    }
    hazards.value = await api.hazards()
    riskLoaded.value=true
    const active = hazards.value.filter(item => item.status === 'ACTIVE')
    const [loaded, ack] = await Promise.all([
      Promise.all(active.map(async item => [item.id, await api.riskMeasures(item.id)] as const)),
      api.riskAcknowledgements()
    ])
    measures.value = Object.fromEntries(loaded)
    acknowledgements.value = ack
    ;[safetyHazards.value,inspectionTasks.value,workPermits.value,trainingAssignments.value,commitments.value] = await Promise.all([api.workflowHazards(),api.workflowTasks(),api.workPermits(),api.trainingAssignments(),api.safetyCommitments()])
  }
  catch (e) { error.value = e instanceof Error ? e.message : '风险数据加载失败' }
  finally { loading.value = false }
}

async function logout() { try{if(token.value)await api.logoutSession()}catch{/* 本地会话仍需清理 */}sessionStorage.clear();token.value='';refreshToken.value='';sites.value=[];hazards.value=[] }

async function acknowledge(item: Hazard) {
  loading.value = true; error.value = ''
  try { await api.acknowledgeRisk(item.id); acknowledgements.value = await api.riskAcknowledgements() }
  catch (e) { error.value = e instanceof Error ? e.message : '确认失败' }
  finally { loading.value = false }
}

function openInspection(_task:InspectionTask){page.value='inspection'}
function openFirstInspection(){page.value='inspection'}
async function openPermit(item?:WorkPermit){const permit=item||workPermits.value.find(p=>['APPROVED','IN_PROGRESS'].includes(p.status));if(!permit)return;currentPermit.value=permit;permitMeasures.value=await api.workPermitMeasures(permit.id);briefingForm.value.participantNames='';gasForm.value.testedBy=permit.guardian;page.value='permit'}
async function savePermitMeasures(){if(!currentPermit.value)return;try{await api.confirmWorkPermitMeasures(currentPermit.value.id,permitMeasures.value.map(m=>({measureId:m.measureId,involved:m.involved,confirmed:m.confirmed})));workPermits.value=await api.workPermits();currentPermit.value=workPermits.value.find(p=>p.id===currentPermit.value?.id)||null;window.alert('安全措施已保存')}catch(e){error.value=e instanceof Error?e.message:'措施保存失败'}}
async function addGasTest(){if(!currentPermit.value)return;try{await api.addWorkPermitGasTest(currentPermit.value.id,{...gasForm.value,testedAt:new Date().toISOString()});workPermits.value=await api.workPermits();currentPermit.value=workPermits.value.find(p=>p.id===currentPermit.value?.id)||null;window.alert('检测记录已保存')}catch(e){error.value=e instanceof Error?e.message:'检测记录保存失败'}}
async function confirmBriefing(){if(!currentPermit.value||!briefingForm.value.participantNames)return;try{await api.confirmWorkPermitBriefing(currentPermit.value.id,briefingForm.value.content,briefingForm.value.participantNames);workPermits.value=await api.workPermits();currentPermit.value=workPermits.value.find(p=>p.id===currentPermit.value?.id)||null;window.alert('安全交底已确认')}catch(e){error.value=e instanceof Error?e.message:'交底确认失败'}}
async function startPermit(){if(!currentPermit.value)return;try{await api.startWorkPermit(currentPermit.value.id);workPermits.value=await api.workPermits();currentPermit.value=workPermits.value.find(p=>p.id===currentPermit.value?.id)||null;window.alert('作业已开工')}catch(e){error.value=e instanceof Error?e.message:'暂不能开工'}}
async function finishTraining(item:TrainingAssignment){const raw=window.prompt('完成学习后请输入考试成绩（0—100）','90');if(raw===null)return;const score=Number(raw);if(!Number.isFinite(score)||score<0||score>100){error.value='请输入 0—100 的有效成绩';return}try{await api.completeTraining(item.id,score);trainingAssignments.value=await api.trainingAssignments();window.alert(score>=80?'培训与考试记录已归档':'成绩已保存，请重新学习后参加考核')}catch(e){error.value=e instanceof Error?e.message:'培训记录提交失败'}}
async function signCommitment(item:SafetyCommitment){const signature=window.prompt('请输入本人姓名完成电子签名',item.employeeName.replace('（示例）',''));if(!signature)return;try{await api.signSafetyCommitment(item.id,signature);commitments.value=await api.safetyCommitments();window.alert('安全承诺书已签订并归入个人档案')}catch(e){error.value=e instanceof Error?e.message:'承诺书签订失败'}}
async function registerVisitor(){if(!visitorToken)return;loading.value=true;error.value='';try{await api.registerVisitor(visitorToken,visitorForm.value);visitorRegistered.value=true}catch(e){error.value=e instanceof Error?e.message:'访客登记失败'}finally{loading.value=false}}



if(visitorToken) api.publicVisitorBriefing(visitorToken).then(v=>publicBriefing.value=v).catch(e=>error.value=e instanceof Error?e.message:'安全告知加载失败')
else if (token.value) loadSites().catch(logout)
</script>

<template>
  <main v-if="visitorToken" class="mobile-login visitor-briefing">
    <div class="login-symbol">访</div><p>{{publicBriefing?.siteName||'访客安全告知'}}</p><h1>{{publicBriefing?.title||'正在加载…'}}</h1>
    <section v-if="publicBriefing&&!visitorRegistered" class="visitor-content"><article><h2>进入生产区域前请认真阅读</h2><p>{{publicBriefing.briefingContent}}</p><h3>重点风险区域</h3><img v-if="publicBriefing.riskMapUrl" :src="publicBriefing.riskMapUrl" style="width:100%;border-radius:12px" alt="厂区风险分布图"/><p>{{publicBriefing.riskMapDescription}}</p><h3>应急疏散路线</h3><img v-if="publicBriefing.evacuationMapUrl" :src="publicBriefing.evacuationMapUrl" style="width:100%;border-radius:12px" alt="应急疏散路线图"/><p>{{publicBriefing.evacuationDescription}}</p><h3>应急联系方式</h3><p>{{publicBriefing.emergencyContact}}</p></article><form @submit.prevent="registerVisitor"><label>访客姓名<input v-model="visitorForm.visitorName" required /></label><label>手机号码<input v-model="visitorForm.mobile" /></label><label>来访单位<input v-model="visitorForm.companyName" /></label><label>来访事由<input v-model="visitorForm.visitPurpose" required /></label><label>接待人员<input v-model="visitorForm.hostName" required /></label><label class="visitor-ack"><input v-model="visitorForm.acknowledged" type="checkbox" required />我已阅读并理解上述安全风险、禁止事项和应急疏散要求</label><p v-if="error" class="mobile-error">{{error}}</p><button :disabled="loading">{{loading?'正在登记…':'确认告知并登记'}}</button></form></section>
    <section v-else-if="visitorRegistered" class="empty"><div>✓</div><b>安全交底登记完成</b><p>请向接待人员出示此页面，并在陪同下进入生产区域。</p></section>
  </main>
  <main v-else-if="!token" class="mobile-login">
    <div class="login-symbol">安</div><p>市政污水处理</p><h1>现场安全工作台</h1>
    <form @submit.prevent="login"><label>账号<input v-model="username" autocomplete="username" /></label><label>密码<input v-model="password" type="password" autocomplete="current-password" /></label><p v-if="error" class="mobile-error">{{error}}</p><button :disabled="loading">{{loading ? '正在登录…' : '登录'}}</button></form>
  </main>
  <main v-else :class="{'safety-current':['home','inspection','report','rectification'].includes(page)}">
    <header><div><select v-model="siteId" @change="changeSite"><option v-for="site in sites" :key="site.id" :value="site.id">{{site.name}}</option></select><h1>{{page==='home' ? '现场安全工作台' : page==='risk' ? '岗位风险告知' : page==='inspection' ? '执行安全检查' : page==='report' ? '现场隐患上报' : page==='permit'?'危险作业执行':page==='training'?'我的安全培训':'整改反馈'}}</h1></div><button @click="logout">退出</button></header>
    <template v-if="page==='home'">
      <section class="alert" @click="page='risk'"><div><b>今日安全提示</b><p v-if="riskLoaded">当前厂区有 {{highRisks}} 项一级或二级风险，请按管控要求作业。</p><p v-else>当前账号尚未读取岗位风险资料，请查看现场风险告知并联系安全管理人员确认。</p></div><strong>›</strong></section>
      <h2>现场工作</h2>
      <section class="actions"><button @click="page='risk'"><span>险</span><b>风险告知</b><small>查看岗位风险与措施</small></button><button @click="openFirstInspection"><span>查</span><b>现场检查</b><small>按检查单逐项执行</small></button><button @click="page='report'"><span>报</span><b>隐患上报</b><small>现场快速登记上报</small></button><button @click="page='rectification'"><span>整</span><b>整改反馈</b><small>提交整改完成情况</small></button><button @click="openPermit()"><span>作</span><b>危险作业</b><small>措施、检测与交底确认</small></button><button @click="page='training'"><span>学</span><b>安全培训</b><small>课程学习与在线考核</small></button></section>
      <div class="section-title"><h2>我的待办</h2><span>全部 ›</span></div>
      <section v-if="actionableHazards.length||inspectionTasks.some(t=>t.canExecute)||workPermits.some(p=>['APPROVED','IN_PROGRESS'].includes(p.status))" class="todo-list"><button v-for="hazard in actionableHazards" :key="hazard.id" @click="page='rectification'"><span>{{hazard.canReceive?'待接收':hazard.canRectify?'待整改':hazard.canReview?'待复查':'待受理'}}</span><b>{{hazard.location}} · {{hazard.description}}</b><small>{{hazard.hazardNo}} · {{hazard.dueDate||'期限待确认'}}</small></button><button v-for="permit in workPermits.filter(p=>['APPROVED','IN_PROGRESS'].includes(p.status))" :key="permit.id" @click="openPermit(permit)"><span>{{permit.status==='APPROVED'?'待开工':'作业中'}}</span><b>{{permit.permitTypeName}} · {{permit.location}}</b><small>{{permit.permitNo}} · 监护人 {{permit.guardian}}</small></button><button v-for="task in inspectionTasks.filter(t=>t.canExecute)" :key="task.id" @click="openInspection(task)"><span>待检查</span><b>{{task.title}}</b><small>{{task.templateName}} · {{task.assigneeName}}</small></button></section><section v-else class="empty"><div>✓</div><b>暂时没有待办</b><p>风险审核与现场任务将在这里集中提醒。</p></section>
    </template>
    <template v-else-if="page==='risk'">
      <section class="risk-intro"><b>{{currentSite?.name}}</b><p v-if="riskLoaded">共 {{activeHazards.length}} 项已生效风险。进入现场前请阅读并落实相应管控措施。</p><p v-else>当前未读取风险资料，不能据此判断风险数量。请联系安全管理人员确认岗位风险告知。</p></section>
      <section class="mobile-risks"><article v-for="item in activeHazards" :key="item.id"><div class="mobile-risk-head"><span class="mobile-risk-badge" :class="item.riskColor?.toLowerCase()">{{item.riskColor ? colorName[item.riskColor] : '待评估'}}</span><code>{{item.code}}</code></div><h3>{{item.objectName}}</h3><p>{{item.hazardFactor}}</p><dl><div><dt>所在区域</dt><dd>{{item.areaName || '未指定'}}</dd></div><div><dt>可能事故</dt><dd>{{item.accidentType}}</dd></div><div><dt>管控层级</dt><dd>{{item.controlLevel}}</dd></div><div><dt>管控措施</dt><dd>{{item.measureCount}} 项</dd></div></dl><div class="measure-list"><b>现场管控要求</b><p v-for="measure in measures[item.id]" :key="measure.id"><span>{{measureName[measure.measureType]}}</span>{{measure.content}}</p></div><button class="ack-button" :class="{done:acknowledgedIds.has(item.id)}" :disabled="acknowledgedIds.has(item.id) || loading" @click="acknowledge(item)">{{acknowledgedIds.has(item.id) ? '✓ 已阅读并确认' : '我已阅读并确认'}}</button></article></section>
    </template>
    <SafetyFieldWork v-else-if="page==='inspection'||page==='report'||page==='rectification'" :key="siteId+page" :api="api" :site-id="siteId" :page="page" @updated="changeSite" />
    <section v-else-if="page==='permit'&&currentPermit" class="inspection-sheet permit-sheet"><div class="inspection-title"><b>{{currentPermit.permitTypeName}} · {{currentPermit.location}}</b><small>{{currentPermit.permitNo}} · {{currentPermit.status==='APPROVED'?'已批准待开工':'作业进行中'}}</small><p>{{currentPermit.workContent}}</p></div><article><h3>1. 安全措施确认</h3><label v-for="item in permitMeasures" :key="item.measureId" class="permit-measure"><input v-model="item.confirmed" type="checkbox" :disabled="!item.involved"/><span>{{item.content}}</span><button @click.prevent="item.involved=!item.involved">{{item.involved?'涉及':'不涉及'}}</button></label><button class="permit-action" @click="savePermitMeasures">保存措施确认</button></article><article v-if="['CONFINED_SPACE','HOT_WORK'].includes(currentPermit.permitType)"><h3>2. 气体检测记录</h3><div class="gas-grid"><label>O₂ (%)<input v-model.number="gasForm.oxygen" type="number" step="0.1"/></label><label>CO (ppm)<input v-model.number="gasForm.carbonMonoxide" type="number"/></label><label>H₂S (ppm)<input v-model.number="gasForm.hydrogenSulfide" type="number"/></label><label>可燃气体 (%)<input v-model.number="gasForm.combustibleGas" type="number" step="0.1"/></label></div><label>检测点<input v-model="gasForm.testPoint"/></label><label>检测人<input v-model="gasForm.testedBy"/></label><button class="permit-action" @click="addGasTest">保存检测记录</button></article><article><h3>3. 作业前安全交底</h3><label>交底内容<textarea v-model="briefingForm.content" rows="3"></textarea></label><label>参与人员签名确认<input v-model="briefingForm.participantNames" placeholder="输入确认人员姓名"/></label><button class="permit-action" @click="confirmBriefing">确认安全交底</button></article><button v-if="currentPermit.status==='APPROVED'" class="complete-check" @click="startPermit">确认条件齐备，开始作业</button></section>
    <section v-else-if="page==='training'" class="rectification-list"><article v-for="item in commitments" :key="item.id"><div><span>{{item.status==='SIGNED'?'已签订':'待签订'}}</span><code>{{item.version}}</code></div><h3>{{item.name}}</h3><p>{{item.content}}</p><small>承诺人：{{item.employeeName}} · 时限 {{new Date(item.dueAt).toLocaleString('zh-CN')}}</small><button v-if="item.status==='PENDING'" @click="signCommitment(item)">阅读并签订安全承诺书</button><button v-else disabled>✓ {{item.signatureText}} 已签订并归档</button></article><article v-for="item in trainingAssignments" :key="item.id"><div><span>{{item.status==='COMPLETED'?'已完成':item.status==='FAILED'?'需重考':'待学习'}}</span><code>{{item.studyProgress}}%</code></div><h3>{{item.courseName}}</h3><p>培训人员：{{item.employeeName}}</p><small>完成时限：{{new Date(item.dueAt).toLocaleString('zh-CN')}}</small><small v-if="item.examScore!==undefined">考试成绩：{{item.examScore}} 分</small><button v-if="item.status!=='COMPLETED'" @click="finishTraining(item)">完成学习并参加考核</button><button v-else disabled>✓ 已归入个人安全档案</button></article><section v-if="!trainingAssignments.length&&!commitments.length" class="empty"><div>✓</div><b>暂无培训或承诺任务</b><p>管理员指派的任务将在这里显示。</p></section></section>
    <p v-if="error" class="mobile-error float-error">{{error}}</p>
    <nav><button :class="{active:page==='home'}" @click="page='home'">首页</button><button :class="{active:page==='risk'}" @click="page='risk'">风险</button><button class="scan" :class="{active:page==='inspection'}" @click="openFirstInspection">查</button><button :class="{active:page==='report'}" @click="page='report'">上报</button><button :class="{active:page==='rectification'}" @click="page='rectification'">整改</button></nav>
  </main>
</template>
