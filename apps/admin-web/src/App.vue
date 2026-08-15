<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import QRCode from 'qrcode'
import { ApiClient, type Area, type AssessmentHistory, type ControlMeasureInput, type Employee, type EmployeeQualification, type EmployeeSafetyArchive, type Hazard, type InspectionPlan, type InspectionStatistics, type InspectionSummary, type InspectionTask, type InspectionTemplate, type InvestmentSummary, type OccupationalExam, type OccupationalFactor, type OccupationalHealthSummary, type OrgUnit, type RiskObject, type RiskSummary, type SafetyAsset, type SafetyAssetSummary, type SafetyAttachment, type SafetyBudget, type SafetyCommitment, type SafetyCommitmentTemplate, type SafetyExpense, type SafetyHazard, type Site, type TrainingAssignment, type TrainingCourse, type TrainingMaterial, type TrainingStatistics, type TrainingSummary, type VisitorBriefing, type VisitorRecord, type WorkPermit, type WorkPermitTemplate } from '@safety/api-client'

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
const active = ref<'platform' | 'processAnalysis' | 'processDesign' | 'conditionMatrix' | 'operationEntry' | 'metricConfig' | 'overview' | 'org' | 'employee' | 'area' | 'risk' | 'inspection' | 'hazard'|'permit'|'training'|'asset'|'health'|'investment'|'education'>('platform')
const dashboardTaskTab = ref<'pending'|'processed'|'cc'|'started'>('pending')
const dashboardTasks = {
  pending: [{title:'审核一期生化线冬季工况调整',module:'生产运行',time:'今天 14:30',status:'待审核'},{title:'确认重点部位安全检查整改结果',module:'安全管理',time:'今天 17:00',status:'待处理'},{title:'复核二期进水 COD 异常数据',module:'化验管理',time:'明天 09:00',status:'待复核'}],
  processed: [{title:'八月运行数据填报',module:'生产运行',time:'昨天 16:42',status:'已完成'},{title:'有限空间作业票审批',module:'安全管理',time:'昨天 11:08',status:'已通过'}],
  cc: [{title:'2#鼓风机维护完成记录',module:'设备管理',time:'今天 10:20',status:'供查阅'},{title:'本周出水水质分析周报',module:'化验管理',time:'周一 08:30',status:'供查阅'}],
  started: [{title:'发起夏季高负荷工况评审',module:'生产运行',time:'08-12 15:10',status:'审批中'},{title:'发起季度应急物资盘点',module:'安全管理',time:'08-10 09:15',status:'执行中'}]
}
const expandedModules = ref<Record<string, boolean>>({ production: false, equipment: false, laboratory: false, safety: false, energy: false, business: false, basic: false })
function toggleModule(module: string) {
  expandedModules.value[module] = !expandedModules.value[module]
}

