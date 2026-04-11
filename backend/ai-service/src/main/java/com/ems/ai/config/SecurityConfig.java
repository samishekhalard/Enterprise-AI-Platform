package com.ems.ai.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/**").permitAll()
                .requestMatchers("/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                .requestMatchers("/api/v1/providers/**").hasAnyRole("TENANT_ADMIN", "ADMIN", "SUPER_ADMIN")
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter()))
            );

        return http.build();
    }

    @Bean
    public Converter<Jwt, ? extends AbstractAuthenticationToken> jwtAuthenticationConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(this::extractAuthorities);
        return converter;
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

        for (String scope : rawScopes.trim().split("\\s+")) {
            if (!scope.isBlank()) {
                authorities.add(new SimpleGrantedAuthority("SCOPE_" + scope.trim()));
            }
        }
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(Arrays.asList(
            "http://localhost:*",
            "http://127.0.0.1:*",
            "https://*.trycloudflare.com",
            "https://*.cloudflare.com"
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(Arrays.asList(
            "Authorization",
            "X-Tenant-ID",
            "X-Request-ID"
        ));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
