package com.ems.auth.security;

import com.ems.common.dto.auth.UserInfo;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.*;

/**
 * Keycloak-specific principal extractor.
 *
 * Keycloak JWT structure:
 * - Roles: realm_access.roles (array)
 * - Client roles: resource_access.{client}.roles (array)
 * - User ID: sub
 * - Email: email
 * - First name: given_name
 * - Last name: family_name
 * - Tenant: tenant_id (custom claim via mapper)
 * - Identity provider: identity_provider (for federated logins)
 */
@Component
@ConditionalOnProperty(name = "auth.facade.provider", havingValue = "keycloak", matchIfMissing = true)
@Slf4j
public class KeycloakPrincipalExtractor implements PrincipalExtractor {

    @Override
    @SuppressWarnings("unchecked")
    public Set<String> extractRoles(Map<String, Object> claims) {
        Set<String> roles = new HashSet<>();

        // Extract realm roles
        if (claims.containsKey("realm_access")) {
            Map<String, Object> realmAccess = (Map<String, Object>) claims.get("realm_access");
            if (realmAccess != null && realmAccess.containsKey("roles")) {
                List<String> realmRoles = (List<String>) realmAccess.get("roles");
                if (realmRoles != null) {
                    roles.addAll(realmRoles);
                }
            }
        }

        // Extract client roles (optional, from resource_access)
        if (claims.containsKey("resource_access")) {
            Map<String, Object> resourceAccess = (Map<String, Object>) claims.get("resource_access");
            if (resourceAccess != null) {
                for (Object clientAccess : resourceAccess.values()) {
                    if (clientAccess instanceof Map) {
                        Map<String, Object> clientMap = (Map<String, Object>) clientAccess;
                        if (clientMap.containsKey("roles")) {
                            List<String> clientRoles = (List<String>) clientMap.get("roles");
                            if (clientRoles != null) {
                                roles.addAll(clientRoles);
                            }
                        }
                    }
                }
            }
        }

        log.debug("Extracted {} roles from Keycloak token", roles.size());
        return roles;
    }

    @Override
    public UserInfo extractUserInfo(Map<String, Object> claims) {
        String userId = extractUserId(claims);
        String email = getStringClaim(claims, "email");
        String firstName = getStringClaim(claims, "given_name");
        String lastName = getStringClaim(claims, "family_name");
        String tenantId = extractTenantId(claims);
        List<String> roles = new ArrayList<>(extractRoles(claims));

        return new UserInfo(userId, email, firstName, lastName, tenantId, roles);
    }

    @Override
    public String extractTenantId(Map<String, Object> claims) {
        // Try multiple claim names for tenant
        String tenantId = getStringClaim(claims, "tenant_id");
        if (tenantId == null) {
            tenantId = getStringClaim(claims, "tenantId");
        }
        if (tenantId == null) {
            tenantId = getStringClaim(claims, "tenant");
        }
        return tenantId;
    }

    @Override
    public String extractUserId(Map<String, Object> claims) {
        return getStringClaim(claims, "sub");
    }

    @Override
    public String extractIdentityProvider(Map<String, Object> claims) {
        // Keycloak adds this claim when user authenticated via external IdP
        return getStringClaim(claims, "identity_provider");
    }

    @Override
    public boolean supportsIssuer(String issuer) {
        // Keycloak issuers typically contain "/realms/"
        return issuer != null && issuer.contains("/realms/");
    }

    private String getStringClaim(Map<String, Object> claims, String key) {
        Object value = claims.get(key);
        return value != null ? value.toString() : null;
    }
}
