package com.waterx.safety.permit;

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

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/safety/work-permits")
public class WorkPermitController {
    private final JdbcClient jdbc; private final SiteAccessService sites;
    public WorkPermitController(JdbcClient jdbc,SiteAccessService sites){this.jdbc=jdbc;this.sites=sites;}

    @GetMapping("/templates") @PreAuthorize("hasAuthority('inspection:read')")
    List<TemplateView> templates(@AuthenticationPrincipal CurrentUser user,@RequestHeader("X-Site-Id") UUID siteId){
        sites.requireSiteAccess(user,siteId);
        return jdbc.sql("select t.id,t.permit_type,t.name,(select count(*) from work_permit_measure_template m where m.tenant_id=t.tenant_id and m.template_id=t.id) measure_count from work_permit_template t where t.tenant_id=:tenantId and t.status='ACTIVE' order by t.name")
                .param("tenantId",user.tenantId()).query((rs,n)->new TemplateView(rs.getObject(1,UUID.class),rs.getString(2),rs.getString(3),rs.getInt(4))).list();
    }
    @GetMapping("/templates/{templateId}/measures") @PreAuthorize("hasAuthority('inspection:read')")
    List<MeasureView> measures(@AuthenticationPrincipal CurrentUser user,@RequestHeader("X-Site-Id") UUID siteId,@PathVariable UUID templateId){
        sites.requireSiteAccess(user,siteId);return jdbc.sql("select id,content,required,sort_order from work_permit_measure_template where tenant_id=:tenantId and template_id=:id order by sort_order")
                .param("tenantId",user.tenantId()).param("id",templateId).query((rs,n)->new MeasureView(rs.getObject(1,UUID.class),rs.getString(2),rs.getBoolean(3),rs.getInt(4))).list();
    }
    @GetMapping @PreAuthorize("hasAuthority('inspection:read')")
    List<PermitView> list(@AuthenticationPrincipal CurrentUser user,@RequestHeader("X-Site-Id") UUID siteId){sites.requireSiteAccess(user,siteId);return jdbc.sql("""
        select p.id,p.permit_no,t.permit_type,t.name,p.work_unit,p.location,p.work_content,p.work_level,p.start_at,p.end_at,p.responsible_person,p.guardian,p.status,
        (select count(*) from work_permit_measure m where m.tenant_id=p.tenant_id and m.permit_id=p.id and m.confirmed) confirmed_count,
        (select count(*) from work_permit_measure m where m.tenant_id=p.tenant_id and m.permit_id=p.id and m.involved) involved_count,
        (select count(*) from work_permit_gas_test g where g.tenant_id=p.tenant_id and g.permit_id=p.id) gas_test_count,
        (select count(*) from work_permit_briefing b where b.tenant_id=p.tenant_id and b.permit_id=p.id) briefing_count
        from work_permit p join work_permit_template t on t.tenant_id=p.tenant_id and t.id=p.template_id where p.tenant_id=:tenantId and p.site_id=:siteId order by p.created_at desc
        """).param("tenantId",user.tenantId()).param("siteId",siteId).query((rs,n)->new PermitView(rs.getObject(1,UUID.class),rs.getString(2),rs.getString(3),rs.getString(4),rs.getString(5),rs.getString(6),rs.getString(7),rs.getString(8),rs.getObject(9,OffsetDateTime.class),rs.getObject(10,OffsetDateTime.class),rs.getString(11),rs.getString(12),rs.getString(13),rs.getInt(14),rs.getInt(15),rs.getInt(16),rs.getInt(17))).list();}

    @GetMapping("/{id}/measures") @PreAuthorize("hasAuthority('inspection:read')")
    List<PermitMeasureView> permitMeasures(@AuthenticationPrincipal CurrentUser user,@RequestHeader("X-Site-Id") UUID siteId,@PathVariable UUID id){sites.requireSiteAccess(user,siteId);return jdbc.sql("""
        select m.measure_template_id,t.content,t.required,m.involved,m.confirmed,m.confirmed_at from work_permit_measure m
        join work_permit_measure_template t on t.tenant_id=m.tenant_id and t.id=m.measure_template_id
        join work_permit p on p.tenant_id=m.tenant_id and p.id=m.permit_id where m.tenant_id=:tenantId and m.site_id=:siteId and m.permit_id=:id order by t.sort_order
        """).param("tenantId",user.tenantId()).param("siteId",siteId).param("id",id).query((rs,n)->new PermitMeasureView(rs.getObject(1,UUID.class),rs.getString(2),rs.getBoolean(3),rs.getBoolean(4),rs.getBoolean(5),rs.getObject(6,OffsetDateTime.class))).list();}

