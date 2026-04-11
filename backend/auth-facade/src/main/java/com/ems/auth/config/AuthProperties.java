package com.ems.auth.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.validation.annotation.Validated;

import java.util.List;
import java.util.Map;

/**
 * Auth Facade Configuration Properties.
 *
 * Externalizes all provider-specific configuration to YAML, allowing
 * the Auth Facade to support new Identity Providers without code changes.
 *
 * Example configuration:
 * <pre>
 * auth:
 *   facade:
 *     provider: keycloak
 *     role-claim-paths:
 *       - realm_access.roles
 *       - resource_access.account.roles
 *     user-claim-mappings:
 *       user-id: sub
 *       email: email
 *       first-name: given_name
 *       last-name: family_name
 *       tenant-id: tenant_id
 * </pre>
 *
 * @see <a href="https://docs.spring.io/spring-boot/docs/current/reference/html/features.html#features.external-config">Spring Externalized Configuration</a>
 */
@Configuration
@ConfigurationProperties(prefix = "auth.facade")
@Validated
@Getter
@Setter
public class AuthProperties {

    /**
     * Active identity provider type.
     * Supported: keycloak, auth0, okta, azure-ad, fusionauth
     */
    private String provider = "keycloak";

    /**
     * List of JSON paths in the JWT to search for roles/authorities.
     * Supports dot-notation for nested objects (e.g., realm_access.roles).
     * Paths are evaluated in order; all matching roles are collected.
     *
     * Keycloak example: realm_access.roles, resource_access.{client}.roles
     * Auth0 example: permissions, https://myapp.com/roles
     * Azure AD example: roles, groups
     * Okta example: groups
     */
    private List<String> roleClaimPaths = List.of(
        "roles",              // Standard OIDC
        "groups",             // Azure AD / Okta
        "realm_access.roles", // Keycloak Realm Roles
        "resource_access",    // Keycloak Client Roles (special handling)
        "permissions"         // Auth0 Permissions
    );

    /**
     * User claim mappings from JWT to internal UserInfo.
     * Keys are internal field names, values are JWT claim paths.
     *
     * Default mappings follow OIDC standard claims.
     */
    private UserClaimMappings userClaimMappings = new UserClaimMappings();

    /**
     * Token configuration for MFA sessions and caching.
     */
    private TokenConfig token = new TokenConfig();

    /**
     * Provider-specific extra configurations.
     * Allows passing provider-specific settings without changing code.
     */
    private Map<String, Object> providerConfig;

    /**
     * Tenant resolution strategy.
     * Options: header, path, subdomain, jwt-claim
     */
    private String tenantResolution = "header";

    /**
     * Header name for tenant resolution when using 'header' strategy.
     */
    private String tenantHeader = "X-Tenant-ID";

    /**
     * JWT claim name for tenant resolution when using 'jwt-claim' strategy.
     */
    private String tenantClaim = "tenant_id";

    /**
     * User claim mappings configuration.
     */
    @Getter
    @Setter
    public static class UserClaimMappings {
        private String userId = "sub";
        private String email = "email";
        private String firstName = "given_name";
        private String lastName = "family_name";
        private String tenantId = "tenant_id";
        private String identityProvider = "identity_provider";

        /**
         * Alternative claim names to check (fallbacks).
         * e.g., tenantId might be "tenant_id", "tenantId", or "tenant"
         */
        private List<String> tenantIdFallbacks = List.of("tenantId", "tenant");
    }

    /**
     * Token-related configuration.
     */
    @Getter
    @Setter
    public static class TokenConfig {
        /**
         * MFA session token expiration in minutes.
         */
        private int mfaSessionExpirationMinutes = 5;

        /**
         * Valkey key prefix for pending MFA tokens.
         */
        private String mfaPendingPrefix = "auth:mfa:pending:";
    }
}
