package com.waterx.safety.inspection;

import com.waterx.safety.auth.CurrentUser;
import com.waterx.safety.common.BusinessException;
import com.waterx.safety.site.SiteAccessService;
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
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/safety")
public class InspectionController {
    private final JdbcClient jdbc;
    private final SiteAccessService sites;
    private final InspectionPlanService plans;
    private final OverdueService overdue;

    public InspectionController(JdbcClient jdbc, SiteAccessService sites, InspectionPlanService plans, OverdueService overdue) {
        this.jdbc = jdbc;
        this.sites = sites;
        this.plans = plans;
        this.overdue = overdue;
    }

    @GetMapping("/inspection/summary")
    @PreAuthorize("hasAuthority('inspection:read')")
    Summary summary(@AuthenticationPrincipal CurrentUser user, @RequestHeader("X-Site-Id") UUID siteId) {
        sites.requireSiteAccess(user, siteId);
        overdue.refresh();
        return jdbc.sql("""
            select
              (select count(*) from inspection_task where tenant_id=:tenantId and site_id=:siteId and status in ('PENDING','IN_PROGRESS','OVERDUE')) pending_tasks,
              (select count(*) from inspection_task where tenant_id=:tenantId and site_id=:siteId and status='COMPLETED') completed_tasks,
              (select count(*) from safety_hazard where tenant_id=:tenantId and site_id=:siteId and status not in ('CLOSED')) open_hazards,
              (select count(*) from safety_hazard where tenant_id=:tenantId and site_id=:siteId and status='REVIEW_PENDING') pending_review,
              (select count(*) from safety_hazard where tenant_id=:tenantId and site_id=:siteId and status='OVERDUE') overdue_hazards
            """).param("tenantId", user.tenantId()).param("siteId", siteId)
            .query((rs, n) -> new Summary(rs.getInt(1), rs.getInt(2), rs.getInt(3), rs.getInt(4), rs.getInt(5))).single();
    }

    @GetMapping("/inspection/statistics")
    @PreAuthorize("hasAuthority('inspection:read')")
    Statistics statistics(@AuthenticationPrincipal CurrentUser user,@RequestHeader("X-Site-Id") UUID siteId) {
        sites.requireSiteAccess(user,siteId); overdue.refresh();
        return jdbc.sql("""
            select
              (select count(*) from safety_hazard where tenant_id=:tenantId and site_id=:siteId) total_hazards,
              (select count(*) from safety_hazard where tenant_id=:tenantId and site_id=:siteId and status='CLOSED') closed_hazards,
              (select count(*) from safety_hazard where tenant_id=:tenantId and site_id=:siteId and hazard_level='GENERAL') general_hazards,
              (select count(*) from safety_hazard where tenant_id=:tenantId and site_id=:siteId and hazard_level='SERIOUS') serious_hazards,
              (select count(*) from safety_hazard where tenant_id=:tenantId and site_id=:siteId and hazard_level='MAJOR') major_hazards,
              (select count(*) from safety_hazard where tenant_id=:tenantId and site_id=:siteId and source_type='INSPECTION') inspection_source,
              (select count(*) from safety_hazard where tenant_id=:tenantId and site_id=:siteId and source_type='EMPLOYEE_REPORT') employee_source,
              (select count(*) from safety_hazard where tenant_id=:tenantId and site_id=:siteId and status='OVERDUE' and current_date-due_date between 1 and 3) reminder_level,
              (select count(*) from safety_hazard where tenant_id=:tenantId and site_id=:siteId and status='OVERDUE' and current_date-due_date between 4 and 7) department_level,
              (select count(*) from safety_hazard where tenant_id=:tenantId and site_id=:siteId and status='OVERDUE' and current_date-due_date>=8) plant_level
            """).param("tenantId",user.tenantId()).param("siteId",siteId)
                .query((rs,n)->new Statistics(rs.getInt("total_hazards"),rs.getInt("closed_hazards"),
                        rs.getInt("general_hazards"),rs.getInt("serious_hazards"),rs.getInt("major_hazards"),
                        rs.getInt("inspection_source"),rs.getInt("employee_source"),rs.getInt("reminder_level"),
                        rs.getInt("department_level"),rs.getInt("plant_level"))).single();
    }

