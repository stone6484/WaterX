package com.waterx.safety.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.waterx.safety.common.ApiError;
import com.waterx.safety.common.BusinessException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class BearerTokenFilter extends OncePerRequestFilter {
    private final TokenService tokens;
    private final ObjectMapper objectMapper;

    public BearerTokenFilter(TokenService tokens, ObjectMapper objectMapper) {
        this.tokens = tokens;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            try {
                CurrentUser user = tokens.authenticate(header.substring(7));
                SecurityContextHolder.getContext().setAuthentication(new CurrentUserAuthentication(user));
            } catch (BusinessException ex) {
                response.setStatus(ex.status().value());
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                objectMapper.writeValue(response.getOutputStream(), ApiError.of(ex.code(), ex.getMessage()));
                return;
            }
        }
        chain.doFilter(request, response);
    }
}
