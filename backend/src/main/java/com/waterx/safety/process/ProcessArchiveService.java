package com.waterx.safety.process;

import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;
import com.waterx.safety.auth.CurrentUser;
import com.waterx.safety.common.BusinessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDate;
import java.util.*;

@Service
public class ProcessArchiveService {
    private final JdbcClient db;private final ObjectMapper json;private final DailyDataService daily;private final ProcessCalculator calculator;
    public ProcessArchiveService(JdbcClient db,ObjectMapper json,DailyDataService daily,ProcessCalculator calculator){this.db=db;this.json=json;this.daily=daily;this.calculator=calculator;}
    public record ParameterInput(int revision,JsonNode content){}
    public record ReportInput(UUID recordId,String note){}
    public record SaveReport(String sourceStamp,String note){}
    private BusinessException bad(String m){return new BusinessException("PROCESS_INVALID",m,HttpStatus.BAD_REQUEST);}
    private BusinessException conflict(String m){return new BusinessException("PROCESS_SOURCE_CHANGED",m,HttpStatus.CONFLICT);}
    private BusinessException forbidden(){return new BusinessException("PROCESS_FORBIDDEN","当前人员没有本厂本线的该项权限",HttpStatus.FORBIDDEN);}
    private JsonNode parse(String s){try{return json.readTree(s);}catch(Exception e){throw new IllegalStateException(e);}}
    private UUID id(JsonNode n,String f){return UUID.fromString(n.path(f).asText());}
    private void require(CurrentUser u,UUID site,UUID line,String permission){if(!daily.rights(u,site,line).contains(permission))throw forbidden();}
    private void read(CurrentUser u,UUID site,UUID line){var rights=daily.rights(u,site,line);if(Collections.disjoint(rights,Set.of("process:daily:read","process:daily:manage","process:daily:execute")))throw forbidden();}
    private String text(JsonNode n,String f){String v=n.path(f).asText();if(v.isBlank()||v.length()>4000)throw bad("请填写有效的"+Map.of("name","名称","basis","依据","reason","修订原因").getOrDefault(f,f));return v;}
    private String note(String v){if(v==null||v.isBlank()||v.length()>4000)throw bad("请填写办理说明");return v.trim();}
    private void lockLine(CurrentUser u,UUID site,UUID line){db.sql("select id from process_daily_line where id=:id and site_id=:site and tenant_id=:tenant for update").param("id",line).param("site",site).param("tenant",u.tenantId()).query(UUID.class).optional().orElseThrow(this::forbidden);}
    public JsonNode parameters(CurrentUser u,UUID site,UUID line){read(u,site,line);ArrayNode result=json.createArrayNode();for(String raw:db.sql("select row_to_json(p)::text from process_parameter p where tenant_id=:tenant and site_id=:site and line_id=:line order by kind").param("tenant",u.tenantId()).param("site",site).param("line",line).query(String.class).list()){
        ObjectNode p=(ObjectNode)parse(raw);p.set("versions",json.valueToTree(db.sql("select row_to_json(v)::text from process_parameter_version v where parameter_id=:id order by version").param("id",id(p,"id")).query(String.class).list().stream().map(this::parse).toList()));
        boolean manager=daily.rights(u,site,line).contains("process:parameter:maintain");if(!manager)p.remove("draft");
        if(manager)p.set("events",json.valueToTree(db.sql("select row_to_json(e)::text from process_parameter_event e where parameter_id=:id order by revision").param("id",id(p,"id")).query(String.class).list().stream().map(this::parse).toList()));result.add(p);
    }return result;}
    private void validate(JsonNode content,JsonNode template,String kind,boolean publish){
        if(content==null||!content.isObject())throw bad("参数内容不正确");text(content,"name");text(content,"basis");text(content,"reason");
        LocalDate from,to;try{from=LocalDate.parse(content.path("from").asText());to=LocalDate.parse(content.path("to").asText());}catch(Exception e){throw bad("请填写生效起止日期");}if(from.isAfter(to))throw bad("生效起始日期不得晚于截止日期");
        if(!Set.of("ACTIVE","RETIRED").contains(content.path("status").asText()))throw bad("参数状态不正确");
        if(!Set.of("ROUTINE","MAJOR").contains(content.path("impact").asText()))throw bad("请说明变更影响范围");
        if(publish&&!content.path("impact").asText().equals("ROUTINE"))throw conflict("重大边界变更须进入必要审批；本试点尚未配置此类批准权限，请先保存草稿，本次发布不生效");
        JsonNode values=content.path(kind.equals("DESIGN")?"values":"targets");if(!values.isObject()||values.size()>500)throw bad("参数格式不正确");
        Map<String,JsonNode> allowed=new HashMap<>();template.forEach(m->{if(m.path("scopes").toString().contains(kind.equals("DESIGN")?"\"design\"":"\"condition\""))allowed.put(m.path("id").asText(),m);});
        var fields=values.fields();while(fields.hasNext()){var f=fields.next();if(!allowed.containsKey(f.getKey()))throw bad("存在本模板范围外的参数："+f.getKey());
            if(kind.equals("DESIGN")){if(!f.getValue().isTextual()||f.getValue().asText().length()>1000)throw bad("设计参数格式不正确");String v=f.getValue().asText();if(!v.isBlank()&&!allowed.get(f.getKey()).path("text").asBoolean()&&ProcessCalculator.numeric(v)==null)throw bad("设计参数须为完整数字："+f.getKey());}
            else{if(!f.getValue().isObject()||!f.getValue().path("value").isTextual()||f.getValue().path("value").asText().length()>1000)throw bad("目标值格式不正确");String error=ProcessCalculator.targetError(f.getValue());if(!error.isEmpty())throw bad(error);}
        }
        if(publish&&content.path("status").asText().equals("ACTIVE")&&values.isEmpty())throw bad("尚未维护任何参数，不能启用");
    }
    @Transactional public JsonNode saveParameter(CurrentUser u,UUID site,UUID line,String kind,ParameterInput input,boolean publish){
        if(!Set.of("DESIGN","TARGET").contains(kind))throw bad("参数类别不正确");require(u,site,line,"process:parameter:maintain");lockLine(u,site,line);
        var raws=db.sql("select row_to_json(p)::text from process_parameter p where tenant_id=:tenant and line_id=:line and kind=:kind for update").param("tenant",u.tenantId()).param("line",line).param("kind",kind).query(String.class).list();
        JsonNode old=raws.isEmpty()?json.createObjectNode():parse(raws.getFirst());if(old.path("revision").asInt()!=input.revision())throw conflict("参数已被其他人员更新，请重新读取");
        JsonNode template=daily.line(u,site,line).path("template");validate(input.content(),template,kind,publish);UUID parameter=old.has("id")?id(old,"id"):UUID.randomUUID();int revision=input.revision()+1,version=old.path("published_version").asInt()+(publish?1:0);UUID actor=daily.employee(u);String name=daily.name(actor);
        db.sql("""
            insert into process_parameter(id,tenant_id,site_id,line_id,kind,revision,published_version,draft) values(:id,:tenant,:site,:line,:kind,:revision,:version,cast(:draft as jsonb))
            on conflict(id) do update set revision=:revision,published_version=:version,draft=cast(:draft as jsonb)
            """).param("id",parameter).param("tenant",u.tenantId()).param("site",site).param("line",line).param("kind",kind).param("revision",revision).param("version",version).param("draft",input.content().toString()).update();
        if(publish)db.sql("insert into process_parameter_version(parameter_id,version,content,published_by,actor_name) values(:id,:version,cast(:content as jsonb),:actor,:name)").param("id",parameter).param("version",version).param("content",input.content().toString()).param("actor",actor).param("name",name).update();
        db.sql("insert into process_parameter_event(parameter_id,revision,action,employee_id,actor_name,note,content) values(:id,:revision,:action,:actor,:name,:note,cast(:content as jsonb))").param("id",parameter).param("revision",revision).param("action",publish?"PUBLISH":"DRAFT").param("actor",actor).param("name",name).param("note",input.content().path("reason").asText()).param("content",input.content().toString()).update();
        return parameters(u,site,line);
    }
    private JsonNode matching(CurrentUser u,UUID line,String kind,String date){return db.sql("""
        select row_to_json(v)::text from process_parameter_version v join process_parameter p on p.id=v.parameter_id
        where p.tenant_id=:tenant and p.line_id=:line and p.kind=:kind and v.version<=p.published_version
        and v.content->>'from'<=:date and v.content->>'to'>=:date order by v.version desc limit 1
        """).param("tenant",u.tenantId()).param("line",line).param("kind",kind).param("date",date).query(String.class).optional().map(this::parse).filter(v->v.path("content").path("status").asText().equals("ACTIVE")).orElseThrow(()->conflict("业务日期没有适用的"+(kind.equals("DESIGN")?"设计参考":"运行目标")+"发布版本"));}
    private ObjectNode source(CurrentUser u,UUID site,JsonNode d){
        if(daily.active(d)||d.path("confirmed_version").asInt()==0)throw conflict("日数据尚未确认或更正办理中，不能生成或保存新的业务分析");UUID line=id(d,"line_id");
        JsonNode entry=parse(db.sql("select row_to_json(v)::text from process_daily_version v where record_id=:id and version=:version").param("id",id(d,"id")).param("version",d.path("confirmed_version").asInt()).query(String.class).single());
        JsonNode design=matching(u,line,"DESIGN",d.path("business_date").asText()),target=matching(u,line,"TARGET",d.path("business_date").asText());
        ObjectNode s=json.createObjectNode();s.put("recordId",d.path("id").asText()).put("lineId",line.toString()).put("date",d.path("business_date").asText()).put("ruleVersion",ProcessCalculator.RULE);s.set("entry",entry);s.set("design",design);s.set("target",target);return s;
    }
    private String stamp(JsonNode source){try{return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(source.toString().getBytes(StandardCharsets.UTF_8)));}catch(Exception e){throw new IllegalStateException(e);}}
    @Transactional public JsonNode generate(CurrentUser u,UUID site,ReportInput input){
        var visible=daily.record(u,site,input.recordId(),false);UUID line=id(visible,"line_id");require(u,site,line,"process:report:generate");lockLine(u,site,line);var d=daily.record(u,site,input.recordId(),true);ObjectNode source=source(u,site,d);
        int version=db.sql("select coalesce(max(version),0)+1 from process_report where record_id=:id").param("id",input.recordId()).query(Integer.class).single();UUID report=UUID.randomUUID(),actor=daily.employee(u);
        var rows=calculator.calculate(source.path("entry").path("template"),source.path("design").path("content").path("values"),source.path("target").path("content").path("targets"),source.path("entry").path("cells"));
        db.sql("""
            insert into process_report(id,tenant_id,site_id,line_id,record_id,version,status,source_stamp,source,rows,rule_version,created_by,creator_name,note)
            values(:id,:tenant,:site,:line,:record,:version,'DRAFT',:stamp,cast(:source as jsonb),cast(:rows as jsonb),:rule,:actor,:name,:note)
            """).param("id",report).param("tenant",u.tenantId()).param("site",site).param("line",line).param("record",input.recordId()).param("version",version).param("stamp",stamp(source)).param("source",source.toString()).param("rows",rows.toString()).param("rule",ProcessCalculator.RULE).param("actor",actor).param("name",daily.name(actor)).param("note",note(input.note())).update();return report(u,site,report);
    }
    private ObjectNode reportRecord(CurrentUser u,UUID site,UUID report){return (ObjectNode)parse(db.sql("select row_to_json(r)::text from process_report r where id=:id and tenant_id=:tenant and site_id=:site").param("id",report).param("tenant",u.tenantId()).param("site",site).query(String.class).optional().orElseThrow(this::forbidden));}
    public JsonNode report(CurrentUser u,UUID site,UUID id){ObjectNode r=reportRecord(u,site,id);var d=daily.record(u,site,id(r,"record_id"),false);var permissions=daily.rights(u,site,id(r,"line_id"));
        if(r.path("status").asText().equals("DRAFT")&&!permissions.contains("process:report:generate"))throw forbidden();
        try{r.put("sourceChanged",!r.path("source_stamp").asText().equals(stamp(source(u,site,d))));r.put("sourceNotice",r.path("sourceChanged").asBoolean()?"来源已有新版本，旧日报内容保留，请重新生成":"来源版本一致");}
        catch(BusinessException e){r.put("sourceChanged",true).put("sourceNotice",e.getMessage()+"；旧日报内容保留");}
        if(d.path("state").asText().equals("CANCELLED")&&d.path("confirmed_version").asInt()>0)r.put("sourceNotice",r.path("sourceNotice").asText()+"；曾有更正候选被终止，原依据的疑问需结合办理历史核查");
        r.put("canSave",r.path("status").asText().equals("DRAFT")&&!r.path("sourceChanged").asBoolean()&&permissions.contains("process:report:generate")&&id(r,"created_by").equals(daily.employee(u)));
        r.put("canExport",r.path("status").asText().equals("SAVED")&&permissions.contains("process:daily:export"));return r;
    }
    public JsonNode reports(CurrentUser u,UUID site,UUID record){daily.record(u,site,record,false);ArrayNode list=json.createArrayNode();for(UUID id:db.sql("select id from process_report where record_id=:record order by version desc").param("record",record).query(UUID.class).list()){
        ObjectNode r=reportRecord(u,site,id);if(r.path("status").asText().equals("DRAFT")&&!daily.rights(u,site,id(r,"line_id")).contains("process:report:generate"))continue;
        ObjectNode view=(ObjectNode)report(u,site,id);view.remove("rows");list.add(view);
    }return list;}
    @Transactional public JsonNode saveReport(CurrentUser u,UUID site,UUID id,SaveReport input){
        ObjectNode r=reportRecord(u,site,id);UUID line=id(r,"line_id");require(u,site,line,"process:report:generate");lockLine(u,site,line);var d=daily.record(u,site,id(r,"record_id"),true);
        if(!id(r,"created_by").equals(daily.employee(u)))throw forbidden();if(!r.path("source_stamp").asText().equals(input.sourceStamp())||!input.sourceStamp().equals(stamp(source(u,site,d))))throw conflict("生成后来源已变化，请重新生成分析再保存");
        if(db.sql("update process_report set status='SAVED',saved_at=now(),note=:note where id=:id and status='DRAFT'").param("note",note(input.note())).param("id",id).update()!=1)throw conflict("日报已经保存，不能重复保存或覆盖历史");return report(u,site,id);
    }
    public JsonNode exportReport(CurrentUser u,UUID site,UUID id){JsonNode r=report(u,site,id);if(!r.path("canExport").asBoolean())throw forbidden();return r;}
}
