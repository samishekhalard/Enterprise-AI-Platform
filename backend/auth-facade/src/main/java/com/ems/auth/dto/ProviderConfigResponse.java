package com.ems.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;
import java.util.List;

/**
 * Response DTO for identity provider configuration.
 * Sensitive data (secrets, passwords) are masked in the response.
 */
@Schema(description = "Identity provider configuration response")
public record ProviderConfigResponse(

    @Schema(
        description = "Unique provider identifier",
        example = "550e8400-e29b-41d4-a716-446655440000"
    )
    String id,

    @Schema(
        description = "Provider name/type identifier (e.g., KEYCLOAK, AUTH0)",
        example = "KEYCLOAK"
    )
    String providerName,

    @Schema(
        description = "Provider type for frontend mapping",
        example = "KEYCLOAK"
    )
    String providerType,

    @Schema(
        description = "Display name for the provider",
        example = "Company SSO"
    )
    String displayName,

    @Schema(
        description = "Authentication protocol",
        example = "OIDC"
    )
    String protocol,

    @Schema(
        description = "OAuth2/OIDC client ID",
        example = "ems-auth-client"
    )
    String clientId,

    @Schema(
        description = "OAuth2/OIDC client secret (masked)",
        example = "cl****et"
    )
    String clientSecret,

    @Schema(
        description = "OIDC discovery URL",
        example = "https://keycloak.example.com/realms/tenant-acme/.well-known/openid-configuration"
    )
    String discoveryUrl,

    @Schema(
        description = "SAML metadata URL",
        example = "https://idp.example.com/saml/metadata"
    )
    String metadataUrl,

    @Schema(
        description = "LDAP server URL",
        example = "ldap://ldap.example.com"
    )
    String serverUrl,

    @Schema(
        description = "LDAP server port",
        example = "389"
    )
    Integer port,

    @Schema(
        description = "LDAP bind DN (masked)",
        example = "cn****om"
    )
    String bindDn,

    @Schema(
        description = "LDAP user search base",
        example = "ou=users,dc=example,dc=com"
    )
    String userSearchBase,

    @Schema(
        description = "Identity provider hint",
        example = "google"
    )
    String idpHint,

    @Schema(
        description = "OAuth2/OIDC scopes",
        example = "[\"openid\", \"profile\", \"email\"]"
    )
    List<String> scopes,

    @Schema(
        description = "Whether PKCE is enabled for this provider",
        example = "true"
    )
    Boolean pkceEnabled,

    @Schema(
        description = "Whether this provider is enabled",
        example = "true"
    )
    boolean enabled,

    @Schema(
        description = "Priority order for display (lower = higher priority)",
        example = "1"
    )
    Integer priority,

    @Schema(
        description = "Timestamp when the provider was created",
        example = "2024-01-15T10:30:00Z"
    )
    Instant createdAt,

    @Schema(
        description = "Timestamp when the provider was last updated",
        example = "2024-01-15T10:30:00Z"
    )
    Instant updatedAt,

    @Schema(
        description = "Timestamp when the provider was last tested",
        example = "2024-01-15T10:30:00Z"
    )
    Instant lastTestedAt,

    @Schema(
        description = "Result of the last connection test",
        example = "success",
        allowableValues = {"success", "failure", "pending"}
    )
    String testResult

) {
    /**
     * Create a minimal response with just identification info.
     */
    public static ProviderConfigResponse minimal(String id, String providerName, String protocol, boolean enabled) {
        return new ProviderConfigResponse(
            id, providerName, providerName, providerName, protocol,
            null, null, null, null, null, null, null, null, null, null,
            null, enabled, null, null, null, null, null
        );
    }

    /**
     * Builder for creating ProviderConfigResponse instances.
     */
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String id;
        private String providerName;
        private String providerType;
        private String displayName;
        private String protocol;
        private String clientId;
        private String clientSecret;
        private String discoveryUrl;
        private String metadataUrl;
        private String serverUrl;
        private Integer port;
        private String bindDn;
        private String userSearchBase;
        private String idpHint;
        private List<String> scopes;
        private Boolean pkceEnabled;
        private boolean enabled;
        private Integer priority;
        private Instant createdAt;
        private Instant updatedAt;
        private Instant lastTestedAt;
        private String testResult;

        public Builder id(String id) { this.id = id; return this; }
        public Builder providerName(String providerName) { this.providerName = providerName; return this; }
        public Builder providerType(String providerType) { this.providerType = providerType; return this; }
        public Builder displayName(String displayName) { this.displayName = displayName; return this; }
        public Builder protocol(String protocol) { this.protocol = protocol; return this; }
        public Builder clientId(String clientId) { this.clientId = clientId; return this; }
        public Builder clientSecret(String clientSecret) { this.clientSecret = clientSecret; return this; }
        public Builder discoveryUrl(String discoveryUrl) { this.discoveryUrl = discoveryUrl; return this; }
        public Builder metadataUrl(String metadataUrl) { this.metadataUrl = metadataUrl; return this; }
        public Builder serverUrl(String serverUrl) { this.serverUrl = serverUrl; return this; }
        public Builder port(Integer port) { this.port = port; return this; }
        public Builder bindDn(String bindDn) { this.bindDn = bindDn; return this; }
        public Builder userSearchBase(String userSearchBase) { this.userSearchBase = userSearchBase; return this; }
        public Builder idpHint(String idpHint) { this.idpHint = idpHint; return this; }
        public Builder scopes(List<String> scopes) { this.scopes = scopes; return this; }
        public Builder pkceEnabled(Boolean pkceEnabled) { this.pkceEnabled = pkceEnabled; return this; }
        public Builder enabled(boolean enabled) { this.enabled = enabled; return this; }
        public Builder priority(Integer priority) { this.priority = priority; return this; }
        public Builder createdAt(Instant createdAt) { this.createdAt = createdAt; return this; }
        public Builder updatedAt(Instant updatedAt) { this.updatedAt = updatedAt; return this; }
        public Builder lastTestedAt(Instant lastTestedAt) { this.lastTestedAt = lastTestedAt; return this; }
        public Builder testResult(String testResult) { this.testResult = testResult; return this; }

        public ProviderConfigResponse build() {
            return new ProviderConfigResponse(
                id, providerName, providerType, displayName, protocol,
                clientId, clientSecret, discoveryUrl, metadataUrl, serverUrl,
                port, bindDn, userSearchBase, idpHint, scopes,
                pkceEnabled, enabled, priority, createdAt, updatedAt, lastTestedAt, testResult
            );
        }
    }
}
