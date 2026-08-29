<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import QRCode from 'qrcode'
import { ApiClient, type Area, type AssessmentHistory, type ControlMeasureInput, type Employee, type EmployeeQualification, type EmployeeSafetyArchive, type Hazard, type InspectionPlan, type InspectionStatistics, type InspectionSummary, type InspectionTask, type InspectionTemplate, type InvestmentSummary, type OccupationalExam, type OccupationalFactor, type OccupationalHealthSummary, type OrgUnit, type RiskObject, type RiskSummary, type SafetyAsset, type SafetyAssetSummary, type SafetyAttachment, type SafetyBudget, type SafetyCommitment, type SafetyCommitmentTemplate, type SafetyExpense, type SafetyHazard, type Site, type TrainingAssignment, type TrainingCourse, type TrainingMaterial, type TrainingStatistics, type TrainingSummary, type VisitorBriefing, type VisitorRecord, type WorkPermit, type WorkPermitTemplate } from '@safety/api-client'
import ManagementQualityPage from './modules/management-quality/ManagementQualityPage.vue'
import ImprovementDraftPanel from './modules/management-quality/ImprovementDraftPanel.vue'
import { isQualityPageId } from './modules/management-quality/rules'
import type { ImprovementDraft, QualityPageId } from './modules/management-quality/types'
import ProcessEvaluationPage from './modules/process-evaluation/ProcessEvaluationPage.vue'
import { isProcessEvaluationPageId } from './modules/process-evaluation/rules'
import type { ProcessEvaluationPageId } from './modules/process-evaluation/types'

const api = new ApiClient()
const token = ref(sessionStorage.getItem('accessToken') || '')
const refreshToken = ref(sessionStorage.getItem('refreshToken') || '')
api.onTokenRefresh(pair=>{token.value=pair.accessToken;refreshToken.value=pair.refreshToken;sessionStorage.setItem('accessToken',pair.accessToken);sessionStorage.setItem('refreshToken',pair.refreshToken)})
const sites = ref<Site[]>([])
const selectedSite = ref(sessionStorage.getItem('siteId') || '')
const units = ref<OrgUnit[]>([])
const employees = ref<Employee[]>([])
const hazards = ref<Hazard[]>([])
const riskSummary = ref<RiskSummary>({ total: 0, pending: 0, red: 0, orange: 0, yellow: 0, blue: 0 })
const riskObjects = ref<RiskObject[]>([])
const areas = ref<Area[]>([])
const inspectionSummary = ref<InspectionSummary>({ pendingTasks: 0, completedTasks: 0, openHazards: 0, pendingReview: 0, overdueHazards: 0 })
const inspectionStatistics = ref<InspectionStatistics>({totalHazards:0,closedHazards:0,generalHazards:0,seriousHazards:0,majorHazards:0,inspectionSource:0,employeeSource:0,reminderLevel:0,departmentLevel:0,plantLevel:0})
const inspectionTemplates = ref<InspectionTemplate[]>([])
const inspectionPlans = ref<InspectionPlan[]>([])
const inspectionTasks = ref<InspectionTask[]>([])
const safetyHazards = ref<SafetyHazard[]>([])
const workPermitTemplates=ref<WorkPermitTemplate[]>([])
const workPermits=ref<WorkPermit[]>([])
const trainingSummary=ref<TrainingSummary>({courseCount:0,pendingAssignments:0,completedAssignments:0,expiringQualifications:0})
const trainingCourses=ref<TrainingCourse[]>([])
const trainingAssignments=ref<TrainingAssignment[]>([])
const qualifications=ref<EmployeeQualification[]>([])
const assetSummary=ref<SafetyAssetSummary>({total:0,specialEquipment:0,emergencyAndFire:0,dueSoon:0})
const safetyAssets=ref<SafetyAsset[]>([])
const healthSummary=ref<OccupationalHealthSummary>({activeFactors:0,monitoringDue:0,examRecords:0,examDue:0})
const occupationalFactors=ref<OccupationalFactor[]>([])
const occupationalExams=ref<OccupationalExam[]>([])
const investmentSummary=ref<InvestmentSummary>({year:new Date().getFullYear(),plannedAmount:0,spentAmount:0,remainingAmount:0,executionRate:0})
const safetyBudgets=ref<SafetyBudget[]>([])
const safetyExpenses=ref<SafetyExpense[]>([])
const commitments=ref<SafetyCommitment[]>([]);const trainingMaterials=ref<Record<string,TrainingMaterial[]>>({})
const commitmentTemplates=ref<SafetyCommitmentTemplate[]>([])
const visitorBriefing=ref<VisitorBriefing|null>(null);const visitorRecords=ref<VisitorRecord[]>([]);const visitorQr=ref('');const visitorUrl=ref('')
const safetyArchive=ref<EmployeeSafetyArchive|null>(null);const showSafetyArchive=ref(false)
const showExamForm=ref(false);const examForm=ref({employeeId:'',examType:'PERIODIC',examDate:new Date().toISOString().slice(0,10),medicalInstitution:'',conclusion:'FIT',restrictedItems:'',followUpAction:'',nextExamOn:new Date(Date.now()+365*86400000).toISOString().slice(0,10)})
const showExpenseForm=ref(false);const expenseForm=ref({budgetId:'',expenseDate:new Date().toISOString().slice(0,10),amount:0,purpose:'',vendor:'',invoiceNo:'',recordedBy:'安全管理人员'})
const showTrainingForm=ref(false)
const trainingForm=ref({courseId:'',employeeId:'',dueAt:new Date(Date.now()+7*86400000).toISOString().slice(0,16)})
const statisticsRange=ref({from:`${new Date().getFullYear()}-01-01`,to:new Date().toISOString().slice(0,10)});const trainingStatistics=ref<TrainingStatistics|null>(null)
const showQualificationForm=ref(false);const qualificationForm=ref({employeeId:'',qualificationType:'SPECIAL_OPERATION',certificateName:'',certificateNo:'',issuingAuthority:'',issuedOn:new Date().toISOString().slice(0,10),expiresOn:new Date(Date.now()+365*86400000).toISOString().slice(0,10),reminderDays:30})
const showFactorForm=ref(false);const factorForm=ref({factorName:'',factorType:'CHEMICAL',location:'',exposedPositions:'',exposureLevel:'',limitValue:'',controlMeasures:'',monitoringFrequency:'ANNUAL',lastMonitoredOn:'',nextMonitoringOn:''})
const showBudgetForm=ref(false);const budgetForm=ref({budgetYear:new Date().getFullYear(),category:'安全防护设施',plannedAmount:0,description:''})
const showVisitorForm=ref(false);const visitorForm=ref({title:'',briefingContent:'',riskMapDescription:'',evacuationDescription:'',emergencyContact:''})
const showCourseForm=ref(false);const courseForm=ref({code:'',name:'',courseType:'SPECIAL_OPERATION',materialType:'PPT',durationMinutes:45,passingScore:80})
const showAssetForm=ref(false);const assetForm=ref({assetNo:'',assetName:'',assetType:'SPECIAL_EQUIPMENT',category:'',location:'',responsiblePerson:'',manufacturer:'',modelSpec:'',registrationNo:'',quantity:1,unit:'台',commissionedOn:'',lastInspectedOn:'',nextInspectionOn:'',expiresOn:'',reminderDays:30,notes:''})
const showCommitmentTemplateForm=ref(false);const commitmentTemplateForm=ref({code:'',name:'',positionScope:'全体从业人员',content:'',version:`${new Date().getFullYear()}-V1`})
const showCommitmentAssignForm=ref(false);const commitmentAssignForm=ref({templateId:'',employeeId:'',dueAt:new Date(Date.now()+15*86400000).toISOString().slice(0,16)})
const showPermitForm=ref(false)
const permitForm=ref({templateId:'',workUnit:'本厂运维单位',location:'',workContent:'',workLevel:'LEVEL_2',riskResult:'',startAt:new Date().toISOString().slice(0,16),endAt:new Date(Date.now()+8*3600000).toISOString().slice(0,16),responsiblePerson:'',guardian:'',workers:'',relatedPermits:''})
const hazardAttachments = ref<Record<string, SafetyAttachment[]>>({})
const showTaskForm = ref(false)
const showPlanForm = ref(false)
const planForm = ref({templateId:'',name:'',scheduleType:'WEEKLY' as 'DAILY'|'WEEKLY'|'MONTHLY'|'ONCE',intervalValue:1,nextRunDate:new Date().toISOString().slice(0,10),dueHours:24,assigneeEmployeeId:''})
const taskForm = ref({ templateId:'', title:'', plannedStart:new Date().toISOString().slice(0,10), dueAt:new Date(Date.now()+86400000).toISOString().slice(0,16), assigneeEmployeeId:'' })
const showAreaForm = ref(false)
const areaForm = ref({ parentId: '', code: '', name: '', areaType: 'PROCESS_AREA' })
const showRiskDetail = ref(false)
const selectedHazard = ref<Hazard | null>(null)
const assessmentHistory = ref<AssessmentHistory[]>([])
const ackSummary = ref({ acknowledgedCount: 0, lastAcknowledgedAt: '' })
const reassessForm = ref({ method: 'LS' as 'LS' | 'LEC', likelihood: 1, severity: 1, exposure: 1, consequence: 1, reason: '' })
const showRiskForm = ref(false)
const savingRisk = ref(false)
const riskForm = ref({
  riskObjectId: '', code: '', hazardFactor: '', possibleAccident: '', accidentType: '其他伤害',
  identificationBasis: '现场风险辨识', identifiedOn: new Date().toISOString().slice(0, 10),
  nextReviewOn: '', method: 'LS' as 'LS' | 'LEC', likelihood: 1, severity: 1, exposure: 1, consequence: 1,
  engineering: '', management: '', training: '', ppe: '', emergency: ''
})
const loading = ref(false)
const error = ref('')
const username = ref('platform_admin')
const password = ref('')
const plannedPages = {
  operationsShift: { module:'生产运行', title:'班组与排班', stage:'D', description:'维护运行班组、岗位与值班计划，形成清晰的当班责任边界。', capabilities:['班组档案','岗位配置','轮班日历','临时调班'] },
  operationsHandover: { module:'生产运行', title:'交接班管理', stage:'D', description:'承接班次交接事项、异常说明和关键参数确认，避免信息断点。', capabilities:['交班清单','接班确认','遗留事项','异常交接'] },
  operationsTasks: { module:'生产运行', title:'当班任务', stage:'D', description:'汇集本班巡检、操作、处置和临时任务，跟踪当班执行状态。', capabilities:['任务看板','岗位派发','执行反馈','逾期提醒'] },
  operationsLog: { module:'生产运行', title:'运行日志', stage:'D', description:'按班次沉淀运行过程、关键事件和处置记录，形成连续运行档案。', capabilities:['班次日志','关键事件','异常记录','日志归档'] },
  inventoryOverview: { module:'库存管理', title:'库存总览', stage:'D', description:'汇总备品备件、药剂、耗材和应急物资的库存态势。', capabilities:['库存结构','库存金额','收发趋势','风险提示'] },
  inventoryMaterials: { module:'库存管理', title:'物资台账', stage:'D', description:'统一维护物资分类、规格、单位、仓位与安全库存。', capabilities:['物资分类','规格型号','仓位管理','安全库存'] },
  inventoryInbound: { module:'库存管理', title:'入库管理', stage:'D', description:'记录采购、退料及调拨入库，保留批次和验收信息。', capabilities:['到货登记','验收入库','批次追溯','入库台账'] },
  inventoryOutbound: { module:'库存管理', title:'出库与领用', stage:'D', description:'覆盖领料、出库、退库和使用去向，关联成本与责任人。', capabilities:['领用申请','出库确认','退库登记','去向追踪'] },
  inventoryStocktake: { module:'库存管理', title:'库存盘点', stage:'D', description:'按计划发起盘点，记录账实差异和调整依据。', capabilities:['盘点计划','盘点任务','差异复核','库存调整'] },
  inventoryAlerts: { module:'库存管理', title:'库存预警', stage:'D', description:'关注低库存、超储、临期和呆滞物资，支持提前处置。', capabilities:['低库存预警','超储提示','临期提醒','呆滞分析'] },
  businessTargets: { module:'经营管理', title:'经营目标', stage:'P', description:'承接年度与月度经营目标，明确水厂经营管理方向。', capabilities:['年度目标','月度分解','责任归属','目标跟踪'] },
  businessPlan: { module:'经营管理', title:'生产计划', stage:'P', description:'统筹处理量、药剂、能源、维修和人员等生产经营计划。', capabilities:['水量计划','物耗计划','检修协同','计划调整'] },
  businessBudget: { module:'经营管理', title:'预算管理', stage:'P', description:'建立经营预算与费用控制边界，为执行分析提供基线。', capabilities:['预算编制','预算分解','预算调整','占用控制'] },
  businessExecution: { module:'经营管理', title:'执行分析', stage:'P', description:'对比目标、计划、预算和实际执行，呈现偏差与原因。', capabilities:['计划达成','预算执行','偏差分析','滚动预测'] },
  businessCost: { module:'经营管理', title:'成本收益', stage:'P', description:'观察处理成本、资源消耗和项目收益的结构与变化。', capabilities:['成本归集','单耗分析','收益分析','结构对比'] },
  businessReceivables: { module:'经营管理', title:'回款管理', stage:'P', description:'跟踪合同应收、开票和回款节点，识别经营现金风险。', capabilities:['应收台账','开票跟踪','回款计划','逾期提醒'] },
  improvementIssues: { module:'改进提升', title:'问题清单', stage:'A', description:'统一收集过程评价、管理质量和日常运营发现的问题。', capabilities:['问题登记','来源关联','责任分派','优先级管理'] },
  improvementPlans: { module:'改进提升', title:'改进计划', stage:'A', description:'将问题转化为有负责人、有节点、有资源的改进计划。', capabilities:['措施制定','节点计划','资源需求','审批确认'] },
  improvementExecution: { module:'改进提升', title:'整改执行', stage:'A', description:'跟踪整改动作、过程证据和延期情况，保持执行透明。', capabilities:['进度反馈','证据上传','延期申请','风险升级'] },
  improvementReview: { module:'改进提升', title:'复核关闭', stage:'A', description:'验证整改效果和关闭条件，避免问题未经确认直接销项。', capabilities:['效果复核','关闭确认','退回整改','复发跟踪'] },
  improvementAnalysis: { module:'改进提升', title:'改进分析', stage:'A', description:'分析问题结构、关闭效率和复发趋势，支持持续改进。', capabilities:['问题趋势','关闭周期','复发分析','改进成效'] }
} as const
type PlannedPageId = keyof typeof plannedPages
type AppPage = 'platform' | 'processAnalysis' | 'processReport' | 'processDesign' | 'conditionMatrix' | 'operationEntry' | 'labRecords' | 'labReports' | 'overview' | 'org' | 'employee' | 'area' | 'risk' | 'inspection' | 'hazard'|'permit'|'training'|'asset'|'health'|'investment'|'education' | PlannedPageId | QualityPageId | ProcessEvaluationPageId
const active = ref<AppPage>('platform')
const currentPlannedPage = computed(()=>plannedPages[active.value as PlannedPageId])
const currentQualityPage = computed(()=>isQualityPageId(active.value) ? active.value : null)
const currentProcessEvaluationPage = computed(()=>isProcessEvaluationPageId(active.value) ? active.value : null)
const pendingImprovementDraft = ref<ImprovementDraft | null>(null)
const safetyPages:AppPage[]=['overview','org','employee','area','risk','inspection','hazard','permit','training','asset','health','investment','education']
const isSafetyPage = computed(()=>safetyPages.includes(active.value))
const dashboardTaskTab = ref<'pending'|'processed'|'cc'|'started'>('pending')
const dashboardTasks = {
  pending: [{title:'审核一期生化线冬季工况调整',module:'生产运行',time:'今天 14:30',status:'待审核'},{title:'确认重点部位安全检查整改结果',module:'安全管理',time:'今天 17:00',status:'待处理'},{title:'复核二期进水 COD 异常数据',module:'化验管理',time:'明天 09:00',status:'待复核'}],
  processed: [{title:'八月运行数据填报',module:'生产运行',time:'昨天 16:42',status:'已完成'},{title:'有限空间作业票审批',module:'安全管理',time:'昨天 11:08',status:'已通过'}],
  cc: [{title:'2#鼓风机维护完成记录',module:'设备管理',time:'今天 10:20',status:'供查阅'},{title:'本周出水水质分析周报',module:'化验管理',time:'周一 08:30',status:'供查阅'}],
  started: [{title:'发起夏季高负荷工况评审',module:'生产运行',time:'08-12 15:10',status:'审批中'},{title:'发起季度应急物资盘点',module:'安全管理',time:'08-10 09:15',status:'执行中'}]
}
const expandedModules = ref<Record<string, boolean>>({ operations:false, process:false, equipment:false, laboratory:false, safety:false, inventory:false, efficiency:false, business:false, evaluation:false, quality:false, improvement:false, basic:false })
const sidebarCollapsed = ref(false)
function openQualityPage(page:QualityPageId) {
  active.value = page
}
function openProcessEvaluationPage(page:ProcessEvaluationPageId) {
  active.value = page
}
function handleProcessEvaluationNavigate(page:string) {
  if (page === 'operationEntry') { active.value = 'operationEntry'; loadOperationEntry(); expandedModules.value.process = true }
  else if (page === 'labRecords') { active.value = 'labRecords'; labRecordView.value = 'folders'; expandedModules.value.laboratory = true }
  else if (page === 'hazard') { active.value = 'hazard'; expandedModules.value.safety = true }
}
function handleQualityImprovement(draft:ImprovementDraft) {
  pendingImprovementDraft.value = draft
  active.value = 'improvementIssues'
  expandedModules.value.improvement = true
}
function promoteImprovementDraft() {
  active.value = 'improvementPlans'
  expandedModules.value.improvement = true
}
function toggleModule(module: string) {
  if (sidebarCollapsed.value) {
    sidebarCollapsed.value = false
    expandedModules.value[module] = true
    return
  }
  expandedModules.value[module] = !expandedModules.value[module]
}

