package com.waterx.safety.auth;

import java.util.Set;
import java.util.UUID;

public record CurrentUser(UUID userId, UUID tenantId, String username, String displayName,
                          boolean mustChangePassword, Set<String> permissions) {
}
