package com.waterx.safety;

import com.fasterxml.jackson.databind.*;
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
import java.util.concurrent.*;
import static com.waterx.safety.DailyDataTestFixture.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest @AutoConfigureMockMvc
class DailyDataIntegrationTest {
    static final EmbeddedPostgres PG=start();
    static EmbeddedPostgres start(){try{return EmbeddedPostgres.builder().start();}catch(Exception e){throw new ExceptionInInitializerError(e);}}
    @DynamicPropertySource static void properties(DynamicPropertyRegistry p){p.add("spring.datasource.url",()->PG.getJdbcUrl("postgres","postgres"));p.add("spring.datasource.username",()->"postgres");p.add("spring.datasource.password",()->"");p.add("app.bootstrap.admin-username",()->"daily_test_admin");p.add("app.bootstrap.admin-password",()->"Daily-Integration-Only-2026!");p.add("app.storage.local-dir",()->"/private/tmp/waterx-personnel-impl/test-attachments");}
    @AfterAll static void stop()throws Exception{PG.close();}
    @Autowired MockMvc mvc;@Autowired JdbcClient db;@Autowired ObjectMapper json;@Autowired PasswordEncoder encoder;
    final String base="/api/v1/process/daily";final CurrentUser manager=user("manager_a"),backup=user("manager_b"),owner=user("operator_a"),other=user("operator_b"),observer=user("plant_manager");
    @BeforeEach void reset()throws Exception{
        db.sql("truncate process_daily_record cascade").update();
        db.sql("delete from user_role_scope where user_id in (select id from user_account where username like 'pd_%')").update();
        db.sql("update role set status='ACTIVE' where code like 'PROCESS_%'").update();
        seed(db,encoder,"Daily-Integration-Only-2026!");
    }
    JsonNode call(CurrentUser u,UUID site,MockHttpServletRequestBuilder request,int expected)throws Exception{
        var response=mvc.perform(request.with(authentication(new CurrentUserAuthentication(u))).header("X-Site-Id",site)).andExpect(status().is(expected)).andReturn().getResponse();
        return response.getContentAsString().isBlank()?json.nullNode():json.readTree(response.getContentAsString());
    }
    JsonNode getAs(CurrentUser u,String path,int expected)throws Exception{return call(u,SITE,get(path),expected);}
    JsonNode postAs(CurrentUser u,String path,Object input,int expected)throws Exception{return call(u,SITE,post(path).contentType("application/json").content(json.writeValueAsString(input)),expected);}
    String create()throws Exception{return postAs(manager,base,Map.of("lineId",LINE,"date","2026-09-07","assigneeId",id("operator_a-employee"),"reviewerId",id("manager_a-employee"),"note","按人工日累计与日均口径填报"),200).path("id").asText();}
    String path(String id){return base+"/"+id;}
    JsonNode detail(String id)throws Exception{return getAs(manager,path(id),200);}
    Map<String,Object> cell(String value,String state,String source,String note){return Map.of("value",value,"state",state,"source",source,"note",note);}
    Map<String,Object> cells(String value){return Map.of("水量控制::日进水量",cell(value,"VALID","MANUAL","当日累计"));}
    JsonNode act(CurrentUser u,String id,String action,int revision,int expected)throws Exception{return postAs(u,path(id)+"/"+action,Map.of("revision",revision,"note","核对原始台账后办理"),expected);}
    JsonNode save(CurrentUser u,String id,int revision,Map<String,Object> cells,int expected)throws Exception{return postAs(u,path(id)+"/save",Map.of("revision",revision,"cells",cells,"note","记录事实"),expected);}
    String submitted()throws Exception{String id=create();save(owner,id,1,cells("0"),200);act(owner,id,"submit",2,200);return id;}
    @Test void fullLoopCorrectionAndImmutableVersions()throws Exception{
        String id=submitted();getAs(manager,path(id)+"/analysis-source",409);
        act(manager,id,"return",3,200);save(owner,id,4,cells("7"),200);act(owner,id,"submit",5,200);var confirmed=act(manager,id,"confirm",6,200);
        assertEquals(1,confirmed.path("confirmed_version").asInt());assertEquals("7",confirmed.path("versions").get(0).path("cells").path("水量控制::日进水量").path("value").asText());
        save(owner,id,7,cells("9"),403);getAs(manager,path(id)+"/analysis-source",200);
        act(owner,id,"correct",7,200);save(owner,id,8,cells("8"),200);assertEquals(1,detail(id).path("confirmed_version").asInt());getAs(manager,path(id)+"/analysis-source",409);
        act(owner,id,"submit",9,200);act(manager,id,"confirm",10,200);var d=detail(id);
        assertEquals(2,d.path("versions").size());assertEquals("7",d.path("versions").get(0).path("cells").path("水量控制::日进水量").path("value").asText());assertEquals("8",getAs(manager,path(id)+"/analysis-source",200).path("cells").path("水量控制::日进水量").path("value").asText());
        assertEquals(11,d.path("events").size());assertEquals("运行工甲",d.path("events").get(1).path("actor_name").asText());
        act(owner,id,"correct",11,200);act(owner,id,"cancel",12,200);assertEquals(2,getAs(manager,path(id)+"/analysis-source",200).path("version").asInt());
    }
    @Test void independentAccountsRolesSiteLineAndExport()throws Exception{
        String id=submitted();save(other,id,3,cells("1"),403);getAs(other,path(id),403);
        assertTrue(getAs(other,base+"?line="+LINE,200).isEmpty());
        for(CurrentUser u:List.of(observer,user("equipment_manager"),user("lab_a"),user("safety_a"),user("maintenance_a")))act(u,id,"confirm",3,403);
        getAs(observer,path(id),200);getAs(observer,path(id)+"/export",403);getAs(owner,path(id)+"/export",403);getAs(manager,path(id)+"/export",200);
        call(manager,OTHER,get(path(id)),403);getAs(manager,base+"?line="+LINE_B,403);
        act(backup,id,"confirm",3,403);act(manager,id,"confirm",3,200);
        var admin=new CurrentUser(UUID.fromString("50000000-0000-0000-0000-000000000001"),TENANT,"admin","技术管理员",false,Set.of("process:daily:manage"));getAs(admin,path(id),403);
    }
    @Test void selfReviewCannotBeBypassedByAliasOrReassignment()throws Exception{
        String id=create();save(owner,id,1,cells("1"),200);
        grant(db,owner.userId(),"PROCESS_MANAGER",SITE,LINE);
        postAs(manager,path(id)+"/assign",Map.of("revision",2,"assigneeId",id("operator_b-employee"),"reviewerId",id("operator_a-employee"),"note","尝试改派给原填报人审核"),400);
        postAs(manager,path(id)+"/assign",Map.of("revision",2,"assigneeId",id("operator_b-employee"),"reviewerId",id("manager_a-employee"),"note","转交运行工乙"),200);
        save(owner,id,3,cells("9"),403);save(other,id,3,cells("2"),200);act(other,id,"submit",4,200);
        UUID alias=id("alias");db.sql("insert into user_account(id,tenant_id,employee_id,username,password_hash,status) values(:id,:tenant,:person,'pd_alias','unused','ACTIVE') on conflict(id) do update set status='ACTIVE'").param("id",alias).param("tenant",TENANT).param("person",id("operator_a-employee")).update();grant(db,alias,"PROCESS_MANAGER",SITE,LINE);
        // Even a later reviewer assignment by external administration cannot erase candidate participation.
        db.sql("update process_daily_record set reviewer_id=:person where id=cast(:id as uuid)").param("person",id("operator_a-employee")).param("id",id).update();
        act(new CurrentUser(alias,TENANT,"pd_alias","运行工甲另一账号",false,Set.of()),id,"confirm",5,403);
        assertEquals(0,detail(id).path("versions").size());
    }
    @Test void expiredRevokedAndInactiveAuthorizationsFailOnOldRequests()throws Exception{
        String id=submitted();
        db.sql("update user_role_scope set valid_until=now()-interval '1 second' where user_id=:id").param("id",manager.userId()).update();act(manager,id,"confirm",3,403);
        db.sql("update user_role_scope set valid_until=null,valid_from=now()+interval '1 day' where user_id=:id").param("id",manager.userId()).update();getAs(manager,path(id),403);
        db.sql("update user_role_scope set valid_from=now()-interval '1 day' where user_id=:id").param("id",manager.userId()).update();
        db.sql("update employee set status='LEFT' where id=:id").param("id",id("manager_a-employee")).update();act(manager,id,"confirm",3,403);
        db.sql("update employee set status='ACTIVE' where id=:id").param("id",id("manager_a-employee")).update();
        db.sql("delete from process_daily_line_scope where scope_id in(select id from user_role_scope where user_id=:id)").param("id",manager.userId()).update();act(manager,id,"confirm",3,403);
        assertEquals(0,getAs(observer,path(id),200).path("versions").size());
    }
    @Test void doesNotCombinePermissionFromOtherSiteOrLine()throws Exception{
        String id=submitted();db.sql("delete from user_role_scope where user_id=:id").param("id",manager.userId()).update();
        grant(db,manager.userId(),"PROCESS_OBSERVER",SITE,LINE);grant(db,manager.userId(),"PROCESS_MANAGER",OTHER,LINE);grant(db,manager.userId(),"PROCESS_MANAGER",SITE,LINE_B);
        getAs(manager,path(id),200);act(manager,id,"confirm",3,403);getAs(manager,path(id)+"/export",403);
    }
    @Test void sourceQualityZeroMissingNotesAndDemoAreDistinct()throws Exception{
        String id=create();act(owner,id,"submit",1,400);
        save(owner,id,1,Map.of("未知指标",cell("1","VALID","MANUAL","")),400);
        save(owner,id,1,Map.of("水量控制::日进水量",cell("0","VALID","DEMO","")),200);act(owner,id,"submit",2,400);
        save(owner,id,2,Map.of("水量控制::日进水量",cell("","NA","MANUAL","")),200);act(owner,id,"submit",3,400);
        save(owner,id,3,Map.of("水量控制::日进水量",cell("0","VALID","MANUAL","真实零值"),"进水水质::COD",cell("","INVALID","MANUAL","采样异常待复测")),200);
        act(owner,id,"submit",4,200);act(manager,id,"confirm",5,200);var c=detail(id).path("versions").get(0).path("cells");assertEquals("0",c.path("水量控制::日进水量").path("value").asText());assertEquals("INVALID",c.path("进水水质::COD").path("state").asText());assertFalse(c.has("出水水质::COD"));
    }
    @Test void concurrencyAndDuplicateDateAreAtomic()throws Exception{
        String id=submitted();postAs(manager,base,Map.of("lineId",LINE,"date","2026-09-07","assigneeId",id("operator_a-employee"),"reviewerId",id("manager_a-employee"),"note","重复分派"),409);
        ExecutorService executor=Executors.newFixedThreadPool(2);CountDownLatch ready=new CountDownLatch(2),go=new CountDownLatch(1);
        Callable<Integer> request=()->{ready.countDown();go.await();return mvc.perform(post(path(id)+"/confirm").with(authentication(new CurrentUserAuthentication(manager))).header("X-Site-Id",SITE).contentType("application/json").content("{\"revision\":3,\"note\":\"核对确认\"}")).andReturn().getResponse().getStatus();};
        try{var a=executor.submit(request);var b=executor.submit(request);assertTrue(ready.await(10,TimeUnit.SECONDS));go.countDown();assertEquals(Set.of(200,409),Set.of(a.get(20,TimeUnit.SECONDS),b.get(20,TimeUnit.SECONDS)));}finally{executor.shutdownNow();}
        var d=detail(id);assertEquals(1,d.path("versions").size());assertEquals(4,d.path("events").size());assertEquals(4,d.path("revision").asInt());
    }
    @Test void submittedContentAndExpiredAssigneeCannotBeChanged()throws Exception{
        String id=submitted();save(owner,id,3,cells("99"),403);act(owner,id,"cancel",3,403);
        act(manager,id,"return",3,200);db.sql("update user_account set status='DISABLED' where id=:id").param("id",owner.userId()).update();save(owner,id,4,cells("2"),403);
        assertEquals("0",getAs(observer,path(id),200).path("cells").path("水量控制::日进水量").path("value").asText());
    }
    @Test void auditFailureRollsBackConfirmationPointerAndVersion()throws Exception{
        String id=submitted();
        db.sql("create function daily_test_failure() returns trigger language plpgsql as 'begin raise exception ''simulated audit storage failure''; end'").update();
        db.sql("create trigger daily_test_failure before insert on process_daily_event for each row execute function daily_test_failure()").update();
        try{assertThrows(Exception.class,()->act(manager,id,"confirm",3,200));}
        finally{db.sql("drop trigger daily_test_failure on process_daily_event").update();db.sql("drop function daily_test_failure()").update();}
        var d=detail(id);assertEquals("SUBMITTED",d.path("state").asText());assertEquals(3,d.path("revision").asInt());assertEquals(0,d.path("confirmed_version").asInt());assertEquals(0,d.path("versions").size());assertEquals(3,d.path("events").size());
    }
    @Test void specialBasisAndDisabledRoleAreCheckedAtSubmission()throws Exception{
        String id=create();save(owner,id,1,cells("<0.02"),200);
        // Existing ordinary note records a basis; a missing basis must be blocked.
        save(owner,id,2,Map.of("水量控制::日进水量",cell("<0.02","VALID","MANUAL","")),200);act(owner,id,"submit",3,400);
        save(owner,id,3,Map.of("水量控制::日进水量",cell("<0.02","VALID","MANUAL","低于量程，按原始记录保留限定符")),200);act(owner,id,"submit",4,200);
        db.sql("update role set status='DISABLED' where code='PROCESS_MANAGER'").update();act(manager,id,"confirm",5,403);assertEquals(0,getAs(observer,path(id),200).path("versions").size());
    }

}
