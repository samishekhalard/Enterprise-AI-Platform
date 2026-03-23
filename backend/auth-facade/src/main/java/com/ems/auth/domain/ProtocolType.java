package com.ems.auth.domain;

/**
 * Authentication protocol types.
 *
 * These represent the authentication protocols supported by identity providers.
 */
public enum ProtocolType {

    /**
     * OpenID Connect - Modern standard built on OAuth 2.0.
     * Used by: Keycloak, Auth0, Okta, Azure AD, Google.
     */
    OIDC,

    /**
     * Security Assertion Markup Language 2.0.
     * Used for enterprise SSO integrations.
     */
    SAML,

    /**
     * Lightweight Directory Access Protocol.
     * Used for Active Directory and LDAP server integrations.
     */
    LDAP,

    /**
     * OAuth 2.0 - Authorization framework.
     * Used by: GitHub and social providers without full OIDC.
     */
    OAUTH2
}
