package com.waterx.safety.auth;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {
    @Bean PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(12); }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, BearerTokenFilter bearer) throws Exception {
        return http.csrf(csrf -> csrf.disable())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/v1/auth/login", "/api/v1/auth/refresh",
                                "/api/shortcuts/version-check",
                                "/api/v1/public/visitor/**",
                                "/actuator/health", "/v3/api-docs/**", "/swagger-ui/**").permitAll()
                        .anyRequest().authenticated())
                .addFilterBefore(bearer, UsernamePasswordAuthenticationFilter.class)
                .build();
    }
}