    @GetMapping("/inspection/templates")
    @PreAuthorize("hasAuthority('inspection:read')")
    List<TemplateView> templates(@AuthenticationPrincipal CurrentUser user, @RequestHeader("X-Site-Id") UUID siteId) {
        sites.requireSiteAccess(user, siteId);
        return jdbc.sql("""
            select t.id,t.code,t.name,t.inspection_type,t.frequency,
                   (select count(*) from inspection_template_item i where i.tenant_id=t.tenant_id and i.template_id=t.id) item_count
            from inspection_template t where t.tenant_id=:tenantId and (t.site_id is null or t.site_id=:siteId) and t.status='ACTIVE'
            order by t.inspection_type,t.code
            """).param("tenantId", user.tenantId()).param("siteId", siteId)
            .query((rs,n)->new TemplateView(rs.getObject("id",UUID.class),rs.getString("code"),rs.getString("name"),
                    rs.getString("inspection_type"),rs.getString("frequency"),rs.getInt("item_count"))).list();
    }

    @GetMapping("/inspection/plans")
    @PreAuthorize("hasAuthority('inspection:read')")
    List<PlanView> inspectionPlans(@AuthenticationPrincipal CurrentUser user,@RequestHeader("X-Site-Id") UUID siteId) {
        sites.requireSiteAccess(user,siteId);
        return jdbc.sql("""
            select p.id,p.code,p.name,p.schedule_type,p.interval_value,p.next_run_date,p.due_hours,p.status,
                   t.name template_name,e.display_name assignee_name,p.last_generated_at,
                   (select max(v.operated_at) from inspection_plan_event v where v.tenant_id=p.tenant_id and v.plan_id=p.id) last_action_at,
                   (select count(*) from inspection_plan_event v where v.tenant_id=p.tenant_id and v.plan_id=p.id) change_count,
                   (select count(*) from inspection_task k where k.tenant_id=p.tenant_id and k.plan_id=p.id) generated_count
            from inspection_plan p join inspection_template t on t.tenant_id=p.tenant_id and t.id=p.template_id
            left join employee e on e.tenant_id=p.tenant_id and e.id=p.assignee_employee_id
            where p.tenant_id=:tenantId and p.site_id=:siteId order by p.status,p.next_run_date,p.code
            """).param("tenantId",user.tenantId()).param("siteId",siteId)
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
        sites.requireSiteAccess(user,siteId);
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
        sites.requireSiteAccess(user,siteId);
        String target="PAUSE".equals(input.action())?"PAUSED":"RESUME".equals(input.action())?"ACTIVE":null;
        if(target==null) throw new BusinessException("PLAN_ACTION_INVALID","计划操作无效",HttpStatus.BAD_REQUEST);
        String required="PAUSED".equals(target)?"ACTIVE":"PAUSED";
        int changed=jdbc.sql("update inspection_plan set status=:target,updated_at=now() where tenant_id=:tenantId and site_id=:siteId and id=:id and status=:required")
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
        sites.requireSiteAccess(user,siteId);
        return new GenerateView(plans.generateDuePlans(user.tenantId(),siteId,throughDate==null?LocalDate.now():throughDate));
    }

