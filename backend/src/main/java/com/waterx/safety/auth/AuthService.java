package com.waterx.safety.auth;

import com.waterx.safety.common.BusinessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class AuthService {
    private final JdbcClient jdbc;
    private final PasswordEncoder encoder;
    private final TokenService tokens;

    public AuthService(JdbcClient jdbc, PasswordEncoder encoder, TokenService tokens) {
        this.jdbc = jdbc;
        this.encoder = encoder;
        this.tokens = tokens;
    }

    public TokenService.TokenPair login(String username, String password) {
        UserRow user = jdbc.sql("""
                select id, tenant_id, password_hash from user_account
                where lower(username) = lower(:username) and status = 'ACTIVE'
                """).param("username", username.trim())
                .query((rs, n) -> new UserRow(rs.getObject("id", UUID.class),
                        rs.getObject("tenant_id", UUID.class), rs.getString("password_hash")))
                .optional().orElseThrow(AuthService::invalidCredentials);
        if (!encoder.matches(password, user.passwordHash())) throw invalidCredentials();
        jdbc.sql("update user_account set last_login_at = now() where id = :id and tenant_id = :tenantId")
                .param("id", user.id()).param("tenantId", user.tenantId()).update();
        return tokens.issue(user.id(), user.tenantId());
    }

    @Transactional
    public void changePassword(CurrentUser user, String currentPassword, String newPassword) {
        String hash = jdbc.sql("select password_hash from user_account where id=:id and tenant_id=:tenantId")
                .param("id", user.userId()).param("tenantId", user.tenantId())
                .query(String.class).single();
        if (!encoder.matches(currentPassword, hash)) throw invalidCredentials();
        jdbc.sql("""
                update user_account set password_hash=:hash, must_change_password=false,
                    password_changed_at=now(), updated_at=now()
                where id=:id and tenant_id=:tenantId
                """).param("hash", encoder.encode(newPassword)).param("id", user.userId())
                .param("tenantId", user.tenantId()).update();
        jdbc.sql("update auth_session set revoked_at=now() where user_id=:id and tenant_id=:tenantId")
                .param("id", user.userId()).param("tenantId", user.tenantId()).update();
    }

    private static BusinessException invalidCredentials() {
        return new BusinessException("INVALID_CREDENTIALS", "用户名或密码错误", HttpStatus.UNAUTHORIZED);
    }

    private record UserRow(UUID id, UUID tenantId, String passwordHash) {}
}
