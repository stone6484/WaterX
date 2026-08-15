package com.waterx.safety.organization;

import com.waterx.safety.auth.CurrentUser;
import com.waterx.safety.site.SiteAccessService;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/org")
public class OrganizationController {
    private final JdbcClient jdbc;
    private final SiteAccessService sites;

    public OrganizationController(JdbcClient jdbc, SiteAccessService sites) {
        this.jdbc = jdbc;
        this.sites = sites;
    }

    @GetMapping("/units")
    @PreAuthorize("hasAuthority('org:read')")
    List<OrgUnitView> units(@AuthenticationPrincipal CurrentUser user,
                            @RequestHeader("X-Site-Id") UUID siteId) {
        sites.requireSiteAccess(user, siteId);
        return jdbc.sql("""
                select id, parent_id, code, name, unit_type, sort_order
                from org_unit where tenant_id=:tenantId and site_id=:siteId and status='ACTIVE'
                order by sort_order, code
                """).param("tenantId", user.tenantId()).param("siteId", siteId)
                .query((rs, n) -> new OrgUnitView(rs.getObject("id", UUID.class),
                        rs.getObject("parent_id", UUID.class), rs.getString("code"), rs.getString("name"),
                        rs.getString("unit_type"), rs.getInt("sort_order"))).list();
    }

    @GetMapping("/employees")
    @PreAuthorize("hasAuthority('employee:read')")
    List<EmployeeView> employees(@AuthenticationPrincipal CurrentUser user,
                                  @RequestHeader("X-Site-Id") UUID siteId) {
        sites.requireSiteAccess(user, siteId);
        return jdbc.sql("""
                select e.id, e.employee_no, e.display_name, e.status,
                       ou.name org_name, p.name position_name
                from employee e
                left join employee_position ep on ep.employee_id=e.id and ep.tenant_id=e.tenant_id
                    and ep.is_primary=true and ep.end_date is null
                left join org_unit ou on ou.id=ep.org_unit_id and ou.tenant_id=ep.tenant_id
                left join position p on p.id=ep.position_id and p.tenant_id=ep.tenant_id
                where e.tenant_id=:tenantId and e.site_id=:siteId
                order by e.employee_no
                """).param("tenantId", user.tenantId()).param("siteId", siteId)
                .query((rs, n) -> new EmployeeView(rs.getObject("id", UUID.class),
                        rs.getString("employee_no"), rs.getString("display_name"), rs.getString("status"),
                        rs.getString("org_name"), rs.getString("position_name"))).list();
    }

    @GetMapping("/employees/{employeeId}/safety-archive")
    @PreAuthorize("hasAuthority('employee:read')")
    SafetyArchiveView safetyArchive(@AuthenticationPrincipal CurrentUser user,@RequestHeader("X-Site-Id") UUID siteId,
                                    @PathVariable UUID employeeId) {
        sites.requireSiteAccess(user,siteId);
        EmployeeView employee=jdbc.sql("""
                select e.id,e.employee_no,e.display_name,e.status,ou.name,p.name from employee e
                left join employee_position ep on ep.tenant_id=e.tenant_id and ep.employee_id=e.id and ep.is_primary=true and ep.end_date is null
                left join org_unit ou on ou.tenant_id=ep.tenant_id and ou.id=ep.org_unit_id left join position p on p.tenant_id=ep.tenant_id and p.id=ep.position_id
                where e.tenant_id=:tenantId and e.site_id=:siteId and e.id=:id
                """).param("tenantId",user.tenantId()).param("siteId",siteId).param("id",employeeId)
                .query((r,n)->new EmployeeView(r.getObject(1,UUID.class),r.getString(2),r.getString(3),r.getString(4),r.getString(5),r.getString(6))).optional()
                .orElseThrow(()->new com.waterx.safety.common.BusinessException("EMPLOYEE_NOT_FOUND","员工档案不存在",org.springframework.http.HttpStatus.NOT_FOUND));
        List<ArchiveItem> trainings=jdbc.sql("select c.name,a.status,coalesce(a.exam_score::text,'—'),a.completed_at::text from safety_training_assignment a join safety_training_course c on c.tenant_id=a.tenant_id and c.id=a.course_id where a.tenant_id=:t and a.employee_id=:e order by a.assigned_at desc").param("t",user.tenantId()).param("e",employeeId).query((r,n)->new ArchiveItem(r.getString(1),r.getString(2),"考试成绩 "+r.getString(3),r.getString(4))).list();
        List<ArchiveItem> qualifications=jdbc.sql("select certificate_name,case when expires_on<current_date then 'EXPIRED' when expires_on<=current_date+reminder_days then 'EXPIRING' else 'VALID' end,certificate_no,expires_on::text from employee_qualification where tenant_id=:t and employee_id=:e order by expires_on").param("t",user.tenantId()).param("e",employeeId).query((r,n)->new ArchiveItem(r.getString(1),r.getString(2),r.getString(3),r.getString(4))).list();
        List<ArchiveItem> commitments=jdbc.sql("select t.name,a.status,coalesce(a.signature_text,'未签名'),coalesce(a.signed_at::text,a.due_at::text) from safety_commitment_assignment a join safety_commitment_template t on t.tenant_id=a.tenant_id and t.id=a.template_id where a.tenant_id=:t and a.employee_id=:e order by a.assigned_at desc").param("t",user.tenantId()).param("e",employeeId).query((r,n)->new ArchiveItem(r.getString(1),r.getString(2),r.getString(3),r.getString(4))).list();
        List<ArchiveItem> healthExams=jdbc.sql("select exam_type,conclusion,medical_institution,exam_date::text from occupational_health_exam where tenant_id=:t and employee_id=:e order by exam_date desc").param("t",user.tenantId()).param("e",employeeId).query((r,n)->new ArchiveItem(r.getString(1),r.getString(2),r.getString(3),r.getString(4))).list();
        return new SafetyArchiveView(employee,trainings,qualifications,commitments,healthExams);
    }

    record OrgUnitView(UUID id, UUID parentId, String code, String name, String unitType, int sortOrder) {}
    record EmployeeView(UUID id, String employeeNo, String displayName, String status,
                        String organization, String position) {}
    record ArchiveItem(String name,String status,String detail,String recordedAt) {}
    record SafetyArchiveView(EmployeeView employee,List<ArchiveItem> trainings,List<ArchiveItem> qualifications,List<ArchiveItem> commitments,List<ArchiveItem> healthExams) {}
}
