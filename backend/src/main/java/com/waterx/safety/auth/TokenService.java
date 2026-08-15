package com.waterx.safety.auth;

import com.waterx.safety.common.BusinessException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HashSet;
import java.util.HexFormat;
import java.util.Set;
import java.util.UUID;

@Service
public class TokenService {
    private final JdbcClient jdbc;
    private final Duration accessTtl;
    private final Duration refreshTtl;

    public TokenService(JdbcClient jdbc,
                        @Value("${app.auth.access-token-minutes:30}") long accessMinutes,
                        @Value("${app.auth.refresh-token-days:14}") long refreshDays) {
        this.jdbc = jdbc;
        this.accessTtl = Duration.ofMinutes(accessMinutes);
        this.refreshTtl = Duration.ofDays(refreshDays);
    }

    @Transactional
    public TokenPair issue(UUID userId, UUID tenantId) {
        String access = randomToken();
        String refresh = randomToken();
        jdbc.sql("""
                insert into auth_session(id, tenant_id, user_id, access_token_hash, refresh_token_hash,
                                         access_expires_at, refresh_expires_at, created_at)
                values (:id, :tenantId, :userId, :accessHash, :refreshHash, :accessExpiry, :refreshExpiry, now())
                """)
                .param("id", UUID.randomUUID())
                .param("tenantId", tenantId)
                .param("userId", userId)
                .param("accessHash", hash(access))
                .param("refreshHash", hash(refresh))
                .param("accessExpiry", Timestamp.from(Instant.now().plus(accessTtl)))
                .param("refreshExpiry", Timestamp.from(Instant.now().plus(refreshTtl)))
                .update();
        return new TokenPair(access, refresh, accessTtl.toSeconds(), "Bearer");
    }

    public CurrentUser authenticate(String rawAccessToken) {
        var row = jdbc.sql("""
                select u.id user_id, u.tenant_id, u.username, e.display_name, u.must_change_password
                from auth_session s
                join user_account u on u.id = s.user_id and u.tenant_id = s.tenant_id
                join employee e on e.id = u.employee_id and e.tenant_id = u.tenant_id
                where s.access_token_hash = :hash and s.revoked_at is null
                  and s.access_expires_at > now() and u.status = 'ACTIVE'
                """)
                .param("hash", hash(rawAccessToken))
                .query((rs, n) -> new CurrentUser(
                        rs.getObject("user_id", UUID.class),
                        rs.getObject("tenant_id", UUID.class),
                        rs.getString("username"), rs.getString("display_name"),
                        rs.getBoolean("must_change_password"), Set.of()))
                .optional().orElseThrow(() -> new BusinessException(
                        "INVALID_TOKEN", "登录状态无效或已过期", HttpStatus.UNAUTHORIZED));
        return new CurrentUser(row.userId(), row.tenantId(), row.username(), row.displayName(),
                row.mustChangePassword(), loadPermissions(row.userId(), row.tenantId()));
    }

    @Transactional
    public TokenPair refresh(String rawRefreshToken) {
        var session = jdbc.sql("""
                select id, user_id, tenant_id from auth_session
                where refresh_token_hash = :hash and revoked_at is null and refresh_expires_at > now()
                for update
                """).param("hash", hash(rawRefreshToken))
                .query((rs, n) -> new SessionRow(rs.getObject("id", UUID.class),
                        rs.getObject("user_id", UUID.class), rs.getObject("tenant_id", UUID.class)))
                .optional().orElseThrow(() -> new BusinessException(
                        "INVALID_REFRESH_TOKEN", "刷新令牌无效或已过期", HttpStatus.UNAUTHORIZED));
        jdbc.sql("update auth_session set revoked_at = now() where id = :id")
                .param("id", session.id()).update();
        return issue(session.userId(), session.tenantId());
    }

    public void revoke(String rawAccessToken) {
        jdbc.sql("update auth_session set revoked_at = now() where access_token_hash = :hash and revoked_at is null")
                .param("hash", hash(rawAccessToken)).update();
    }

    private Set<String> loadPermissions(UUID userId, UUID tenantId) {
        return new HashSet<>(jdbc.sql("""
                select distinct p.code
                from user_role_scope urs
                join role_permission rp on rp.role_id = urs.role_id and rp.tenant_id = urs.tenant_id
                join permission p on p.id = rp.permission_id
                where urs.user_id = :userId and urs.tenant_id = :tenantId
                """).param("userId", userId).param("tenantId", tenantId)
                .query(String.class).list());
    }

    static String hash(String token) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    private static String randomToken() {
        byte[] bytes = new byte[32];
        new java.security.SecureRandom().nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private record SessionRow(UUID id, UUID userId, UUID tenantId) {}
    public record TokenPair(String accessToken, String refreshToken, long expiresIn, String tokenType) {}
}