type DiagnosisLevel = 'normal' | 'warning' | 'alarm'
type DiagnosisMetric = {
  code?: string
  category: string
  name: string
  unit: string
  design: string
  target: string
  actual: string
  deviation: number | null
  level: DiagnosisLevel
  meaning: string
}
const diagnosisDate = ref(new Date().toISOString().slice(0, 10))
const diagnosisLine = ref('一期生化线')
const diagnosisUpdatedAt = ref('尚未更新')
const diagnosisMetrics: DiagnosisMetric[] = [
  { category: '进水水质', name: 'COD', unit: 'mg/L', design: '350', target: '280', actual: '302', deviation: 7.9, level: 'normal', meaning: '化学需氧量' },
  { category: '进水水质', name: 'BOD₅', unit: 'mg/L', design: '180', target: '160', actual: '172', deviation: 7.5, level: 'normal', meaning: '五日生化需氧量' },
  { category: '进水水质', name: 'SS', unit: 'mg/L', design: '220', target: '200', actual: '238', deviation: 19.0, level: 'warning', meaning: '悬浮物' },
  { category: '进水水质', name: 'NH₃-N', unit: 'mg/L', design: '32', target: '28', actual: '36.5', deviation: 30.4, level: 'warning', meaning: '氨氮（以N计）' },
  { category: '进水水质', name: 'TN', unit: 'mg/L', design: '45', target: '42', actual: '51.9', deviation: 23.6, level: 'warning', meaning: '总氮（以N计）' },
  { category: '进水水质', name: 'TP', unit: 'mg/L', design: '5', target: '4.5', actual: '5.2', deviation: 15.6, level: 'warning', meaning: '总磷（以P计）' },
  { category: '进水水质', name: 'NO₃-N', unit: 'mg/L', design: '0.5', target: '0.8', actual: '0.6', deviation: -25.0, level: 'warning', meaning: '硝酸盐氮（以N计）' },
  { category: '进水水质', name: 'TKN', unit: 'mg/L', design: '44', target: '40', actual: '49.8', deviation: 24.5, level: 'warning', meaning: '总凯氏氮（以N计）' },
  { category: '进水水质', name: 'pH', unit: '无量纲', design: '6.5～8.0', target: '6.8～7.6', actual: '7.2', deviation: 0, level: 'normal', meaning: '酸碱度' },
  { category: '进水水质', name: '总碱度', unit: 'mg/L', design: '250', target: '220', actual: '236', deviation: 7.3, level: 'normal', meaning: '以CaCO₃计' },
  { category: '进水水质', name: 'Cl⁻', unit: 'mg/L', design: '—', target: '≤250', actual: '86', deviation: null, level: 'normal', meaning: '氯化物（以Cl⁻计）' },
  { category: '进水水质', name: '总硬度', unit: 'mg/L', design: '250', target: '250', actual: '208', deviation: -16.8, level: 'normal', meaning: '以CaCO₃计' },
  { category: '进水水质', name: '色度', unit: '倍', design: '80', target: '80', actual: '72', deviation: -10.0, level: 'normal', meaning: '稀释倍数' },
  { category: '进水水质', name: '粪大肠菌群数', unit: 'MPN/L', design: '10⁷', target: '10⁷', actual: '8.6×10⁶', deviation: -14.0, level: 'normal', meaning: '粪大肠菌群数' },
  { category: '进水水质', name: 'PO₄-P', unit: 'mg/L', design: '1.0', target: '1.0', actual: '0.86', deviation: -14.0, level: 'normal', meaning: '正磷酸盐磷（以P计）' },
  { category: '进水水质', name: 'VFA', unit: 'mg/L', design: '50', target: '50', actual: '48', deviation: -4.0, level: 'normal', meaning: '挥发性脂肪酸（以乙酸计）' },
  { category: '进水水质', name: 'SCOD', unit: 'mg/L', design: '40', target: '40', actual: '45', deviation: 12.5, level: 'normal', meaning: '溶解性化学需氧量' },
  { category: '进水特征', name: 'VFA/COD', unit: '—', design: '0.14', target: '0.14', actual: '0.16', deviation: 14.3, level: 'normal', meaning: '易利用碳源占比' },
  { category: '进水特征', name: 'SCOD/COD', unit: '—', design: '0.11', target: '0.11', actual: '0.15', deviation: 36.4, level: 'warning', meaning: '溶解性有机物占比' },
  { category: '进水特征', name: 'BOD₅/COD', unit: '—', design: '0.51', target: '0.45', actual: '0.43', deviation: -4.4, level: 'normal', meaning: '污水可生化性' },
  { category: '进水特征', name: 'SS/COD', unit: '—', design: '0.63', target: '0.63', actual: '0.79', deviation: 25.4, level: 'warning', meaning: '悬浮物与有机物比例' },
  { category: '进水特征', name: 'COD/TN', unit: '—', design: '7.78', target: '7.00', actual: '5.82', deviation: -16.9, level: 'warning', meaning: '反硝化碳源条件' },
  { category: '进水特征', name: 'BOD₅/TN', unit: '—', design: '4.00', target: '3.80', actual: '3.31', deviation: -12.9, level: 'warning', meaning: '可生化碳源与总氮比' },
  { category: '进水特征', name: '碱度/NH₃-N', unit: '—', design: '7.81', target: '7.50', actual: '6.47', deviation: -13.7, level: 'warning', meaning: '硝化碱度保障水平' },
  { category: '进水特征', name: 'NH₃-N/TN', unit: '—', design: '0.71', target: '0.70', actual: '0.70', deviation: 0, level: 'normal', meaning: '氨氮占总氮比例' },
  { category: '进水特征', name: 'COD/TP', unit: '—', design: '70', target: '65', actual: '58.1', deviation: -10.6, level: 'warning', meaning: '有机物与总磷比' },
  { category: '进水特征', name: 'BOD₅/TP', unit: '—', design: '36', target: '35', actual: '33.1', deviation: -5.4, level: 'normal', meaning: '可生化有机物与总磷比' },
  { category: '进水特征', name: 'PO₄-P/TP', unit: '—', design: '0.20', target: '0.20', actual: '0.17', deviation: -15.0, level: 'warning', meaning: '正磷酸盐磷占比' },
  { category: '进水特征', name: '有毒物质', unit: '定性', design: '无', target: '无', actual: '未检出', deviation: null, level: 'normal', meaning: '生化系统毒性风险' },
  { category: '进水特征', name: '重金属抑制', unit: '定性', design: '无', target: '无', actual: '无抑制', deviation: null, level: 'normal', meaning: '重金属对微生物抑制情况' },
  { category: '出水水质', name: 'COD', unit: 'mg/L', design: '50', target: '20', actual: '18', deviation: -10.0, level: 'normal', meaning: '低于控制目标，运行正常' },
  { category: '出水水质', name: 'BOD₅', unit: 'mg/L', design: '10', target: '8', actual: '6.8', deviation: -15.0, level: 'normal', meaning: '五日生化需氧量' },
  { category: '出水水质', name: 'SS', unit: 'mg/L', design: '10', target: '8', actual: '7.2', deviation: -10.0, level: 'normal', meaning: '悬浮物' },
  { category: '出水水质', name: 'NH₃-N', unit: 'mg/L', design: '5', target: '2.0', actual: '4.2', deviation: 110.0, level: 'alarm', meaning: '超过工况目标，接近预警控制线' },
  { category: '出水水质', name: 'TN', unit: 'mg/L', design: '15', target: '12', actual: '14.8', deviation: 23.3, level: 'warning', meaning: '总氮（以N计）' },
  { category: '出水水质', name: 'TP', unit: 'mg/L', design: '0.5', target: '0.3', actual: '0.28', deviation: -6.7, level: 'normal', meaning: '总磷（以P计）' },
  { category: '出水水质', name: 'pH', unit: '无量纲', design: '6～9', target: '6.5～8.5', actual: '7.1', deviation: null, level: 'normal', meaning: '酸碱度' },
  { category: '出水水质', name: '色度', unit: '倍', design: '30', target: '20', actual: '12', deviation: -40.0, level: 'normal', meaning: '稀释倍数' },
  { category: '出水水质', name: '粪大肠菌群数', unit: 'MPN/L', design: '1000', target: '1000', actual: '430', deviation: -57.0, level: 'normal', meaning: '粪大肠菌群数' },
  { category: '处理效能', name: 'COD去除率', unit: '%', design: '85.7', target: '92.0', actual: '94.0', deviation: 2.2, level: 'normal', meaning: '化学需氧量去除率' },
  { category: '处理效能', name: 'BOD₅去除率', unit: '%', design: '94.4', target: '94.0', actual: '96.0', deviation: 2.1, level: 'normal', meaning: '五日生化需氧量去除率' },
  { category: '处理效能', name: 'SS去除率', unit: '%', design: '95.5', target: '96.0', actual: '97.0', deviation: 1.0, level: 'normal', meaning: '悬浮物去除率' },
  { category: '处理效能', name: 'NH₃-N去除率', unit: '%', design: '84.4', target: '94.0', actual: '88.5', deviation: -5.9, level: 'normal', meaning: '氨氮去除率' },
  { category: '处理效能', name: 'TN去除率', unit: '%', design: '66.7', target: '70.0', actual: '61.5', deviation: -12.1, level: 'warning', meaning: '总氮去除效果偏低' },
  { category: '处理效能', name: 'TP去除率', unit: '%', design: '90.0', target: '92.0', actual: '94.6', deviation: 2.8, level: 'normal', meaning: '总磷去除率' },
  { category: '处理效能', name: '理论脱氮率', unit: '%', design: '—', target: '75.0', actual: '72.6', deviation: -3.2, level: 'normal', meaning: '按工艺模型或设计参数计算' },
  { category: '处理效能', name: '实际脱氮率', unit: '%', design: '—', target: '70.0', actual: '61.5', deviation: -12.1, level: 'warning', meaning: '按实测进出水负荷计算' },
  { category: '处理效能', name: '总氮放弃率', unit: '%', design: '—', target: '≤8.0', actual: '10.6', deviation: 32.5, level: 'warning', meaning: '未进入有效脱氮路径的总氮比例' },
  { category: '处理效能', name: '碳源消耗比', unit: 'kg/kgTN', design: '—', target: '3.5', actual: '3.8', deviation: 8.6, level: 'normal', meaning: '单位总氮去除的外加碳源消耗' },
  { category: '污泥性状', name: 'MLSS', unit: 'mg/L', design: '3500', target: '3500', actual: '3220', deviation: -8.0, level: 'normal', meaning: '混合液悬浮固体浓度' },
  { category: '污泥性状', name: 'MLVSS', unit: 'mg/L', design: '3000', target: '3000', actual: '2730', deviation: -9.0, level: 'normal', meaning: '混合液挥发性悬浮固体浓度' },
  { category: '污泥性状', name: 'MLVSS/MLSS', unit: '无量纲', design: '0.86', target: '0.86', actual: '0.85', deviation: -1.2, level: 'normal', meaning: '活性有机固体比例' },
  { category: '污泥性状', name: 'SV30', unit: '%', design: '30', target: '30', actual: '38', deviation: 26.7, level: 'warning', meaning: '30 min污泥沉降比' },
  { category: '污泥性状', name: 'SVI', unit: 'mL/g', design: '85.7', target: '90', actual: '118', deviation: 31.1, level: 'warning', meaning: '污泥沉降性能下降' },
  { category: '污泥性状', name: 'SRT', unit: 'd', design: '15', target: '18', actual: '12.5', deviation: -30.6, level: 'warning', meaning: '系统固体停留时间估算值' },
  { category: '污泥性状', name: 'SRT-理论计算', unit: 'd', design: '15', target: '18', actual: '14.2', deviation: -21.1, level: 'warning', meaning: '按生物动力学或硝化需求计算' },
  { category: '污泥性状', name: 'SRT-固体量法', unit: 'd', design: '15', target: '18', actual: '13.1', deviation: -27.2, level: 'warning', meaning: '按系统污泥总量与排出固体量计算' },
  { category: '污泥性状', name: 'SRT-排泥流量法', unit: 'd', design: '15', target: '18', actual: '12.5', deviation: -30.6, level: 'warning', meaning: '按排泥流量及浓度计算' },
  { category: '污泥性状', name: 'BOD₅/MLSS', unit: 'kg/kg', design: '0.10', target: '0.10', actual: '0.11', deviation: 10.0, level: 'normal', meaning: 'BOD污泥负荷' },
  { category: '污泥性状', name: 'COD/MLSS', unit: 'kg/kg', design: '0.20', target: '0.20', actual: '0.21', deviation: 5.0, level: 'normal', meaning: 'COD污泥负荷' },
  { category: '污泥性状', name: 'BOD/MLVSS', unit: 'kg/kg', design: '0.15', target: '0.15', actual: '0.16', deviation: 6.7, level: 'normal', meaning: '有机负荷F/M' },
  { category: '污泥性状', name: 'NH₃/MLVSS', unit: 'kg/kg', design: '0.03', target: '0.03', actual: '0.034', deviation: 13.3, level: 'normal', meaning: '硝化负荷' },
  { category: '污泥性状', name: 'TN/MLVSS', unit: 'kg/kg', design: '0.04', target: '0.04', actual: '0.047', deviation: 17.5, level: 'warning', meaning: '氮负荷' },
  { category: '污泥性状', name: 'NO₃-N/MLSS', unit: 'kg/kg', design: '0.04', target: '0.04', actual: '0.043', deviation: 7.5, level: 'normal', meaning: '反硝化速率关联指标' },
  { category: '污泥性状', name: 'SOUR', unit: 'mgO₂/(g·h)', design: '—', target: '8～20', actual: '12.8', deviation: null, level: 'normal', meaning: '单位MLVSS耗氧速率' },
  { category: '污泥性状', name: 'T', unit: '℃', design: '—', target: '≥12', actual: '13.6', deviation: null, level: 'normal', meaning: '生化池水温' },
  { category: '污泥性状', name: '生物相', unit: '定性', design: '—', target: '良好', actual: '良好', deviation: null, level: 'normal', meaning: '活性污泥微型生物种类与状态' }
]
const expertResultMetrics: DiagnosisMetric[] = [
  { category: '污泥性状', name: '填料区游离污泥MLSS', unit: 'mg/L', design: '—', target: '5500～7500', actual: '6670', deviation: null, level: 'normal', meaning: 'MBBR填料区游离污泥悬浮固体浓度' },
  { category: '污泥性状', name: '填料区游离污泥MLVSS', unit: 'mg/L', design: '—', target: '3000～4500', actual: '3670', deviation: null, level: 'normal', meaning: 'MBBR填料区游离污泥挥发性悬浮固体浓度' },
  { category: '污泥性状', name: '填料折合总污泥浓度', unit: 'mg/L', design: '—', target: '≥7000', actual: '8460', deviation: null, level: 'normal', meaning: '生物膜折合污泥浓度与游离污泥浓度之和' },
  { category: '沿程分析', name: '缺氧段 COD 去除量', unit: 'mg/L', design: '—', target: '≥10', actual: '14', deviation: 40.0, level: 'normal', meaning: '缺氧段进出水 COD 差值，反映反硝化碳源利用情况' },
  { category: '沿程分析', name: '缺氧段 TN 去除量', unit: 'mg/L', design: '—', target: '≥2.0', actual: '2.1', deviation: 5.0, level: 'normal', meaning: '缺氧段进出水 TN 差值' },
  { category: '沿程分析', name: '好氧段 NH₃-N 去除量', unit: 'mg/L', design: '—', target: '≥6.0', actual: '6.92', deviation: 15.3, level: 'normal', meaning: '好氧段氨氮削减量，反映硝化过程效果' },
  { category: '沿程分析', name: '反硝化速率', unit: 'mgNO₃-N/(gMLVSS·h)', design: '—', target: '1.5～3.5', actual: '2.4', deviation: null, level: 'normal', meaning: '按缺氧段沿程氮平衡与活性污泥量计算' },
  { category: '沿程分析', name: '硝化速率', unit: 'mgNH₃-N/(gMLVSS·h)', design: '—', target: '1.5～3.5', actual: '2.8', deviation: null, level: 'normal', meaning: '按好氧段沿程氨氮削减与活性污泥量计算' },
  { category: '沿程分析', name: '生化除磷率', unit: '%', design: '—', target: '≥45', actual: '54.4', deviation: 20.9, level: 'normal', meaning: '由生化池进出水 TP 沿程数据计算' },
  { category: '沿程分析', name: '厌氧释磷比例', unit: '%', design: '—', target: '≥105', actual: '104.0', deviation: -1.0, level: 'normal', meaning: '厌氧段末端与进水正磷酸盐比值' }
]
const alongCourseStations = ['总进水','生化进水','缺氧进水','缺氧出水','厌氧末端','好氧一段','好氧二段','好氧末端','二沉出水','总出水']
const alongCourseSeries = [
  { name:'COD', unit:'mg/L', values:['172','155','80','66','44','37','34','27','23','20'], trend:'持续下降' },
  { name:'TP', unit:'mg/L', values:['3.99','3.20','2.15','2.04','2.25','2.02','2.03','1.82','1.31','0.22'], trend:'好氧吸磷明显' },
  { name:'TN', unit:'mg/L', values:['33.3','31.7','11.5','12.5','12.1','12.4','12.1','11.8','11.7','11.6'], trend:'缺氧段完成主要削减' },
  { name:'NH₃-N', unit:'mg/L', values:['31.5','30.6','8.46','8.32','10.2','7.26','3.40','3.28','1.45','1.41'], trend:'好氧段硝化正常' },
  { name:'NO₃-N', unit:'mg/L', values:['0.49','0.36','2.72','3.96','1.70','4.73','8.55','8.40','10.2','10.1'], trend:'随硝化过程上升' },
  { name:'DO', unit:'mg/L', values:['0.23','0.18','0.16','0.13','0.10','0.22','1.02','0.52','—','—'], trend:'好氧末端偏低' },
  { name:'MLSS', unit:'mg/L', values:['—','—','7110','—','6998','—','6815','—','—','—'], trend:'沿程浓度稳定' },
  { name:'碱度', unit:'mg/L', values:['178','—','163','—','150','—','—','132','—','135'], trend:'硝化过程持续消耗' }
]
const showNewMetricForm = ref(false)
const customMetrics = reactive<DiagnosisMetric[]>(JSON.parse(localStorage.getItem('waterx-custom-diagnosis-metrics') || '[]'))
const customProcessMetrics = reactive<DiagnosisMetric[]>(JSON.parse(localStorage.getItem('waterx-custom-process-metrics') || '[]'))
const resultCategories = ['进水水质','进水特征','出水水质','处理效能','污泥性状','沿程分析']
const processCategories = ['水量控制','曝气控制','回流控制','排泥控制','加药控制','搅拌控制']
const metricCategoryPrefixes: Record<string,string> = {
  '进水水质':'INQ', '进水特征':'INC', '出水水质':'EFQ', '处理效能':'EFF', '污泥性状':'SLD',
  '水量控制':'FLW', '曝气控制':'AIR', '回流控制':'RFL',
  '排泥控制':'WSL', '加药控制':'CHE', '搅拌控制':'MIX', '沿程分析':'PRF'
}
const newMetricForm = reactive({ category: '进水水质', name: '', unit: 'mg/L', meaning: '', dataType: 'DECIMAL', valueSource: 'MANUAL', required: false, fillSpec: '' })
const allDiagnosisMetrics = computed(() => [...diagnosisMetrics, ...expertResultMetrics, ...customMetrics])
function metricKey(metric: Pick<DiagnosisMetric, 'category' | 'name'>) { return `${metric.category}::${metric.name}` }
const calculatedMetricFormulas: Record<string,string> = {
  '进水特征::VFA/COD':'[INQ-016] ÷ [INQ-001]',
  '进水特征::SCOD/COD':'[INQ-017] ÷ [INQ-001]',
  '进水特征::BOD₅/COD':'[INQ-002] ÷ [INQ-001]',
  '进水特征::SS/COD':'[INQ-003] ÷ [INQ-001]',
  '进水特征::COD/TN':'[INQ-001] ÷ [INQ-005]',
  '进水特征::BOD₅/TN':'[INQ-002] ÷ [INQ-005]',
  '进水特征::碱度/NH₃-N':'[INQ-010] ÷ [INQ-004]',
  '进水特征::NH₃-N/TN':'[INQ-004] ÷ [INQ-005]',
  '进水特征::COD/TP':'[INQ-001] ÷ [INQ-006]',
  '进水特征::BOD₅/TP':'[INQ-002] ÷ [INQ-006]',
  '进水特征::PO₄-P/TP':'[INQ-015] ÷ [INQ-006]',
  '处理效能::COD去除率':'([INQ-001] − [EFQ-001]) ÷ [INQ-001] × 100',
  '处理效能::BOD₅去除率':'([INQ-002] − [EFQ-002]) ÷ [INQ-002] × 100',
  '处理效能::SS去除率':'([INQ-003] − [EFQ-003]) ÷ [INQ-003] × 100',
  '处理效能::NH₃-N去除率':'([INQ-004] − [EFQ-004]) ÷ [INQ-004] × 100',
  '处理效能::TN去除率':'([INQ-005] − [EFQ-005]) ÷ [INQ-005] × 100',
  '处理效能::TP去除率':'([INQ-006] − [EFQ-006]) ÷ [INQ-006] × 100',
  '处理效能::理论脱氮率':'MODEL_DENITRIFICATION()',
  '处理效能::实际脱氮率':'[EFF-005]',
  '处理效能::总氮放弃率':'CALC_TN_BYPASS()',
  '处理效能::碳源消耗比':'CALC_CARBON_CONSUMPTION()',
  '沿程分析::缺氧段 COD 去除量':'PROFILE_DELTA(COD,ANOXIC)',
  '沿程分析::缺氧段 TN 去除量':'PROFILE_DELTA(TN,ANOXIC)',
  '沿程分析::好氧段 NH₃-N 去除量':'PROFILE_DELTA(NH3,AEROBIC)',
  '沿程分析::反硝化速率':'PROFILE_DENITRIFICATION_RATE()',
  '沿程分析::硝化速率':'PROFILE_NITRIFICATION_RATE()',
  '沿程分析::生化除磷率':'PROFILE_TP_REMOVAL_RATE()',
  '沿程分析::厌氧释磷比例':'PROFILE_ANAEROBIC_RELEASE_RATE()',
  '污泥性状::MLVSS/MLSS':'[SLD-002] ÷ [SLD-001]',
  '污泥性状::SVI':'[SLD-004] × 10000 ÷ [SLD-001]',
  '污泥性状::SRT':'CALC_SRT()',
  '污泥性状::SRT-理论计算':'MODEL_SRT()',
  '污泥性状::SRT-固体量法':'CALC_SRT_SOLIDS()',
  '污泥性状::SRT-排泥流量法':'CALC_SRT_WASTE_FLOW()',
  '污泥性状::BOD₅/MLSS':'[INQ-002] ÷ [SLD-001]',
  '污泥性状::COD/MLSS':'[INQ-001] ÷ [SLD-001]',
  '污泥性状::BOD/MLVSS':'[INQ-002] ÷ [SLD-002]',
  '污泥性状::NH₃/MLVSS':'[INQ-004] ÷ [SLD-002]',
  '污泥性状::TN/MLVSS':'[INQ-005] ÷ [SLD-002]',
  '污泥性状::NO₃-N/MLSS':'[INQ-007] ÷ [SLD-001]',
  '水量控制::水量负荷率':'[FLW-001] ÷ DESIGN_FLOW() × 100',
  '水量控制::厌氧段HRT':'ANAEROBIC_VOLUME() ÷ [FLW-001]',
  '水量控制::缺氧段HRT':'ANOXIC_VOLUME() ÷ [FLW-001]',
  '水量控制::好氧段HRT':'AEROBIC_VOLUME() ÷ [FLW-001]',
  '水量控制::总HRT':'TOTAL_VOLUME() ÷ [FLW-001]',
  '曝气控制::单位水量曝气量':'[AIR-003] ÷ [FLW-001]',
  '曝气控制::当前气水比':'[AIR-011] × 1440 ÷ [FLW-001]',
  '曝气控制::当前曝气电单耗':'BLOWER_POWER() ÷ [FLW-001]',
  '曝气控制::曝气电单耗基线偏离度':'[AIR-013] ÷ [AIR-014] × 100',
  '曝气控制::膜片堵塞率':'(CURRENT_PRESSURE() − NEW_PRESSURE()) ÷ 7 × 100',
  '回流控制::内回流比':'INTERNAL_RECYCLE_FLOW() ÷ [FLW-001] × 100',
  '回流控制::外回流比':'EXTERNAL_RECYCLE_FLOW() ÷ [FLW-001] × 100',
  '排泥控制::估算SRT':'CALC_SRT_WASTE_FLOW()',
  '加药控制::吨水药耗':'([CHE-001] + [CHE-002]) ÷ [FLW-001]',
  '加药控制::碳源折合COD投加量':'CARBON_DOSE() × PURITY() × COD_EQUIVALENT()',
  '加药控制::理论碳源投加量':'CARBON_BALANCE_TARGET()',
  '加药控制::理论出水碱度':'INFLUENT_ALKALINITY() − NITRIFICATION_ALK() + DENITRIFICATION_ALK()',
  '加药控制::需补充碱度':'80 − THEORETICAL_EFFLUENT_ALKALINITY()',
  '搅拌控制::平均运行率':'[MIX-003] ÷ 24 × 100',
  '曝气控制::填料投加容积比':'CARRIER_VOLUME() ÷ MBBR_VOLUME() × 100',
  '曝气控制::曝气流化气水比':'FLUIDIZATION_AIR() × 1440 ÷ [FLW-001]',
  '曝气控制::MBBR系统电单耗':'MBBR_DAILY_POWER() ÷ [FLW-001]',
  '污泥性状::填料折合总污泥浓度':'BIOFILM_EQUIVALENT_MLSS() + FREE_MLSS()',
  '曝气控制::填料表面硝化负荷':'MBBR_NH3_LOAD() ÷ CARRIER_SURFACE()'
}
function defaultFormulaFor(metric: Pick<DiagnosisMetric,'category'|'name'>) { return calculatedMetricFormulas[metricKey(metric)] || '' }
type MetricModuleKey = 'design' | 'condition' | 'entry' | 'diagnosis'
const moduleMetricLabels: Record<MetricModuleKey,string> = { design:'工艺设计标准', condition:'工况矩阵', entry:'运行数据填报', diagnosis:'工艺诊断分析' }
const moduleMetricDefaultScopes: Record<string,MetricModuleKey[]> = {
  '沿程分析::缺氧段 COD 去除量':['diagnosis'], '沿程分析::缺氧段 TN 去除量':['diagnosis'], '沿程分析::好氧段 NH₃-N 去除量':['diagnosis'],
  '沿程分析::反硝化速率':['diagnosis'], '沿程分析::硝化速率':['diagnosis'], '沿程分析::生化除磷率':['diagnosis'], '沿程分析::厌氧释磷比例':['diagnosis'],
  '水量控制::设计处理水量':['design'], '水量控制::生化池设计组数':['design'], '水量控制::二沉池设计组数':['design'],
  '水量控制::厌氧段有效池容':['design'], '水量控制::缺氧段有效池容':['design'], '水量控制::好氧段有效池容':['design'],
  '水量控制::二沉池有效池容':['design'], '水量控制::设计最低水温':['design'],
  '曝气控制::曝气器类型':['design'], '曝气控制::曝气膜片尺寸':['design'], '曝气控制::曝气膜片材质':['design'], '曝气控制::曝气器总安装数量':['design'],
  '曝气控制::曝气器浸没水深':['design'], '曝气控制::风机额定风量':['design'], '曝气控制::风机额定出口升压':['design'],
  '曝气控制::实际运行风量':['condition','entry','diagnosis'], '曝气控制::当前气水比':['condition','diagnosis'],
  '曝气控制::当前曝气电单耗':['condition','diagnosis'], '曝气控制::曝气电单耗基线':['condition','diagnosis'],
  '曝气控制::曝气电单耗基线偏离度':['condition','diagnosis'], '曝气控制::当前风机出口升压':['condition','entry','diagnosis'],
  '曝气控制::膜片堵塞率':['condition','diagnosis'],
  '加药控制::碳源名称':['condition','entry','diagnosis'], '加药控制::碳源溶液纯度':['condition','entry','diagnosis'],
  '加药控制::碳源投加单耗':['condition','entry','diagnosis'], '加药控制::混凝剂名称':['condition','entry','diagnosis'],
  '加药控制::混凝剂浓度':['condition','entry','diagnosis'], '加药控制::混凝剂投加单耗':['condition','entry','diagnosis'],
  '加药控制::碳源折合COD投加量':['condition','diagnosis'], '加药控制::理论碳源投加量':['condition','diagnosis'],
  '加药控制::理论出水碱度':['condition','diagnosis'], '加药控制::需补充碱度':['condition','diagnosis'],
  '曝气控制::MBBR填料区池容':['design','diagnosis'], '曝气控制::填料比表面积':['design','diagnosis'], '曝气控制::投加填料总体积':['design','diagnosis'],
  '曝气控制::填料投加位置':['design','diagnosis'], '曝气控制::单个填料干重':['design','diagnosis'], '曝气控制::单个填料体积':['design','diagnosis'],
  '曝气控制::曝气流化风量':['condition','entry','diagnosis'], '曝气控制::填料区溶解氧':['condition','entry','diagnosis'],
  '污泥性状::填料区游离污泥MLSS':['condition','entry','diagnosis'], '污泥性状::填料区游离污泥MLVSS':['condition','entry','diagnosis'],
  '曝气控制::填料投加容积比':['condition','diagnosis'], '曝气控制::曝气流化气水比':['condition','diagnosis'],
  '曝气控制::MBBR系统电单耗':['condition','diagnosis'], '污泥性状::填料折合总污泥浓度':['condition','diagnosis'],
  '曝气控制::填料表面硝化负荷':['condition','diagnosis']
}
const activeModuleMetricManager = ref<MetricModuleKey|null>(null)
const activeMetricBoard = ref('')
const metricDraftSnapshot = ref<{settings:string;overrides:string;custom:string;customProcess:string}|null>(null)
const metricCreationTargetModule = ref<MetricModuleKey|null>(null)
const moduleMetricSearch = ref('')
const moduleMetricOverrides = reactive<Record<MetricModuleKey,Record<string,boolean>>>(JSON.parse(localStorage.getItem('waterx-module-metric-overrides') || 'null') || { design:{}, condition:{}, entry:{}, diagnosis:{} })
function moduleMetricDefaultEnabled(metric: Pick<DiagnosisMetric,'category'|'name'>, module: MetricModuleKey) {
  const scoped = moduleMetricDefaultScopes[metricKey(metric)]
  if (scoped) return scoped.includes(module)
  return module === 'entry' ? !defaultFormulaFor(metric) : true
}
function isMetricEnabledInModule(metric: Pick<DiagnosisMetric,'category'|'name'>, module: MetricModuleKey|null) {
  if (!module) return false
  if (settingFor(metric).hidden) return false
  const key = metricKey(metric)
  return Object.prototype.hasOwnProperty.call(moduleMetricOverrides[module],key) ? moduleMetricOverrides[module][key] : moduleMetricDefaultEnabled(metric,module)
}
function setMetricEnabledInModule(metric: Pick<DiagnosisMetric,'category'|'name'>, module: MetricModuleKey|null, enabled: boolean) { if (module) moduleMetricOverrides[module][metricKey(metric)] = enabled }
function openModuleMetricManager(module: MetricModuleKey, board = '') {
  metricDraftSnapshot.value={settings:JSON.stringify(metricSettings),overrides:JSON.stringify(moduleMetricOverrides),custom:JSON.stringify(customMetrics),customProcess:JSON.stringify(customProcessMetrics)}
  activeModuleMetricManager.value=module; activeMetricBoard.value=board; moduleMetricSearch.value=''; if(board)newMetricForm.category=board
}
function closeModuleMetricManager() {
  const snapshot=metricDraftSnapshot.value
  if(snapshot) {
    Object.keys(metricSettings).forEach(key=>delete metricSettings[key]); Object.assign(metricSettings,JSON.parse(snapshot.settings))
    const savedOverrides=JSON.parse(snapshot.overrides); (Object.keys(moduleMetricOverrides) as MetricModuleKey[]).forEach(module=>moduleMetricOverrides[module]=savedOverrides[module]||{})
    customMetrics.splice(0,customMetrics.length,...JSON.parse(snapshot.custom)); customProcessMetrics.splice(0,customProcessMetrics.length,...JSON.parse(snapshot.customProcess))
    localStorage.setItem('waterx-custom-diagnosis-metrics',snapshot.custom); localStorage.setItem('waterx-custom-process-metrics',snapshot.customProcess)
  }
  metricDraftSnapshot.value=null; activeModuleMetricManager.value=null; activeMetricBoard.value=''; showNewMetricForm.value=false
}
function saveModuleMetricSettings() { localStorage.setItem('waterx-module-metric-overrides', JSON.stringify(moduleMetricOverrides)); saveMetricSettings(); metricDraftSnapshot.value=null; activeModuleMetricManager.value=null; activeMetricBoard.value=''; showNewMetricForm.value=false }
function startMetricCreationFromModule() { metricCreationTargetModule.value=activeModuleMetricManager.value; showNewMetricForm.value=true }
function cancelModuleMetricCreation() { metricCreationTargetModule.value=null; showNewMetricForm.value=false }
const visibleDiagnosisMetrics = computed(() => allDiagnosisMetrics.value.filter(metric => isMetricEnabledInModule(metric,'diagnosis')))
function addCustomMetric() {
  const metric: DiagnosisMetric = { code:nextMetricCode(newMetricForm.category), category:newMetricForm.category, name:newMetricForm.name, unit:newMetricForm.unit, meaning:newMetricForm.meaning, design:'—', target:'—', actual:'—', deviation:null, level:'normal' }
  if (processCategories.includes(newMetricForm.category)) { customProcessMetrics.push(metric); localStorage.setItem('waterx-custom-process-metrics', JSON.stringify(customProcessMetrics)) }
  else { customMetrics.push(metric); localStorage.setItem('waterx-custom-diagnosis-metrics', JSON.stringify(customMetrics)) }
  metricSettings[metricKey(newMetricForm)] = { mode: 'CENTER', healthyPct: 10, warningPct: 50, dataType:newMetricForm.dataType, valueSource:newMetricForm.valueSource, required:newMetricForm.required, fillSpec:newMetricForm.fillSpec, hidden:false, displayName:'', displayUnit:'' }
  ;(['design','condition','entry','diagnosis'] as MetricModuleKey[]).forEach(module => { moduleMetricOverrides[module][metricKey(metric)] = module===metricCreationTargetModule.value })
  localStorage.setItem('waterx-custom-diagnosis-metrics', JSON.stringify(customMetrics))
  saveMetricSettings()
  localStorage.setItem('waterx-module-metric-overrides', JSON.stringify(moduleMetricOverrides))
  Object.assign(newMetricForm, { category: activeMetricBoard.value || '进水水质', name: '', unit: 'mg/L', meaning: '', dataType: 'DECIMAL', valueSource: 'MANUAL', required:false, fillSpec:'' })
  metricCreationTargetModule.value=null
  showNewMetricForm.value = false
}
type DeviationMode = 'UPPER' | 'LOWER' | 'CENTER'
type MetricSetting = { mode: DeviationMode; healthyPct: number; warningPct: number; dataType: string; valueSource: string; required: boolean; fillSpec: string; hidden: boolean; displayName: string; displayUnit: string }
const savedMetricSettings = JSON.parse(localStorage.getItem('waterx-metric-settings') || '{}') as Record<string, MetricSetting>
const metricSettings = reactive<Record<string, MetricSetting>>(savedMetricSettings)
function settingFor(metric: Pick<DiagnosisMetric, 'category'|'name'> & Partial<Pick<DiagnosisMetric,'unit'>>) {
  const key = metricKey(metric)
  const inferredType = metric.unit==='%' ? 'PERCENT' : ['定性','文本'].includes(metric.unit||'') ? 'TEXT' : ['台','组','个','次/d'].includes(metric.unit||'') ? 'INTEGER' : 'DECIMAL'
  const defaults: MetricSetting = { mode: 'CENTER', healthyPct: 10, warningPct: 50, dataType:inferredType, valueSource:'MANUAL', required:false, fillSpec:'', hidden:false, displayName:'', displayUnit:'' }
  if (!metricSettings[key]) metricSettings[key] = defaults
  else {
    const saved = metricSettings[key]
    Object.assign(saved, { ...defaults, ...saved })
    if (saved.valueSource==='CALCULATED') saved.valueSource='MANUAL'
    if (['定性','文本'].includes(metric.unit||'')) saved.dataType='TEXT'
    if (['台','组','个','次/d'].includes(metric.unit||'') && saved.dataType==='DECIMAL') saved.dataType='INTEGER'
  }
  return metricSettings[key]
}
function metricDisplayName(metric: Pick<DiagnosisMetric,'category'|'name'> & Partial<Pick<DiagnosisMetric,'unit'>>) { return settingFor(metric).displayName || metric.name }
function metricDisplayUnit(metric: Pick<DiagnosisMetric,'category'|'name'> & Partial<Pick<DiagnosisMetric,'unit'>>) { return settingFor(metric).displayUnit || metric.unit || '—' }
function saveMetricSettings() {
  localStorage.setItem('waterx-metric-settings', JSON.stringify(metricSettings))
}
const designEditMode = ref(false)
const designValues = reactive<Record<string,string>>(Object.fromEntries(diagnosisMetrics.map(metric => [metricKey(metric), metric.design])))
function isDerivedMetric(metric: Pick<DiagnosisMetric,'category'|'name'>) {
  return Boolean(defaultFormulaFor(metric)) || metric.category==='进水特征' || metric.category==='处理效能' || metric.category==='沿程分析' || /(去除率|负荷率|消耗比|放弃率|理论|折合|气水比|回流比|偏离度|HRT|SVI|MLVSS\/MLSS)/.test(metric.name)
}
const designMetrics = computed(() => allManagedMetrics.value.filter(metric => isMetricEnabledInModule(metric,'design') && !isDerivedMetric(metric) && metric.design!=='—'))
function designValueFor(metric: DiagnosisMetric) { const value=designValues[metricKey(metric)]; return value && value!=='—' ? value : metric.design }
function beginDesignEdit() { designMetrics.value.forEach(metric=>{if(!designValues[metricKey(metric)]||designValues[metricKey(metric)]==='—')designValues[metricKey(metric)]=metric.design}); designEditMode.value=true }
function saveDesignValues() { localStorage.setItem('waterx-process-design-values', JSON.stringify(designValues)); designEditMode.value = false }
Object.assign(designValues, JSON.parse(localStorage.getItem('waterx-process-design-values') || '{}'))

type ConditionPlan = { id: string; name: string; effectiveFrom: string; effectiveTo: string; description: string; targets: Record<string,string> }
type StoredConditionPlan = Partial<ConditionPlan> & { effectiveDate?: string }
const today = new Date().toISOString().slice(0,10)
function dateAfter(date:string,days:number){
  const [year,month,day]=date.split('-').map(Number)
  return new Date(Date.UTC(year!,month!-1,day!+days)).toISOString().slice(0,10)
}
function legacyConditionEnd(plan:StoredConditionPlan,from:string){
  const year=Number(from.slice(0,4))
  if(/冬季/.test(plan.name||''))return `${year+1}-04-30`
  if(/夏季/.test(plan.name||''))return `${year}-10-31`
  return dateAfter(from,30)
}
function normalizeConditionPlan(plan:StoredConditionPlan,index:number):ConditionPlan{
  const effectiveFrom=plan.effectiveFrom||plan.effectiveDate||today
  return {
    id:plan.id||`condition-${Date.now()}-${index}`,
    name:plan.name||`工况${index+1}`,
    effectiveFrom,
    effectiveTo:plan.effectiveTo||legacyConditionEnd(plan,effectiveFrom),
    description:plan.description||'',
    targets:plan.targets||Object.fromEntries(diagnosisMetrics.map(metric=>[metricKey(metric),metric.target]))
  }
}
function loadConditionPlans():ConditionPlan[]{
  try {
    const stored=JSON.parse(localStorage.getItem('waterx-condition-plans')||'null') as StoredConditionPlan[]|null
    if(stored?.length)return stored.map(normalizeConditionPlan)
  } catch { /* local data is invalid; use the safe defaults below */ }
  return [
    { id:'summer',name:'夏季工况',effectiveFrom:'2026-05-01',effectiveTo:'2026-10-31',description:'高水温条件下兼顾能耗与稳定达标',targets:Object.fromEntries(diagnosisMetrics.map(metric=>[metricKey(metric),metric.target])) },
    { id:'winter',name:'冬季工况',effectiveFrom:'2026-11-01',effectiveTo:'2027-04-30',description:'低水温条件下强化硝化与污泥龄控制',targets:Object.fromEntries(diagnosisMetrics.map(metric=>[metricKey(metric),metric.target])) }
  ]
}
const conditionPlans = reactive<ConditionPlan[]>(loadConditionPlans())
const selectedConditionId = ref(conditionPlans[0]?.id || '')
const selectedCondition = computed(() => conditionPlans.find(item => item.id === selectedConditionId.value))
const conditionEditMode = ref(false)
const showConditionForm = ref(false)
const conditionForm = reactive({ name:'',effectiveFrom:today,effectiveTo:dateAfter(today,30),description:'' })
const conditionMetrics = computed(() => allManagedMetrics.value.filter(metric => isMetricEnabledInModule(metric,'condition') && !isDerivedMetric(metric) && metric.target!=='—'))
function conditionForDate(date:string){
  return [...conditionPlans]
    .filter(plan=>Boolean(date)&&plan.effectiveFrom<=date&&date<=plan.effectiveTo)
    .sort((a,b)=>b.effectiveFrom.localeCompare(a.effectiveFrom))[0]
}
const diagnosisCondition = computed(()=>conditionForDate(diagnosisDate.value))
const diagnosisScenario = computed(()=>diagnosisCondition.value?.name||'未匹配工况')
function conditionValidationMessage(plan:Pick<ConditionPlan,'id'|'name'|'effectiveFrom'|'effectiveTo'>){
  if(!plan.name.trim())return '请输入工况名称'
  if(!plan.effectiveFrom||!plan.effectiveTo)return '请选择工况的起始日期和结束日期'
  if(plan.effectiveFrom>plan.effectiveTo)return '结束日期不能早于起始日期'
  const overlap=conditionPlans.find(item=>item.id!==plan.id&&plan.effectiveFrom<=item.effectiveTo&&item.effectiveFrom<=plan.effectiveTo)
  if(overlap)return `该时间范围与“${overlap.name}”（${overlap.effectiveFrom} 至 ${overlap.effectiveTo}）重叠，请调整后再保存`
  return ''
}
function createCondition() {
  const plan: ConditionPlan = { id:`condition-${Date.now()}`,...conditionForm,targets:Object.fromEntries(conditionMetrics.value.map(metric=>[metricKey(metric),metric.target])) }
  const validationMessage=conditionValidationMessage(plan)
  if(validationMessage){window.alert(validationMessage);return}
  conditionPlans.push(plan); selectedConditionId.value = plan.id; showConditionForm.value = false; conditionEditMode.value = true
  Object.assign(conditionForm,{name:'',effectiveFrom:today,effectiveTo:dateAfter(today,30),description:''}); saveConditions()
}
function saveConditions() {
  if(selectedCondition.value){const validationMessage=conditionValidationMessage(selectedCondition.value);if(validationMessage){window.alert(validationMessage);return}}
  localStorage.setItem('waterx-condition-plans',JSON.stringify(conditionPlans));conditionEditMode.value=false
}
function deleteCondition(id: string) { if (!window.confirm('确定删除该工况吗？')) return; const index = conditionPlans.findIndex(item=>item.id===id); if(index>=0) conditionPlans.splice(index,1); selectedConditionId.value=conditionPlans[0]?.id||''; saveConditions() }

