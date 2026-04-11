package com.ems.auth.config;

import com.ems.auth.filter.JwtValidationFilter;
import com.ems.auth.filter.RateLimitFilter;
import com.ems.auth.filter.TenantContextFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Legacy Security configuration for auth-facade.
 *
 * This configuration is disabled by default when the dynamic identity broker
 * is enabled (auth.dynamic-broker.enabled=true). The new DynamicBrokerSecurityConfig
 * provides enhanced security with role-based admin endpoints.
 *
 * NOTE: CORS is handled by the API Gateway. Do NOT add CORS config here
 * to avoid duplicate Access-Control-Allow-Origin headers.
 *
 * @deprecated Use {@link DynamicBrokerSecurityConfig} instead.
 *             This class is retained for backward compatibility and will be
 *             removed in a future version.
 */
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
@ConditionalOnProperty(name = "auth.dynamic-broker.enabled", havingValue = "false", matchIfMissing = false)
@Deprecated(since = "1.1.0", forRemoval = true)
public class SecurityConfig {

    private final JwtValidationFilter jwtValidationFilter;
    private final RateLimitFilter rateLimitFilter;
    private final TenantContextFilter tenantContextFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            // CORS disabled - handled by API Gateway to prevent duplicate headers
            .cors(AbstractHttpConfigurer::disable)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Public auth endpoints - no authentication required
                .requestMatchers("/api/v1/auth/login").permitAll()
                .requestMatchers("/api/v1/auth/login/**").permitAll()  // Dynamic provider selection
                .requestMatchers("/api/v1/auth/messages").permitAll()
                .requestMatchers("/api/v1/auth/providers").permitAll() // List available providers
                .requestMatchers("/api/v1/auth/social/**").permitAll()
                .requestMatchers("/api/v1/auth/refresh").permitAll()
                .requestMatchers("/api/v1/auth/logout").permitAll()
                .requestMatchers("/api/v1/auth/mfa/verify").permitAll()
                // Health and documentation endpoints
                .requestMatchers("/actuator/**").permitAll()
                .requestMatchers("/swagger-ui/**", "/api-docs/**", "/v3/api-docs/**").permitAll()
                // Protected endpoints require JWT
                .anyRequest().authenticated()
            )
            .addFilterBefore(rateLimitFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(tenantContextFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(jwtValidationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
