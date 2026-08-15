package com.waterx.safety.inspection;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class InspectionPlanService {
    private final JdbcClient jdbc;

    public InspectionPlanService(JdbcClient jdbc) { this.jdbc = jdbc; }

    @Scheduled(cron = "0 5 * * * *", zone = "Asia/Shanghai")
    public void scheduledGeneration() { generateDuePlans(null, null, LocalDate.now()); }

    @Transactional
    public int generateDuePlans(UUID tenantId, UUID siteId, LocalDate throughDate) {
        String scope = tenantId == null ? "" : " and tenant_id=:tenantId and site_id=:siteId";
        JdbcClient.StatementSpec statement = jdbc.sql("""
            select id,tenant_id,site_id,template_id,code,name,schedule_type,interval_value,next_run_date,due_hours,assignee_employee_id
            from inspection_plan where status='ACTIVE' and next_run_date<=:throughDate
            """ + scope + " order by next_run_date,id").param("throughDate",throughDate);
        if (tenantId != null) statement = statement.param("tenantId",tenantId).param("siteId",siteId);
        List<PlanDue> plans = statement.query((rs,n)->new PlanDue(rs.getObject("id",UUID.class),rs.getObject("tenant_id",UUID.class),
                rs.getObject("site_id",UUID.class),rs.getObject("template_id",UUID.class),rs.getString("code"),rs.getString("name"),
                rs.getString("schedule_type"),rs.getInt("interval_value"),rs.getObject("next_run_date",LocalDate.class),
                rs.getInt("due_hours"),rs.getObject("assignee_employee_id",UUID.class))).list();
        int generated=0;
        for(PlanDue plan:plans) {
            LocalDate runDate=plan.nextRunDate();
            while(!runDate.isAfter(throughDate)) {
                UUID taskId=UUID.randomUUID();
                String taskNo="JC-"+runDate.toString().replace("-","")+"-"+taskId.toString().substring(0,5).toUpperCase();
                int inserted=jdbc.sql("""
                    insert into inspection_task(id,tenant_id,site_id,template_id,plan_id,scheduled_for,task_no,title,planned_start,due_at,status,assignee_employee_id)
                    values(:id,:tenantId,:siteId,:templateId,:planId,:runDate,:taskNo,:title,:runDate,:dueAt,'PENDING',:assignee)
                    on conflict(tenant_id,plan_id,scheduled_for) where plan_id is not null do nothing
                    """).param("id",taskId).param("tenantId",plan.tenantId()).param("siteId",plan.siteId()).param("templateId",plan.templateId())
                        .param("planId",plan.id()).param("runDate",runDate).param("taskNo",taskNo).param("title",plan.name())
                        .param("dueAt",runDate.atStartOfDay().plusHours(plan.dueHours()).atOffset(java.time.ZoneOffset.ofHours(8)))
                        .param("assignee",plan.assigneeEmployeeId()).update();
                generated+=inserted;
                if("ONCE".equals(plan.scheduleType())) break;
                runDate=advance(runDate,plan.scheduleType(),plan.intervalValue());
            }
            LocalDate next="ONCE".equals(plan.scheduleType())?runDate:advancePast(plan.nextRunDate(),plan.scheduleType(),plan.intervalValue(),throughDate);
            jdbc.sql("update inspection_plan set next_run_date=:next,status=:status,last_generated_at=now(),updated_at=now() where id=:id and tenant_id=:tenantId")
                    .param("next",next).param("status","ONCE".equals(plan.scheduleType())?"COMPLETED":"ACTIVE")
                    .param("id",plan.id()).param("tenantId",plan.tenantId()).update();
        }
        return generated;
    }

    private LocalDate advancePast(LocalDate date,String type,int interval,LocalDate through) {
        LocalDate next=date;
        do { next=advance(next,type,interval); } while(!next.isAfter(through));
        return next;
    }
    private LocalDate advance(LocalDate date,String type,int interval) {
        return switch(type) { case "DAILY" -> date.plusDays(interval); case "WEEKLY" -> date.plusWeeks(interval); case "MONTHLY" -> date.plusMonths(interval); default -> date; };
    }
    private record PlanDue(UUID id,UUID tenantId,UUID siteId,UUID templateId,String code,String name,String scheduleType,int intervalValue,LocalDate nextRunDate,int dueHours,UUID assigneeEmployeeId) {}
}
