package com.waterx.safety.auth;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class TokenServiceTest {
    @Test
    void hashesTokensDeterministicallyWithoutStoringRawValue() {
        String raw = "raw-session-token";
        String hash = TokenService.hash(raw);
        assertThat(hash).hasSize(64).isNotEqualTo(raw);
        assertThat(TokenService.hash(raw)).isEqualTo(hash);
        assertThat(TokenService.hash(raw + "x")).isNotEqualTo(hash);
    }
}
