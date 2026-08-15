package com.waterx.safety.risk;

import com.waterx.safety.auth.CurrentUser;
import com.waterx.safety.common.BusinessException;
import com.waterx.safety.site.SiteAccessService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/risk/areas")
public class AreaController {
    private final JdbcClient jdbc;
    private final SiteAccessService sites;

    public AreaController(JdbcClient jdbc, SiteAccessService sites) {
        this.jdbc = jdbc;
        this.sites = sites;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('risk:read')")
    List<AreaView> list(@AuthenticationPrincipal CurrentUser user, @RequestHeader("X-Site-Id") UUID siteId) {
        sites.requireSiteAccess(user, siteId);
        return jdbc.sql("""
                select a.id,a.parent_id,a.code,a.name,a.area_type,a.status,
                       (select count(*) from risk_object ro where ro.tenant_id=a.tenant_id and ro.area_id=a.id and ro.status='ACTIVE') object_count
                from area a where a.tenant_id=:tenantId and a.site_id=:siteId
                order by a.code
                """).param("tenantId", user.tenantId()).param("siteId", siteId)
                .query((rs, n) -> new AreaView(rs.getObject("id", UUID.class), rs.getObject("parent_id", UUID.class),
                        rs.getString("code"), rs.getString("name"), rs.getString("area_type"),
                        rs.getString("status"), rs.getInt("object_count"))).list();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('risk:manage')")
    @Transactional
    IdResponse create(@AuthenticationPrincipal CurrentUser user, @RequestHeader("X-Site-Id") UUID siteId,
                      @Valid @RequestBody AreaRequest request) {
        sites.requireSiteAccess(user, siteId);
        validateParent(user, siteId, request.parentId());
        UUID id = UUID.randomUUID();
        jdbc.sql("insert into area(id,tenant_id,site_id,parent_id,code,name,area_type) values(:id,:tenantId,:siteId,:parentId,:code,:name,:type)")
                .param("id", id).param("tenantId", user.tenantId()).param("siteId", siteId)
                .param("parentId", request.parentId()).param("code", request.code()).param("name", request.name())
                .param("type", request.areaType()).update();
        return new IdResponse(id);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('risk:manage')")
    @Transactional
    void update(@AuthenticationPrincipal CurrentUser user, @RequestHeader("X-Site-Id") UUID siteId,
                @PathVariable UUID id, @Valid @RequestBody AreaRequest request) {
        sites.requireSiteAccess(user, siteId);
        if (id.equals(request.parentId())) throw new BusinessException("INVALID_AREA_PARENT", "区域不能以自身为上级", HttpStatus.BAD_REQUEST);
        validateParent(user, siteId, request.parentId());
        int changed = jdbc.sql("update area set parent_id=:parentId,code=:code,name=:name,area_type=:type,updated_at=now() where tenant_id=:tenantId and site_id=:siteId and id=:id")
                .param("parentId", request.parentId()).param("code", request.code()).param("name", request.name())
                .param("type", request.areaType()).param("tenantId", user.tenantId()).param("siteId", siteId).param("id", id).update();
        if (changed == 0) throw new BusinessException("AREA_NOT_FOUND", "区域不存在或不属于当前厂区", HttpStatus.NOT_FOUND);
    }

    @PostMapping("/{id}/disable")
    @PreAuthorize("hasAuthority('risk:manage')")
    void disable(@AuthenticationPrincipal CurrentUser user, @RequestHeader("X-Site-Id") UUID siteId, @PathVariable UUID id) {
        sites.requireSiteAccess(user, siteId);
        int children = jdbc.sql("select count(*) from area where tenant_id=:tenantId and site_id=:siteId and parent_id=:id and status='ACTIVE'")
                .param("tenantId", user.tenantId()).param("siteId", siteId).param("id", id).query(Integer.class).single();
        if (children > 0) throw new BusinessException("AREA_HAS_ACTIVE_CHILDREN", "请先停用下级区域", HttpStatus.CONFLICT);
        jdbc.sql("update area set status='INACTIVE',updated_at=now() where tenant_id=:tenantId and site_id=:siteId and id=:id")
                .param("tenantId", user.tenantId()).param("siteId", siteId).param("id", id).update();
    }

    private void validateParent(CurrentUser user, UUID siteId, UUID parentId) {
        if (parentId == null) return;
        int count = jdbc.sql("select count(*) from area where tenant_id=:tenantId and site_id=:siteId and id=:id and status='ACTIVE'")
                .param("tenantId", user.tenantId()).param("siteId", siteId).param("id", parentId).query(Integer.class).single();
        if (count == 0) throw new BusinessException("AREA_PARENT_NOT_FOUND", "上级区域不存在或不属于当前厂区", HttpStatus.BAD_REQUEST);
    }

    record AreaView(UUID id, UUID parentId, String code, String name, String areaType, String status, int objectCount) {}
    record AreaRequest(UUID parentId, @NotBlank String code, @NotBlank String name, @NotBlank String areaType) {}
    record IdResponse(UUID id) {}
}