    @GetMapping("/inspection/templates/{templateId}/items")
    @PreAuthorize("hasAuthority('inspection:read')")
    List<TemplateItemView> templateItems(@AuthenticationPrincipal CurrentUser user, @RequestHeader("X-Site-Id") UUID siteId,
                                         @PathVariable UUID templateId) {
        sites.requireSiteAccess(user, siteId);
        return jdbc.sql("""
            select i.id,i.category,i.content,i.required,i.sort_order from inspection_template_item i
            join inspection_template t on t.tenant_id=i.tenant_id and t.id=i.template_id
            where i.tenant_id=:tenantId and i.template_id=:templateId and (t.site_id is null or t.site_id=:siteId)
            order by i.sort_order
            """).param("tenantId",user.tenantId()).param("templateId",templateId).param("siteId",siteId)
            .query((rs,n)->new TemplateItemView(rs.getObject("id",UUID.class),rs.getString("category"),rs.getString("content"),rs.getBoolean("required"),rs.getInt("sort_order"))).list();
    }

    @GetMapping("/inspection/tasks")
    @PreAuthorize("hasAuthority('inspection:read')")
    List<TaskView> tasks(@AuthenticationPrincipal CurrentUser user, @RequestHeader("X-Site-Id") UUID siteId) {
        sites.requireSiteAccess(user, siteId);
        return jdbc.sql("""
            select k.id,k.task_no,k.title,t.name template_name,t.inspection_type,k.planned_start,k.due_at,k.status,
                   e.display_name assignee_name,
                   (select count(*) from safety_hazard h where h.tenant_id=k.tenant_id and h.source_task_id=k.id) hazard_count
            from inspection_task k join inspection_template t on t.tenant_id=k.tenant_id and t.id=k.template_id
            left join employee e on e.tenant_id=k.tenant_id and e.id=k.assignee_employee_id
            where k.tenant_id=:tenantId and k.site_id=:siteId order by k.due_at desc
            """).param("tenantId",user.tenantId()).param("siteId",siteId)
            .query((rs,n)->new TaskView(rs.getObject("id",UUID.class),rs.getString("task_no"),rs.getString("title"),
                    rs.getString("template_name"),rs.getString("inspection_type"),rs.getObject("planned_start",LocalDate.class),
                    rs.getObject("due_at",OffsetDateTime.class),rs.getString("status"),rs.getString("assignee_name"),rs.getInt("hazard_count"))).list();
    }

