package com.waterx.safety;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.nio.file.Path;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class SafetyApiIntegrationTest {
    private static final String ADMIN_PASSWORD = "Local-Test-Only-2026!";
    private static final EmbeddedPostgres POSTGRES = startPostgres();
    private static final Path ATTACHMENT_DIR = Path.of(System.getProperty("java.io.tmpdir"), "safety-platform-test-attachments");

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;

    @DynamicPropertySource
    static void databaseProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", () -> POSTGRES.getJdbcUrl("postgres", "postgres"));
        registry.add("spring.datasource.username", () -> "postgres");
        registry.add("spring.datasource.password", () -> "");
        registry.add("app.bootstrap.admin-username", () -> "admin");
        registry.add("app.bootstrap.admin-password", () -> ADMIN_PASSWORD);
        registry.add("app.storage.local-dir", ATTACHMENT_DIR::toString);
    }

    @AfterAll
    static void stopPostgres() throws IOException {
        POSTGRES.close();
    }

    @Test
    void loginAndReadBothPlantsWithOrganizationData() throws Exception {
        String loginResponse = mvc.perform(post("/api/v1/auth/login")
                .contentType("application/json")
                        .content(json.writeValueAsString(new Login("admin", ADMIN_PASSWORD))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andReturn().getResponse().getContentAsString();
        JsonNode tokens = json.readTree(loginResponse);
        String authorization = "Bearer " + tokens.path("accessToken").asText();

        mvc.perform(get("/api/v1/auth/me").header("Authorization", authorization))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mustChangePassword").value(true));

        mvc.perform(get("/api/v1/platform/sites").header("Authorization", authorization))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].code").value("DEMO-PLANT-01"))
                .andExpect(jsonPath("$[1].code").value("DEMO-PLANT-02"));

        mvc.perform(get("/api/v1/org/units")
                        .header("Authorization", authorization)
                        .header("X-Site-Id", "30000000-0000-0000-0000-000000000001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(7)));

        mvc.perform(get("/api/v1/org/employees")
                        .header("Authorization", authorization)
                        .header("X-Site-Id", "30000000-0000-0000-0000-000000000002"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));

        mvc.perform(get("/api/v1/risk/summary")
                        .header("Authorization", authorization)
                        .header("X-Site-Id", "30000000-0000-0000-0000-000000000001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(2))
                .andExpect(jsonPath("$.red").value(1))
                .andExpect(jsonPath("$.pending").value(1));

        mvc.perform(get("/api/v1/risk/hazards/85000000-0000-0000-0000-000000000001/measures")
                        .header("Authorization", authorization)
                        .header("X-Site-Id", "30000000-0000-0000-0000-000000000001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)))
                .andExpect(jsonPath("$[0].measureType").value("ENGINEERING"));

        mvc.perform(get("/api/v1/risk/areas")
                        .header("Authorization", authorization)
                        .header("X-Site-Id", "30000000-0000-0000-0000-000000000001"))
                .andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(2)));

        mvc.perform(get("/api/v1/risk/hazards/85000000-0000-0000-0000-000000000001/responsibilities")
                        .header("Authorization", authorization)
                        .header("X-Site-Id", "30000000-0000-0000-0000-000000000001"))
                .andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(2)));

        mvc.perform(post("/api/v1/risk/hazards/85000000-0000-0000-0000-000000000001/acknowledge")
                        .header("Authorization", authorization)
                        .header("X-Site-Id", "30000000-0000-0000-0000-000000000001")
                        .header("X-Client-Source", "H5"))
                .andExpect(status().isOk());
        mvc.perform(get("/api/v1/risk/acknowledgements/me")
                        .header("Authorization", authorization)
                        .header("X-Site-Id", "30000000-0000-0000-0000-000000000001"))
                .andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].hazardId").value("85000000-0000-0000-0000-000000000001"));

        String reassessed = mvc.perform(post("/api/v1/risk/hazards/85000000-0000-0000-0000-000000000001/reassess")
                        .header("Authorization", authorization)
                        .header("X-Site-Id", "30000000-0000-0000-0000-000000000001")
                        .contentType("application/json")
                        .content("{\"method\":\"LS\",\"likelihood\":2,\"severity\":2,\"reason\":\"防护设施改造后复评\"}"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.riskColor").value("BLUE"))
                .andReturn().getResponse().getContentAsString();
        String reassessmentId = json.readTree(reassessed).path("id").asText();
        mvc.perform(get("/api/v1/risk/hazards/85000000-0000-0000-0000-000000000001/assessments")
                        .header("Authorization", authorization)
                        .header("X-Site-Id", "30000000-0000-0000-0000-000000000001"))
                .andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].approvalStatus").value("PENDING_REVIEW"));
        mvc.perform(post("/api/v1/risk/assessments/" + reassessmentId + "/review")
                        .header("Authorization", authorization)
                        .header("X-Site-Id", "30000000-0000-0000-0000-000000000001")
                        .contentType("application/json")
                        .content("{\"decision\":\"APPROVE\",\"comment\":\"同意调整风险等级\"}"))
                .andExpect(status().isOk());
        mvc.perform(get("/api/v1/risk/acknowledgements/me")
                        .header("Authorization", authorization)
                        .header("X-Site-Id", "30000000-0000-0000-0000-000000000001"))
                .andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(0)));

        String created = mvc.perform(post("/api/v1/risk/hazards")
                        .header("Authorization", authorization)
                        .header("X-Site-Id", "30000000-0000-0000-0000-000000000001")
                        .contentType("application/json")
                        .content("""
                                {"riskObjectId":"83000000-0000-0000-0000-000000000001","code":"HZ-P01-TEST",
                                "hazardFactor":"测试危险因素","possibleAccident":"测试事故后果","accidentType":"其他伤害",
                                "identifiedOn":"2026-07-21","nextReviewOn":"2027-07-21"}
                                """))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        String hazardId = json.readTree(created).path("id").asText();

        mvc.perform(post("/api/v1/risk/hazards/" + hazardId + "/assessments")
                        .header("Authorization", authorization)
                        .header("X-Site-Id", "30000000-0000-0000-0000-000000000001")
                        .contentType("application/json")
                        .content("{\"method\":\"LS\",\"likelihood\":4,\"severity\":4}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.riskLevel").value(2))
                .andExpect(jsonPath("$.riskColor").value("ORANGE"));

        mvc.perform(put("/api/v1/risk/hazards/" + hazardId + "/measures")
                        .header("Authorization", authorization)
                        .header("X-Site-Id", "30000000-0000-0000-0000-000000000001")
                        .contentType("application/json")
                        .content("[{\"measureType\":\"MANAGEMENT\",\"content\":\"执行现场管理措施\"}]"))
                .andExpect(status().isOk());

        mvc.perform(post("/api/v1/risk/hazards/" + hazardId + "/submit")
                        .header("Authorization", authorization)
                        .header("X-Site-Id", "30000000-0000-0000-0000-000000000001"))
                .andExpect(status().isOk());
        mvc.perform(post("/api/v1/risk/hazards/" + hazardId + "/review")
                        .header("Authorization", authorization)
                        .header("X-Site-Id", "30000000-0000-0000-0000-000000000001")
                        .contentType("application/json")
                        .content("{\"decision\":\"APPROVE\",\"comment\":\"测试审核通过\"}"))
                .andExpect(status().isOk());

        mvc.perform(get("/api/v1/safety/inspection/summary")
                        .header("Authorization", authorization)
                        .header("X-Site-Id", "30000000-0000-0000-0000-000000000001"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.pendingTasks").value(1))
                .andExpect(jsonPath("$.openHazards").value(3)).andExpect(jsonPath("$.pendingReview").value(1))
                .andExpect(jsonPath("$.overdueHazards").value(1));
        mvc.perform(get("/api/v1/safety/inspection/statistics")
                        .header("Authorization", authorization)
                        .header("X-Site-Id", "30000000-0000-0000-0000-000000000001"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalHazards").value(3))
                .andExpect(jsonPath("$.plantLevel").value(1));
        mvc.perform(get("/api/v1/safety/inspection/templates")
                        .header("Authorization", authorization)
                        .header("X-Site-Id", "30000000-0000-0000-0000-000000000001"))
                .andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(3)));
        mvc.perform(get("/api/v1/safety/inspection/tasks")
                        .header("Authorization", authorization)
                        .header("X-Site-Id", "30000000-0000-0000-0000-000000000001"))
                .andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(2)));
        mvc.perform(get("/api/v1/safety/hazards")
                        .header("Authorization", authorization)
                        .header("X-Site-Id", "30000000-0000-0000-0000-000000000001"))
                .andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(3)))
                .andExpect(jsonPath("$[0].escalationLevel").value("PLANT"))
                .andExpect(jsonPath("$[0].overdueDays").value(9));
        mvc.perform(post("/api/v1/safety/hazards/83000000-0000-0000-0000-000000000001/reminders")
                        .header("Authorization", authorization)
                        .header("X-Site-Id", "30000000-0000-0000-0000-000000000001")
                        .contentType("application/json").content("{\"message\":\"请尽快完成整改并反馈\"}"))
                .andExpect(status().isOk());
        MockMultipartFile photo = new MockMultipartFile("file", "现场照片.png", "image/png", new byte[]{1, 2, 3, 4});
        String attachmentResponse = mvc.perform(multipart("/api/v1/safety/hazards/83000000-0000-0000-0000-000000000001/attachments")
                        .file(photo).param("stage", "DISCOVERY")
                        .header("Authorization", authorization)
                        .header("X-Site-Id", "30000000-0000-0000-0000-000000000001"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.originalName").value("现场照片.png"))
                .andReturn().getResponse().getContentAsString();
        String attachmentId = json.readTree(attachmentResponse).path("id").asText();
        mvc.perform(get("/api/v1/safety/hazards/83000000-0000-0000-0000-000000000001/attachments")
                        .header("Authorization", authorization)
                        .header("X-Site-Id", "30000000-0000-0000-0000-000000000001"))
                .andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].stage").value("DISCOVERY"));
        mvc.perform(get("/api/v1/safety/hazards/83000000-0000-0000-0000-000000000001/attachments/" + attachmentId + "/download")
                        .header("Authorization", authorization)
                        .header("X-Site-Id", "30000000-0000-0000-0000-000000000001"))
                .andExpect(status().isOk());
        MockMultipartFile rejected = new MockMultipartFile("file", "脚本.txt", "text/plain", "not allowed".getBytes());
        mvc.perform(multipart("/api/v1/safety/hazards/83000000-0000-0000-0000-000000000001/attachments")
                        .file(rejected).param("stage", "DISCOVERY")
                        .header("Authorization", authorization)
                        .header("X-Site-Id", "30000000-0000-0000-0000-000000000001"))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/v1/safety/hazards/83000000-0000-0000-0000-000000000001/rectification")
                        .header("Authorization", authorization)
                        .header("X-Site-Id", "30000000-0000-0000-0000-000000000001")
                        .contentType("application/json").content("{\"completionNote\":\"已完成管路检修并测试合格\"}"))
                .andExpect(status().isOk());
        mvc.perform(post("/api/v1/safety/hazards/83000000-0000-0000-0000-000000000001/review")
                        .header("Authorization", authorization)
                        .header("X-Site-Id", "30000000-0000-0000-0000-000000000001")
                        .contentType("application/json").content("{\"passed\":true,\"comment\":\"现场复查合格\"}"))
                .andExpect(status().isOk());

        mvc.perform(get("/api/v1/safety/inspection/tasks/82000000-0000-0000-0000-000000000001/items")
                        .header("Authorization", authorization)
                        .header("X-Site-Id", "30000000-0000-0000-0000-000000000001"))
                .andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(3)));
        mvc.perform(post("/api/v1/safety/inspection/tasks/82000000-0000-0000-0000-000000000001/complete")
                        .header("Authorization", authorization)
                        .header("X-Site-Id", "30000000-0000-0000-0000-000000000001")
                        .contentType("application/json").content("""
                            {"items":[
                              {"itemId":"81000000-0000-0000-0000-000000000001","result":"COMPLIANT"},
                              {"itemId":"81000000-0000-0000-0000-000000000002","result":"COMPLIANT"},
                              {"itemId":"81000000-0000-0000-0000-000000000003","result":"NON_COMPLIANT","problemDescription":"洗眼器水压不足","handlingMeasure":"检修供水管路","hazardLevel":"GENERAL","dueDate":"2026-07-30"}
                            ]}
                            """))
                .andExpect(status().isOk()).andExpect(jsonPath("$.hazardsCreated").value(1));
        mvc.perform(get("/api/v1/safety/inspection/summary")
                        .header("Authorization", authorization)
                        .header("X-Site-Id", "30000000-0000-0000-0000-000000000001"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.pendingTasks").value(0))
                .andExpect(jsonPath("$.openHazards").value(3));
        mvc.perform(get("/api/v1/safety/inspection/plans")
                        .header("Authorization", authorization)
                        .header("X-Site-Id", "30000000-0000-0000-0000-000000000001"))
                .andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].scheduleType").value("DAILY"))
                .andExpect(jsonPath("$[0].changeCount").value(0));
        mvc.perform(post("/api/v1/safety/inspection/plans/84000000-0000-0000-0000-000000000001/status")
                        .header("Authorization", authorization)
                        .header("X-Site-Id", "30000000-0000-0000-0000-000000000001")
                        .contentType("application/json").content("{\"action\":\"PAUSE\",\"reason\":\"测试暂停\"}"))
                .andExpect(status().isOk());
        mvc.perform(post("/api/v1/safety/inspection/plans/84000000-0000-0000-0000-000000000001/status")
                        .header("Authorization", authorization)
                        .header("X-Site-Id", "30000000-0000-0000-0000-000000000001")
                        .contentType("application/json").content("{\"action\":\"RESUME\",\"reason\":\"测试恢复\"}"))
                .andExpect(status().isOk());
        mvc.perform(get("/api/v1/safety/inspection/plans")
                        .header("Authorization", authorization)
                        .header("X-Site-Id", "30000000-0000-0000-0000-000000000001"))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].status").value("ACTIVE"))
                .andExpect(jsonPath("$[0].changeCount").value(2));
        mvc.perform(post("/api/v1/safety/inspection/plans/generate")
                        .header("Authorization", authorization)
                        .header("X-Site-Id", "30000000-0000-0000-0000-000000000001"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.generatedCount").value(1));
        mvc.perform(post("/api/v1/safety/inspection/plans/generate")
                        .header("Authorization", authorization)
                        .header("X-Site-Id", "30000000-0000-0000-0000-000000000001"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.generatedCount").value(0));

        mvc.perform(get("/api/v1/safety/work-permits/templates")
                        .header("Authorization", authorization).header("X-Site-Id", "30000000-0000-0000-0000-000000000001"))
                .andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(10)));
        String permitCreated=mvc.perform(post("/api/v1/safety/work-permits")
                        .header("Authorization",authorization).header("X-Site-Id","30000000-0000-0000-0000-000000000001")
                        .contentType("application/json").content("""
                        {"templateId":"86000000-0000-0000-0000-000000000001","workUnit":"运维部","location":"提升泵房集水井",
                        "workContent":"检查液位计并清理井壁附着物","workLevel":"LEVEL_2","riskResult":"中毒窒息、淹溺、机械伤害",
                        "startAt":"2026-07-22T13:00:00+08:00","endAt":"2026-07-22T20:00:00+08:00","responsiblePerson":"张伟",
                        "guardian":"王强","workers":"李明、赵刚"}
                        """))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        String permitId=json.readTree(permitCreated).path("id").asText();
        mvc.perform(post("/api/v1/safety/work-permits/"+permitId+"/submit").header("Authorization",authorization).header("X-Site-Id","30000000-0000-0000-0000-000000000001")).andExpect(status().isOk());
        mvc.perform(post("/api/v1/safety/work-permits/"+permitId+"/review").header("Authorization",authorization).header("X-Site-Id","30000000-0000-0000-0000-000000000001").contentType("application/json").content("{\"approved\":true,\"comment\":\"安全措施符合要求\"}")).andExpect(status().isOk());
        mvc.perform(post("/api/v1/safety/work-permits/"+permitId+"/review").header("Authorization",authorization).header("X-Site-Id","30000000-0000-0000-0000-000000000001").contentType("application/json").content("{\"approved\":true,\"comment\":\"批准实施\"}")).andExpect(status().isOk());
        String permitMeasures=mvc.perform(get("/api/v1/safety/work-permits/"+permitId+"/measures").header("Authorization",authorization).header("X-Site-Id","30000000-0000-0000-0000-000000000001"))
                .andExpect(status().isOk()).andExpect(jsonPath("$",hasSize(4))).andReturn().getResponse().getContentAsString();
        JsonNode measureNodes=json.readTree(permitMeasures);StringBuilder confirms=new StringBuilder("[");
        for(int i=0;i<measureNodes.size();i++){if(i>0)confirms.append(',');confirms.append("{\"measureId\":\"").append(measureNodes.get(i).path("measureId").asText()).append("\",\"involved\":true,\"confirmed\":true}");}confirms.append(']');
        mvc.perform(put("/api/v1/safety/work-permits/"+permitId+"/measures").header("Authorization",authorization).header("X-Site-Id","30000000-0000-0000-0000-000000000001").contentType("application/json").content(confirms.toString())).andExpect(status().isOk());
        mvc.perform(post("/api/v1/safety/work-permits/"+permitId+"/gas-tests").header("Authorization",authorization).header("X-Site-Id","30000000-0000-0000-0000-000000000001").contentType("application/json").content("{\"oxygen\":20.9,\"carbonMonoxide\":0,\"hydrogenSulfide\":0,\"combustibleGas\":0,\"testPoint\":\"井口\",\"testedBy\":\"王强\",\"testedAt\":\"2026-07-22T12:30:00+08:00\"}")).andExpect(status().isOk());
        mvc.perform(post("/api/v1/safety/work-permits/"+permitId+"/briefings").header("Authorization",authorization).header("X-Site-Id","30000000-0000-0000-0000-000000000001").contentType("application/json").content("{\"content\":\"已交底风险和应急撤离要求\",\"participantNames\":\"李明、赵刚\"}")).andExpect(status().isOk());
        mvc.perform(post("/api/v1/safety/work-permits/"+permitId+"/start").header("Authorization",authorization).header("X-Site-Id","30000000-0000-0000-0000-000000000001")).andExpect(status().isOk());
        mvc.perform(post("/api/v1/safety/work-permits/"+permitId+"/close").header("Authorization",authorization).header("X-Site-Id","30000000-0000-0000-0000-000000000001")).andExpect(status().isOk());
        mvc.perform(get("/api/v1/safety/work-permits").header("Authorization",authorization).header("X-Site-Id","30000000-0000-0000-0000-000000000001"))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].status").value("CLOSED")).andExpect(jsonPath("$[0].involvedCount").value(4))
                .andExpect(jsonPath("$[0].gasTestCount").value(1)).andExpect(jsonPath("$[0].briefingCount").value(1));

        mvc.perform(get("/api/v1/safety/training/courses").header("Authorization",authorization).header("X-Site-Id","30000000-0000-0000-0000-000000000001"))
                .andExpect(status().isOk()).andExpect(jsonPath("$",hasSize(3)));
        String trainingJson=mvc.perform(get("/api/v1/safety/training/assignments").header("Authorization",authorization).header("X-Site-Id","30000000-0000-0000-0000-000000000001"))
                .andExpect(status().isOk()).andExpect(jsonPath("$",hasSize(1))).andReturn().getResponse().getContentAsString();
        String trainingId=json.readTree(trainingJson).get(0).path("id").asText();
        mvc.perform(post("/api/v1/safety/training/assignments/"+trainingId+"/complete").header("Authorization",authorization).header("X-Site-Id","30000000-0000-0000-0000-000000000001").contentType("application/json").content("{\"score\":95}"))
                .andExpect(status().isOk());
        mvc.perform(get("/api/v1/safety/training/summary").header("Authorization",authorization).header("X-Site-Id","30000000-0000-0000-0000-000000000001"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.courseCount").value(3)).andExpect(jsonPath("$.completedAssignments").value(1)).andExpect(jsonPath("$.expiringQualifications").value(1));
        mvc.perform(get("/api/v1/safety/training/qualifications").header("Authorization",authorization).header("X-Site-Id","30000000-0000-0000-0000-000000000001"))
                .andExpect(status().isOk()).andExpect(jsonPath("$",hasSize(2))).andExpect(jsonPath("$[0].status").value("EXPIRING"));
        mvc.perform(get("/api/v1/safety/assets/summary").header("Authorization",authorization).header("X-Site-Id","30000000-0000-0000-0000-000000000001"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.total").value(5)).andExpect(jsonPath("$.specialEquipment").value(2)).andExpect(jsonPath("$.emergencyAndFire").value(3)).andExpect(jsonPath("$.dueSoon").value(2));
        mvc.perform(get("/api/v1/safety/assets").header("Authorization",authorization).header("X-Site-Id","30000000-0000-0000-0000-000000000001"))
                .andExpect(status().isOk()).andExpect(jsonPath("$",hasSize(5)));
        mvc.perform(post("/api/v1/safety/assets/89000000-0000-0000-0000-000000000001/maintenance").header("Authorization",authorization).header("X-Site-Id","30000000-0000-0000-0000-000000000001").contentType("application/json").content("{\"maintenanceType\":\"ANNUAL_INSPECTION\",\"performedOn\":\"2026-07-22\",\"performedBy\":\"测试检验机构\",\"result\":\"QUALIFIED\",\"description\":\"年度检验合格\",\"nextDueOn\":\"2027-07-22\",\"cost\":1200}"))
                .andExpect(status().isOk());
        mvc.perform(get("/api/v1/safety/assets").header("Authorization",authorization).header("X-Site-Id","30000000-0000-0000-0000-000000000001"))
                .andExpect(status().isOk()).andExpect(jsonPath("$[?(@.id == '89000000-0000-0000-0000-000000000001')].maintenanceCount").value(hasItem(1)));
        mvc.perform(get("/api/v1/safety/occupational-health/summary").header("Authorization",authorization).header("X-Site-Id","30000000-0000-0000-0000-000000000001"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.activeFactors").value(2)).andExpect(jsonPath("$.monitoringDue").value(1)).andExpect(jsonPath("$.examRecords").value(1)).andExpect(jsonPath("$.examDue").value(1));
        mvc.perform(get("/api/v1/safety/occupational-health/factors").header("Authorization",authorization).header("X-Site-Id","30000000-0000-0000-0000-000000000001"))
                .andExpect(status().isOk()).andExpect(jsonPath("$",hasSize(2))).andExpect(jsonPath("$[0].dueStatus").value("DUE_SOON"));
        mvc.perform(post("/api/v1/safety/occupational-health/exams").header("Authorization",authorization).header("X-Site-Id","30000000-0000-0000-0000-000000000001").contentType("application/json").content("{\"employeeId\":\"41000000-0000-0000-0000-000000000004\",\"examType\":\"PERIODIC\",\"examDate\":\"2026-07-22\",\"medicalInstitution\":\"测试职业健康检查机构\",\"conclusion\":\"FIT\",\"followUpAction\":\"继续做好个体防护\",\"nextExamOn\":\"2027-07-22\"}"))
                .andExpect(status().isOk());
        mvc.perform(get("/api/v1/safety/occupational-health/exams").header("Authorization",authorization).header("X-Site-Id","30000000-0000-0000-0000-000000000001"))
                .andExpect(status().isOk()).andExpect(jsonPath("$",hasSize(2)));
        mvc.perform(get("/api/v1/safety/investment/summary").header("Authorization",authorization).header("X-Site-Id","30000000-0000-0000-0000-000000000001"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.plannedAmount").value(200000)).andExpect(jsonPath("$.spentAmount").value(23000)).andExpect(jsonPath("$.remainingAmount").value(177000));
        mvc.perform(post("/api/v1/safety/investment/expenses").header("Authorization",authorization).header("X-Site-Id","30000000-0000-0000-0000-000000000001").contentType("application/json").content("{\"budgetId\":\"91000000-0000-0000-0000-000000000003\",\"expenseDate\":\"2026-07-22\",\"amount\":2000,\"purpose\":\"应急演练耗材\",\"vendor\":\"测试供应商\",\"invoiceNo\":\"TEST-001\",\"recordedBy\":\"安全经理\"}"))
                .andExpect(status().isOk());
        mvc.perform(get("/api/v1/safety/investment/expenses").header("Authorization",authorization).header("X-Site-Id","30000000-0000-0000-0000-000000000001"))
                .andExpect(status().isOk()).andExpect(jsonPath("$",hasSize(3)));
        MockMultipartFile trainingMaterial=new MockMultipartFile("file","有限空间培训.pptx","application/vnd.openxmlformats-officedocument.presentationml.presentation","training-content".getBytes());
        mvc.perform(multipart("/api/v1/safety/education/courses/88000000-0000-0000-0000-000000000002/materials").file(trainingMaterial).header("Authorization",authorization).header("X-Site-Id","30000000-0000-0000-0000-000000000001"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.originalName").value("有限空间培训.pptx"));
        mvc.perform(get("/api/v1/safety/education/courses/88000000-0000-0000-0000-000000000002/materials").header("Authorization",authorization).header("X-Site-Id","30000000-0000-0000-0000-000000000001"))
                .andExpect(status().isOk()).andExpect(jsonPath("$",hasSize(1)));
        String commitmentsJson=mvc.perform(get("/api/v1/safety/education/commitments").header("Authorization",authorization).header("X-Site-Id","30000000-0000-0000-0000-000000000001"))
                .andExpect(status().isOk()).andExpect(jsonPath("$",hasSize(1))).andExpect(jsonPath("$[0].status").value("PENDING")).andReturn().getResponse().getContentAsString();
        String commitmentId=json.readTree(commitmentsJson).get(0).path("id").asText();
        mvc.perform(post("/api/v1/safety/education/commitments/"+commitmentId+"/sign").header("Authorization",authorization).header("X-Site-Id","30000000-0000-0000-0000-000000000001").contentType("application/json").content("{\"signatureText\":\"运行人员\"}"))
                .andExpect(status().isOk());
        mvc.perform(get("/api/v1/org/employees/41000000-0000-0000-0000-000000000005/safety-archive").header("Authorization",authorization).header("X-Site-Id","30000000-0000-0000-0000-000000000001"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.employee.displayName").value("运行人员（示例）"))
                .andExpect(jsonPath("$.trainings",hasSize(1))).andExpect(jsonPath("$.qualifications",hasSize(1)))
                .andExpect(jsonPath("$.commitments",hasSize(1))).andExpect(jsonPath("$.commitments[0].status").value("SIGNED"))
                .andExpect(jsonPath("$.healthExams",hasSize(1)));
        mvc.perform(get("/api/v1/safety/training/statistics?from=2020-01-01&to=2030-12-31").header("Authorization",authorization).header("X-Site-Id","30000000-0000-0000-0000-000000000001"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.assignedCount").value(1)).andExpect(jsonPath("$.completedCount").value(1));
        mvc.perform(post("/api/v1/safety/training/courses").header("Authorization",authorization).header("X-Site-Id","30000000-0000-0000-0000-000000000001").contentType("application/json").content("{\"code\":\"TRAIN-TEST-001\",\"name\":\"测试年度安全再教育\",\"courseType\":\"PERIODIC\",\"materialType\":\"DOCUMENT\",\"durationMinutes\":30,\"passingScore\":80}"))
                .andExpect(status().isOk());
        mvc.perform(post("/api/v1/safety/training/qualifications").header("Authorization",authorization).header("X-Site-Id","30000000-0000-0000-0000-000000000001").contentType("application/json").content("{\"employeeId\":\"41000000-0000-0000-0000-000000000004\",\"qualificationType\":\"SPECIAL_EQUIPMENT\",\"certificateName\":\"特种设备安全管理证\",\"certificateNo\":\"TEST-CERT-001\",\"issuingAuthority\":\"测试发证机构\",\"issuedOn\":\"2026-07-22\",\"expiresOn\":\"2027-07-22\",\"reminderDays\":30}"))
                .andExpect(status().isOk());
        mvc.perform(post("/api/v1/safety/investment/budgets").header("Authorization",authorization).header("X-Site-Id","30000000-0000-0000-0000-000000000001").contentType("application/json").content("{\"budgetYear\":2027,\"category\":\"检测检验\",\"plannedAmount\":25000,\"description\":\"年度安全检测检验费用\"}"))
                .andExpect(status().isOk());
        String factorJson=mvc.perform(post("/api/v1/safety/occupational-health/factors").header("Authorization",authorization).header("X-Site-Id","30000000-0000-0000-0000-000000000001").contentType("application/json").content("{\"factorName\":\"次氯酸钠\",\"factorType\":\"CHEMICAL\",\"location\":\"消毒加药间\",\"exposedPositions\":\"运行人员\",\"limitValue\":\"按现行职业接触限值\",\"controlMeasures\":\"密闭储存、机械通风并佩戴防护用品\",\"monitoringFrequency\":\"ANNUAL\",\"nextMonitoringOn\":\"2027-07-22\"}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        String factorId=json.readTree(factorJson).path("id").asText();
        mvc.perform(post("/api/v1/safety/occupational-health/factors/"+factorId+"/monitoring").header("Authorization",authorization).header("X-Site-Id","30000000-0000-0000-0000-000000000001").contentType("application/json").content("{\"monitoredOn\":\"2026-07-22\",\"result\":\"检测结果符合限值\",\"nextMonitoringOn\":\"2027-07-22\"}"))
                .andExpect(status().isOk());
        mvc.perform(post("/api/v1/safety/assets").header("Authorization",authorization).header("X-Site-Id","30000000-0000-0000-0000-000000000001").contentType("application/json").content("{\"assetNo\":\"TEST-FIRE-001\",\"assetName\":\"测试干粉灭火器\",\"assetType\":\"FIRE_EQUIPMENT\",\"category\":\"灭火器\",\"location\":\"中控室\",\"responsiblePerson\":\"安全员\",\"quantity\":2,\"unit\":\"具\",\"expiresOn\":\"2027-07-22\",\"reminderDays\":30}"))
                .andExpect(status().isOk());
        String templateJson=mvc.perform(post("/api/v1/safety/education/commitment-templates").header("Authorization",authorization).header("X-Site-Id","30000000-0000-0000-0000-000000000001").contentType("application/json").content("{\"code\":\"COMMIT-TEST-001\",\"name\":\"测试安全员岗位承诺书\",\"positionScope\":\"安全员\",\"content\":\"履行岗位安全职责，及时排查治理隐患。\",\"version\":\"2026-V1\"}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        String templateId=json.readTree(templateJson).path("id").asText();
        mvc.perform(post("/api/v1/safety/education/commitments").header("Authorization",authorization).header("X-Site-Id","30000000-0000-0000-0000-000000000001").contentType("application/json").content("{\"templateId\":\""+templateId+"\",\"employeeId\":\"41000000-0000-0000-0000-000000000003\",\"dueAt\":\"2026-08-10T08:00:00+08:00\"}"))
                .andExpect(status().isOk());
        mvc.perform(put("/api/v1/safety/visitors/briefing").header("Authorization",authorization).header("X-Site-Id","30000000-0000-0000-0000-000000000001").contentType("application/json").content("{\"title\":\"第一污水处理厂访客安全告知（测试）\",\"briefingContent\":\"进入生产区域前须完成安全告知。\",\"riskMapDescription\":\"按风险图避开重点风险区域。\",\"evacuationDescription\":\"按绿色路线撤离。\",\"emergencyContact\":\"中控室 100\"}"))
                .andExpect(status().isOk());
        mvc.perform(get("/api/v1/public/visitor/VISITOR-DEMO-PLANT-01"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.siteName").value("第一污水处理厂（示例）")).andExpect(jsonPath("$.title").value("第一污水处理厂访客安全告知（测试）"))
                .andExpect(jsonPath("$.riskMapUrl").value("/visitor-risk-map.svg"))
                .andExpect(jsonPath("$.evacuationMapUrl").value("/visitor-evacuation-map.svg"));
        mvc.perform(post("/api/v1/public/visitor/VISITOR-DEMO-PLANT-01/register").contentType("application/json").content("{\"visitorName\":\"测试访客\",\"mobile\":\"13800000000\",\"companyName\":\"测试单位\",\"visitPurpose\":\"现场交流\",\"hostName\":\"安全经理\",\"acknowledged\":true}"))
                .andExpect(status().isOk());
        mvc.perform(get("/api/v1/safety/visitors/records").header("Authorization",authorization).header("X-Site-Id","30000000-0000-0000-0000-000000000001"))
                .andExpect(status().isOk()).andExpect(jsonPath("$",hasSize(1))).andExpect(jsonPath("$[0].visitorName").value("测试访客"));
    }

    private static EmbeddedPostgres startPostgres() {
        try {
            return EmbeddedPostgres.builder().setPort(0).start();
        } catch (IOException exception) {
            throw new ExceptionInInitializerError(exception);
        }
    }

    private record Login(String username, String password) {}
}
