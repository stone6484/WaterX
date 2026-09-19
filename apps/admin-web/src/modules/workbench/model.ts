import type { DailyLine, DailySummary, SafetyContext, WorkflowHazard, WorkflowTask } from '@safety/api-client'

export type WorkbenchTarget = { page: 'operationEntry' | 'inspection' | 'hazard'; id?: string; lineId?: string }
export type WorkItem = {
  key: string; title: string; module: string; status: string; action: string;
  date?: string; due?: string; pending: boolean; completed: boolean; started: boolean;
  review: boolean; responsibility: '本人分派' | '岗位职责'; target: WorkbenchTarget;
}
export const localDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
export function overdue(item: WorkItem, now = new Date()) {
  if (!item.pending || !item.due) return false
  return item.due.length === 10 ? item.due < localDate(now) : new Date(item.due).getTime() < now.getTime()
}
export function currentItems(items: WorkItem[], now = new Date()) {
  return items.filter(item => item.pending && (!item.date || item.date <= localDate(now)))
    .sort((a,b) => Number(overdue(b,now))-Number(overdue(a,now)) || (a.due||'9999').localeCompare(b.due||'9999') || Number(b.review)-Number(a.review) || a.key.localeCompare(b.key))
}
export function scheduledItems(items: WorkItem[], period: 'today'|'week', now = new Date()) {
  const start=localDate(now), endDate=new Date(now); endDate.setDate(now.getDate()+(7-(now.getDay()||7)))
  const end=period==='today'?start:localDate(endDate)
  return items.filter(i=>i.pending&&i.date&&i.date>=start&&i.date<=end).sort((a,b)=>a.date!.localeCompare(b.date!))
}
export function dailyItems(line: DailyLine, rows: DailySummary[]): WorkItem[] {
  if (!line.employeeId) return []
  return rows.filter(r=>r.assignee_id===line.employeeId||r.reviewer_id===line.employeeId).map(r=>{
    const execute=r.assignee_id===line.employeeId, review=r.reviewer_id===line.employeeId&&r.actions.includes('confirm')
    const pending=execute&&r.actions.includes('save')||review
    return { key:`daily:${r.id}`,title:`${line.name} · ${r.business_date}日数据`,module:'工艺管理',
      status:({DRAFT:'待填报',RETURNED:'退回修改',SUBMITTED:'待复核',CONFIRMED:'已确认',CANCELLED:'已终止'} as Record<string,string>)[r.state]||r.state,
      action:review?'复核日数据':pending?'填写日数据':'查看记录',date:r.business_date,
      // 业务日期不是截止时间；接口没有期限时不推断逾期。
      pending,completed:r.state==='CONFIRMED',started:false,review,responsibility:'本人分派',target:{page:'operationEntry',id:r.id,lineId:line.id} }
  })
}
export function safetyItems(context: SafetyContext, tasks: WorkflowTask[], hazards: WorkflowHazard[]): WorkItem[] {
  if (!context.employeeId) return []
  const checks: WorkItem[]=tasks.filter(t=>t.assigneeEmployeeId===context.employeeId).map(t=>({
    key:`check:${t.id}`,title:t.title,module:'安全检查',status:({PENDING:'待检查',IN_PROGRESS:'检查中',OVERDUE:'已逾期',COMPLETED:'已完成',CANCELLED:'已取消'} as Record<string,string>)[t.status]||t.status,
    action:t.canExecute?'执行检查':'查看检查',date:t.plannedStart.slice(0,10),due:t.dueAt,pending:t.canExecute,completed:t.status==='COMPLETED',started:false,review:false,responsibility:'本人分派',target:{page:'inspection',id:t.id},
  }))
  const issues: WorkItem[]=hazards.filter(h=>h.responsibleEmployeeId===context.employeeId||h.reportedBy===context.userId||h.canReview||context.canManage&&h.canAssign&&h.status==='PENDING_ACCEPTANCE').map(h=>{
    const own=h.responsibleEmployeeId===context.employeeId, accept=context.canManage&&h.canAssign&&h.status==='PENDING_ACCEPTANCE'
    return {key:`hazard:${h.id}`,title:`${h.location} · ${h.description}`,module:'隐患治理',
      status:({PENDING_ACCEPTANCE:'待受理',ASSIGNED:'待接收',RECTIFYING:'整改中',REVIEW_PENDING:'待复核',CLOSED:'已关闭'} as Record<string,string>)[h.status]||h.status,
      action:h.canReview?'复核隐患':h.canReceive?'接收责任':h.canRectify?'反馈整改':accept?'受理问题':'查看记录',
      due:h.dueDate,pending:h.canReceive||h.canRectify||h.canReview||accept,completed:h.status==='CLOSED'&&own,started:h.reportedBy===context.userId,review:h.canReview,
      responsibility:own?'本人分派':'岗位职责',target:{page:'hazard',id:h.id}}
  })
  return [...checks,...issues]
}
export function uniqueItems(items: WorkItem[]) { return [...new Map(items.map(i=>[i.key,i])).values()] }
