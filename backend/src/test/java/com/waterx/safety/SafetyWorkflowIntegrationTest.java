package com.waterx.safety;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.waterx.safety.auth.CurrentUser;
import com.waterx.safety.auth.CurrentUserAuthentication;
import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.mock.web.MockMultipartFile;
import java.nio.file.Path;
import java.time.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class SafetyWorkflowIntegrationTest {
    static final String SITE="30000000-0000-0000-0000-000000000001",OTHER="30000000-0000-0000-0000-000000000002",TENANT="10000000-0000-0000-0000-000000000001";
    static final EmbeddedPostgres POSTGRES=start();
    static EmbeddedPostgres start(){try{return EmbeddedPostgres.builder().start();}catch(Exception e){throw new ExceptionInInitializerError(e);}}
    @DynamicPropertySource static void properties(DynamicPropertyRegistry p){p.add("spring.datasource.url",()->POSTGRES.getJdbcUrl("postgres","postgres"));p.add("spring.datasource.username",()->"postgres");p.add("spring.datasource.password",()->"");p.add("app.bootstrap.admin-username",()->"workflow_test_admin");p.add("app.bootstrap.admin-password",()->"Test-Only-Workflow-2026!");p.add("app.storage.local-dir",()->Path.of(System.getProperty("java.io.tmpdir"),"waterx-workflow-test-attachments").toString());}
    @AfterAll static void stop()throws Exception{POSTGRES.close();}
    @Autowired MockMvc mvc;@Autowired ObjectMapper json;@Autowired JdbcClient jdbc;
    CurrentUser officer,owner,reporter,reviewer,technical;
    static final String SIGN="data:image/png;base64,"+Base64.getEncoder().encodeToString(png());
    static byte[] png(){try{var image=new java.awt.image.BufferedImage(100,40,java.awt.image.BufferedImage.TYPE_INT_ARGB);var g=image.createGraphics();g.drawLine(2,2,80,30);g.dispose();var out=new java.io.ByteArrayOutputStream();javax.imageio.ImageIO.write(image,"png",out);return out.toByteArray();}catch(Exception e){throw new RuntimeException(e);}}
    @BeforeEach void actors(){officer=actor("officer","41000000-0000-0000-0000-000000000002","SAFETY_MANAGER");reviewer=actor("reviewer","41000000-0000-0000-0000-000000000003","SAFETY_MANAGER");owner=actor("owner","41000000-0000-0000-0000-000000000005","EMPLOYEE");reporter=actor("reporter","41000000-0000-0000-0000-000000000004","EMPLOYEE");technical=actor("technical","40000000-0000-0000-0000-000000000001","PLATFORM_ADMIN");}
    CurrentUser actor(String name,String employee,String role){
        UUID id=UUID.nameUUIDFromBytes(("workflow-"+name).getBytes());
        jdbc.sql("insert into user_account(id,tenant_id,employee_id,username,password_hash,status) values(:id,cast(:tenant as uuid),cast(:employee as uuid),:name,'not-used-by-mocked-test','ACTIVE') on conflict(id) do nothing").param("id",id).param("tenant",TENANT).param("employee",employee).param("name","wf_"+name).update();
        jdbc.sql("insert into user_role_scope(id,tenant_id,user_id,role_id,scope_type,scope_id) select gen_random_uuid(),r.tenant_id,:id,r.id,'SITE',cast(:site as uuid) from role r where r.tenant_id=cast(:tenant as uuid) and r.code=:role on conflict do nothing").param("id",id).param("site",SITE).param("tenant",TENANT).param("role",role).update();
        var permissions=new HashSet<>(List.of("inspection:read","hazard:read"));if(!role.equals("EMPLOYEE"))permissions.addAll(List.of("inspection:manage","hazard:manage"));
        return new CurrentUser(id,UUID.fromString(TENANT),"wf_"+name,name,false,permissions);
    }
    JsonNode call(CurrentUser u,MockHttpServletRequestBuilder req,int expected)throws Exception{
        var response=mvc.perform(req.with(authentication(new CurrentUserAuthentication(u))).header("X-Site-Id",SITE)).andExpect(status().is(expected)).andReturn().getResponse();
        String body=response.getContentAsString();return body.isBlank()?json.nullNode():json.readTree(body);
    }
    JsonNode postJson(CurrentUser u,String path,Object data,int expected)throws Exception{return call(u,post(path).contentType("application/json").content(json.writeValueAsString(data)),expected);}
    JsonNode getJson(CurrentUser u,String path)throws Exception{return call(u,get(path),200);}
    String report(CurrentUser u)throws Exception{return postJson(u,"/api/v1/safety/hazards",Map.of("requestKey",UUID.randomUUID(),"location","加药间","description","洗眼器无法正常出水"),200).path("id").asText();}
    Map<String,Object> assignment(int rev,String person){return new HashMap<>(Map.ofEntries(Map.entry("revision",rev),Map.entry("categoryMajor","物的不安全状态"),Map.entry("hazardLevel","LARGER"),Map.entry("rectificationMeasure","检修并现场测试"),Map.entry("temporaryMeasure","设置备用冲洗设施"),Map.entry("dueDate",LocalDate.now().plusDays(2).toString()),Map.entry("responsibleOrgId","31000000-0000-0000-0000-000000000004"),Map.entry("responsibleEmployeeId",person),Map.entry("legalMajorStatus","UNDETERMINED"),Map.entry("note","核对现场后落实责任")));}
    String path(String id){return "/api/v1/safety/workflow/hazards/"+id;}
    JsonNode hazard(String id)throws Exception{return getJson(officer,path(id)).path("hazard");}
    Map<String,Object> action(int revision,boolean yes){return Map.of("revision",revision,"note",yes?"现场核实后确认":"仍有问题请继续整改","accepted",yes,"signatureData",SIGN);}
    void upload(CurrentUser u,String id,String stage,int expected)throws Exception{
        call(u,multipart("/api/v1/safety/hazards/"+id+"/attachments").file(new MockMultipartFile("file","现场.png","image/png",png())).param("stage",stage),expected);
    }
    @Test void reportIsLightweightIdempotentAndPrivate()throws Exception{
        var input=Map.of("requestKey",UUID.randomUUID(),"location","格栅间","description","护栏连接件松动");
        String id=postJson(reporter,"/api/v1/safety/hazards",input,200).path("id").asText();
        assertEquals(id,postJson(reporter,"/api/v1/safety/hazards",input,200).path("id").asText());
        var h=hazard(id);assertEquals("PENDING_ACCEPTANCE",h.path("status").asText());assertFalse(h.hasNonNull("hazardLevel"));assertFalse(h.hasNonNull("dueDate"));assertFalse(h.hasNonNull("estimatedCost"));
        call(owner,get(path(id)),403);upload(owner,id,"DISCOVERY",403);upload(reporter,id,"DISCOVERY",200);
        mvc.perform(get(path(id)).with(authentication(new CurrentUserAuthentication(officer))).header("X-Site-Id",OTHER)).andExpect(status().isForbidden());
        postJson(technical,path(id)+"/assignment",assignment(1,"41000000-0000-0000-0000-000000000005"),403);
        var changed=new HashMap<String,Object>(input);changed.put("description","另一条不同问题");postJson(reporter,"/api/v1/safety/hazards",changed,409);
    }
    @Test void assignmentReceiptEvidenceReturnReviewAndImmutableArchive()throws Exception{
        String id=report(reporter);
        var assign=assignment(1,"41000000-0000-0000-0000-000000000005");postJson(officer,path(id)+"/assignment",assign,200);
        postJson(officer,path(id)+"/assignment",assign,409);
        assertEquals("ASSIGNED",hazard(id).path("status").asText());assertTrue(getJson(owner,"/api/v1/safety/hazards").findValuesAsText("id").contains(id));
        postJson(reporter,path(id)+"/receipt",action(2,true),403);
        postJson(owner,path(id)+"/receipt",action(2,false),200);assertEquals("PENDING_ACCEPTANCE",hazard(id).path("status").asText());
        assign.put("revision",3);postJson(officer,path(id)+"/assignment",assign,200);postJson(owner,path(id)+"/receipt",action(4,true),200);
        postJson(owner,path(id)+"/rectification",action(5,true),400);upload(owner,id,"RECTIFICATION",200);
        postJson(owner,path(id)+"/rectification",action(5,true),200);
        jdbc.sql("update safety_hazard set due_date=current_date-2 where id=cast(:id as uuid)").param("id",id).update();
        assertEquals("REVIEW_PENDING",hazard(id).path("status").asText());assertEquals(2,hazard(id).path("overdueDays").asInt());
        postJson(owner,path(id)+"/review",action(6,true),403);
        CurrentUser ownerManager=actor("owner_manager","41000000-0000-0000-0000-000000000005","SAFETY_MANAGER");
        postJson(ownerManager,path(id)+"/review",action(6,true),403);
        postJson(reviewer,path(id)+"/review",action(6,false),200);
        postJson(owner,path(id)+"/rectification",action(7,true),400);upload(owner,id,"RECTIFICATION",200);postJson(owner,path(id)+"/rectification",action(7,true),200);
        postJson(reviewer,path(id)+"/review",action(8,true),200);assertEquals("CLOSED",hazard(id).path("status").asText());assertEquals(0,hazard(id).path("overdueDays").asInt());
        upload(owner,id,"RECTIFICATION",400);postJson(officer,path(id)+"/assignment",assignment(9,"41000000-0000-0000-0000-000000000005"),400);
        var events=getJson(officer,path(id)).path("events");assertEquals(2,events.findValuesAsText("action").stream().filter("RECTIFICATION_SUBMITTED"::equals).count());assertTrue(events.findValuesAsText("action").contains("REVIEW_RETURNED"));assertTrue(events.findValuesAsText("action").contains("ASSIGNMENT_RETURNED"));
    }
    @Test void crossSiteAssignmentAndLegalDeterminationRequireRealEvidence()throws Exception{
        String id=report(reporter);var a=assignment(1,"42000000-0000-0000-0000-000000000001");postJson(officer,path(id)+"/assignment",a,400);
        a=assignment(1,"41000000-0000-0000-0000-000000000005");a.put("legalMajorStatus","YES");postJson(officer,path(id)+"/assignment",a,400);
        a.put("legalMajorBasis","测试用明确依据，不作为正式判定规则");a.put("estimatedCost",0);postJson(officer,path(id)+"/assignment",a,200);
        assertEquals(0,hazard(id).path("estimatedCost").asInt());assertEquals("YES",hazard(id).path("legalMajorStatus").asText());
    }
    JsonNode template(String family)throws Exception{for(JsonNode t:getJson(officer,"/api/v1/safety/inspection/templates"))if(t.path("familyCode").asText().equals(family))return t;throw new AssertionError(family);}
    String task(String templateId)throws Exception{return postJson(officer,"/api/v1/safety/inspection/tasks",Map.of("templateId",templateId,"title","业务验收检查","plannedStart",LocalDate.now().toString(),"dueAt",OffsetDateTime.now().plusHours(8).toString(),"assigneeEmployeeId","41000000-0000-0000-0000-000000000004"),200).path("id").asText();}
    @Test void originalFormsAndConditionalQuestionsCreateOnlyActualFindings()throws Exception{
        assertEquals(131,jdbc.sql("select count(*) from inspection_template_item i join inspection_template t on t.id=i.template_id where t.code like 'SOURCE-%' and t.site_id is null").query(Integer.class).single());
        String id=task(template("SOURCE-DAILY-OPS").path("id").asText());
        var items=getJson(reporter,"/api/v1/safety/inspection/tasks/"+id+"/items");List<Map<String,Object>> answers=new ArrayList<>();
        for(JsonNode i:items){Map<String,Object> a=new HashMap<>();a.put("itemId",i.path("id").asText());a.put("result","COMPLIANT");if(i.hasNonNull("conditionItemId")){a.put("problemDescription","切换前遗留的问题，不应保留");a.put("answer","旧回答");}if(i.path("questionType").asText().equals("CONDITION"))a.put("answer","NO");if(i.path("questionType").asText().equals("OBSERVATION")){a.put("answer","YES");a.put("problemDescription","发现另一处护栏松动");}answers.add(a);}
        var input=new HashMap<String,Object>(Map.of("items",answers,"location","运维巡检范围","participants","运行班组","signatureData",SIGN));
        postJson(officer,"/api/v1/safety/workflow/tasks/"+id+"/complete",input,403);
        input.put("items",answers.subList(0,answers.size()-1));postJson(reporter,"/api/v1/safety/workflow/tasks/"+id+"/complete",input,400);
        input.put("items",answers);assertEquals(1,postJson(reporter,"/api/v1/safety/workflow/tasks/"+id+"/complete",input,200).path("hazardsCreated").asInt());
        var saved=getJson(reporter,"/api/v1/safety/inspection/tasks/"+id+"/items");assertEquals(3,saved.findValuesAsText("result").stream().filter("NOT_APPLICABLE"::equals).count());
        for(JsonNode i:saved)if(i.path("result").asText().equals("NOT_APPLICABLE")){assertFalse(i.hasNonNull("answer"));assertFalse(i.hasNonNull("problemDescription"));assertFalse(i.hasNonNull("linkedHazardId"));}
        assertEquals(1,saved.findValuesAsText("result").stream().filter("NON_COMPLIANT"::equals).count());postJson(reporter,"/api/v1/safety/workflow/tasks/"+id+"/complete",input,409);
    }
    @Test void revisedTemplateAffectsFutureTasksButNotPastSnapshots()throws Exception{
        JsonNode t=template("SOURCE-WINTER");String oldId=t.path("id").asText(),taskId=task(oldId);
        var before=getJson(reporter,"/api/v1/safety/inspection/tasks/"+taskId+"/items");
        var input=Map.of("version",t.path("version").asInt(),"name","本厂冬季检查修订","reason","明确本厂适用项目","items",List.of(Map.of("category","本厂专项","content","核查本厂指定区域","questionType","COMPLIANCE")));
        JsonNode revision=call(officer,put("/api/v1/safety/workflow/templates/"+oldId).contentType("application/json").content(json.writeValueAsString(input)),200);
        assertEquals(before,getJson(reporter,"/api/v1/safety/inspection/tasks/"+taskId+"/items"));
        String future=task(revision.path("id").asText());assertEquals(1,getJson(reporter,"/api/v1/safety/inspection/tasks/"+future+"/items").size());
        call(officer,put("/api/v1/safety/workflow/templates/"+oldId).contentType("application/json").content(json.writeValueAsString(input)),409);
    }
    @Test void notApplicableNeedsReasonAndSameFindingLinksWithoutDuplicateHazards()throws Exception{
        String linked=report(reporter),taskId=task(template("SOURCE-COMPREHENSIVE").path("id").asText());
        String item=getJson(reporter,"/api/v1/safety/inspection/tasks/"+taskId+"/items").get(0).path("id").asText();
        var answer=new HashMap<String,Object>(Map.of("itemId",item,"result","NOT_APPLICABLE"));
        var input=new HashMap<String,Object>(Map.of("location","加药间","participants","运行班组","signatureData",SIGN,"items",List.of(answer)));
        postJson(reporter,"/api/v1/safety/workflow/tasks/"+taskId+"/complete",input,400);
        answer.put("result","NON_COMPLIANT");answer.put("answer","检查加药间设施");answer.put("problemDescription","再次发现同一洗眼器问题");answer.put("linkedHazardId",linked);
        assertEquals(0,postJson(reporter,"/api/v1/safety/workflow/tasks/"+taskId+"/complete",input,200).path("hazardsCreated").asInt());assertEquals(1,getJson(officer,path(linked)).path("origins").size());
    }
    @Test void recurringPlansGenerateOnceAndRejectFutureOrForeignTemplates()throws Exception{
        var plan=Map.of("templateId",template("SOURCE-SUMMER").path("id").asText(),"name","周期验证","scheduleType","ONCE","intervalValue",1,"nextRunDate",LocalDate.now().toString(),"dueHours",24,"assigneeEmployeeId","41000000-0000-0000-0000-000000000004");
        String id=postJson(officer,"/api/v1/safety/inspection/plans",plan,200).path("id").asText();
        postJson(officer,"/api/v1/safety/inspection/plans/generate",Map.of(),200);postJson(officer,"/api/v1/safety/inspection/plans/generate",Map.of(),200);
        assertEquals(1,jdbc.sql("select count(*) from inspection_task where plan_id=cast(:id as uuid)").param("id",id).query(Integer.class).single());
        postJson(officer,"/api/v1/safety/inspection/plans/generate?throughDate="+LocalDate.now().plusDays(1),Map.of(),400);
    }
    @Test void attachmentsDownloadExactBytesAndRejectUnsupportedFiles()throws Exception{
        String id=report(reporter);
        var file=call(reporter,multipart("/api/v1/safety/hazards/"+id+"/attachments").file(new MockMultipartFile("file","现场照片.png","image/png",png())).param("stage","DISCOVERY"),200);
        assertEquals("现场照片.png",file.path("originalName").asText());
        var response=mvc.perform(get("/api/v1/safety/hazards/"+id+"/attachments/"+file.path("id").asText()+"/download").with(authentication(new CurrentUserAuthentication(reporter))).header("X-Site-Id",SITE)).andExpect(status().isOk()).andReturn().getResponse();
        assertArrayEquals(png(),response.getContentAsByteArray());
        assertEquals(1,getJson(reporter,"/api/v1/safety/hazards/"+id+"/attachments").size());
        call(reporter,multipart("/api/v1/safety/hazards/"+id+"/attachments").file(new MockMultipartFile("file","脚本.txt","text/plain","not allowed".getBytes())).param("stage","DISCOVERY"),400);
        call(reporter,multipart("/api/v1/safety/hazards/"+id+"/attachments").file(new MockMultipartFile("file","空文件.png","image/png",new byte[0])).param("stage","DISCOVERY"),400);
    }
    @Test void planPauseResumePreservesReasonAndSkipsPausedBackfill()throws Exception{
        String id=postJson(officer,"/api/v1/safety/inspection/plans",Map.of("templateId",template("SOURCE-SPRING").path("id").asText(),"name","暂停验证","scheduleType","DAILY","intervalValue",1,"nextRunDate",LocalDate.now().toString(),"dueHours",24,"assigneeEmployeeId","41000000-0000-0000-0000-000000000004"),200).path("id").asText();
        postJson(officer,"/api/v1/safety/inspection/plans/"+id+"/status",Map.of("action","PAUSE","reason","设备区域停用"),200);
        jdbc.sql("update inspection_plan set next_run_date=current_date-10 where id=cast(:id as uuid)").param("id",id).update();
        postJson(officer,"/api/v1/safety/inspection/plans/generate",Map.of(),200);
        assertEquals(0,jdbc.sql("select count(*) from inspection_task where plan_id=cast(:id as uuid)").param("id",id).query(Integer.class).single());
        postJson(officer,"/api/v1/safety/inspection/plans/"+id+"/status",Map.of("action","RESUME","reason","区域恢复使用"),200);
        postJson(officer,"/api/v1/safety/inspection/plans/generate",Map.of(),200);
        assertEquals(1,jdbc.sql("select count(*) from inspection_task where plan_id=cast(:id as uuid)").param("id",id).query(Integer.class).single());
        assertEquals(3,jdbc.sql("select count(*) from inspection_plan_event where plan_id=cast(:id as uuid)").param("id",id).query(Integer.class).single());
    }
    @Test void managementIsReadOnlyAndTechnicalClaimsDoNotGrantBusinessAccess()throws Exception{
        var plant=actor("plant_observer","41000000-0000-0000-0000-000000000001","PLANT_MANAGER");
        String id=report(reporter);
        assertFalse(getJson(plant,"/api/v1/safety/workflow/context").path("canManage").asBoolean());
        assertFalse(getJson(plant,"/api/v1/safety/workflow/context").path("canReport").asBoolean());
        assertEquals(id,getJson(plant,path(id)).path("hazard").path("id").asText());
        postJson(plant,path(id)+"/assignment",assignment(1,"41000000-0000-0000-0000-000000000005"),403);
        postJson(plant,"/api/v1/safety/hazards",Map.of("location","测试","description","管理层不能代报"),403);
        for(String endpoint:List.of("/inspection/summary","/inspection/statistics","/inspection/plans","/inspection/tasks","/hazards"))
            call(technical,get("/api/v1/safety"+endpoint),403);
    }
    @Test void revocationExpiryAndInactiveIdentityBlockExistingRequests()throws Exception{
        String id=report(reporter);postJson(officer,path(id)+"/assignment",assignment(1,"41000000-0000-0000-0000-000000000005"),200);
        try{
            jdbc.sql("update user_role_scope set valid_until=now()-interval '1 second' where user_id=:id").param("id",owner.userId()).update();
            call(owner,get(path(id)),403);postJson(owner,path(id)+"/receipt",action(2,true),403);
            jdbc.sql("update user_role_scope set valid_until=null,valid_from=now()+interval '1 day' where user_id=:id").param("id",owner.userId()).update();call(owner,get(path(id)),403);
            jdbc.sql("update user_role_scope set valid_from=now()-interval '1 day' where user_id=:id").param("id",owner.userId()).update();
            jdbc.sql("update employee set status='LEFT' where id='41000000-0000-0000-0000-000000000005'").update();call(owner,get(path(id)),403);
        }finally{
            jdbc.sql("update user_role_scope set valid_until=null,valid_from=now()-interval '1 day' where user_id=:id").param("id",owner.userId()).update();
            jdbc.sql("update employee set status='ACTIVE' where id='41000000-0000-0000-0000-000000000005'").update();
        }
        postJson(owner,path(id)+"/receipt",action(2,true),200);
        try{
            jdbc.sql("update role set status='INACTIVE' where code='SAFETY_MANAGER'").update();call(officer,get(path(id)),403);
        }finally{jdbc.sql("update role set status='ACTIVE' where code='SAFETY_MANAGER'").update();}
        assertEquals(3,hazard(id).path("revision").asInt());
    }
    @Test void otherSiteRoleCannotBeCombinedWithLocalExecutorGrant()throws Exception{
        String id=report(reporter);
        jdbc.sql("insert into user_role_scope(id,tenant_id,user_id,role_id,scope_type,scope_id) select gen_random_uuid(),r.tenant_id,:user,r.id,'SITE',cast(:site as uuid) from role r where r.code='SAFETY_MANAGER' and r.tenant_id=cast(:tenant as uuid) on conflict do nothing").param("user",owner.userId()).param("site",OTHER).param("tenant",TENANT).update();
        var stale=new CurrentUser(owner.userId(),owner.tenantId(),owner.username(),owner.displayName(),false,Set.of("inspection:read","inspection:manage","hazard:read","hazard:manage"));
        call(stale,get(path(id)),403);postJson(stale,path(id)+"/assignment",assignment(1,"41000000-0000-0000-0000-000000000005"),403);
    }
    @Test void legacySummaryUsesOnlyVisibleRecords()throws Exception{
        report(reporter);report(owner);task(template("SOURCE-SPRING").path("id").asText());
        var visible=getJson(owner,"/api/v1/safety/hazards");var summary=getJson(owner,"/api/v1/safety/inspection/summary");
        long open=0;for(var h:visible)if(!h.path("status").asText().equals("CLOSED"))open++;
        assertEquals(open,summary.path("openHazards").asLong());
        assertEquals(visible.size(),getJson(owner,"/api/v1/safety/inspection/statistics").path("totalHazards").asInt());
        assertEquals(0,summary.path("pendingTasks").asInt());
    }
}
