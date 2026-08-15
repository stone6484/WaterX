package com.waterx.safety.bootstrap;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.UUID;

@Component
public class BootstrapAdminInitializer implements ApplicationRunner {
    private final JdbcClient jdbc;
    private final PasswordEncoder encoder;
    private final String username;
    private final String password;

    public BootstrapAdminInitializer(JdbcClient jdbc, PasswordEncoder encoder,
                                     @Value("${app.bootstrap.admin-username:}") String username,
                                     @Value("${app.bootstrap.admin-password:}") String password) {
        this.jdbc = jdbc;
        this.encoder = encoder;
        this.username = username;
        this.password = password;
    }

    @Override @Transactional
    public void run(ApplicationArguments args) {
        if (!StringUtils.hasText(username) || !StringUtils.hasText(password)) return;
        if (password.length() < 12) throw new IllegalStateException("Bootstrap administrator password must be at least 12 characters");
        UUID tenantId = UUID.fromString("10000000-0000-0000-0000-000000000001");
        UUID employeeId = UUID.fromString("40000000-0000-0000-0000-000000000001");
        UUID userId = UUID.fromString("50000000-0000-0000-0000-000000000001");
        int exists = jdbc.sql("select count(*) from user_account where tenant_id=:tenantId and lower(username)=lower(:username)")
                .param("tenantId", tenantId).param("username", username).query(Integer.class).single();
        if (exists > 0) return;
        jdbc.sql("""
                insert into user_account(id, tenant_id, employee_id, username, password_hash, status,
                                         must_change_password, created_at, updated_at)
                values (:id,:tenantId,:employeeId,:username,:password,'ACTIVE',true,now(),now())
                """).param("id", userId).param("tenantId", tenantId).param("employeeId", employeeId)
                .param("username", username).param("password", encoder.encode(password)).update();
        jdbc.sql("""
                insert into user_role_scope(id, tenant_id, user_id, role_id, scope_type, scope_id, created_at)
                values (:id,:tenantId,:userId,'60000000-0000-0000-0000-000000000001','TENANT',:tenantId,now())
                """).param("id", UUID.randomUUID()).param("tenantId", tenantId)
                .param("userId", userId).update();
    }
}
