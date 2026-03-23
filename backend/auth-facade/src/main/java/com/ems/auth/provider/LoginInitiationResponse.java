package com.ems.auth.provider;

/**
 * Response for login initiation via identity provider.
 * Supports both redirect-based (OAuth/SAML) and inline (direct) authentication.
 */
public record LoginInitiationResponse(
    /**
     * True if browser redirect is required (OAuth/SAML flows)
     */
    boolean redirectRequired,

    /**
     * Redirect URL for browser-based flows.
     * Null if inline authentication succeeded.
     */
    String redirectUrl,

    /**
     * State parameter for CSRF protection in redirect flows.
     */
    String state,

    /**
     * Direct authentication result if no redirect needed.
     * Null if redirect is required.
     */
    com.ems.common.dto.auth.AuthResponse authResponse
) {
    /**
     * Create a redirect response (OAuth/SAML flows)
     */
    public static LoginInitiationResponse redirect(String redirectUrl, String state) {
        return new LoginInitiationResponse(true, redirectUrl, state, null);
    }

    /**
     * Create an inline response (direct authentication)
     */
    public static LoginInitiationResponse inline(com.ems.common.dto.auth.AuthResponse authResponse) {
        return new LoginInitiationResponse(false, null, null, authResponse);
    }
}
