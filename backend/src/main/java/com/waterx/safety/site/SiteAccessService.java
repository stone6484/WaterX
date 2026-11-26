package com.waterx.safety.site;

import com.waterx.safety.auth.CurrentUser;
import com.waterx.safety.common.BusinessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class SiteAccessService {
    private final JdbcClient jdbc;

    public SiteAccessService(JdbcClient jdbc) { this.jdbc = jdbc; }

    public List<SiteView> accessibleSites(CurrentUser user) {
        return jdbc.sql("""
                select distinct s.id, s.code, s.name, s.time_zone
                from site s
                join user_role_scope urs on urs.tenant_id=s.tenant_id and urs.user_id=:userId
                where s.tenant_id=:tenantId and s.status='ACTIVE'
                  and (urs.scope_type in ('TENANT','COMPANY','REGION') or
                       (urs.scope_type='SITE' and urs.scope_id=s.id))
                order by s.code
                """).param("userId", user.userId()).param("tenantId", user.tenantId())
                .query((rs, n) -> new SiteView(rs.getObject("id", UUID.class), rs.getString("code"),
                        rs.getString("name"), rs.getString("time_zone"))).list();
    }

    public UUID requireSiteAccess(CurrentUser user, UUID siteId) {
        boolean allowed = accessibleSites(user).stream().anyMatch(site -> site.id().equals(siteId));
        if (!allowed) throw new BusinessException("SITE_ACCESS_DENIED", "无权访问该污水处理厂", HttpStatus.FORBIDDEN);
        return siteId;
    }

    boolean mayReadProjectTwin(CurrentUser user, UUID siteId) {
        return jdbc.sql("""
                select exists (
                    select 1 from user_role_scope scope
                    join role r on r.tenant_id=scope.tenant_id and r.id=scope.role_id
                    join role_permission rp on rp.tenant_id=r.tenant_id and rp.role_id=r.id
                    join permission p on p.id=rp.permission_id
                    where scope.tenant_id=:tenant and scope.user_id=:user
                      and scope.scope_type='SITE' and scope.scope_id=:site
                      and scope.valid_from<=now() and (scope.valid_until is null or scope.valid_until>now())
                      and r.status='ACTIVE' and p.code='twin:qingshanhu:read'
                )
                """).param("tenant", user.tenantId()).param("user", user.userId())
                .param("site", siteId).query(Boolean.class).single();
    }

    public record SiteView(UUID id, String code, String name, String timeZone) {}
}
