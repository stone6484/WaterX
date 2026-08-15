export type TokenPair = {
  accessToken: string
  refreshToken: string
  expiresIn: number
  tokenType: 'Bearer'
}

export type Site = { id: string; code: string; name: string; timeZone: string }
export type OrgUnit = {
  id: string; parentId?: string; code: string; name: string; unitType: string; sortOrder: number
}
export type Employee = {
  id: string; employeeNo: string; displayName: string; status: string;
  organization?: string; position?: string
}
export type SafetyArchiveItem={name:string;status:string;detail:string;recordedAt?:string}
export type EmployeeSafetyArchive={employee:Employee;trainings:SafetyArchiveItem[];qualifications:SafetyArchiveItem[];commitments:SafetyArchiveItem[];healthExams:SafetyArchiveItem[]}
export type RiskSummary = { total: number; pending: number; red: number; orange: number; yellow: number; blue: number }
export type Hazard = {
  id: string; code: string; objectName: string; areaName?: string; hazardFactor: string;
  possibleAccident: string; accidentType: string; status: string; nextReviewOn?: string;
  method?: string; riskValue?: number; riskLevel?: number; riskColor?: 'RED' | 'ORANGE' | 'YELLOW' | 'BLUE';
  controlLevel?: string; measureCount: number
}
export type RiskObject = { id: string; code: string; name: string; objectType: string; areaName?: string }
export type CreateHazardInput = {
  riskObjectId: string; code: string; hazardFactor: string; possibleAccident: string;
  accidentType: string; identificationBasis?: string; identifiedOn: string; nextReviewOn?: string
}
export type AssessmentInput = {
  method: 'LS' | 'LEC'; likelihood: number; severity?: number; exposure?: number; consequence?: number
}
export type AssessmentResult = {
  id: string; riskValue: number; riskLevel: number; riskColor: 'RED' | 'ORANGE' | 'YELLOW' | 'BLUE'; controlLevel: string
}
export type ControlMeasureInput = {
  measureType: 'ENGINEERING' | 'MANAGEMENT' | 'TRAINING' | 'PPE' | 'EMERGENCY'; content: string
}
export type ControlMeasure = ControlMeasureInput & { id: string; sortOrder: number }
export type RiskAcknowledgement = { hazardId: string; assessmentId: string; acknowledgedAt: string }
export type Area = { id: string; parentId?: string; code: string; name: string; areaType: string; status: string; objectCount: number }
export type AssessmentHistory = {
  id: string; method: 'LS' | 'LEC'; likelihood: number; severity?: number; exposure?: number; consequence?: number;
  riskValue: number; riskLevel: number; riskColor: 'RED' | 'ORANGE' | 'YELLOW' | 'BLUE'; controlLevel: string;
  approvalStatus: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'RETURNED'; assessmentReason?: string;
  reviewComment?: string; assessedAt: string; reviewedAt?: string; current: boolean; assessedByName?: string
}
export type InspectionSummary = { pendingTasks: number; completedTasks: number; openHazards: number; pendingReview: number; overdueHazards: number }
export type InspectionStatistics = { totalHazards:number; closedHazards:number; generalHazards:number; seriousHazards:number; majorHazards:number; inspectionSource:number; employeeSource:number; reminderLevel:number; departmentLevel:number; plantLevel:number }
export type InspectionTemplate = { id: string; code: string; name: string; inspectionType: string; frequency: string; itemCount: number }
export type InspectionTask = { id: string; taskNo: string; title: string; templateName: string; inspectionType: string; plannedStart: string; dueAt: string; status: string; assigneeName?: string; hazardCount: number }
export type InspectionTaskItem = { id: string; category: string; content: string; required: boolean; sortOrder: number; result?: 'COMPLIANT'|'NON_COMPLIANT'|'NOT_APPLICABLE'; problemDescription?: string; handlingMeasure?: string }
export type InspectionPlan = { id:string; code:string; name:string; templateName:string; scheduleType:'DAILY'|'WEEKLY'|'MONTHLY'|'ONCE'; intervalValue:number; nextRunDate:string; dueHours:number; assigneeName?:string; status:string; lastGeneratedAt?:string; generatedCount:number; lastActionAt?:string; changeCount:number }
export type SafetyHazard = {
  id: string; hazardNo: string; sourceType: string; location: string; name: string; categoryMajor: string; categoryMinor?: string;
  description: string; hazardLevel: string; rectificationMeasure: string; temporaryMeasure?: string; dueDate: string;
  estimatedCost: number; status: string; responsibleOrg?: string; responsiblePerson?: string; discoveredAt: string;
  completedAt?: string; completionNote?: string; reviewedAt?: string; reviewResult?: string; reviewComment?: string;
  reminderCount: number; lastRemindedAt?: string; overdueDays:number; escalationLevel?:'REMINDER'|'DEPARTMENT'|'PLANT'
}
export type SafetyAttachment = { id:string; stage:'DISCOVERY'|'RECTIFICATION'|'REVIEW'; originalName:string; contentType:string; fileSize:number; uploadedAt:string; uploadedByName?:string }
export type WorkPermitTemplate={id:string;permitType:string;name:string;measureCount:number}
export type WorkPermit={id:string;permitNo:string;permitType:string;permitTypeName:string;workUnit:string;location:string;workContent:string;workLevel:string;startAt:string;endAt:string;responsiblePerson:string;guardian:string;status:string;confirmedCount:number;involvedCount:number;gasTestCount:number;briefingCount:number}
export type WorkPermitMeasure={measureId:string;content:string;required:boolean;involved:boolean;confirmed:boolean;confirmedAt?:string}
export type TrainingSummary={courseCount:number;pendingAssignments:number;completedAssignments:number;expiringQualifications:number}
export type TrainingStatistics={from:string;to:string;assignedCount:number;completedCount:number;failedCount:number;averageScore:number}
export type TrainingCourse={id:string;code:string;name:string;courseType:string;materialType:string;durationMinutes:number;passingScore:number;status:string}
export type TrainingAssignment={id:string;courseName:string;employeeName:string;dueAt:string;studyProgress:number;examScore?:number;status:string;completedAt?:string}
export type EmployeeQualification={id:string;employeeName:string;qualificationType:string;certificateName:string;certificateNo:string;issuingAuthority?:string;issuedOn?:string;expiresOn:string;reminderDays:number;status:'VALID'|'EXPIRING'|'EXPIRED'}
export type SafetyAssetSummary={total:number;specialEquipment:number;emergencyAndFire:number;dueSoon:number}
export type SafetyAsset={id:string;assetNo:string;assetName:string;assetType:string;category?:string;location:string;responsiblePerson?:string;modelSpec?:string;registrationNo?:string;quantity:number;unit:string;lastInspectedOn?:string;nextInspectionOn?:string;expiresOn?:string;reminderDays:number;status:string;dueStatus:'NORMAL'|'DUE_SOON'|'OVERDUE';maintenanceCount:number}
export type OccupationalHealthSummary={activeFactors:number;monitoringDue:number;examRecords:number;examDue:number}
export type OccupationalFactor={id:string;factorName:string;factorType:string;location:string;exposedPositions:string;exposureLevel?:string;limitValue?:string;controlMeasures:string;monitoringFrequency:string;lastMonitoredOn?:string;nextMonitoringOn?:string;dueStatus:'NORMAL'|'DUE_SOON'|'OVERDUE'}
export type OccupationalExam={id:string;employeeName:string;examType:string;examDate:string;medicalInstitution:string;conclusion:string;restrictedItems?:string;followUpAction?:string;nextExamOn?:string}
export type InvestmentSummary={year:number;plannedAmount:number;spentAmount:number;remainingAmount:number;executionRate:number}
export type SafetyBudget={id:string;budgetYear:number;category:string;plannedAmount:number;description:string;status:string;spentAmount:number}
export type SafetyExpense={id:string;category:string;expenseDate:string;amount:number;purpose:string;vendor?:string;invoiceNo?:string;recordedBy:string}
export type TrainingMaterial={id:string;originalName:string;contentType:string;fileSize:number;uploadedAt:string}
export type SafetyCommitment={id:string;name:string;version:string;positionScope:string;content:string;employeeName:string;dueAt:string;status:'PENDING'|'SIGNED';signedAt?:string;signatureText?:string}
export type SafetyCommitmentTemplate={id:string;code:string;name:string;positionScope:string;content:string;version:string;status:string}
export type VisitorBriefing={id:string;tenantId:string;siteId:string;siteName:string;accessToken:string;title:string;briefingContent:string;riskMapDescription?:string;evacuationDescription?:string;emergencyContact?:string;riskMapUrl?:string;evacuationMapUrl?:string}
export type VisitorRecord={id:string;visitorName:string;mobile?:string;companyName?:string;visitPurpose:string;hostName:string;registeredAt:string;status:string}

