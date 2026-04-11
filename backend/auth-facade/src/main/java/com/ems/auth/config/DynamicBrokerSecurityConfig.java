package com.ems.auth.config;

import com.ems.auth.security.ProviderAgnosticRoleConverter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.core.annotation.Order;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Dynamic Identity Broker Security Configuration.
 *
 * This configuration provides five security filter chains (evaluated in order):
 * 1. Management API (Admin Operations) - Requires ADMIN role with JWT authentication
 * 2. Public Auth Endpoints - Truly public, no oauth2ResourceServer or oauth2Login
 * 3. OAuth2 SSO Flow - Redirect-based OAuth2/OIDC login flows
 * 4. Authenticated Auth Endpoints - Auth endpoints requiring JWT (/me, /mfa/setup)
 * 5. Default Security - Catch-all for actuator, swagger, and other endpoints
 *
 * IMPORTANT: Public endpoints (Chain 2) deliberately omit oauth2ResourceServer
 * and oauth2Login to prevent their authentication entry points from interfering
 * with permitAll() access. This separation resolves the 403 issue where
 * oauth2Login would intercept unauthenticated requests to public paths.
 *
 * The configuration supports dynamic identity provider management through Neo4j
 * while maintaining backward compatibility with static provider configuration.
 *
 * NOTE: CORS is handled by the API Gateway. Do NOT add CORS config here
 * to avoid duplicate Access-Control-Allow-Origin headers.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
@Slf4j
public class DynamicBrokerSecurityConfig {

    private final ProviderAgnosticRoleConverter providerAgnosticRoleConverter;