    @PostMapping("/inspection/tasks")
    @PreAuthorize("hasAuthority('inspection:manage')")
    IdView createTask(@AuthenticationPrincipal CurrentUser user,@RequestHeader("X-Site-Id") UUID siteId,
                      @Valid @RequestBody TaskInput input) {
        sites.requireSiteAccess(user,siteId);
        int templateExists=jdbc.sql("select count(*) from inspection_template where tenant_id=:tenantId and id=:id and status='ACTIVE' and (site_id is null or site_id=:siteId)")
                .param("tenantId",user.tenantId()).param("id",input.templateId()).param("siteId",siteId).query(Integer.class).single();
        if(templateExists==0) throw new BusinessException("TEMPLATE_NOT_FOUND","检查模板不存在",HttpStatus.NOT_FOUND);
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
    List<TaskItemView> taskItems(@AuthenticationPrincipal CurrentUser user,@RequestHeader("X-Site-Id") UUID siteId,
                                 @PathVariable UUID taskId) {
        sites.requireSiteAccess(user,siteId);
        return jdbc.sql("""
            select i.id,i.category,i.content,i.required,i.sort_order,r.result,r.problem_description,r.handling_measure
            from inspection_task k join inspection_template_item i on i.tenant_id=k.tenant_id and i.template_id=k.template_id
            left join inspection_result r on r.tenant_id=k.tenant_id and r.task_id=k.id and r.template_item_id=i.id
            where k.tenant_id=:tenantId and k.site_id=:siteId and k.id=:taskId order by i.sort_order
            """).param("tenantId",user.tenantId()).param("siteId",siteId).param("taskId",taskId)
                .query((rs,n)->new TaskItemView(rs.getObject("id",UUID.class),rs.getString("category"),rs.getString("content"),
                        rs.getBoolean("required"),rs.getInt("sort_order"),rs.getString("result"),
                        rs.getString("problem_description"),rs.getString("handling_measure"))).list();
    }

    @PostMapping("/inspection/tasks/{taskId}/complete")
    @PreAuthorize("hasAuthority('inspection:manage')")
    @Transactional
    CompleteView completeTask(@AuthenticationPrincipal CurrentUser user,@RequestHeader("X-Site-Id") UUID siteId,
                              @PathVariable UUID taskId,@Valid @RequestBody CompleteTaskInput input) {
        sites.requireSiteAccess(user,siteId);
        UUID templateId=jdbc.sql("select template_id from inspection_task where tenant_id=:tenantId and site_id=:siteId and id=:taskId and status in ('PENDING','IN_PROGRESS','OVERDUE')")
                .param("tenantId",user.tenantId()).param("siteId",siteId).param("taskId",taskId).query(UUID.class).optional()
                .orElseThrow(()->new BusinessException("TASK_STATE_INVALID","检查任务不存在或已完成",HttpStatus.CONFLICT));
        int required=jdbc.sql("select count(*) from inspection_template_item where tenant_id=:tenantId and template_id=:templateId and required")
                .param("tenantId",user.tenantId()).param("templateId",templateId).query(Integer.class).single();
        long supplied=input.items().stream().map(ItemResultInput::itemId).distinct().count();
        if(supplied<required) throw new BusinessException("CHECK_ITEMS_INCOMPLETE","请完成全部必检项目",HttpStatus.BAD_REQUEST);
        int hazardsCreated=0;
        for(ItemResultInput result:input.items()) {
            ItemMeta item=jdbc.sql("select category,content from inspection_template_item where tenant_id=:tenantId and template_id=:templateId and id=:id")
                    .param("tenantId",user.tenantId()).param("templateId",templateId).param("id",result.itemId())
                    .query((rs,n)->new ItemMeta(rs.getString(1),rs.getString(2))).optional()
                    .orElseThrow(()->new BusinessException("CHECK_ITEM_INVALID","检查项不属于当前任务",HttpStatus.BAD_REQUEST));
            if("NON_COMPLIANT".equals(result.result()) && (result.problemDescription()==null || result.problemDescription().isBlank()))
                throw new BusinessException("PROBLEM_REQUIRED","不符合项必须填写存在问题",HttpStatus.BAD_REQUEST);
            jdbc.sql("""
                insert into inspection_result(tenant_id,site_id,task_id,template_item_id,result,problem_description,handling_measure)
                values(:tenantId,:siteId,:taskId,:itemId,:result,:problem,:measure)
                on conflict(tenant_id,task_id,template_item_id) do update set result=excluded.result,problem_description=excluded.problem_description,handling_measure=excluded.handling_measure,checked_at=now()
                """).param("tenantId",user.tenantId()).param("siteId",siteId).param("taskId",taskId).param("itemId",result.itemId())
                    .param("result",result.result()).param("problem",result.problemDescription()).param("measure",result.handlingMeasure()).update();
            if("NON_COMPLIANT".equals(result.result())) {
                UUID hazardId=UUID.randomUUID();
                String no="YH-"+LocalDate.now().toString().replace("-","")+"-"+hazardId.toString().substring(0,5).toUpperCase();
                jdbc.sql("""
                    insert into safety_hazard(id,tenant_id,site_id,hazard_no,source_type,source_task_id,location,name,category_major,category_minor,description,hazard_level,rectification_measure,temporary_measure,due_date,estimated_cost,status)
                    values(:id,:tenantId,:siteId,:no,'INSPECTION',:taskId,:location,:name,'安全检查类',:minor,:description,:level,:measure,:temporary,:dueDate,0,'RECTIFYING')
                    """).param("id",hazardId).param("tenantId",user.tenantId()).param("siteId",siteId).param("no",no).param("taskId",taskId)
                        .param("location",item.category()).param("name",item.content()).param("minor",item.category())
                        .param("description",result.problemDescription()).param("level",result.hazardLevel()==null?"GENERAL":result.hazardLevel())
                        .param("measure",result.handlingMeasure()==null||result.handlingMeasure().isBlank()?"限期完成整改并反馈":result.handlingMeasure())
                        .param("temporary",result.temporaryMeasure()).param("dueDate",result.dueDate()==null?LocalDate.now().plusDays(7):result.dueDate()).update();
                hazardsCreated++;
            }
        }
        jdbc.sql("update inspection_task set status='COMPLETED',completed_at=now() where tenant_id=:tenantId and site_id=:siteId and id=:taskId")
                .param("tenantId",user.tenantId()).param("siteId",siteId).param("taskId",taskId).update();
        return new CompleteView(hazardsCreated);
    }

    @GetMapping("/hazards")
    @PreAuthorize("hasAuthority('hazard:read')")
    List<HazardView> hazards(@AuthenticationPrincipal CurrentUser user, @RequestHeader("X-Site-Id") UUID siteId) {
        sites.requireSiteAccess(user, siteId);
        overdue.refresh();
        return jdbc.sql("""
            select h.id,h.hazard_no,h.source_type,h.location,h.name,h.category_major,h.category_minor,h.description,
                   h.hazard_level,h.rectification_measure,h.temporary_measure,h.due_date,h.estimated_cost,h.status,
                   o.name responsible_org,e.display_name responsible_person,h.discovered_at,h.completed_at,h.completion_note,
                   h.reviewed_at,h.review_result,h.review_comment,
                   case when h.status='OVERDUE' then current_date-h.due_date else 0 end overdue_days,
                   case when h.status<>'OVERDUE' then null when current_date-h.due_date<=3 then 'REMINDER' when current_date-h.due_date<=7 then 'DEPARTMENT' else 'PLANT' end escalation_level,
                   (select count(*) from hazard_reminder r where r.tenant_id=h.tenant_id and r.hazard_id=h.id) reminder_count,
                   (select max(r.reminded_at) from hazard_reminder r where r.tenant_id=h.tenant_id and r.hazard_id=h.id) last_reminded_at
            from safety_hazard h left join org_unit o on o.tenant_id=h.tenant_id and o.id=h.responsible_org_id
            left join employee e on e.tenant_id=h.tenant_id and e.id=h.responsible_employee_id
            where h.tenant_id=:tenantId and h.site_id=:siteId
            order by case h.status when 'OVERDUE' then 1 when 'REVIEW_PENDING' then 2 when 'RECTIFYING' then 3 when 'OPEN' then 4 else 5 end,h.due_date
            """).param("tenantId",user.tenantId()).param("siteId",siteId)
            .query((rs,n)->new HazardView(rs.getObject("id",UUID.class),rs.getString("hazard_no"),rs.getString("source_type"),
                    rs.getString("location"),rs.getString("name"),rs.getString("category_major"),rs.getString("category_minor"),
                    rs.getString("description"),rs.getString("hazard_level"),rs.getString("rectification_measure"),
                    rs.getString("temporary_measure"),rs.getObject("due_date",LocalDate.class),rs.getBigDecimal("estimated_cost"),
                    rs.getString("status"),rs.getString("responsible_org"),rs.getString("responsible_person"),
                    rs.getObject("discovered_at",OffsetDateTime.class),rs.getObject("completed_at",OffsetDateTime.class),
                    rs.getString("completion_note"),rs.getObject("reviewed_at",OffsetDateTime.class),rs.getString("review_result"),rs.getString("review_comment"),
                    rs.getInt("reminder_count"),rs.getObject("last_reminded_at",OffsetDateTime.class),rs.getInt("overdue_days"),rs.getString("escalation_level"))).list();
    }

    @PostMapping("/hazards/{hazardId}/reminders")
    @PreAuthorize("hasAuthority('hazard:manage')")
    void remindHazard(@AuthenticationPrincipal CurrentUser user,@RequestHeader("X-Site-Id") UUID siteId,
                      @PathVariable UUID hazardId,@Valid @RequestBody ReminderInput input) {
        sites.requireSiteAccess(user,siteId); overdue.refresh();
        int exists=jdbc.sql("select count(*) from safety_hazard where tenant_id=:tenantId and site_id=:siteId and id=:id and status not in ('CLOSED','REVIEW_PENDING')")
                .param("tenantId",user.tenantId()).param("siteId",siteId).param("id",hazardId).query(Integer.class).single();
        if(exists==0) throw new BusinessException("HAZARD_STATE_INVALID","仅未完成整改的隐患可以催办",HttpStatus.CONFLICT);
        jdbc.sql("insert into hazard_reminder(tenant_id,site_id,hazard_id,message,reminded_by) values(:tenantId,:siteId,:hazardId,:message,:userId)")
                .param("tenantId",user.tenantId()).param("siteId",siteId).param("hazardId",hazardId)
                .param("message",input.message()).param("userId",user.userId()).update();
    }

    @PostMapping("/hazards")
    @PreAuthorize("hasAuthority('hazard:manage')")
    @Transactional
    IdView reportHazard(@AuthenticationPrincipal CurrentUser user,@RequestHeader("X-Site-Id") UUID siteId,
                        @Valid @RequestBody HazardInput input) {
        sites.requireSiteAccess(user,siteId);
        UUID id=UUID.randomUUID();
        String no="YH-"+LocalDate.now().toString().replace("-","")+"-"+id.toString().substring(0,5).toUpperCase();
        jdbc.sql("""
            insert into safety_hazard(id,tenant_id,site_id,hazard_no,source_type,location,name,category_major,category_minor,
              description,hazard_level,rectification_measure,temporary_measure,due_date,estimated_cost,status)
            values(:id,:tenantId,:siteId,:no,'EMPLOYEE_REPORT',:location,:name,:major,:minor,:description,:level,:measure,:temporary,:dueDate,:cost,'RECTIFYING')
            """).param("id",id).param("tenantId",user.tenantId()).param("siteId",siteId).param("no",no)
            .param("location",input.location()).param("name",input.name()).param("major",input.categoryMajor())
            .param("minor",input.categoryMinor()).param("description",input.description()).param("level",input.hazardLevel())
            .param("measure",input.rectificationMeasure()).param("temporary",input.temporaryMeasure())
            .param("dueDate",input.dueDate()).param("cost",input.estimatedCost()).update();
        return new IdView(id);
    }

    @PostMapping("/hazards/{hazardId}/rectification")
    @PreAuthorize("hasAuthority('hazard:manage')")
    void submitRectification(@AuthenticationPrincipal CurrentUser user,@RequestHeader("X-Site-Id") UUID siteId,
                             @PathVariable UUID hazardId,@Valid @RequestBody RectificationInput input) {
        sites.requireSiteAccess(user,siteId);
        int changed=jdbc.sql("""
            update safety_hazard set status='REVIEW_PENDING',completion_note=:note,completed_at=now(),updated_at=now()
            where tenant_id=:tenantId and site_id=:siteId and id=:id and status in ('OPEN','RECTIFYING','OVERDUE')
            """).param("note",input.completionNote()).param("tenantId",user.tenantId()).param("siteId",siteId).param("id",hazardId).update();
        if(changed==0) throw new BusinessException("HAZARD_STATE_INVALID","隐患不存在或当前状态不能提交整改", HttpStatus.CONFLICT);
    }

    @PostMapping("/hazards/{hazardId}/review")
    @PreAuthorize("hasAuthority('hazard:manage')")
    void review(@AuthenticationPrincipal CurrentUser user,@RequestHeader("X-Site-Id") UUID siteId,
                @PathVariable UUID hazardId,@Valid @RequestBody ReviewInput input) {
        sites.requireSiteAccess(user,siteId);
        String status=input.passed()?"CLOSED":"RECTIFYING";
        int changed=jdbc.sql("""
            update safety_hazard set status=:status,reviewed_at=now(),review_result=:result,review_comment=:comment,updated_at=now()
            where tenant_id=:tenantId and site_id=:siteId and id=:id and status='REVIEW_PENDING'
            """).param("status",status).param("result",input.passed()?"PASSED":"RETURNED").param("comment",input.comment())
            .param("tenantId",user.tenantId()).param("siteId",siteId).param("id",hazardId).update();
        if(changed==0) throw new BusinessException("HAZARD_STATE_INVALID","隐患不存在或不在待验收状态",HttpStatus.CONFLICT);
    }

    public record Summary(int pendingTasks,int completedTasks,int openHazards,int pendingReview,int overdueHazards) {}
    public record Statistics(int totalHazards,int closedHazards,int generalHazards,int seriousHazards,int majorHazards,
                             int inspectionSource,int employeeSource,int reminderLevel,int departmentLevel,int plantLevel) {}
    public record TemplateView(UUID id,String code,String name,String inspectionType,String frequency,int itemCount) {}
    public record PlanView(UUID id,String code,String name,String templateName,String scheduleType,int intervalValue,LocalDate nextRunDate,int dueHours,String assigneeName,String status,OffsetDateTime lastGeneratedAt,int generatedCount,OffsetDateTime lastActionAt,int changeCount) {}
    public record TemplateItemView(UUID id,String category,String content,boolean required,int sortOrder) {}
    public record TaskView(UUID id,String taskNo,String title,String templateName,String inspectionType,LocalDate plannedStart,OffsetDateTime dueAt,String status,String assigneeName,int hazardCount) {}
    public record TaskItemView(UUID id,String category,String content,boolean required,int sortOrder,String result,String problemDescription,String handlingMeasure) {}
    public record HazardView(UUID id,String hazardNo,String sourceType,String location,String name,String categoryMajor,String categoryMinor,String description,String hazardLevel,String rectificationMeasure,String temporaryMeasure,LocalDate dueDate,BigDecimal estimatedCost,String status,String responsibleOrg,String responsiblePerson,OffsetDateTime discoveredAt,OffsetDateTime completedAt,String completionNote,OffsetDateTime reviewedAt,String reviewResult,String reviewComment,int reminderCount,OffsetDateTime lastRemindedAt,int overdueDays,String escalationLevel) {}
    public record IdView(UUID id) {}
    public record TaskInput(@NotNull UUID templateId,@NotBlank String title,@NotNull LocalDate plannedStart,@NotNull OffsetDateTime dueAt,UUID assigneeEmployeeId) {}
    public record CompleteTaskInput(@NotNull List<@Valid ItemResultInput> items) {}
    public record ItemResultInput(@NotNull UUID itemId,@NotBlank String result,String problemDescription,String handlingMeasure,String temporaryMeasure,String hazardLevel,LocalDate dueDate) {}
    public record CompleteView(int hazardsCreated) {}
    public record PlanInput(@NotNull UUID templateId,@NotBlank String name,@NotBlank String scheduleType,@NotNull @Positive Integer intervalValue,@NotNull LocalDate nextRunDate,@NotNull @Positive Integer dueHours,UUID assigneeEmployeeId) {}
    public record PlanStatusInput(@NotBlank String action,@NotBlank String reason) {}
    public record ReminderInput(@NotBlank String message) {}
    public record GenerateView(int generatedCount) {}
    private record ItemMeta(String category,String content) {}
    public record HazardInput(@NotBlank String location,@NotBlank String name,@NotBlank String categoryMajor,String categoryMinor,
                              @NotBlank String description,@NotBlank String hazardLevel,@NotBlank String rectificationMeasure,
                              String temporaryMeasure,@NotNull LocalDate dueDate,@NotNull @PositiveOrZero BigDecimal estimatedCost) {}
    public record RectificationInput(@NotBlank String completionNote) {}
    public record ReviewInput(boolean passed,@NotBlank String comment) {}
}