export class ApiClient {
  private accessToken = ''
  private refreshToken = ''
  private siteId = ''
  private tokenRefreshHandler?: (pair: TokenPair) => void

  constructor(private readonly baseUrl = '/api') {}

  setSession(accessToken: string, siteId = '', refreshToken = '') {
    this.accessToken = accessToken
    this.refreshToken = refreshToken
    this.siteId = siteId
  }

  onTokenRefresh(handler: (pair: TokenPair) => void) { this.tokenRefreshHandler = handler }

  setSite(siteId: string) { this.siteId = siteId }

  async login(username: string, password: string): Promise<TokenPair> {
    const pair = await this.request<TokenPair>('/v1/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }, false)
    this.accessToken = pair.accessToken; this.refreshToken = pair.refreshToken
    return pair
  }
  logoutSession(): Promise<void> { return this.request('/v1/auth/logout', {method:'POST'}, true, false) }

  sites(): Promise<Site[]> { return this.request('/v1/platform/sites') }
  orgUnits(): Promise<OrgUnit[]> { return this.request('/v1/org/units') }
  employees(): Promise<Employee[]> { return this.request('/v1/org/employees') }
  employeeSafetyArchive(id:string):Promise<EmployeeSafetyArchive>{return this.request(`/v1/org/employees/${id}/safety-archive`)}
  riskSummary(): Promise<RiskSummary> { return this.request('/v1/risk/summary') }
  hazards(): Promise<Hazard[]> { return this.request('/v1/risk/hazards') }
  riskMeasures(id: string): Promise<ControlMeasure[]> { return this.request(`/v1/risk/hazards/${id}/measures`) }
  riskAcknowledgements(): Promise<RiskAcknowledgement[]> { return this.request('/v1/risk/acknowledgements/me') }
  acknowledgeRisk(id: string): Promise<void> { return this.request(`/v1/risk/hazards/${id}/acknowledge`, { method: 'POST', headers: { 'X-Client-Source': 'H5' } }) }
  areas(): Promise<Area[]> { return this.request('/v1/risk/areas') }
  createArea(input: { parentId?: string; code: string; name: string; areaType: string }): Promise<{ id: string }> {
    return this.request('/v1/risk/areas', { method: 'POST', body: JSON.stringify(input) })
  }
  assessmentHistory(hazardId: string): Promise<AssessmentHistory[]> { return this.request(`/v1/risk/hazards/${hazardId}/assessments`) }
  acknowledgementSummary(hazardId: string): Promise<{ acknowledgedCount: number; lastAcknowledgedAt?: string }> {
    return this.request(`/v1/risk/hazards/${hazardId}/acknowledgement-summary`)
  }
  reassessHazard(hazardId: string, input: AssessmentInput & { reason: string }): Promise<AssessmentResult> {
    return this.request(`/v1/risk/hazards/${hazardId}/reassess`, { method: 'POST', body: JSON.stringify(input) })
  }
  reviewReassessment(id: string, decision: 'APPROVE' | 'RETURN', comment = ''): Promise<void> {
    return this.request(`/v1/risk/assessments/${id}/review`, { method: 'POST', body: JSON.stringify({ decision, comment }) })
  }
  riskObjects(): Promise<RiskObject[]> { return this.request('/v1/risk/objects') }
  createHazard(input: CreateHazardInput): Promise<{ id: string }> {
    return this.request('/v1/risk/hazards', { method: 'POST', body: JSON.stringify(input) })
  }
  assessHazard(id: string, input: AssessmentInput): Promise<AssessmentResult> {
    return this.request(`/v1/risk/hazards/${id}/assessments`, { method: 'POST', body: JSON.stringify(input) })
  }
  replaceRiskMeasures(id: string, measures: ControlMeasureInput[]): Promise<void> {
    return this.request(`/v1/risk/hazards/${id}/measures`, { method: 'PUT', body: JSON.stringify(measures) })
  }
  submitHazard(id: string): Promise<void> {
    return this.request(`/v1/risk/hazards/${id}/submit`, { method: 'POST' })
  }
  reviewHazard(id: string, decision: 'APPROVE' | 'RETURN', comment = ''): Promise<void> {
    return this.request(`/v1/risk/hazards/${id}/review`, { method: 'POST', body: JSON.stringify({ decision, comment }) })
  }
  inspectionSummary(): Promise<InspectionSummary> { return this.request('/v1/safety/inspection/summary') }
  inspectionStatistics():Promise<InspectionStatistics>{return this.request('/v1/safety/inspection/statistics')}
  inspectionTemplates(): Promise<InspectionTemplate[]> { return this.request('/v1/safety/inspection/templates') }
  inspectionPlans(): Promise<InspectionPlan[]> { return this.request('/v1/safety/inspection/plans') }
  createInspectionPlan(input:{templateId:string;name:string;scheduleType:'DAILY'|'WEEKLY'|'MONTHLY'|'ONCE';intervalValue:number;nextRunDate:string;dueHours:number;assigneeEmployeeId?:string}):Promise<{id:string}>{
    return this.request('/v1/safety/inspection/plans',{method:'POST',body:JSON.stringify(input)})
  }
  generateInspectionPlans(throughDate?:string):Promise<{generatedCount:number}>{return this.request(`/v1/safety/inspection/plans/generate${throughDate?`?throughDate=${throughDate}`:''}`,{method:'POST'})}
  changeInspectionPlanStatus(id:string,action:'PAUSE'|'RESUME',reason:string):Promise<void>{return this.request(`/v1/safety/inspection/plans/${id}/status`,{method:'POST',body:JSON.stringify({action,reason})})}
  inspectionTasks(): Promise<InspectionTask[]> { return this.request('/v1/safety/inspection/tasks') }
  inspectionTaskItems(id: string): Promise<InspectionTaskItem[]> { return this.request(`/v1/safety/inspection/tasks/${id}/items`) }
  createInspectionTask(input: { templateId: string; title: string; plannedStart: string; dueAt: string; assigneeEmployeeId?: string }): Promise<{id:string}> {
    return this.request('/v1/safety/inspection/tasks', { method:'POST', body:JSON.stringify(input) })
  }
  completeInspectionTask(id: string, items: Array<{ itemId:string; result:'COMPLIANT'|'NON_COMPLIANT'|'NOT_APPLICABLE'; problemDescription?:string; handlingMeasure?:string; temporaryMeasure?:string; hazardLevel?:string; dueDate?:string }>): Promise<{hazardsCreated:number}> {
    return this.request(`/v1/safety/inspection/tasks/${id}/complete`, { method:'POST', body:JSON.stringify({items}) })
  }
  safetyHazards(): Promise<SafetyHazard[]> { return this.request('/v1/safety/hazards') }
  reportSafetyHazard(input: { location: string; name: string; categoryMajor: string; categoryMinor?: string; description: string; hazardLevel: string; rectificationMeasure: string; temporaryMeasure?: string; dueDate: string; estimatedCost: number }): Promise<{id: string}> {
    return this.request('/v1/safety/hazards', { method: 'POST', body: JSON.stringify(input) })
  }
  submitRectification(id: string, completionNote: string): Promise<void> {
    return this.request(`/v1/safety/hazards/${id}/rectification`, { method: 'POST', body: JSON.stringify({ completionNote }) })
  }
  reviewSafetyHazard(id: string, passed: boolean, comment: string): Promise<void> {
    return this.request(`/v1/safety/hazards/${id}/review`, { method: 'POST', body: JSON.stringify({ passed, comment }) })
  }
  remindSafetyHazard(id:string,message:string):Promise<void>{return this.request(`/v1/safety/hazards/${id}/reminders`,{method:'POST',body:JSON.stringify({message})})}
  hazardAttachments(id:string):Promise<SafetyAttachment[]>{return this.request(`/v1/safety/hazards/${id}/attachments`)}
  uploadHazardAttachment(id:string,stage:'DISCOVERY'|'RECTIFICATION'|'REVIEW',file:File):Promise<SafetyAttachment>{const body=new FormData();body.append('file',file);return this.request(`/v1/safety/hazards/${id}/attachments?stage=${stage}`,{method:'POST',body})}
  workPermitTemplates():Promise<WorkPermitTemplate[]>{return this.request('/v1/safety/work-permits/templates')}
  workPermits():Promise<WorkPermit[]>{return this.request('/v1/safety/work-permits')}
  createWorkPermit(input:{templateId:string;workUnit:string;location:string;workContent:string;workLevel:string;riskResult:string;startAt:string;endAt:string;responsiblePerson:string;guardian:string;workers:string;relatedPermits?:string}):Promise<{id:string}>{return this.request('/v1/safety/work-permits',{method:'POST',body:JSON.stringify(input)})}
  submitWorkPermit(id:string):Promise<void>{return this.request(`/v1/safety/work-permits/${id}/submit`,{method:'POST'})}
  reviewWorkPermit(id:string,approved:boolean,comment:string):Promise<void>{return this.request(`/v1/safety/work-permits/${id}/review`,{method:'POST',body:JSON.stringify({approved,comment})})}
  closeWorkPermit(id:string):Promise<void>{return this.request(`/v1/safety/work-permits/${id}/close`,{method:'POST'})}
  workPermitMeasures(id:string):Promise<WorkPermitMeasure[]>{return this.request(`/v1/safety/work-permits/${id}/measures`)}
  confirmWorkPermitMeasures(id:string,items:Array<{measureId:string;involved:boolean;confirmed:boolean}>):Promise<void>{return this.request(`/v1/safety/work-permits/${id}/measures`,{method:'PUT',body:JSON.stringify(items)})}
  addWorkPermitGasTest(id:string,input:{oxygen?:number;carbonMonoxide?:number;hydrogenSulfide?:number;combustibleGas?:number;otherGas?:string;testPoint:string;testedBy:string;testedAt:string}):Promise<void>{return this.request(`/v1/safety/work-permits/${id}/gas-tests`,{method:'POST',body:JSON.stringify(input)})}
  confirmWorkPermitBriefing(id:string,content:string,participantNames:string):Promise<void>{return this.request(`/v1/safety/work-permits/${id}/briefings`,{method:'POST',body:JSON.stringify({content,participantNames})})}
  startWorkPermit(id:string):Promise<void>{return this.request(`/v1/safety/work-permits/${id}/start`,{method:'POST'})}
  trainingSummary():Promise<TrainingSummary>{return this.request('/v1/safety/training/summary')}
  trainingCourses():Promise<TrainingCourse[]>{return this.request('/v1/safety/training/courses')}
  createTrainingCourse(input:{code:string;name:string;courseType:string;materialType:string;durationMinutes:number;passingScore:number}):Promise<{id:string}>{return this.request('/v1/safety/training/courses',{method:'POST',body:JSON.stringify(input)})}
  trainingAssignments():Promise<TrainingAssignment[]>{return this.request('/v1/safety/training/assignments')}
  assignTraining(courseId:string,employeeId:string,dueAt:string):Promise<{id:string}>{return this.request('/v1/safety/training/assignments',{method:'POST',body:JSON.stringify({courseId,employeeId,dueAt})})}
  completeTraining(id:string,score:number):Promise<void>{return this.request(`/v1/safety/training/assignments/${id}/complete`,{method:'POST',body:JSON.stringify({score})})}
  employeeQualifications():Promise<EmployeeQualification[]>{return this.request('/v1/safety/training/qualifications')}
  createEmployeeQualification(input:{employeeId:string;qualificationType:string;certificateName:string;certificateNo:string;issuingAuthority?:string;issuedOn?:string;expiresOn:string;reminderDays:number}):Promise<{id:string}>{return this.request('/v1/safety/training/qualifications',{method:'POST',body:JSON.stringify(input)})}
  trainingStatistics(from:string,to:string):Promise<TrainingStatistics>{return this.request(`/v1/safety/training/statistics?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)}
  safetyAssetSummary():Promise<SafetyAssetSummary>{return this.request('/v1/safety/assets/summary')}
  safetyAssets():Promise<SafetyAsset[]>{return this.request('/v1/safety/assets')}
  createSafetyAsset(input:{assetNo:string;assetName:string;assetType:string;category?:string;location:string;responsiblePerson?:string;manufacturer?:string;modelSpec?:string;registrationNo?:string;quantity:number;unit:string;commissionedOn?:string;lastInspectedOn?:string;nextInspectionOn?:string;expiresOn?:string;reminderDays:number;notes?:string}):Promise<{id:string}>{return this.request('/v1/safety/assets',{method:'POST',body:JSON.stringify(input)})}
  recordAssetMaintenance(id:string,input:{maintenanceType:string;performedOn:string;performedBy:string;result:string;description:string;nextDueOn?:string;cost:number}):Promise<{id:string}>{return this.request(`/v1/safety/assets/${id}/maintenance`,{method:'POST',body:JSON.stringify(input)})}
  occupationalHealthSummary():Promise<OccupationalHealthSummary>{return this.request('/v1/safety/occupational-health/summary')}
  occupationalFactors():Promise<OccupationalFactor[]>{return this.request('/v1/safety/occupational-health/factors')}
  createOccupationalFactor(input:{factorName:string;factorType:string;location:string;exposedPositions:string;exposureLevel?:string;limitValue?:string;controlMeasures:string;monitoringFrequency:string;lastMonitoredOn?:string;nextMonitoringOn?:string}):Promise<{id:string}>{return this.request('/v1/safety/occupational-health/factors',{method:'POST',body:JSON.stringify(input)})}
  recordFactorMonitoring(id:string,input:{monitoredOn:string;result:string;nextMonitoringOn:string}):Promise<void>{return this.request(`/v1/safety/occupational-health/factors/${id}/monitoring`,{method:'POST',body:JSON.stringify(input)})}
  occupationalExams():Promise<OccupationalExam[]>{return this.request('/v1/safety/occupational-health/exams')}
  recordOccupationalExam(input:{employeeId:string;examType:string;examDate:string;medicalInstitution:string;conclusion:string;restrictedItems?:string;followUpAction?:string;nextExamOn?:string}):Promise<{id:string}>{return this.request('/v1/safety/occupational-health/exams',{method:'POST',body:JSON.stringify(input)})}
  investmentSummary():Promise<InvestmentSummary>{return this.request('/v1/safety/investment/summary')}
  safetyBudgets():Promise<SafetyBudget[]>{return this.request('/v1/safety/investment/budgets')}
  createSafetyBudget(input:{budgetYear:number;category:string;plannedAmount:number;description:string}):Promise<{id:string}>{return this.request('/v1/safety/investment/budgets',{method:'POST',body:JSON.stringify(input)})}
  safetyExpenses():Promise<SafetyExpense[]>{return this.request('/v1/safety/investment/expenses')}
  recordSafetyExpense(input:{budgetId:string;expenseDate:string;amount:number;purpose:string;vendor?:string;invoiceNo?:string;recordedBy:string}):Promise<{id:string}>{return this.request('/v1/safety/investment/expenses',{method:'POST',body:JSON.stringify(input)})}
  trainingMaterials(courseId:string):Promise<TrainingMaterial[]>{return this.request(`/v1/safety/education/courses/${courseId}/materials`)}
  uploadTrainingMaterial(courseId:string,file:File):Promise<TrainingMaterial>{const body=new FormData();body.append('file',file);return this.request(`/v1/safety/education/courses/${courseId}/materials`,{method:'POST',body})}
  safetyCommitments():Promise<SafetyCommitment[]>{return this.request('/v1/safety/education/commitments')}
  safetyCommitmentTemplates():Promise<SafetyCommitmentTemplate[]>{return this.request('/v1/safety/education/commitment-templates')}
  createSafetyCommitmentTemplate(input:{code:string;name:string;positionScope:string;content:string;version:string}):Promise<{id:string}>{return this.request('/v1/safety/education/commitment-templates',{method:'POST',body:JSON.stringify(input)})}
  assignSafetyCommitment(input:{templateId:string;employeeId:string;dueAt:string}):Promise<{id:string}>{return this.request('/v1/safety/education/commitments',{method:'POST',body:JSON.stringify(input)})}
  signSafetyCommitment(id:string,signatureText:string):Promise<void>{return this.request(`/v1/safety/education/commitments/${id}/sign`,{method:'POST',body:JSON.stringify({signatureText})})}
  visitorBriefing():Promise<VisitorBriefing>{return this.request('/v1/safety/visitors/briefing')}
  updateVisitorBriefing(input:{title:string;briefingContent:string;riskMapDescription?:string;evacuationDescription?:string;emergencyContact?:string}):Promise<void>{return this.request('/v1/safety/visitors/briefing',{method:'PUT',body:JSON.stringify(input)})}
  visitorRecords():Promise<VisitorRecord[]>{return this.request('/v1/safety/visitors/records')}
  publicVisitorBriefing(token:string):Promise<VisitorBriefing>{return this.request(`/v1/public/visitor/${encodeURIComponent(token)}`,{},false)}
  registerVisitor(token:string,input:{visitorName:string;mobile?:string;companyName?:string;visitPurpose:string;hostName:string;acknowledged:boolean}):Promise<{id:string}>{return this.request(`/v1/public/visitor/${encodeURIComponent(token)}/register`,{method:'POST',body:JSON.stringify(input)},false)}

  private async request<T>(path: string, init: RequestInit = {}, authenticated = true, allowRefresh = true): Promise<T> {
    const headers = new Headers(init.headers)
    if (!(init.body instanceof FormData)) headers.set('Content-Type', 'application/json')
    if (authenticated && this.accessToken) headers.set('Authorization', `Bearer ${this.accessToken}`)
    if (authenticated && this.siteId) headers.set('X-Site-Id', this.siteId)
    const response = await fetch(`${this.baseUrl}${path}`, { ...init, headers })
    if (response.status === 401 && authenticated && allowRefresh && this.refreshToken) {
      const refreshed = await fetch(`${this.baseUrl}/v1/auth/refresh`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({refreshToken:this.refreshToken})})
      if (refreshed.ok) {
        const pair = await refreshed.json() as TokenPair
        this.accessToken = pair.accessToken; this.refreshToken = pair.refreshToken; this.tokenRefreshHandler?.(pair)
        return this.request<T>(path, init, authenticated, false)
      }
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: '请求失败' }))
      throw new Error(error.message || '请求失败')
    }
    if (response.status === 204 || response.headers.get('content-length') === '0') return undefined as T
    return response.json() as Promise<T>
  }
}
