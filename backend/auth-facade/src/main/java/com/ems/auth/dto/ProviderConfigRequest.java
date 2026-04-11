package com.ems.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * Request DTO for registering or updating an identity provider configuration.
 *
 * Supports multiple authentication protocols:
 * - OIDC: OpenID Connect (Keycloak, Auth0, Okta, Azure AD)
 * - SAML: Security Assertion Markup Language (Enterprise SSO)
 * - LDAP: Lightweight Directory Access Protocol (Active Directory)
 * - OAUTH2: Generic OAuth2 providers
 */
@Schema(description = "Identity provider configuration request")
public record ProviderConfigRequest(

    @Schema(
        description = "Provider name/type identifier",
        example = "KEYCLOAK",
        requiredMode = Schema.RequiredMode.REQUIRED,
        allowableValues = {"KEYCLOAK", "UAE_PASS", "AUTH0", "OKTA", "AZURE_AD", "GOOGLE", "MICROSOFT", "GITHUB", "LDAP", "SAML", "CUSTOM"}
    )
    @NotBlank(message = "Provider name is required")
    @Size(max = 50, message = "Provider name must not exceed 50 characters")
    String providerName,

    @Schema(
        description = "Display name for the provider (shown in UI)",
        example = "Company SSO",
        requiredMode = Schema.RequiredMode.NOT_REQUIRED
    )
    @Size(max = 100, message = "Display name must not exceed 100 characters")
    String displayName,

    @Schema(
        description = "Authentication protocol",
        example = "OIDC",
        requiredMode = Schema.RequiredMode.REQUIRED,
        allowableValues = {"OIDC", "SAML", "LDAP", "OAUTH2"}
    )
    @NotBlank(message = "Protocol is required")
    @Pattern(regexp = "^(OIDC|SAML|LDAP|OAUTH2)$", message = "Protocol must be one of: OIDC, SAML, LDAP, OAUTH2")
    String protocol,

    @Schema(
        description = "OAuth2/OIDC client ID",
        example = "ems-auth-client",
        requiredMode = Schema.RequiredMode.NOT_REQUIRED
    )
    @Size(max = 255, message = "Client ID must not exceed 255 characters")
    String clientId,

    @Schema(
        description = "OAuth2/OIDC client secret",
        example = "client-secret-value",
        requiredMode = Schema.RequiredMode.NOT_REQUIRED
    )
    @Size(max = 512, message = "Client secret must not exceed 512 characters")
    String clientSecret,

    @Schema(
        description = "OIDC discovery URL (/.well-known/openid-configuration)",
        example = "https://keycloak.example.com/realms/tenant-acme/.well-known/openid-configuration",
        requiredMode = Schema.RequiredMode.NOT_REQUIRED
    )
    @Size(max = 512, message = "Discovery URL must not exceed 512 characters")
    String discoveryUrl,

    @Schema(
        description = "SAML metadata URL",
        example = "https://idp.example.com/saml/metadata",
        requiredMode = Schema.RequiredMode.NOT_REQUIRED
    )
    @Size(max = 512, message = "Metadata URL must not exceed 512 characters")
    String metadataUrl,

    @Schema(
        description = "LDAP server URL",
        example = "ldap://ldap.example.com",
        requiredMode = Schema.RequiredMode.NOT_REQUIRED
    )
    @Size(max = 255, message = "Server URL must not exceed 255 characters")
    String serverUrl,

    @Schema(
        description = "LDAP server port",
        example = "389",
        requiredMode = Schema.RequiredMode.NOT_REQUIRED
    )
    Integer port,

    @Schema(
        description = "LDAP bind DN (distinguished name for authentication)",
        example = "cn=admin,dc=example,dc=com",
        requiredMode = Schema.RequiredMode.NOT_REQUIRED
    )
    @Size(max = 255, message = "Bind DN must not exceed 255 characters")
    String bindDn,

    @Schema(
        description = "LDAP bind password",
        example = "ldap-admin-password",
        requiredMode = Schema.RequiredMode.NOT_REQUIRED
    )
    @Size(max = 255, message = "Bind password must not exceed 255 characters")
    String bindPassword,

    @Schema(
        description = "LDAP user search base",
        example = "ou=users,dc=example,dc=com",
        requiredMode = Schema.RequiredMode.NOT_REQUIRED
    )
    @Size(max = 255, message = "User search base must not exceed 255 characters")
    String userSearchBase,

    @Schema(
        description = "LDAP user search filter",
        example = "(uid={0})",
        requiredMode = Schema.RequiredMode.NOT_REQUIRED
    )
    @Size(max = 255, message = "User search filter must not exceed 255 characters")
    String userSearchFilter,

    @Schema(
        description = "Identity provider hint (for Keycloak kc_idp_hint or similar)",
        example = "google",
        requiredMode = Schema.RequiredMode.NOT_REQUIRED
    )
    @Size(max = 100, message = "IdP hint must not exceed 100 characters")
    String idpHint,

    @Schema(
        description = "OAuth2/OIDC scopes to request",
        example = "[\"openid\", \"profile\", \"email\"]",
        requiredMode = Schema.RequiredMode.NOT_REQUIRED
    )
    List<String> scopes,

    @Schema(
        description = "Authorization endpoint URL (for OAuth2 providers without discovery)",
        example = "https://auth.example.com/oauth2/authorize",
        requiredMode = Schema.RequiredMode.NOT_REQUIRED
    )
    @Size(max = 512, message = "Authorization URL must not exceed 512 characters")
    String authorizationUrl,

    @Schema(
        description = "Token endpoint URL (for OAuth2 providers without discovery)",
        example = "https://auth.example.com/oauth2/token",
        requiredMode = Schema.RequiredMode.NOT_REQUIRED
    )
    @Size(max = 512, message = "Token URL must not exceed 512 characters")
    String tokenUrl,

    @Schema(
        description = "User info endpoint URL (for OAuth2 providers without discovery)",
        example = "https://auth.example.com/oauth2/userinfo",
        requiredMode = Schema.RequiredMode.NOT_REQUIRED
    )
    @Size(max = 512, message = "User info URL must not exceed 512 characters")
    String userInfoUrl,

    @Schema(
        description = "JWKS (JSON Web Key Set) URL for token validation",
        example = "https://auth.example.com/.well-known/jwks.json",
        requiredMode = Schema.RequiredMode.NOT_REQUIRED
    )
    @Size(max = 512, message = "JWKS URL must not exceed 512 characters")
    String jwksUrl,

    @Schema(
        description = "Issuer URL for token validation",
        example = "https://auth.example.com",
        requiredMode = Schema.RequiredMode.NOT_REQUIRED
    )
    @Size(max = 512, message = "Issuer URL must not exceed 512 characters")
    String issuerUrl,

    @Schema(
        description = "Whether this provider is enabled for authentication",
        example = "true",
        defaultValue = "true",
        requiredMode = Schema.RequiredMode.NOT_REQUIRED
    )
    boolean enabled,

    @Schema(
        description = "Priority order for provider display (lower = higher priority)",
        example = "1",
        requiredMode = Schema.RequiredMode.NOT_REQUIRED
    )
    Integer priority,

    @Schema(
        description = "Whether to trust email addresses from this provider",
        example = "true",
        defaultValue = "true",
        requiredMode = Schema.RequiredMode.NOT_REQUIRED
    )
    Boolean trustEmail,

    @Schema(
        description = "Whether to store tokens from this provider",
        example = "false",
        defaultValue = "false",
        requiredMode = Schema.RequiredMode.NOT_REQUIRED
    )
    Boolean storeToken,

    @Schema(
        description = "Whether to link existing accounts by email",
        example = "true",
        defaultValue = "true",
        requiredMode = Schema.RequiredMode.NOT_REQUIRED
    )
    Boolean linkExistingAccounts

) {
    /**
     * Default constructor with sensible defaults.
     */
    public ProviderConfigRequest {
        if (scopes == null) {
            scopes = List.of("openid", "profile", "email");
        }
        if (port == null && "LDAP".equals(protocol)) {
            port = 389;
        }
        if (priority == null) {
            priority = 100;
        }
        if (trustEmail == null) {
            trustEmail = true;
        }
        if (storeToken == null) {
            storeToken = false;
        }
        if (linkExistingAccounts == null) {
            linkExistingAccounts = true;
        }
    }

    /**
     * Check if this is an OIDC provider configuration.
     */
    public boolean isOidc() {
        return "OIDC".equalsIgnoreCase(protocol);
    }

    /**
     * Check if this is a SAML provider configuration.
     */
    public boolean isSaml() {
        return "SAML".equalsIgnoreCase(protocol);
    }

    /**
     * Check if this is an LDAP provider configuration.
     */
    public boolean isLdap() {
        return "LDAP".equalsIgnoreCase(protocol);
    }

    /**
     * Check if this is an OAuth2 provider configuration.
     */
    public boolean isOauth2() {
        return "OAUTH2".equalsIgnoreCase(protocol);
    }
}
