package com.waterx.safety.process;

import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;
import com.waterx.safety.auth.CurrentUser;
import com.waterx.safety.common.BusinessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.*;

@Service
public class DailyDataService {
    private final JdbcClient db;
    private final ObjectMapper json;
    private static final String PREFIX="process:daily:";
    public DailyDataService(JdbcClient db,ObjectMapper json){this.db=db;this.json=json;}
    public record Assignment(UUID lineId,LocalDate date,UUID assigneeId,UUID reviewerId,String note) {}
    public record Action(int revision,String note,UUID assigneeId,UUID reviewerId,Map<String,Cell> cells) {}
    public record Cell(String value,String state,String source,String note) {}
    private BusinessException denied(){return new BusinessException("DAILY_FORBIDDEN","没有本厂本线的办理权限，或当前人员/授权已失效",HttpStatus.FORBIDDEN);}
    private void invalid(boolean condition,String message){if(condition)throw new BusinessException("DAILY_INVALID",message,HttpStatus.BAD_REQUEST);}
    private void conflict(boolean condition,String message){if(condition)throw new BusinessException("DAILY_CONFLICT",message,HttpStatus.CONFLICT);}
    private String note(String value){invalid(value==null||value.isBlank(),"请填写办理说明或更正依据");invalid(value.length()>4000,"说明过长");return value.trim();}
    private JsonNode parse(String text){try{return json.readTree(text);}catch(Exception ex){throw new IllegalStateException(ex);}}
    private UUID uuid(JsonNode n,String field){return UUID.fromString(n.path(field).asText());}
    UUID employee(CurrentUser u){return db.sql("""
        select e.id from user_account a join employee e on e.tenant_id=a.tenant_id and e.id=a.employee_id
        join tenant t on t.id=a.tenant_id and t.status='ACTIVE'
        where a.id=:user and a.tenant_id=:tenant and a.status='ACTIVE' and e.status='ACTIVE'
        """).param("user",u.userId()).param("tenant",u.tenantId()).query(UUID.class).optional().orElseThrow(this::denied);}
    // The permission, site, line and expiry must all come from the SAME live scope grant.
    private static final String GRANTS="""
        select distinct p.code from user_role_scope s
        join role r on r.tenant_id=s.tenant_id and r.id=s.role_id and r.status='ACTIVE'
        join role_permission rp on rp.tenant_id=r.tenant_id and rp.role_id=r.id
        join permission p on p.id=rp.permission_id
        join process_daily_line_scope ls on ls.scope_id=s.id
        join process_daily_line l on l.id=ls.line_id and l.tenant_id=s.tenant_id and l.site_id=s.scope_id and l.status='ACTIVE'
        join site st on st.id=l.site_id and st.tenant_id=l.tenant_id and st.status='ACTIVE'
        join user_account a on a.id=s.user_id and a.tenant_id=s.tenant_id and a.status='ACTIVE'
        join employee e on e.id=a.employee_id and e.tenant_id=a.tenant_id and e.status='ACTIVE'
        where s.tenant_id=:tenant and s.user_id=:user and s.scope_type='SITE'
          and s.scope_id=:site and l.id=:line
          and (s.valid_from is null or s.valid_from<=clock_timestamp())
          and (s.valid_until is null or s.valid_until>clock_timestamp())
        """;
    Set<String> rights(CurrentUser u,UUID site,UUID line){employee(u);return new HashSet<>(db.sql(GRANTS).param("tenant",u.tenantId()).param("user",u.userId()).param("site",site).param("line",line).query(String.class).list());}
    private boolean has(Set<String> rights,String action){return rights.contains(PREFIX+action);}
    private boolean authorizedEmployee(CurrentUser u,UUID site,UUID line,UUID person,String action){
        if(person==null)return false;
        return db.sql("select id from user_account where tenant_id=:tenant and employee_id=:person and status='ACTIVE'")
            .param("tenant",u.tenantId()).param("person",person).query(UUID.class).list().stream().anyMatch(id->has(rights(new CurrentUser(id,u.tenantId(),"","",false,Set.of()),site,line),action));
    }
    JsonNode line(CurrentUser u,UUID site,UUID id){return db.sql("select row_to_json(l)::text from process_daily_line l where tenant_id=:tenant and site_id=:site and id=:id and status='ACTIVE'")
        .param("tenant",u.tenantId()).param("site",site).param("id",id).query(String.class).optional().map(this::parse).orElseThrow(this::denied);}
    public List<JsonNode> context(CurrentUser u,UUID site){
        employee(u);List<JsonNode> result=new ArrayList<>();
        for(UUID id:db.sql("select id from process_daily_line where tenant_id=:tenant and site_id=:site and status='ACTIVE' order by name").param("tenant",u.tenantId()).param("site",site).query(UUID.class).list()){
            var permissions=rights(u,site,id);if(Collections.disjoint(permissions,Set.of(PREFIX+"read",PREFIX+"execute",PREFIX+"manage")))continue;
            ObjectNode value=(ObjectNode)line(u,site,id);value.set("permissions",json.valueToTree(permissions));value.put("employeeId",employee(u).toString());
            ArrayNode actors=json.createArrayNode();
            if(has(permissions,"manage"))for(var actor:db.sql("select id,display_name from employee where tenant_id=:tenant and status='ACTIVE'").param("tenant",u.tenantId()).query().listOfRows()){
                UUID person=(UUID)actor.get("id");boolean execute=authorizedEmployee(u,site,id,person,"execute"),review=authorizedEmployee(u,site,id,person,"manage");
                if(execute||review)actors.addObject().put("id",person.toString()).put("name",actor.get("display_name").toString()).put("execute",execute).put("review",review);
            }
            value.set("actors",actors);result.add(value);
        }return result;
    }
    ObjectNode record(CurrentUser u,UUID site,UUID id,boolean lock){
        var found=db.sql("select row_to_json(d)::text from process_daily_record d where tenant_id=:tenant and site_id=:site and id=:id"+(lock?" for update":""))
            .param("tenant",u.tenantId()).param("site",site).param("id",id).query(String.class).optional().orElseThrow(this::denied);
        var d=(ObjectNode)parse(found);var permissions=rights(u,site,uuid(d,"line_id"));
        if(!has(permissions,"manage")&&!has(permissions,"read")&&!(has(permissions,"execute")&&uuid(d,"assignee_id").equals(employee(u))))throw denied();
        return d;
    }
    private boolean participant(JsonNode d,UUID employee){for(var id:d.path("participants"))if(id.asText().equals(employee.toString()))return true;return false;}
    private boolean editable(JsonNode d){return Set.of("DRAFT","RETURNED").contains(d.path("state").asText());}
    boolean active(JsonNode d){return Set.of("DRAFT","RETURNED","SUBMITTED").contains(d.path("state").asText());}
    private List<String> actions(CurrentUser u,UUID site,JsonNode d){
        var rights=rights(u,site,uuid(d,"line_id"));UUID person=employee(u);List<String> actions=new ArrayList<>();
        boolean owner=has(rights,"execute")&&person.equals(uuid(d,"assignee_id"));
        if(has(rights,"manage")&&!d.path("state").asText().equals("SUBMITTED"))actions.add("assign");
        if(owner&&editable(d))actions.addAll(List.of("save","submit","cancel"));
        if(owner&&!active(d))actions.add("correct");
        if(has(rights,"manage")&&person.equals(uuid(d,"reviewer_id"))&&!participant(d,person)&&d.path("state").asText().equals("SUBMITTED"))actions.addAll(List.of("return","confirm"));
        if(has(rights,"export"))actions.add("export");
        return actions;
    }
    String name(UUID person){return db.sql("select display_name from employee where id=:id").param("id",person).query(String.class).single();}
    private ObjectNode summary(CurrentUser u,UUID site,ObjectNode d){
        d.put("assigneeName",name(uuid(d,"assignee_id")));d.put("reviewerName",name(uuid(d,"reviewer_id")));
        d.set("actions",json.valueToTree(actions(u,site,d)));d.put("analysisBlocked",active(d)||d.path("confirmed_version").asInt()==0);return d;
    }
    public List<JsonNode> list(CurrentUser u,UUID site,UUID line){
        var rights=rights(u,site,line);if(Collections.disjoint(rights,Set.of(PREFIX+"read",PREFIX+"execute",PREFIX+"manage")))throw denied();
        boolean all=has(rights,"manage")||has(rights,"read");
        return db.sql("select row_to_json(d)::text from process_daily_record d where tenant_id=:tenant and site_id=:site and line_id=:line and (:all or assignee_id=:person) order by business_date desc")
            .param("tenant",u.tenantId()).param("site",site).param("line",line).param("all",all).param("person",employee(u)).query(String.class).list().stream().map(this::parse).map(d->{var v=summary(u,site,(ObjectNode)d);v.remove(List.of("cells","template","participants"));return (JsonNode)v;}).toList();
    }
    public JsonNode detail(CurrentUser u,UUID site,UUID id){
        var d=summary(u,site,record(u,site,id,false));
        d.set("versions",json.valueToTree(db.sql("select row_to_json(v)::text from process_daily_version v where record_id=:id order by version").param("id",id).query(String.class).list().stream().map(this::parse).toList()));
        d.set("events",json.valueToTree(db.sql("select row_to_json(e)::text from process_daily_event e where record_id=:id order by revision").param("id",id).query(String.class).list().stream().map(this::parse).toList()));return d;
    }
    @Transactional
    public UUID create(CurrentUser u,UUID site,Assignment input){
        invalid(input.lineId()==null||input.date()==null,"请选择工艺线及业务日期");
        if(!has(rights(u,site,input.lineId()),"manage"))throw denied();
        String reason=note(input.note());checkAssignment(u,site,input.lineId(),input.assigneeId(),input.reviewerId());var line=line(u,site,input.lineId());UUID id=UUID.randomUUID();
        int rows=db.sql("""
            insert into process_daily_record(id,tenant_id,site_id,line_id,business_date,assignee_id,reviewer_id,state,template_version,template)
            values(:id,:tenant,:site,:line,:date,:assignee,:reviewer,'DRAFT',:version,cast(:template as jsonb))
            on conflict(tenant_id,line_id,business_date) do nothing
            """).param("id",id).param("tenant",u.tenantId()).param("site",site).param("line",input.lineId()).param("date",input.date()).param("assignee",input.assigneeId()).param("reviewer",input.reviewerId()).param("version",line.path("template_version").asInt()).param("template",line.path("template").toString()).update();
        conflict(rows==0,"该厂该线当天已有记录，请进入原记录办理");audit(u,record(u,site,id,false),"create",reason);return id;
    }
    private void checkAssignment(CurrentUser u,UUID site,UUID line,UUID assignee,UUID reviewer){
        invalid(!authorizedEmployee(u,site,line,assignee,"execute"),"执行人员必须具有本线有效填报授权");
        invalid(!authorizedEmployee(u,site,line,reviewer,"manage"),"审核人必须具有本线有效工艺经理授权");
        invalid(assignee.equals(reviewer),"执行人与审核人必须为不同自然人");
    }
    private void validateCells(JsonNode d,JsonNode cells,boolean submit){
        invalid(!cells.isObject()||cells.size()>500,"日数据格式错误");Set<String> allowed=new HashSet<>();
        for(var metric:d.path("template"))if(metric.path("source").asText().equals("MANUAL")&&metric.path("scopes").toString().contains("\"entry\""))allowed.add(metric.path("id").asText());
        boolean meaningful=false;
        var it=cells.fields();while(it.hasNext()){
            var item=it.next();invalid(!allowed.contains(item.getKey()),"包含模板以外或计算指标："+item.getKey());JsonNode c=item.getValue();
            for(String f:List.of("value","state","source","note"))invalid(!c.path(f).isTextual(),"数据字段格式不正确："+item.getKey());
            String value=c.path("value").asText(),state=c.path("state").asText(),source=c.path("source").asText();
            invalid(value.length()>1000||c.path("note").asText().length()>4000,"数据或说明过长");
            invalid(!Set.of("VALID","INVALID","NA").contains(state)||!Set.of("MANUAL","IMPORT","DEMO").contains(source),"数据状态或来源不正确");
            invalid(submit&&source.equals("DEMO"),"示范来源不能提交为正式日数据");
            if(submit&&!state.equals("VALID"))note(c.path("note").asText());
            if(submit&&!value.isBlank())for(var metric:d.path("template"))if(metric.path("id").asText().equals(item.getKey())&&!metric.path("text").asBoolean()){
                // Preserve qualifiers/special observations as facts, but require an explicit basis.
                boolean numeric=value.trim().matches("[+-]?(?:[0-9]+(?:\\.[0-9]*)?|\\.[0-9]+)(?:[eE][+-]?[0-9]+)?");
                if(!numeric)note(c.path("note").asText());
            }
            meaningful|=!value.isBlank()||!state.equals("VALID");
        }
        invalid(submit&&!meaningful,"请填报数据；缺失值不能以0替代，也不能整份空白提交");
    }
    @Transactional
    public JsonNode act(CurrentUser u,UUID site,UUID id,String action,Action input){
        var d=record(u,site,id,true);conflict(d.path("revision").asInt()!=input.revision(),"记录已被其他人员更新，请刷新后办理");
        if(!actions(u,site,d).contains(action)||action.equals("export"))throw denied();
        UUID person=employee(u),line=uuid(d,"line_id");String reason=action.equals("save")?(input.note()==null||input.note().isBlank()?"保存草稿":note(input.note())):note(input.note());
        switch(action){
            case "assign" -> {checkAssignment(u,site,line,input.assigneeId(),input.reviewerId());invalid(participant(d,input.reviewerId()),"参与过本候选填报的人员不能担任审核人");d.put("assignee_id",input.assigneeId().toString());d.put("reviewer_id",input.reviewerId().toString());}
            case "save" -> {invalid(input.cells()==null,"缺少日数据");JsonNode cells=json.valueToTree(input.cells());validateCells(d,cells,false);d.set("cells",cells);if(!participant(d,person))((ArrayNode)d.get("participants")).add(person.toString());}
            case "submit" -> {validateCells(d,d.path("cells"),true);invalid(!authorizedEmployee(u,site,line,uuid(d,"reviewer_id"),"manage")||participant(d,uuid(d,"reviewer_id")),"当前没有有效的独立审核人，请工艺经理重新分派");if(!participant(d,person))((ArrayNode)d.get("participants")).add(person.toString());d.put("state","SUBMITTED");}
            case "return" -> {d.put("state","RETURNED");d.put("review_note",reason);}
            case "confirm" -> {validateCells(d,d.path("cells"),true);int version=d.path("confirmed_version").asInt()+1;
                db.sql("""
                    insert into process_daily_version(record_id,version,candidate,cells,template,template_version,participants,confirmed_by,reason)
                    select id,:version,candidate,cells,template,template_version,participants,:person,:reason from process_daily_record where id=:id
                    """).param("version",version).param("person",person).param("reason",reason).param("id",id).update();
                d.put("confirmed_version",version);d.put("state","CONFIRMED");d.put("review_note",reason);}
            case "correct" -> {d.put("candidate",d.path("candidate").asInt()+1);d.put("state","DRAFT");d.put("correction_reason",reason);d.put("review_note","");d.set("participants",json.createArrayNode());
                if(d.path("confirmed_version").asInt()>0)d.set("cells",parse(db.sql("select cells::text from process_daily_version where record_id=:id and version=:v").param("id",id).param("v",d.path("confirmed_version").asInt()).query(String.class).single()));else d.set("cells",json.createObjectNode());}
            case "cancel" -> d.put("state","CANCELLED");
            default -> throw denied();
        }
        d.put("revision",input.revision()+1);
        db.sql("""
            update process_daily_record set revision=:revision,assignee_id=:assignee,reviewer_id=:reviewer,state=:state,candidate=:candidate,
            confirmed_version=:confirmed,cells=cast(:cells as jsonb),participants=array(select value::uuid from jsonb_array_elements_text(cast(:participants as jsonb))),
            correction_reason=:reason,review_note=:review,updated_at=now() where id=:id
            """).param("revision",d.path("revision").asInt()).param("assignee",uuid(d,"assignee_id")).param("reviewer",uuid(d,"reviewer_id")).param("state",d.path("state").asText()).param("candidate",d.path("candidate").asInt()).param("confirmed",d.path("confirmed_version").asInt()).param("cells",d.path("cells").toString()).param("participants",d.path("participants").toString()).param("reason",d.path("correction_reason").asText()).param("review",d.path("review_note").asText()).param("id",id).update();
        audit(u,d,action,reason);return detail(u,site,id);
    }
    private void audit(CurrentUser u,JsonNode d,String action,String reason){UUID person=employee(u);db.sql("""
        insert into process_daily_event(record_id,revision,candidate,action,user_id,employee_id,actor_name,note,snapshot)
        values(:id,:revision,:candidate,:action,:user,:person,:name,:note,cast(:snapshot as jsonb))
        """).param("id",uuid(d,"id")).param("revision",d.path("revision").asInt()).param("candidate",d.path("candidate").asInt()).param("action",action).param("user",u.userId()).param("person",person).param("name",name(person)).param("note",reason).param("snapshot",d.toString()).update();}
    @Transactional(readOnly=true)
    public JsonNode analysisSource(CurrentUser u,UUID site,UUID id){
        var d=record(u,site,id,false);if(!has(rights(u,site,uuid(d,"line_id")),"manage"))throw denied();
        conflict(active(d)||d.path("confirmed_version").asInt()==0,"日数据尚未确认或更正办理中，不能生成新的业务分析");
        return parse(db.sql("select row_to_json(v)::text from process_daily_version v where record_id=:id and version=:v").param("id",id).param("v",d.path("confirmed_version").asInt()).query(String.class).single());
    }
    public JsonNode export(CurrentUser u,UUID site,UUID id){var d=record(u,site,id,false);if(!has(rights(u,site,uuid(d,"line_id")),"export"))throw denied();return detail(u,site,id);}
}
