package com.waterx.safety.risk;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.waterx.safety.auth.CurrentUser;
import com.waterx.safety.common.BusinessException;
import com.waterx.safety.site.SiteAccessService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/risk")
public class RiskController {
    private final JdbcClient jdbc;
    private final SiteAccessService sites;
    private final RiskCalculator calculator;
    private final ObjectMapper json;

    public RiskController(JdbcClient jdbc, SiteAccessService sites, RiskCalculator calculator, ObjectMapper json) {
        this.jdbc = jdbc;
        this.sites = sites;
        this.calculator = calculator;
        this.json = json;
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAuthority('risk:read')")
    Summary summary(@AuthenticationPrincipal CurrentUser user, @RequestHeader("X-Site-Id") UUID siteId) {
        sites.requireSiteAccess(user, siteId);
        return jdbc.sql("""
                select count(h.id) total,
                       count(h.id) filter (where h.status='PENDING_REVIEW') pending,
                       count(a.id) filter (where a.risk_level=1) red,
                       count(a.id) filter (where a.risk_level=2) orange,
                       count(a.id) filter (where a.risk_level=3) yellow,
                       count(a.id) filter (where a.risk_level=4) blue
                from hazard_source h
                left join risk_assessment a on a.tenant_id=h.tenant_id and a.hazard_source_id=h.id and a.is_current
                where h.tenant_id=:tenantId and h.site_id=:siteId and h.status<>'INACTIVE'
                """).param("tenantId", user.tenantId()).param("siteId", siteId)
                .query((rs, n) -> new Summary(rs.getInt("total"), rs.getInt("pending"), rs.getInt("red"),
                        rs.getInt("orange"), rs.getInt("yellow"), rs.getInt("blue"))).single();
    }

    @GetMapping("/objects")
    @PreAuthorize("hasAuthority('risk:read')")
    List<RiskObjectView> objects(@AuthenticationPrincipal CurrentUser user,
                                 @RequestHeader("X-Site-Id") UUID siteId) {
        sites.requireSiteAccess(user, siteId);
        return jdbc.sql("""
                select ro.id, ro.code, ro.name, ro.object_type, a.name area_name
                from risk_object ro left join area a on a.tenant_id=ro.tenant_id and a.id=ro.area_id
                where ro.tenant_id=:tenantId and ro.site_id=:siteId and ro.status='ACTIVE'
                order by ro.code
                """).param("tenantId", user.tenantId()).param("siteId", siteId)
                .query((rs, n) -> new RiskObjectView(rs.getObject("id", UUID.class), rs.getString("code"),
                        rs.getString("name"), rs.getString("object_type"), rs.getString("area_name"))).list();
    }

    @GetMapping("/hazards")
    @PreAuthorize("hasAuthority('risk:read')")
    List<HazardView> hazards(@AuthenticationPrincipal CurrentUser user,
                             @RequestHeader("X-Site-Id") UUID siteId) {
        sites.requireSiteAccess(user, siteId);
        return jdbc.sql("""
                select h.id, h.code, ro.name object_name, ar.name area_name, h.hazard_factor,
                       h.possible_accident, h.accident_type, h.status, h.next_review_on,
                       a.method, a.risk_value, a.risk_level, a.risk_color, a.control_level,
                       (select count(*) from risk_control_measure m where m.tenant_id=h.tenant_id and m.hazard_source_id=h.id) measure_count
                from hazard_source h
                join risk_object ro on ro.tenant_id=h.tenant_id and ro.id=h.risk_object_id
                left join area ar on ar.tenant_id=ro.tenant_id and ar.id=ro.area_id
                left join risk_assessment a on a.tenant_id=h.tenant_id and a.hazard_source_id=h.id and a.is_current
                where h.tenant_id=:tenantId and h.site_id=:siteId and h.status<>'INACTIVE'
                order by a.risk_level nulls last, h.code
                """).param("tenantId", user.tenantId()).param("siteId", siteId)
                .query((rs, n) -> new HazardView(rs.getObject("id", UUID.class), rs.getString("code"),
                        rs.getString("object_name"), rs.getString("area_name"), rs.getString("hazard_factor"),
                        rs.getString("possible_accident"), rs.getString("accident_type"), rs.getString("status"),
                        rs.getObject("next_review_on", LocalDate.class), rs.getString("method"),
                        rs.getBigDecimal("risk_value"), (Integer) rs.getObject("risk_level"),
                        rs.getString("risk_color"), rs.getString("control_level"), rs.getInt("measure_count"))).list();
    }

    @GetMapping("/hazards/{hazardId}/measures")
    @PreAuthorize("hasAuthority('risk:read')")
    List<MeasureView> measures(@AuthenticationPrincipal CurrentUser user,
                               @RequestHeader("X-Site-Id") UUID siteId, @PathVariable UUID hazardId) {
        sites.requireSiteAccess(user, siteId);
        int exists = jdbc.sql("select count(*) from hazard_source where tenant_id=:tenantId and site_id=:siteId and id=:id and status<>'INACTIVE'")
                .param("tenantId", user.tenantId()).param("siteId", siteId).param("id", hazardId)
                .query(Integer.class).single();
        if (exists == 0) throw new BusinessException("RISK_NOT_FOUND", "风险不存在或不属于当前厂区", HttpStatus.NOT_FOUND);
        return jdbc.sql("select id,measure_type,content,sort_order from risk_control_measure where tenant_id=:tenantId and site_id=:siteId and hazard_source_id=:hazardId order by sort_order,id")
                .param("tenantId", user.tenantId()).param("siteId", siteId).param("hazardId", hazardId)
                .query((rs, n) -> new MeasureView(rs.getObject("id", UUID.class), rs.getString("measure_type"),
                        rs.getString("content"), rs.getInt("sort_order"))).list();
    }

    @GetMapping("/hazards/{hazardId}/responsibilities")
    @PreAuthorize("hasAuthority('risk:read')")
    List<ResponsibilityView> responsibilities(@AuthenticationPrincipal CurrentUser user,
                                              @RequestHeader("X-Site-Id") UUID siteId,
                                              @PathVariable UUID hazardId) {
        sites.requireSiteAccess(user, siteId);
        requireHazard(user, siteId, hazardId);
        return jdbc.sql("""
                select r.id,r.responsibility_type,r.target_id,r.duty,r.control_frequency,
                       case r.responsibility_type
                         when 'ORG_UNIT' then (select name from org_unit where tenant_id=r.tenant_id and id=r.target_id)
                         when 'POSITION' then (select name from position where tenant_id=r.tenant_id and id=r.target_id)
                         when 'EMPLOYEE' then (select display_name from employee where tenant_id=r.tenant_id and id=r.target_id)
                       end target_name
                from risk_responsibility r
                where r.tenant_id=:tenantId and r.site_id=:siteId and r.hazard_source_id=:hazardId
                order by r.responsibility_type,r.created_at
                """).param("tenantId", user.tenantId()).param("siteId", siteId).param("hazardId", hazardId)
                .query((rs, n) -> new ResponsibilityView(rs.getObject("id", UUID.class),
                        rs.getString("responsibility_type"), rs.getObject("target_id", UUID.class),
                        rs.getString("target_name"), rs.getString("duty"), rs.getString("control_frequency"))).list();
    }

    @GetMapping("/hazards/{hazardId}/assessments")
    @PreAuthorize("hasAuthority('risk:read')")
    List<AssessmentHistoryView> assessmentHistory(@AuthenticationPrincipal CurrentUser user,
                                                  @RequestHeader("X-Site-Id") UUID siteId,
                                                  @PathVariable UUID hazardId) {
        sites.requireSiteAccess(user, siteId);
        requireHazard(user, siteId, hazardId);
        return jdbc.sql("""
                select a.id,a.method,a.likelihood,a.severity,a.exposure,a.consequence,a.risk_value,
                       a.risk_level,a.risk_color,a.control_level,a.approval_status,a.assessment_reason,
                       a.review_comment,a.assessed_at,a.reviewed_at,a.is_current,
                       coalesce(e.display_name,u.username) assessed_by_name
                from risk_assessment a
                left join user_account u on u.tenant_id=a.tenant_id and u.id=a.assessed_by
                left join employee e on e.tenant_id=u.tenant_id and e.id=u.employee_id
                where a.tenant_id=:tenantId and a.site_id=:siteId and a.hazard_source_id=:hazardId
                order by a.assessed_at desc
                """).param("tenantId", user.tenantId()).param("siteId", siteId).param("hazardId", hazardId)
                .query((rs, n) -> new AssessmentHistoryView(rs.getObject("id", UUID.class), rs.getString("method"),
                        rs.getBigDecimal("likelihood"), rs.getBigDecimal("severity"), rs.getBigDecimal("exposure"),
                        rs.getBigDecimal("consequence"), rs.getBigDecimal("risk_value"), rs.getInt("risk_level"),
                        rs.getString("risk_color"), rs.getString("control_level"), rs.getString("approval_status"),
                        rs.getString("assessment_reason"), rs.getString("review_comment"),
                        rs.getTimestamp("assessed_at").toInstant(),
                        rs.getTimestamp("reviewed_at") == null ? null : rs.getTimestamp("reviewed_at").toInstant(),
                        rs.getBoolean("is_current"), rs.getString("assessed_by_name"))).list();
    }

    @GetMapping("/hazards/{hazardId}/acknowledgement-summary")
    @PreAuthorize("hasAuthority('risk:read')")
    AcknowledgementSummary acknowledgementSummary(@AuthenticationPrincipal CurrentUser user,
                                                   @RequestHeader("X-Site-Id") UUID siteId,
                                                   @PathVariable UUID hazardId) {
        sites.requireSiteAccess(user, siteId);
        requireHazard(user, siteId, hazardId);
        return jdbc.sql("""
                select count(distinct ra.user_id) acknowledged_count,
                       max(ra.acknowledged_at) last_acknowledged_at
                from risk_assessment a
                left join risk_acknowledgement ra on ra.tenant_id=a.tenant_id and ra.assessment_id=a.id
                where a.tenant_id=:tenantId and a.site_id=:siteId and a.hazard_source_id=:hazardId and a.is_current
                """).param("tenantId", user.tenantId()).param("siteId", siteId).param("hazardId", hazardId)
                .query((rs, n) -> new AcknowledgementSummary(rs.getInt("acknowledged_count"),
                        rs.getTimestamp("last_acknowledged_at") == null ? null : rs.getTimestamp("last_acknowledged_at").toInstant())).single();
    }

    @PostMapping("/hazards/{hazardId}/reassess")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('risk:manage')")
    @Transactional
    AssessmentResponse reassess(@AuthenticationPrincipal CurrentUser user,
                                @RequestHeader("X-Site-Id") UUID siteId, @PathVariable UUID hazardId,
                                @Valid @RequestBody ReassessRequest request) {
        sites.requireSiteAccess(user, siteId);
        int active = jdbc.sql("select count(*) from hazard_source where tenant_id=:tenantId and site_id=:siteId and id=:id and status='ACTIVE'")
                .param("tenantId", user.tenantId()).param("siteId", siteId).param("id", hazardId).query(Integer.class).single();
        if (active == 0) throw new BusinessException("RISK_NOT_ACTIVE", "仅已生效风险可以发起复评", HttpStatus.CONFLICT);
        String method = request.method().toUpperCase();
        var result = calculator.calculate(method, request.likelihood(), request.severity(), request.exposure(), request.consequence());
        UUID ruleId = activeRule(user, method);
        UUID assessmentId = UUID.randomUUID();
        jdbc.sql("""
                insert into risk_assessment(id,tenant_id,site_id,hazard_source_id,rule_version_id,method,likelihood,severity,
                    exposure,consequence,risk_value,risk_level,risk_color,control_level,calculation_snapshot,assessed_by,
                    is_current,approval_status,assessment_reason)
                values(:id,:tenantId,:siteId,:hazardId,:ruleId,:method,:l,:s,:e,:c,:value,:level,:color,:control,
                    cast(:snapshot as jsonb),:userId,false,'PENDING_REVIEW',:reason)
                """).param("id", assessmentId).param("tenantId", user.tenantId()).param("siteId", siteId)
                .param("hazardId", hazardId).param("ruleId", ruleId).param("method", method)
                .param("l", request.likelihood()).param("s", request.severity()).param("e", request.exposure())
                .param("c", request.consequence()).param("value", result.riskValue()).param("level", result.riskLevel())
                .param("color", result.riskColor()).param("control", result.controlLevel())
                .param("snapshot", snapshot(method, request.asAssessRequest())).param("userId", user.userId())
                .param("reason", request.reason()).update();
        return new AssessmentResponse(assessmentId, result.riskValue(), result.riskLevel(), result.riskColor(), result.controlLevel());
    }

    @PostMapping("/assessments/{assessmentId}/review")
    @PreAuthorize("hasAuthority('risk:review')")
    @Transactional
    void reviewReassessment(@AuthenticationPrincipal CurrentUser user,
                            @RequestHeader("X-Site-Id") UUID siteId, @PathVariable UUID assessmentId,
                            @Valid @RequestBody ReviewRequest request) {
        sites.requireSiteAccess(user, siteId);
        String target = switch (request.decision()) {
            case "APPROVE" -> "APPROVED";
            case "RETURN" -> "RETURNED";
            default -> throw new BusinessException("INVALID_REVIEW_DECISION", "审核决定仅支持 APPROVE 或 RETURN", HttpStatus.BAD_REQUEST);
        };
        if ("RETURNED".equals(target) && (request.comment() == null || request.comment().isBlank()))
            throw new BusinessException("REVIEW_COMMENT_REQUIRED", "退回复评时必须填写原因", HttpStatus.BAD_REQUEST);
        UUID hazardId = jdbc.sql("select hazard_source_id from risk_assessment where tenant_id=:tenantId and site_id=:siteId and id=:id and approval_status='PENDING_REVIEW' for update")
                .param("tenantId", user.tenantId()).param("siteId", siteId).param("id", assessmentId)
                .query(UUID.class).optional().orElseThrow(() -> new BusinessException(
                        "REASSESSMENT_STATE_CONFLICT", "仅待审核复评可以执行审核", HttpStatus.CONFLICT));
        if ("APPROVED".equals(target)) {
            jdbc.sql("update risk_assessment set is_current=false where tenant_id=:tenantId and hazard_source_id=:hazardId and is_current")
                    .param("tenantId", user.tenantId()).param("hazardId", hazardId).update();
        }
        jdbc.sql("update risk_assessment set approval_status=:status,is_current=:current,review_comment=:comment,reviewed_by=:userId,reviewed_at=now() where tenant_id=:tenantId and id=:id")
                .param("status", target).param("current", "APPROVED".equals(target)).param("comment", request.comment())
                .param("userId", user.userId()).param("tenantId", user.tenantId()).param("id", assessmentId).update();
    }

    @PutMapping("/hazards/{hazardId}/responsibilities")
    @PreAuthorize("hasAuthority('risk:manage')")
    @Transactional
    void replaceResponsibilities(@AuthenticationPrincipal CurrentUser user,
                                 @RequestHeader("X-Site-Id") UUID siteId, @PathVariable UUID hazardId,
                                 @Valid @RequestBody List<ResponsibilityRequest> responsibilities) {
        sites.requireSiteAccess(user, siteId);
        requireHazard(user, siteId, hazardId);
        jdbc.sql("delete from risk_responsibility where tenant_id=:tenantId and site_id=:siteId and hazard_source_id=:hazardId")
                .param("tenantId", user.tenantId()).param("siteId", siteId).param("hazardId", hazardId).update();
        for (var responsibility : responsibilities) {
            validateResponsibilityTarget(user, siteId, responsibility);
            jdbc.sql("insert into risk_responsibility(id,tenant_id,site_id,hazard_source_id,responsibility_type,target_id,duty,control_frequency) values(:id,:tenantId,:siteId,:hazardId,:type,:targetId,:duty,:frequency)")
                    .param("id", UUID.randomUUID()).param("tenantId", user.tenantId()).param("siteId", siteId)
                    .param("hazardId", hazardId).param("type", responsibility.responsibilityType())
                    .param("targetId", responsibility.targetId()).param("duty", responsibility.duty())
                    .param("frequency", responsibility.controlFrequency()).update();
        }
    }

    @GetMapping("/acknowledgements/me")
    @PreAuthorize("hasAuthority('risk:read')")
    List<AcknowledgementView> myAcknowledgements(@AuthenticationPrincipal CurrentUser user,
                                                 @RequestHeader("X-Site-Id") UUID siteId) {
        sites.requireSiteAccess(user, siteId);
        return jdbc.sql("""
                select ra.hazard_source_id,ra.assessment_id,ra.acknowledged_at
                from risk_acknowledgement ra
                join risk_assessment a on a.tenant_id=ra.tenant_id and a.id=ra.assessment_id and a.is_current
                where ra.tenant_id=:tenantId and ra.site_id=:siteId and ra.user_id=:userId
                """).param("tenantId", user.tenantId()).param("siteId", siteId).param("userId", user.userId())
                .query((rs, n) -> new AcknowledgementView(rs.getObject("hazard_source_id", UUID.class),
                        rs.getObject("assessment_id", UUID.class), rs.getTimestamp("acknowledged_at").toInstant())).list();
    }

    @PostMapping("/hazards/{hazardId}/acknowledge")
    @PreAuthorize("hasAuthority('risk:read')")
    @Transactional
    void acknowledge(@AuthenticationPrincipal CurrentUser user, @RequestHeader("X-Site-Id") UUID siteId,
                     @PathVariable UUID hazardId, @RequestHeader(value = "X-Client-Source", defaultValue = "H5") String source) {
        sites.requireSiteAccess(user, siteId);
        UUID assessmentId = jdbc.sql("""
                select a.id from hazard_source h join risk_assessment a
                  on a.tenant_id=h.tenant_id and a.hazard_source_id=h.id and a.is_current
                where h.tenant_id=:tenantId and h.site_id=:siteId and h.id=:hazardId and h.status='ACTIVE'
                """).param("tenantId", user.tenantId()).param("siteId", siteId).param("hazardId", hazardId)
                .query(UUID.class).optional().orElseThrow(() -> new BusinessException(
                        "ACTIVE_RISK_NOT_FOUND", "仅可确认当前厂区已生效且已评估的风险", HttpStatus.CONFLICT));
        String clientSource = "WEB".equalsIgnoreCase(source) ? "WEB" : "H5";
        jdbc.sql("""
                insert into risk_acknowledgement(id,tenant_id,site_id,hazard_source_id,assessment_id,user_id,client_source)
                values(:id,:tenantId,:siteId,:hazardId,:assessmentId,:userId,:source)
                on conflict(tenant_id,hazard_source_id,assessment_id,user_id)
                do update set acknowledged_at=now(),client_source=excluded.client_source
                """).param("id", UUID.randomUUID()).param("tenantId", user.tenantId()).param("siteId", siteId)
                .param("hazardId", hazardId).param("assessmentId", assessmentId).param("userId", user.userId())
                .param("source", clientSource).update();
    }

    @PostMapping("/hazards")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('risk:manage')")
    @Transactional
    IdResponse createHazard(@AuthenticationPrincipal CurrentUser user, @RequestHeader("X-Site-Id") UUID siteId,
                            @Valid @RequestBody CreateHazard request) {
        sites.requireSiteAccess(user, siteId);
        requireObject(user, siteId, request.riskObjectId());
        UUID id = UUID.randomUUID();
        jdbc.sql("""
                insert into hazard_source(id,tenant_id,site_id,risk_object_id,code,hazard_factor,possible_accident,
                    accident_type,identification_basis,identified_on,status,next_review_on,created_by)
                values(:id,:tenantId,:siteId,:objectId,:code,:factor,:accident,:type,:basis,:identifiedOn,'DRAFT',:nextReviewOn,:userId)
                """).param("id", id).param("tenantId", user.tenantId()).param("siteId", siteId)
                .param("objectId", request.riskObjectId()).param("code", request.code())
                .param("factor", request.hazardFactor()).param("accident", request.possibleAccident())
                .param("type", request.accidentType()).param("basis", request.identificationBasis())
                .param("identifiedOn", request.identifiedOn()).param("nextReviewOn", request.nextReviewOn())
                .param("userId", user.userId()).update();
        return new IdResponse(id);
    }

    @PostMapping("/hazards/{hazardId}/assessments")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('risk:manage')")
    @Transactional
    AssessmentResponse assess(@AuthenticationPrincipal CurrentUser user, @RequestHeader("X-Site-Id") UUID siteId,
                              @PathVariable UUID hazardId, @Valid @RequestBody AssessRequest request) {
        sites.requireSiteAccess(user, siteId);
        requireEditableHazard(user, siteId, hazardId);
        String method = request.method().toUpperCase();
        var result = calculator.calculate(method, request.likelihood(), request.severity(),
                request.exposure(), request.consequence());
        UUID ruleId = activeRule(user, method);
        jdbc.sql("update risk_assessment set is_current=false where tenant_id=:tenantId and hazard_source_id=:hazardId and is_current")
                .param("tenantId", user.tenantId()).param("hazardId", hazardId).update();
        UUID assessmentId = UUID.randomUUID();
        jdbc.sql("""
                insert into risk_assessment(id,tenant_id,site_id,hazard_source_id,rule_version_id,method,likelihood,severity,
                    exposure,consequence,risk_value,risk_level,risk_color,control_level,calculation_snapshot,assessed_by)
                values(:id,:tenantId,:siteId,:hazardId,:ruleId,:method,:l,:s,:e,:c,:value,:level,:color,:control,cast(:snapshot as jsonb),:userId)
                """).param("id", assessmentId).param("tenantId", user.tenantId()).param("siteId", siteId)
                .param("hazardId", hazardId).param("ruleId", ruleId).param("method", method)
                .param("l", request.likelihood()).param("s", request.severity()).param("e", request.exposure())
                .param("c", request.consequence()).param("value", result.riskValue()).param("level", result.riskLevel())
                .param("color", result.riskColor()).param("control", result.controlLevel())
                .param("snapshot", snapshot(method, request)).param("userId", user.userId()).update();
        return new AssessmentResponse(assessmentId, result.riskValue(), result.riskLevel(), result.riskColor(), result.controlLevel());
    }

    @PutMapping("/hazards/{hazardId}/measures")
    @PreAuthorize("hasAuthority('risk:manage')")
    @Transactional
    void replaceMeasures(@AuthenticationPrincipal CurrentUser user, @RequestHeader("X-Site-Id") UUID siteId,
                         @PathVariable UUID hazardId, @Valid @RequestBody List<MeasureRequest> measures) {
        sites.requireSiteAccess(user, siteId);
        requireEditableHazard(user, siteId, hazardId);
        jdbc.sql("delete from risk_control_measure where tenant_id=:tenantId and hazard_source_id=:hazardId")
                .param("tenantId", user.tenantId()).param("hazardId", hazardId).update();
        for (int i = 0; i < measures.size(); i++) {
            var measure = measures.get(i);
            jdbc.sql("insert into risk_control_measure(id,tenant_id,site_id,hazard_source_id,measure_type,content,sort_order) values(:id,:tenantId,:siteId,:hazardId,:type,:content,:sort)")
                    .param("id", UUID.randomUUID()).param("tenantId", user.tenantId()).param("siteId", siteId)
                    .param("hazardId", hazardId).param("type", measure.measureType())
                    .param("content", measure.content()).param("sort", i * 10).update();
        }
    }

    @PostMapping("/hazards/{hazardId}/submit")
    @PreAuthorize("hasAuthority('risk:manage')")
    @Transactional
    void submit(@AuthenticationPrincipal CurrentUser user, @RequestHeader("X-Site-Id") UUID siteId,
                @PathVariable UUID hazardId) {
        sites.requireSiteAccess(user, siteId);
        requireEditableHazard(user, siteId, hazardId);
        int assessments = jdbc.sql("select count(*) from risk_assessment where tenant_id=:tenantId and hazard_source_id=:hazardId and is_current")
                .param("tenantId", user.tenantId()).param("hazardId", hazardId).query(Integer.class).single();
        int measures = jdbc.sql("select count(*) from risk_control_measure where tenant_id=:tenantId and hazard_source_id=:hazardId")
                .param("tenantId", user.tenantId()).param("hazardId", hazardId).query(Integer.class).single();
        if (assessments == 0 || measures == 0)
            throw new BusinessException("RISK_NOT_READY", "提交前必须完成风险评估并至少录入一项管控措施", HttpStatus.CONFLICT);
        jdbc.sql("update hazard_source set status='PENDING_REVIEW',review_comment=null,version=version+1,updated_at=now() where tenant_id=:tenantId and site_id=:siteId and id=:hazardId")
                .param("tenantId", user.tenantId()).param("siteId", siteId).param("hazardId", hazardId).update();
    }

    @PostMapping("/hazards/{hazardId}/review")
    @PreAuthorize("hasAuthority('risk:review')")
    @Transactional
    void review(@AuthenticationPrincipal CurrentUser user, @RequestHeader("X-Site-Id") UUID siteId,
                @PathVariable UUID hazardId, @Valid @RequestBody ReviewRequest request) {
        sites.requireSiteAccess(user, siteId);
        String target = switch (request.decision()) {
            case "APPROVE" -> "ACTIVE";
            case "RETURN" -> "RETURNED";
            default -> throw new BusinessException("INVALID_REVIEW_DECISION", "审核决定仅支持 APPROVE 或 RETURN", HttpStatus.BAD_REQUEST);
        };
        if ("RETURNED".equals(target) && (request.comment() == null || request.comment().isBlank()))
            throw new BusinessException("REVIEW_COMMENT_REQUIRED", "退回时必须填写原因", HttpStatus.BAD_REQUEST);
        int changed = jdbc.sql("update hazard_source set status=:status,review_comment=:comment,version=version+1,updated_at=now() where tenant_id=:tenantId and site_id=:siteId and id=:hazardId and status='PENDING_REVIEW'")
                .param("status", target).param("comment", request.comment()).param("tenantId", user.tenantId())
                .param("siteId", siteId).param("hazardId", hazardId).update();
        if (changed == 0) throw new BusinessException("RISK_STATE_CONFLICT", "仅待审核风险可以执行审核", HttpStatus.CONFLICT);
        jdbc.sql("insert into audit_log(tenant_id,site_id,actor_user_id,action,object_type,object_id,detail) values(:tenantId,:siteId,:userId,:action,'HAZARD_SOURCE',:hazardId,cast(:detail as jsonb))")
                .param("tenantId", user.tenantId()).param("siteId", siteId).param("userId", user.userId())
                .param("action", "RISK_" + request.decision()).param("hazardId", hazardId)
                .param("detail", json(Map.of("comment", request.comment() == null ? "" : request.comment()))).update();
    }

    private void requireObject(CurrentUser user, UUID siteId, UUID objectId) {
        int count = jdbc.sql("select count(*) from risk_object where tenant_id=:tenantId and site_id=:siteId and id=:id and status='ACTIVE'")
                .param("tenantId", user.tenantId()).param("siteId", siteId).param("id", objectId).query(Integer.class).single();
        if (count == 0) throw new BusinessException("RISK_OBJECT_NOT_FOUND", "风险对象不存在或不属于当前厂区", HttpStatus.NOT_FOUND);
    }

    private UUID activeRule(CurrentUser user, String method) {
        return jdbc.sql("select id from risk_rule_version where tenant_id=:tenantId and method=:method and status='ACTIVE' order by version_no desc limit 1")
                .param("tenantId", user.tenantId()).param("method", method).query(UUID.class).optional()
                .orElseThrow(() -> new BusinessException("RISK_RULE_NOT_FOUND", "未配置生效的风险评估规则", HttpStatus.CONFLICT));
    }

    private void requireHazard(CurrentUser user, UUID siteId, UUID hazardId) {
        int count = jdbc.sql("select count(*) from hazard_source where tenant_id=:tenantId and site_id=:siteId and id=:id and status<>'INACTIVE'")
                .param("tenantId", user.tenantId()).param("siteId", siteId).param("id", hazardId).query(Integer.class).single();
        if (count == 0) throw new BusinessException("RISK_NOT_FOUND", "风险不存在或不属于当前厂区", HttpStatus.NOT_FOUND);
    }

    private void validateResponsibilityTarget(CurrentUser user, UUID siteId, ResponsibilityRequest request) {
        String sql = switch (request.responsibilityType()) {
            case "ORG_UNIT" -> "select count(*) from org_unit where tenant_id=:tenantId and site_id=:siteId and id=:targetId and status='ACTIVE'";
            case "POSITION" -> "select count(*) from position where tenant_id=:tenantId and id=:targetId and status='ACTIVE' and :siteId is not null";
            case "EMPLOYEE" -> "select count(*) from employee where tenant_id=:tenantId and site_id=:siteId and id=:targetId and status='ACTIVE'";
            default -> throw new BusinessException("INVALID_RESPONSIBILITY_TYPE", "责任类型仅支持组织、岗位或人员", HttpStatus.BAD_REQUEST);
        };
        int count = jdbc.sql(sql).param("tenantId", user.tenantId()).param("siteId", siteId)
                .param("targetId", request.targetId()).query(Integer.class).single();
        if (count == 0) throw new BusinessException("RESPONSIBILITY_TARGET_NOT_FOUND", "责任对象不存在或不属于当前厂区", HttpStatus.BAD_REQUEST);
    }

    private void requireEditableHazard(CurrentUser user, UUID siteId, UUID hazardId) {
        int count = jdbc.sql("select count(*) from hazard_source where tenant_id=:tenantId and site_id=:siteId and id=:id and status in ('DRAFT','RETURNED')")
                .param("tenantId", user.tenantId()).param("siteId", siteId).param("id", hazardId).query(Integer.class).single();
        if (count == 0) throw new BusinessException("RISK_NOT_EDITABLE", "风险不存在、越权或当前状态不可编辑", HttpStatus.CONFLICT);
    }

    private String snapshot(String method, AssessRequest request) {
        return json(Map.of("method", method, "L", request.likelihood(), "S", nullable(request.severity()),
                "E", nullable(request.exposure()), "C", nullable(request.consequence())));
    }

    private Object nullable(Object value) { return value == null ? "" : value; }

    private String json(Object value) {
        try { return json.writeValueAsString(value); }
        catch (JsonProcessingException e) { throw new IllegalStateException(e); }
    }

    record Summary(int total, int pending, int red, int orange, int yellow, int blue) {}
    record RiskObjectView(UUID id, String code, String name, String objectType, String areaName) {}
    record HazardView(UUID id, String code, String objectName, String areaName, String hazardFactor,
                      String possibleAccident, String accidentType, String status, LocalDate nextReviewOn,
                      String method, BigDecimal riskValue, Integer riskLevel, String riskColor,
                      String controlLevel, int measureCount) {}
    record IdResponse(UUID id) {}
    record AssessmentResponse(UUID id, BigDecimal riskValue, int riskLevel, String riskColor, String controlLevel) {}
    record MeasureView(UUID id, String measureType, String content, int sortOrder) {}
    record ResponsibilityView(UUID id, String responsibilityType, UUID targetId, String targetName,
                              String duty, String controlFrequency) {}
    record AcknowledgementView(UUID hazardId, UUID assessmentId, java.time.Instant acknowledgedAt) {}
    record AcknowledgementSummary(int acknowledgedCount, java.time.Instant lastAcknowledgedAt) {}
    record AssessmentHistoryView(UUID id, String method, BigDecimal likelihood, BigDecimal severity,
                                 BigDecimal exposure, BigDecimal consequence, BigDecimal riskValue,
                                 int riskLevel, String riskColor, String controlLevel, String approvalStatus,
                                 String assessmentReason, String reviewComment, java.time.Instant assessedAt,
                                 java.time.Instant reviewedAt, boolean current, String assessedByName) {}
    record CreateHazard(@NotNull UUID riskObjectId, @NotBlank String code, @NotBlank String hazardFactor,
                        @NotBlank String possibleAccident, @NotBlank String accidentType,
                        String identificationBasis, @NotNull LocalDate identifiedOn, LocalDate nextReviewOn) {}
    record AssessRequest(@NotBlank String method, @NotNull BigDecimal likelihood, BigDecimal severity,
                         BigDecimal exposure, BigDecimal consequence) {}
    record ReassessRequest(@NotBlank String method, @NotNull BigDecimal likelihood, BigDecimal severity,
                           BigDecimal exposure, BigDecimal consequence, @NotBlank String reason) {
        AssessRequest asAssessRequest() { return new AssessRequest(method, likelihood, severity, exposure, consequence); }
    }
    record MeasureRequest(@NotBlank String measureType, @NotBlank String content) {}
    record ResponsibilityRequest(@NotBlank String responsibilityType, @NotNull UUID targetId,
                                 @NotBlank String duty, String controlFrequency) {}
    record ReviewRequest(@NotBlank String decision, String comment) {}
}