const entryDate = ref(new Date().toISOString().slice(0,10))
const entryValues = reactive<Record<string,string>>(Object.fromEntries(diagnosisMetrics.map(metric => [metricKey(metric), metric.actual])))
const entryMetrics = computed(() => allManagedMetrics.value.filter(metric => !isDerivedMetric(metric) && isMetricEnabledInModule(metric,'entry')))
const entryCategoryOrder = [...resultCategories,...processCategories]
const entryGroups = computed(() => entryCategoryOrder.map(category => ({ category, metrics:entryMetrics.value.filter(metric=>metric.category===category) })).filter(group=>group.metrics.length))
const activeEntryCategory = ref('进水水质')
const activeEntryGroup = computed(() => entryGroups.value.find(group=>group.category===activeEntryCategory.value) || entryGroups.value[0])
const calculatedEntryMetricCount = computed(() => allManagedMetrics.value.filter(metric=>Boolean(defaultFormulaFor(metric))).length)
function filledEntryCount(metrics: DiagnosisMetric[]) { return metrics.filter(metric=>String(entryValues[metricKey(metric)]||'').trim()).length }
const entrySavedAt = ref('尚未保存')
const entryRevision = ref(0)
type OperationEntryRecord = {
  id: string
  siteId: string
  siteName: string
  siteCode: string
  line: string
  entryDate: string
  scenario: string
  values: Record<string,string>
  status: 'DRAFT' | 'COMPLETED' | 'LOCKED'
  updatedBy: string
  updatedAt: string
}
const operationEntryStorageKey = 'waterx-operation-entry-records'
const operationEntryView = ref<'list'|'form'>('list')
const operationEntryRecords = reactive<OperationEntryRecord[]>([])
const selectedOperationEntryIds = ref<string[]>([])
const editingOperationEntryId = ref('')
const entryCondition = computed(()=>conditionForDate(entryDate.value))
const operationEntryFilters = reactive({ keyword:'', line:'', dateFrom:'', dateTo:'', status:'' })
const filteredOperationEntryRecords = computed(() => operationEntryRecords.filter(record => {
  const keyword = operationEntryFilters.keyword.trim().toLowerCase()
  if (keyword && ![record.siteName,record.siteCode,record.line,record.entryDate,record.scenario,record.updatedBy].some(value=>value.toLowerCase().includes(keyword))) return false
  if (operationEntryFilters.line && record.line!==operationEntryFilters.line) return false
  if (operationEntryFilters.dateFrom && record.entryDate<operationEntryFilters.dateFrom) return false
  if (operationEntryFilters.dateTo && record.entryDate>operationEntryFilters.dateTo) return false
  if (operationEntryFilters.status && record.status!==operationEntryFilters.status) return false
  return true
}).sort((a,b)=>b.entryDate.localeCompare(a.entryDate)))
const operationEntryPage = ref(1)
const operationEntryPageSize = ref(10)
const operationEntryPageCount = computed(()=>Math.max(1,Math.ceil(filteredOperationEntryRecords.value.length/operationEntryPageSize.value)))
const pagedOperationEntryRecords = computed(()=>{
  const start=(operationEntryPage.value-1)*operationEntryPageSize.value
  return filteredOperationEntryRecords.value.slice(start,start+operationEntryPageSize.value)
})
const operationEntryPageNumbers = computed(()=>{
  const total=operationEntryPageCount.value
  const start=Math.max(1,Math.min(operationEntryPage.value-2,total-4))
  return Array.from({length:Math.min(5,total)},(_,index)=>start+index)
})
const allPagedOperationEntriesSelected = computed(() => pagedOperationEntryRecords.value.length>0 && pagedOperationEntryRecords.value.every(record=>selectedOperationEntryIds.value.includes(record.id)))
const operationEntryImportInput = ref<HTMLInputElement|null>(null)
watch(()=>[operationEntryFilters.keyword,operationEntryFilters.line,operationEntryFilters.dateFrom,operationEntryFilters.dateTo,operationEntryFilters.status],()=>{operationEntryPage.value=1})
watch(operationEntryPageSize,()=>{operationEntryPage.value=1})
function persistOperationEntryRecords() { localStorage.setItem(operationEntryStorageKey,JSON.stringify(operationEntryRecords)) }
function replaceEntryValues(values: Record<string,string>) {
  Object.keys(entryValues).forEach(key=>delete entryValues[key])
  entryMetrics.value.forEach(metric=>{ entryValues[metricKey(metric)] = values[metricKey(metric)] || '' })
}
function newOperationEntry() {
  editingOperationEntryId.value=''; entryDate.value=new Date().toISOString().slice(0,10); diagnosisLine.value='一期生化线'
  replaceEntryValues({}); entrySavedAt.value='尚未保存'; activeEntryCategory.value=entryGroups.value[0]?.category||'进水水质'; operationEntryView.value='form'
}
function editOperationEntry(record?: OperationEntryRecord) {
  if(!record && selectedOperationEntryIds.value.length!==1){window.alert('请选择一条日报记录进行编辑');return}
  const target = record || operationEntryRecords.find(item=>selectedOperationEntryIds.value.includes(item.id))
  if (!target) { window.alert('请先选择一条日报记录'); return }
  if(target.status==='LOCKED'){window.alert('该日报已锁定，请先解锁后再编辑');return}
  editingOperationEntryId.value=target.id; entryDate.value=target.entryDate; diagnosisLine.value=target.line
  replaceEntryValues(target.values); entrySavedAt.value=target.updatedAt; activeEntryCategory.value=entryGroups.value[0]?.category||'进水水质'; operationEntryView.value='form'
}
function saveOperationEntry() {
  const sourceValues=Object.fromEntries(entryMetrics.value.map(metric=>[metricKey(metric),entryValues[metricKey(metric)]||'']))
  const existingForDay = operationEntryRecords.find(record=>record.line===diagnosisLine.value && record.entryDate===entryDate.value && record.id!==editingOperationEntryId.value)
  if (existingForDay?.status==='LOCKED') { window.alert('该工艺线在所选日期的日报已锁定，不能覆盖'); return }
  if (existingForDay && !window.confirm('该工艺线在所选日期已有日报，是否覆盖原记录？')) return
  const filled = Object.values(sourceValues).filter(value=>String(value).trim()).length
  const now = new Date().toLocaleString('zh-CN',{hour12:false})
  const record: OperationEntryRecord = {
    id: editingOperationEntryId.value || existingForDay?.id || `entry-${Date.now()}`,
    siteId:selectedSite.value, siteName:currentSite.value?.name||'第一污水处理厂（示例）', siteCode:currentSite.value?.code||'PS001',
    line:diagnosisLine.value, entryDate:entryDate.value, scenario:entryCondition.value?.name||'未匹配工况', values:sourceValues,
    status:filled===entryMetrics.value.length?'COMPLETED':'DRAFT', updatedBy:'平台管理员', updatedAt:now
  }
  const index=operationEntryRecords.findIndex(item=>item.id===record.id)
  if(index>=0) operationEntryRecords.splice(index,1,record); else operationEntryRecords.push(record)
  persistOperationEntryRecords()
  localStorage.setItem(`waterx-operation-entry-${diagnosisLine.value}-${entryDate.value}`, JSON.stringify(sourceValues))
  entrySavedAt.value=now; entryRevision.value++; selectedOperationEntryIds.value=[record.id]; operationEntryPage.value=1; operationEntryView.value='list'
}
function loadOperationEntry() {
  const record=operationEntryRecords.find(item=>item.line===diagnosisLine.value&&item.entryDate===entryDate.value)
  replaceEntryValues(record?.values || JSON.parse(localStorage.getItem(`waterx-operation-entry-${diagnosisLine.value}-${entryDate.value}`) || '{}'))
  editingOperationEntryId.value=record?.id||''; entrySavedAt.value=record?.updatedAt||'尚未保存'
}
function deleteOperationEntries(ids=selectedOperationEntryIds.value) {
  if(!ids.length){window.alert('请先选择要删除的日报记录');return}
  if(operationEntryRecords.some(record=>ids.includes(record.id)&&record.status==='LOCKED')){window.alert('所选日报中包含已锁定记录，请先解锁');return}
  if(!window.confirm(`确定删除已选择的 ${ids.length} 条日报吗？`))return
  ids.forEach(id=>{const index=operationEntryRecords.findIndex(item=>item.id===id);if(index>=0)operationEntryRecords.splice(index,1)})
  selectedOperationEntryIds.value=[];persistOperationEntryRecords();setOperationEntryPage(Math.min(operationEntryPage.value,operationEntryPageCount.value))
}
function toggleLockOperationEntries(){
  if(!selectedOperationEntryIds.value.length){window.alert('请先选择要锁定或解锁的日报记录');return}
  const records=operationEntryRecords.filter(record=>selectedOperationEntryIds.value.includes(record.id))
  const unlock=records.every(record=>record.status==='LOCKED')
  records.forEach(record=>{record.status=unlock?(Object.values(record.values).filter(Boolean).length===entryMetrics.value.length?'COMPLETED':'DRAFT'):'LOCKED'})
  persistOperationEntryRecords()
}
function toggleAllOperationEntries(checked:boolean){
  const pageIds=pagedOperationEntryRecords.value.map(record=>record.id)
  selectedOperationEntryIds.value=checked?[...new Set([...selectedOperationEntryIds.value,...pageIds])]:selectedOperationEntryIds.value.filter(id=>!pageIds.includes(id))
}
function resetOperationEntryFilters(){Object.assign(operationEntryFilters,{keyword:'',line:'',dateFrom:'',dateTo:'',status:''});operationEntryPage.value=1}
function setOperationEntryPage(page:number){operationEntryPage.value=Math.min(Math.max(1,page),operationEntryPageCount.value)}
function operationEntryMetricHeader(metric:DiagnosisMetric){
  const unit=metricDisplayUnit(metric)
  return `${metric.category}｜${metricDisplayName(metric)}${unit&&unit!=='—'?`（${unit}）`:''}`
}
async function exportOperationEntries(){
  if(!filteredOperationEntryRecords.value.length){window.alert('当前筛选条件下没有可导出的日报');return}
  const XLSX=await import('xlsx')
  const rows=filteredOperationEntryRecords.value.map(record=>{
    const row:Record<string,string>={
      '填报状态':statusText(record.status),'水厂名称':record.siteName,'水厂编号':record.siteCode,'工艺条线':record.line,
      '填报日期':record.entryDate,'匹配工况':record.scenario
    }
    entryMetrics.value.forEach(metric=>{row[operationEntryMetricHeader(metric)]=record.values[metricKey(metric)]||''})
    row['填报进度']=`${Object.values(record.values).filter(Boolean).length}/${entryMetrics.value.length}`
    row['填报人']=record.updatedBy;row['更新时间']=record.updatedAt
    return row
  })
  const worksheet=XLSX.utils.json_to_sheet(rows)
  worksheet['!cols']=Object.keys(rows[0]!).map(header=>({wch:Math.min(28,Math.max(12,header.length+3))}))
  const workbook=XLSX.utils.book_new();XLSX.utils.book_append_sheet(workbook,worksheet,'运行数据填报')
  XLSX.writeFile(workbook,`运行数据填报汇总-${new Date().toISOString().slice(0,10)}.xlsx`)
}
function chooseOperationEntryImport(){operationEntryImportInput.value?.click()}
function importCellText(value:unknown){return value===null||value===undefined?'':String(value).trim()}
function importEntryDate(value:unknown){
  if(value instanceof Date)return `${value.getFullYear()}-${String(value.getMonth()+1).padStart(2,'0')}-${String(value.getDate()).padStart(2,'0')}`
  if(typeof value==='number'){
    const parsed=new Date(Date.UTC(1899,11,30)+Math.floor(value)*86400000)
    return parsed.toISOString().slice(0,10)
  }
  const text=importCellText(value).replace(/[/.]/g,'-')
  const match=text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  return match?`${match[1]}-${match[2]!.padStart(2,'0')}-${match[3]!.padStart(2,'0')}`:''
}
async function importOperationEntries(event:Event){
  const input=event.target as HTMLInputElement
  const file=input.files?.[0]
  if(!file)return
  try{
    const XLSX=await import('xlsx')
    const workbook=XLSX.read(await file.arrayBuffer(),{type:'array',cellDates:true})
    const firstSheet=workbook.SheetNames[0]
    if(!firstSheet)throw new Error('Excel 文件中没有工作表')
    const rows=XLSX.utils.sheet_to_json<Record<string,unknown>>(workbook.Sheets[firstSheet]!,{defval:''})
    if(!rows.length)throw new Error('Excel 工作表中没有可导入的数据')
    const nameCounts=new Map<string,number>()
    entryMetrics.value.forEach(metric=>{const name=metricDisplayName(metric);nameCounts.set(name,(nameCounts.get(name)||0)+1)})
    let imported=0,skipped=0
    const errors:string[]=[]
    rows.forEach((row,rowIndex)=>{
      const line=importCellText(row['工艺条线']||row['工艺线'])
      const recordDate=importEntryDate(row['填报日期']||row['日期'])
      if(!line||!recordDate){errors.push(`第 ${rowIndex+2} 行缺少工艺条线或有效填报日期`);return}
      const siteName=importCellText(row['水厂名称'])||currentSite.value?.name||'第一污水处理厂（示例）'
      const existing=operationEntryRecords.find(record=>record.siteName===siteName&&record.line===line&&record.entryDate===recordDate)
      if(existing?.status==='LOCKED'){skipped++;return}
      const values:Record<string,string>={...(existing?.values||{})}
      entryMetrics.value.forEach(metric=>{
        const name=metricDisplayName(metric)
        const candidates=[operationEntryMetricHeader(metric),`${metric.category}｜${name}`,`${metric.category}-${name}`]
        if(nameCounts.get(name)===1)candidates.push(name)
        const matchedHeader=candidates.find(header=>Object.prototype.hasOwnProperty.call(row,header))
        if(matchedHeader)values[metricKey(metric)]=importCellText(row[matchedHeader])
        else if(!existing)values[metricKey(metric)]=''
      })
      const filled=entryMetrics.value.filter(metric=>importCellText(values[metricKey(metric)])).length
      const importedStatus=importCellText(row['填报状态']||row['状态'])
      const now=new Date().toLocaleString('zh-CN',{hour12:false})
      const condition=conditionForDate(recordDate)
      const record:OperationEntryRecord={
        id:existing?.id||`entry-import-${Date.now()}-${rowIndex}`,siteId:selectedSite.value,siteName,
        siteCode:importCellText(row['水厂编号'])||currentSite.value?.code||'PS001',line,entryDate:recordDate,
        scenario:condition?.name||'未匹配工况',values,
        status:/锁定/.test(importedStatus)?'LOCKED':filled===entryMetrics.value.length?'COMPLETED':'DRAFT',
        updatedBy:'批量导入',updatedAt:now
      }
      const index=operationEntryRecords.findIndex(item=>item.id===record.id)
      if(index>=0)operationEntryRecords.splice(index,1,record);else operationEntryRecords.push(record)
      localStorage.setItem(`waterx-operation-entry-${record.line}-${record.entryDate}`,JSON.stringify(values))
      imported++
    })
    persistOperationEntryRecords();entryRevision.value++;operationEntryPage.value=1
    window.alert(`批量导入完成：成功 ${imported} 条，跳过已锁定 ${skipped} 条，格式错误 ${errors.length} 条${errors.length?`\n${errors.slice(0,3).join('\n')}`:''}`)
  }catch(error){window.alert(`导入失败：${error instanceof Error?error.message:'无法读取 Excel 文件'}`)}
  finally{input.value=''}
}
function statusText(status:OperationEntryRecord['status']){return status==='COMPLETED'?'已完成':status==='LOCKED'?'已锁定':'草稿'}
function numericValue(value: string | undefined) { const match = value?.replace(/,/g,'').match(/-?\d+(\.\d+)?/); return match ? Number(match[0]) : null }
function evaluateMetricStatus(metric:DiagnosisMetric,target:string,actual:string){
  const actualNumber=numericValue(actual), rule=settingFor(metric)
  if(actualNumber===null)return {deviation:metric.deviation,level:metric.level}
  const range=target.replace(/\s/g,'').match(/(-?\d+(?:\.\d+)?)\s*[～~-]\s*(-?\d+(?:\.\d+)?)/)
  let deviation: number|null = null
  if(range){const low=Number(range[1]!),high=Number(range[2]!);deviation=actualNumber<low?(actualNumber-low)/low*100:actualNumber>high?(actualNumber-high)/high*100:0}
  else {const bound=numericValue(target);if(bound===null||bound===0)return {deviation:metric.deviation,level:metric.level};deviation=(actualNumber-bound)/bound*100;if(target.includes('≥')&&actualNumber>=bound)deviation=0;if(target.includes('≤')&&actualNumber<=bound)deviation=0}
  const distance=rule.mode==='UPPER'?Math.max(0,deviation):rule.mode==='LOWER'?Math.max(0,-deviation):Math.abs(deviation)
  const level:DiagnosisLevel=distance<=rule.healthyPct?'normal':distance<=rule.warningPct?'warning':'alarm'
  return {deviation,level}
}
const analysisRows = computed<DiagnosisMetric[]>(() => {
  entryRevision.value
  const plan = diagnosisCondition.value
  const savedActuals = JSON.parse(localStorage.getItem(`waterx-operation-entry-${diagnosisLine.value}-${diagnosisDate.value}`) || '{}') as Record<string,string>
  return visibleDiagnosisMetrics.value.map(metric => {
    const key = metricKey(metric)
    const design = designValueFor(metric)
    const actual = savedActuals[key] || metric.actual
    if(!plan)return { ...metric,design,target:'—',actual,deviation:null,level:'warning' }
    const target = plan.targets[key] || metric.target
    const {deviation,level}=evaluateMetricStatus(metric,target,actual)
    return { ...metric, design, target, actual, deviation, level }
  })
})
const expandedDiagnosisCategories = ref<Record<string,boolean>>({ '污泥性状': true })
const analysisGroups = computed(() => resultCategories.map(category => ({ category, metrics:analysisRows.value.filter(metric=>metric.category===category) })).filter(group=>group.metrics.length))
function toggleDiagnosisCategory(category: string) { expandedDiagnosisCategories.value[category] = !expandedDiagnosisCategories.value[category] }
type ControlIndicator = { code?: string; name: string; unit: string; design?: string; target: string; actual: string; deviation: number | null; level: DiagnosisLevel; meaning?: string }
type ControlGroup = { key: string; title: string; level: DiagnosisLevel; indicators: ControlIndicator[] }
const expandedControlGroups = ref<Record<string, boolean>>({})
const rawControlGroups: ControlGroup[] = [
  { key: 'water', title: '水量与停留时间', level: 'normal', indicators: [
    { name: '设计处理水量', unit: '万m³/d', design: '7.00', target: '7.00', actual: '7.00', deviation: 0, level: 'normal', meaning: '设计文件确定的工艺线处理规模' },
    { name: '生化池设计组数', unit: '组', design: '2', target: '2', actual: '2', deviation: 0, level: 'normal' },
    { name: '二沉池设计组数', unit: '组', design: '4', target: '4', actual: '4', deviation: 0, level: 'normal' },
    { name: '厌氧段有效池容', unit: '万m³', design: '0.71', target: '0.71', actual: '0.71', deviation: 0, level: 'normal' },
    { name: '缺氧段有效池容', unit: '万m³', design: '0.85', target: '0.85', actual: '0.85', deviation: 0, level: 'normal' },
    { name: '好氧段有效池容', unit: '万m³', design: '1.75', target: '1.75', actual: '1.75', deviation: 0, level: 'normal' },
    { name: '二沉池有效池容', unit: '万m³', design: '1.37', target: '1.37', actual: '1.37', deviation: 0, level: 'normal' },
    { name: '设计最低水温', unit: '℃', design: '12', target: '≥12', actual: '13.6', deviation: null, level: 'normal' },
    { name: '日进水量', unit: '万m³/d', target: '7.00', actual: '6.82', deviation: -2.6, level: 'normal' }, { name: '水量负荷率', unit: '%', target: '93.3', actual: '90.9', deviation: -2.6, level: 'normal' },
    { name: '厌氧段HRT', unit: 'h', target: '1.6', actual: '1.7', deviation: 6.3, level: 'normal' }, { name: '缺氧段HRT', unit: 'h', target: '3.2', actual: '3.4', deviation: 6.3, level: 'normal' },
    { name: '好氧段HRT', unit: 'h', target: '7.5', actual: '7.8', deviation: 4.0, level: 'normal' }, { name: '总HRT', unit: 'h', target: '15.0', actual: '15.6', deviation: 4.0, level: 'normal' }
  ] },
  { key: 'air', title: '曝气控制', level: 'warning', indicators: [
    { name: '曝气器类型', unit: '文本', design: '盘式微孔', target: '盘式微孔', actual: '盘式微孔', deviation: null, level: 'normal' },
    { name: '曝气膜片尺寸', unit: 'mm', design: 'φ300', target: 'φ300', actual: 'φ300', deviation: null, level: 'normal' },
    { name: '曝气膜片材质', unit: '文本', design: '三元乙丙橡胶', target: '三元乙丙橡胶', actual: '三元乙丙橡胶', deviation: null, level: 'normal' },
    { name: '曝气器总安装数量', unit: '个', design: '16955', target: '16955', actual: '16955', deviation: 0, level: 'normal' },
    { name: '曝气器浸没水深', unit: 'm', design: '5.8', target: '5.8', actual: '5.8', deviation: 0, level: 'normal' },
    { name: '风机额定风量', unit: 'Nm³/min', design: '250', target: '≤250', actual: '90', deviation: null, level: 'normal' },
    { name: '风机额定出口升压', unit: 'kPa', design: '70', target: '≤70', actual: '68', deviation: null, level: 'normal' },
    { name: '好氧段DO', unit: 'mg/L', target: '1.5～2.5', actual: '1.35', deviation: -10.0, level: 'warning' }, { name: '运行风机', unit: '台', target: '2', actual: '2', deviation: 0, level: 'normal' },
    { name: '日曝气量', unit: '万Nm³', target: '16.5', actual: '15.8', deviation: -4.2, level: 'normal' }, { name: '主管压力', unit: 'kPa', target: '65', actual: '61', deviation: -6.2, level: 'normal' },
    { name: '风机运行时长', unit: 'h', target: '48', actual: '46', deviation: -4.2, level: 'normal' }, { name: '单位水量曝气量', unit: 'Nm³/m³', target: '2.36', actual: '2.32', deviation: -1.7, level: 'normal' },
    { name: '实际运行风量', unit: 'Nm³/min', target: '85～100', actual: '90', deviation: null, level: 'normal' },
    { name: '当前气水比', unit: '—', target: '5～7', actual: '6.4', deviation: null, level: 'normal' },
    { name: '当前曝气电单耗', unit: 'kWh/m³', target: '≤0.080', actual: '0.076', deviation: null, level: 'normal' },
    { name: '曝气电单耗基线', unit: 'kWh/m³', target: '≤0.075', actual: '0.072', deviation: null, level: 'normal' },
    { name: '曝气电单耗基线偏离度', unit: '%', target: '≤10', actual: '5.6', deviation: null, level: 'normal' },
    { name: '当前风机出口升压', unit: 'kPa', target: '≤70', actual: '68', deviation: null, level: 'normal' },
    { name: '膜片堵塞率', unit: '%', target: '≤20', actual: '14.3', deviation: null, level: 'normal' }
  ] },
  { key: 'inner', title: '内回流控制', level: 'warning', indicators: [
    { name: '内回流量', unit: '万m³/d', target: '12.60', actual: '9.75', deviation: -22.6, level: 'warning' }, { name: '内回流比', unit: '%', target: '180', actual: '143', deviation: -20.6, level: 'warning' },
    { name: '运行泵', unit: '台', target: '2', actual: '2', deviation: 0, level: 'normal' }, { name: '平均频率', unit: 'Hz', target: '42', actual: '36', deviation: -14.3, level: 'warning' }
  ] },
  { key: 'outer', title: '外回流控制', level: 'normal', indicators: [
    { name: '外回流量', unit: '万m³/d', target: '5.60', actual: '5.59', deviation: -0.2, level: 'normal' }, { name: '外回流比', unit: '%', target: '70～100', actual: '82', deviation: null, level: 'normal' },
    { name: '回流污泥浓度', unit: 'g/L', target: '7.5～9.0', actual: '7.8', deviation: null, level: 'normal' }, { name: '运行泵', unit: '台', target: '2', actual: '2', deviation: 0, level: 'normal' }
  ] },
  { key: 'sludge', title: '排泥控制', level: 'warning', indicators: [
    { name: '日排泥量', unit: 'm³/d', target: '500', actual: '420', deviation: -16.0, level: 'warning' }, { name: '排泥次数', unit: '次/d', target: '4', actual: '4', deviation: 0, level: 'normal' },
    { name: '排泥污泥浓度', unit: 'g/L', target: '8.0～10.0', actual: '8.6', deviation: null, level: 'normal' }, { name: '估算SRT', unit: 'd', target: '18', actual: '12.5', deviation: -30.6, level: 'warning' }
  ] },
  { key: 'chemical', title: '加药控制', level: 'normal', indicators: [
    { name: '碳源投加量', unit: 't/d', target: '3.0～3.5', actual: '3.2', deviation: null, level: 'normal' }, { name: '除磷药剂量', unit: 't/d', target: '1.0～1.2', actual: '1.1', deviation: null, level: 'normal' },
    { name: '吨水药耗', unit: 'kg/m³', target: '0.060', actual: '0.063', deviation: 5.0, level: 'normal' }, { name: '投加泵运行', unit: '台', target: '2', actual: '2', deviation: 0, level: 'normal' },
    { name: '碳源名称', unit: '文本', target: '乙酸钠', actual: '乙酸钠', deviation: null, level: 'normal' },
    { name: '碳源溶液纯度', unit: '%', target: '≥20', actual: '20', deviation: 0, level: 'normal' },
    { name: '碳源投加单耗', unit: 'mg/L', target: '按碳氮平衡', actual: '18.5', deviation: null, level: 'normal' },
    { name: '混凝剂名称', unit: '文本', target: 'PAC', actual: 'PAC', deviation: null, level: 'normal' },
    { name: '混凝剂浓度', unit: '%', target: '10', actual: '10', deviation: 0, level: 'normal' },
    { name: '混凝剂投加单耗', unit: 'mg/L', target: '≤20', actual: '18', deviation: null, level: 'normal' },
    { name: '碳源折合COD投加量', unit: 'mg/L', target: '按工况核算', actual: '32.0', deviation: null, level: 'normal' },
    { name: '理论碳源投加量', unit: 't/d', target: '按工况核算', actual: '2.9', deviation: null, level: 'normal' },
    { name: '理论出水碱度', unit: 'mg/L', target: '≥80', actual: '92', deviation: null, level: 'normal' },
    { name: '需补充碱度', unit: 'mg/L', target: '0', actual: '0', deviation: 0, level: 'normal' }
  ] },
  { key: 'mix', title: '搅拌控制', level: 'normal', indicators: [
    { name: '运行搅拌器', unit: '台', target: '6', actual: '6', deviation: 0, level: 'normal' }, { name: '平均运行率', unit: '%', target: '80～90', actual: '83', deviation: null, level: 'normal' },
    { name: '日运行时长', unit: 'h', target: '20', actual: '19.9', deviation: -0.5, level: 'normal' }, { name: '异常设备', unit: '台', target: '0', actual: '0', deviation: 0, level: 'normal' }
  ] },
  { key: 'mbbr', title: 'MBBR填料运行', level: 'normal', indicators: [
    { name: 'MBBR填料区池容', unit: 'm³', design: '17604', target: '17604', actual: '17604', deviation: 0, level: 'normal' },
    { name: '填料比表面积', unit: 'm²/m³', design: '500', target: '500', actual: '500', deviation: 0, level: 'normal' },
    { name: '投加填料总体积', unit: 'm³', design: '5423', target: '5423', actual: '5423', deviation: 0, level: 'normal' },
    { name: '填料投加位置', unit: '文本', design: '好氧段前/中/后部', target: '按设计', actual: '好氧段中部', deviation: null, level: 'normal' },
    { name: '单个填料干重', unit: 'g', design: '0.831', target: '0.831', actual: '0.831', deviation: 0, level: 'normal' },
    { name: '单个填料体积', unit: 'cm³', design: '4.906', target: '4.906', actual: '4.906', deviation: 0, level: 'normal' },
    { name: '曝气流化风量', unit: 'm³/min', target: '550～650', actual: '600', deviation: null, level: 'normal' },
    { name: '填料区溶解氧', unit: 'mg/L', target: '1.0～2.0', actual: '1.3', deviation: null, level: 'normal' },
    { name: '填料区游离污泥MLSS', unit: 'mg/L', target: '5500～7500', actual: '6670', deviation: null, level: 'normal' },
    { name: '填料区游离污泥MLVSS', unit: 'mg/L', target: '3000～4500', actual: '3670', deviation: null, level: 'normal' },
    { name: '填料投加容积比', unit: '%', target: '25～35', actual: '30.8', deviation: null, level: 'normal' },
    { name: '曝气流化气水比', unit: '—', target: '4～6', actual: '4.3', deviation: null, level: 'normal' },
    { name: 'MBBR系统电单耗', unit: 'kWh/m³', target: '≤0.15', actual: '0.121', deviation: null, level: 'normal' },
    { name: '填料折合总污泥浓度', unit: 'mg/L', target: '≥7000', actual: '8460', deviation: null, level: 'normal' },
    { name: '填料表面硝化负荷', unit: 'gNH₃-N/(m²·d)', target: '按设计校核', actual: '0.43', deviation: null, level: 'normal' }
  ] }
]
const mbbrProcessNames = ['MBBR填料区池容','填料比表面积','投加填料总体积','填料投加位置','单个填料干重','单个填料体积','曝气流化风量','填料区溶解氧','填料投加容积比','曝气流化气水比','MBBR系统电单耗','填料表面硝化负荷']
const rawGroup = (key: string) => rawControlGroups.find(group=>group.key===key)!
const controlGroups: ControlGroup[] = [
  { ...rawGroup('water'), title:'水量控制' },
  { ...rawGroup('air'), indicators:[...rawGroup('air').indicators,...rawGroup('mbbr').indicators.filter(item=>mbbrProcessNames.includes(item.name))] },
  { key:'recycle', title:'回流控制', level:'warning', indicators:[
    ...rawGroup('inner').indicators.map(item=>({...item,name:item.name==='运行泵'?'内回流运行泵':item.name==='平均频率'?'内回流平均频率':item.name})),
    ...rawGroup('outer').indicators.map(item=>({...item,name:item.name==='运行泵'?'外回流运行泵':item.name}))
  ] },
  rawGroup('sludge'), rawGroup('chemical'), rawGroup('mix')
].map(group=>({...group,level:group.indicators.some(item=>item.level==='alarm')?'alarm':group.indicators.some(item=>item.level==='warning')?'warning':'normal'} as ControlGroup))
const builtInProcessMetrics = computed<DiagnosisMetric[]>(() => controlGroups.flatMap(group => group.indicators.map(indicator => ({ category:group.title, name:indicator.name, unit:indicator.unit, design:indicator.design||'—', target:indicator.target, actual:indicator.actual, deviation:indicator.deviation, level:indicator.level, meaning:indicator.meaning||`${group.title}过程控制指标` }))))
const allManagedMetrics = computed(() => [...allDiagnosisMetrics.value, ...builtInProcessMetrics.value, ...customProcessMetrics])
const moduleConfigMetrics = computed(() => {
  const module = activeModuleMetricManager.value
  if (!module) return []
  const keyword = moduleMetricSearch.value.trim().toLowerCase()
  return allManagedMetrics.value
    .filter(metric => module!=='entry' || !defaultFormulaFor(metric))
    .filter(metric => !activeMetricBoard.value || metric.category===activeMetricBoard.value)
    .filter(metric => !keyword || `${metric.category} ${metric.name} ${metric.meaning}`.toLowerCase().includes(keyword))
})
function metricCode(metric: Pick<DiagnosisMetric,'category'|'name'> & Partial<Pick<DiagnosisMetric,'code'>>) {
  if (metric.code) return metric.code
  const prefix = metricCategoryPrefixes[metric.category] || 'GEN'
  const siblings = allManagedMetrics.value.filter(item => item.category===metric.category)
  const index = siblings.findIndex(item => metricKey(item)===metricKey(metric))
  return `${prefix}-${String(Math.max(1,index+1)).padStart(3,'0')}`
}
function nextMetricCode(category: string) {
  const prefix = metricCategoryPrefixes[category] || 'GEN'
  const numbers = allManagedMetrics.value.filter(item=>item.category===category).map(item=>Number(metricCode(item).split('-').at(-1))).filter(Number.isFinite)
  return `${prefix}-${String((numbers.length ? Math.max(...numbers) : 0)+1).padStart(3,'0')}`
}
const newMetricCodePreview = computed(() => nextMetricCode(newMetricForm.category))
const displayControlGroups = computed<ControlGroup[]>(() => controlGroups.map(group => ({ ...group, indicators:[...group.indicators, ...customProcessMetrics.filter(metric=>metric.category===group.title).map(metric=>({code:metric.code,name:metric.name,unit:metric.unit,target:metric.target,actual:metric.actual,deviation:metric.deviation,level:metric.level}))].filter(indicator=>isMetricEnabledInModule({category:group.title,name:indicator.name},'diagnosis')) })))
const activeResultCategory = ref('进水水质')
const activeAnalysisGroup = computed(()=>analysisGroups.value.find(group=>group.category===activeResultCategory.value)||analysisGroups.value[0])
const activeControlGroupKey = ref('water')
const activeControlGroup = computed(()=>displayControlGroups.value.find(group=>group.key===activeControlGroupKey.value)||displayControlGroups.value[0])
function statusCounts(items: Array<{level:DiagnosisLevel}>) { return { normal:items.filter(item=>item.level==='normal').length, warning:items.filter(item=>item.level==='warning').length, alarm:items.filter(item=>item.level==='alarm').length } }
type ProcessAnalysisReport = {
  id:string; siteName:string; line:string; reportDate:string; scenario:string
  normalCount?:number; warningCount?:number; alarmCount?:number
  values?:Record<string,string>; updatedAt:string
}
const processReportStorageKey='waterx-process-analysis-reports'
const processReports=reactive<ProcessAnalysisReport[]>(JSON.parse(localStorage.getItem(processReportStorageKey)||'[]'))
const processReportFilters=reactive({keyword:'',dateFrom:'',dateTo:''})
const filteredProcessReports=computed(()=>processReports.filter(record=>{
  const keyword=processReportFilters.keyword.trim().toLowerCase()
  if(keyword && !`${record.siteName} ${record.line} ${record.scenario}`.toLowerCase().includes(keyword))return false
  if(processReportFilters.dateFrom&&record.reportDate<processReportFilters.dateFrom)return false
  if(processReportFilters.dateTo&&record.reportDate>processReportFilters.dateTo)return false
  return true
}).sort((a,b)=>b.reportDate.localeCompare(a.reportDate)))
function persistProcessReports(){localStorage.setItem(processReportStorageKey,JSON.stringify(processReports))}
function deleteMetricFromBoard(metric: DiagnosisMetric) {
  const customCollection = processCategories.includes(metric.category) ? customProcessMetrics : customMetrics
  const index = customCollection.findIndex(item=>metricKey(item)===metricKey(metric))
  if(index>=0) {
    customCollection.splice(index,1)
    localStorage.setItem(processCategories.includes(metric.category)?'waterx-custom-process-metrics':'waterx-custom-diagnosis-metrics',JSON.stringify(customCollection))
  } else settingFor(metric).hidden=true
  setMetricEnabledInModule(metric,activeModuleMetricManager.value,false)
}
function refreshDiagnosis() {
  diagnosisUpdatedAt.value = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}
function saveDiagnosisReport() {
  if (!diagnosisDate.value) { window.alert('请选择分析日期'); return }
  const counts = statusCounts(analysisRows.value)
  const siteName = currentSite.value?.name || '第一污水处理厂（示例）'
  const existing = processReports.find(record => record.siteName===siteName && record.line===diagnosisLine.value && record.reportDate===diagnosisDate.value)
  const now = new Date()
  const record:ProcessAnalysisReport = {
    id: existing?.id || `process-report-${Date.now()}`,
    siteName,
    line: diagnosisLine.value,
    reportDate: diagnosisDate.value,
    scenario: diagnosisScenario.value,
    normalCount: counts.normal,
    warningCount: counts.warning,
    alarmCount: counts.alarm,
    values: Object.fromEntries(analysisRows.value.map(metric => [metricKey(metric), metric.actual])),
    updatedAt: now.toLocaleString('zh-CN', { hour12:false })
  }
  const index = processReports.findIndex(item=>item.id===record.id)
  if (index>=0) processReports.splice(index,1,record)
  else processReports.push(record)
  persistProcessReports()
  diagnosisUpdatedAt.value = now.toLocaleTimeString('zh-CN', { hour:'2-digit', minute:'2-digit' })
  window.alert(existing ? '已更新工艺分析日报' : '已保存至工艺分析日报')
}
function deviationWidth(value: number | null) {
  if (value === null) return '0%'
  return `${Math.min(100, Math.max(8, Math.abs(value)))}%`
}

const currentSite = computed(() => sites.value.find(s => s.id === selectedSite.value))
function ensureOperationEntryRecords() {
  const stored = JSON.parse(localStorage.getItem(operationEntryStorageKey) || 'null') as OperationEntryRecord[] | null
  if (stored?.length) {
    stored.forEach(record=>{
      if(record.id.startsWith('demo-entry-'))record.scenario=conditionForDate(record.entryDate)?.name||'未匹配工况'
    })
    operationEntryRecords.splice(0,operationEntryRecords.length,...stored)
    persistOperationEntryRecords()
    return
  }
  const baseDate = new Date()
  const seeded = Array.from({length:7},(_,index)=>{
    const date = new Date(baseDate); date.setDate(baseDate.getDate()-index)
    const entryDate=date.toISOString().slice(0,10)
    const values = Object.fromEntries(entryMetrics.value.map((metric,metricIndex)=>{
      const raw=metric.actual||''; const number=numericValue(raw)
      return [metricKey(metric),number===null?raw:String(Number((number*(1+(index-3)*0.006+(metricIndex%3)*0.002)).toFixed(3)))]
    }))
    return {
      id:`demo-entry-${entryDate}`,siteId:selectedSite.value,siteName:'第一污水处理厂（示例）',siteCode:'PS001',
      line:index===5?'二期生化线':'一期生化线',entryDate,scenario:conditionForDate(entryDate)?.name||'未匹配工况',values,
      status:(index===0?'DRAFT':index===6?'LOCKED':'COMPLETED') as OperationEntryRecord['status'],updatedBy:index%2?'运行部经理':'值班运行员',updatedAt:`${date.toISOString().slice(0,10)} ${index%2?'17:35':'08:20'}`
    }
  })
  operationEntryRecords.push(...seeded); persistOperationEntryRecords()
}
ensureOperationEntryRecords()

