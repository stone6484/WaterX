package com.waterx.safety.auth;

import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

public class CurrentUserAuthentication extends AbstractAuthenticationToken {
    private final CurrentUser user;

    public CurrentUserAuthentication(CurrentUser user) {
        super(user.permissions().stream().map(SimpleGrantedAuthority::new).toList());
        this.user = user;
        setAuthenticated(true);
    }

    @Override public Object getCredentials() { return ""; }
    @Override public CurrentUser getPrincipal() { return user; }
}
