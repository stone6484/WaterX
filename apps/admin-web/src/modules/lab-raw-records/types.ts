export type LabTemplateCode =
  | 'Y01' | 'Y02' | 'Y03' | 'Y04' | 'Y05' | 'Y06' | 'Y07' | 'Y08' | 'Y09'
  | 'Y10' | 'Y11' | 'Y12' | 'Y13' | 'Y14' | 'Y15' | 'Y16' | 'Y17' | 'Y18'

export type LabCategory = '水质检测' | '污泥检测' | '药剂检测'
export type LabMethodState = '现行方法' | '项目方法' | '待确认'
export type LabRecordStatus = '草稿' | '待复核' | '已复核' | '已锁定' | '更正中' | '已作废'
export type LabQcStatus = '待完成' | '通过' | '警告' | '阻断'

export type LabFieldOption = { label: string; value: string }

export type LabFieldDefinition = {
  key: string
  label: string
  symbol: string
  unit: string
  group: '样品与环境' | '一手观测值' | '标准与试剂'
  inputType?: 'number' | 'text' | 'select'
  options?: LabFieldOption[]
  step?: string
  required?: boolean
  defaultValue?: string
  hint?: string
}

export type LabResultDefinition = {
  key: string
  label: string
  unit: string
  decimals: number
}

export type LabTemplate = {
  code: LabTemplateCode
  title: string
  shortName: string
  category: LabCategory
  ledgerNo: string
  method: string
  methodVersion: string
  methodState: LabMethodState
  formulaVersion: string
  formulaText: string
  frequency: string
  existing: boolean
  scopeNote?: string
  fields: LabFieldDefinition[]
  results: LabResultDefinition[]
}

export type LabCalculatedResult = LabResultDefinition & {
  value: number | null
  display: string
}

export type LabQcCheck = {
  id: string
  label: string
  status: '通过' | '警告' | '阻断' | '待完成'
  message: string
}

export type LabAuditEvent = {
  id: string
  at: string
  operator: string
  action: string
  detail: string
}

export type LabRawRecord = {
  id: string
  templateCode: LabTemplateCode
  recordNo: string
  version: number
  parentRecordId?: string
  correctionReason?: string
  sampleSource: string
  sampleName: string
  sampleDate: string
  testDate: string
  roomTemperature: string
  humidity: string
  instrumentNo: string
  reagentBatch: string
  observations: Record<string, string>
  notes: string
  analyst: string
  reviewer: string
  status: LabRecordStatus
  locked: boolean
  qcStatus: LabQcStatus
  createdAt: string
  updatedAt: string
  lockedAt?: string
  audit: LabAuditEvent[]
}
