package com.waterx.safety;
import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;
import com.waterx.safety.auth.*;
import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.*;
import org.springframework.test.web.servlet.*;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import java.util.*;
import static com.waterx.safety.DailyDataTestFixture.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
@SpringBootTest @AutoConfigureMockMvc
class ProcessArchiveIntegrationTest {
 static final EmbeddedPostgres PG=start();static EmbeddedPostgres start(){try{return EmbeddedPostgres.builder().start();}catch(Exception e){throw new ExceptionInInitializerError(e);}}
 @DynamicPropertySource static void properties(DynamicPropertyRegistry p){p.add("spring.datasource.url",()->PG.getJdbcUrl("postgres","postgres"));p.add("spring.datasource.username",()->"postgres");p.add("spring.datasource.password",()->"");p.add("app.bootstrap.admin-username",()->"archive_test_admin");p.add("app.bootstrap.admin-password",()->"Archive-Test-Only-2026!");p.add("app.storage.local-dir",()->"/private/tmp/waterx-collaboration-b2/test-attachments");}
 @AfterAll static void stop()throws Exception{PG.close();}
 @Autowired MockMvc mvc;@Autowired JdbcClient db;@Autowired ObjectMapper json;@Autowired PasswordEncoder encoder;
 final CurrentUser manager=user("manager_a"),backup=user("manager_b"),owner=user("operator_a"),observer=user("plant_manager");
 final String base="/api/v1/process/archive",daily="/api/v1/process/daily";
 @BeforeEach void reset()throws Exception{db.sql("truncate process_daily_record,process_parameter cascade").update();db.sql("delete from user_role_scope where user_id in(select id from user_account where username like 'pd_%')").update();seed(db,encoder,"Archive-Test-Only-2026!");}
 JsonNode call(CurrentUser u,UUID site,MockHttpServletRequestBuilder request,int code)throws Exception{var r=mvc.perform(request.with(authentication(new CurrentUserAuthentication(u))).header("X-Site-Id",site)).andExpect(status().is(code)).andReturn().getResponse();return r.getContentAsString().isBlank()?json.nullNode():json.readTree(r.getContentAsString());}
 JsonNode getAs(CurrentUser u,String path,int code)throws Exception{return call(u,SITE,get(path),code);}
 JsonNode postAs(CurrentUser u,String path,Object body,int code)throws Exception{return call(u,SITE,post(path).contentType("application/json").content(json.writeValueAsString(body)),code);}
 ObjectNode content(String kind){ObjectNode n=json.createObjectNode();n.put("name",kind.equals("DESIGN")?"设计参考":"常规工况").put("basis","试点验证依据，须由项目人员校核").put("reason","建立首版").put("from","2026-01-01").put("to","2026-12-31").put("status","ACTIVE").put("impact","ROUTINE");if(kind.equals("DESIGN"))n.putObject("values").put("水量控制::设计处理水量","10");else n.putObject("targets").putObject("水量控制::日进水量").put("value","10").put("mode","POINT").put("warning",10).put("alarm",50);return n;}
 JsonNode parameter(CurrentUser u,String kind,int revision,JsonNode content,boolean publish,int code)throws Exception{return postAs(u,base+"/parameters/"+LINE+"/"+kind+"/"+(publish?"publish":"draft"),Map.of("revision",revision,"content",content),code);}
 void parameters()throws Exception{parameter(manager,"DESIGN",0,content("DESIGN"),true,200);parameter(manager,"TARGET",0,content("TARGET"),true,200);}
 String confirmed()throws Exception{String id=postAs(manager,daily,Map.of("lineId",LINE,"date","2026-09-07","assigneeId",id("operator_a-employee"),"reviewerId",id("manager_a-employee"),"note","填报日数据"),200).path("id").asText();postAs(owner,daily+"/"+id+"/save",Map.of("revision",1,"note","日累计","cells",Map.of("水量控制::日进水量",Map.of("value","0","state","VALID","source","MANUAL","note","真实零值"))),200);act(owner,id,"submit",2);act(manager,id,"confirm",3);return id;}
 void act(CurrentUser u,String id,String action,int revision)throws Exception{postAs(u,daily+"/"+id+"/"+action,Map.of("revision",revision,"note","核对依据后办理"),200);}
 JsonNode generate(String record,int code)throws Exception{return postAs(manager,base+"/reports",Map.of("recordId",record,"note","根据确认数据分析"),code);}
 JsonNode saveReport(CurrentUser u,JsonNode r,int code)throws Exception{return postAs(u,base+"/reports/"+r.path("id").asText()+"/save",Map.of("sourceStamp",r.path("source_stamp").asText(),"note","校核来源后保存"),code);}
 String reportPath(JsonNode r){return base+"/reports/"+r.path("id").asText();}
 @Test void immutableSnapshotsAndSourceChanges()throws Exception{
  parameters();String record=confirmed();var draft=generate(record,200);assertEquals(138,draft.path("rows").size());assertEquals(1,draft.path("source").path("entry").path("version").asInt());var old=saveReport(manager,draft,200);assertFalse(old.path("sourceChanged").asBoolean());
  var target=content("TARGET");((ObjectNode)target.path("targets").path("水量控制::日进水量")).put("value","20");parameter(manager,"TARGET",1,target,false,200);assertFalse(getAs(observer,reportPath(old),200).path("sourceChanged").asBoolean());
  var pending=generate(record,200);parameter(manager,"TARGET",2,target,true,200);saveReport(manager,pending,409);var stale=getAs(observer,reportPath(old),200);assertTrue(stale.path("sourceChanged").asBoolean());assertEquals(old.path("rows"),stale.path("rows"));assertEquals(old.path("source"),stale.path("source"));
  var newer=saveReport(manager,generate(record,200),200);assertEquals(2,newer.path("source").path("target").path("version").asInt());assertEquals(1,newer.path("source").path("entry").path("version").asInt());saveReport(manager,newer,409);
 }
 @Test void pendingCorrectionBlocksNewReportsAndSaveButPreservesHistory()throws Exception{
  parameters();String record=confirmed();var old=saveReport(manager,generate(record,200),200);var draft=generate(record,200);act(owner,record,"correct",4);generate(record,409);saveReport(manager,draft,409);assertTrue(getAs(observer,reportPath(old),200).path("sourceChanged").asBoolean());
  act(owner,record,"submit",5);act(manager,record,"confirm",6);var current=saveReport(manager,generate(record,200),200);assertEquals(2,current.path("source").path("entry").path("version").asInt());assertEquals(old.path("rows"),getAs(observer,reportPath(old),200).path("rows"));
 }
 @Test void necessaryApprovalIsNotGrantedByManagementTitleAndScopesAreLive()throws Exception{
  for(CurrentUser u:List.of(owner,observer,user("equipment_manager"),user("safety_a")))parameter(u,"DESIGN",0,content("DESIGN"),true,403);
  var major=content("DESIGN").put("impact","MAJOR");parameter(manager,"DESIGN",0,major,false,200);parameter(manager,"DESIGN",1,major,true,409);assertEquals(0,getAs(manager,base+"/parameters?line="+LINE,200).get(0).path("published_version").asInt());
  parameter(manager,"DESIGN",1,content("DESIGN"),true,200);parameter(manager,"DESIGN",1,content("DESIGN"),true,409);
  db.sql("delete from user_role_scope where user_id=:id").param("id",manager.userId()).update();grant(db,manager.userId(),"PROCESS_OBSERVER",SITE,LINE);grant(db,manager.userId(),"PROCESS_MANAGER",OTHER,LINE);grant(db,manager.userId(),"PROCESS_MANAGER",SITE,LINE_B);parameter(manager,"TARGET",0,content("TARGET"),true,403);getAs(manager,base+"/parameters?line="+LINE,200);
  db.sql("update user_role_scope set valid_until=now()-interval '1 second' where user_id=:id").param("id",manager.userId()).update();getAs(manager,base+"/parameters?line="+LINE,403);
 }
 @Test void readOnlyManagementDraftPrivacyCreatorAndExportAreEnforced()throws Exception{
  parameters();String record=confirmed();var draft=generate(record,200);getAs(observer,reportPath(draft),403);assertTrue(getAs(observer,base+"/reports?record="+record,200).isEmpty());saveReport(backup,draft,403);postAs(observer,base+"/reports",Map.of("recordId",record,"note","尝试生成"),403);var saved=saveReport(manager,draft,200);getAs(observer,reportPath(saved),200);getAs(observer,reportPath(saved)+"/export",403);getAs(owner,reportPath(saved)+"/export",403);getAs(manager,reportPath(saved)+"/export",200);getAs(user("operator_b"),reportPath(saved),403);call(manager,OTHER,get(reportPath(saved)),403);
  for(var p:getAs(observer,base+"/parameters?line="+LINE,200)){assertFalse(p.has("draft"));assertFalse(p.has("events"));}
 }
 @Test void matchingUsesBusinessDatePublishedVersionsAndRetirement()throws Exception{
  String record=confirmed();generate(record,409);parameters();var old=saveReport(manager,generate(record,200),200);var future=content("TARGET").put("from","2027-01-01").put("to","2027-12-31");parameter(manager,"TARGET",1,future,true,200);assertFalse(getAs(observer,reportPath(old),200).path("sourceChanged").asBoolean());var retired=content("TARGET").put("status","RETIRED");parameter(manager,"TARGET",2,retired,true,200);generate(record,409);assertTrue(getAs(observer,reportPath(old),200).path("sourceChanged").asBoolean());
 }
 @Test void invalidParametersAndFailedAuditNeverPublish()throws Exception{
  var bad=content("TARGET");((ObjectNode)bad.path("targets").path("水量控制::日进水量")).put("mode","RANGE").put("value","20～10");parameter(manager,"TARGET",0,bad,true,400);
  db.sql("create function archive_test_failure() returns trigger language plpgsql as 'begin raise exception ''simulated audit storage failure''; end'").update();db.sql("create trigger archive_test_failure before insert on process_parameter_event for each row execute function archive_test_failure()").update();try{assertThrows(Exception.class,()->parameter(manager,"DESIGN",0,content("DESIGN"),true,200));}finally{db.sql("drop trigger archive_test_failure on process_parameter_event").update();db.sql("drop function archive_test_failure()").update();}assertTrue(getAs(manager,base+"/parameters?line="+LINE,200).isEmpty());
 }
}
