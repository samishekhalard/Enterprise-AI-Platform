package com.ems.auth.provider;

import java.time.Instant;
import java.util.List;

/**
 * Identity Provider Configuration.
 *
 * This record holds the complete configuration for an identity provider,
 * supporting multiple protocols (OIDC, SAML, LDAP, OAuth2).
 *
 * The configuration is stored in Neo4j and cached for performance.
 * Each tenant can have multiple providers configured.
 */
public record ProviderConfig(

    /**
     * Unique provider identifier (UUID).
     */
    String id,

    /**
     * Tenant identifier this provider belongs to.
     */
    String tenantId,

    /**
     * Provider name/type (e.g., KEYCLOAK, UAE_PASS, AUTH0).
     */
    String providerName,

    /**
     * Display name for UI.
     */
    String displayName,

    /**
     * Authentication protocol (OIDC, SAML, LDAP, OAUTH2).
     */
    String protocol,

    // ==========================================================================
    // OIDC/OAuth2 Configuration
    // ==========================================================================

    /**
     * OAuth2/OIDC client ID.
     */
    String clientId,

    /**
     * OAuth2/OIDC client secret.
     */
    String clientSecret,

    /**
     * OIDC discovery URL (/.well-known/openid-configuration).
     */
    String discoveryUrl,

    /**
     * Authorization endpoint URL.
     */
    String authorizationUrl,

    /**
     * Token endpoint URL.
     */
    String tokenUrl,

    /**
     * User info endpoint URL.
     */
    String userInfoUrl,

    /**
     * JWKS URL for token validation.
     */
    String jwksUrl,

    /**
     * Issuer URL for token validation.
     */
    String issuerUrl,

    /**
     * Requested scopes.
     */
    List<String> scopes,

    // ==========================================================================
    // SAML Configuration
    // ==========================================================================

    /**
     * SAML metadata URL.
     */
    String metadataUrl,

    /**
     * SAML entity ID.
     */
    String entityId,

    /**
     * SAML signing certificate.
     */
    String signingCertificate,

    // ==========================================================================
    // LDAP Configuration
    // ==========================================================================

    /**
     * LDAP server URL.
     */
    String serverUrl,

    /**
     * LDAP server port.
     */
    Integer port,

    /**
     * LDAP bind DN.
     */
    String bindDn,

    /**
     * LDAP bind password.
     */
    String bindPassword,

    /**
     * LDAP user search base.
     */
    String userSearchBase,

    /**
     * LDAP user search filter.
     */
    String userSearchFilter,

    // ==========================================================================
    // Common Configuration
    // ==========================================================================

    /**
     * Identity provider hint (for Keycloak kc_idp_hint).
     */
    String idpHint,

    /**
     * Whether this provider is enabled.
     */
    boolean enabled,

    /**
     * Priority order for display (lower = higher priority).
     */
    int priority,

    /**
     * Whether to trust email addresses from this provider.
     */
    boolean trustEmail,

    /**
     * Whether to store tokens from this provider.
     */
    boolean storeToken,

    /**
     * Whether to link existing accounts by email.
     */
    boolean linkExistingAccounts,

    /**
     * Creation timestamp.
     */
    Instant createdAt,

    /**
     * Last update timestamp.
     */
    Instant updatedAt

) {
    /**
     * Builder for creating ProviderConfig instances.
     */
    public static Builder builder() {
        return new Builder();
    }

    /**
     * Check if this is an OIDC provider.
     */
    public boolean isOidc() {
        return "OIDC".equalsIgnoreCase(protocol);
    }

    /**
     * Check if this is a SAML provider.
     */
    public boolean isSaml() {
        return "SAML".equalsIgnoreCase(protocol);
    }

    /**
     * Check if this is an LDAP provider.
     */
    public boolean isLdap() {
        return "LDAP".equalsIgnoreCase(protocol);
    }

    /**
     * Check if this is an OAuth2 provider.
     */
    public boolean isOauth2() {
        return "OAUTH2".equalsIgnoreCase(protocol);
    }

    /**
     * Builder class for ProviderConfig.
     */
    public static class Builder {
        private String id;
        private String tenantId;
        private String providerName;
        private String displayName;
        private String protocol;
        private String clientId;
        private String clientSecret;
        private String discoveryUrl;
        private String authorizationUrl;
        private String tokenUrl;
        private String userInfoUrl;
        private String jwksUrl;
        private String issuerUrl;
        private List<String> scopes;
        private String metadataUrl;
        private String entityId;
        private String signingCertificate;
        private String serverUrl;
        private Integer port;
        private String bindDn;
        private String bindPassword;
        private String userSearchBase;
        private String userSearchFilter;
        private String idpHint;
        private boolean enabled = true;
        private int priority = 100;
        private boolean trustEmail = true;
        private boolean storeToken = false;
        private boolean linkExistingAccounts = true;
        private Instant createdAt;
        private Instant updatedAt;

        public Builder id(String id) { this.id = id; return this; }
        public Builder tenantId(String tenantId) { this.tenantId = tenantId; return this; }
        public Builder providerName(String providerName) { this.providerName = providerName; return this; }
        public Builder displayName(String displayName) { this.displayName = displayName; return this; }
        public Builder protocol(String protocol) { this.protocol = protocol; return this; }
        public Builder clientId(String clientId) { this.clientId = clientId; return this; }
        public Builder clientSecret(String clientSecret) { this.clientSecret = clientSecret; return this; }
        public Builder discoveryUrl(String discoveryUrl) { this.discoveryUrl = discoveryUrl; return this; }
        public Builder authorizationUrl(String authorizationUrl) { this.authorizationUrl = authorizationUrl; return this; }
        public Builder tokenUrl(String tokenUrl) { this.tokenUrl = tokenUrl; return this; }
        public Builder userInfoUrl(String userInfoUrl) { this.userInfoUrl = userInfoUrl; return this; }
        public Builder jwksUrl(String jwksUrl) { this.jwksUrl = jwksUrl; return this; }
        public Builder issuerUrl(String issuerUrl) { this.issuerUrl = issuerUrl; return this; }
        public Builder scopes(List<String> scopes) { this.scopes = scopes; return this; }
        public Builder metadataUrl(String metadataUrl) { this.metadataUrl = metadataUrl; return this; }
        public Builder entityId(String entityId) { this.entityId = entityId; return this; }
        public Builder signingCertificate(String signingCertificate) { this.signingCertificate = signingCertificate; return this; }
        public Builder serverUrl(String serverUrl) { this.serverUrl = serverUrl; return this; }
        public Builder port(Integer port) { this.port = port; return this; }
        public Builder bindDn(String bindDn) { this.bindDn = bindDn; return this; }
        public Builder bindPassword(String bindPassword) { this.bindPassword = bindPassword; return this; }
        public Builder userSearchBase(String userSearchBase) { this.userSearchBase = userSearchBase; return this; }
        public Builder userSearchFilter(String userSearchFilter) { this.userSearchFilter = userSearchFilter; return this; }
        public Builder idpHint(String idpHint) { this.idpHint = idpHint; return this; }
        public Builder enabled(boolean enabled) { this.enabled = enabled; return this; }
        public Builder priority(int priority) { this.priority = priority; return this; }
        public Builder trustEmail(boolean trustEmail) { this.trustEmail = trustEmail; return this; }
        public Builder storeToken(boolean storeToken) { this.storeToken = storeToken; return this; }
        public Builder linkExistingAccounts(boolean linkExistingAccounts) { this.linkExistingAccounts = linkExistingAccounts; return this; }
        public Builder createdAt(Instant createdAt) { this.createdAt = createdAt; return this; }
        public Builder updatedAt(Instant updatedAt) { this.updatedAt = updatedAt; return this; }

        public ProviderConfig build() {
            return new ProviderConfig(
                id, tenantId, providerName, displayName, protocol,
                clientId, clientSecret, discoveryUrl, authorizationUrl, tokenUrl,
                userInfoUrl, jwksUrl, issuerUrl, scopes,
                metadataUrl, entityId, signingCertificate,
                serverUrl, port, bindDn, bindPassword, userSearchBase, userSearchFilter,
                idpHint, enabled, priority, trustEmail, storeToken, linkExistingAccounts,
                createdAt, updatedAt
            );
        }
    }
}