type LabRecordType = 'COD'|'NH3'|'SS'|'FC'
type LabSampleRow = { source:string; name:string; volume:string; dilution:string; start:string; end:string; absorbance:string; containerNo:string; tareFirst:string; tareSecond:string; loadedFirst:string; loadedSecond:string; medium:string; plateNo:string; colonyCount:string }
type LabOriginalRecord = {
  id:string; type:LabRecordType; locked:boolean; recordNo:string; roomTemperature:string; humidity:string; sampleDate:string; testDate:string; analyst:string; reviewer:string; notes:string
  c1:string; standardVolume:string; standardStart1:string; standardEnd1:string; standardStart2:string; standardEnd2:string; blankStart:string; blankEnd:string
  instrumentModel:string; wavelength:string; referenceSolution:string; standardSolution:string; curveSlope:string; curveIntercept:string; a0:string
  dryingTemperature:string; cultureTemperature:string; cultureTime:string; defaultMedium:string
  samples:LabSampleRow[]; updatedAt:string
}
const labRecordStorageKey='waterx-lab-original-records'
const labRecordView=ref<'folders'|'list'|'form'>('folders')
const labRecordType=ref<LabRecordType>('COD')
const labRecordSelectedId=ref('')
const labRecordFilters=reactive({keyword:'',dateFrom:'',dateTo:'',locked:''})
const labFolders=[{type:'COD' as const,name:'COD原始记录',method:'容量法 · HJ 828—2017',icon:'COD'},{type:'NH3' as const,name:'氨氮检测记录',method:'分光光度法 · HJ 535—2009',icon:'NH₃-N'},{type:'SS' as const,name:'SS原始记录',method:'重量法 · GB 11901—89',icon:'SS'},{type:'FC' as const,name:'粪大肠菌群记录',method:'滤膜法 · HJ 347.1—2018',icon:'FC'}]
function emptyLabSample(type:LabRecordType):LabSampleRow{
  const base={source:'第一污水处理厂（示例）',name:'进水口',volume:'10',dilution:'1',start:'',end:'',absorbance:'',containerNo:'1',tareFirst:'',tareSecond:'',loadedFirst:'',loadedSecond:'',medium:'MFC',plateNo:'1',colonyCount:''}
  if(type==='COD')return{...base,start:'0.00',end:'21.10'}
  if(type==='NH3')return{...base,name:'出水口',volume:'2.00',absorbance:'0.203'}
  if(type==='SS')return{...base,volume:'100.0',tareFirst:'0.0678',tareSecond:'0.0677',loadedFirst:'0.0741',loadedSecond:'0.0740'}
  return{...base,volume:'20.00',colonyCount:'1'}
}
function createLabRecordModel(type:LabRecordType,date=new Date().toISOString().slice(0,10)):LabOriginalRecord{
  return {id:`lab-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,type,locked:false,recordNo:`${type}-${date.replaceAll('-','')}-01`,roomTemperature:'23',humidity:'48',sampleDate:date,testDate:date,analyst:'运行工01',reviewer:'',notes:'',
    c1:'0.2500',standardVolume:'5.00',standardStart1:'0.00',standardEnd1:'25.10',standardStart2:'0.00',standardEnd2:'24.90',blankStart:'0.00',blankEnd:'24.50',
    instrumentModel:'TU1900',wavelength:'420',referenceSolution:'去离子水',standardSolution:'氯化铵标准溶液10μg氨氮/mL',curveSlope:'0.006530',curveIntercept:'0.003170',a0:'0.020',dryingTemperature:'103～105',cultureTemperature:'44.5',cultureTime:'24±2',defaultMedium:'m-FC',samples:[emptyLabSample(type)],updatedAt:new Date().toLocaleString('zh-CN',{hour12:false})}
}
const labOriginalRecords=reactive<LabOriginalRecord[]>([])
const storedLabRecords=JSON.parse(localStorage.getItem(labRecordStorageKey)||'null') as LabOriginalRecord[]|null
if(storedLabRecords?.length)labOriginalRecords.push(...storedLabRecords);else{
  const cod=createLabRecordModel('COD','2026-08-15');cod.id='lab-demo-cod-1';cod.recordNo='COD-20260815-01';cod.updatedAt='2026-08-15 16:30'
  const ammonia=createLabRecordModel('NH3','2026-08-15');ammonia.id='lab-demo-nh3-1';ammonia.recordNo='NH3-20260815-01';ammonia.updatedAt='2026-08-15 17:10'
  labOriginalRecords.push(cod,ammonia);localStorage.setItem(labRecordStorageKey,JSON.stringify(labOriginalRecords))
}
if(!labOriginalRecords.some(record=>record.type==='SS')){const ss=createLabRecordModel('SS','2026-08-15');ss.id='lab-demo-ss-1';ss.recordNo='SS-20260815-01';ss.updatedAt='2026-08-15 17:25';labOriginalRecords.push(ss)}
if(!labOriginalRecords.some(record=>record.type==='FC')){const fc=createLabRecordModel('FC','2026-08-15');fc.id='lab-demo-fc-1';fc.recordNo='FC-20260815-01';fc.updatedAt='2026-08-15 18:05';labOriginalRecords.push(fc)}
localStorage.setItem(labRecordStorageKey,JSON.stringify(labOriginalRecords))
const labRecordForm=ref<LabOriginalRecord>(createLabRecordModel('COD'))
const filteredLabRecords=computed(()=>labOriginalRecords.filter(record=>record.type===labRecordType.value).filter(record=>{
  const keyword=labRecordFilters.keyword.trim().toLowerCase();if(keyword&&![record.recordNo,record.analyst,record.reviewer,...record.samples.flatMap(row=>[row.source,row.name])].some(value=>value.toLowerCase().includes(keyword)))return false
  if(labRecordFilters.dateFrom&&record.testDate<labRecordFilters.dateFrom)return false;if(labRecordFilters.dateTo&&record.testDate>labRecordFilters.dateTo)return false
  if(labRecordFilters.locked==='locked'&&!record.locked)return false;if(labRecordFilters.locked==='unlocked'&&record.locked)return false;return true
}).sort((a,b)=>b.testDate.localeCompare(a.testDate)))
const selectedLabRecord=computed(()=>labOriginalRecords.find(record=>record.id===labRecordSelectedId.value)||filteredLabRecords.value[0])
function labNumber(value:string){const number=Number(value);return Number.isFinite(number)?number:0}
function volumeUsed(row:{start:string;end:string}){return Math.max(0,labNumber(row.end)-labNumber(row.start))}
function codStandardAverage(record:LabOriginalRecord){return (volumeUsed({start:record.standardStart1,end:record.standardEnd1})+volumeUsed({start:record.standardStart2,end:record.standardEnd2}))/2}
function codC2(record:LabOriginalRecord){const average=codStandardAverage(record);return average?labNumber(record.c1)*labNumber(record.standardVolume)/average:0}
function codResult(record:LabOriginalRecord,row:LabSampleRow){const volume=labNumber(row.volume);return volume?codC2(record)*(volumeUsed({start:record.blankStart,end:record.blankEnd})-volumeUsed(row))*labNumber(row.dilution)*8000/volume:0}
function ammoniaMass(record:LabOriginalRecord,row:LabSampleRow){const slope=labNumber(record.curveSlope);return slope?(labNumber(row.absorbance)-labNumber(record.curveIntercept))/slope:0}
function ammoniaResult(record:LabOriginalRecord,row:LabSampleRow){const volume=labNumber(row.volume);return volume?ammoniaMass(record,row)*labNumber(row.dilution)/volume:0}
function stableWeight(first:string,second:string){return labNumber(second||first)}
function ssNetWeight(row:LabSampleRow){return stableWeight(row.loadedFirst,row.loadedSecond)-stableWeight(row.tareFirst,row.tareSecond)}
function ssResult(row:LabSampleRow){const volume=labNumber(row.volume);return volume?ssNetWeight(row)*1000000/volume:0}
function fecalColiformResult(row:LabSampleRow){const volume=labNumber(row.volume);return volume?labNumber(row.colonyCount)*1000*labNumber(row.dilution)/volume:0}
function labResult(record:LabOriginalRecord,row:LabSampleRow){if(record.type==='COD')return codResult(record,row);if(record.type==='NH3')return ammoniaResult(record,row);if(record.type==='SS')return ssResult(row);return fecalColiformResult(row)}
function formatTwoDigitScientific(value:number){if(value<100)return String(Math.round(value));const exponent=Math.floor(Math.log10(value));const mantissa=Number((value/10**exponent).toPrecision(2));return `${mantissa}×10^${exponent}`}
function formatLabResult(record:LabOriginalRecord,row:LabSampleRow){const value=labResult(record,row);if(record.type==='NH3')return value.toFixed(3);if(record.type==='FC')return formatTwoDigitScientific(value);return value<100?String(Math.round(value)):String(Number(value.toPrecision(3)))}
function labRecordTitle(type:LabRecordType){return type==='COD'?'COD 容量法原始记录':type==='NH3'?'氨氮（分光光度法）检测记录':type==='SS'?'SS 重量法原始记录':'粪大肠菌群（滤膜法）检测记录'}
function labTypeShort(type:LabRecordType){return type==='COD'?'CODcr':type==='NH3'?'NH₃-N':type==='SS'?'SS':'粪大肠菌群'}
function labListParameter(record:LabOriginalRecord,index:1|2){if(record.type==='COD')return index===1?`C2 ${codC2(record).toFixed(6)}`:`V标均 ${codStandardAverage(record).toFixed(2)}`;if(record.type==='NH3')return index===1?`仪器 ${record.instrumentModel}`:`波长 ${record.wavelength} nm`;if(record.type==='SS')return index===1?`干燥 ${record.dryingTemperature}℃`:`样品 ${record.samples.length} 个`;return index===1?`培养 ${record.cultureTemperature}℃`:`${record.cultureTime} h`}
function persistLabRecords(){localStorage.setItem(labRecordStorageKey,JSON.stringify(labOriginalRecords))}
function openLabFolder(type:LabRecordType){labRecordType.value=type;labRecordSelectedId.value='';labRecordView.value='list'}
function newLabRecord(){labRecordForm.value=createLabRecordModel(labRecordType.value);labRecordView.value='form'}
function editLabRecord(record=selectedLabRecord.value){if(!record)return;if(record.locked){window.alert('该原始记录已锁定，请先解锁');return}labRecordForm.value=JSON.parse(JSON.stringify(record));labRecordView.value='form'}
function saveLabRecord(){const form=labRecordForm.value;const sameDay=labOriginalRecords.find(record=>record.type===form.type&&record.testDate===form.testDate&&record.id!==form.id);if(sameDay){if(!window.confirm('该检测项目在所选日期已有原始记录，是否覆盖原记录？'))return;form.id=sameDay.id}form.updatedAt=new Date().toLocaleString('zh-CN',{hour12:false});const index=labOriginalRecords.findIndex(record=>record.id===form.id);if(index>=0)labOriginalRecords.splice(index,1,JSON.parse(JSON.stringify(form)));else labOriginalRecords.push(JSON.parse(JSON.stringify(form)));persistLabRecords();labRecordSelectedId.value=form.id;labRecordView.value='list'}
function deleteLabRecord(){const record=selectedLabRecord.value;if(!record)return;if(record.locked){window.alert('该原始记录已锁定，请先解锁');return}if(!window.confirm(`确定删除原始记录 ${record.recordNo} 吗？`))return;const index=labOriginalRecords.findIndex(item=>item.id===record.id);if(index>=0)labOriginalRecords.splice(index,1);labRecordSelectedId.value='';persistLabRecords()}
function toggleLabRecordLock(){const record=selectedLabRecord.value;if(!record)return;record.locked=!record.locked;persistLabRecords()}
function resetLabRecordFilters(){Object.assign(labRecordFilters,{keyword:'',dateFrom:'',dateTo:'',locked:''})}
function addLabSampleRow(){labRecordForm.value.samples.push(emptyLabSample(labRecordForm.value.type))}
function deleteLabSampleRow(index:number){if(labRecordForm.value.samples.length===1){window.alert('至少保留一行样品记录');return}labRecordForm.value.samples.splice(index,1)}
function exportLabRecord(record=selectedLabRecord.value){
  if(!record)return;const rows=record.samples.map(row=>`<tr><td>${row.source}</td><td>${row.name}</td><td>${row.volume}</td><td>${row.dilution}</td><td>${record.type==='COD'?volumeUsed(row).toFixed(2):record.type==='NH3'?row.absorbance:record.type==='SS'?ssNetWeight(row).toFixed(4):row.colonyCount}</td><td>${formatLabResult(record,row)}</td></tr>`).join('')
  const html=`<html><meta charset="utf-8"><body><table border="1"><tr><th colspan="6">${labRecordTitle(record.type)}</th></tr><tr><td>原始记录编号</td><td>${record.recordNo}</td><td>室温</td><td>${record.roomTemperature}℃</td><td>湿度</td><td>${record.humidity}%</td></tr><tr><th>样品来源</th><th>样品名称</th><th>取样体积(mL)</th><th>稀释倍数</th><th>${record.type==='COD'?'V耗(mL)':record.type==='NH3'?'A−A0':record.type==='SS'?'W2−W1(g)':'菌落数(个)'}</th><th>检测结果(${record.type==='FC'?'个/L':'mg/L'})</th></tr>${rows}<tr><td>检测日期</td><td>${record.testDate}</td><td>检测人</td><td>${record.analyst}</td><td>复核人</td><td>${record.reviewer}</td></tr></table></body></html>`
  const url=URL.createObjectURL(new Blob([html],{type:'application/vnd.ms-excel;charset=utf-8'}));const anchor=document.createElement('a');anchor.href=url;anchor.download=`${record.recordNo}.xls`;anchor.click();URL.revokeObjectURL(url)
}
function printLabRecord(){window.print()}

type LabDailyReport={date:string;projectName:string;reportNo:string;reporter:string;reviewer:string;values:Record<string,string>;updatedAt:string}
const labReportStorageKey='waterx-lab-daily-reports'
const labReportView=ref<'folders'|'daily'>('folders')
const labDailyReports=reactive<LabDailyReport[]>(JSON.parse(localStorage.getItem(labReportStorageKey)||'[]'))
const labReportMetricKeys=['sewage.ph','sewage.cod','sewage.bod5','sewage.ss','sewage.nh3','sewage.tp','sewage.tn','sewage.no3','sewage.fc','sewage.chloride','sewage.totalSolids','sewage.dissolvedSolids','bio.do','bio.sv','bio.mlss','bio.svi','bio.mlvss','bio.ratio','return.sv','return.mlss','return.svi','return.mlvss','sludge.moistureBefore','sludge.moistureAfter','sludge.phBefore','sludge.phAfter','sludge.organicBefore','sludge.organicAfter','sludge.fcBefore','sludge.fcAfter']
function createDailyReport(date:string):LabDailyReport{return{date,projectName:'第一污水处理厂（示例）',reportNo:`LAB-D-${date.replaceAll('-','')}`,reporter:'运行工01',reviewer:'',values:Object.fromEntries(labReportMetricKeys.flatMap(key=>key.startsWith('bio.')||key.startsWith('return.')?['A','B','C','D'].map(pool=>[`${key}.${pool}`,'']):[[`${key}.in`,''],[`${key}.out`,'']])),updatedAt:'尚未保存'}}
const latestLabTestDate=[...labOriginalRecords].sort((a,b)=>b.testDate.localeCompare(a.testDate))[0]?.testDate||new Date().toISOString().slice(0,10)
const labDailyReport=ref<LabDailyReport>(createDailyReport(latestLabTestDate))
function loadLabDailyReport(date=labDailyReport.value.date){const saved=labDailyReports.find(report=>report.date===date);labDailyReport.value=saved?JSON.parse(JSON.stringify(saved)):createDailyReport(date)}
function persistLabDailyReports(){localStorage.setItem(labReportStorageKey,JSON.stringify(labDailyReports))}
function saveLabDailyReport(){const report=JSON.parse(JSON.stringify(labDailyReport.value)) as LabDailyReport;report.updatedAt=new Date().toLocaleString('zh-CN',{hour12:false});const index=labDailyReports.findIndex(item=>item.date===report.date);if(index>=0)labDailyReports.splice(index,1,report);else labDailyReports.push(report);labDailyReport.value=JSON.parse(JSON.stringify(report));persistLabDailyReports()}
function refreshLabDailyReport(notify=true){
  const report=labDailyReport.value;const records=labOriginalRecords.filter(record=>record.testDate===report.date)
  const metricByType:Record<LabRecordType,string>={COD:'cod',NH3:'nh3',SS:'ss',FC:'fc'}
  records.forEach(record=>record.samples.forEach(row=>{const side=row.name.includes('出')?'out':'in';report.values[`sewage.${metricByType[record.type]}.${side}`]=formatLabResult(record,row)}))
  report.updatedAt=new Date().toLocaleString('zh-CN',{hour12:false});if(notify)window.alert(`已从 ${records.length} 张同日期原始记录更新日报数据`)
}
function openLabDailyReport(){labReportView.value='daily';loadLabDailyReport(latestLabTestDate);refreshLabDailyReport(false)}
function changeLabReportDate(){loadLabDailyReport(labDailyReport.value.date);refreshLabDailyReport(false)}
function reportValue(key:string,side:string){return labDailyReport.value.values[`${key}.${side}`]||''}
function exportLabDailyReport(){const report=labDailyReport.value;const rows=Object.entries(report.values).map(([key,value])=>`<tr><td>${key}</td><td>${value}</td></tr>`).join('');const html=`<html><meta charset="utf-8"><body><table border="1"><tr><th colspan="2">化验日报表</th></tr><tr><td>项目名称</td><td>${report.projectName}</td></tr><tr><td>统计报表编号</td><td>${report.reportNo}</td></tr><tr><td>日期</td><td>${report.date}</td></tr>${rows}<tr><td>填报人</td><td>${report.reporter}</td></tr><tr><td>审核人</td><td>${report.reviewer}</td></tr></table></body></html>`;const url=URL.createObjectURL(new Blob([html],{type:'application/vnd.ms-excel;charset=utf-8'}));const anchor=document.createElement('a');anchor.href=url;anchor.download=`化验日报-${report.date}.xls`;anchor.click();URL.revokeObjectURL(url)}
function printLabDailyReport(){window.print()}
const departmentCount = computed(() => units.value.filter(u => u.unitType === 'DEPARTMENT').length)
const teamCount = computed(() => units.value.filter(u => u.unitType === 'TEAM').length)
const areaRows = computed(() => {
  const rows: Array<Area & { depth: number }> = []
  const append = (parentId: string | undefined, depth: number) => areas.value.filter(area => (area.parentId || undefined) === parentId)
    .forEach(area => { rows.push({ ...area, depth }); append(area.id, depth + 1) })
  append(undefined, 0)
  return rows
})

async function login() {
  loading.value = true; error.value = ''
  try {
    const pair = await api.login(username.value, password.value)
    token.value = pair.accessToken
    refreshToken.value = pair.refreshToken
    sessionStorage.setItem('accessToken', pair.accessToken)
    sessionStorage.setItem('refreshToken', pair.refreshToken)
    await loadSites()
  } catch (e) { error.value = e instanceof Error ? e.message : '登录失败' }
  finally { loading.value = false }
}

async function loadSites() {
  api.setSession(token.value, selectedSite.value, refreshToken.value)
  sites.value = await api.sites()
  if (!selectedSite.value && sites.value.length) selectedSite.value = sites.value[0].id
  await changeSite()
}

async function changeSite() {
  if (!selectedSite.value) return
  sessionStorage.setItem('siteId', selectedSite.value)
  api.setSite(selectedSite.value)
  loading.value = true; error.value = ''
  try {
    [units.value, employees.value, riskSummary.value, hazards.value, riskObjects.value, areas.value, inspectionSummary.value, inspectionStatistics.value, inspectionTemplates.value, inspectionPlans.value, inspectionTasks.value, safetyHazards.value,workPermitTemplates.value,workPermits.value,trainingSummary.value,trainingCourses.value,trainingAssignments.value,qualifications.value,assetSummary.value,safetyAssets.value,healthSummary.value,occupationalFactors.value,occupationalExams.value,investmentSummary.value,safetyBudgets.value,safetyExpenses.value,commitments.value,commitmentTemplates.value,visitorBriefing.value,visitorRecords.value] = await Promise.all([
      api.orgUnits(), api.employees(), api.riskSummary(), api.hazards(), api.riskObjects(), api.areas(), api.inspectionSummary(), api.inspectionStatistics(), api.inspectionTemplates(), api.inspectionPlans(), api.inspectionTasks(), api.safetyHazards(),api.workPermitTemplates(),api.workPermits(),api.trainingSummary(),api.trainingCourses(),api.trainingAssignments(),api.employeeQualifications(),api.safetyAssetSummary(),api.safetyAssets(),api.occupationalHealthSummary(),api.occupationalFactors(),api.occupationalExams(),api.investmentSummary(),api.safetyBudgets(),api.safetyExpenses(),api.safetyCommitments(),api.safetyCommitmentTemplates(),api.visitorBriefing(),api.visitorRecords()
    ])
    const materialEntries=await Promise.all(trainingCourses.value.map(async c=>[c.id,await api.trainingMaterials(c.id)] as const));trainingMaterials.value=Object.fromEntries(materialEntries)
    visitorUrl.value=`${window.location.protocol}//${window.location.hostname}:5174/?visitor=${visitorBriefing.value.accessToken}`;visitorQr.value=await QRCode.toDataURL(visitorUrl.value,{width:220,margin:1,errorCorrectionLevel:'M'})
    const attachmentEntries = await Promise.all(safetyHazards.value.map(async hazard => [hazard.id, await api.hazardAttachments(hazard.id)] as const))
    hazardAttachments.value = Object.fromEntries(attachmentEntries)
  }
  catch (e) { error.value = e instanceof Error ? e.message : '数据加载失败' }
  finally { loading.value = false }
}

async function logout() {
  try { if(token.value) await api.logoutSession() } catch { /* 本地会话仍需清理 */ }
  sessionStorage.clear(); token.value = ''; refreshToken.value=''; sites.value = []; units.value = []; employees.value = []; hazards.value = []
}

const riskColorName: Record<string, string> = { RED: '红色', ORANGE: '橙色', YELLOW: '黄色', BLUE: '蓝色' }
const statusName: Record<string, string> = { DRAFT: '草稿', PENDING_REVIEW: '待审核', ACTIVE: '已生效', RETURNED: '已退回' }

function openRiskForm() {
  riskForm.value.riskObjectId = riskObjects.value[0]?.id || ''
  riskForm.value.code = `HZ-${currentSite.value?.code.replace('DEMO-PLANT-', 'P') || 'NEW'}-${Date.now().toString().slice(-5)}`
  showRiskForm.value = true
}

async function saveAndSubmitRisk() {
  const form = riskForm.value
  const measures: ControlMeasureInput[] = [
    ['ENGINEERING', form.engineering], ['MANAGEMENT', form.management], ['TRAINING', form.training],
    ['PPE', form.ppe], ['EMERGENCY', form.emergency]
  ].filter((item): item is [ControlMeasureInput['measureType'], string] => Boolean(item[1].trim()))
    .map(([measureType, content]) => ({ measureType, content }))
  if (!form.riskObjectId || !form.hazardFactor.trim() || !form.possibleAccident.trim() || !measures.length) {
    error.value = '请完整填写风险对象、危险因素、事故后果，并至少录入一项管控措施'; return
  }
  savingRisk.value = true; error.value = ''
  try {
    const created = await api.createHazard({
      riskObjectId: form.riskObjectId, code: form.code, hazardFactor: form.hazardFactor,
      possibleAccident: form.possibleAccident, accidentType: form.accidentType,
      identificationBasis: form.identificationBasis, identifiedOn: form.identifiedOn,
      nextReviewOn: form.nextReviewOn || undefined
    })
    await api.assessHazard(created.id, form.method === 'LS'
      ? { method: 'LS', likelihood: form.likelihood, severity: form.severity }
      : { method: 'LEC', likelihood: form.likelihood, exposure: form.exposure, consequence: form.consequence })
    await api.replaceRiskMeasures(created.id, measures)
    await api.submitHazard(created.id)
    showRiskForm.value = false
    await changeSite()
  } catch (e) { error.value = e instanceof Error ? e.message : '风险提交失败' }
  finally { savingRisk.value = false }
}

async function reviewRisk(item: Hazard, decision: 'APPROVE' | 'RETURN') {
  const comment = decision === 'RETURN' ? window.prompt('请输入退回原因') : '审核通过'
  if (decision === 'RETURN' && !comment) return
  loading.value = true; error.value = ''
  try { await api.reviewHazard(item.id, decision, comment || ''); await changeSite() }
  catch (e) { error.value = e instanceof Error ? e.message : '审核失败' }
  finally { loading.value = false }
}

function openAreaForm() {
  areaForm.value = { parentId: '', code: `AREA-${Date.now().toString().slice(-5)}`, name: '', areaType: 'PROCESS_AREA' }
  showAreaForm.value = true
}

async function createArea() {
  loading.value = true; error.value = ''
  try {
    await api.createArea({ ...areaForm.value, parentId: areaForm.value.parentId || undefined })
    showAreaForm.value = false; await changeSite()
  } catch (e) { error.value = e instanceof Error ? e.message : '区域创建失败' }
  finally { loading.value = false }
}

async function openRiskDetail(item: Hazard) {
  selectedHazard.value = item; showRiskDetail.value = true; error.value = ''
  try {
    const [history, summary] = await Promise.all([api.assessmentHistory(item.id), api.acknowledgementSummary(item.id)])
    assessmentHistory.value = history
    ackSummary.value = { acknowledgedCount: summary.acknowledgedCount, lastAcknowledgedAt: summary.lastAcknowledgedAt || '' }
    reassessForm.value = { method: (item.method as 'LS' | 'LEC') || 'LS', likelihood: 1, severity: 1, exposure: 1, consequence: 1, reason: '' }
  } catch (e) { error.value = e instanceof Error ? e.message : '风险详情加载失败' }
}

async function submitReassessment() {
  if (!selectedHazard.value) return
  const form = reassessForm.value; loading.value = true; error.value = ''
  try {
    await api.reassessHazard(selectedHazard.value.id, form.method === 'LS'
      ? { method: 'LS', likelihood: form.likelihood, severity: form.severity, reason: form.reason }
      : { method: 'LEC', likelihood: form.likelihood, exposure: form.exposure, consequence: form.consequence, reason: form.reason })
    assessmentHistory.value = await api.assessmentHistory(selectedHazard.value.id)
  } catch (e) { error.value = e instanceof Error ? e.message : '复评提交失败' }
  finally { loading.value = false }
}

async function reviewAssessment(item: AssessmentHistory, decision: 'APPROVE' | 'RETURN') {
  const comment = decision === 'RETURN' ? window.prompt('请输入退回复评原因') : '同意复评结果'
  if (decision === 'RETURN' && !comment) return
  try {
    await api.reviewReassessment(item.id, decision, comment || '')
    if (selectedHazard.value) assessmentHistory.value = await api.assessmentHistory(selectedHazard.value.id)
    await changeSite()
  } catch (e) { error.value = e instanceof Error ? e.message : '复评审核失败' }
}

const inspectionStatusName: Record<string,string> = { PENDING:'待执行', IN_PROGRESS:'执行中', COMPLETED:'已完成', OVERDUE:'已逾期', CANCELLED:'已取消' }
const hazardStatusName: Record<string,string> = { OPEN:'待整改', RECTIFYING:'整改中', REVIEW_PENDING:'待验收', CLOSED:'已闭环', OVERDUE:'已逾期' }
const hazardLevelName: Record<string,string> = { GENERAL:'一般隐患', SERIOUS:'较大隐患', MAJOR:'重大隐患' }
const escalationName:Record<string,string>={REMINDER:'一般提醒',DEPARTMENT:'部门督办',PLANT:'厂级升级'}
const permitStatusName:Record<string,string>={DRAFT:'草稿',PENDING_SAFETY:'待安全审核',PENDING_PRINCIPAL:'待负责人批准',APPROVED:'已批准',IN_PROGRESS:'作业中',CLOSED:'已完工',RETURNED:'已退回',CANCELLED:'已取消'}

async function submitRectification(item: SafetyHazard) {
  const note = window.prompt('请填写整改完成情况')
  if (!note) return
  try { await api.submitRectification(item.id, note); await changeSite() }
  catch (e) { error.value = e instanceof Error ? e.message : '整改提交失败' }
}

async function reviewSafetyHazard(item: SafetyHazard, passed: boolean) {
  const comment = window.prompt(passed ? '请输入验收意见' : '请输入退回整改原因', passed ? '现场复查合格，同意闭环' : '')
  if (!comment) return
  try { await api.reviewSafetyHazard(item.id, passed, comment); await changeSite() }
  catch (e) { error.value = e instanceof Error ? e.message : '隐患验收失败' }
}

function openTaskForm(){taskForm.value={templateId:inspectionTemplates.value[0]?.id||'',title:'',plannedStart:new Date().toISOString().slice(0,10),dueAt:new Date(Date.now()+86400000).toISOString().slice(0,16),assigneeEmployeeId:employees.value[0]?.id||''};showTaskForm.value=true}
async function createInspectionTask(){try{await api.createInspectionTask({...taskForm.value,dueAt:new Date(taskForm.value.dueAt).toISOString(),assigneeEmployeeId:taskForm.value.assigneeEmployeeId||undefined});showTaskForm.value=false;await changeSite()}catch(e){error.value=e instanceof Error?e.message:'检查任务创建失败'}}
function openPlanForm(){planForm.value={templateId:inspectionTemplates.value[0]?.id||'',name:'',scheduleType:'WEEKLY',intervalValue:1,nextRunDate:new Date().toISOString().slice(0,10),dueHours:24,assigneeEmployeeId:employees.value[0]?.id||''};showPlanForm.value=true}
async function createInspectionPlan(){try{await api.createInspectionPlan({...planForm.value,assigneeEmployeeId:planForm.value.assigneeEmployeeId||undefined});showPlanForm.value=false;await changeSite()}catch(e){error.value=e instanceof Error?e.message:'检查计划创建失败'}}
async function generatePlans(){try{const result=await api.generateInspectionPlans();await changeSite();window.alert(result.generatedCount?`已生成 ${result.generatedCount} 个检查任务`:'当前没有到期且未生成的计划')}catch(e){error.value=e instanceof Error?e.message:'任务生成失败'}}
async function changePlanStatus(plan:InspectionPlan){const pausing=plan.status==='ACTIVE';const reason=window.prompt(pausing?'请输入暂停原因':'请输入恢复原因',pausing?'现场安排调整，暂缓自动派发':'恢复正常检查安排');if(!reason)return;try{await api.changeInspectionPlanStatus(plan.id,pausing?'PAUSE':'RESUME',reason);await changeSite()}catch(e){error.value=e instanceof Error?e.message:'计划状态变更失败'}}
async function remindHazard(item:SafetyHazard){const message=window.prompt('请输入催办要求',`隐患 ${item.hazardNo} 已临近或超过整改时限，请尽快完成整改并反馈。`);if(!message)return;try{await api.remindSafetyHazard(item.id,message);await changeSite();window.alert('催办记录已保存')}catch(e){error.value=e instanceof Error?e.message:'隐患催办失败'}}
function openPermitForm(){permitForm.value={...permitForm.value,templateId:workPermitTemplates.value[0]?.id||'',location:'',workContent:'',riskResult:'',responsiblePerson:'',guardian:'',workers:''};showPermitForm.value=true}
async function createPermit(){try{const f=permitForm.value;const created=await api.createWorkPermit({...f,startAt:new Date(f.startAt).toISOString(),endAt:new Date(f.endAt).toISOString()});await api.submitWorkPermit(created.id);showPermitForm.value=false;await changeSite()}catch(e){error.value=e instanceof Error?e.message:'危险作业申请失败'}}
async function reviewPermit(item:WorkPermit,approved=true){const comment=window.prompt(approved?'请输入审批意见':'请输入退回原因',approved?'作业条件及安全措施符合要求，同意':'');if(!comment)return;try{await api.reviewWorkPermit(item.id,approved,comment);await changeSite()}catch(e){error.value=e instanceof Error?e.message:'危险作业审批失败'}}
async function closePermit(item:WorkPermit){if(!window.confirm('确认作业已完成、现场已清理并可以关闭作业票？'))return;try{await api.closeWorkPermit(item.id);await changeSite()}catch(e){error.value=e instanceof Error?e.message:'完工验收失败'}}
function openTrainingForm(){trainingForm.value={courseId:trainingCourses.value[0]?.id||'',employeeId:employees.value[0]?.id||'',dueAt:new Date(Date.now()+7*86400000).toISOString().slice(0,16)};showTrainingForm.value=true}
function openCourseForm(){courseForm.value={code:`TRAIN-${Date.now().toString().slice(-6)}`,name:'',courseType:'SPECIAL_OPERATION',materialType:'PPT',durationMinutes:45,passingScore:80};showCourseForm.value=true}
async function saveCourse(){try{await api.createTrainingCourse(courseForm.value);showCourseForm.value=false;await changeSite()}catch(e){error.value=e instanceof Error?e.message:'培训课程保存失败'}}
async function assignTraining(){try{const f=trainingForm.value;await api.assignTraining(f.courseId,f.employeeId,new Date(f.dueAt).toISOString());showTrainingForm.value=false;await changeSite()}catch(e){error.value=e instanceof Error?e.message:'培训指派失败'}}
async function recordTrainingScore(item:TrainingAssignment){const raw=window.prompt('请输入考试成绩（0—100）','90');if(raw===null)return;const score=Number(raw);if(!Number.isFinite(score)||score<0||score>100){error.value='考试成绩应为 0—100';return}try{await api.completeTraining(item.id,score);await changeSite()}catch(e){error.value=e instanceof Error?e.message:'成绩登记失败'}}
async function queryTrainingStatistics(){try{trainingStatistics.value=await api.trainingStatistics(statisticsRange.value.from,statisticsRange.value.to)}catch(e){error.value=e instanceof Error?e.message:'培训统计加载失败'}}
function openQualificationForm(){qualificationForm.value={...qualificationForm.value,employeeId:employees.value[0]?.id||'',certificateName:'',certificateNo:'',issuingAuthority:''};showQualificationForm.value=true}
async function saveQualification(){try{await api.createEmployeeQualification(qualificationForm.value);showQualificationForm.value=false;await changeSite()}catch(e){error.value=e instanceof Error?e.message:'资格证书保存失败'}}
async function recordAssetMaintenance(item:SafetyAsset){const description=window.prompt('请输入本次检验、维保或盘点情况','检查状态正常，功能试验合格');if(!description)return;const next=window.prompt('请输入下次检验/维保日期（YYYY-MM-DD）',new Date(Date.now()+365*86400000).toISOString().slice(0,10));if(!next)return;try{await api.recordAssetMaintenance(item.id,{maintenanceType:item.assetType==='EMERGENCY_SUPPLY'?'INVENTORY':'INSPECTION',performedOn:new Date().toISOString().slice(0,10),performedBy:'安全管理人员',result:'QUALIFIED',description,nextDueOn:next,cost:0});await changeSite()}catch(e){error.value=e instanceof Error?e.message:'维保记录保存失败'}}
const assetTypeName:Record<string,string>={SPECIAL_EQUIPMENT:'特种设备',SAFETY_ACCESSORY:'安全附件',FIRE_EQUIPMENT:'消防器材',EMERGENCY_SUPPLY:'应急物资'}
function openAssetForm(){assetForm.value={assetNo:`ASSET-${Date.now().toString().slice(-6)}`,assetName:'',assetType:'SPECIAL_EQUIPMENT',category:'',location:'',responsiblePerson:'',manufacturer:'',modelSpec:'',registrationNo:'',quantity:1,unit:'台',commissionedOn:'',lastInspectedOn:'',nextInspectionOn:'',expiresOn:'',reminderDays:30,notes:''};showAssetForm.value=true}
async function saveAsset(){try{const f=assetForm.value;await api.createSafetyAsset({...f,commissionedOn:f.commissionedOn||undefined,lastInspectedOn:f.lastInspectedOn||undefined,nextInspectionOn:f.nextInspectionOn||undefined,expiresOn:f.expiresOn||undefined});showAssetForm.value=false;await changeSite()}catch(e){error.value=e instanceof Error?e.message:'设备物资建档失败'}}
function openExamForm(){examForm.value={...examForm.value,employeeId:employees.value[0]?.id||'',medicalInstitution:'',restrictedItems:'',followUpAction:''};showExamForm.value=true}
async function saveExam(){try{await api.recordOccupationalExam(examForm.value);showExamForm.value=false;await changeSite()}catch(e){error.value=e instanceof Error?e.message:'体检记录保存失败'}}
function openFactorForm(){factorForm.value={...factorForm.value,factorName:'',location:'',exposedPositions:'',exposureLevel:'',limitValue:'',controlMeasures:'',lastMonitoredOn:'',nextMonitoringOn:''};showFactorForm.value=true}
async function saveFactor(){try{await api.createOccupationalFactor({...factorForm.value,lastMonitoredOn:factorForm.value.lastMonitoredOn||undefined,nextMonitoringOn:factorForm.value.nextMonitoringOn||undefined});showFactorForm.value=false;await changeSite()}catch(e){error.value=e instanceof Error?e.message:'职业危害因素保存失败'}}
async function monitorFactor(item:OccupationalFactor){const result=window.prompt('请输入本次检测结果',item.exposureLevel||'检测结果符合职业接触限值');if(!result)return;const next=window.prompt('请输入下次检测日期（YYYY-MM-DD）',new Date(Date.now()+365*86400000).toISOString().slice(0,10));if(!next)return;try{await api.recordFactorMonitoring(item.id,{monitoredOn:new Date().toISOString().slice(0,10),result,nextMonitoringOn:next});await changeSite()}catch(e){error.value=e instanceof Error?e.message:'检测记录保存失败'}}
function openExpenseForm(){expenseForm.value={budgetId:safetyBudgets.value[0]?.id||'',expenseDate:new Date().toISOString().slice(0,10),amount:0,purpose:'',vendor:'',invoiceNo:'',recordedBy:'安全管理人员'};showExpenseForm.value=true}
async function saveExpense(){try{await api.recordSafetyExpense(expenseForm.value);showExpenseForm.value=false;await changeSite()}catch(e){error.value=e instanceof Error?e.message:'费用登记失败'}}
function openBudgetForm(){budgetForm.value={budgetYear:new Date().getFullYear(),category:'安全防护设施',plannedAmount:0,description:''};showBudgetForm.value=true}
async function saveBudget(){try{await api.createSafetyBudget(budgetForm.value);showBudgetForm.value=false;await changeSite()}catch(e){error.value=e instanceof Error?e.message:'预算计划保存失败'}}
async function uploadCourseMaterial(courseId:string,event:Event){const file=(event.target as HTMLInputElement).files?.[0];if(!file)return;try{await api.uploadTrainingMaterial(courseId,file);trainingMaterials.value[courseId]=await api.trainingMaterials(courseId)}catch(e){error.value=e instanceof Error?e.message:'培训材料上传失败'}}
function visitorAssetUrl(path?:string){return path?`${window.location.protocol}//${window.location.hostname}:5174${path}`:''}
function openVisitorForm(){if(!visitorBriefing.value)return;visitorForm.value={title:visitorBriefing.value.title,briefingContent:visitorBriefing.value.briefingContent,riskMapDescription:visitorBriefing.value.riskMapDescription||'',evacuationDescription:visitorBriefing.value.evacuationDescription||'',emergencyContact:visitorBriefing.value.emergencyContact||''};showVisitorForm.value=true}
async function saveVisitorBriefing(){try{await api.updateVisitorBriefing(visitorForm.value);showVisitorForm.value=false;await changeSite()}catch(e){error.value=e instanceof Error?e.message:'访客安全告知保存失败'}}
function openCommitmentTemplateForm(){commitmentTemplateForm.value={code:`COMMIT-${Date.now().toString().slice(-6)}`,name:'',positionScope:'全体从业人员',content:'',version:`${new Date().getFullYear()}-V1`};showCommitmentTemplateForm.value=true}
async function saveCommitmentTemplate(){try{await api.createSafetyCommitmentTemplate(commitmentTemplateForm.value);showCommitmentTemplateForm.value=false;await changeSite()}catch(e){error.value=e instanceof Error?e.message:'承诺书模板保存失败'}}
function openCommitmentAssignForm(){commitmentAssignForm.value={templateId:commitmentTemplates.value[0]?.id||'',employeeId:employees.value[0]?.id||'',dueAt:new Date(Date.now()+15*86400000).toISOString().slice(0,16)};showCommitmentAssignForm.value=true}
async function assignCommitment(){try{const f=commitmentAssignForm.value;await api.assignSafetyCommitment({...f,dueAt:new Date(f.dueAt).toISOString()});showCommitmentAssignForm.value=false;await changeSite()}catch(e){error.value=e instanceof Error?e.message:'承诺书推送失败'}}
async function openSafetyArchive(person:Employee){try{safetyArchive.value=await api.employeeSafetyArchive(person.id);showSafetyArchive.value=true}catch(e){error.value=e instanceof Error?e.message:'个人安全档案加载失败'}}
const scheduleName:Record<string,string>={DAILY:'每日',WEEKLY:'每周',MONTHLY:'每月',ONCE:'一次性'}

