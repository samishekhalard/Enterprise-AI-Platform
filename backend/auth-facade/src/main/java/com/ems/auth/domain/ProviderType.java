package com.ems.auth.domain;

/**
 * Supported identity provider types.
 *
 * These represent the identity provider vendors that can be configured
 * for tenant authentication.
 */
public enum ProviderType {

    /**
     * Keycloak (Red Hat) - Primary OIDC/SAML provider.
     */
    KEYCLOAK,

    /**
     * Auth0 (Okta) - Cloud identity platform.
     */
    AUTH0,

    /**
     * Okta - Enterprise identity provider.
     */
    OKTA,

    /**
     * Azure Active Directory (Microsoft Entra ID).
     */
    AZURE_AD,

    /**
     * Google Identity - Google Workspace/Consumer accounts.
     */
    GOOGLE,

    /**
     * Microsoft Account - Consumer Microsoft accounts.
     */
    MICROSOFT,

    /**
     * GitHub - OAuth2 provider for developer authentication.
     */
    GITHUB,

    /**
     * UAE Pass - UAE Government digital identity.
     */
    UAE_PASS,

    /**
     * Generic SAML 2.0 provider.
     */
    SAML_GENERIC,

    /**
     * Generic LDAP/Active Directory provider.
     */
    LDAP_GENERIC
}
