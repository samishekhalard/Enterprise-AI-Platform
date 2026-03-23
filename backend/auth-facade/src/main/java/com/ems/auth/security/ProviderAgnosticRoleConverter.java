package com.ems.auth.security;

import com.ems.auth.config.AuthProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Provider-Agnostic Role Converter for JWT tokens.
 *
 * This converter extracts roles from multiple possible claim locations,
 * making it work with any identity provider (Keycloak, Auth0, Okta, Azure AD).
 *
 * Configuration via application.yml (auth.facade.role-claim-paths):
 * - roles: Standard OIDC / Auth0
 * - groups: Azure AD / Okta
 * - realm_access.roles: Keycloak Realm Roles
 * - resource_access: Keycloak Client Roles
 * - permissions: Auth0 Permissions
 *
 * Example configuration:
 * <pre>
 * auth:
 *   facade:
 *     role-claim-paths:
 *       - realm_access.roles
 *       - resource_access.account.roles
 *       - groups
 * </pre>
 *
 * To switch providers, simply change the YAML configuration - no code changes required.
 * This follows the Open-Closed Principle: open for extension via config, closed for modification.
 */
@Component
@Slf4j
public class ProviderAgnosticRoleConverter implements Converter<Jwt, Collection<GrantedAuthority>> {

    private final AuthProperties authProperties;

    public ProviderAgnosticRoleConverter(AuthProperties authProperties) {
        this.authProperties = authProperties;
        log.info("ProviderAgnosticRoleConverter initialized with claim paths: {}",
            authProperties.getRoleClaimPaths());
    }

    @Override
    public Collection<GrantedAuthority> convert(Jwt jwt) {
        Set<GrantedAuthority> authorities = authProperties.getRoleClaimPaths().stream()
            .flatMap(claimPath -> extractRoles(jwt, claimPath).stream())
            .map(this::toGrantedAuthority)
            .collect(Collectors.toSet()); // Set avoids duplicates from multiple claims

        log.debug("Extracted {} authorities from JWT", authorities.size());
        return authorities;
    }

    /**
     * Convert role string to GrantedAuthority.
     * Normalizes to ROLE_ prefix format.
     */
    private GrantedAuthority toGrantedAuthority(String role) {
        String normalized = role.toUpperCase();
        if (!normalized.startsWith("ROLE_")) {
            normalized = "ROLE_" + normalized;
        }
        return new SimpleGrantedAuthority(normalized);
    }

    /**
     * Extract roles from a specific claim path.
     * Handles both flat claims and nested paths (e.g., realm_access.roles).
     */
    @SuppressWarnings("unchecked")
    private Collection<String> extractRoles(Jwt jwt, String path) {
        try {
            // Handle nested Keycloak path 'realm_access.roles'
            if (path.contains(".")) {
                String[] segments = path.split("\\.", 2);
                Map<String, Object> parent = jwt.getClaimAsMap(segments[0]);
                if (parent != null) {
                    Object nested = parent.get(segments[1]);
                    if (nested instanceof Collection) {
                        return (Collection<String>) nested;
                    }
                }
                return Collections.emptyList();
            }

            // Handle 'resource_access' (Keycloak client roles - multiple clients)
            if ("resource_access".equals(path)) {
                return extractKeycloakClientRoles(jwt);
            }

            // Handle 'scope' claim (space-separated string)
            if ("scope".equals(path)) {
                String scope = jwt.getClaimAsString(path);
                if (scope != null && !scope.isBlank()) {
                    return Arrays.asList(scope.split("\\s+"));
                }
                return Collections.emptyList();
            }

            // Handle standard flat claims
            Object claim = jwt.getClaim(path);
            if (claim instanceof Collection) {
                return (Collection<String>) claim;
            }
            if (claim instanceof String) {
                // Single role as string
                return Collections.singletonList((String) claim);
            }

            return Collections.emptyList();
        } catch (Exception e) {
            // Silently skip malformed claims
            return Collections.emptyList();
        }
    }

    /**
     * Extract client roles from Keycloak's resource_access claim.
     * Structure: { "client-id": { "roles": ["role1", "role2"] } }
     */
    @SuppressWarnings("unchecked")
    private Collection<String> extractKeycloakClientRoles(Jwt jwt) {
        Map<String, Object> resourceAccess = jwt.getClaimAsMap("resource_access");
        if (resourceAccess == null) {
            return Collections.emptyList();
        }

        List<String> allRoles = new ArrayList<>();
        for (Object clientAccess : resourceAccess.values()) {
            if (clientAccess instanceof Map) {
                Map<String, Object> clientMap = (Map<String, Object>) clientAccess;
                Object roles = clientMap.get("roles");
                if (roles instanceof Collection) {
                    allRoles.addAll((Collection<String>) roles);
                }
            }
        }
        return allRoles;
    }
}
