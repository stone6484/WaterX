package com.waterx.safety.inspection;

import com.waterx.safety.auth.CurrentUser;
import com.waterx.safety.common.BusinessException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/safety")
public class InspectionController {
    private final JdbcClient jdbc;
    private final InspectionPlanService plans;
    private final SafetyWorkflowService flow;

    public InspectionController(JdbcClient jdbc, InspectionPlanService plans, SafetyWorkflowService flow) {
        this.jdbc = jdbc;
        this.plans = plans;
        this.flow = flow;
    }

    @GetMapping("/inspection/summary")
    @PreAuthorize("hasAuthority('inspection:read')")
    Summary summary(@AuthenticationPrincipal CurrentUser user, @RequestHeader("X-Site-Id") UUID siteId) {
        var tasks=flow.tasks(user,siteId);var hazards=flow.hazards(user,siteId);
        return new Summary(count(tasks,"status","PENDING","IN_PROGRESS","OVERDUE"),count(tasks,"status","COMPLETED"),
            hazards.size()-count(hazards,"status","CLOSED"),count(hazards,"status","REVIEW_PENDING"),
            (int)hazards.stream().filter(h->((Number)h.get("overdueDays")).intValue()>0).count());
    }
    private static int count(List<Map<String,Object>> rows,String field,String... values){
        var choices=java.util.Set.of(values);return (int)rows.stream().filter(r->choices.contains(java.util.Objects.toString(r.get(field),""))).count();
    }
    @GetMapping("/inspection/statistics")
    @PreAuthorize("hasAuthority('inspection:read')")
    Statistics statistics(@AuthenticationPrincipal CurrentUser user,@RequestHeader("X-Site-Id") UUID siteId) {
        var h=flow.hazards(user,siteId);
        return new Statistics(h.size(),count(h,"status","CLOSED"),count(h,"hazardLevel","GENERAL"),count(h,"hazardLevel","SERIOUS"),
            count(h,"hazardLevel","MAJOR"),count(h,"sourceType","INSPECTION"),count(h,"sourceType","EMPLOYEE_REPORT"),
            count(h,"escalationLevel","REMINDER"),count(h,"escalationLevel","DEPARTMENT"),count(h,"escalationLevel","PLANT"));
    }

    @GetMapping("/inspection/templates")
    @PreAuthorize("hasAuthority('inspection:read')")
    List<Map<String,Object>> templates(@AuthenticationPrincipal CurrentUser user, @RequestHeader("X-Site-Id") UUID siteId) {
        return flow.templates(user,siteId);
    }

    @GetMapping("/inspection/plans")
    @PreAuthorize("hasAuthority('inspection:read')")
    List<PlanView> inspectionPlans(@AuthenticationPrincipal CurrentUser user,@RequestHeader("X-Site-Id") UUID siteId) {
        flow.requireRead(user,siteId);
        return jdbc.sql("""
            select p.id,p.code,p.name,p.schedule_type,p.interval_value,p.next_run_date,p.due_hours,p.status,
                   t.name template_name,e.display_name assignee_name,p.last_generated_at,
                   (select max(v.operated_at) from inspection_plan_event v where v.tenant_id=p.tenant_id and v.plan_id=p.id) last_action_at,
                   (select count(*) from inspection_plan_event v where v.tenant_id=p.tenant_id and v.plan_id=p.id) change_count,
                   (select count(*) from inspection_task k where k.tenant_id=p.tenant_id and k.plan_id=p.id) generated_count
            from inspection_plan p join inspection_template t on t.tenant_id=p.tenant_id and t.id=p.template_id
            left join employee e on e.tenant_id=p.tenant_id and e.id=p.assignee_employee_id
            where p.tenant_id=:tenantId and p.site_id=:siteId and (:readAll or p.assignee_employee_id=:employee) order by p.status,p.next_run_date,p.code
            """).param("tenantId",user.tenantId()).param("siteId",siteId).param("readAll",flow.readAll(user,siteId)).param("employee",flow.employee(user))
                .query((rs,n)->new PlanView(rs.getObject("id",UUID.class),rs.getString("code"),rs.getString("name"),
                        rs.getString("template_name"),rs.getString("schedule_type"),rs.getInt("interval_value"),
                        rs.getObject("next_run_date",LocalDate.class),rs.getInt("due_hours"),rs.getString("assignee_name"),
                        rs.getString("status"),rs.getObject("last_generated_at",OffsetDateTime.class),rs.getInt("generated_count"),
                        rs.getObject("last_action_at",OffsetDateTime.class),rs.getInt("change_count"))).list();
    }