    @PutMapping("/{id}/measures") @PreAuthorize("hasAuthority('inspection:manage')") @Transactional
    void confirmMeasures(@AuthenticationPrincipal CurrentUser user,@RequestHeader("X-Site-Id") UUID siteId,@PathVariable UUID id,@Valid @RequestBody List<MeasureConfirmInput> inputs){sites.requireSiteAccess(user,siteId);requireExecutionState(user,siteId,id);
        for(MeasureConfirmInput input:inputs){int c=jdbc.sql("update work_permit_measure set involved=:involved,confirmed=:confirmed,confirmer_id=case when :confirmed then :userId else null end,confirmed_at=case when :confirmed then now() else null end where tenant_id=:tenantId and site_id=:siteId and permit_id=:id and measure_template_id=:measureId")
                .param("involved",input.involved()).param("confirmed",input.confirmed()).param("userId",user.userId()).param("tenantId",user.tenantId()).param("siteId",siteId).param("id",id).param("measureId",input.measureId()).update();if(c==0)throw new BusinessException("MEASURE_NOT_FOUND","安全措施不存在",HttpStatus.NOT_FOUND);}}

    @PostMapping("/{id}/gas-tests") @PreAuthorize("hasAuthority('inspection:manage')")
    void addGasTest(@AuthenticationPrincipal CurrentUser user,@RequestHeader("X-Site-Id") UUID siteId,@PathVariable UUID id,@Valid @RequestBody GasTestInput input){sites.requireSiteAccess(user,siteId);requireExecutionState(user,siteId,id);jdbc.sql("insert into work_permit_gas_test(tenant_id,site_id,permit_id,oxygen,carbon_monoxide,hydrogen_sulfide,combustible_gas,other_gas,test_point,tested_by,tested_at) values(:tenantId,:siteId,:id,:o2,:co,:h2s,:gas,:other,:point,:tester,:testedAt)")
            .param("tenantId",user.tenantId()).param("siteId",siteId).param("id",id).param("o2",input.oxygen()).param("co",input.carbonMonoxide()).param("h2s",input.hydrogenSulfide()).param("gas",input.combustibleGas()).param("other",input.otherGas()).param("point",input.testPoint()).param("tester",input.testedBy()).param("testedAt",input.testedAt()).update();}

    @PostMapping("/{id}/briefings") @PreAuthorize("hasAuthority('inspection:manage')")
    void confirmBriefing(@AuthenticationPrincipal CurrentUser user,@RequestHeader("X-Site-Id") UUID siteId,@PathVariable UUID id,@Valid @RequestBody BriefingInput input){sites.requireSiteAccess(user,siteId);requireExecutionState(user,siteId,id);jdbc.sql("insert into work_permit_briefing(tenant_id,site_id,permit_id,briefing_content,participant_names,confirmed_by) values(:tenantId,:siteId,:id,:content,:participants,:userId)")
            .param("tenantId",user.tenantId()).param("siteId",siteId).param("id",id).param("content",input.content()).param("participants",input.participantNames()).param("userId",user.userId()).update();}