type DiagnosisLevel = 'normal' | 'warning' | 'alarm'
type DiagnosisMetric = {
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
const diagnosisScenario = ref('冬季工况')
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
const showMetricConfig = ref(false)
const showNewMetricForm = ref(false)
const hiddenMetricKeys = ref<string[]>(JSON.parse(localStorage.getItem('waterx-hidden-diagnosis-metrics') || '[]'))
const customMetrics = reactive<DiagnosisMetric[]>(JSON.parse(localStorage.getItem('waterx-custom-diagnosis-metrics') || '[]'))
const customProcessMetrics = reactive<DiagnosisMetric[]>(JSON.parse(localStorage.getItem('waterx-custom-process-metrics') || '[]'))
const resultCategories = ['进水水质','进水特征','出水水质','处理效能','污泥性状']
const processCategories = ['水量与停留时间','曝气控制','内回流控制','外回流控制','排泥控制','加药控制','搅拌控制']
const newMetricForm = reactive({ category: '进水水质', name: '', unit: 'mg/L', meaning: '', dataType: 'DECIMAL', valueSource: 'MANUAL', formula: '' })
const formulaReference = ref('')
const allDiagnosisMetrics = computed(() => [...diagnosisMetrics, ...customMetrics])
const visibleDiagnosisMetrics = computed(() => allDiagnosisMetrics.value.filter(metric => !hiddenMetricKeys.value.includes(metricKey(metric))))
function metricKey(metric: Pick<DiagnosisMetric, 'category' | 'name'>) { return `${metric.category}::${metric.name}` }
function isMetricVisible(metric: DiagnosisMetric) { return !hiddenMetricKeys.value.includes(metricKey(metric)) }
function setMetricVisible(metric: DiagnosisMetric, visible: boolean) {
  const key = metricKey(metric)
  hiddenMetricKeys.value = visible ? hiddenMetricKeys.value.filter(item => item !== key) : [...new Set([...hiddenMetricKeys.value, key])]
  localStorage.setItem('waterx-hidden-diagnosis-metrics', JSON.stringify(hiddenMetricKeys.value))
}
function addCustomMetric() {
  const metric: DiagnosisMetric = { category:newMetricForm.category, name:newMetricForm.name, unit:newMetricForm.unit, meaning:newMetricForm.meaning, design:'—', target:'—', actual:'—', deviation:null, level:'normal' }
  if (processCategories.includes(newMetricForm.category)) { customProcessMetrics.push(metric); localStorage.setItem('waterx-custom-process-metrics', JSON.stringify(customProcessMetrics)) }
  else { customMetrics.push(metric); localStorage.setItem('waterx-custom-diagnosis-metrics', JSON.stringify(customMetrics)) }
  metricSettings[metricKey(newMetricForm)] = { designEnabled: true, conditionEnabled: true, entryEnabled: newMetricForm.valueSource==='MANUAL', diagnosisEnabled: true, mode: 'CENTER', healthyPct: 10, warningPct: 50, dataType:newMetricForm.dataType, valueSource:newMetricForm.valueSource, formula:newMetricForm.formula }
  localStorage.setItem('waterx-custom-diagnosis-metrics', JSON.stringify(customMetrics))
  saveMetricSettings()
  Object.assign(newMetricForm, { category: '进水水质', name: '', unit: 'mg/L', meaning: '', dataType: 'DECIMAL', valueSource: 'MANUAL', formula: '' })
  showNewMetricForm.value = false
}
function appendFormulaToken(token: string) { newMetricForm.formula += `${newMetricForm.formula ? ' ' : ''}${token}` }
function appendFormulaReference() { if (!formulaReference.value) return; appendFormulaToken(`[${formulaReference.value}]`); formulaReference.value='' }
type DeviationMode = 'UPPER' | 'LOWER' | 'CENTER'
type MetricSetting = { designEnabled: boolean; conditionEnabled: boolean; entryEnabled: boolean; diagnosisEnabled: boolean; mode: DeviationMode; healthyPct: number; warningPct: number; dataType: string; valueSource: string; formula: string }
const savedMetricSettings = JSON.parse(localStorage.getItem('waterx-metric-settings') || '{}') as Record<string, MetricSetting>
const metricSettings = reactive<Record<string, MetricSetting>>(savedMetricSettings)
function settingFor(metric: Pick<DiagnosisMetric, 'category'|'name'> & Partial<Pick<DiagnosisMetric,'unit'>>) {
  const key = metricKey(metric)
  const inferredType = metric.unit==='%' ? 'PERCENT' : metric.unit==='定性' ? 'TEXT' : 'DECIMAL'
  const defaults: MetricSetting = { designEnabled: true, conditionEnabled: true, entryEnabled: true, diagnosisEnabled: true, mode: 'CENTER', healthyPct: 10, warningPct: 50, dataType:inferredType, valueSource:'MANUAL', formula:'' }
  if (!metricSettings[key]) metricSettings[key] = defaults
  else Object.assign(metricSettings[key], { ...defaults, ...metricSettings[key] })
  return metricSettings[key]
}
function saveMetricSettings() {
  localStorage.setItem('waterx-metric-settings', JSON.stringify(metricSettings))
  hiddenMetricKeys.value = allDiagnosisMetrics.value.filter(metric => !settingFor(metric).diagnosisEnabled).map(metricKey)
  localStorage.setItem('waterx-hidden-diagnosis-metrics', JSON.stringify(hiddenMetricKeys.value))
}
const designEditMode = ref(false)
const designValues = reactive<Record<string,string>>(Object.fromEntries(diagnosisMetrics.map(metric => [metricKey(metric), metric.design])))
const designMetrics = computed(() => allManagedMetrics.value.filter(metric => settingFor(metric).designEnabled))
function saveDesignValues() { localStorage.setItem('waterx-process-design-values', JSON.stringify(designValues)); designEditMode.value = false }
Object.assign(designValues, JSON.parse(localStorage.getItem('waterx-process-design-values') || '{}'))

type ConditionPlan = { id: string; name: string; effectiveDate: string; description: string; targets: Record<string,string> }
const conditionPlans = reactive<ConditionPlan[]>(JSON.parse(localStorage.getItem('waterx-condition-plans') || 'null') || [
  { id: 'winter', name: '冬季工况', effectiveDate: '2026-11-01', description: '低水温条件下强化硝化与污泥龄控制', targets: Object.fromEntries(diagnosisMetrics.map(metric => [metricKey(metric), metric.target])) },
  { id: 'summer', name: '夏季工况', effectiveDate: '2026-05-01', description: '高水温条件下兼顾能耗与稳定达标', targets: Object.fromEntries(diagnosisMetrics.map(metric => [metricKey(metric), metric.target])) }
])
const selectedConditionId = ref(conditionPlans[0]?.id || '')
const selectedCondition = computed(() => conditionPlans.find(item => item.id === selectedConditionId.value))
const conditionEditMode = ref(false)
const showConditionForm = ref(false)
const conditionForm = reactive({ name: '', effectiveDate: new Date().toISOString().slice(0,10), description: '' })
const conditionMetrics = computed(() => allManagedMetrics.value.filter(metric => settingFor(metric).conditionEnabled))
function createCondition() {
  const plan: ConditionPlan = { id: `condition-${Date.now()}`, ...conditionForm, targets: Object.fromEntries(conditionMetrics.value.map(metric => [metricKey(metric), metric.target])) }
  conditionPlans.push(plan); selectedConditionId.value = plan.id; showConditionForm.value = false; conditionEditMode.value = true
  Object.assign(conditionForm, { name: '', effectiveDate: new Date().toISOString().slice(0,10), description: '' }); saveConditions()
}
function saveConditions() { localStorage.setItem('waterx-condition-plans', JSON.stringify(conditionPlans)); conditionEditMode.value = false }
function deleteCondition(id: string) { if (!window.confirm('确定删除该工况吗？')) return; const index = conditionPlans.findIndex(item=>item.id===id); if(index>=0) conditionPlans.splice(index,1); selectedConditionId.value=conditionPlans[0]?.id||''; saveConditions() }

const entryDate = ref(new Date().toISOString().slice(0,10))
const entryValues = reactive<Record<string,string>>(Object.fromEntries(diagnosisMetrics.map(metric => [metricKey(metric), metric.actual])))
const entryMetrics = computed(() => allManagedMetrics.value.filter(metric => settingFor(metric).entryEnabled && settingFor(metric).valueSource!=='CALCULATED'))
const entrySavedAt = ref('尚未保存')
const entryRevision = ref(0)
function saveOperationEntry() { localStorage.setItem(`waterx-operation-entry-${diagnosisLine.value}-${entryDate.value}`, JSON.stringify(entryValues)); entrySavedAt.value = new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'}); entryRevision.value++ }
function loadOperationEntry() { Object.assign(entryValues, Object.fromEntries(entryMetrics.value.map(metric => [metricKey(metric), metric.actual])), JSON.parse(localStorage.getItem(`waterx-operation-entry-${diagnosisLine.value}-${entryDate.value}`) || '{}')) }
function numericValue(value: string | undefined) { const match = value?.replace(/,/g,'').match(/-?\d+(\.\d+)?/); return match ? Number(match[0]) : null }
const analysisRows = computed<DiagnosisMetric[]>(() => {
  entryRevision.value
  const plan = conditionPlans.find(item => item.name === diagnosisScenario.value) || conditionPlans[0]
  const savedActuals = JSON.parse(localStorage.getItem(`waterx-operation-entry-${diagnosisLine.value}-${diagnosisDate.value}`) || '{}') as Record<string,string>
  return visibleDiagnosisMetrics.value.map(metric => {
    const key = metricKey(metric)
    const design = designValues[key] || metric.design
    const target = plan?.targets[key] || metric.target
    const actual = savedActuals[key] || metric.actual
    const targetNumber = numericValue(target), actualNumber = numericValue(actual)
    const deviation = targetNumber !== null && targetNumber !== 0 && actualNumber !== null ? ((actualNumber-targetNumber)/targetNumber)*100 : metric.deviation
    const rule = settingFor(metric)
    let level: DiagnosisLevel = 'normal'
    if (deviation !== null) {
      const distance = rule.mode === 'UPPER' ? Math.max(0,deviation) : rule.mode === 'LOWER' ? Math.max(0,-deviation) : Math.abs(deviation)
      level = distance <= rule.healthyPct ? 'normal' : distance <= rule.warningPct ? 'warning' : 'alarm'
    }
    return { ...metric, design, target, actual, deviation, level }
  })
})
const expandedDiagnosisCategories = ref<Record<string,boolean>>({ '污泥性状': true })
const analysisGroups = computed(() => resultCategories.map(category => ({ category, metrics:analysisRows.value.filter(metric=>metric.category===category) })).filter(group=>group.metrics.length))
function toggleDiagnosisCategory(category: string) { expandedDiagnosisCategories.value[category] = !expandedDiagnosisCategories.value[category] }
type ControlIndicator = { name: string; unit: string; target: string; actual: string; deviation: number | null; level: DiagnosisLevel }
type ControlGroup = { key: string; title: string; level: DiagnosisLevel; indicators: ControlIndicator[] }
const expandedControlGroups = ref<Record<string, boolean>>({})
const controlGroups: ControlGroup[] = [
  { key: 'water', title: '水量与停留时间', level: 'normal', indicators: [
    { name: '日进水量', unit: '万m³/d', target: '7.00', actual: '6.82', deviation: -2.6, level: 'normal' }, { name: '水量负荷率', unit: '%', target: '93.3', actual: '90.9', deviation: -2.6, level: 'normal' },
    { name: '厌氧段HRT', unit: 'h', target: '1.6', actual: '1.7', deviation: 6.3, level: 'normal' }, { name: '缺氧段HRT', unit: 'h', target: '3.2', actual: '3.4', deviation: 6.3, level: 'normal' },
    { name: '好氧段HRT', unit: 'h', target: '7.5', actual: '7.8', deviation: 4.0, level: 'normal' }, { name: '总HRT', unit: 'h', target: '15.0', actual: '15.6', deviation: 4.0, level: 'normal' }
  ] },
  { key: 'air', title: '曝气控制', level: 'warning', indicators: [
    { name: '好氧段DO', unit: 'mg/L', target: '1.5～2.5', actual: '1.35', deviation: -10.0, level: 'warning' }, { name: '运行风机', unit: '台', target: '2', actual: '2', deviation: 0, level: 'normal' },
    { name: '日曝气量', unit: '万Nm³', target: '16.5', actual: '15.8', deviation: -4.2, level: 'normal' }, { name: '主管压力', unit: 'kPa', target: '65', actual: '61', deviation: -6.2, level: 'normal' },
    { name: '风机运行时长', unit: 'h', target: '48', actual: '46', deviation: -4.2, level: 'normal' }, { name: '单位水量曝气量', unit: 'Nm³/m³', target: '2.36', actual: '2.32', deviation: -1.7, level: 'normal' }
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
    { name: '吨水药耗', unit: 'kg/m³', target: '0.060', actual: '0.063', deviation: 5.0, level: 'normal' }, { name: '投加泵运行', unit: '台', target: '2', actual: '2', deviation: 0, level: 'normal' }
  ] },
  { key: 'mix', title: '搅拌控制', level: 'normal', indicators: [
    { name: '运行搅拌器', unit: '台', target: '6', actual: '6', deviation: 0, level: 'normal' }, { name: '平均运行率', unit: '%', target: '80～90', actual: '83', deviation: null, level: 'normal' },
    { name: '日运行时长', unit: 'h', target: '20', actual: '19.9', deviation: -0.5, level: 'normal' }, { name: '异常设备', unit: '台', target: '0', actual: '0', deviation: 0, level: 'normal' }
  ] }
]
const builtInProcessMetrics = computed<DiagnosisMetric[]>(() => controlGroups.flatMap(group => group.indicators.map(indicator => ({ category:group.title, name:indicator.name, unit:indicator.unit, design:'—', target:indicator.target, actual:indicator.actual, deviation:indicator.deviation, level:indicator.level, meaning:`${group.title}过程控制指标` }))))
const allManagedMetrics = computed(() => [...allDiagnosisMetrics.value, ...builtInProcessMetrics.value, ...customProcessMetrics])
const displayControlGroups = computed<ControlGroup[]>(() => controlGroups.map(group => ({ ...group, indicators:[...group.indicators, ...customProcessMetrics.filter(metric=>metric.category===group.title).map(metric=>({name:metric.name,unit:metric.unit,target:metric.target,actual:metric.actual,deviation:metric.deviation,level:metric.level}))].filter(indicator=>settingFor({category:group.title,name:indicator.name}).diagnosisEnabled) })))
function toggleControlGroup(key: string) { expandedControlGroups.value[key] = !expandedControlGroups.value[key] }
function refreshDiagnosis() {
  diagnosisUpdatedAt.value = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}
function deviationWidth(value: number | null) {
  if (value === null) return '0%'
  return `${Math.min(100, Math.max(8, Math.abs(value)))}%`
}

const currentSite = computed(() => sites.value.find(s => s.id === selectedSite.value))
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

  <div v-else class="app-shell">
    <header class="global-topbar">
      <div class="topbar-brand"><div class="topbar-logo-art" aria-label="WaterX"><img class="logo-water" src="/waterx-logo-transparent.png" alt="" /><img class="logo-x" src="/waterx-logo-transparent.png" alt="" /></div><span>智慧水务运营平台</span></div>
      <div class="topbar-actions"><div class="topbar-project"><small>当前项目</small><select v-model="selectedSite" @change="changeSite"><option v-for="site in sites" :key="site.id" :value="site.id">{{site.name}}</option></select></div><span class="topbar-divider"></span><div class="topbar-user"><span class="avatar">管</span><div><b>平台管理员</b><small>系统管理</small></div></div><button @click="logout">退出登录</button></div>
    </header>
    <aside>
      <nav class="module-nav">
        <button class="module-nav-home" :class="{selected:active==='platform'}" @click="active='platform'"><span class="nav-icon">⌂</span><span>首页</span></button>

        <section class="nav-group">
          <button class="nav-group-title" @click="toggleModule('production')"><span class="nav-icon">◉</span><span>生产运行</span><i :class="{open:expandedModules.production}">›</i></button>
          <div v-show="expandedModules.production" class="nav-children"><button :class="{selected:active==='processDesign'}" @click="active='processDesign'">工艺设计标准</button><button :class="{selected:active==='conditionMatrix'}" @click="active='conditionMatrix'">工况矩阵管理</button><button :class="{selected:active==='operationEntry'}" @click="active='operationEntry';loadOperationEntry()">运行数据填报</button><button :class="{selected:active==='processAnalysis'}" @click="active='processAnalysis'">工艺诊断分析</button><button disabled>工艺调整记录 <small>规划中</small></button></div>
        </section>
        <section class="nav-group">
          <button class="nav-group-title" @click="toggleModule('equipment')"><span class="nav-icon">◇</span><span>设备管理</span><i :class="{open:expandedModules.equipment}">›</i></button>
          <div v-show="expandedModules.equipment" class="nav-children"><button disabled>设备台账 <small>规划中</small></button><button disabled>维护保养 <small>规划中</small></button></div>
        </section>
        <section class="nav-group">
          <button class="nav-group-title" @click="toggleModule('laboratory')"><span class="nav-icon">⌁</span><span>化验管理</span><i :class="{open:expandedModules.laboratory}">›</i></button>
          <div v-show="expandedModules.laboratory" class="nav-children"><button disabled>化验任务 <small>规划中</small></button><button disabled>水质分析 <small>规划中</small></button></div>
        </section>

        <section class="nav-group safety-group" :class="{expanded:expandedModules.safety}">
          <button class="nav-group-title" @click="toggleModule('safety')"><span class="nav-icon">△</span><span>安全管理</span><i :class="{open:expandedModules.safety}">›</i></button>
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
          <button class="nav-group-title" @click="toggleModule('energy')"><span class="nav-icon">↯</span><span>节能降耗</span><i :class="{open:expandedModules.energy}">›</i></button>
          <div v-show="expandedModules.energy" class="nav-children"><button disabled>能耗计量 <small>规划中</small></button><button disabled>能效分析 <small>规划中</small></button></div>
        </section>
        <section class="nav-group">
          <button class="nav-group-title" @click="toggleModule('business')"><span class="nav-icon">▥</span><span>经营管理</span><i :class="{open:expandedModules.business}">›</i></button>
          <div v-show="expandedModules.business" class="nav-children"><button disabled>成本预算 <small>规划中</small></button><button disabled>经营分析 <small>规划中</small></button></div>
        </section>
        <section class="nav-group">
          <button class="nav-group-title" @click="toggleModule('basic')"><span class="nav-icon">▦</span><span>基础信息</span><i :class="{open:expandedModules.basic}">›</i></button>
          <div v-show="expandedModules.basic" class="nav-children"><button :class="{selected:active==='metricConfig'}" @click="active='metricConfig'">指标配置</button><button disabled>工艺线档案 <small>规划中</small></button><button disabled>数据字典 <small>规划中</small></button></div>
        </section>
      </nav>
    </aside>
    <section class="workspace">
      <article>
        <div v-if="!['platform','processAnalysis','processDesign','conditionMatrix','operationEntry','metricConfig'].includes(active)" class="page-title"><div><p class="eyebrow">{{currentSite?.code}}</p><h1>{{active==='overview' ? '安全态势总览' : active==='org' ? '组织架构' : active==='employee' ? '人员档案' : active==='area' ? '厂区区域管理' : active==='risk' ? '风险分级管控' : active==='inspection' ? '安全检查任务' : active==='hazard'?'隐患排查治理':active==='permit'?'危险作业审批':active==='training'?'安全培训与人员资质':active==='asset'?'设备设施与应急物资':active==='health'?'职业健康管理':active==='investment'?'安全投入管理':'安全承诺与访客告知' }}</h1></div><span class="date-chip">{{ new Date().toLocaleDateString('zh-CN') }}</span></div>
        <p v-if="error" class="error banner">{{error}}</p>
        <template v-if="active==='platform'">
          <section class="dashboard-toolbar"><span>今日运营概览</span><div><button>今日</button><button>本月</button><button>自定义</button></div></section>
          <div class="dashboard-kpis"><section><span>今日处理水量</span><strong>6.82<small>万 m³</small></strong><em>较昨日 +2.6%</em></section><section><span>出水综合达标率</span><strong>99.6<small>%</small></strong><em>稳定达标</em></section><section><span>吨水综合电耗</span><strong>0.286<small>kWh/m³</small></strong><em class="down">较目标低 3.4%</em></section><section><span>未闭环事项</span><strong>7<small>项</small></strong><em class="warn">其中逾期 1 项</em></section></div>
          <div class="dashboard-chart-grid"><section class="dashboard-card water-chart"><header><b>近七日处理水量</b><span>万 m³/d</span></header><div class="bar-chart"><div v-for="(value,index) in [78,84,72,90,86,82,88]" :key="index"><span :style="{height:`${value}%`}"></span><small>{{['09','10','11','12','13','14','15'][index]}}日</small></div></div></section><section class="dashboard-card trend-chart"><header><b>出水水质趋势</b><span><i></i> COD　<i></i> NH₃-N</span></header><svg viewBox="0 0 500 180" preserveAspectRatio="none"><g><line v-for="y in [30,70,110,150]" :key="y" x1="20" :y1="y" x2="485" :y2="y" /></g><polyline points="20,105 95,92 170,101 245,72 320,82 395,61 485,68"/><polyline class="second" points="20,132 95,125 170,129 245,116 320,121 395,108 485,112"/></svg></section><section class="dashboard-card structure-chart"><header><b>事项分布</b><span>当前</span></header><div class="donut-wrap"><div class="donut"><span>23<small>全部</small></span></div><ul><li><i></i>生产运行 <b>9</b></li><li><i></i>安全管理 <b>7</b></li><li><i></i>设备管理 <b>4</b></li><li><i></i>其他事项 <b>3</b></li></ul></div></section></div>
          <section class="dashboard-card task-center"><header><b>我的事项</b><span>内容随当前用户和角色动态变化</span></header><nav><button v-for="tab in [{key:'pending',name:'待处理'},{key:'processed',name:'已处理'},{key:'cc',name:'抄送我'},{key:'started',name:'我发起'}]" :key="tab.key" :class="{active:dashboardTaskTab===tab.key}" @click="dashboardTaskTab=tab.key as typeof dashboardTaskTab">{{tab.name}}<em>{{dashboardTasks[tab.key as keyof typeof dashboardTasks].length}}</em></button></nav><div class="dashboard-task-list"><article v-for="task in dashboardTasks[dashboardTaskTab]" :key="task.title"><span>{{task.module}}</span><b>{{task.title}}</b><small>{{task.time}}</small><em>{{task.status}}</em></article></div>
          </section>
        </template>
        <template v-else-if="active==='processAnalysis'">
          <section class="diagnosis-toolbar">
            <label>水厂<select :value="selectedSite"><option :value="selectedSite">{{currentSite?.name || '示范污水处理厂'}}</option></select></label>
            <label>工艺线<select v-model="diagnosisLine"><option>一期生化线</option><option>二期生化线</option></select></label>
            <label>工况方案<select v-model="diagnosisScenario"><option v-for="plan in conditionPlans" :key="plan.id">{{plan.name}}</option></select></label>
            <label>分析日期<input v-model="diagnosisDate" type="date" /></label>
            <button @click="refreshDiagnosis">更新分析</button>
            <div class="toolbar-status"><span><i class="diagnosis-dot normal"></i>{{analysisRows.filter(i=>i.level==='normal').length}} 正常</span><span><i class="diagnosis-dot warning"></i>{{analysisRows.filter(i=>i.level==='warning').length}} 预警</span><span><i class="diagnosis-dot alarm"></i>{{analysisRows.filter(i=>i.level==='alarm').length}} 告警</span><small>更新 {{diagnosisUpdatedAt}}</small></div>
          </section>

          <div class="diagnosis-layout">
            <section class="diagnosis-results">
              <div class="diagnosis-section-head"><div><p class="eyebrow">结果指标</p><h2>水质、效能与污泥状态</h2></div><button @click="active='metricConfig'">配置指标</button></div>
              <div class="result-accordion">
                <section v-for="group in analysisGroups" :key="group.category" class="result-group">
                  <button class="result-group-title" @click="toggleDiagnosisCategory(group.category)"><span class="diagnosis-dot" :class="group.metrics.some(item=>item.level==='alarm')?'alarm':group.metrics.some(item=>item.level==='warning')?'warning':'normal'"></span><b>{{group.category}}</b><small>{{group.metrics.length}} 项指标</small><i :class="{open:expandedDiagnosisCategories[group.category]}">›</i></button>
                  <div v-show="expandedDiagnosisCategories[group.category]" class="diagnosis-table-wrap grouped">
                    <table class="diagnosis-table grouped-table">
                      <thead><tr><th>序号</th><th>指标</th><th>单位</th><th>设计值</th><th>目标值</th><th>实际值</th><th>偏差与状态</th><th>指标意义</th></tr></thead>
                      <tbody><tr v-for="(metric,index) in group.metrics" :key="`${metric.category}-${metric.name}`" :class="`diagnosis-row-${metric.level}`">
                        <td>{{index+1}}</td><td><b>{{metric.name}}</b></td><td>{{metric.unit}}</td><td>{{metric.design}}</td><td>{{metric.target}}</td><td><strong>{{metric.actual}}</strong></td>
                        <td><div class="deviation-cell"><div><span :class="`diagnosis-dot ${metric.level}`"></span><b v-if="metric.deviation!==null" :class="metric.level">{{metric.deviation>0?'+':''}}{{metric.deviation.toFixed(1)}}%</b><b v-else>—</b><em>{{metric.level==='normal'?'正常':metric.level==='warning'?'预警':'告警'}}</em></div><span class="deviation-track"><i :class="metric.level" :style="{width:deviationWidth(metric.deviation)}"></i></span></div></td>
                        <td><small>{{metric.meaning}}</small></td>
                      </tr></tbody>
                    </table>
                  </div>
                </section>
              </div>
              <div class="diagnosis-legend"><span><i class="normal"></i>正常：处于合理范围或优于目标</span><span><i class="warning"></i>预警：偏离工况目标，需要关注</span><span><i class="alarm"></i>告警：明显异常，建议核查处置</span></div>
            </section>

            <section class="process-controls">
              <div class="diagnosis-section-head"><div><p class="eyebrow">过程控制</p><h2>关键运行控制</h2></div><button @click="active='metricConfig'">配置指标</button></div>
              <div class="control-accordion">
                <section v-for="group in displayControlGroups" :key="group.key" class="control-group" :class="group.level">
                  <button class="control-group-title" @click="toggleControlGroup(group.key)"><span class="diagnosis-dot" :class="group.level"></span><b>{{group.title}}</b><small>{{group.indicators.length}} 项指标</small><i :class="{open:expandedControlGroups[group.key]}">›</i></button>
                  <div v-show="expandedControlGroups[group.key]" class="control-indicator-list">
                    <div class="control-indicator-head"><span>指标</span><span>单位</span><span>目标值</span><span>实际值</span><span>偏差</span></div>
                    <div v-for="indicator in group.indicators" :key="indicator.name" class="control-indicator-row">
                      <b>{{indicator.name}}</b><span>{{indicator.unit}}</span><span>{{indicator.target}}</span><strong>{{indicator.actual}}</strong><em :class="indicator.level">{{indicator.deviation===null?'范围内':`${indicator.deviation>0?'+':''}${indicator.deviation.toFixed(1)}%`}}</em>
                    </div>
                  </div>
                </section>
              </div>
            </section>
          </div>
        </template>
        <template v-else-if="active==='processDesign'">
          <section class="process-page-toolbar"><div><label>水厂<select :value="selectedSite"><option :value="selectedSite">{{currentSite?.name}}</option></select></label><label>工艺线<select v-model="diagnosisLine"><option>一期生化线</option><option>二期生化线</option></select></label></div><div><span>共 {{designMetrics.length}} 项设计指标</span><button v-if="!designEditMode" @click="designEditMode=true">编辑设计值</button><button v-else class="primary" @click="saveDesignValues">保存设计值</button></div></section>
          <section class="process-data-panel"><div class="process-explain"><b>设计基准</b><span>记录水厂及工艺线建设、改扩建设计文件中的固定基准值，供诊断分析引用。</span></div><div class="process-table-wrap"><table class="process-config-table"><thead><tr><th>指标分类</th><th>指标名称</th><th>单位</th><th>设计值</th><th>指标意义</th><th>状态</th></tr></thead><tbody><tr v-for="metric in designMetrics" :key="metricKey(metric)"><td><span class="category-chip">{{metric.category}}</span></td><td><b>{{metric.name}}</b></td><td>{{metric.unit}}</td><td><input v-if="designEditMode" v-model="designValues[metricKey(metric)]" /><strong v-else>{{designValues[metricKey(metric)]||'—'}}</strong></td><td>{{metric.meaning}}</td><td><span class="process-status">已启用</span></td></tr></tbody></table></div></section>
        </template>
        <template v-else-if="active==='conditionMatrix'">
          <section class="condition-layout">
            <aside class="condition-list"><header><div><b>工况管理</b><small>{{conditionPlans.length}} 套</small></div><button @click="showConditionForm=true">＋ 新增</button></header><button v-for="plan in conditionPlans" :key="plan.id" :class="{selected:selectedConditionId===plan.id}" @click="selectedConditionId=plan.id;conditionEditMode=false"><span><b>{{plan.name}}</b><small>{{plan.effectiveDate}} 起</small></span><i>›</i></button></aside>
            <section v-if="selectedCondition" class="condition-detail"><div class="condition-meta"><label>工况名称<input v-model="selectedCondition.name" :disabled="!conditionEditMode" /></label><label>实施日期<input v-model="selectedCondition.effectiveDate" type="date" :disabled="!conditionEditMode" /></label><label>说明<input v-model="selectedCondition.description" :disabled="!conditionEditMode" /></label><div class="condition-actions"><button class="danger-lite" @click="deleteCondition(selectedCondition.id)">删除</button><button v-if="!conditionEditMode" @click="conditionEditMode=true">修改</button><button v-else class="primary" @click="saveConditions">保存</button></div></div><div class="process-table-wrap"><table class="process-config-table"><thead><tr><th>指标分类</th><th>指标名称</th><th>单位</th><th>设计值</th><th>目标值</th><th>状态</th></tr></thead><tbody><tr v-for="metric in conditionMetrics" :key="metricKey(metric)"><td><span class="category-chip">{{metric.category}}</span></td><td><b>{{metric.name}}</b></td><td>{{metric.unit}}</td><td>{{designValues[metricKey(metric)]||metric.design}}</td><td><input v-if="conditionEditMode" v-model="selectedCondition.targets[metricKey(metric)]" /><strong v-else>{{selectedCondition.targets[metricKey(metric)]||'—'}}</strong></td><td><span class="process-status">已启用</span></td></tr></tbody></table></div></section>
          </section>
          <div v-if="showConditionForm" class="inline-popover"><form @submit.prevent="createCondition"><header><b>新增工况</b><button type="button" @click="showConditionForm=false">×</button></header><label>工况名称<input v-model="conditionForm.name" required placeholder="例如：雨季高负荷工况" /></label><label>实施日期<input v-model="conditionForm.effectiveDate" type="date" required /></label><label>工况说明<textarea v-model="conditionForm.description" rows="3"></textarea></label><footer><button type="button" @click="showConditionForm=false">取消</button><button class="primary">创建工况</button></footer></form></div>
        </template>
        <template v-else-if="active==='operationEntry'">
          <section class="process-page-toolbar"><div><label>水厂<select :value="selectedSite"><option :value="selectedSite">{{currentSite?.name}}</option></select></label><label>工艺线<select v-model="diagnosisLine" @change="loadOperationEntry"><option>一期生化线</option><option>二期生化线</option></select></label><label>填报日期<input v-model="entryDate" type="date" @change="loadOperationEntry" /></label></div><div><span>上次保存：{{entrySavedAt}}</span><button class="primary" @click="saveOperationEntry">保存填报</button></div></section>
          <section class="process-data-panel"><div class="process-explain"><b>每日实际数据</b><span>按水厂、工艺线和日期填报实际值；保存后作为工艺诊断分析的实际值来源。</span></div><div class="process-table-wrap"><table class="process-config-table entry-table"><thead><tr><th>指标分类</th><th>指标名称</th><th>单位</th><th>设计值</th><th>当前工况目标值</th><th>实际值</th><th>数据状态</th></tr></thead><tbody><tr v-for="metric in entryMetrics" :key="metricKey(metric)"><td><span class="category-chip">{{metric.category}}</span></td><td><b>{{metric.name}}</b></td><td>{{metric.unit}}</td><td>{{designValues[metricKey(metric)]||metric.design}}</td><td>{{selectedCondition?.targets[metricKey(metric)]||metric.target}}</td><td><input v-model="entryValues[metricKey(metric)]" placeholder="请输入" /></td><td><span :class="['entry-state',{empty:!entryValues[metricKey(metric)]}]">{{entryValues[metricKey(metric)]?'已填写':'待填写'}}</span></td></tr></tbody></table></div></section>
        </template>
        <template v-else-if="active==='metricConfig'">
          <form v-if="showNewMetricForm" class="new-metric-form standalone formula-form" @submit.prevent="addCustomMetric">
            <div class="metric-basic-row"><label>指标分类<select v-model="newMetricForm.category"><optgroup label="结果指标"><option v-for="category in resultCategories" :key="category">{{category}}</option></optgroup><optgroup label="过程控制"><option v-for="category in processCategories" :key="category">{{category}}</option></optgroup></select></label><label>指标名称<input v-model="newMetricForm.name" required placeholder="例如：吨水电耗" /></label><label>单位<input v-model="newMetricForm.unit" required placeholder="kWh/m³" /></label><label>指标意义<input v-model="newMetricForm.meaning" placeholder="指标用途或定义" /></label></div>
            <div class="metric-source-row"><label>字段类型<select v-model="newMetricForm.dataType"><option value="DECIMAL">小数</option><option value="INTEGER">整数</option><option value="PERCENT">百分比</option><option value="TEXT">文本</option><option value="BOOLEAN">是/否</option></select></label><label>取值方式<select v-model="newMetricForm.valueSource"><option value="MANUAL">手动填报</option><option value="CALCULATED">公式计算</option><option value="AUTO">系统采集</option></select></label><span v-if="newMetricForm.dataType==='TEXT'">文本字段不参与数值偏差计算</span></div>
            <section v-if="newMetricForm.valueSource==='CALCULATED'" class="formula-editor"><header><b>计算公式</b><small>引用指标后使用运算符或函数组合公式</small></header><div class="formula-tools"><select v-model="formulaReference"><option value="">选择引用指标</option><option v-for="metric in allManagedMetrics" :key="metricKey(metric)" :value="metricKey(metric)">{{metric.category}} · {{metric.name}}</option></select><button type="button" @click="appendFormulaReference">引用</button><button v-for="token in ['+','−','×','÷','(',')']" :key="token" type="button" @click="appendFormulaToken(token)">{{token}}</button><button v-for="fn in ['SUM()','AVG()','MIN()','MAX()','ROUND()']" :key="fn" type="button" @click="appendFormulaToken(fn)">{{fn}}</button></div><textarea v-model="newMetricForm.formula" rows="3" required placeholder="示例：[能源管理::总用电量] ÷ [水量与停留时间::日处理水量]"></textarea><p>支持四则运算、括号及 SUM、AVG、MIN、MAX、ROUND 常用函数。后续可接入正式公式解析与校验引擎。</p></section>
            <div class="new-metric-actions"><button type="button" @click="showNewMetricForm=false">取消</button><button class="primary">添加指标</button></div>
          </form>
          <section class="metric-manager-panel"><div class="metric-manager-toolbar"><div></div><div class="metric-manager-actions"><button @click="showNewMetricForm=!showNewMetricForm">＋ 新增指标</button><button class="primary" @click="saveMetricSettings">保存配置</button></div></div><div class="metric-manager-table-wrap"><table class="metric-manager-table unified"><thead><tr><th>分类 / 指标</th><th>单位</th><th>字段类型</th><th>取值方式</th><th>设计标准</th><th>工况矩阵</th><th>数据填报</th><th>诊断分析</th><th>偏差方式</th><th>绿色范围</th><th>橙色预警</th><th>公式</th></tr></thead><tbody><tr v-for="metric in allManagedMetrics" :key="metricKey(metric)"><td><small>{{metric.category}}</small><b>{{metric.name}}</b></td><td>{{metric.unit}}</td><td><select v-model="settingFor(metric).dataType"><option value="DECIMAL">小数</option><option value="INTEGER">整数</option><option value="PERCENT">百分比</option><option value="TEXT">文本</option><option value="BOOLEAN">是/否</option></select></td><td><select v-model="settingFor(metric).valueSource"><option value="MANUAL">手动填报</option><option value="CALCULATED">公式计算</option><option value="AUTO">系统采集</option></select></td><td><input v-model="settingFor(metric).designEnabled" type="checkbox" /></td><td><input v-model="settingFor(metric).conditionEnabled" type="checkbox" /></td><td><input v-model="settingFor(metric).entryEnabled" type="checkbox" :disabled="settingFor(metric).valueSource==='CALCULATED'" /></td><td><input v-model="settingFor(metric).diagnosisEnabled" type="checkbox" /></td><td><select v-model="settingFor(metric).mode" :disabled="settingFor(metric).dataType==='TEXT'"><option value="UPPER">上限管理</option><option value="LOWER">下限管理</option><option value="CENTER">中间值管理</option></select></td><td><label>± <input v-model.number="settingFor(metric).healthyPct" type="number" min="0" :disabled="settingFor(metric).dataType==='TEXT'" />%</label></td><td><label>至 <input v-model.number="settingFor(metric).warningPct" type="number" min="0" :disabled="settingFor(metric).dataType==='TEXT'" />%</label></td><td><code v-if="settingFor(metric).valueSource==='CALCULATED'" :title="settingFor(metric).formula">{{settingFor(metric).formula||'待配置'}}</code><span v-else>—</span></td></tr></tbody></table></div><footer><span><i class="diagnosis-dot normal"></i>绿色：健康范围　<i class="diagnosis-dot warning"></i>橙色：预警范围　<i class="diagnosis-dot alarm"></i>红色：超过预警阈值</span></footer></section>
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
