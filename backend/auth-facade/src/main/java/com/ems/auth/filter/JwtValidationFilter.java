package com.ems.auth.filter;

import com.ems.auth.config.AuthProperties;
import com.ems.auth.security.JwtTokenValidator;
import com.ems.auth.service.TokenService;
import com.ems.auth.util.RealmResolver;
import com.ems.common.dto.auth.UserInfo;
import com.ems.common.exception.InvalidTokenException;
import com.ems.common.exception.TokenExpiredException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Component
@Order(3)
@RequiredArgsConstructor
@Slf4j
public class JwtValidationFilter extends OncePerRequestFilter {

    private final JwtTokenValidator jwtTokenValidator;
    private final TokenService tokenService;
    private final AuthProperties authProperties;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";

    // Thread-local for current user info
    private static final ThreadLocal<UserInfo> CURRENT_USER = new ThreadLocal<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader(AUTHORIZATION_HEADER);

        // No auth header - continue without authentication
        if (authHeader == null || !authHeader.startsWith(BEARER_PREFIX)) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(BEARER_PREFIX.length());

        try {
            // Get tenant from context and derive Keycloak realm (UUID-aware).
            String tenantId = TenantContextFilter.getCurrentTenant();
            String realm = (tenantId != null && !tenantId.isBlank())
                ? RealmResolver.resolve(tenantId)
                : "master";

            // Validate token
            Claims claims = jwtTokenValidator.validateToken(token, realm);

            // Check if token is blacklisted
            String jti = jwtTokenValidator.getJti(claims);
            if (jti != null && tokenService.isBlacklisted(jti)) {
                log.debug("Token {} is blacklisted", jti);
                sendUnauthorizedResponse(response, "Token has been revoked");
                return;
            }

            // Extract user info
            UserInfo userInfo = jwtTokenValidator.extractUserInfo(claims);
            CURRENT_USER.set(userInfo);

            // Extract authorities using provider-agnostic role claim paths
            Set<GrantedAuthority> authorities = extractAuthorities(claims);

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(userInfo, null, authorities);
            SecurityContextHolder.getContext().setAuthentication(authentication);

            log.debug("JWT validated for user {} with {} authorities", userInfo.email(), authorities.size());

            filterChain.doFilter(request, response);

        } catch (TokenExpiredException e) {
            log.debug("Token expired");
            sendUnauthorizedResponse(response, e.getMessage());
        } catch (InvalidTokenException e) {
            log.debug("Invalid token: {}", e.getMessage());
            sendUnauthorizedResponse(response, e.getMessage());
        } catch (Exception e) {
            log.warn("JWT validation failed: {}", e.getMessage());
            sendUnauthorizedResponse(response, "Invalid token");
        } finally {
            CURRENT_USER.remove();
        }
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();

        // Skip for public endpoints
        return path.startsWith("/actuator") ||
               path.startsWith("/swagger") ||
               path.startsWith("/api-docs") ||
               path.startsWith("/v3/api-docs") ||
               path.equals("/api/v1/auth/login") ||
               path.startsWith("/api/v1/auth/login/") ||  // Dynamic provider selection
               path.equals("/api/v1/auth/providers") ||   // List available providers
               path.startsWith("/api/v1/auth/social/") ||
               path.equals("/api/v1/auth/refresh") ||
               path.equals("/api/v1/auth/logout") ||
               path.equals("/api/v1/auth/mfa/verify");
    }

    private void sendUnauthorizedResponse(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        Map<String, Object> body = Map.of(
                "error", "unauthorized",
                "message", message,
                "timestamp", Instant.now().toString()
        );

        response.getWriter().write(objectMapper.writeValueAsString(body));
    }

    public static UserInfo getCurrentUser() {
        return CURRENT_USER.get();
    }

    /**
     * Extract authorities from JWT claims using provider-agnostic claim paths.
     * Configured via auth.facade.role-claim-paths in application.yml.
     */
    @SuppressWarnings("unchecked")
    private Set<GrantedAuthority> extractAuthorities(Claims claims) {
        Set<GrantedAuthority> authorities = new HashSet<>();

        for (String claimPath : authProperties.getRoleClaimPaths()) {
            Collection<String> roles = extractRolesFromPath(claims, claimPath);
            for (String role : roles) {
                String normalized = role.toUpperCase();
                if (!normalized.startsWith("ROLE_")) {
                    normalized = "ROLE_" + normalized;
                }
                authorities.add(new SimpleGrantedAuthority(normalized));
            }
        }

        return authorities;
    }

    /**
     * Extract roles from a specific claim path.
     * Supports dot-notation for nested objects (e.g., realm_access.roles).
     */
    @SuppressWarnings("unchecked")
    private Collection<String> extractRolesFromPath(Claims claims, String path) {
        try {
            // Handle nested paths like "realm_access.roles"
            if (path.contains(".")) {
                String[] segments = path.split("\\.", 2);
                Object parent = claims.get(segments[0]);
                if (parent instanceof Map) {
                    Object nested = ((Map<String, Object>) parent).get(segments[1]);
                    if (nested instanceof Collection) {
                        return ((Collection<?>) nested).stream()
                            .map(Object::toString)
                            .collect(Collectors.toList());
                    }
                }
                return Collections.emptyList();
            }

            // Handle "resource_access" (Keycloak client roles - multiple clients)
            if ("resource_access".equals(path)) {
                return extractKeycloakClientRoles(claims);
            }

            // Handle standard flat claims
            Object claim = claims.get(path);
            if (claim instanceof Collection) {
                return ((Collection<?>) claim).stream()
                    .map(Object::toString)
                    .collect(Collectors.toList());
            }
            if (claim instanceof String) {
                return Collections.singletonList((String) claim);
            }

            return Collections.emptyList();
        } catch (Exception e) {
            log.debug("Failed to extract roles from path {}: {}", path, e.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * Extract client roles from Keycloak's resource_access claim.
     * Structure: { "client-id": { "roles": ["role1", "role2"] } }
     */
    @SuppressWarnings("unchecked")
    private Collection<String> extractKeycloakClientRoles(Claims claims) {
        Object resourceAccess = claims.get("resource_access");
        if (!(resourceAccess instanceof Map)) {
            return Collections.emptyList();
        }

        List<String> allRoles = new ArrayList<>();
        Map<String, Object> resourceAccessMap = (Map<String, Object>) resourceAccess;

        for (Object clientAccess : resourceAccessMap.values()) {
            if (clientAccess instanceof Map) {
                Map<String, Object> clientMap = (Map<String, Object>) clientAccess;
                Object roles = clientMap.get("roles");
                if (roles instanceof Collection) {
                    ((Collection<?>) roles).forEach(role -> allRoles.add(role.toString()));
                }
            }
        }
        return allRoles;
    }
}