    @Bean
    @Order(0)
    public SecurityFilterChain internalServiceSecurityFilterChain(HttpSecurity http) throws Exception {
        log.info("Configuring Internal Service security filter chain (Order 0)");

        http
            .securityMatcher("/internal/**", "/api/v1/internal/**")
            .csrf(AbstractHttpConfigurer::disable)
            .cors(AbstractHttpConfigurer::disable)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .anyRequest().hasAuthority("SCOPE_internal.service")
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter()))
            );

        return http.build();
    }

    /**
     * CHAIN 1: Management API (Neo4j Admin Operations) - Order 1
     *
     * Secures admin endpoints for managing identity providers per tenant.
     * Requires ADMIN role and uses OAuth2 Resource Server with JWT.
     *
     * Endpoints:
     * - GET /api/v1/admin/tenants/{tenantId}/providers - List providers
     * - POST /api/v1/admin/tenants/{tenantId}/providers - Register new IdP
     * - PUT /api/v1/admin/tenants/{tenantId}/providers/{providerId} - Update provider
     * - DELETE /api/v1/admin/tenants/{tenantId}/providers/{providerId} - Delete provider
     */
    @Bean
    @Order(1)
    public SecurityFilterChain adminSecurityFilterChain(HttpSecurity http) throws Exception {
        log.info("Configuring Admin Management API security filter chain (Order 1)");

        http
            .securityMatcher("/api/v1/admin/**")
            .csrf(AbstractHttpConfigurer::disable)
            // CORS disabled - handled by API Gateway to prevent duplicate headers
            .cors(AbstractHttpConfigurer::disable)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Swagger documentation for admin API
                .requestMatchers("/api/v1/admin/swagger-ui/**", "/api/v1/admin/api-docs/**").permitAll()
                // All admin endpoints require ADMIN or SUPER_ADMIN role
                .requestMatchers("/api/v1/admin/**").hasAnyRole("ADMIN", "SUPER_ADMIN")
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter()))
            )
            .headers(headers -> headers
                .httpStrictTransportSecurity(hsts -> hsts
                    .includeSubDomains(true)
                    .maxAgeInSeconds(31536000))
                .frameOptions(frame -> frame.deny())
                .contentTypeOptions(Customizer.withDefaults())
                .referrerPolicy(referrer -> referrer
                    .policy(org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
                .contentSecurityPolicy(csp -> csp
                    .policyDirectives("default-src 'self'; frame-ancestors 'none'"))
            );

        return http.build();
    }

    /**
     * CHAIN 2: Public Auth Endpoints (truly public, no auth framework) - Order 2
     *
     * Handles public authentication endpoints that must be accessible without
     * any authentication. No oauth2ResourceServer or oauth2Login is configured
     * here to avoid authentication entry points interfering with permitAll().
     *
     * Endpoints:
     * - /api/v1/auth/login - Login (POST)
     * - /api/v1/auth/login/** - Dynamic provider selection
     * - /api/v1/auth/callback/** - OAuth callback
     * - /api/v1/auth/providers - List available providers
     * - /api/v1/auth/providers/** - Provider details
     * - /api/v1/auth/social/** - Social login endpoints
     * - /api/v1/auth/refresh - Token refresh
     * - /api/v1/auth/logout - Logout
     * - /api/v1/auth/mfa/verify - MFA verification
     */
    @Bean
    @Order(2)
    public SecurityFilterChain publicAuthSecurityFilterChain(HttpSecurity http) throws Exception {
        log.info("Configuring Public Auth security filter chain (Order 2)");

        http
            .securityMatcher(
                "/api/v1/auth/login", "/api/v1/auth/login/**",
                "/api/v1/auth/messages",
                "/api/v1/auth/callback", "/api/v1/auth/callback/**",
                "/api/v1/auth/providers", "/api/v1/auth/providers/**",
                "/api/v1/auth/social/**",
                "/api/v1/auth/refresh",
                "/api/v1/auth/logout",
                "/api/v1/auth/mfa/verify"
            )
            .csrf(AbstractHttpConfigurer::disable)
            // CORS disabled - handled by API Gateway to prevent duplicate headers
            .cors(AbstractHttpConfigurer::disable)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .anyRequest().permitAll()
            )
            // No oauth2ResourceServer or oauth2Login - these are truly public endpoints
            .headers(headers -> headers
                .httpStrictTransportSecurity(hsts -> hsts
                    .includeSubDomains(true)
                    .maxAgeInSeconds(31536000))
                .frameOptions(frame -> frame.deny())
                .contentTypeOptions(Customizer.withDefaults())
                .referrerPolicy(referrer -> referrer
                    .policy(org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
                .contentSecurityPolicy(csp -> csp
                    .policyDirectives("default-src 'self'; frame-ancestors 'none'"))
            );

        return http.build();
    }

    /**
     * CHAIN 3: OAuth2 Redirect-Based SSO Flow - Order 3
     *
     * Handles OAuth2/OIDC redirect-based login flows (BFF handshake).
     * This chain is separate from the public chain to prevent oauth2Login's
     * authentication entry point from interfering with truly public endpoints.
     */
    @Bean
    @Order(3)
    @ConditionalOnBean(ClientRegistrationRepository.class)
    public SecurityFilterChain oauthSsoSecurityFilterChain(HttpSecurity http) throws Exception {
        log.info("Configuring OAuth2 SSO security filter chain (Order 3)");

        http
            .securityMatcher("/api/v1/auth/oauth2/**")
            .csrf(AbstractHttpConfigurer::disable)
            // CORS disabled - handled by API Gateway to prevent duplicate headers
            .cors(AbstractHttpConfigurer::disable)
            .oauth2Login(oauth2 -> oauth2
                .loginPage("/api/v1/auth/login")
                .authorizationEndpoint(authorization -> authorization
                    .baseUri("/api/v1/auth/oauth2/authorization")
                )
                .redirectionEndpoint(redirection -> redirection
                    .baseUri("/api/v1/auth/callback/*")
                )
            )
            .headers(headers -> headers
                .httpStrictTransportSecurity(hsts -> hsts
                    .includeSubDomains(true)
                    .maxAgeInSeconds(31536000))
                .frameOptions(frame -> frame.deny())
                .contentTypeOptions(Customizer.withDefaults())
                .referrerPolicy(referrer -> referrer
                    .policy(org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
                .contentSecurityPolicy(csp -> csp
                    .policyDirectives("default-src 'self'; frame-ancestors 'none'"))
            );

        return http.build();
    }

    /**
     * CHAIN 4: Authenticated Auth Endpoints - Order 4
     *
     * Handles auth endpoints that require JWT authentication:
     * - /api/v1/auth/mfa/setup - MFA setup (requires auth)
     * - /api/v1/auth/me - Current user profile (requires auth)
     * - Any other /api/v1/auth/** not matched by chains 2 or 3
     */
    @Bean
    @Order(4)
    public SecurityFilterChain authenticatedAuthSecurityFilterChain(HttpSecurity http) throws Exception {
        log.info("Configuring Authenticated Auth security filter chain (Order 4)");

        http
            .securityMatcher("/api/v1/auth/**")
            .csrf(AbstractHttpConfigurer::disable)
            // CORS disabled - handled by API Gateway to prevent duplicate headers
            .cors(AbstractHttpConfigurer::disable)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/auth/mfa/setup").authenticated()
                .requestMatchers("/api/v1/auth/me").authenticated()
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter()))
            )
            .headers(headers -> headers
                .httpStrictTransportSecurity(hsts -> hsts
                    .includeSubDomains(true)
                    .maxAgeInSeconds(31536000))
                .frameOptions(frame -> frame.deny())
                .contentTypeOptions(Customizer.withDefaults())
                .referrerPolicy(referrer -> referrer
                    .policy(org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
                .contentSecurityPolicy(csp -> csp
                    .policyDirectives("default-src 'self'; frame-ancestors 'none'"))
            );

        return http.build();
    }

    /**
     * CHAIN 5: Default Security (catch-all for other endpoints) - Order 5
     *
     * Handles actuator, swagger, and any other endpoints not covered
     * by the admin, auth, or OAuth2 filter chains.
     */
    @Bean
    @Order(5)
    public SecurityFilterChain defaultSecurityFilterChain(HttpSecurity http) throws Exception {
        log.info("Configuring default security filter chain (Order 5)");

        http
            .csrf(AbstractHttpConfigurer::disable)
            // CORS disabled - handled by API Gateway to prevent duplicate headers
            .cors(AbstractHttpConfigurer::disable)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Health and actuator endpoints
                .requestMatchers("/actuator/**").permitAll()
                // Swagger/OpenAPI documentation
                .requestMatchers("/swagger-ui/**", "/api-docs/**", "/v3/api-docs/**").permitAll()
                .requestMatchers("/swagger-ui.html").permitAll()
                // Event controller (if any protected endpoints)
                .requestMatchers("/api/v1/events/**").authenticated()
                // Default: require authentication
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter()))
            )
            .headers(headers -> headers
                .httpStrictTransportSecurity(hsts -> hsts
                    .includeSubDomains(true)
                    .maxAgeInSeconds(31536000))
                .frameOptions(frame -> frame.deny())
                .contentTypeOptions(Customizer.withDefaults())
                .referrerPolicy(referrer -> referrer
                    .policy(org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
                .contentSecurityPolicy(csp -> csp
                    .policyDirectives("default-src 'self'; frame-ancestors 'none'"))
            );

        return http.build();
    }

    /**
     * JWT Authentication Converter using ProviderAgnosticRoleConverter.
     *
     * This converter extracts roles from JWT tokens in a provider-agnostic way,
     * supporting Keycloak, Auth0, Okta, Azure AD, and other identity providers.
     */
    private JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(providerAgnosticRoleConverter);
        return converter;
    }
}