    @PostMapping("/inspection/plans")
    @PreAuthorize("hasAuthority('inspection:manage')")
    @Transactional
    IdView createPlan(@AuthenticationPrincipal CurrentUser user,@RequestHeader("X-Site-Id") UUID siteId,
                      @Valid @RequestBody PlanInput input) {
        flow.requireManager(user,siteId);
        flow.requireTemplate(user,siteId,input.templateId());
        flow.requireEmployee(user,siteId,input.assigneeEmployeeId());
        if(!java.util.Set.of("DAILY","WEEKLY","MONTHLY","ONCE").contains(input.scheduleType())||input.intervalValue()>365||input.dueHours()>8760)throw SafetyWorkflowService.bad("计划周期或时限无效");
        if(input.nextRunDate().isBefore(LocalDate.now()))throw SafetyWorkflowService.bad("新计划开始日期不能早于今天");
        UUID id=UUID.randomUUID();
        String code="PLAN-"+id.toString().substring(0,8).toUpperCase();
        jdbc.sql("""
            insert into inspection_plan(id,tenant_id,site_id,template_id,code,name,schedule_type,interval_value,next_run_date,due_hours,assignee_employee_id)
            values(:id,:tenantId,:siteId,:templateId,:code,:name,:scheduleType,:intervalValue,:nextRunDate,:dueHours,:assignee)
            """).param("id",id).param("tenantId",user.tenantId()).param("siteId",siteId).param("templateId",input.templateId())
                .param("code",code).param("name",input.name()).param("scheduleType",input.scheduleType())
                .param("intervalValue",input.intervalValue()).param("nextRunDate",input.nextRunDate()).param("dueHours",input.dueHours())
                .param("assignee",input.assigneeEmployeeId()).update();
        jdbc.sql("insert into inspection_plan_event(tenant_id,site_id,plan_id,action,reason,operated_by) values(:tenantId,:siteId,:planId,'CREATED','创建周期检查计划',:userId)")
                .param("tenantId",user.tenantId()).param("siteId",siteId).param("planId",id).param("userId",user.userId()).update();
        return new IdView(id);
    }

    @PostMapping("/inspection/plans/{planId}/status")
    @PreAuthorize("hasAuthority('inspection:manage')")
    @Transactional
    void changePlanStatus(@AuthenticationPrincipal CurrentUser user,@RequestHeader("X-Site-Id") UUID siteId,
                          @PathVariable UUID planId,@Valid @RequestBody PlanStatusInput input) {
        flow.requireManager(user,siteId);
        String target="PAUSE".equals(input.action())?"PAUSED":"RESUME".equals(input.action())?"ACTIVE":null;
        if(target==null) throw new BusinessException("PLAN_ACTION_INVALID","计划操作无效",HttpStatus.BAD_REQUEST);
        String required="PAUSED".equals(target)?"ACTIVE":"PAUSED";
        int changed=jdbc.sql("update inspection_plan set status=:target,next_run_date=case when :target='ACTIVE' then greatest(next_run_date,current_date) else next_run_date end,updated_at=now() where tenant_id=:tenantId and site_id=:siteId and id=:id and status=:required")
                .param("target",target).param("tenantId",user.tenantId()).param("siteId",siteId).param("id",planId).param("required",required).update();
        if(changed==0) throw new BusinessException("PLAN_STATE_INVALID","计划不存在或当前状态不能执行该操作",HttpStatus.CONFLICT);
        jdbc.sql("insert into inspection_plan_event(tenant_id,site_id,plan_id,action,reason,operated_by) values(:tenantId,:siteId,:planId,:action,:reason,:userId)")
                .param("tenantId",user.tenantId()).param("siteId",siteId).param("planId",planId)
                .param("action","PAUSED".equals(target)?"PAUSED":"RESUMED").param("reason",input.reason()).param("userId",user.userId()).update();
    }

