package com.waterx.safety.inspection;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.waterx.safety.auth.CurrentUser;
import com.waterx.safety.common.BusinessException;
import com.waterx.safety.site.SiteAccessService;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import java.util.stream.Collectors;

/** Inspection and hazard workflow rules shared by desktop, mobile and legacy endpoints. */
@Service
public class SafetyWorkflowService {
    private final JdbcClient jdbc;
    private final SiteAccessService sites;
    private final ObjectMapper json;
    static final Set<String> CATEGORIES=Set.of("人的不安全行为","物的不安全状态","管理缺陷","环境因素");
    static final Set<String> LEVELS=Set.of("GENERAL","SERIOUS","LARGER","MAJOR");
    public SafetyWorkflowService(JdbcClient jdbc,SiteAccessService sites,ObjectMapper json){this.jdbc=jdbc;this.sites=sites;this.json=json;}
    JdbcClient.StatementSpec q(CurrentUser u,UUID site,String sql){return jdbc.sql(sql).param("tenant",u.tenantId()).param("site",site);}
    static BusinessException bad(String message){return new BusinessException("WORKFLOW_INVALID",message,HttpStatus.BAD_REQUEST);}
    static BusinessException forbidden(){return new BusinessException("WORKFLOW_FORBIDDEN","当前人员没有该步骤职责，不能代他人操作",HttpStatus.FORBIDDEN);}
    static void requireText(String text,String field){if(text==null||text.isBlank())throw bad("请填写"+field);}
    static String text(Map<String,Object> data,String key){return Objects.toString(data.get(key),"");}
    static UUID uuid(Map<String,Object> data,String key){Object v=data.get(key);return v==null?null:UUID.fromString(v.toString());}
    static int version(Map<String,Object> data){return ((Number)data.get("revision")).intValue();}
    UUID employee(CurrentUser u){return jdbc.sql("select e.id from user_account a join employee e on e.tenant_id=a.tenant_id and e.id=a.employee_id join tenant t on t.id=a.tenant_id where a.tenant_id=:tenant and a.id=:id and a.status='ACTIVE' and e.status='ACTIVE' and t.status='ACTIVE'").param("tenant",u.tenantId()).param("id",u.userId()).query(UUID.class).optional().orElseThrow(SafetyWorkflowService::forbidden);}
    // Re-read the same grant's role, site and validity on every call, never trust global token claims.
    boolean role(CurrentUser u,UUID site,List<String> roles){
        employee(u);
        return q(u,site,"""
            select count(*) from user_role_scope g join role r on r.tenant_id=g.tenant_id and r.id=g.role_id
            join site s on s.tenant_id=g.tenant_id and s.id=g.scope_id and s.status='ACTIVE'
            where g.tenant_id=:tenant and g.user_id=:user and g.scope_type='SITE' and g.scope_id=:site
            and r.status='ACTIVE' and r.code in (:roles) and g.valid_from<=clock_timestamp()
            and (g.valid_until is null or g.valid_until>clock_timestamp())
            """).param("user",u.userId()).param("roles",roles).query(Integer.class).single()>0;
    }
    boolean executor(CurrentUser u,UUID site){return role(u,site,List.of("EMPLOYEE","SAFETY_MANAGER"));}
    boolean readAll(CurrentUser u,UUID site){return role(u,site,List.of("SAFETY_MANAGER","PLANT_MANAGER"));}
    void requireRead(CurrentUser u,UUID site){sites.requireSiteAccess(u,site);if(!readAll(u,site)&&!executor(u,site))throw forbidden();}
    void requireExecute(CurrentUser u,UUID site){sites.requireSiteAccess(u,site);if(!executor(u,site))throw forbidden();}
    public boolean manager(CurrentUser u,UUID site){
        return role(u,site,List.of("SAFETY_MANAGER"));
    }
    public void requireManager(CurrentUser u,UUID site){sites.requireSiteAccess(u,site);if(!manager(u,site))throw forbidden();}
    public void requireEmployee(CurrentUser u,UUID site,UUID id){
        if(id==null||q(u,site,"select count(*) from employee where tenant_id=:tenant and site_id=:site and id=:id and status='ACTIVE'").param("id",id).query(Integer.class).single()==0)throw bad("请选择当前厂区的在岗人员");
        int eligible=q(u,site,"""
            select count(*) from user_account a join user_role_scope g on g.tenant_id=a.tenant_id and g.user_id=a.id
            join role r on r.tenant_id=g.tenant_id and r.id=g.role_id
            where a.tenant_id=:tenant and a.employee_id=:id and a.status='ACTIVE' and r.status='ACTIVE'
              and r.code in ('EMPLOYEE','SAFETY_MANAGER') and g.scope_type='SITE' and g.scope_id=:site
              and g.valid_from<=clock_timestamp() and (g.valid_until is null or g.valid_until>clock_timestamp())
            """).param("id",id).query(Integer.class).single();
        if(eligible==0)throw bad("责任人没有当前厂区有效的安全执行授权，请先维护授权或选择其他人员");
    }
    public void requireTemplate(CurrentUser u,UUID site,UUID id){
        if(id==null||q(u,site,"select count(*) from inspection_template where tenant_id=:tenant and (site_id is null or site_id=:site) and id=:id and status='ACTIVE'").param("id",id).query(Integer.class).single()==0)throw bad("请选择当前厂区有效模板");
    }
    public Map<String,Object> context(CurrentUser u,UUID site){
        requireRead(u,site);
        return Map.of("employeeId",employee(u),"userId",u.userId(),"displayName",u.displayName(),"canManage",manager(u,site),"canReport",executor(u,site));
    }
    public Map<String,Object> directory(CurrentUser u,UUID site){
        requireManager(u,site);
        return Map.of("employees",rows(q(u,site,"select e.id,e.employee_no,e.display_name,e.status,p.org_unit_id org_id,o.name organization from employee e join employee_position p on p.tenant_id=e.tenant_id and p.employee_id=e.id join org_unit o on o.tenant_id=p.tenant_id and o.id=p.org_unit_id where e.tenant_id=:tenant and e.site_id=:site and e.status='ACTIVE' and p.start_date<=current_date and (p.end_date is null or p.end_date>=current_date) order by e.employee_no")),
            "units",rows(q(u,site,"select id,parent_id,code,name,unit_type,sort_order from org_unit where tenant_id=:tenant and site_id=:site and status='ACTIVE' order by sort_order")),
            "risks",rows(q(u,site,"select id,hazard_factor name from hazard_source where tenant_id=:tenant and site_id=:site order by code")));
    }
    static Map<String,Object> camel(Map<String,Object> row){
        Map<String,Object> out=new LinkedHashMap<>();
        row.forEach((k,v)->{String[] words=k.split("_");StringBuilder name=new StringBuilder(words[0]);for(int i=1;i<words.length;i++)name.append(Character.toUpperCase(words[i].charAt(0))).append(words[i].substring(1));out.put(name.toString(),v);});return out;
    }
    List<Map<String,Object>> rows(JdbcClient.StatementSpec query){return query.query().listOfRows().stream().map(SafetyWorkflowService::camel).toList();}
    Map<String,Object> one(JdbcClient.StatementSpec query){var list=rows(query);if(list.isEmpty())throw new BusinessException("RECORD_NOT_FOUND","记录不存在或不属于当前厂区",HttpStatus.NOT_FOUND);return list.getFirst();}
    Map<String,Object> hazard(CurrentUser u,UUID site,UUID id,boolean lock){return one(q(u,site,"select * from safety_hazard where tenant_id=:tenant and site_id=:site and id=:id"+(lock?" for update":"")).param("id",id));}
    public void requireHazardRead(CurrentUser u,UUID site,UUID id){
        requireRead(u,site);var h=hazard(u,site,id,false);
        if(!readAll(u,site)&&!Objects.equals(uuid(h,"reportedBy"),u.userId())&&!Objects.equals(uuid(h,"responsibleEmployeeId"),employee(u)))throw forbidden();
    }
    public List<Map<String,Object>> hazards(CurrentUser u,UUID site){
        requireRead(u,site);
        var list=rows(q(u,site,"""
            select h.*,o.name responsible_org,e.display_name responsible_person,r.hazard_factor risk_name,
              case when h.status<>'CLOSED' and h.due_date<current_date then current_date-h.due_date else 0 end overdue_days,
              (select count(*) from hazard_reminder m where m.tenant_id=h.tenant_id and m.hazard_id=h.id) reminder_count,
              (select max(reminded_at) from hazard_reminder m where m.tenant_id=h.tenant_id and m.hazard_id=h.id) last_reminded_at
            from safety_hazard h left join org_unit o on o.tenant_id=h.tenant_id and o.id=h.responsible_org_id
            left join employee e on e.tenant_id=h.tenant_id and e.id=h.responsible_employee_id
            left join hazard_source r on r.tenant_id=h.tenant_id and r.id=h.risk_hazard_id
            where h.tenant_id=:tenant and h.site_id=:site
            order by case when h.status<>'CLOSED' and h.due_date<current_date then 0 when h.status='PENDING_ACCEPTANCE' then 1 when h.status='REVIEW_PENDING' then 2 else 3 end,h.discovered_at desc
            """));
        UUID me=employee(u);boolean manage=manager(u,site),readAll=readAll(u,site),execute=executor(u,site);
        return list.stream().filter(h->readAll||Objects.equals(uuid(h,"reportedBy"),u.userId())||Objects.equals(uuid(h,"responsibleEmployeeId"),me)).peek(h->{
            String st=text(h,"status");boolean own=Objects.equals(uuid(h,"responsibleEmployeeId"),me);
            h.put("canAssign",manage&&!Set.of("CLOSED","REVIEW_PENDING").contains(st));
            h.put("canReceive",execute&&own&&st.equals("ASSIGNED"));h.put("canRectify",execute&&own&&st.equals("RECTIFYING"));
            h.put("canReview",manage&&st.equals("REVIEW_PENDING")&&!own&&!Objects.equals(uuid(h,"rectificationSubmittedBy"),u.userId()));
            int days=((Number)h.get("overdueDays")).intValue();h.put("escalationLevel",days==0?null:days<=3?"REMINDER":days<=7?"DEPARTMENT":"PLANT");
        }).toList();
    }
    public Map<String,Object> detail(CurrentUser u,UUID site,UUID id){
        requireHazardRead(u,site,id);
        Map<String,Object> out=new LinkedHashMap<>();out.put("hazard",hazards(u,site).stream().filter(h->uuid(h,"id").equals(id)).findFirst().orElseThrow());
        var events=rows(q(u,site,"select id,action,actor_name,note,revision,occurred_at,snapshot::text snapshot,evidence_ids::text evidence_ids from safety_hazard_event where tenant_id=:tenant and site_id=:site and hazard_id=:id order by occurred_at,id").param("id",id));
        events.forEach(e->{try{e.put("snapshot",json.readValue(text(e,"snapshot"),new TypeReference<Map<String,Object>>(){}));e.put("evidenceIds",json.readValue(text(e,"evidenceIds"),List.class));}catch(Exception ex){throw new IllegalStateException(ex);}});
        out.put("events",events);out.put("origins",rows(q(u,site,"select o.*,t.task_no from safety_hazard_origin o join inspection_task t on t.tenant_id=o.tenant_id and t.id=o.task_id where o.tenant_id=:tenant and o.site_id=:site and o.hazard_id=:id order by o.discovered_at").param("id",id)));return out;
    }
    void event(CurrentUser u,UUID site,UUID id,String action,String note){
        q(u,site,"""
            insert into safety_hazard_event(tenant_id,site_id,hazard_id,action,actor_user_id,actor_name,note,revision,snapshot,evidence_ids)
            select :tenant,:site,h.id,:action,:actor,:name,:note,h.revision,to_jsonb(h),
              coalesce((select jsonb_agg(a.id order by a.uploaded_at) from safety_attachment a where a.tenant_id=:tenant and a.site_id=:site and a.object_id=h.id),'[]'::jsonb)
            from safety_hazard h where h.tenant_id=:tenant and h.site_id=:site and h.id=:id
            """).param("id",id).param("action",action).param("actor",u.userId()).param("name",u.displayName()).param("note",note).update();
    }
    @Transactional
    public Map<String,Object> report(CurrentUser u,UUID site,Report input){
        requireExecute(u,site);requireText(input.location(),"位置");requireText(input.description(),"现场现象");
        if(input.location().length()>200||input.description().length()>20000)throw bad("位置或现象内容过长");
        if(input.discoveredAt()!=null&&input.discoveredAt().isAfter(OffsetDateTime.now().plusMinutes(5)))throw bad("发现时间不能晚于当前时间");
        UUID id=UUID.randomUUID(),key=input.requestKey()==null?UUID.randomUUID():input.requestKey();
        String title=input.name()==null||input.name().isBlank()?input.description().substring(0,Math.min(80,input.description().length())):input.name();
        if(title.length()>240)throw bad("问题名称过长");
        q(u,site,"""
            insert into safety_hazard(id,tenant_id,site_id,hazard_no,source_type,location,name,description,temporary_measure,status,reported_by,request_key,discovered_at)
            values(:id,:tenant,:site,:no,'EMPLOYEE_REPORT',:location,:name,:description,:temporary,'PENDING_ACCEPTANCE',:actor,:key,coalesce(:at,now()))
            on conflict(tenant_id,site_id,reported_by,request_key) where request_key is not null do nothing
            """).param("id",id).param("no","YH-"+LocalDate.now().toString().replace("-","")+"-"+id.toString().substring(0,8).toUpperCase()).param("location",input.location()).param("name",title).param("description",input.description()).param("temporary",input.temporaryMeasure()).param("actor",u.userId()).param("key",key).param("at",input.discoveredAt()).update();
        var h=one(q(u,site,"select id,description,location from safety_hazard where tenant_id=:tenant and site_id=:site and reported_by=:actor and request_key=:key").param("actor",u.userId()).param("key",key));
        if(!text(h,"description").equals(input.description())||!text(h,"location").equals(input.location()))throw new BusinessException("REPORT_RETRY_CONFLICT","此上报已保存；请打开原记录，不要用同一提交标识创建不同内容",HttpStatus.CONFLICT);
        if(uuid(h,"id").equals(id))event(u,site,id,"REPORTED","发现者报告现场事实，等待专业受理");
        return Map.of("id",h.get("id"));
    }
    @Transactional
    public void assign(CurrentUser u,UUID site,UUID id,Assignment input){
        requireManager(u,site);var h=hazard(u,site,id,true);checkVersion(h,input.revision());
        if(Set.of("CLOSED","REVIEW_PENDING").contains(text(h,"status")))throw bad("已关闭或待验收的隐患不能直接重新派发");
        if(!CATEGORIES.contains(Objects.toString(input.categoryMajor(),""))||!LEVELS.contains(Objects.toString(input.hazardLevel(),"")))throw bad("请选择专家分类与企业内部等级");
        requireText(input.rectificationMeasure(),"整改要求");requireText(input.temporaryMeasure(),"临时措施或不需要的理由");requireText(input.note(),"受理／重新派发意见");
        if(input.dueDate()==null||input.dueDate().isBefore(LocalDate.now()))throw bad("请设置今天或之后的整改期限");
        if(input.estimatedCost()!=null&&input.estimatedCost().signum()<0)throw bad("预计费用不能为负；未知请留空");
        requireEmployee(u,site,input.responsibleEmployeeId());
        if(input.responsibleOrgId()==null||q(u,site,"select count(*) from employee_position p join org_unit o on o.tenant_id=p.tenant_id and o.id=p.org_unit_id where p.tenant_id=:tenant and o.site_id=:site and o.id=:org and p.employee_id=:employee and p.start_date<=current_date and (p.end_date is null or p.end_date>=current_date)").param("org",input.responsibleOrgId()).param("employee",input.responsibleEmployeeId()).query(Integer.class).single()==0)throw bad("责任人须属于所选责任部门／班组");
        String legal=input.legalMajorStatus()==null?"UNDETERMINED":input.legalMajorStatus();
        if(!Set.of("UNDETERMINED","YES","NO").contains(legal))throw bad("法定重大隐患认定状态无效");
        if(!legal.equals("UNDETERMINED"))requireText(input.legalMajorBasis(),"法定重大隐患判定依据和结论说明");
        if(input.riskHazardId()!=null&&q(u,site,"select count(*) from hazard_source where tenant_id=:tenant and site_id=:site and id=:risk").param("risk",input.riskHazardId()).query(Integer.class).single()==0)throw bad("关联风险不属于当前厂区");
        q(u,site,"""
            update safety_hazard set category_major=:category,hazard_level=:level,rectification_measure=:measure,temporary_measure=:temporary,
              due_date=:due,estimated_cost=:cost,responsible_org_id=:org,responsible_employee_id=:employee,legal_major_status=:legal,
              legal_major_basis=:basis,risk_hazard_id=:risk,status='ASSIGNED',received_at=null,revision=revision+1,updated_at=now()
            where tenant_id=:tenant and site_id=:site and id=:id
            """).param("id",id).param("category",input.categoryMajor()).param("level",input.hazardLevel()).param("measure",input.rectificationMeasure()).param("temporary",input.temporaryMeasure()).param("due",input.dueDate()).param("cost",input.estimatedCost()).param("org",input.responsibleOrgId()).param("employee",input.responsibleEmployeeId()).param("legal",legal).param("basis",input.legalMajorBasis()).param("risk",input.riskHazardId()).update();
        event(u,site,id,"ASSIGNED",input.note());
    }
    static void checkVersion(Map<String,Object> h,Integer expected){if(expected==null||version(h)!=expected)throw new BusinessException("RECORD_CHANGED","记录已变化，请刷新后确认再操作",HttpStatus.CONFLICT);}
    static void signature(String value){
        if(value==null||!value.startsWith("data:image/png;base64,")||value.length()<150||value.length()>250000)throw bad("请由本人手写确认；需要原件的表单仍须留存原件");
        try{byte[] bytes=Base64.getDecoder().decode(value.substring(22));if(bytes.length<8||bytes[0]!=(byte)137||bytes[1]!=80||bytes[2]!=78||bytes[3]!=71)throw bad("签字图片无效");}catch(IllegalArgumentException e){throw bad("签字图片无效");}
    }
    @Transactional
    public void receive(CurrentUser u,UUID site,UUID id,Action input){
        requireExecute(u,site);var h=hazard(u,site,id,true);checkVersion(h,input.revision());
        if(!Objects.equals(employee(u),uuid(h,"responsibleEmployeeId")))throw forbidden();
        if(!text(h,"status").equals("ASSIGNED"))throw bad("当前不是待接收状态");
        requireText(input.note(),"接收或退回说明");
        String target=Boolean.FALSE.equals(input.accepted())?"PENDING_ACCEPTANCE":"RECTIFYING";
        q(u,site,"update safety_hazard set status=:state,received_at=case when :state='RECTIFYING' then now() else null end,revision=revision+1,updated_at=now() where tenant_id=:tenant and site_id=:site and id=:id").param("state",target).param("id",id).update();event(u,site,id,target.equals("RECTIFYING")?"RECEIVED":"ASSIGNMENT_RETURNED",input.note());
    }
    @Transactional
    public void rectify(CurrentUser u,UUID site,UUID id,Action input){
        requireExecute(u,site);var h=hazard(u,site,id,true);checkVersion(h,input.revision());
        if(!Objects.equals(employee(u),uuid(h,"responsibleEmployeeId")))throw forbidden();
        if(!text(h,"status").equals("RECTIFYING"))throw bad("接收责任后才可提交整改");
        requireText(input.note(),"整改完成情况");signature(input.signatureData());
        int proof=q(u,site,"""
            select count(*) from safety_attachment a where a.tenant_id=:tenant and a.site_id=:site and a.object_id=:id and a.business_stage='RECTIFICATION'
             and a.uploaded_at>coalesce((select max(occurred_at) from safety_hazard_event e where e.tenant_id=:tenant and e.hazard_id=:id and e.action in ('ASSIGNED','REVIEW_RETURNED')), '-infinity'::timestamptz)
            """).param("id",id).query(Integer.class).single();
        if(proof==0)throw bad("请上传本轮整改照片或凭证后再提交");
        q(u,site,"update safety_hazard set status='REVIEW_PENDING',completion_note=:note,completed_at=now(),rectification_submitted_by=:actor,rectification_signature=:sign,revision=revision+1,updated_at=now() where tenant_id=:tenant and site_id=:site and id=:id").param("note",input.note()).param("actor",u.userId()).param("sign",input.signatureData()).param("id",id).update();event(u,site,id,"RECTIFICATION_SUBMITTED",input.note());
    }
    @Transactional
    public void review(CurrentUser u,UUID site,UUID id,Action input){
        requireManager(u,site);var h=hazard(u,site,id,true);checkVersion(h,input.revision());
        if(Objects.equals(employee(u),uuid(h,"responsibleEmployeeId"))||Objects.equals(u.userId(),uuid(h,"rectificationSubmittedBy")))throw forbidden();
        if(!text(h,"status").equals("REVIEW_PENDING"))throw bad("只有待验收记录可复查");
        requireText(input.note(),"复查意见");signature(input.signatureData());if(input.accepted()==null)throw bad("请选择通过或退回");
        q(u,site,"update safety_hazard set status=:state,review_result=:result,review_comment=:note,reviewed_at=now(),reviewed_by=:actor,review_signature=:sign,revision=revision+1,updated_at=now() where tenant_id=:tenant and site_id=:site and id=:id").param("state",input.accepted()?"CLOSED":"RECTIFYING").param("result",input.accepted()?"PASSED":"RETURNED").param("note",input.note()).param("actor",u.userId()).param("sign",input.signatureData()).param("id",id).update();event(u,site,id,input.accepted()?"CLOSED":"REVIEW_RETURNED",input.note());
    }
    @Transactional
    public void remind(CurrentUser u,UUID site,UUID id,String message){
        requireManager(u,site);var h=hazard(u,site,id,true);requireText(message,"催办要求");
        if(text(h,"status").equals("CLOSED")||h.get("responsibleEmployeeId")==null)throw bad("请先派发责任；已关闭记录不再催办");
        q(u,site,"insert into hazard_reminder(tenant_id,site_id,hazard_id,message,reminded_by) values(:tenant,:site,:id,:message,:actor)").param("id",id).param("message",message).param("actor",u.userId()).update();event(u,site,id,"REMINDED",message);
    }
    public void checkAttachment(CurrentUser u,UUID site,UUID id,String stage){
        requireExecute(u,site);
        var h=hazard(u,site,id,true);String status=text(h,"status");
        if(status.equals("CLOSED"))throw bad("归档记录不能追加或覆盖附件");
        boolean owner=Objects.equals(employee(u),uuid(h,"responsibleEmployeeId"));
        boolean allowed=switch(stage){case "DISCOVERY"->manager(u,site)||Objects.equals(uuid(h,"reportedBy"),u.userId());case "RECTIFICATION"->owner&&status.equals("RECTIFYING");case "REVIEW"->manager(u,site)&&!owner&&status.equals("REVIEW_PENDING");default->false;};
        if(!allowed)throw forbidden();
    }
    public List<Map<String,Object>> tasks(CurrentUser u,UUID site){
        requireRead(u,site);UUID me=employee(u);boolean manage=readAll(u,site),execute=executor(u,site);
        return rows(q(u,site,"""
            select k.*,t.inspection_type,e.display_name assignee_name,
             (select count(*) from safety_hazard_origin o where o.tenant_id=k.tenant_id and o.task_id=k.id) hazard_count
            from inspection_task k join inspection_template t on t.tenant_id=k.tenant_id and t.id=k.template_id
            left join employee e on e.tenant_id=k.tenant_id and e.id=k.assignee_employee_id
            where k.tenant_id=:tenant and k.site_id=:site order by k.planned_start desc,k.created_at desc
            """)).stream().filter(t->manage||Objects.equals(uuid(t,"assigneeEmployeeId"),me)).peek(t->t.put("canExecute",execute&&Objects.equals(uuid(t,"assigneeEmployeeId"),me)&&Set.of("PENDING","IN_PROGRESS","OVERDUE").contains(text(t,"status")))).toList();
    }
    public List<Map<String,Object>> taskItems(CurrentUser u,UUID site,UUID id){
        requireRead(u,site);var t=one(q(u,site,"select assignee_employee_id from inspection_task where tenant_id=:tenant and site_id=:site and id=:id").param("id",id));
        if(!readAll(u,site)&&!Objects.equals(uuid(t,"assigneeEmployeeId"),employee(u)))throw forbidden();
        return rows(q(u,site,"""
            select i.item_id id,i.category,i.content,i.required,i.sort_order,i.question_type,i.condition_item_id,i.source_ref,
              r.result,r.answer,r.not_applicable_reason,r.problem_description,r.handling_measure,r.linked_hazard_id
            from inspection_task_item i left join inspection_result r on r.tenant_id=i.tenant_id and r.task_id=i.task_id and r.template_item_id=i.item_id
            where i.tenant_id=:tenant and i.site_id=:site and i.task_id=:id order by i.sort_order
            """).param("id",id));
    }
    @Transactional
    public int complete(CurrentUser u,UUID site,UUID id,Completion input){
        requireExecute(u,site);var t=one(q(u,site,"select * from inspection_task where tenant_id=:tenant and site_id=:site and id=:id for update").param("id",id));
        if(!Objects.equals(employee(u),uuid(t,"assigneeEmployeeId")))throw forbidden();
        if(!Set.of("PENDING","IN_PROGRESS","OVERDUE").contains(text(t,"status")))throw new BusinessException("TASK_STATE_INVALID","任务已完成或已取消，不能重复提交",HttpStatus.CONFLICT);
        requireText(input.location(),"实际检查部位");requireText(input.participants(),"组织人及参加人员");signature(input.signatureData());
        if(input.items()==null)throw bad("请完成检查记录");
        var definitions=taskItems(u,site,id);Map<UUID,Answer> answers=new HashMap<>();
        for(Answer a:input.items()){if(a.itemId()==null||answers.put(a.itemId(),a)!=null)throw bad("检查项重复或无效");}
        if(answers.size()!=definitions.size()||!answers.keySet().equals(definitions.stream().map(d->uuid(d,"id")).collect(Collectors.toSet())))throw bad("请逐项完成当次模板，不能遗漏或混入其他检查项");
        int count=0;
        for(var d:definitions){
            Answer a=answers.get(uuid(d,"id"));String kind=text(d,"questionType"),answer=a.answer(),result=a.result(),reason=a.notApplicableReason();
            UUID parent=uuid(d,"conditionItemId");
            if(parent!=null&&"NO".equals(answers.get(parent).answer())){result="NOT_APPLICABLE";reason="条件项确认不涉及；"+Objects.toString(reason,"");}
            else if("NOT_APPLICABLE".equals(result)){requireText(reason,"不适用理由");}
            else if(kind.equals("CONDITION")||kind.equals("OBSERVATION")){
                if(!Set.of("YES","NO").contains(Objects.toString(answer,"")))throw bad("条件／发现问题项请选择是或否");
                result=kind.equals("CONDITION")?"RECORDED":answer.equals("YES")?"NON_COMPLIANT":"COMPLIANT";
            }else if(kind.equals("TEXT")||kind.equals("NUMBER")){
                requireText(answer,"检查记录");if(kind.equals("NUMBER")){try{new BigDecimal(answer);}catch(NumberFormatException e){throw bad("数值检查项请输入有效数字");}}
                result=a.problemDescription()!=null&&!a.problemDescription().isBlank()?"NON_COMPLIANT":"RECORDED";
            }else if(!Set.of("COMPLIANT","NON_COMPLIANT").contains(Objects.toString(result,"")))throw bad("合规检查项请选择检查结论");
            UUID hazardId=null;
            if(result.equals("NON_COMPLIANT")){
                requireText(a.problemDescription(),"存在问题");hazardId=a.linkedHazardId();
                if(hazardId!=null){requireHazardRead(u,site,hazardId);var linked=hazard(u,site,hazardId,true);if(text(linked,"status").equals("CLOSED"))throw bad("已关闭隐患不能继续合并；请形成新记录");}
                else{
                    var created=report(u,site,new Report(UUID.randomUUID(),input.location(),null,a.problemDescription(),a.handlingMeasure(),OffsetDateTime.now()));hazardId=uuid(created,"id");
                    q(u,site,"update safety_hazard set source_type='INSPECTION',source_task_id=:task where tenant_id=:tenant and site_id=:site and id=:id").param("task",id).param("id",hazardId).update();count++;
                }
                q(u,site,"insert into safety_hazard_origin(tenant_id,site_id,hazard_id,task_id,item_id,description) values(:tenant,:site,:hazard,:task,:item,:description)").param("hazard",hazardId).param("task",id).param("item",a.itemId()).param("description",a.problemDescription()).update();event(u,site,hazardId,"INSPECTION_LINKED",a.problemDescription());
            }
            q(u,site,"""
                insert into inspection_result(tenant_id,site_id,task_id,template_item_id,result,answer,not_applicable_reason,problem_description,handling_measure,linked_hazard_id)
                values(:tenant,:site,:task,:item,:result,:answer,:reason,:problem,:measure,:hazard)
                on conflict(tenant_id,task_id,template_item_id) do update set result=excluded.result,answer=excluded.answer,not_applicable_reason=excluded.not_applicable_reason,problem_description=excluded.problem_description,handling_measure=excluded.handling_measure,linked_hazard_id=excluded.linked_hazard_id,checked_at=now()
                """).param("task",id).param("item",a.itemId()).param("result",result).param("answer",result.equals("NOT_APPLICABLE")?null:answer).param("reason",result.equals("NOT_APPLICABLE")?reason:null).param("problem",result.equals("NON_COMPLIANT")?a.problemDescription():null).param("measure",result.equals("NON_COMPLIANT")?a.handlingMeasure():null).param("hazard",hazardId).update();
        }
        q(u,site,"update inspection_task set status='COMPLETED',completed_at=now(),completed_by=:actor,inspection_location=:location,participants=:participants,signature_data=:sign where tenant_id=:tenant and site_id=:site and id=:id").param("actor",u.userId()).param("location",input.location()).param("participants",input.participants()).param("sign",input.signatureData()).param("id",id).update();return count;
    }
    public List<Map<String,Object>> templates(CurrentUser u,UUID site){
        requireRead(u,site);return rows(q(u,site,"""
            select distinct on (t.family_code) t.*,(select count(*) from inspection_template_item i where i.tenant_id=t.tenant_id and i.template_id=t.id) item_count
            from inspection_template t where t.tenant_id=:tenant and (t.site_id is null or t.site_id=:site) and t.status='ACTIVE'
            order by t.family_code,t.site_id nulls last,t.version desc
            """));
    }
    public List<Map<String,Object>> templateItems(CurrentUser u,UUID site,UUID id){
        requireRead(u,site);requireTemplate(u,site,id);return rows(q(u,site,"select * from inspection_template_item where tenant_id=:tenant and template_id=:id order by sort_order").param("id",id));
    }
    @Transactional
    public Map<String,Object> reviseTemplate(CurrentUser u,UUID site,UUID id,TemplateRevision input){
        requireManager(u,site);requireTemplate(u,site,id);var old=one(q(u,site,"select * from inspection_template where tenant_id=:tenant and id=:id for update").param("id",id));
        requireText(input.name(),"模板名称");requireText(input.reason(),"修订原因及项目适用说明");
        if(input.items()==null||input.items().isEmpty())throw bad("模板至少保留一项检查内容");
        UUID newId=UUID.randomUUID();int v=((Number)old.get("version")).intValue()+1;
        if(!Objects.equals(input.version(),old.get("version")))throw new BusinessException("TEMPLATE_CHANGED","模板版本已变化，请刷新",HttpStatus.CONFLICT);
        int newer=q(u,site,"select count(*) from inspection_template where tenant_id=:tenant and site_id=:site and family_code=:family and status='ACTIVE' and version>:v").param("family",old.get("familyCode")).param("v",v-1).query(Integer.class).single();if(newer>0)throw new BusinessException("TEMPLATE_CHANGED","本厂已发布新版本，请刷新",HttpStatus.CONFLICT);
        q(u,site,"insert into inspection_template(id,tenant_id,site_id,code,family_code,name,inspection_type,frequency,version,source_name,instructions) values(:id,:tenant,:site,:code,:family,:name,:type,:freq,:v,:source,:instructions)").param("id",newId).param("code",old.get("familyCode")+"-V"+v+"-"+newId.toString().substring(0,5)).param("family",old.get("familyCode")).param("name",input.name()).param("type",old.get("inspectionType")).param("freq",old.get("frequency")).param("v",v).param("source",old.get("sourceName")).param("instructions",input.reason()).update();
        List<UUID> ids=new ArrayList<>();for(int i=0;i<input.items().size();i++)ids.add(UUID.randomUUID());
        for(int i=0;i<input.items().size();i++){
            var item=input.items().get(i);requireText(item.category(),"检查分类");requireText(item.content(),"检查内容");
            if(!Set.of("COMPLIANCE","CONDITION","OBSERVATION","TEXT","NUMBER").contains(Objects.toString(item.questionType(),"")))throw bad("检查题型无效");
            UUID parent=null;if(item.conditionIndex()!=null){int index=item.conditionIndex();if(index<0||index>=i||!input.items().get(index).questionType().equals("CONDITION"))throw bad("条件关联必须指向前面的条件题");parent=ids.get(index);}
            q(u,site,"insert into inspection_template_item(id,tenant_id,template_id,category,content,required,sort_order,question_type,condition_item_id,source_ref) values(:id,:tenant,:tpl,:category,:content,true,:sort,:type,:parent,:source)").param("id",ids.get(i)).param("tpl",newId).param("category",item.category()).param("content",item.content()).param("sort",i+1).param("type",item.questionType()).param("parent",parent).param("source",item.sourceRef()).update();
        }
        q(u,site,"update inspection_template set status='ARCHIVED' where tenant_id=:tenant and site_id=:site and family_code=:family and id<>:id and status='ACTIVE'").param("family",old.get("familyCode")).param("id",newId).update();
        q(u,site,"update inspection_plan set template_id=:new where tenant_id=:tenant and site_id=:site and template_id in (select id from inspection_template where tenant_id=:tenant and family_code=:family) and status in ('ACTIVE','PAUSED')").param("new",newId).param("family",old.get("familyCode")).update();
        q(u,site,"insert into audit_log(tenant_id,site_id,actor_user_id,action,object_type,object_id,detail) values(:tenant,:site,:actor,'INSPECTION_TEMPLATE_REVISED','INSPECTION_TEMPLATE',:id,jsonb_build_object('previousId',cast(:old as text),'reason',cast(:reason as text),'version',:version))").param("actor",u.userId()).param("id",newId).param("old",id).param("reason",input.reason()).param("version",v).update();return Map.of("id",newId);
    }
    public record Report(UUID requestKey,String location,String name,String description,String temporaryMeasure,OffsetDateTime discoveredAt){}
    public record Assignment(Integer revision,String categoryMajor,String hazardLevel,String rectificationMeasure,String temporaryMeasure,LocalDate dueDate,BigDecimal estimatedCost,UUID responsibleOrgId,UUID responsibleEmployeeId,String legalMajorStatus,String legalMajorBasis,UUID riskHazardId,String note){}
    public record Action(Integer revision,String note,Boolean accepted,String signatureData){}
    public record Answer(UUID itemId,String result,String answer,String notApplicableReason,String problemDescription,String handlingMeasure,UUID linkedHazardId){}
    public record Completion(List<Answer> items,String location,String participants,String signatureData){}
    public record TemplateItem(String category,String content,String questionType,Integer conditionIndex,String sourceRef){}
    public record TemplateRevision(Integer version,String name,String reason,List<TemplateItem> items){}
}
