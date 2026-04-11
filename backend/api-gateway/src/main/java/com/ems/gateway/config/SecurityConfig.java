package com.ems.gateway.config;

import org.springframework.core.convert.converter.Converter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.ReactiveJwtAuthenticationConverterAdapter;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.security.web.server.header.StaticServerHttpHeadersWriter;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * Security Configuration for API Gateway
 *
 * Zero-trust gateway policy:
 * - Explicit allow-list for public endpoints
 * - Deny access to internal endpoints from edge traffic
 * - Require JWT for all other exchanges
 * - Enforce coarse role checks for privileged route groups
 */
@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    private static final String HSTS_HEADER_VALUE = "max-age=31536000 ; includeSubDomains";

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        return http
            // SEC-C03: CSRF disabled — all API endpoints use Bearer token authentication
            // (Authorization header), which is immune to CSRF because browsers do not
            // automatically attach it to cross-origin requests.
            .csrf(csrf -> csrf.disable())
            .authorizeExchange(exchange -> exchange
                // Public/auth bootstrap endpoints
                .pathMatchers("/api/tenants/resolve").permitAll()
                .pathMatchers("/api/tenants/validate/**").permitAll()
                .pathMatchers("/api/v1/auth/login").permitAll()
                .pathMatchers("/api/v1/auth/login/**").permitAll()
                .pathMatchers("/api/v1/auth/messages").permitAll()
                .pathMatchers("/api/v1/auth/providers").permitAll()
                .pathMatchers("/api/v1/auth/providers/**").permitAll()
                .pathMatchers("/api/v1/auth/social/**").permitAll()
                .pathMatchers("/api/v1/auth/refresh").permitAll()
                .pathMatchers("/api/v1/auth/logout").permitAll()
                .pathMatchers("/api/v1/auth/mfa/verify").permitAll()
                .pathMatchers("/api/v1/auth/password/reset").permitAll()
                .pathMatchers("/api/v1/auth/password/reset/confirm").permitAll()
                .pathMatchers("/actuator/health", "/actuator/health/**").permitAll()
                .pathMatchers("/actuator/**").authenticated()
                .pathMatchers("/services/*/health").permitAll()
                // Internal APIs are never exposed via edge gateway routes
                .pathMatchers("/api/v1/internal/**").denyAll()
                // Privileged route groups
                .pathMatchers("/api/v1/admin/**").hasAnyRole("ADMIN", "SUPER_ADMIN")
                .pathMatchers("/api/v1/tenants/*/seats/**").hasAnyRole("TENANT_ADMIN", "ADMIN", "SUPER_ADMIN")
                // Default deny-by-auth policy
                .anyExchange().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter()))
            )
            .headers(headers -> headers
                // The gateway commonly sits behind TLS termination, so the app may only
                // observe internal HTTP while the browser sees HTTPS at the edge.
                // Write HSTS explicitly so edge responses remain policy-complete.
                .writer(StaticServerHttpHeadersWriter.builder()
                    .header("Strict-Transport-Security", HSTS_HEADER_VALUE)
                    .build())
                .frameOptions(frame -> frame
                    .mode(org.springframework.security.web.server.header.XFrameOptionsServerHttpHeadersWriter.Mode.DENY))
                .contentTypeOptions(Customizer.withDefaults())
                .referrerPolicy(referrer -> referrer
                    .policy(org.springframework.security.web.server.header.ReferrerPolicyServerHttpHeadersWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
                .contentSecurityPolicy(csp -> csp
                    .policyDirectives("default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; frame-ancestors 'none'"))
                .permissionsPolicy(permissions -> permissions
                    .policy("camera=(), microphone=(), geolocation=()"))
            )
            .build();
    }

    private Converter<Jwt, Mono<AbstractAuthenticationToken>> jwtAuthenticationConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(this::extractAuthorities);
        return new ReactiveJwtAuthenticationConverterAdapter(converter);
    }

    @SuppressWarnings("unchecked")
    private Collection<GrantedAuthority> extractAuthorities(Jwt jwt) {
        Set<GrantedAuthority> authorities = new HashSet<>();

        Object realmAccess = jwt.getClaim("realm_access");
        if (realmAccess instanceof Map<?, ?> realmMap) {
            addRolesFromUnknown(authorities, realmMap.get("roles"));
        }

        Object resourceAccess = jwt.getClaim("resource_access");
        if (resourceAccess instanceof Map<?, ?> resourceMap) {
            for (Object clientAccess : resourceMap.values()) {
                if (clientAccess instanceof Map<?, ?> clientMap) {
                    addRolesFromUnknown(authorities, clientMap.get("roles"));
                }
            }
        }

        addRolesFromUnknown(authorities, jwt.getClaim("roles"));
        addScopes(authorities, jwt.getClaimAsString("scope"));
        addScopes(authorities, jwt.getClaimAsString("scp"));

        return authorities;
    }

    private void addRolesFromUnknown(Set<GrantedAuthority> authorities, Object roles) {
        if (roles == null) {
            return;
        }

        if (roles instanceof Collection<?> values) {
            for (Object value : values) {
                if (value != null) {
                    addRole(authorities, value.toString());
                }
            }
            return;
        }

        addRole(authorities, roles.toString());
    }

    private void addRole(Set<GrantedAuthority> authorities, String rawRole) {
        if (rawRole == null || rawRole.isBlank()) {
            return;
        }

        String role = rawRole.trim();
        if (role.startsWith("ROLE_")) {
            role = role.substring("ROLE_".length());
        }

        role = role.replace('-', '_').toUpperCase(Locale.ROOT);
        authorities.add(new SimpleGrantedAuthority("ROLE_" + role));
    }

    private void addScopes(Set<GrantedAuthority> authorities, String rawScopes) {
        if (rawScopes == null || rawScopes.isBlank()) {
            return;
        }

        String[] segments = rawScopes.trim().split("\\s+");
        Collection<String> scopes = new ArrayList<>();
        for (String segment : segments) {
            if (!segment.isBlank()) {
                scopes.add(segment.trim());
            }
        }

        for (String scope : scopes) {
            authorities.add(new SimpleGrantedAuthority("SCOPE_" + scope));
        }
    }
}