    @PostMapping("/{id}/start") @PreAuthorize("hasAuthority('inspection:manage')")
    void start(@AuthenticationPrincipal CurrentUser user,@RequestHeader("X-Site-Id") UUID siteId,@PathVariable UUID id){sites.requireSiteAccess(user,siteId);String type=jdbc.sql("select t.permit_type from work_permit p join work_permit_template t on t.tenant_id=p.tenant_id and t.id=p.template_id where p.tenant_id=:tenantId and p.site_id=:siteId and p.id=:id and p.status='APPROVED'").param("tenantId",user.tenantId()).param("siteId",siteId).param("id",id).query(String.class).optional().orElseThrow(()->new BusinessException("PERMIT_STATE_INVALID","仅已批准作业票可以开工",HttpStatus.CONFLICT));
        int unchecked=jdbc.sql("select count(*) from work_permit_measure where tenant_id=:tenantId and permit_id=:id and involved and not confirmed").param("tenantId",user.tenantId()).param("id",id).query(Integer.class).single();if(unchecked>0)throw new BusinessException("MEASURES_INCOMPLETE","请确认全部涉及的安全措施",HttpStatus.BAD_REQUEST);
        int briefings=jdbc.sql("select count(*) from work_permit_briefing where tenant_id=:tenantId and permit_id=:id").param("tenantId",user.tenantId()).param("id",id).query(Integer.class).single();if(briefings==0)throw new BusinessException("BRIEFING_REQUIRED","请先完成作业前安全交底",HttpStatus.BAD_REQUEST);
        if(List.of("CONFINED_SPACE","HOT_WORK").contains(type)){int tests=jdbc.sql("select count(*) from work_permit_gas_test where tenant_id=:tenantId and permit_id=:id").param("tenantId",user.tenantId()).param("id",id).query(Integer.class).single();if(tests==0)throw new BusinessException("GAS_TEST_REQUIRED","该类作业开工前必须完成气体检测",HttpStatus.BAD_REQUEST);}
        jdbc.sql("update work_permit set status='IN_PROGRESS',updated_at=now() where tenant_id=:tenantId and id=:id").param("tenantId",user.tenantId()).param("id",id).update();}

    private void requireExecutionState(CurrentUser user,UUID siteId,UUID id){int c=jdbc.sql("select count(*) from work_permit where tenant_id=:tenantId and site_id=:siteId and id=:id and status in ('APPROVED','IN_PROGRESS')").param("tenantId",user.tenantId()).param("siteId",siteId).param("id",id).query(Integer.class).single();if(c==0)throw new BusinessException("PERMIT_STATE_INVALID","作业票尚未批准或已结束",HttpStatus.CONFLICT);}

    @PostMapping @PreAuthorize("hasAuthority('inspection:manage')") @Transactional
    IdView create(@AuthenticationPrincipal CurrentUser user,@RequestHeader("X-Site-Id") UUID siteId,@Valid @RequestBody PermitInput input){sites.requireSiteAccess(user,siteId);
        if(!input.endAt().isAfter(input.startAt()))throw new BusinessException("PERMIT_TIME_INVALID","作业结束时间必须晚于开始时间",HttpStatus.BAD_REQUEST);
        UUID id=UUID.randomUUID();String no="ZY-"+LocalDate.now().toString().replace("-","")+"-"+id.toString().substring(0,5).toUpperCase();
        int inserted=jdbc.sql("insert into work_permit(id,tenant_id,site_id,template_id,permit_no,work_unit,location,work_content,work_level,risk_result,start_at,end_at,responsible_person,guardian,workers,related_permits,applicant_id) values(:id,:tenantId,:siteId,:templateId,:no,:unit,:location,:content,:level,:risk,:start,:end,:responsible,:guardian,:workers,:related,:userId)")
                .param("id",id).param("tenantId",user.tenantId()).param("siteId",siteId).param("templateId",input.templateId()).param("no",no).param("unit",input.workUnit()).param("location",input.location()).param("content",input.workContent()).param("level",input.workLevel()).param("risk",input.riskResult()).param("start",input.startAt()).param("end",input.endAt()).param("responsible",input.responsiblePerson()).param("guardian",input.guardian()).param("workers",input.workers()).param("related",input.relatedPermits()).param("userId",user.userId()).update();
        if(inserted==0)throw new BusinessException("PERMIT_CREATE_FAILED","作业票创建失败",HttpStatus.BAD_REQUEST);
        jdbc.sql("insert into work_permit_measure(tenant_id,site_id,permit_id,measure_template_id) select tenant_id,:siteId,:permitId,id from work_permit_measure_template where tenant_id=:tenantId and template_id=:templateId").param("siteId",siteId).param("permitId",id).param("tenantId",user.tenantId()).param("templateId",input.templateId()).update();return new IdView(id);}