onMounted(() => { if (token.value) loadSites().catch(() => logout()) })
</script>

<template>
  <main v-if="!token" class="login-shell">
    <section class="brand-panel">
      <div class="brand-logo-wrap"><img src="/waterx-logo-transparent.png" alt="WaterX" /></div>
      <p class="eyebrow">WaterX · Digital Water Operations</p>
      <h1>智慧水务运营平台</h1>
    </section>
    <form class="login-card" @submit.prevent="login">
      <div><p class="eyebrow">欢迎使用</p><h2>登录管理端</h2><p class="muted">请输入由管理员分配的账号</p></div>
      <label>用户名<input v-model="username" autocomplete="username" /></label>
      <label>密码<input v-model="password" type="password" autocomplete="current-password" placeholder="至少 12 位" /></label>
      <p v-if="error" class="error">{{ error }}</p>
      <button :disabled="loading">{{ loading ? '正在登录…' : '登录' }}</button>
    </form>
  </main>

  <div v-else class="app-shell" :class="{sidebarCollapsed}">
    <header class="global-topbar">
      <div class="topbar-brand"><div class="topbar-logo-art" aria-label="WaterX"><img class="logo-water" src="/waterx-logo-transparent.png" alt="" /><img class="logo-x" src="/waterx-logo-transparent.png" alt="" /></div><span>智慧水务运营平台</span></div>
      <div class="topbar-actions"><div class="topbar-project"><small>当前项目</small><select v-model="selectedSite" @change="changeSite"><option v-for="site in sites" :key="site.id" :value="site.id">{{site.name}}</option></select></div><span class="topbar-divider"></span><div class="topbar-user"><span class="avatar">管</span><div><b>平台管理员</b><small>系统管理</small></div></div><button @click="logout">退出登录</button></div>
    </header>
    <aside>
      <button class="sidebar-toggle" :title="sidebarCollapsed?'展开导航':'收起导航'" :aria-label="sidebarCollapsed?'展开导航':'收起导航'" @click="sidebarCollapsed=!sidebarCollapsed"><span>{{sidebarCollapsed?'›':'‹'}}</span><b>收起导航</b></button>
      <nav class="module-nav">
        <button class="module-nav-home" :class="{selected:active==='platform'}" @click="active='platform'"><span class="nav-icon">⌂</span><span>首页</span></button>

        <section class="nav-group">
          <button class="nav-group-title" @click="toggleModule('operations')"><span class="nav-icon">◷</span><span>生产运行</span><i :class="{open:expandedModules.operations}">›</i></button>
          <div v-show="expandedModules.operations" class="nav-children"><button :class="{selected:active==='operationsShift'}" @click="active='operationsShift'">班组与排班 <small>规划</small></button><button :class="{selected:active==='operationsHandover'}" @click="active='operationsHandover'">交接班管理 <small>规划</small></button><button :class="{selected:active==='operationsTasks'}" @click="active='operationsTasks'">当班任务 <small>规划</small></button><button :class="{selected:active==='operationsLog'}" @click="active='operationsLog'">运行日志 <small>规划</small></button></div>
        </section>
        <section class="nav-group">
          <button class="nav-group-title" @click="toggleModule('process')"><span class="nav-icon">≋</span><span>工艺管理</span><i :class="{open:expandedModules.process}">›</i></button>
          <div v-show="expandedModules.process" class="nav-children"><button :class="{selected:active==='processDesign'}" @click="active='processDesign'">工艺设计标准</button><button :class="{selected:active==='conditionMatrix'}" @click="active='conditionMatrix'">工况矩阵管理</button><button :class="{selected:active==='operationEntry'}" @click="active='operationEntry';loadOperationEntry()">运行数据填报</button><button :class="{selected:active==='processAnalysis'}" @click="active='processAnalysis'">工艺诊断分析</button><button :class="{selected:active==='processReport'}" @click="active='processReport'">工艺分析日报</button><button disabled>工艺调整记录 <small>规划中</small></button></div>
        </section>
        <section class="nav-group">
          <button class="nav-group-title" @click="toggleModule('equipment')"><span class="nav-icon">⚙</span><span>设备管理</span><i :class="{open:expandedModules.equipment}">›</i></button>
          <div v-show="expandedModules.equipment" class="nav-children"><button disabled>设备台账 <small>规划中</small></button><button disabled>维护保养 <small>规划中</small></button></div>
        </section>
        <section class="nav-group">
          <button class="nav-group-title" @click="toggleModule('laboratory')"><span class="nav-icon">⚗</span><span>化验管理</span><i :class="{open:expandedModules.laboratory}">›</i></button>
          <div v-show="expandedModules.laboratory" class="nav-children"><button :class="{selected:active==='labRecords'}" @click="active='labRecords';labRecordView='folders'">原始记录管理</button><button :class="{selected:active==='labReports'}" @click="active='labReports';labReportView='folders'">化验报表管理</button><button disabled>化验任务 <small>规划中</small></button><button disabled>水质分析 <small>规划中</small></button></div>
        </section>

        <section class="nav-group safety-group" :class="{expanded:expandedModules.safety}">
          <button class="nav-group-title" @click="toggleModule('safety')"><span class="nav-icon">⛑</span><span>安全管理</span><i :class="{open:expandedModules.safety}">›</i></button>
          <div v-show="expandedModules.safety" class="nav-children">
            <button :class="{selected:active==='overview'}" @click="active='overview'">安全态势</button>
            <button :class="{selected:active==='org'}" @click="active='org'">组织架构</button>
            <button :class="{selected:active==='employee'}" @click="active='employee'">人员档案</button>
            <button :class="{selected:active==='area'}" @click="active='area'">厂区区域</button>
            <button :class="{selected:active==='risk'}" @click="active='risk'">风险管控 <em>{{riskSummary.pending || ''}}</em></button>
            <button :class="{selected:active==='inspection'}" @click="active='inspection'">安全检查 <em>{{inspectionSummary.pendingTasks || ''}}</em></button>
            <button :class="{selected:active==='hazard'}" @click="active='hazard'">隐患治理 <em>{{inspectionSummary.pendingReview || inspectionSummary.openHazards || ''}}</em></button>
            <button :class="{selected:active==='permit'}" @click="active='permit'">危险作业 <em>{{workPermits.filter(p=>p.status.startsWith('PENDING')).length||''}}</em></button>
            <button :class="{selected:active==='training'}" @click="active='training'">培训与资质 <em>{{trainingSummary.expiringQualifications||''}}</em></button>
            <button :class="{selected:active==='asset'}" @click="active='asset'">安全设备物资 <em>{{assetSummary.dueSoon||''}}</em></button>
            <button :class="{selected:active==='health'}" @click="active='health'">职业健康 <em>{{healthSummary.monitoringDue||healthSummary.examDue||''}}</em></button>
            <button :class="{selected:active==='investment'}" @click="active='investment'">安全投入</button>
            <button :class="{selected:active==='education'}" @click="active='education'">承诺书与访客 <em>{{commitments.filter(c=>c.status==='PENDING').length||''}}</em></button>
          </div>
        </section>

        <section class="nav-group">
          <button class="nav-group-title" @click="toggleModule('inventory')"><span class="nav-icon">▤</span><span>库存管理</span><i :class="{open:expandedModules.inventory}">›</i></button>
          <div v-show="expandedModules.inventory" class="nav-children"><button :class="{selected:active==='inventoryOverview'}" @click="active='inventoryOverview'">库存总览 <small>规划</small></button><button :class="{selected:active==='inventoryMaterials'}" @click="active='inventoryMaterials'">物资台账 <small>规划</small></button><button :class="{selected:active==='inventoryInbound'}" @click="active='inventoryInbound'">入库管理 <small>规划</small></button><button :class="{selected:active==='inventoryOutbound'}" @click="active='inventoryOutbound'">出库与领用 <small>规划</small></button><button :class="{selected:active==='inventoryStocktake'}" @click="active='inventoryStocktake'">库存盘点 <small>规划</small></button><button :class="{selected:active==='inventoryAlerts'}" @click="active='inventoryAlerts'">库存预警 <small>规划</small></button></div>
        </section>
        <section class="nav-group">
          <button class="nav-group-title" @click="toggleModule('business')"><span class="nav-icon">¥</span><span>经营管理</span><i :class="{open:expandedModules.business}">›</i></button>
          <div v-show="expandedModules.business" class="nav-children"><button :class="{selected:active==='businessTargets'}" @click="active='businessTargets'">经营目标 <small>规划</small></button><button :class="{selected:active==='businessPlan'}" @click="active='businessPlan'">生产计划 <small>规划</small></button><button :class="{selected:active==='businessBudget'}" @click="active='businessBudget'">预算管理 <small>规划</small></button><button :class="{selected:active==='businessExecution'}" @click="active='businessExecution'">执行分析 <small>规划</small></button><button :class="{selected:active==='businessCost'}" @click="active='businessCost'">成本收益 <small>规划</small></button><button :class="{selected:active==='businessReceivables'}" @click="active='businessReceivables'">回款管理 <small>规划</small></button></div>
        </section>
        <section class="nav-group">
          <button class="nav-group-title" @click="toggleModule('efficiency')"><span class="nav-icon">♻</span><span>提质增效</span><i :class="{open:expandedModules.efficiency}">›</i></button>
          <div v-show="expandedModules.efficiency" class="nav-children"><button disabled>能耗计量 <small>规划中</small></button><button disabled>能效分析 <small>规划中</small></button></div>
        </section>
        <section class="nav-group">
          <button class="nav-group-title" @click="toggleModule('evaluation')"><span class="nav-icon">✓</span><span>过程评价</span><i :class="{open:expandedModules.evaluation}">›</i></button>
          <div v-show="expandedModules.evaluation" class="nav-children"><button :class="{selected:active==='evaluationResults'}" @click="active='evaluationResults'">评价结果管理</button><button :class="{selected:active==='evaluationOperations'}" @click="active='evaluationOperations'">运行管理评价</button><button :class="{selected:active==='evaluationEquipment'}" @click="active='evaluationEquipment'">设备管理评价</button><button :class="{selected:active==='evaluationLaboratory'}" @click="active='evaluationLaboratory'">化验管理评价</button><button :class="{selected:active==='evaluationSafety'}" @click="active='evaluationSafety'">安全管理评价</button><button :class="{selected:active==='evaluationComprehensive'}" @click="active='evaluationComprehensive'">综合管理评价</button><button :class="{selected:active==='evaluationRectification'}" @click="active='evaluationRectification'">问题与整改</button><button :class="{selected:active==='evaluationReport'}" @click="active='evaluationReport'">评价报告</button></div>
        </section>
        <section class="nav-group">
          <button class="nav-group-title" @click="toggleModule('quality')"><span class="nav-icon">◇</span><span>管理质量</span><i :class="{open:expandedModules.quality}">›</i></button>
          <div v-show="expandedModules.quality" class="nav-children"><button :class="{selected:active==='qualityCompliance'}" @click="active='qualityCompliance'">合法合规</button><button :class="{selected:active==='qualityStable'}" @click="active='qualityStable'">稳定达标</button><button :class="{selected:active==='qualitySafety'}" @click="active='qualitySafety'">安全运行</button><button :class="{selected:active==='qualityEfficiency'}" @click="active='qualityEfficiency'">经济高效</button></div>
        </section>
        <section class="nav-group">
          <button class="nav-group-title" @click="toggleModule('improvement')"><span class="nav-icon">↗</span><span>改进提升</span><i :class="{open:expandedModules.improvement}">›</i></button>
          <div v-show="expandedModules.improvement" class="nav-children"><button :class="{selected:active==='improvementIssues'}" @click="active='improvementIssues'">问题清单 <small>规划</small></button><button :class="{selected:active==='improvementPlans'}" @click="active='improvementPlans'">改进计划 <small>规划</small></button><button :class="{selected:active==='improvementExecution'}" @click="active='improvementExecution'">整改执行 <small>规划</small></button><button :class="{selected:active==='improvementReview'}" @click="active='improvementReview'">复核关闭 <small>规划</small></button><button :class="{selected:active==='improvementAnalysis'}" @click="active='improvementAnalysis'">改进分析 <small>规划</small></button></div>
        </section>
        <section class="nav-group">
          <button class="nav-group-title" @click="toggleModule('basic')"><span class="nav-icon">▦</span><span>基础信息</span><i :class="{open:expandedModules.basic}">›</i></button>
          <div v-show="expandedModules.basic" class="nav-children"><button disabled>工艺线档案 <small>规划中</small></button><button disabled>数据字典 <small>规划中</small></button></div>
        </section>
      </nav>
    </aside>
    <section class="workspace">
      <article :class="{'safety-workspace':isSafetyPage}">
        <div v-if="isSafetyPage" class="page-title"><div><p class="eyebrow">{{currentSite?.code}}</p><h1>{{active==='overview' ? '安全态势总览' : active==='org' ? '组织架构' : active==='employee' ? '人员档案' : active==='area' ? '厂区区域管理' : active==='risk' ? '风险分级管控' : active==='inspection' ? '安全检查任务' : active==='hazard'?'隐患排查治理':active==='permit'?'危险作业审批':active==='training'?'安全培训与人员资质':active==='asset'?'设备设施与应急物资':active==='health'?'职业健康管理':active==='investment'?'安全投入管理':'安全承诺与访客告知' }}</h1></div><span class="date-chip">{{ new Date().toLocaleDateString('zh-CN') }}</span></div>
        <p v-if="error" class="error banner">{{error}}</p>
        <template v-if="active==='platform'">
          <section class="dashboard-toolbar"><span>今日运营概览</span><div><button>今日</button><button>本月</button><button>自定义</button></div></section>
          <div class="dashboard-kpis"><section><span>今日处理水量</span><strong>6.82<small>万 m³</small></strong><em>较昨日 +2.6%</em></section><section><span>出水综合达标率</span><strong>99.6<small>%</small></strong><em>稳定达标</em></section><section><span>吨水综合电耗</span><strong>0.286<small>kWh/m³</small></strong><em class="down">较目标低 3.4%</em></section><section><span>未闭环事项</span><strong>7<small>项</small></strong><em class="warn">其中逾期 1 项</em></section></div>
          <div class="dashboard-chart-grid"><section class="dashboard-card water-chart"><header><b>近七日处理水量</b><span>万 m³/d</span></header><div class="bar-chart"><div v-for="(value,index) in [78,84,72,90,86,82,88]" :key="index"><span :style="{height:`${value}%`}"></span><small>{{['09','10','11','12','13','14','15'][index]}}日</small></div></div></section><section class="dashboard-card trend-chart"><header><b>出水水质趋势</b><span><i></i> COD　<i></i> NH₃-N</span></header><svg viewBox="0 0 500 180" preserveAspectRatio="none"><g><line v-for="y in [30,70,110,150]" :key="y" x1="20" :y1="y" x2="485" :y2="y" /></g><polyline points="20,105 95,92 170,101 245,72 320,82 395,61 485,68"/><polyline class="second" points="20,132 95,125 170,129 245,116 320,121 395,108 485,112"/></svg></section><section class="dashboard-card structure-chart"><header><b>事项分布</b><span>当前</span></header><div class="donut-wrap"><div class="donut"><span>23<small>全部</small></span></div><ul><li><i></i>生产运行 <b>9</b></li><li><i></i>安全管理 <b>7</b></li><li><i></i>设备管理 <b>4</b></li><li><i></i>其他事项 <b>3</b></li></ul></div></section></div>
          <section class="dashboard-card task-center"><header><b>我的事项</b><span>内容随当前用户和角色动态变化</span></header><nav><button v-for="tab in [{key:'pending',name:'待处理'},{key:'processed',name:'已处理'},{key:'cc',name:'抄送我'},{key:'started',name:'我发起'}]" :key="tab.key" :class="{active:dashboardTaskTab===tab.key}" @click="dashboardTaskTab=tab.key as typeof dashboardTaskTab">{{tab.name}}<em>{{dashboardTasks[tab.key as keyof typeof dashboardTasks].length}}</em></button></nav><div class="dashboard-task-list"><article v-for="task in dashboardTasks[dashboardTaskTab]" :key="task.title"><span>{{task.module}}</span><b>{{task.title}}</b><small>{{task.time}}</small><em>{{task.status}}</em></article></div>
          </section>
        </template>
        <ProcessEvaluationPage v-else-if="currentProcessEvaluationPage" :active-page="currentProcessEvaluationPage" :site-name="currentSite?.name || 'WaterX示范污水处理厂'" :site-code="currentSite?.code || 'WX-DEMO-01'" @update:active-page="openProcessEvaluationPage" @navigate:app="handleProcessEvaluationNavigate" />
        <template v-else-if="currentPlannedPage">
          <section class="module-skeleton-head">
            <div><p class="eyebrow">{{currentPlannedPage.module}} · {{currentSite?.code||'CURRENT SITE'}}</p><h1>{{currentPlannedPage.title}}</h1><p>{{currentPlannedPage.description}}</p></div>
            <span class="planning-chip">页面骨架 · 规划中</span>
          </section>
          <ImprovementDraftPanel v-if="pendingImprovementDraft && (active==='improvementIssues' || active==='improvementPlans')" :draft="pendingImprovementDraft" :mode="active==='improvementPlans'?'plan':'issue'" @create-plan="promoteImprovementDraft" @clear="pendingImprovementDraft=null" />
          <section class="module-skeleton-kpis">
            <article><span>业务角色</span><strong>{{currentPlannedPage.stage}}</strong><small>{{currentPlannedPage.stage==='P'?'目标与计划':currentPlannedPage.stage==='D'?'业务执行':'改进与提升'}}</small></article>
            <article><span>页面状态</span><strong>骨架</strong><small>功能和字段待专项确认</small></article>
            <article><span>数据范围</span><strong>当前水厂</strong><small>{{currentSite?.name||'第一污水处理厂（示例）'}}</small></article>
            <article><span>规则状态</span><strong>待确认</strong><small>本轮不固化业务规则</small></article>
          </section>
          <section class="module-skeleton-grid">
            <article class="module-outline-card"><header><div><b>首版能力范围</b><small>用于确认入口、边界和后续建设顺序</small></div><span>{{currentPlannedPage.capabilities.length}} 项</span></header><div class="capability-list"><span v-for="(item,index) in currentPlannedPage.capabilities" :key="item"><i>{{index+1}}</i><b>{{item}}</b><small>规划中</small></span></div></article>
            <article class="module-outline-card"><header><div><b>页面建设原则</b><small>保持专业模块独立，不按形式合并入口</small></div></header><ul><li>保留水厂与业务数据域，后续按岗位配置权限。</li><li>业务台账、流程状态和审计字段进入后端后再正式启用。</li><li>与相邻模块通过业务关联衔接，不复制各自专业数据。</li><li>本页当前仅用于产品结构确认，不代表最终字段和流程。</li></ul></article>
          </section>
          <section class="module-roadmap-strip"><span><b>01</b>入口与边界确认</span><i></i><span><b>02</b>字段与规则评审</span><i></i><span><b>03</b>交互原型</span><i></i><span><b>04</b>后端工程化</span></section>
        </template>
        <ManagementQualityPage v-else-if="currentQualityPage" :active-page="currentQualityPage" :site-name="currentSite?.name || 'WaterX示范污水处理厂'" :site-code="currentSite?.code || 'WX-DEMO-01'" @update:active-page="openQualityPage" @start-improvement="handleQualityImprovement" />
        <template v-else-if="active==='processAnalysis'">
          <section class="diagnosis-toolbar">
            <label>水厂<select :value="selectedSite"><option :value="selectedSite">{{currentSite?.name || '示范污水处理厂'}}</option></select></label>
            <label>工艺线<select v-model="diagnosisLine"><option>一期生化线</option><option>二期生化线</option></select></label>
            <label>匹配工况<select :value="diagnosisCondition?.id||''" disabled title="根据分析日期自动匹配"><option v-if="!diagnosisCondition" value="">未匹配工况</option><option v-for="plan in conditionPlans" :key="plan.id" :value="plan.id">{{plan.name}}</option></select></label>
            <label>分析日期<input v-model="diagnosisDate" type="date" /></label>
            <button @click="refreshDiagnosis">更新</button>
            <button class="primary" @click="saveDiagnosisReport">保存</button>
            <div class="toolbar-status"><span><i class="diagnosis-dot normal"></i>{{analysisRows.filter(i=>i.level==='normal').length}} 正常</span><span><i class="diagnosis-dot warning"></i>{{analysisRows.filter(i=>i.level==='warning').length}} 预警</span><span><i class="diagnosis-dot alarm"></i>{{analysisRows.filter(i=>i.level==='alarm').length}} 告警</span><small>更新 {{diagnosisUpdatedAt}}</small></div>
          </section>

          <div class="diagnosis-layout">
            <section class="diagnosis-results">
              <nav class="diagnosis-board-tabs" aria-label="结果指标分类">
                <div v-for="group in analysisGroups" :key="group.category" :class="['diagnosis-board-tab',{selected:activeAnalysisGroup?.category===group.category}]">
                  <button type="button" @click="activeResultCategory=group.category"><b>{{group.category}}</b><span class="tab-status-counts"><i class="normal" :class="{empty:statusCounts(group.metrics).normal===0}">{{statusCounts(group.metrics).normal}}</i><i class="warning" :class="{empty:statusCounts(group.metrics).warning===0}">{{statusCounts(group.metrics).warning}}</i><i class="alarm" :class="{empty:statusCounts(group.metrics).alarm===0}">{{statusCounts(group.metrics).alarm}}</i></span></button>
                  <button type="button" class="board-gear" title="配置指标" :aria-label="`配置${group.category}指标`" @click="openModuleMetricManager('diagnosis',group.category)">⚙</button>
                </div>
              </nav>
              <div v-if="activeAnalysisGroup" class="diagnosis-table-wrap grouped diagnosis-tab-panel">
                    <div v-if="activeAnalysisGroup.category==='沿程分析'" class="along-course-analysis">
                      <header><div><b>生化系统沿程采样矩阵</b><span>{{diagnosisDate}} · {{diagnosisLine}} · 数据随分析日期更新</span></div><em>10 个采样点</em></header>
                      <div class="along-course-table-wrap"><table class="along-course-table"><thead><tr><th>指标</th><th v-for="station in alongCourseStations" :key="station">{{station}}</th><th>过程判断</th></tr></thead><tbody><tr v-for="series in alongCourseSeries" :key="series.name"><th><b>{{series.name}}</b><small>{{series.unit}}</small></th><td v-for="(value,index) in series.values" :key="`${series.name}-${index}`"><span :class="{missing:value==='—'}">{{value}}</span></td><td><em>{{series.trend}}</em></td></tr></tbody></table></div>
                      <div class="along-derived-grid"><article v-for="metric in activeAnalysisGroup.metrics" :key="metric.name"><span>{{metricDisplayName(metric)}}</span><strong>{{metric.actual}} <small>{{metricDisplayUnit(metric)}}</small></strong><em :class="metric.level">{{metric.level==='normal'?'正常':metric.level==='warning'?'预警':'告警'}}</em></article></div>
                      <div class="along-course-summary"><span><b>反硝化段</b>TN 由 31.7 降至 11.5 mg/L，碳源利用充分</span><span><b>硝化段</b>NH₃-N 由 10.2 降至 3.28 mg/L</span><span><b>溶解氧</b>好氧末端 0.52 mg/L，建议结合曝气策略关注</span></div>
                    </div>
                    <table v-else class="diagnosis-table grouped-table">
                      <thead><tr><th>指标</th><th>单位</th><th>设计值</th><th>目标值</th><th>实际值</th><th>偏差与状态</th><th>指标意义</th></tr></thead>
                      <tbody><tr v-for="metric in activeAnalysisGroup.metrics" :key="`${metric.category}-${metric.name}`" :class="`diagnosis-row-${metric.level}`">
                        <td><b>{{metricDisplayName(metric)}}</b></td><td>{{metricDisplayUnit(metric)}}</td><td>{{metric.design}}</td><td>{{metric.target}}</td><td><strong>{{metric.actual}}</strong></td>
                        <td><div class="deviation-cell"><div><span :class="`diagnosis-dot ${metric.level}`"></span><b v-if="metric.deviation!==null" :class="metric.level">{{metric.deviation>0?'+':''}}{{metric.deviation.toFixed(1)}}%</b><b v-else>—</b><em>{{metric.level==='normal'?'正常':metric.level==='warning'?'预警':'告警'}}</em></div><span class="deviation-track"><i :class="metric.level" :style="{width:deviationWidth(metric.deviation)}"></i></span></div></td>
                        <td><small>{{metric.meaning}}</small></td>
                      </tr></tbody>
                    </table>
              </div>
              <div class="diagnosis-legend"><span><i class="normal"></i>正常：处于合理范围或优于目标</span><span><i class="warning"></i>预警：偏离工况目标，需要关注</span><span><i class="alarm"></i>告警：明显异常，建议核查处置</span></div>
            </section>

            <section class="process-controls">
              <nav class="diagnosis-board-tabs control-board-tabs" aria-label="过程控制分类">
                <div v-for="group in displayControlGroups" :key="group.key" :class="['diagnosis-board-tab',{selected:activeControlGroup?.key===group.key}]">
                  <button type="button" @click="activeControlGroupKey=group.key"><b>{{group.title}}</b><span class="tab-status-counts"><i class="normal" :class="{empty:statusCounts(group.indicators).normal===0}">{{statusCounts(group.indicators).normal}}</i><i class="warning" :class="{empty:statusCounts(group.indicators).warning===0}">{{statusCounts(group.indicators).warning}}</i><i class="alarm" :class="{empty:statusCounts(group.indicators).alarm===0}">{{statusCounts(group.indicators).alarm}}</i></span></button>
                  <button type="button" class="board-gear" title="配置指标" :aria-label="`配置${group.title}指标`" @click="openModuleMetricManager('diagnosis',group.title)">⚙</button>
                </div>
              </nav>
              <div v-if="activeControlGroup" class="control-indicator-list diagnosis-tab-panel">
                <div class="control-indicator-head"><span>指标</span><span>单位</span><span>设计值</span><span>目标值</span><span>实际值</span><span>偏差</span></div>
                <div v-for="indicator in activeControlGroup.indicators" :key="indicator.name" class="control-indicator-row">
                  <b>{{metricDisplayName({category:activeControlGroup.title,...indicator})}}</b><span>{{metricDisplayUnit({category:activeControlGroup.title,...indicator})}}</span><span>{{indicator.design||''}}</span><span>{{indicator.target}}</span><strong>{{indicator.actual}}</strong><em :class="indicator.level">{{indicator.deviation===null?'范围内':`${indicator.deviation>0?'+':''}${indicator.deviation.toFixed(1)}%`}}</em>
                </div>
              </div>
            </section>
          </div>
        </template>
        <template v-else-if="active==='processReport'">
          <section class="entry-list-toolbar process-report-toolbar"><div><b>工艺分析日报</b><small>由工艺诊断分析保存生成</small></div><span>共 {{filteredProcessReports.length}} 条记录</span></section>
          <section class="entry-filter-panel process-report-filters"><label>关键词<input v-model="processReportFilters.keyword" placeholder="水厂、工艺线、工况" /></label><label>开始日期<input v-model="processReportFilters.dateFrom" type="date" /></label><label>结束日期<input v-model="processReportFilters.dateTo" type="date" /></label><button class="primary entry-query-button">查询</button><button @click="Object.assign(processReportFilters,{keyword:'',dateFrom:'',dateTo:''})">清空</button></section>
          <section class="process-data-panel process-report-list"><div class="process-table-wrap"><table class="process-config-table process-summary-table"><thead><tr><th>水厂</th><th>工艺线</th><th>匹配工况</th><th>分析日期</th><th>正常指标个数</th><th>预警指标个数</th><th>告警指标个数</th><th>更新时间</th></tr></thead><tbody><tr v-for="record in filteredProcessReports" :key="record.id"><td><b>{{record.siteName}}</b></td><td>{{record.line}}</td><td>{{record.scenario}}</td><td><strong>{{record.reportDate}}</strong></td><td><span class="report-count normal">{{record.normalCount??'—'}}</span></td><td><span class="report-count warning">{{record.warningCount??'—'}}</span></td><td><span class="report-count alarm">{{record.alarmCount??'—'}}</span></td><td>{{record.updatedAt}}</td></tr><tr v-if="!filteredProcessReports.length"><td colspan="8" class="entry-empty-row">暂无工艺分析日报，请先在“工艺诊断分析”中保存</td></tr></tbody></table></div></section>
        </template>
        <template v-else-if="active==='processDesign'">
          <section class="process-page-toolbar"><div><label>水厂<select :value="selectedSite"><option :value="selectedSite">{{currentSite?.name}}</option></select></label><label>工艺线<select v-model="diagnosisLine"><option>一期生化线</option><option>二期生化线</option></select></label></div><div><span>共 {{designMetrics.length}} 项设计指标</span><button class="page-gear-button" title="配置指标" aria-label="配置工艺设计标准指标" @click="openModuleMetricManager('design')">⚙</button><button v-if="!designEditMode" @click="beginDesignEdit">编辑设计值</button><button v-else class="primary" @click="saveDesignValues">保存设计值</button></div></section>
          <section class="process-data-panel"><div class="process-explain"><b>设计基准</b><span>记录水厂及工艺线建设、改扩建设计文件中的固定基准值，供诊断分析引用。</span></div><div class="process-table-wrap"><table class="process-config-table"><thead><tr><th>指标分类</th><th>指标名称</th><th>单位</th><th>设计值</th><th>指标意义</th><th>状态</th></tr></thead><tbody><tr v-for="metric in designMetrics" :key="metricKey(metric)"><td><span class="category-chip">{{metric.category}}</span></td><td><b>{{metricDisplayName(metric)}}</b></td><td>{{metricDisplayUnit(metric)}}</td><td><input v-if="designEditMode" v-model="designValues[metricKey(metric)]" /><strong v-else>{{designValueFor(metric)}}</strong></td><td>{{metric.meaning}}</td><td><span class="process-status">已启用</span></td></tr></tbody></table></div></section>
        </template>
        <template v-else-if="active==='conditionMatrix'">
          <section class="condition-layout">
            <aside class="condition-list"><header><div><b>工况管理</b><small>{{conditionPlans.length}} 套</small></div><button @click="showConditionForm=true">＋ 新增</button></header><button v-for="plan in conditionPlans" :key="plan.id" :class="{selected:selectedConditionId===plan.id}" @click="selectedConditionId=plan.id;conditionEditMode=false"><span><b>{{plan.name}}</b><small>{{plan.effectiveFrom}} 至 {{plan.effectiveTo}}</small></span><i>›</i></button></aside>
            <section v-if="selectedCondition" class="condition-detail"><div class="condition-meta"><label>工况名称<input v-model="selectedCondition.name" :disabled="!conditionEditMode" /></label><label>起始日期<input v-model="selectedCondition.effectiveFrom" type="date" :disabled="!conditionEditMode" /></label><label>结束日期<input v-model="selectedCondition.effectiveTo" type="date" :disabled="!conditionEditMode" /></label><label>说明<input v-model="selectedCondition.description" :disabled="!conditionEditMode" /></label><div class="condition-actions"><button class="page-gear-button" title="配置指标" aria-label="配置工况指标" @click="openModuleMetricManager('condition')">⚙</button><button class="danger-lite" @click="deleteCondition(selectedCondition.id)">删除</button><button v-if="!conditionEditMode" @click="conditionEditMode=true">修改</button><button v-else class="primary" @click="saveConditions">保存</button></div></div><div class="process-table-wrap"><table class="process-config-table"><thead><tr><th>指标分类</th><th>指标名称</th><th>单位</th><th>设计值</th><th>目标值</th><th>状态</th></tr></thead><tbody><tr v-for="metric in conditionMetrics" :key="metricKey(metric)"><td><span class="category-chip">{{metric.category}}</span></td><td><b>{{metricDisplayName(metric)}}</b></td><td>{{metricDisplayUnit(metric)}}</td><td>{{designValueFor(metric)}}</td><td><input v-if="conditionEditMode" v-model="selectedCondition.targets[metricKey(metric)]" /><strong v-else>{{selectedCondition.targets[metricKey(metric)]||metric.target||'—'}}</strong></td><td><span class="process-status">已启用</span></td></tr></tbody></table></div></section>
          </section>
          <div v-if="showConditionForm" class="inline-popover"><form @submit.prevent="createCondition"><header><b>新增工况</b><button type="button" @click="showConditionForm=false">×</button></header><label>工况名称<input v-model="conditionForm.name" required placeholder="例如：雨季高负荷工况" /></label><label>起始日期<input v-model="conditionForm.effectiveFrom" type="date" required /></label><label>结束日期<input v-model="conditionForm.effectiveTo" type="date" required /></label><label>工况说明<textarea v-model="conditionForm.description" rows="3"></textarea></label><footer><button type="button" @click="showConditionForm=false">取消</button><button class="primary">创建工况</button></footer></form></div>
        </template>
        <template v-else-if="active==='operationEntry'">
          <template v-if="operationEntryView==='list'">
            <section class="entry-list-toolbar">
              <div class="entry-list-actions"><button class="primary" @click="newOperationEntry">＋ 新增日报</button><button @click="editOperationEntry()">编辑</button><button class="danger-lite" @click="deleteOperationEntries()">删除</button><button @click="toggleLockOperationEntries">锁定 / 解锁</button><button @click="resetOperationEntryFilters">刷新</button><button class="page-gear-button" title="配置填报指标" aria-label="配置填报指标" @click="openModuleMetricManager('entry')">⚙</button></div>
              <span>共 {{filteredOperationEntryRecords.length}} 条日报 · 已选择 {{selectedOperationEntryIds.length}} 条</span>
            </section>
            <section class="entry-filter-panel">
              <label>关键词<input v-model="operationEntryFilters.keyword" placeholder="水厂、编号、填报人" /></label>
              <label>工艺线<select v-model="operationEntryFilters.line"><option value="">全部</option><option>一期生化线</option><option>二期生化线</option></select></label>
              <label>开始日期<input v-model="operationEntryFilters.dateFrom" type="date" /></label>
              <label>结束日期<input v-model="operationEntryFilters.dateTo" type="date" /></label>
              <label>填报状态<select v-model="operationEntryFilters.status"><option value="">全部</option><option value="DRAFT">草稿</option><option value="COMPLETED">已完成</option><option value="LOCKED">已锁定</option></select></label>
              <button class="primary entry-query-button">查询</button><button class="entry-reset-button" @click="resetOperationEntryFilters">清空</button><button @click="chooseOperationEntryImport">批量导入</button><button @click="exportOperationEntries">批量导出</button>
              <input ref="operationEntryImportInput" class="entry-import-input" type="file" accept=".xlsx,.xls" @change="importOperationEntries" />
            </section>
            <section class="process-data-panel entry-list-panel">
              <div class="process-table-wrap"><table class="process-config-table daily-entry-table"><thead><tr><th class="entry-select-cell"><input type="checkbox" :checked="allPagedOperationEntriesSelected" @change="toggleAllOperationEntries(($event.target as HTMLInputElement).checked)" /></th><th>状态</th><th>水厂名称</th><th>水厂编号</th><th>工艺条线</th><th>填报日期</th><th>匹配工况</th><th v-for="metric in entryMetrics" :key="metricKey(metric)" class="entry-metric-column"><small>{{metric.category}}</small><b>{{metricDisplayName(metric)}}</b><em>{{metricDisplayUnit(metric)}}</em></th><th>填报进度</th><th>填报人</th><th>更新时间</th></tr></thead><tbody>
                <tr v-for="record in pagedOperationEntryRecords" :key="record.id" :class="{selected:selectedOperationEntryIds.includes(record.id)}"><td class="entry-select-cell"><input v-model="selectedOperationEntryIds" type="checkbox" :value="record.id" /></td><td><span :class="['entry-record-status',record.status.toLowerCase()]">{{statusText(record.status)}}</span></td><td><b>{{record.siteName}}</b></td><td><code>{{record.siteCode}}</code></td><td>{{record.line}}</td><td><strong>{{record.entryDate}}</strong></td><td>{{record.scenario}}</td><td v-for="metric in entryMetrics" :key="metricKey(metric)" class="entry-metric-column">{{record.values[metricKey(metric)]||'—'}}</td><td>{{Object.values(record.values).filter(Boolean).length}} / {{entryMetrics.length}}</td><td>{{record.updatedBy}}</td><td>{{record.updatedAt}}</td></tr>
                <tr v-if="!filteredOperationEntryRecords.length"><td :colspan="entryMetrics.length+10" class="entry-empty-row">未查询到符合条件的日报</td></tr>
              </tbody></table></div>
            </section>
            <section class="entry-pagination"><div><span>共 {{filteredOperationEntryRecords.length}} 条</span><select v-model.number="operationEntryPageSize"><option :value="10">10条/页</option><option :value="20">20条/页</option><option :value="50">50条/页</option><option :value="100">100条/页</option></select></div><nav><button :disabled="operationEntryPage===1" @click="setOperationEntryPage(operationEntryPage-1)">‹</button><button v-for="page in operationEntryPageNumbers" :key="page" :class="{selected:page===operationEntryPage}" @click="setOperationEntryPage(page)">{{page}}</button><button :disabled="operationEntryPage===operationEntryPageCount" @click="setOperationEntryPage(operationEntryPage+1)">›</button></nav><label>前往<input :value="operationEntryPage" type="number" min="1" :max="operationEntryPageCount" @change="setOperationEntryPage(Number(($event.target as HTMLInputElement).value))" />页</label></section>
          </template>
          <template v-else>
            <section class="process-page-toolbar entry-form-toolbar"><div><button @click="operationEntryView='list'">← 返回列表</button><label>水厂<select :value="selectedSite"><option :value="selectedSite">{{currentSite?.name||'第一污水处理厂（示例）'}}</option></select></label><label>工艺线<select v-model="diagnosisLine" @change="loadOperationEntry"><option>一期生化线</option><option>二期生化线</option></select></label><label>填报日期<input v-model="entryDate" type="date" @change="loadOperationEntry" /></label><label>匹配工况<select :value="entryCondition?.id||''" disabled title="根据填报日期自动匹配"><option v-if="!entryCondition" value="">未匹配工况</option><option v-for="plan in conditionPlans" :key="plan.id" :value="plan.id">{{plan.name}}</option></select></label></div><div><span>需填 {{entryMetrics.length}} 项 · 自动计算 {{calculatedEntryMetricCount}} 项　上次保存：{{entrySavedAt}}</span><button class="primary" @click="saveOperationEntry">保存日报</button></div></section>
            <section class="process-data-panel entry-panel">
              <div class="process-explain"><b>每日原始数据填报</b><span>仅填写现场采集或人工记录的第一手数据；比值、去除率及其他公式指标由系统自动计算。</span></div>
              <nav class="entry-category-tabs" aria-label="指标分类页签"><button v-for="group in entryGroups" :key="group.category" type="button" :class="{selected:activeEntryGroup?.category===group.category}" @click="activeEntryCategory=group.category"><span>{{group.category}}</span><small>{{filledEntryCount(group.metrics)}} / {{group.metrics.length}}</small></button></nav>
              <div v-if="activeEntryGroup" class="entry-group-summary"><b>{{activeEntryGroup.category}}</b><span>共 {{activeEntryGroup.metrics.length}} 项原始数据，已填写 {{filledEntryCount(activeEntryGroup.metrics)}} 项</span><button class="page-gear-button" title="配置指标" :aria-label="`配置${activeEntryGroup.category}填报指标`" @click="openModuleMetricManager('entry',activeEntryGroup.category)">⚙</button></div>
              <div v-if="activeEntryGroup" class="process-table-wrap"><table class="process-config-table entry-table"><thead><tr><th>指标名称</th><th>单位</th><th>设计值</th><th>当前工况目标值</th><th>实际值</th><th>数据状态</th></tr></thead><tbody><tr v-for="metric in activeEntryGroup.metrics" :key="metricKey(metric)"><td><b>{{metricDisplayName(metric)}}</b></td><td>{{metricDisplayUnit(metric)}}</td><td>{{designValueFor(metric)}}</td><td>{{entryCondition?(entryCondition.targets[metricKey(metric)]||metric.target):'—'}}</td><td><input v-model="entryValues[metricKey(metric)]" :placeholder="settingFor(metric).fillSpec||'请输入'" :required="settingFor(metric).required" /></td><td><span :class="['entry-state',{empty:!entryValues[metricKey(metric)]}]">{{entryValues[metricKey(metric)]?'已填写':'待填写'}}</span></td></tr></tbody></table></div>
            </section>
          </template>
        </template>
        <template v-else-if="active==='labRecords'">
          <template v-if="labRecordView==='folders'">
            <section class="lab-simple-toolbar"><div><button @click="labRecordView='folders'">刷新</button></div><span>选择检测项目，进入每日原始记录台账</span></section>
            <section class="lab-folder-grid"><button v-for="folder in labFolders" :key="folder.type" @click="openLabFolder(folder.type)"><i>{{folder.icon}}</i><b>{{folder.name}}</b><small>{{folder.method}}</small><em>{{labOriginalRecords.filter(record=>record.type===folder.type).length}} 张记录</em></button><button class="lab-folder-planned" disabled><i>＋</i><b>其他检测项目</b><small>后续按同一模板扩展</small><em>规划中</em></button></section>
          </template>
          <template v-else-if="labRecordView==='list'">
            <section class="lab-simple-toolbar"><div><button @click="labRecordView='folders'">← 返回项目</button><button class="primary" @click="newLabRecord">＋ 新建</button><button @click="editLabRecord()">编辑</button><button class="danger-lite" @click="deleteLabRecord">删除</button><button @click="toggleLabRecordLock">{{selectedLabRecord?.locked?'解锁':'锁定'}}</button><button @click="resetLabRecordFilters">刷新</button><button @click="exportLabRecord()">导出 Excel</button></div><b>{{labRecordTitle(labRecordType)}}</b></section>
            <section class="lab-record-filters"><label>关键词<input v-model="labRecordFilters.keyword" placeholder="编号、样品或检测人" /></label><label>开始日期<input v-model="labRecordFilters.dateFrom" type="date" /></label><label>结束日期<input v-model="labRecordFilters.dateTo" type="date" /></label><label>锁定状态<select v-model="labRecordFilters.locked"><option value="">全部</option><option value="unlocked">未锁定</option><option value="locked">已锁定</option></select></label><button class="primary">查询</button><button @click="resetLabRecordFilters">清空</button></section>
            <section class="lab-record-list-panel"><div class="process-table-wrap"><table class="process-config-table lab-record-list"><thead><tr><th>选择</th><th>锁定</th><th>检测项目</th><th>室温</th><th>湿度</th><th>原始记录编号</th><th>关键参数一</th><th>关键参数二</th><th>取样日期</th><th>检测日期</th><th>检测人</th><th>复核人</th><th>更新时间</th></tr></thead><tbody><tr v-for="record in filteredLabRecords" :key="record.id" :class="{selected:selectedLabRecord?.id===record.id}" @click="labRecordSelectedId=record.id"><td><input type="radio" :checked="selectedLabRecord?.id===record.id" /></td><td>{{record.locked?'🔒':'—'}}</td><td><b>{{labTypeShort(record.type)}}</b></td><td>{{record.roomTemperature}} ℃</td><td>{{record.humidity}}%</td><td><code>{{record.recordNo}}</code></td><td>{{labListParameter(record,1)}}</td><td>{{labListParameter(record,2)}}</td><td>{{record.sampleDate}}</td><td>{{record.testDate}}</td><td>{{record.analyst}}</td><td>{{record.reviewer||'—'}}</td><td>{{record.updatedAt}}</td></tr><tr v-if="!filteredLabRecords.length"><td colspan="13" class="entry-empty-row">未查询到原始记录</td></tr></tbody></table></div></section>
            <section v-if="selectedLabRecord" class="lab-detail-panel"><header><b>样品明细</b><span>{{selectedLabRecord.recordNo}} · {{selectedLabRecord.samples.length}} 个样品</span></header><div class="process-table-wrap">
              <table v-if="selectedLabRecord.type==='COD'" class="process-config-table lab-sample-detail"><thead><tr><th>样品来源</th><th>样品名称</th><th>取样体积 V/mL</th><th>稀释倍数 n</th><th>V始</th><th>V终</th><th>V耗</th><th>检测结果 mg/L</th></tr></thead><tbody><tr v-for="(row,index) in selectedLabRecord.samples" :key="index"><td>{{row.source}}</td><td>{{row.name}}</td><td>{{row.volume}}</td><td>{{row.dilution}}</td><td>{{row.start}}</td><td>{{row.end}}</td><td>{{volumeUsed(row).toFixed(2)}}</td><td><strong>{{formatLabResult(selectedLabRecord,row)}}</strong></td></tr></tbody></table>
              <table v-else-if="selectedLabRecord.type==='NH3'" class="process-config-table lab-sample-detail"><thead><tr><th>样品来源</th><th>样品名称</th><th>取样体积 V/mL</th><th>稀释倍数 n</th><th>吸光度差 A−A0</th><th>实测值 μg</th><th>检测结果 mg/L</th></tr></thead><tbody><tr v-for="(row,index) in selectedLabRecord.samples" :key="index"><td>{{row.source}}</td><td>{{row.name}}</td><td>{{row.volume}}</td><td>{{row.dilution}}</td><td>{{row.absorbance}}</td><td>{{ammoniaMass(selectedLabRecord,row).toFixed(4)}}</td><td><strong>{{formatLabResult(selectedLabRecord,row)}}</strong></td></tr></tbody></table>
              <table v-else-if="selectedLabRecord.type==='SS'" class="process-config-table lab-sample-detail"><thead><tr><th>样品来源</th><th>样品名称</th><th>取样体积 V/mL</th><th>容器编号</th><th>W1最终值/g</th><th>W2最终值/g</th><th>W2−W1/g</th><th>检测结果 mg/L</th></tr></thead><tbody><tr v-for="(row,index) in selectedLabRecord.samples" :key="index"><td>{{row.source}}</td><td>{{row.name}}</td><td>{{row.volume}}</td><td>{{row.containerNo}}</td><td>{{stableWeight(row.tareFirst,row.tareSecond).toFixed(4)}}</td><td>{{stableWeight(row.loadedFirst,row.loadedSecond).toFixed(4)}}</td><td>{{ssNetWeight(row).toFixed(4)}}</td><td><strong>{{formatLabResult(selectedLabRecord,row)}}</strong></td></tr></tbody></table>
              <table v-else class="process-config-table lab-sample-detail"><thead><tr><th>样品来源</th><th>样品名称</th><th>稀释后取样体积 V/mL</th><th>稀释倍数 n</th><th>培养基</th><th>皿号</th><th>菌落数/个</th><th>监测结果 个/L</th></tr></thead><tbody><tr v-for="(row,index) in selectedLabRecord.samples" :key="index"><td>{{row.source}}</td><td>{{row.name}}</td><td>{{row.volume}}</td><td>{{row.dilution}}</td><td>{{row.medium}}</td><td>{{row.plateNo}}</td><td>{{row.colonyCount}}</td><td><strong>{{formatLabResult(selectedLabRecord,row)}}</strong></td></tr></tbody></table>
            </div></section>
          </template>
          <template v-else>
            <section class="lab-form-toolbar"><button @click="labRecordView='list'">← 返回台账</button><button class="primary" @click="saveLabRecord">保存</button><button @click="labRecordForm=createLabRecordModel(labRecordType)">新建</button><button @click="labRecordForm.locked=!labRecordForm.locked">{{labRecordForm.locked?'解锁':'锁定'}}</button><button @click="printLabRecord">打印 / 预览</button><button @click="exportLabRecord(labRecordForm)">导出 Excel</button><span></span><button @click="addLabSampleRow">＋ 插入行</button></section>
            <section class="lab-paper-wrap">
              <article class="lab-paper" :class="labRecordForm.type.toLowerCase()">
                <h1>{{labRecordTitle(labRecordForm.type)}}</h1>
                <div class="lab-paper-meta"><label>检测项目<input :value="labTypeShort(labRecordForm.type)" readonly /></label><label>室温（℃）<input v-model="labRecordForm.roomTemperature" /></label><label>湿度（%）<input v-model="labRecordForm.humidity" /></label><label>原始记录编号<input v-model="labRecordForm.recordNo" /></label></div>
                <template v-if="labRecordForm.type==='COD'">
                  <table class="lab-paper-table cod-main"><thead><tr><th rowspan="2">样品来源</th><th rowspan="2">样品名称</th><th rowspan="2">取样体积<br>V（mL）</th><th rowspan="2">稀释倍数（n）</th><th colspan="3">硫酸亚铁铵标准溶液滴定数（mL）</th><th rowspan="2">检测结果（mg/L）</th><th rowspan="2">操作</th></tr><tr><th>V始</th><th>V终</th><th>V耗</th></tr></thead><tbody><tr class="lab-blank-row"><td>—</td><td>空白样</td><td>10</td><td>1</td><td><input v-model="labRecordForm.blankStart" /></td><td><input v-model="labRecordForm.blankEnd" /></td><td>{{volumeUsed({start:labRecordForm.blankStart,end:labRecordForm.blankEnd}).toFixed(2)}}</td><td>—</td><td>—</td></tr><tr v-for="(row,index) in labRecordForm.samples" :key="index"><td><input v-model="row.source" /></td><td><input v-model="row.name" /></td><td><input v-model="row.volume" /></td><td><input v-model="row.dilution" /></td><td><input v-model="row.start" /></td><td><input v-model="row.end" /></td><td class="calculated">{{volumeUsed(row).toFixed(2)}}</td><td class="calculated result">{{formatLabResult(labRecordForm,row)}}</td><td><button @click="deleteLabSampleRow(index)">删除</button></td></tr><tr v-for="index in 3" :key="`empty-${index}`"><td v-for="cell in 9" :key="cell">&nbsp;</td></tr></tbody></table>
                  <table class="lab-paper-table lab-method-table"><tbody><tr><th>方法依据</th><td colspan="3">HJ 828—2017</td><th>标准溶液 C2</th><td colspan="3">硫酸亚铁铵标准溶液</td></tr><tr><th rowspan="3">计算公式</th><td colspan="3" rowspan="2">COD（mg/L）= C2 ×（V0 − V1）× n × 8000 ÷ V</td><th>基准物质浓度 C1</th><td><input v-model="labRecordForm.c1" /></td><th>基准物质体积</th><td><input v-model="labRecordForm.standardVolume" /></td></tr><tr><th>标准滴定①</th><td><input v-model="labRecordForm.standardStart1" /> 至 <input v-model="labRecordForm.standardEnd1" /></td><th>标准滴定②</th><td><input v-model="labRecordForm.standardStart2" /> 至 <input v-model="labRecordForm.standardEnd2" /></td></tr><tr><td colspan="3">V0：空白试验消耗体积；V1：水样测定消耗体积</td><th>C2（mol/L）</th><td class="calculated">{{codC2(labRecordForm).toFixed(6)}}</td><th>V标均（mL）</th><td class="calculated">{{codStandardAverage(labRecordForm).toFixed(2)}}</td></tr><tr><th>备注</th><td colspan="7"><input v-model="labRecordForm.notes" /></td></tr></tbody></table>
                </template>
                <template v-else-if="labRecordForm.type==='NH3'">
                  <table class="lab-paper-table lab-equipment-table"><tbody><tr><th>仪器型号</th><td><input v-model="labRecordForm.instrumentModel" /></td><th>比色皿</th><td>玻璃 20 mm</td><th>方法依据</th><td>HJ 535—2009</td></tr><tr><th>波长</th><td><input v-model="labRecordForm.wavelength" /> nm</td><th>参比液</th><td><input v-model="labRecordForm.referenceSolution" /></td><th>标准溶液</th><td><input v-model="labRecordForm.standardSolution" /></td></tr><tr><td colspan="6">计算公式：样品浓度（mg/L）= 实测值（μg）÷ 取样体积 V × 稀释倍数</td></tr></tbody></table>
                  <table class="lab-paper-table nh3-curve"><tbody><tr><th rowspan="3">标准曲线测定</th><th>标准液（mL）</th><td>0.00</td><td>0.50</td><td>1.00</td><td>2.00</td><td>4.00</td><td>6.00</td><td>8.00</td></tr><tr><th>含量（μg）</th><td>0.00</td><td>5.00</td><td>10.00</td><td>20.00</td><td>40.00</td><td>60.00</td><td>80.00</td></tr><tr><th>标准曲线</th><td colspan="3">A0 = <input v-model="labRecordForm.a0" /></td><td colspan="4">y = <input v-model="labRecordForm.curveSlope" /> x + <input v-model="labRecordForm.curveIntercept" /></td></tr></tbody></table>
                  <table class="lab-paper-table nh3-samples"><thead><tr><th>样品来源</th><th>样品名称</th><th>取样体积 V（mL）</th><th>稀释倍数</th><th>吸光度差 A−A0</th><th>实测值（μg）</th><th>检测结果（mg/L）</th><th>操作</th></tr></thead><tbody><tr v-for="(row,index) in labRecordForm.samples" :key="index"><td><input v-model="row.source" /></td><td><input v-model="row.name" /></td><td><input v-model="row.volume" /></td><td><input v-model="row.dilution" /></td><td><input v-model="row.absorbance" /></td><td class="calculated">{{ammoniaMass(labRecordForm,row).toFixed(4)}}</td><td class="calculated result">{{ammoniaResult(labRecordForm,row).toFixed(3)}}</td><td><button @click="deleteLabSampleRow(index)">删除</button></td></tr><tr v-for="index in 4" :key="`empty-nh3-${index}`"><td v-for="cell in 8" :key="cell">&nbsp;</td></tr></tbody></table>
                  <table class="lab-paper-table"><tbody><tr><th>备注</th><td><input v-model="labRecordForm.notes" /></td></tr></tbody></table>
                </template>
                <template v-else-if="labRecordForm.type==='SS'">
                  <table class="lab-paper-table ss-main"><thead><tr><th rowspan="2">样品来源</th><th rowspan="2">样品名称</th><th rowspan="2">取样体积 V（mL）</th><th rowspan="2">容器编号</th><th colspan="3">（容器＋滤膜）重 W1（g）</th><th colspan="3">（容器＋滤膜＋被测物）重 W2（g）</th><th rowspan="2">W2−W1（g）</th><th rowspan="2">检测结果（mg/L）</th><th rowspan="2">操作</th></tr><tr><th>第一次</th><th>第二次</th><th>最终值</th><th>第一次</th><th>第二次</th><th>最终值</th></tr></thead><tbody><tr v-for="(row,index) in labRecordForm.samples" :key="index"><td><input v-model="row.source" /></td><td><input v-model="row.name" /></td><td><input v-model="row.volume" /></td><td><input v-model="row.containerNo" /></td><td><input v-model="row.tareFirst" /></td><td><input v-model="row.tareSecond" /></td><td class="calculated">{{stableWeight(row.tareFirst,row.tareSecond).toFixed(4)}}</td><td><input v-model="row.loadedFirst" /></td><td><input v-model="row.loadedSecond" /></td><td class="calculated">{{stableWeight(row.loadedFirst,row.loadedSecond).toFixed(4)}}</td><td class="calculated">{{ssNetWeight(row).toFixed(4)}}</td><td class="calculated result">{{formatLabResult(labRecordForm,row)}}</td><td><button @click="deleteLabSampleRow(index)">删除</button></td></tr><tr v-for="index in 7" :key="`empty-ss-${index}`"><td v-for="cell in 13" :key="cell">&nbsp;</td></tr></tbody></table>
                  <table class="lab-paper-table ss-method"><tbody><tr><th>方法依据</th><td>GB 11901—89</td><th>干燥条件</th><td>干燥温度 <input v-model="labRecordForm.dryingTemperature" /> ℃</td><th>计算公式</th><td>悬浮物（mg/L）=（W2−W1）× 1,000,000 ÷ V</td></tr><tr><th>备注</th><td colspan="5"><input v-model="labRecordForm.notes" /></td></tr></tbody></table>
                </template>
                <template v-else>
                  <table class="lab-paper-table fc-main"><thead><tr><th>样品来源</th><th>样品名称</th><th>稀释后取样体积 V（mL）</th><th>稀释倍数（n）</th><th>培养基</th><th>皿号</th><th>粪大肠菌群数（个）</th><th>监测结果（个/L）</th><th>操作</th></tr></thead><tbody><tr v-for="(row,index) in labRecordForm.samples" :key="index"><td><input v-model="row.source" /></td><td><input v-model="row.name" /></td><td><input v-model="row.volume" /></td><td><input v-model="row.dilution" /></td><td><input v-model="row.medium" /></td><td><input v-model="row.plateNo" /></td><td><input v-model="row.colonyCount" /></td><td class="calculated result">{{formatLabResult(labRecordForm,row)}}</td><td><button @click="deleteLabSampleRow(index)">删除</button></td></tr><tr v-for="index in 8" :key="`empty-fc-${index}`"><td v-for="cell in 9" :key="cell">&nbsp;</td></tr></tbody></table>
                  <table class="lab-paper-table fc-method"><tbody><tr><th>培养条件</th><td>培养温度 <input v-model="labRecordForm.cultureTemperature" /> ℃　培养时间 <input v-model="labRecordForm.cultureTime" /> h</td><th>计算公式</th><td>粪大肠菌群数（个/L）= 滤膜上菌落数 × 1000 × n ÷ V</td></tr><tr><th>方法依据</th><td>HJ 347.1—2018</td><th>备注</th><td><input v-model="labRecordForm.notes" /></td></tr></tbody></table>
                </template>
                <footer class="lab-paper-footer"><label>取样日期<input v-model="labRecordForm.sampleDate" type="date" /></label><label>检测日期<input v-model="labRecordForm.testDate" type="date" /></label><label>检测人<input v-model="labRecordForm.analyst" /></label><label>复核人<input v-model="labRecordForm.reviewer" /></label></footer>
              </article>
            </section>
          </template>
        </template>
        <template v-else-if="active==='labReports'">
          <template v-if="labReportView==='folders'">
            <section class="lab-simple-toolbar"><div><button @click="labReportView='folders'">刷新</button></div><span>选择报表周期，进入化验统计报表</span></section>
            <section class="lab-folder-grid lab-report-folders"><button @click="openLabDailyReport"><i>日报</i><b>化验日报表</b><small>汇总每日水质与污泥检测结果</small><em>{{labDailyReports.length}} 张已保存</em></button><button class="lab-folder-planned" disabled><i>月报</i><b>化验月报表</b><small>按月汇总与趋势分析</small><em>规划中</em></button></section>
          </template>
          <template v-else>
            <section class="lab-form-toolbar lab-report-toolbar"><button @click="labReportView='folders'">← 返回报表</button><label>报表日期<input v-model="labDailyReport.date" type="date" @change="changeLabReportDate" /></label><button class="primary" @click="refreshLabDailyReport()">更新原始记录</button><button @click="saveLabDailyReport">保存</button><button @click="printLabDailyReport">打印 / 预览</button><button @click="exportLabDailyReport">导出 Excel</button><span>最近更新：{{labDailyReport.updatedAt}}</span></section>
            <section class="lab-paper-wrap lab-report-wrap">
              <article class="lab-report-paper">
                <h1>化验日报表</h1>
                <button class="lab-report-refresh" @click="refreshLabDailyReport()">更新</button>
                <div class="lab-report-meta"><label>项目名称<input v-model="labDailyReport.projectName" /></label><label>统计报表编号<input v-model="labDailyReport.reportNo" /></label></div>
                <table class="lab-report-table"><thead><tr><th>类别</th><th>频次</th><th>项目</th><th colspan="2">进水</th><th colspan="2">出水</th></tr></thead><tbody>
                  <tr><td rowspan="12" class="report-category">污水</td><td rowspan="9">日检</td><th>pH</th><td colspan="2"><input v-model="labDailyReport.values['sewage.ph.in']" /></td><td colspan="2"><input v-model="labDailyReport.values['sewage.ph.out']" /></td></tr>
                  <tr><th>CODCr（mg/L）</th><td colspan="2"><input v-model="labDailyReport.values['sewage.cod.in']" /></td><td colspan="2"><input v-model="labDailyReport.values['sewage.cod.out']" /></td></tr>
                  <tr><th>BOD₅（mg/L）</th><td colspan="2"><input v-model="labDailyReport.values['sewage.bod5.in']" /></td><td colspan="2"><input v-model="labDailyReport.values['sewage.bod5.out']" /></td></tr>
                  <tr><th>SS（mg/L）</th><td colspan="2"><input v-model="labDailyReport.values['sewage.ss.in']" /></td><td colspan="2"><input v-model="labDailyReport.values['sewage.ss.out']" /></td></tr>
                  <tr><th>NH₃-N（mg/L）</th><td colspan="2"><input v-model="labDailyReport.values['sewage.nh3.in']" /></td><td colspan="2"><input v-model="labDailyReport.values['sewage.nh3.out']" /></td></tr>
                  <tr><th>TP（mg/L）</th><td colspan="2"><input v-model="labDailyReport.values['sewage.tp.in']" /></td><td colspan="2"><input v-model="labDailyReport.values['sewage.tp.out']" /></td></tr>
                  <tr><th>TN（mg/L）</th><td colspan="2"><input v-model="labDailyReport.values['sewage.tn.in']" /></td><td colspan="2"><input v-model="labDailyReport.values['sewage.tn.out']" /></td></tr>
                  <tr><th>NO₃-N（mg/L）</th><td colspan="2"><input v-model="labDailyReport.values['sewage.no3.in']" /></td><td colspan="2"><input v-model="labDailyReport.values['sewage.no3.out']" /></td></tr>
                  <tr><th>粪大肠菌群数（个/L）</th><td colspan="2"><input v-model="labDailyReport.values['sewage.fc.in']" /></td><td colspan="2"><input v-model="labDailyReport.values['sewage.fc.out']" /></td></tr>
                  <tr><td rowspan="3">周检</td><th>氯化物（mg/L）</th><td colspan="2"><input v-model="labDailyReport.values['sewage.chloride.in']" /></td><td colspan="2"><input v-model="labDailyReport.values['sewage.chloride.out']" /></td></tr>
                  <tr><th>总固体（mg/L）</th><td colspan="2"><input v-model="labDailyReport.values['sewage.totalSolids.in']" /></td><td colspan="2"><input v-model="labDailyReport.values['sewage.totalSolids.out']" /></td></tr>
                  <tr><th>溶解性固体（mg/L）</th><td colspan="2"><input v-model="labDailyReport.values['sewage.dissolvedSolids.in']" /></td><td colspan="2"><input v-model="labDailyReport.values['sewage.dissolvedSolids.out']" /></td></tr>

                  <tr class="report-section-start"><td rowspan="7" class="report-category">生化池<br>混合液</td><td rowspan="5">日检</td><th>生化池类别</th><th>A池</th><th>B池</th><th>C池</th><th>D池</th></tr>
                  <tr><th>DO（mg/L）</th><td v-for="pool in ['A','B','C','D']" :key="pool"><input v-model="labDailyReport.values[`bio.do.${pool}`]" /></td></tr>
                  <tr><th>SV（%）</th><td v-for="pool in ['A','B','C','D']" :key="pool"><input v-model="labDailyReport.values[`bio.sv.${pool}`]" /></td></tr>
                  <tr><th>MLSS（mg/L）</th><td v-for="pool in ['A','B','C','D']" :key="pool"><input v-model="labDailyReport.values[`bio.mlss.${pool}`]" /></td></tr>
                  <tr><th>SVI（mL/g）</th><td v-for="pool in ['A','B','C','D']" :key="pool"><input v-model="labDailyReport.values[`bio.svi.${pool}`]" /></td></tr>
                  <tr><td rowspan="2">周检</td><th>MLVSS（mg/L）</th><td v-for="pool in ['A','B','C','D']" :key="pool"><input v-model="labDailyReport.values[`bio.mlvss.${pool}`]" /></td></tr>
                  <tr><th>MLVSS/MLSS（%）</th><td v-for="pool in ['A','B','C','D']" :key="pool"><input v-model="labDailyReport.values[`bio.ratio.${pool}`]" /></td></tr>

                  <tr class="report-section-start"><td rowspan="5" class="report-category">回流污泥</td><td rowspan="5">周检</td><th>生化池类别</th><th>A池</th><th>B池</th><th>C池</th><th>D池</th></tr>
                  <tr><th>SV（%）</th><td v-for="pool in ['A','B','C','D']" :key="pool"><input v-model="labDailyReport.values[`return.sv.${pool}`]" /></td></tr>
                  <tr><th>MLSS（mg/L）</th><td v-for="pool in ['A','B','C','D']" :key="pool"><input v-model="labDailyReport.values[`return.mlss.${pool}`]" /></td></tr>
                  <tr><th>SVI（mL/g）</th><td v-for="pool in ['A','B','C','D']" :key="pool"><input v-model="labDailyReport.values[`return.svi.${pool}`]" /></td></tr>
                  <tr><th>MLVSS（mg/L）</th><td v-for="pool in ['A','B','C','D']" :key="pool"><input v-model="labDailyReport.values[`return.mlvss.${pool}`]" /></td></tr>

                  <tr class="report-section-start"><td rowspan="5" class="report-category">污泥</td><td rowspan="2">日检</td><th>类别</th><th colspan="2">脱水前污泥</th><th colspan="2">脱水后污泥</th></tr>
                  <tr><th>含水率（%）</th><td colspan="2"><input v-model="labDailyReport.values['sludge.moistureBefore.in']" /></td><td colspan="2"><input v-model="labDailyReport.values['sludge.moistureAfter.out']" /></td></tr>
                  <tr><td rowspan="2">周检</td><th>pH</th><td colspan="2"><input v-model="labDailyReport.values['sludge.phBefore.in']" /></td><td colspan="2"><input v-model="labDailyReport.values['sludge.phAfter.out']" /></td></tr>
                  <tr><th>有机物含量（%）</th><td colspan="2"><input v-model="labDailyReport.values['sludge.organicBefore.in']" /></td><td colspan="2"><input v-model="labDailyReport.values['sludge.organicAfter.out']" /></td></tr>
                  <tr><td>月检</td><th>粪大肠菌群数（个/L）</th><td colspan="2"><input v-model="labDailyReport.values['sludge.fcBefore.in']" /></td><td colspan="2"><input v-model="labDailyReport.values['sludge.fcAfter.out']" /></td></tr>
                  <tr><th>备注</th><td colspan="6" class="report-notes">1、污泥检测项目，不脱泥时无数据。<br>2、BOD₅为5天前样品检测结果，粪大肠菌群数为前一日样品检测结果，其余为当日样品检测结果。</td></tr>
                </tbody></table>
                <footer class="lab-report-footer"><label>日期<input v-model="labDailyReport.date" type="date" /></label><label>填报人<input v-model="labDailyReport.reporter" /></label><label>审核人<input v-model="labDailyReport.reviewer" /></label></footer>
              </article>
            </section>
          </template>
        </template>
        <template v-else-if="active==='overview'">
          <div class="metrics">
            <section><span>组织部门</span><strong>{{departmentCount}}</strong><small>已建立厂级部门</small></section>
            <section><span>班组数量</span><strong>{{teamCount}}</strong><small>覆盖现场执行单元</small></section>
            <section><span>在册人员</span><strong>{{employees.length}}</strong><small>当前示例人员</small></section>
            <section class="accent"><span>待审核风险</span><strong>{{riskSummary.pending}}</strong><small>需要安全管理人员复核</small></section>
          </div>
          <div class="panel roadmap"><div><p class="eyebrow">一期能力</p><h2>从管理底座到现场闭环</h2></div><ol><li class="done"><b>01</b><span>多厂组织与风险管控<small>已接入</small></span></li><li class="done"><b>02</b><span>检查、隐患与危险作业<small>已闭环</small></span></li><li class="done"><b>03</b><span>培训、资质与职业健康<small>已接入</small></span></li><li class="done"><b>04</b><span>设备物资与安全投入<small>已接入</small></span></li></ol></div>
        </template>
        <div v-else-if="active==='org'" class="panel table-panel"><div class="panel-head"><h2>组织单元</h2><span>{{units.length}} 条</span></div><table><thead><tr><th>编码</th><th>名称</th><th>类型</th><th>排序</th></tr></thead><tbody><tr v-for="unit in units" :key="unit.id"><td><code>{{unit.code}}</code></td><td>{{unit.name}}</td><td><span class="tag">{{unit.unitType}}</span></td><td>{{unit.sortOrder}}</td></tr></tbody></table></div>
        <div v-else-if="active==='employee'" class="panel table-panel"><div class="panel-head"><h2>员工列表</h2><span>{{employees.length}} 人</span></div><table><thead><tr><th>工号</th><th>姓名</th><th>部门</th><th>岗位</th><th>状态 / 档案</th></tr></thead><tbody><tr v-for="person in employees" :key="person.id"><td><code>{{person.employeeNo}}</code></td><td>{{person.displayName}}</td><td>{{person.organization || '—'}}</td><td>{{person.position || '—'}}</td><td><span class="tag green">在岗</span><div class="row-actions"><button @click="openSafetyArchive(person)">安全档案</button></div></td></tr></tbody></table></div>
        <div v-else-if="active==='area'" class="panel table-panel"><div class="panel-head"><div><h2>区域层级</h2><small>用于风险点、设备和现场扫码归属</small></div><div class="panel-actions"><span>{{areas.length}} 个区域</span><button @click="openAreaForm">＋ 新建区域</button></div></div><table><thead><tr><th>区域编码</th><th>区域名称</th><th>区域类型</th><th>风险对象</th><th>状态</th></tr></thead><tbody><tr v-for="area in areaRows" :key="area.id"><td><code>{{area.code}}</code></td><td><span class="area-name" :style="{paddingLeft:`${area.depth * 24}px`}"><i v-if="area.depth">└</i>{{area.name}}</span></td><td><span class="tag">{{area.areaType}}</span></td><td>{{area.objectCount}} 项</td><td><span class="tag green">{{area.status==='ACTIVE' ? '启用' : '停用'}}</span></td></tr></tbody></table></div>
        <template v-else-if="active==='risk'">
          <div class="risk-metrics">
            <section class="risk-total"><span>在册风险</span><strong>{{riskSummary.total}}</strong><small>待审核 {{riskSummary.pending}} 项</small></section>
            <section class="risk-red"><span>一级 · 红色</span><strong>{{riskSummary.red}}</strong><small>主要负责人管控</small></section>
            <section class="risk-orange"><span>二级 · 橙色</span><strong>{{riskSummary.orange}}</strong><small>厂级管控</small></section>
            <section class="risk-yellow"><span>三级 · 黄色</span><strong>{{riskSummary.yellow}}</strong><small>部门管控</small></section>
            <section class="risk-blue"><span>四级 · 蓝色</span><strong>{{riskSummary.blue}}</strong><small>班组岗位管控</small></section>
          </div>
          <div class="panel table-panel risk-table"><div class="panel-head"><div><h2>危险源风险清单</h2><small>按当前风险等级由高到低排列</small></div><div class="panel-actions"><span>{{hazards.length}} 项</span><button @click="openRiskForm">＋ 新建风险辨识</button></div></div>
            <table><thead><tr><th>编号 / 区域</th><th>风险对象与危险因素</th><th>可能事故</th><th>评估结果</th><th>管控层级</th><th>措施</th><th>状态 / 操作</th></tr></thead>
              <tbody><tr v-for="item in hazards" :key="item.id"><td><code>{{item.code}}</code><small>{{item.areaName || '未指定区域'}}</small></td><td><b>{{item.objectName}}</b><small>{{item.hazardFactor}}</small></td><td>{{item.accidentType}}<small>{{item.possibleAccident}}</small></td><td><span v-if="item.riskColor" class="risk-badge" :class="item.riskColor.toLowerCase()">{{riskColorName[item.riskColor]}} · {{item.riskValue}}</span><span v-else>待评估</span></td><td>{{item.controlLevel || '—'}}</td><td>{{item.measureCount}} 项</td><td><span class="tag" :class="{green:item.status==='ACTIVE',warning:item.status==='PENDING_REVIEW'}">{{statusName[item.status] || item.status}}</span><div class="row-actions"><button class="secondary" @click="openRiskDetail(item)">详情</button><template v-if="item.status==='PENDING_REVIEW'"><button @click="reviewRisk(item,'APPROVE')">通过</button><button class="danger" @click="reviewRisk(item,'RETURN')">退回</button></template></div></td></tr></tbody>
            </table>
          </div>
        </template>
        <template v-else-if="active==='inspection'">
          <div class="safety-metrics"><section><span>待执行任务</span><strong>{{inspectionSummary.pendingTasks}}</strong><small>含执行中与逾期任务</small></section><section><span>已完成任务</span><strong>{{inspectionSummary.completedTasks}}</strong><small>检查记录可追溯</small></section><section class="hazard-accent"><span>检查发现隐患</span><strong>{{inspectionSummary.openHazards}}</strong><small>自动进入整改闭环</small></section></div>
          <div class="panel table-panel"><div class="panel-head"><div><h2>周期检查计划</h2><small>系统每小时检查到期计划并自动派发任务</small></div><div class="panel-actions"><span>{{inspectionPlans.length}} 项</span><button class="secondary-action" @click="generatePlans">立即生成</button><button @click="openPlanForm">＋ 新建计划</button></div></div><table><thead><tr><th>计划</th><th>检查模板</th><th>周期</th><th>执行人员</th><th>下次生成</th><th>已生成</th><th>状态 / 操作</th></tr></thead><tbody><tr v-for="plan in inspectionPlans" :key="plan.id"><td><code>{{plan.code}}</code><small>{{plan.name}}</small></td><td>{{plan.templateName}}</td><td>{{scheduleName[plan.scheduleType]}}<small>每 {{plan.intervalValue}} 个周期 · {{plan.dueHours}} 小时内完成</small></td><td>{{plan.assigneeName||'待指派'}}</td><td>{{plan.nextRunDate}}</td><td>{{plan.generatedCount}} 次<small>{{plan.changeCount}} 条变更记录</small></td><td><span class="tag" :class="{green:plan.status==='ACTIVE',warning:plan.status==='PAUSED'}">{{plan.status==='ACTIVE'?'启用':plan.status==='COMPLETED'?'已完成':'已暂停'}}</span><div v-if="plan.status!=='COMPLETED'" class="row-actions"><button :class="{danger:plan.status==='ACTIVE'}" @click="changePlanStatus(plan)">{{plan.status==='ACTIVE'?'暂停':'恢复'}}</button></div></td></tr></tbody></table></div>
          <div class="panel template-strip"><div><h2>检查模板库</h2><small>依据现有综合、重点部位、班组日检和节假日检查表整理</small></div><span v-for="tpl in inspectionTemplates" :key="tpl.id"><b>{{tpl.name}}</b><small>{{tpl.frequency}} · {{tpl.itemCount}} 项</small></span></div>
          <div class="panel table-panel"><div class="panel-head"><div><h2>检查任务</h2><small>到期自动提醒，现场逐项填写检查结果</small></div><div class="panel-actions"><span>{{inspectionTasks.length}} 项</span><button @click="openTaskForm">＋ 创建任务</button></div></div><table><thead><tr><th>任务编号</th><th>任务与模板</th><th>负责人</th><th>计划/截止</th><th>发现隐患</th><th>状态</th></tr></thead><tbody><tr v-for="task in inspectionTasks" :key="task.id"><td><code>{{task.taskNo}}</code></td><td><b>{{task.title}}</b><small>{{task.templateName}}</small></td><td>{{task.assigneeName || '待指派'}}</td><td>{{task.plannedStart}}<small>{{new Date(task.dueAt).toLocaleString('zh-CN')}}</small></td><td>{{task.hazardCount}} 项</td><td><span class="tag" :class="{green:task.status==='COMPLETED',warning:task.status==='PENDING'}">{{inspectionStatusName[task.status]}}</span></td></tr></tbody></table></div>
        </template>
        <template v-else-if="active==='hazard'">
          <div class="safety-metrics"><section><span>未闭环隐患</span><strong>{{inspectionSummary.openHazards}}</strong><small>整改中、待验收及逾期</small></section><section><span>待验收</span><strong>{{inspectionSummary.pendingReview}}</strong><small>需安全管理人员复查</small></section><section class="danger-accent"><span>逾期隐患</span><strong>{{inspectionSummary.overdueHazards}}</strong><small>优先跟踪督办</small></section></div>
          <div class="panel hazard-statistics"><div class="panel-head"><div><h2>隐患治理统计</h2><small>按闭环、级别、来源与逾期升级口径实时汇总</small></div><span>共 {{inspectionStatistics.totalHazards}} 项</span></div><div class="statistics-grid"><section><span>闭环率</span><strong>{{inspectionStatistics.totalHazards?Math.round(inspectionStatistics.closedHazards*100/inspectionStatistics.totalHazards):0}}%</strong><small>{{inspectionStatistics.closedHazards}} 项已闭环</small></section><section><span>隐患级别</span><b>一般 {{inspectionStatistics.generalHazards}} · 较大 {{inspectionStatistics.seriousHazards}} · 重大 {{inspectionStatistics.majorHazards}}</b><small>按当前台账口径</small></section><section><span>发现来源</span><b>检查 {{inspectionStatistics.inspectionSource}} · 员工上报 {{inspectionStatistics.employeeSource}}</b><small>覆盖计划检查与随手拍</small></section><section class="escalation-summary"><span>逾期升级</span><b>提醒 {{inspectionStatistics.reminderLevel}} · 部门 {{inspectionStatistics.departmentLevel}} · 厂级 {{inspectionStatistics.plantLevel}}</b><small>1–3天 / 4–7天 / 8天以上</small></section></div></div>
          <div class="panel table-panel hazard-table"><div class="panel-head"><div><h2>生产安全事故隐患台账</h2><small>从排查、整改、反馈到验收全流程留痕</small></div><span>{{safetyHazards.length}} 项</span></div><table><thead><tr><th>编号 / 来源</th><th>隐患位置与问题</th><th>分类 / 级别</th><th>整改要求</th><th>责任与时限</th><th>现场材料</th><th>状态 / 操作</th></tr></thead><tbody><tr v-for="item in safetyHazards" :key="item.id"><td><code>{{item.hazardNo}}</code><small>{{item.sourceType==='INSPECTION'?'安全检查':'员工上报'}}</small></td><td><b>{{item.location}} · {{item.name}}</b><small>{{item.description}}</small></td><td>{{item.categoryMajor}}<small>{{item.categoryMinor}} · {{hazardLevelName[item.hazardLevel]}}</small></td><td>{{item.rectificationMeasure}}<small v-if="item.temporaryMeasure">临时措施：{{item.temporaryMeasure}}</small></td><td>{{item.responsibleOrg || '待明确'}}<small>{{item.responsiblePerson || '待指派'}} · {{item.dueDate}}</small><small>预计 ¥{{item.estimatedCost}}</small><small v-if="item.reminderCount">已催办 {{item.reminderCount}} 次 · {{new Date(item.lastRemindedAt!).toLocaleString('zh-CN')}}</small></td><td><b>{{hazardAttachments[item.id]?.length || 0}} 个附件</b><small v-for="file in hazardAttachments[item.id]" :key="file.id">{{file.stage==='DISCOVERY'?'发现':file.stage==='RECTIFICATION'?'整改':'验收'}}：{{file.originalName}}</small></td><td><span class="tag" :class="{green:item.status==='CLOSED',warning:item.status==='REVIEW_PENDING',danger:item.status==='OVERDUE'}">{{hazardStatusName[item.status]}}</span><small v-if="item.escalationLevel" class="escalation-label" :class="item.escalationLevel.toLowerCase()">{{escalationName[item.escalationLevel]}} · 逾期 {{item.overdueDays}} 天</small><div class="row-actions"><button v-if="['OPEN','RECTIFYING','OVERDUE'].includes(item.status)" @click="submitRectification(item)">提交整改</button><button v-if="['OPEN','RECTIFYING','OVERDUE'].includes(item.status)" class="secondary" @click="remindHazard(item)">催办</button><template v-if="item.status==='REVIEW_PENDING'"><button @click="reviewSafetyHazard(item,true)">验收通过</button><button class="danger" @click="reviewSafetyHazard(item,false)">退回</button></template></div><small v-if="item.completionNote">反馈：{{item.completionNote}}</small></td></tr></tbody></table></div>
        </template>
        <template v-else-if="active==='permit'"><div class="safety-metrics"><section><span>作业类型</span><strong>{{workPermitTemplates.length}}</strong><small>统一作业票模板</small></section><section><span>待审批</span><strong>{{workPermits.filter(p=>p.status.startsWith('PENDING')).length}}</strong><small>安全审核或负责人批准</small></section><section class="hazard-accent"><span>已批准</span><strong>{{workPermits.filter(p=>p.status==='APPROVED').length}}</strong><small>等待实施或完工验收</small></section></div><div class="panel template-strip"><div><h2>危险作业类型</h2><small>依据提供的 10 类危险作业审批单建立</small></div><span v-for="tpl in workPermitTemplates" :key="tpl.id"><b>{{tpl.name}}</b><small>{{tpl.measureCount}} 项预置措施</small></span></div><div class="panel table-panel"><div class="panel-head"><div><h2>危险作业票台账</h2><small>申请、审核、批准和完工验收全流程留痕</small></div><div class="panel-actions"><span>{{workPermits.length}} 张</span><button @click="openPermitForm">＋ 发起作业申请</button></div></div><table><thead><tr><th>作业票</th><th>类型与地点</th><th>作业内容</th><th>负责人 / 监护人</th><th>实施时间</th><th>状态 / 操作</th></tr></thead><tbody><tr v-for="item in workPermits" :key="item.id"><td><code>{{item.permitNo}}</code><small>{{item.workLevel.replace('LEVEL_','')}}级作业</small></td><td><b>{{item.permitTypeName}}</b><small>{{item.location}}</small></td><td>{{item.workContent}}<small>措施确认 {{item.confirmedCount}}/{{item.involvedCount}}</small></td><td>{{item.responsiblePerson}}<small>监护：{{item.guardian}}</small></td><td>{{new Date(item.startAt).toLocaleString('zh-CN')}}<small>至 {{new Date(item.endAt).toLocaleString('zh-CN')}}</small></td><td><span class="tag" :class="{green:item.status==='APPROVED'||item.status==='CLOSED',warning:item.status.startsWith('PENDING')}">{{permitStatusName[item.status]}}</span><div class="row-actions"><template v-if="item.status==='PENDING_SAFETY'||item.status==='PENDING_PRINCIPAL'"><button @click="reviewPermit(item,true)">审批通过</button><button class="danger" @click="reviewPermit(item,false)">退回</button></template><button v-if="item.status==='APPROVED'" @click="closePermit(item)">完工验收</button></div></td></tr></tbody></table></div></template>
        <template v-else-if="active==='training'">
          <div class="safety-metrics"><section><span>培训课程</span><strong>{{trainingSummary.courseCount}}</strong><small>覆盖入厂、专项和应急培训</small></section><section><span>待完成培训</span><strong>{{trainingSummary.pendingAssignments}}</strong><small>按时限跟踪学习与考试</small></section><section class="danger-accent"><span>证书预警</span><strong>{{trainingSummary.expiringQualifications}}</strong><small>已到期或进入复审提醒期</small></section></div>
          <div class="panel template-strip"><div><h2>课程资源库</h2><small>支持视频、PPT和文件课程</small><button @click="openCourseForm">＋ 新建课程</button></div><span v-for="course in trainingCourses" :key="course.id"><b>{{course.name}}</b><small>{{course.durationMinutes}} 分钟 · {{course.passingScore}} 分合格</small></span></div>
          <div class="panel table-panel"><div class="panel-head"><div><h2>培训任务与考核</h2><small>完成结果自动归入个人安全档案</small></div><div class="panel-actions"><input v-model="statisticsRange.from" type="date"/><input v-model="statisticsRange.to" type="date"/><button @click="queryTrainingStatistics">统计</button><button @click="openTrainingForm">＋ 指派培训</button></div></div><div v-if="trainingStatistics" class="detail-summary"><div><span>区间指派</span><strong>{{trainingStatistics.assignedCount}} 项</strong></div><div><span>完成 / 未通过</span><strong>{{trainingStatistics.completedCount}} / {{trainingStatistics.failedCount}}</strong></div><div><span>平均成绩</span><strong>{{trainingStatistics.averageScore}}</strong></div></div><table><thead><tr><th>课程</th><th>员工</th><th>完成时限</th><th>学习进度</th><th>考试成绩</th><th>状态 / 操作</th></tr></thead><tbody><tr v-for="item in trainingAssignments" :key="item.id"><td><b>{{item.courseName}}</b></td><td>{{item.employeeName}}</td><td>{{new Date(item.dueAt).toLocaleString('zh-CN')}}</td><td>{{item.studyProgress}}%</td><td>{{item.examScore ?? '—'}}</td><td><span class="tag" :class="{green:item.status==='COMPLETED',warning:item.status==='PENDING',danger:item.status==='FAILED'}">{{item.status==='COMPLETED'?'已完成':item.status==='FAILED'?'考核未通过':'待学习'}}</span><div class="row-actions"><button v-if="item.status!=='COMPLETED'" @click="recordTrainingScore(item)">登记成绩</button></div></td></tr></tbody></table></div>
          <div class="panel table-panel"><div class="panel-head"><div><h2>岗位资格证书</h2><small>主要负责人、安全员、特种作业和特种设备作业人员统一管理</small></div><div class="panel-actions"><span>{{qualifications.length}} 本</span><button @click="openQualificationForm">＋ 录入证书</button></div></div><table><thead><tr><th>员工</th><th>资格类别</th><th>证书名称 / 编号</th><th>发证机构</th><th>有效期</th><th>状态</th></tr></thead><tbody><tr v-for="item in qualifications" :key="item.id"><td><b>{{item.employeeName}}</b></td><td>{{item.qualificationType}}</td><td>{{item.certificateName}}<small>{{item.certificateNo}}</small></td><td>{{item.issuingAuthority||'—'}}</td><td>{{item.issuedOn||'—'}}<small>至 {{item.expiresOn}}</small></td><td><span class="tag" :class="{green:item.status==='VALID',warning:item.status==='EXPIRING',danger:item.status==='EXPIRED'}">{{item.status==='VALID'?'有效':item.status==='EXPIRING'?'即将到期':'已到期'}}</span></td></tr></tbody></table></div>
        </template>
        <template v-else-if="active==='asset'">
          <div class="panel-actions" style="justify-content:flex-end"><button @click="openAssetForm">＋ 新建设备/物资</button></div>
          <div class="safety-metrics"><section><span>在册设备物资</span><strong>{{assetSummary.total}}</strong><small>统一编码、位置和责任人</small></section><section><span>特种设备及附件</span><strong>{{assetSummary.specialEquipment}}</strong><small>备案、年检和维保跟踪</small></section><section><span>应急与消防</span><strong>{{assetSummary.emergencyAndFire}}</strong><small>数量及使用有效期管理</small></section><section class="danger-accent"><span>到期预警</span><strong>{{assetSummary.dueSoon}}</strong><small>需安排检验、维保或更新</small></section></div>
          <div class="panel table-panel"><div class="panel-head"><div><h2>设备设施与应急物资台账</h2><small>特种设备、安全附件、消防器材和应急物资统一管理</small></div><span>{{safetyAssets.length}} 项</span></div><table><thead><tr><th>资产编号</th><th>名称 / 分类</th><th>位置与责任人</th><th>规格 / 登记号</th><th>数量</th><th>检验或有效期</th><th>状态 / 操作</th></tr></thead><tbody><tr v-for="item in safetyAssets" :key="item.id"><td><code>{{item.assetNo}}</code><small>{{assetTypeName[item.assetType]||item.assetType}}</small></td><td><b>{{item.assetName}}</b><small>{{item.category||'未分类'}}</small></td><td>{{item.location}}<small>{{item.responsiblePerson||'待明确责任人'}}</small></td><td>{{item.modelSpec||'—'}}<small>{{item.registrationNo||'无备案编号'}}</small></td><td>{{item.quantity}} {{item.unit}}</td><td>{{item.nextInspectionOn?'下次检验 '+item.nextInspectionOn:item.expiresOn?'有效期至 '+item.expiresOn:'长期有效'}}<small>已留痕 {{item.maintenanceCount}} 次</small></td><td><span class="tag" :class="{green:item.dueStatus==='NORMAL',warning:item.dueStatus==='DUE_SOON',danger:item.dueStatus==='OVERDUE'}">{{item.dueStatus==='NORMAL'?'正常':item.dueStatus==='DUE_SOON'?'即将到期':'已逾期'}}</span><div class="row-actions"><button @click="recordAssetMaintenance(item)">登记检验/维保</button></div></td></tr></tbody></table></div>
        </template>
        <template v-else-if="active==='health'">
          <div class="safety-metrics"><section><span>职业危害因素</span><strong>{{healthSummary.activeFactors}}</strong><small>作业场所辨识及管控</small></section><section class="danger-accent"><span>检测到期提醒</span><strong>{{healthSummary.monitoringDue}}</strong><small>30 天内需安排检测</small></section><section><span>体检记录</span><strong>{{healthSummary.examRecords}}</strong><small>自动归入员工安全档案</small></section><section><span>体检到期提醒</span><strong>{{healthSummary.examDue}}</strong><small>45 天内需安排复查</small></section></div>
          <div class="panel table-panel"><div class="panel-head"><div><h2>职业病危害因素管控</h2><small>危害因素、接触岗位、检测周期和控制措施</small></div><div class="panel-actions"><span>{{occupationalFactors.length}} 项</span><button @click="openFactorForm">＋ 录入危害因素</button></div></div><table><thead><tr><th>危害因素</th><th>区域 / 接触岗位</th><th>接触水平与限值</th><th>管控措施</th><th>检测周期</th><th>状态 / 操作</th></tr></thead><tbody><tr v-for="item in occupationalFactors" :key="item.id"><td><b>{{item.factorName}}</b><small>{{item.factorType}}</small></td><td>{{item.location}}<small>{{item.exposedPositions}}</small></td><td>{{item.exposureLevel||'待检测'}}<small>{{item.limitValue||'—'}}</small></td><td>{{item.controlMeasures}}</td><td>{{item.monitoringFrequency}}<small>{{item.lastMonitoredOn||'—'}} 至 {{item.nextMonitoringOn||'—'}}</small></td><td><span class="tag" :class="{green:item.dueStatus==='NORMAL',warning:item.dueStatus==='DUE_SOON',danger:item.dueStatus==='OVERDUE'}">{{item.dueStatus==='NORMAL'?'正常':item.dueStatus==='DUE_SOON'?'即将到期':'已逾期'}}</span><div class="row-actions"><button @click="monitorFactor(item)">登记检测</button></div></td></tr></tbody></table></div>
          <div class="panel table-panel"><div class="panel-head"><div><h2>员工职业健康体检档案</h2><small>岗前、在岗、离岗和应急体检记录</small></div><div class="panel-actions"><span>{{occupationalExams.length}} 条</span><button @click="openExamForm">＋ 登记体检</button></div></div><table><thead><tr><th>员工</th><th>体检类型 / 日期</th><th>体检机构</th><th>结论</th><th>限制与后续措施</th><th>下次体检</th></tr></thead><tbody><tr v-for="item in occupationalExams" :key="item.id"><td><b>{{item.employeeName}}</b></td><td>{{item.examType}}<small>{{item.examDate}}</small></td><td>{{item.medicalInstitution}}</td><td><span class="tag" :class="{green:item.conclusion==='FIT',warning:item.conclusion!=='FIT'}">{{item.conclusion}}</span></td><td>{{item.restrictedItems||'无岗位限制'}}<small>{{item.followUpAction||'—'}}</small></td><td>{{item.nextExamOn||'—'}}</td></tr></tbody></table></div>
        </template>
        <template v-else-if="active==='investment'">
          <div class="safety-metrics"><section><span>{{investmentSummary.year}} 年预算</span><strong>¥{{investmentSummary.plannedAmount.toLocaleString()}}</strong><small>经批准安全投入计划</small></section><section><span>累计使用</span><strong>¥{{investmentSummary.spentAmount.toLocaleString()}}</strong><small>执行率 {{investmentSummary.executionRate}}%</small></section><section><span>预算余额</span><strong>¥{{investmentSummary.remainingAmount.toLocaleString()}}</strong><small>按费用类别实时核算</small></section></div>
          <div class="panel table-panel"><div class="panel-head"><div><h2>年度安全费用预算</h2><small>按投入类别编制计划并跟踪执行</small></div><div class="panel-actions"><span>{{safetyBudgets.length}} 项</span><button @click="openBudgetForm">＋ 编制预算</button></div></div><table><thead><tr><th>年度</th><th>费用类别</th><th>预算金额</th><th>已使用</th><th>剩余</th><th>用途说明</th></tr></thead><tbody><tr v-for="item in safetyBudgets" :key="item.id"><td>{{item.budgetYear}}</td><td><b>{{item.category}}</b></td><td>¥{{item.plannedAmount.toLocaleString()}}</td><td>¥{{item.spentAmount.toLocaleString()}}</td><td>¥{{(item.plannedAmount-item.spentAmount).toLocaleString()}}</td><td>{{item.description}}</td></tr></tbody></table></div>
          <div class="panel table-panel"><div class="panel-head"><div><h2>安全费用使用登记</h2><small>用途、供应商、票据和登记人全程留痕</small></div><div class="panel-actions"><span>{{safetyExpenses.length}} 笔</span><button @click="openExpenseForm">＋ 登记费用</button></div></div><table><thead><tr><th>日期</th><th>费用类别</th><th>金额</th><th>用途</th><th>供应商 / 票据</th><th>登记人</th></tr></thead><tbody><tr v-for="item in safetyExpenses" :key="item.id"><td>{{item.expenseDate}}</td><td>{{item.category}}</td><td><b>¥{{item.amount.toLocaleString()}}</b></td><td>{{item.purpose}}</td><td>{{item.vendor||'—'}}<small>{{item.invoiceNo||'无票据号'}}</small></td><td>{{item.recordedBy}}</td></tr></tbody></table></div>
        </template>
        <template v-else>
          <div class="panel-actions" style="justify-content:flex-end"><button @click="openCommitmentTemplateForm">＋ 编制承诺书</button><button @click="openCommitmentAssignForm">推送承诺书</button><button v-if="visitorBriefing" @click="openVisitorForm">编辑访客安全告知</button></div>
          <div class="safety-metrics"><section><span>待签承诺书</span><strong>{{commitments.filter(c=>c.status==='PENDING').length}}</strong><small>员工移动端阅读签订</small></section><section><span>培训材料</span><strong>{{Object.values(trainingMaterials).reduce((n,list)=>n+list.length,0)}}</strong><small>PPT、视频、PDF 和 Word</small></section><section><span>访客登记</span><strong>{{visitorRecords.length}}</strong><small>扫码阅读安全告知后登记</small></section></div>
          <div class="panel table-panel"><div class="panel-head"><div><h2>安全培训材料</h2><small>按课程上传和管理培训课件</small></div><span>{{trainingCourses.length}} 门课程</span></div><table><thead><tr><th>课程</th><th>材料类型</th><th>已上传材料</th><th>操作</th></tr></thead><tbody><tr v-for="course in trainingCourses" :key="course.id"><td><b>{{course.name}}</b><small>{{course.code}}</small></td><td>{{course.materialType}}</td><td><span v-if="trainingMaterials[course.id]?.length"><small v-for="file in trainingMaterials[course.id]" :key="file.id">{{file.originalName}} · {{Math.ceil(file.fileSize/1024)}} KB</small></span><span v-else>尚未上传</span></td><td><label class="tag green" style="cursor:pointer">上传材料<input hidden type="file" accept=".ppt,.pptx,.mp4,.webm,.pdf,.doc,.docx" @change="uploadCourseMaterial(course.id,$event)" /></label></td></tr></tbody></table></div>
          <div class="panel table-panel"><div class="panel-head"><div><h2>岗位安全承诺书</h2><small>阅读、签订时间及签名信息自动归入个人档案</small></div><span>{{commitments.length}} 份</span></div><table><thead><tr><th>承诺书</th><th>适用岗位</th><th>员工</th><th>签订时限</th><th>状态</th></tr></thead><tbody><tr v-for="item in commitments" :key="item.id"><td><b>{{item.name}}</b><small>{{item.version}}</small></td><td>{{item.positionScope}}</td><td>{{item.employeeName}}</td><td>{{new Date(item.dueAt).toLocaleString('zh-CN')}}</td><td><span class="tag" :class="{green:item.status==='SIGNED',warning:item.status==='PENDING'}">{{item.status==='SIGNED'?'已签订':'待签订'}}</span><small v-if="item.signedAt">{{item.signatureText}} · {{new Date(item.signedAt).toLocaleString('zh-CN')}}</small></td></tr></tbody></table></div>
          <div class="panel" v-if="visitorBriefing"><div class="panel-head"><div><h2>访客安全告知二维码</h2><small>访客进入生产区域前扫码阅读、确认并登记</small></div><span>{{visitorBriefing.siteName}}</span></div><div style="display:grid;grid-template-columns:240px 1fr;gap:28px;align-items:center"><div><img :src="visitorQr" width="220" height="220" alt="访客安全告知二维码"/><small style="word-break:break-all">{{visitorUrl}}</small></div><div><h3>{{visitorBriefing.title}}</h3><p>{{visitorBriefing.briefingContent}}</p><p><b>重点风险：</b>{{visitorBriefing.riskMapDescription}}</p><p><b>疏散路线：</b>{{visitorBriefing.evacuationDescription}}</p><p><b>应急联系：</b>{{visitorBriefing.emergencyContact}}</p></div></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:24px"><img :src="visitorAssetUrl(visitorBriefing.riskMapUrl)" style="width:100%;border-radius:14px;border:1px solid #dbe5df" alt="厂区风险分布图"/><img :src="visitorAssetUrl(visitorBriefing.evacuationMapUrl)" style="width:100%;border-radius:14px;border:1px solid #dbe5df" alt="应急疏散路线图"/></div></div>
          <div class="panel table-panel"><div class="panel-head"><div><h2>访客扫码登记记录</h2><small>保留来访单位、事由、接待人和确认时间</small></div><span>{{visitorRecords.length}} 人次</span></div><table><thead><tr><th>访客</th><th>单位 / 手机</th><th>来访事由</th><th>接待人</th><th>登记时间</th><th>状态</th></tr></thead><tbody><tr v-for="item in visitorRecords" :key="item.id"><td><b>{{item.visitorName}}</b></td><td>{{item.companyName||'—'}}<small>{{item.mobile||'—'}}</small></td><td>{{item.visitPurpose}}</td><td>{{item.hostName}}</td><td>{{new Date(item.registeredAt).toLocaleString('zh-CN')}}</td><td><span class="tag green">已确认告知</span></td></tr></tbody></table></div>
        </template>
      </article>
    </section>
  </div>

  <div v-if="activeModuleMetricManager" class="modal-mask module-metric-mask">
    <section class="module-metric-dialog">
      <header class="module-metric-head"><div><p class="eyebrow">{{moduleMetricLabels[activeModuleMetricManager]}}</p><h2>{{activeMetricBoard||moduleMetricLabels[activeModuleMetricManager]}} · 指标配置</h2><small>配置完成并保存前，后台页面保持锁定。</small></div><button @click="closeModuleMetricManager">×</button></header>
      <form v-if="showNewMetricForm" class="module-new-metric-form" @submit.prevent="addCustomMetric">
        <label v-if="!activeMetricBoard">指标分类<select v-model="newMetricForm.category"><optgroup label="结果指标"><option v-for="category in resultCategories" :key="category">{{category}}</option></optgroup><optgroup label="过程控制"><option v-for="category in processCategories" :key="category">{{category}}</option></optgroup></select></label>
        <label>指标名称<input v-model="newMetricForm.name" required placeholder="例如：吨水电耗" /></label>
        <label>单位<input v-model="newMetricForm.unit" required placeholder="kWh/m³" /></label>
        <label>数据类型<select v-model="newMetricForm.dataType"><option value="DECIMAL">小数</option><option value="INTEGER">整数</option><option value="PERCENT">百分比</option><option value="TEXT">文本</option><option value="BOOLEAN">是/否</option><option value="DATE">日期</option></select></label>
        <label class="compact-check"><input v-model="newMetricForm.required" type="checkbox" /> 必填</label>
        <label class="module-metric-meaning">填写规范<input v-model="newMetricForm.fillSpec" placeholder="例如：保留两位小数，范围 0～100" /></label>
        <label class="module-metric-meaning">指标说明<input v-model="newMetricForm.meaning" placeholder="指标用途或定义" /></label>
        <div class="module-new-metric-actions"><button type="button" @click="cancelModuleMetricCreation">取消</button><button class="primary">添加到本模块</button></div>
      </form>
      <div class="module-metric-toolbar"><input v-model="moduleMetricSearch" placeholder="搜索指标名称或说明" /><span>当前显示 {{moduleConfigMetrics.filter(metric=>isMetricEnabledInModule(metric,activeModuleMetricManager)).length}} 项</span><button @click="startMetricCreationFromModule">＋ 新增指标</button></div>
      <div class="module-metric-table-wrap"><table class="module-metric-table"><thead><tr><th>显示</th><th>指标名称</th><th>单位</th><th>数据类型</th><th>必填</th><th>填写规范</th><th>偏差规则</th><th>正常范围</th><th>预警范围</th><th>隐藏</th><th>操作</th></tr></thead><tbody>
        <tr v-for="metric in moduleConfigMetrics" :key="metricKey(metric)" :class="{hiddenMetric:settingFor(metric).hidden}">
          <td><input type="checkbox" :checked="isMetricEnabledInModule(metric,activeModuleMetricManager)" :disabled="settingFor(metric).hidden" @change="setMetricEnabledInModule(metric,activeModuleMetricManager,($event.target as HTMLInputElement).checked)" /></td>
          <td><small v-if="!activeMetricBoard">{{metric.category}}</small><input v-model="settingFor(metric).displayName" :placeholder="metric.name" /></td>
          <td><input v-model="settingFor(metric).displayUnit" :placeholder="metric.unit" /></td>
          <td><select v-model="settingFor(metric).dataType"><option value="DECIMAL">小数</option><option value="INTEGER">整数</option><option value="PERCENT">百分比</option><option value="TEXT">文本</option><option value="BOOLEAN">是/否</option><option value="DATE">日期</option></select></td>
          <td><input v-model="settingFor(metric).required" type="checkbox" /></td>
          <td><input v-model="settingFor(metric).fillSpec" placeholder="填写格式、范围或说明" /></td>
          <td><select v-model="settingFor(metric).mode" :disabled="['TEXT','BOOLEAN','DATE'].includes(settingFor(metric).dataType)"><option value="UPPER">上限管理</option><option value="LOWER">下限管理</option><option value="CENTER">中间值管理</option></select></td>
          <td><label>± <input v-model.number="settingFor(metric).healthyPct" type="number" min="0" :disabled="['TEXT','BOOLEAN','DATE'].includes(settingFor(metric).dataType)" />%</label></td>
          <td><label>至 <input v-model.number="settingFor(metric).warningPct" type="number" min="0" :disabled="['TEXT','BOOLEAN','DATE'].includes(settingFor(metric).dataType)" />%</label></td>
          <td><input v-model="settingFor(metric).hidden" type="checkbox" /></td>
          <td><button class="metric-delete-button" @click="deleteMetricFromBoard(metric)">删除</button></td>
        </tr>
        <tr v-if="!moduleConfigMetrics.length"><td colspan="11" class="entry-empty-row">未找到符合条件的指标</td></tr>
      </tbody></table></div>
      <footer class="module-metric-foot"><span>“显示”控制当前页面，“隐藏”可保留字段但不在业务页面呈现。</span><div><button @click="closeModuleMetricManager">取消</button><button class="primary" @click="saveModuleMetricSettings">保存配置</button></div></footer>
    </section>
  </div>

  <div v-if="showRiskForm" class="modal-mask" @click.self="showRiskForm=false">
    <form class="risk-form" @submit.prevent="saveAndSubmitRisk">
      <div class="form-head"><div><p class="eyebrow">风险辨识向导</p><h2>新建并提交风险</h2></div><button type="button" @click="showRiskForm=false">×</button></div>
      <section class="form-section"><h3>1. 辨识信息</h3><div class="form-grid">
        <label class="wide">风险对象<select v-model="riskForm.riskObjectId" required><option v-for="object in riskObjects" :key="object.id" :value="object.id">{{object.areaName}} · {{object.name}}</option></select></label>
        <label>风险编号<input v-model="riskForm.code" required /></label><label>事故类型<input v-model="riskForm.accidentType" required /></label>
        <label class="wide">危险有害因素<textarea v-model="riskForm.hazardFactor" required rows="2"></textarea></label>
        <label class="wide">可能导致的事故及后果<textarea v-model="riskForm.possibleAccident" required rows="2"></textarea></label>
        <label>辨识日期<input v-model="riskForm.identifiedOn" type="date" required /></label><label>下次复评日期<input v-model="riskForm.nextReviewOn" type="date" /></label>
      </div></section>
      <section class="form-section"><h3>2. 风险评估</h3><div class="method-tabs"><button type="button" :class="{active:riskForm.method==='LS'}" @click="riskForm.method='LS'">LS 矩阵</button><button type="button" :class="{active:riskForm.method==='LEC'}" @click="riskForm.method='LEC'">LEC 方法</button></div><div class="score-grid">
        <label>L · 可能性<input v-model.number="riskForm.likelihood" type="number" min="0.1" :max="riskForm.method==='LS' ? 5 : undefined" step="0.1" required /></label>
        <label v-if="riskForm.method==='LS'">S · 严重性<input v-model.number="riskForm.severity" type="number" min="0.1" max="5" step="0.1" required /></label>
        <template v-else><label>E · 暴露频次<input v-model.number="riskForm.exposure" type="number" min="0.1" step="0.1" required /></label><label>C · 后果<input v-model.number="riskForm.consequence" type="number" min="0.1" step="0.1" required /></label></template>
      </div></section>
      <section class="form-section"><h3>3. 五类管控措施 <small>至少填写一项</small></h3><div class="measure-grid">
        <label>工程技术措施<textarea v-model="riskForm.engineering" rows="2"></textarea></label><label>管理措施<textarea v-model="riskForm.management" rows="2"></textarea></label><label>培训教育措施<textarea v-model="riskForm.training" rows="2"></textarea></label><label>个体防护措施<textarea v-model="riskForm.ppe" rows="2"></textarea></label><label>应急处置措施<textarea v-model="riskForm.emergency" rows="2"></textarea></label>
      </div></section>
      <div class="form-foot"><span>保存后将直接提交安全管理人员审核</span><button type="button" @click="showRiskForm=false">取消</button><button class="primary" :disabled="savingRisk">{{savingRisk ? '正在提交…' : '完成评估并提交'}}</button></div>
    </form>
  </div>
  <div v-if="showTaskForm" class="modal-mask" @click.self="showTaskForm=false"><form class="area-form" @submit.prevent="createInspectionTask"><div class="form-head"><div><p class="eyebrow">安全检查</p><h2>创建检查任务</h2></div><button type="button" @click="showTaskForm=false">×</button></div><div class="task-form-body"><label>检查模板<select v-model="taskForm.templateId" required><option v-for="tpl in inspectionTemplates" :key="tpl.id" :value="tpl.id">{{tpl.name}}</option></select></label><label>任务名称<input v-model="taskForm.title" required placeholder="例如：本周重点部位安全检查" /></label><label>计划日期<input v-model="taskForm.plannedStart" type="date" required /></label><label>完成时限<input v-model="taskForm.dueAt" type="datetime-local" required /></label><label>执行人员<select v-model="taskForm.assigneeEmployeeId"><option value="">待指派</option><option v-for="person in employees" :key="person.id" :value="person.id">{{person.displayName}} · {{person.position}}</option></select></label></div><div class="form-foot"><span>创建后将出现在手机端待办中</span><button type="button" @click="showTaskForm=false">取消</button><button class="primary">创建任务</button></div></form></div>
  <div v-if="showPlanForm" class="modal-mask" @click.self="showPlanForm=false"><form class="area-form" @submit.prevent="createInspectionPlan"><div class="form-head"><div><p class="eyebrow">自动派发</p><h2>新建周期检查计划</h2></div><button type="button" @click="showPlanForm=false">×</button></div><div class="task-form-body"><label>检查模板<select v-model="planForm.templateId" required><option v-for="tpl in inspectionTemplates" :key="tpl.id" :value="tpl.id">{{tpl.name}}</option></select></label><label>计划名称<input v-model="planForm.name" required placeholder="例如：运维班组每日安全检查计划" /></label><label>执行周期<select v-model="planForm.scheduleType"><option value="DAILY">每日</option><option value="WEEKLY">每周</option><option value="MONTHLY">每月</option><option value="ONCE">一次性</option></select></label><label>周期间隔<input v-model.number="planForm.intervalValue" type="number" min="1" required /></label><label>首次生成日期<input v-model="planForm.nextRunDate" type="date" required /></label><label>完成时限（小时）<input v-model.number="planForm.dueHours" type="number" min="1" required /></label><label>执行人员<select v-model="planForm.assigneeEmployeeId"><option value="">待指派</option><option v-for="person in employees" :key="person.id" :value="person.id">{{person.displayName}} · {{person.position}}</option></select></label></div><div class="form-foot"><span>到期后自动生成一次任务，不会重复派发</span><button type="button" @click="showPlanForm=false">取消</button><button class="primary">保存计划</button></div></form></div>
  <div v-if="showPermitForm" class="modal-mask" @click.self="showPermitForm=false"><form class="area-form permit-form" @submit.prevent="createPermit"><div class="form-head"><div><p class="eyebrow">危险作业申请</p><h2>新建危险作业票</h2></div><button type="button" @click="showPermitForm=false">×</button></div><div class="task-form-body"><label>作业类型<select v-model="permitForm.templateId" required><option v-for="tpl in workPermitTemplates" :key="tpl.id" :value="tpl.id">{{tpl.name}}</option></select></label><label>作业级别<select v-model="permitForm.workLevel"><option value="LEVEL_1">1级</option><option value="LEVEL_2">2级</option><option value="LEVEL_3">3级</option></select></label><label>作业单位<input v-model="permitForm.workUnit" required /></label><label>作业地点<input v-model="permitForm.location" required /></label><label>作业内容<textarea v-model="permitForm.workContent" rows="2" required></textarea></label><label>风险辨识结果<textarea v-model="permitForm.riskResult" rows="2" required></textarea></label><label>作业负责人<input v-model="permitForm.responsiblePerson" required /></label><label>监护人<input v-model="permitForm.guardian" required /></label><label>作业人员<input v-model="permitForm.workers" required placeholder="多人用顿号分隔" /></label><label>关联作业票<input v-model="permitForm.relatedPermits" placeholder="无可不填" /></label><label>开始时间<input v-model="permitForm.startAt" type="datetime-local" required /></label><label>结束时间<input v-model="permitForm.endAt" type="datetime-local" required /></label></div><div class="form-foot"><span>提交后进入安全管理人员审核</span><button type="button" @click="showPermitForm=false">取消</button><button class="primary">提交申请</button></div></form></div>
  <div v-if="showTrainingForm" class="modal-mask" @click.self="showTrainingForm=false"><form class="area-form" @submit.prevent="assignTraining"><div class="form-head"><div><p class="eyebrow">培训教育</p><h2>指派安全培训</h2></div><button type="button" @click="showTrainingForm=false">×</button></div><div class="task-form-body"><label>培训课程<select v-model="trainingForm.courseId" required><option v-for="course in trainingCourses" :key="course.id" :value="course.id">{{course.name}}</option></select></label><label>培训员工<select v-model="trainingForm.employeeId" required><option v-for="person in employees" :key="person.id" :value="person.id">{{person.displayName}} · {{person.position}}</option></select></label><label>完成时限<input v-model="trainingForm.dueAt" type="datetime-local" required /></label></div><div class="form-foot"><span>任务将推送至员工移动端待办</span><button type="button" @click="showTrainingForm=false">取消</button><button class="primary">确认指派</button></div></form></div>
  <div v-if="showExamForm" class="modal-mask" @click.self="showExamForm=false"><form class="area-form" @submit.prevent="saveExam"><div class="form-head"><div><p class="eyebrow">职业健康</p><h2>登记职业健康体检</h2></div><button type="button" @click="showExamForm=false">×</button></div><div class="task-form-body"><label>员工<select v-model="examForm.employeeId" required><option v-for="person in employees" :key="person.id" :value="person.id">{{person.displayName}} · {{person.position}}</option></select></label><label>体检类型<select v-model="examForm.examType"><option value="PRE_EMPLOYMENT">岗前</option><option value="PERIODIC">在岗期间</option><option value="EXIT">离岗</option><option value="EMERGENCY">应急</option></select></label><label>体检日期<input v-model="examForm.examDate" type="date" required /></label><label>体检机构<input v-model="examForm.medicalInstitution" required /></label><label>体检结论<select v-model="examForm.conclusion"><option value="FIT">目前未见职业禁忌</option><option value="FIT_WITH_RESTRICTIONS">有限制作业</option><option value="UNFIT">不宜从事原岗位</option><option value="REVIEW_REQUIRED">需要复查</option></select></label><label>岗位限制<input v-model="examForm.restrictedItems" /></label><label>后续措施<textarea v-model="examForm.followUpAction" rows="2"></textarea></label><label>下次体检日期<input v-model="examForm.nextExamOn" type="date" /></label></div><div class="form-foot"><span>保存后自动归入该员工个人安全档案</span><button type="button" @click="showExamForm=false">取消</button><button class="primary">保存体检记录</button></div></form></div>
  <div v-if="showExpenseForm" class="modal-mask" @click.self="showExpenseForm=false"><form class="area-form" @submit.prevent="saveExpense"><div class="form-head"><div><p class="eyebrow">安全投入</p><h2>登记安全费用使用</h2></div><button type="button" @click="showExpenseForm=false">×</button></div><div class="task-form-body"><label>预算类别<select v-model="expenseForm.budgetId" required><option v-for="budget in safetyBudgets" :key="budget.id" :value="budget.id">{{budget.category}} · 可用 ¥{{(budget.plannedAmount-budget.spentAmount).toLocaleString()}}</option></select></label><label>支出日期<input v-model="expenseForm.expenseDate" type="date" required /></label><label>金额<input v-model.number="expenseForm.amount" type="number" min="0.01" step="0.01" required /></label><label>费用用途<textarea v-model="expenseForm.purpose" rows="2" required></textarea></label><label>供应商<input v-model="expenseForm.vendor" /></label><label>发票/凭证编号<input v-model="expenseForm.invoiceNo" /></label><label>登记人<input v-model="expenseForm.recordedBy" required /></label></div><div class="form-foot"><span>费用将计入相应年度预算执行统计</span><button type="button" @click="showExpenseForm=false">取消</button><button class="primary">保存费用</button></div></form></div>
  <div v-if="showSafetyArchive&&safetyArchive" class="modal-mask" @click.self="showSafetyArchive=false"><section class="risk-detail"><div class="form-head"><div><p class="eyebrow">{{safetyArchive.employee.employeeNo}} · {{safetyArchive.employee.position}}</p><h2>{{safetyArchive.employee.displayName}}个人安全档案</h2></div><button @click="showSafetyArchive=false">×</button></div><div class="detail-body"><div class="detail-summary"><div><span>培训记录</span><strong>{{safetyArchive.trainings.length}} 条</strong></div><div><span>资格证书</span><strong>{{safetyArchive.qualifications.length}} 本</strong></div><div><span>承诺与体检</span><strong>{{safetyArchive.commitments.length+safetyArchive.healthExams.length}} 条</strong></div></div><div v-for="group in [{title:'安全培训及考核',items:safetyArchive.trainings},{title:'岗位资格证书',items:safetyArchive.qualifications},{title:'安全承诺书',items:safetyArchive.commitments},{title:'职业健康体检',items:safetyArchive.healthExams}]" :key="group.title"><div class="history-head"><h3>{{group.title}}</h3><span>{{group.items.length}} 条</span></div><div class="history-list"><article v-for="(item,index) in group.items" :key="index"><div><b>{{item.name}}</b><em>{{item.status}}</em></div><p>{{item.detail}} · {{item.recordedAt||'待完成'}}</p></article><p v-if="!group.items.length" class="muted">暂无记录</p></div></div></div></section></div>
  <div v-if="showAreaForm" class="modal-mask" @click.self="showAreaForm=false"><form class="area-form" @submit.prevent="createArea"><div class="form-head"><div><p class="eyebrow">厂区基础数据</p><h2>新建区域</h2></div><button type="button" @click="showAreaForm=false">×</button></div><div class="area-form-body"><label>上级区域<select v-model="areaForm.parentId"><option value="">无（顶级区域）</option><option v-for="area in areas.filter(a=>a.status==='ACTIVE')" :key="area.id" :value="area.id">{{area.name}}</option></select></label><label>区域编码<input v-model="areaForm.code" required /></label><label>区域名称<input v-model="areaForm.name" required placeholder="例如：污泥脱水机房" /></label><label>区域类型<select v-model="areaForm.areaType"><option value="PROCESS_AREA">工艺区域</option><option value="CHEMICAL_AREA">药剂区域</option><option value="ELECTRICAL_AREA">电气区域</option><option value="BUILDING">建筑/房间</option><option value="OTHER">其他</option></select></label></div><div class="form-foot"><span>区域创建后可关联风险对象和现场二维码</span><button type="button" @click="showAreaForm=false">取消</button><button class="primary">创建区域</button></div></form></div>
  <div v-if="showRiskDetail && selectedHazard" class="modal-mask" @click.self="showRiskDetail=false"><section class="risk-detail"><div class="form-head"><div><p class="eyebrow">{{selectedHazard.code}}</p><h2>{{selectedHazard.objectName}}</h2></div><button @click="showRiskDetail=false">×</button></div><div class="detail-body"><div class="detail-summary"><div><span>当前等级</span><strong>{{selectedHazard.riskColor ? riskColorName[selectedHazard.riskColor] : '待评估'}} · {{selectedHazard.riskValue}}</strong></div><div><span>告知确认</span><strong>{{ackSummary.acknowledgedCount}} 人</strong></div><div><span>管控层级</span><strong>{{selectedHazard.controlLevel}}</strong></div></div><div class="history-head"><h3>评估历史</h3><span>复评生效后，原确认记录自动失效</span></div><div class="history-list"><article v-for="assessment in assessmentHistory" :key="assessment.id"><div><span class="risk-badge" :class="assessment.riskColor.toLowerCase()">{{riskColorName[assessment.riskColor]}} · {{assessment.riskValue}}</span><b>{{assessment.method}} 评估</b><em v-if="assessment.current">当前版本</em><em v-else>{{assessment.approvalStatus}}</em></div><p>{{assessment.assessmentReason || '初次风险评估'}} · {{new Date(assessment.assessedAt).toLocaleString('zh-CN')}}</p><div v-if="assessment.approvalStatus==='PENDING_REVIEW'" class="row-actions"><button @click="reviewAssessment(assessment,'APPROVE')">通过复评</button><button class="danger" @click="reviewAssessment(assessment,'RETURN')">退回复评</button></div></article></div><form v-if="selectedHazard.status==='ACTIVE'" class="reassess-form" @submit.prevent="submitReassessment"><h3>发起复评</h3><div class="method-tabs"><button type="button" :class="{active:reassessForm.method==='LS'}" @click="reassessForm.method='LS'">LS</button><button type="button" :class="{active:reassessForm.method==='LEC'}" @click="reassessForm.method='LEC'">LEC</button></div><div class="score-grid"><label>L<input v-model.number="reassessForm.likelihood" type="number" min="0.1" :max="reassessForm.method==='LS'?5:undefined" step="0.1" required /></label><label v-if="reassessForm.method==='LS'">S<input v-model.number="reassessForm.severity" type="number" min="0.1" max="5" step="0.1" required /></label><template v-else><label>E<input v-model.number="reassessForm.exposure" type="number" min="0.1" step="0.1" required /></label><label>C<input v-model.number="reassessForm.consequence" type="number" min="0.1" step="0.1" required /></label></template></div><label>复评原因<textarea v-model="reassessForm.reason" rows="2" required placeholder="工艺、设备、法规或事故事件变化"></textarea></label><button class="submit-reassess" :disabled="assessmentHistory.some(a=>a.approvalStatus==='PENDING_REVIEW')">提交复评审核</button></form></div></section></div>
  <div v-if="showQualificationForm" class="modal-mask" @click.self="showQualificationForm=false"><form class="area-form" @submit.prevent="saveQualification"><div class="form-head"><div><p class="eyebrow">人员资质</p><h2>录入岗位资格证书</h2></div><button type="button" @click="showQualificationForm=false">×</button></div><div class="task-form-body"><label>员工<select v-model="qualificationForm.employeeId" required><option v-for="person in employees" :key="person.id" :value="person.id">{{person.displayName}} · {{person.position}}</option></select></label><label>资格类别<select v-model="qualificationForm.qualificationType"><option value="PRINCIPAL">主要负责人</option><option value="SAFETY_OFFICER">安全管理人员</option><option value="SPECIAL_OPERATION">特种作业</option><option value="SPECIAL_EQUIPMENT">特种设备作业</option></select></label><label>证书名称<input v-model="qualificationForm.certificateName" required /></label><label>证书编号<input v-model="qualificationForm.certificateNo" required /></label><label>发证机构<input v-model="qualificationForm.issuingAuthority" /></label><label>发证日期<input v-model="qualificationForm.issuedOn" type="date" /></label><label>有效期至<input v-model="qualificationForm.expiresOn" type="date" required /></label><label>提前提醒天数<input v-model.number="qualificationForm.reminderDays" type="number" min="1" required /></label></div><div class="form-foot"><span>到期前自动进入预警清单</span><button type="button" @click="showQualificationForm=false">取消</button><button class="primary">保存证书</button></div></form></div>
  <div v-if="showFactorForm" class="modal-mask" @click.self="showFactorForm=false"><form class="area-form" @submit.prevent="saveFactor"><div class="form-head"><div><p class="eyebrow">职业健康</p><h2>录入职业病危害因素</h2></div><button type="button" @click="showFactorForm=false">×</button></div><div class="task-form-body"><label>危害因素<input v-model="factorForm.factorName" required /></label><label>因素类型<select v-model="factorForm.factorType"><option value="CHEMICAL">化学因素</option><option value="PHYSICAL">物理因素</option><option value="BIOLOGICAL">生物因素</option></select></label><label>存在区域<input v-model="factorForm.location" required /></label><label>接触岗位<input v-model="factorForm.exposedPositions" required /></label><label>检测结果<input v-model="factorForm.exposureLevel" /></label><label>职业接触限值<input v-model="factorForm.limitValue" /></label><label>管控措施<textarea v-model="factorForm.controlMeasures" rows="3" required></textarea></label><label>检测周期<select v-model="factorForm.monitoringFrequency"><option value="ANNUAL">每年</option><option value="SEMI_ANNUAL">每半年</option><option value="QUARTERLY">每季度</option></select></label><label>下次检测日期<input v-model="factorForm.nextMonitoringOn" type="date" /></label></div><div class="form-foot"><span>用于检测到期提醒和岗位健康管理</span><button type="button" @click="showFactorForm=false">取消</button><button class="primary">保存因素</button></div></form></div>
  <div v-if="showBudgetForm" class="modal-mask" @click.self="showBudgetForm=false"><form class="area-form" @submit.prevent="saveBudget"><div class="form-head"><div><p class="eyebrow">安全投入</p><h2>编制年度安全预算</h2></div><button type="button" @click="showBudgetForm=false">×</button></div><div class="task-form-body"><label>预算年度<input v-model.number="budgetForm.budgetYear" type="number" min="2000" required /></label><label>费用类别<select v-model="budgetForm.category"><option>安全防护设施</option><option>安全培训教育</option><option>应急与消防</option><option>职业健康</option><option>检测检验</option><option>其他安全投入</option></select></label><label>计划金额<input v-model.number="budgetForm.plannedAmount" type="number" min="0.01" step="0.01" required /></label><label>用途说明<textarea v-model="budgetForm.description" rows="3" required></textarea></label></div><div class="form-foot"><span>保存后纳入年度预算执行统计</span><button type="button" @click="showBudgetForm=false">取消</button><button class="primary">保存预算</button></div></form></div>
  <div v-if="showVisitorForm" class="modal-mask" @click.self="showVisitorForm=false"><form class="area-form" @submit.prevent="saveVisitorBriefing"><div class="form-head"><div><p class="eyebrow">访客管理</p><h2>编辑访客安全告知</h2></div><button type="button" @click="showVisitorForm=false">×</button></div><div class="task-form-body"><label>告知标题<input v-model="visitorForm.title" required /></label><label>安全告知内容<textarea v-model="visitorForm.briefingContent" rows="4" required></textarea></label><label>重点风险区域<textarea v-model="visitorForm.riskMapDescription" rows="2"></textarea></label><label>应急疏散路线<textarea v-model="visitorForm.evacuationDescription" rows="2"></textarea></label><label>应急联系方式<input v-model="visitorForm.emergencyContact" /></label></div><div class="form-foot"><span>保存后访客二维码页面即时更新</span><button type="button" @click="showVisitorForm=false">取消</button><button class="primary">保存告知</button></div></form></div>
  <div v-if="showCourseForm" class="modal-mask" @click.self="showCourseForm=false"><form class="area-form" @submit.prevent="saveCourse"><div class="form-head"><div><p class="eyebrow">培训教育</p><h2>新建安全培训课程</h2></div><button type="button" @click="showCourseForm=false">×</button></div><div class="task-form-body"><label>课程编码<input v-model="courseForm.code" required /></label><label>课程名称<input v-model="courseForm.name" required /></label><label>课程类型<select v-model="courseForm.courseType"><option value="ONBOARDING">入厂三级教育</option><option value="SPECIAL_OPERATION">专项作业培训</option><option value="EMERGENCY">应急培训</option><option value="PERIODIC">日常再教育</option></select></label><label>材料类型<select v-model="courseForm.materialType"><option value="PPT">PPT</option><option value="VIDEO">视频</option><option value="DOCUMENT">文件</option></select></label><label>学习时长（分钟）<input v-model.number="courseForm.durationMinutes" type="number" min="1" required /></label><label>合格分数<input v-model.number="courseForm.passingScore" type="number" min="0" max="100" required /></label></div><div class="form-foot"><span>保存后可上传材料并指派员工</span><button type="button" @click="showCourseForm=false">取消</button><button class="primary">保存课程</button></div></form></div>
  <div v-if="showAssetForm" class="modal-mask" @click.self="showAssetForm=false"><form class="area-form" @submit.prevent="saveAsset"><div class="form-head"><div><p class="eyebrow">设备与物资</p><h2>新建设备/物资档案</h2></div><button type="button" @click="showAssetForm=false">×</button></div><div class="task-form-body"><label>资产编号<input v-model="assetForm.assetNo" required /></label><label>名称<input v-model="assetForm.assetName" required /></label><label>资产类型<select v-model="assetForm.assetType"><option value="SPECIAL_EQUIPMENT">特种设备</option><option value="SAFETY_ACCESSORY">安全附件</option><option value="FIRE_EQUIPMENT">消防器材</option><option value="EMERGENCY_SUPPLY">应急物资</option></select></label><label>分类<input v-model="assetForm.category" /></label><label>所在位置<input v-model="assetForm.location" required /></label><label>责任人<input v-model="assetForm.responsiblePerson" /></label><label>制造单位<input v-model="assetForm.manufacturer" /></label><label>型号规格<input v-model="assetForm.modelSpec" /></label><label>备案/登记号<input v-model="assetForm.registrationNo" /></label><label>数量<input v-model.number="assetForm.quantity" type="number" min="0.01" step="0.01" required /></label><label>单位<input v-model="assetForm.unit" required /></label><label>投用日期<input v-model="assetForm.commissionedOn" type="date" /></label><label>下次检验日期<input v-model="assetForm.nextInspectionOn" type="date" /></label><label>使用有效期至<input v-model="assetForm.expiresOn" type="date" /></label><label>提前提醒天数<input v-model.number="assetForm.reminderDays" type="number" min="1" required /></label><label>备注<textarea v-model="assetForm.notes" rows="2"></textarea></label></div><div class="form-foot"><span>特种设备、消防器材和应急物资共用统一台账</span><button type="button" @click="showAssetForm=false">取消</button><button class="primary">保存档案</button></div></form></div>
  <div v-if="showCommitmentTemplateForm" class="modal-mask" @click.self="showCommitmentTemplateForm=false"><form class="area-form" @submit.prevent="saveCommitmentTemplate"><div class="form-head"><div><p class="eyebrow">安全承诺</p><h2>编制岗位安全承诺书</h2></div><button type="button" @click="showCommitmentTemplateForm=false">×</button></div><div class="task-form-body"><label>模板编码<input v-model="commitmentTemplateForm.code" required /></label><label>承诺书名称<input v-model="commitmentTemplateForm.name" required /></label><label>适用岗位<input v-model="commitmentTemplateForm.positionScope" required /></label><label>版本<input v-model="commitmentTemplateForm.version" required /></label><label>承诺内容<textarea v-model="commitmentTemplateForm.content" rows="8" required></textarea></label></div><div class="form-foot"><span>保存后可按员工推送签订任务</span><button type="button" @click="showCommitmentTemplateForm=false">取消</button><button class="primary">保存模板</button></div></form></div>
  <div v-if="showCommitmentAssignForm" class="modal-mask" @click.self="showCommitmentAssignForm=false"><form class="area-form" @submit.prevent="assignCommitment"><div class="form-head"><div><p class="eyebrow">安全承诺</p><h2>推送承诺书签订任务</h2></div><button type="button" @click="showCommitmentAssignForm=false">×</button></div><div class="task-form-body"><label>承诺书模板<select v-model="commitmentAssignForm.templateId" required><option v-for="tpl in commitmentTemplates" :key="tpl.id" :value="tpl.id">{{tpl.name}} · {{tpl.version}}</option></select></label><label>签订员工<select v-model="commitmentAssignForm.employeeId" required><option v-for="person in employees" :key="person.id" :value="person.id">{{person.displayName}} · {{person.position}}</option></select></label><label>签订时限<input v-model="commitmentAssignForm.dueAt" type="datetime-local" required /></label></div><div class="form-foot"><span>签订结果自动归入个人安全档案</span><button type="button" @click="showCommitmentAssignForm=false">取消</button><button class="primary">确认推送</button></div></form></div>
</template>
