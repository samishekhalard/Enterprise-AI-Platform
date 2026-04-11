package com.ems.auth.security;

import com.ems.common.dto.auth.UserInfo;

import java.util.Map;
import java.util.Set;

/**
 * Principal Extractor abstraction for converting vendor-specific JWT claims
 * into a standard internal UserPrincipal.
 *
 * Each identity provider (Keycloak, Auth0, Okta, etc.) has different claim structures.
 * This interface normalizes them into a common format.
 *
 * Example claim differences:
 * - Keycloak: roles in "realm_access.roles"
 * - Auth0: roles in "https://myapp.com/roles" (custom namespace)
 * - Okta: roles in "groups" claim
 * - Azure AD: roles in "roles" claim
 */
public interface PrincipalExtractor {

    /**
     * Extract roles from JWT claims in a provider-agnostic way.
     *
     * @param claims The decoded JWT claims
     * @return Set of role names (without ROLE_ prefix)
     */
    Set<String> extractRoles(Map<String, Object> claims);

    /**
     * Extract user info from JWT claims.
     *
     * @param claims The decoded JWT claims
     * @return UserInfo with normalized user data
     */
    UserInfo extractUserInfo(Map<String, Object> claims);

    /**
     * Extract tenant ID from JWT claims.
     *
     * @param claims The decoded JWT claims
     * @return Tenant identifier
     */
    String extractTenantId(Map<String, Object> claims);

    /**
     * Extract the user ID (subject) from claims.
     *
     * @param claims The decoded JWT claims
     * @return User ID
     */
    String extractUserId(Map<String, Object> claims);

    /**
     * Extract the identity provider that issued the token.
     * Useful for tokens obtained via federated login.
     *
     * @param claims The decoded JWT claims
     * @return Identity provider alias, or null if native authentication
     */
    String extractIdentityProvider(Map<String, Object> claims);

    /**
     * Check if this extractor supports the given issuer.
     *
     * @param issuer The token issuer URL
     * @return true if this extractor can handle tokens from this issuer
     */
    boolean supportsIssuer(String issuer);
}
