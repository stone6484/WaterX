package com.waterx.safety.auth;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final AuthService auth;
    private final TokenService tokens;

    public AuthController(AuthService auth, TokenService tokens) {
        this.auth = auth;
        this.tokens = tokens;
    }

    @PostMapping("/login")
    TokenService.TokenPair login(@Valid @RequestBody LoginRequest request) {
        return auth.login(request.username(), request.password());
    }

    @PostMapping("/refresh")
    TokenService.TokenPair refresh(@Valid @RequestBody RefreshRequest request) {
        return tokens.refresh(request.refreshToken());
    }

    @PostMapping("/logout")
    void logout(@RequestHeader(HttpHeaders.AUTHORIZATION) String authorization) {
        tokens.revoke(authorization.substring(7));
    }

    @GetMapping("/me")
    CurrentUser me(@AuthenticationPrincipal CurrentUser user) { return user; }

    @PostMapping("/change-password")
    void changePassword(@AuthenticationPrincipal CurrentUser user,
                        @Valid @RequestBody ChangePasswordRequest request) {
        auth.changePassword(user, request.currentPassword(), request.newPassword());
    }

    record LoginRequest(@NotBlank String username, @NotBlank String password) {}
    record RefreshRequest(@NotBlank String refreshToken) {}
    record ChangePasswordRequest(@NotBlank String currentPassword,
                                 @NotBlank @Size(min = 12, max = 128) String newPassword) {}
}