    @PostMapping("/inspection/plans/generate")
    @PreAuthorize("hasAuthority('inspection:manage')")
    GenerateView generatePlans(@AuthenticationPrincipal CurrentUser user,@RequestHeader("X-Site-Id") UUID siteId,
                               @RequestParam(required=false) LocalDate throughDate) {
        flow.requireManager(user,siteId);
        return new GenerateView(plans.generateDuePlans(user.tenantId(),siteId,throughDate==null?LocalDate.now():throughDate));
    }

    @GetMapping("/inspection/templates/{templateId}/items")
    @PreAuthorize("hasAuthority('inspection:read')")
    List<Map<String,Object>> templateItems(@AuthenticationPrincipal CurrentUser user, @RequestHeader("X-Site-Id") UUID siteId,
                                         @PathVariable UUID templateId) {
        return flow.templateItems(user,siteId,templateId);
    }

    @GetMapping("/inspection/tasks")
    @PreAuthorize("hasAuthority('inspection:read')")
    List<Map<String,Object>> tasks(@AuthenticationPrincipal CurrentUser user, @RequestHeader("X-Site-Id") UUID siteId) {
        return flow.tasks(user,siteId);
    }

    @PostMapping("/inspection/tasks")
    @PreAuthorize("hasAuthority('inspection:manage')")
    @Transactional
    IdView createTask(@AuthenticationPrincipal CurrentUser user,@RequestHeader("X-Site-Id") UUID siteId,
                      @Valid @RequestBody TaskInput input) {
        flow.requireManager(user,siteId);
        flow.requireTemplate(user,siteId,input.templateId());
        flow.requireEmployee(user,siteId,input.assigneeEmployeeId());
        int templateExists=jdbc.sql("select count(*) from inspection_template where tenant_id=:tenantId and id=:id and status='ACTIVE' and (site_id is null or site_id=:siteId)")
                .param("tenantId",user.tenantId()).param("id",input.templateId()).param("siteId",siteId).query(Integer.class).single();
        if(templateExists==0) throw new BusinessException("TEMPLATE_NOT_FOUND","检查模板不存在",HttpStatus.NOT_FOUND);
        if(input.dueAt().isBefore(input.plannedStart().atStartOfDay().atOffset(java.time.ZoneOffset.ofHours(8))))throw SafetyWorkflowService.bad("截止时间不能早于计划日期");
        UUID id=UUID.randomUUID();
        String no="JC-"+LocalDate.now().toString().replace("-","")+"-"+id.toString().substring(0,5).toUpperCase();
        jdbc.sql("""
            insert into inspection_task(id,tenant_id,site_id,template_id,task_no,title,planned_start,due_at,status,assignee_employee_id)
            values(:id,:tenantId,:siteId,:templateId,:no,:title,:start,:dueAt,'PENDING',:assignee)
            """).param("id",id).param("tenantId",user.tenantId()).param("siteId",siteId).param("templateId",input.templateId())
                .param("no",no).param("title",input.title()).param("start",input.plannedStart()).param("dueAt",input.dueAt())
                .param("assignee",input.assigneeEmployeeId()).update();
        return new IdView(id);
    }

    @GetMapping("/inspection/tasks/{taskId}/items")
    @PreAuthorize("hasAuthority('inspection:read')")
    List<Map<String,Object>> taskItems(@AuthenticationPrincipal CurrentUser user,@RequestHeader("X-Site-Id") UUID siteId,
                                 @PathVariable UUID taskId) {
        return flow.taskItems(user,siteId,taskId);
    }

    @PostMapping("/inspection/tasks/{taskId}/complete")
    @PreAuthorize("hasAuthority('inspection:read')")
    @Transactional
    CompleteView completeTask(@AuthenticationPrincipal CurrentUser user,@RequestHeader("X-Site-Id") UUID siteId,
                              @PathVariable UUID taskId,@Valid @RequestBody CompleteTaskInput input) {
        return new CompleteView(flow.complete(user,siteId,taskId,new SafetyWorkflowService.Completion(input.items().stream().map(a->new SafetyWorkflowService.Answer(a.itemId(),a.result(),a.answer(),a.notApplicableReason(),a.problemDescription(),a.handlingMeasure(),a.linkedHazardId())).toList(),input.location(),input.participants(),input.signatureData())));
    }

