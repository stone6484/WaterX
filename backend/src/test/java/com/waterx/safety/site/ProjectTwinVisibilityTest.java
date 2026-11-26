package com.waterx.safety.site;

import com.waterx.safety.auth.CurrentUser;
import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.simple.JdbcClient;

import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class ProjectTwinVisibilityTest {
    @Test
    void aTenantRoleOrAnotherSiteDoesNotGrantTheProjectScene() throws Exception {
        try (EmbeddedPostgres pg = EmbeddedPostgres.builder().start()) {
            var ds = pg.getPostgresDatabase();
            Flyway.configure().dataSource(ds).load().migrate();
            JdbcClient db = JdbcClient.create(ds);
            UUID tenant = UUID.fromString("10000000-0000-0000-0000-000000000001");
            UUID first = UUID.fromString("30000000-0000-0000-0000-000000000001");
            UUID second = UUID.fromString("30000000-0000-0000-0000-000000000002");
            UUID role = UUID.randomUUID(), permission = UUID.randomUUID(), person = UUID.randomUUID();
            UUID employee = UUID.randomUUID();
            db.sql("insert into employee(id,tenant_id,site_id,employee_no,display_name,status) values(?,?,?,'twin-test','Local test','ACTIVE')")
                    .params(employee, tenant, first).update();
            db.sql("insert into user_account(id,tenant_id,employee_id,username,password_hash,status) values(?,?,?,'local_read_test','unused','ACTIVE')")
                    .params(person, tenant, employee).update();
            db.sql("insert into role(id,tenant_id,code,name,role_level) values(?,?,'LOCAL_TWIN','Local test','SITE')")
                    .params(role, tenant).update();
            db.sql("insert into permission(id,code,name) values(?,'twin:qingshanhu:read','Local test')").param(permission).update();
            db.sql("insert into role_permission(tenant_id,role_id,permission_id) values(?,?,?)")
                    .params(tenant, role, permission).update();
            db.sql("insert into user_role_scope(id,tenant_id,user_id,role_id,scope_type,scope_id) values(gen_random_uuid(),?,?,?,'TENANT',?)")
                    .params(tenant, person, role, tenant).update();
            var reader = new CurrentUser(person, tenant, "test", "test", false, Set.of("twin:qingshanhu:read"));
            var sites = new SiteAccessService(db);
            assertEquals(first, sites.requireSiteAccess(reader, first));
            assertFalse(sites.mayReadProjectTwin(reader, first));
            db.sql("insert into user_role_scope(id,tenant_id,user_id,role_id,scope_type,scope_id) values(gen_random_uuid(),?,?,?,'SITE',?)")
                    .params(tenant, person, role, first).update();
            assertTrue(sites.mayReadProjectTwin(reader, first));
            assertFalse(sites.mayReadProjectTwin(reader, second));
            db.sql("update user_role_scope set valid_until=now() where scope_type='SITE' and user_id=?").param(person).update();
            assertFalse(sites.mayReadProjectTwin(reader, first));
        }
    }
}