    @PostMapping("/{id}/submit") @PreAuthorize("hasAuthority('inspection:manage')")
    void submit(@AuthenticationPrincipal CurrentUser user,@RequestHeader("X-Site-Id") UUID siteId,@PathVariable UUID id){sites.requireSiteAccess(user,siteId);int c=jdbc.sql("update work_permit set status='PENDING_SAFETY',submitted_at=now(),updated_at=now() where tenant_id=:tenantId and site_id=:siteId and id=:id and status in ('DRAFT','RETURNED')").param("tenantId",user.tenantId()).param("siteId",siteId).param("id",id).update();if(c==0)invalid();}
    @PostMapping("/{id}/review") @PreAuthorize("hasAuthority('inspection:manage')") @Transactional
    void review(@AuthenticationPrincipal CurrentUser user,@RequestHeader("X-Site-Id") UUID siteId,@PathVariable UUID id,@Valid @RequestBody ReviewInput input){sites.requireSiteAccess(user,siteId);
        String current=jdbc.sql("select status from work_permit where tenant_id=:tenantId and site_id=:siteId and id=:id").param("tenantId",user.tenantId()).param("siteId",siteId).param("id",id).query(String.class).optional().orElseThrow(()->new BusinessException("PERMIT_NOT_FOUND","作业票不存在",HttpStatus.NOT_FOUND));
        if(!List.of("PENDING_SAFETY","PENDING_PRINCIPAL").contains(current))invalid();String step="PENDING_SAFETY".equals(current)?"SAFETY_REVIEW":"PRINCIPAL_APPROVAL";String next=input.approved()?("PENDING_SAFETY".equals(current)?"PENDING_PRINCIPAL":"APPROVED"):"RETURNED";
        jdbc.sql("update work_permit set status=:next,approved_at=case when :next='APPROVED' then now() else approved_at end,updated_at=now() where tenant_id=:tenantId and id=:id").param("next",next).param("tenantId",user.tenantId()).param("id",id).update();
        jdbc.sql("insert into work_permit_approval(tenant_id,site_id,permit_id,approval_step,decision,comment,approver_id) values(:tenantId,:siteId,:id,:step,:decision,:comment,:userId)").param("tenantId",user.tenantId()).param("siteId",siteId).param("id",id).param("step",step).param("decision",input.approved()?"APPROVED":"RETURNED").param("comment",input.comment()).param("userId",user.userId()).update();}
    @PostMapping("/{id}/close") @PreAuthorize("hasAuthority('inspection:manage')")
    void close(@AuthenticationPrincipal CurrentUser user,@RequestHeader("X-Site-Id") UUID siteId,@PathVariable UUID id){sites.requireSiteAccess(user,siteId);int c=jdbc.sql("update work_permit set status='CLOSED',closed_at=now(),updated_at=now() where tenant_id=:tenantId and site_id=:siteId and id=:id and status in ('APPROVED','IN_PROGRESS')").param("tenantId",user.tenantId()).param("siteId",siteId).param("id",id).update();if(c==0)invalid();}
    private void invalid(){throw new BusinessException("PERMIT_STATE_INVALID","作业票当前状态不能执行该操作",HttpStatus.CONFLICT);}
    public record TemplateView(UUID id,String permitType,String name,int measureCount){} public record MeasureView(UUID id,String content,boolean required,int sortOrder){}
    public record PermitView(UUID id,String permitNo,String permitType,String permitTypeName,String workUnit,String location,String workContent,String workLevel,OffsetDateTime startAt,OffsetDateTime endAt,String responsiblePerson,String guardian,String status,int confirmedCount,int involvedCount,int gasTestCount,int briefingCount){}
    public record PermitMeasureView(UUID measureId,String content,boolean required,boolean involved,boolean confirmed,OffsetDateTime confirmedAt){}
    public record MeasureConfirmInput(@NotNull UUID measureId,boolean involved,boolean confirmed){}
    public record GasTestInput(java.math.BigDecimal oxygen,java.math.BigDecimal carbonMonoxide,java.math.BigDecimal hydrogenSulfide,java.math.BigDecimal combustibleGas,String otherGas,@NotBlank String testPoint,@NotBlank String testedBy,@NotNull OffsetDateTime testedAt){}
    public record BriefingInput(@NotBlank String content,@NotBlank String participantNames){}
    public record PermitInput(@NotNull UUID templateId,@NotBlank String workUnit,@NotBlank String location,@NotBlank String workContent,@NotBlank String workLevel,@NotBlank String riskResult,@NotNull OffsetDateTime startAt,@NotNull OffsetDateTime endAt,@NotBlank String responsiblePerson,@NotBlank String guardian,@NotBlank String workers,String relatedPermits){}
    public record ReviewInput(boolean approved,@NotBlank String comment){} public record IdView(UUID id){}
}