    @GetMapping("/hazards")
    @PreAuthorize("hasAuthority('hazard:read')")
    List<Map<String,Object>> hazards(@AuthenticationPrincipal CurrentUser user, @RequestHeader("X-Site-Id") UUID siteId) {
        return flow.hazards(user,siteId);
    }

    @PostMapping("/hazards/{hazardId}/reminders")
    @PreAuthorize("hasAuthority('hazard:read')")
    void remindHazard(@AuthenticationPrincipal CurrentUser user,@RequestHeader("X-Site-Id") UUID siteId,
                      @PathVariable UUID hazardId,@Valid @RequestBody ReminderInput input) {
        flow.remind(user,siteId,hazardId,input.message());
    }

    @PostMapping("/hazards")
    @PreAuthorize("hasAuthority('hazard:read')")
    @Transactional
    Map<String,Object> reportHazard(@AuthenticationPrincipal CurrentUser user,@RequestHeader("X-Site-Id") UUID siteId,
                        @RequestBody SafetyWorkflowService.Report input) {
        return flow.report(user,siteId,input);
    }

    @PostMapping("/hazards/{hazardId}/rectification")
    @PreAuthorize("hasAuthority('hazard:read')")
    void submitRectification(@AuthenticationPrincipal CurrentUser user,@RequestHeader("X-Site-Id") UUID siteId,
                             @PathVariable UUID hazardId,@Valid @RequestBody RectificationInput input) {
        flow.rectify(user,siteId,hazardId,new SafetyWorkflowService.Action(input.revision(),input.completionNote(),true,input.signatureData()));
    }

    @PostMapping("/hazards/{hazardId}/review")
    @PreAuthorize("hasAuthority('hazard:read')")
    void review(@AuthenticationPrincipal CurrentUser user,@RequestHeader("X-Site-Id") UUID siteId,
                @PathVariable UUID hazardId,@Valid @RequestBody ReviewInput input) {
        flow.review(user,siteId,hazardId,new SafetyWorkflowService.Action(input.revision(),input.comment(),input.passed(),input.signatureData()));
    }

    public record Summary(int pendingTasks,int completedTasks,int openHazards,int pendingReview,int overdueHazards) {}
    public record Statistics(int totalHazards,int closedHazards,int generalHazards,int seriousHazards,int majorHazards,
                             int inspectionSource,int employeeSource,int reminderLevel,int departmentLevel,int plantLevel) {}
    public record PlanView(UUID id,String code,String name,String templateName,String scheduleType,int intervalValue,LocalDate nextRunDate,int dueHours,String assigneeName,String status,OffsetDateTime lastGeneratedAt,int generatedCount,OffsetDateTime lastActionAt,int changeCount) {}
    public record IdView(UUID id) {}
    public record TaskInput(@NotNull UUID templateId,@NotBlank String title,@NotNull LocalDate plannedStart,@NotNull OffsetDateTime dueAt,UUID assigneeEmployeeId) {}
    public record CompleteTaskInput(@NotNull List<@Valid ItemResultInput> items,String location,String participants,String signatureData) {}
    public record ItemResultInput(@NotNull UUID itemId,@NotBlank String result,String problemDescription,String handlingMeasure,String temporaryMeasure,String hazardLevel,LocalDate dueDate,String answer,String notApplicableReason,UUID linkedHazardId) {}
    public record CompleteView(int hazardsCreated) {}
    public record PlanInput(@NotNull UUID templateId,@NotBlank String name,@NotBlank String scheduleType,@NotNull @Positive Integer intervalValue,@NotNull LocalDate nextRunDate,@NotNull @Positive Integer dueHours,UUID assigneeEmployeeId) {}
    public record PlanStatusInput(@NotBlank String action,@NotBlank String reason) {}
    public record ReminderInput(@NotBlank String message) {}
    public record GenerateView(int generatedCount) {}
    public record RectificationInput(@NotBlank String completionNote,Integer revision,String signatureData) {}
    public record ReviewInput(boolean passed,@NotBlank String comment,Integer revision,String signatureData) {}
}
