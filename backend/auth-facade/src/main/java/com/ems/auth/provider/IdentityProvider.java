package com.ems.auth.provider;

import com.ems.common.dto.auth.*;

import java.util.List;

/**
 * Identity Provider abstraction for auth-facade.
 *
 * This interface decouples the authentication logic from any specific provider
 * (Keycloak, Auth0, FusionAuth, Okta, etc.). To switch providers:
 * 1. Implement this interface for the new provider
 * 2. Mark with @ConditionalOnProperty(name = "auth.facade.provider", havingValue = "new-provider")
 * 3. Set auth.facade.provider=new-provider in configuration
 *
 * No changes required to AuthService or controllers.
 */
public interface IdentityProvider {

    /**
     * Authenticate user with email/username and password.
     * Uses Direct Access Grant / Resource Owner Password Credentials flow.
     */
    AuthResponse authenticate(String realm, String identifier, String password);

    /**
     * Refresh access token using refresh token.
     */
    AuthResponse refreshToken(String realm, String refreshToken);

    /**
     * Revoke/logout a refresh token.
     */
    void logout(String realm, String refreshToken);

    /**
     * Exchange external provider token for application tokens.
     * Used for Google, Microsoft, UAE Pass token exchange (RFC 8693).
     *
     * @param realm The tenant realm
     * @param token The external provider's token
     * @param providerHint The identity provider hint (e.g., "google", "microsoft", "uaepass")
     */
    AuthResponse exchangeToken(String realm, String token, String providerHint);

    /**
     * Initiate login via specific identity provider.
     * Returns redirect URL if browser redirect is needed, or handles inline.
     *
     * @param realm The tenant realm
     * @param providerHint The IdP alias (e.g., "google", "okta-saml", "azure-ad")
     * @param redirectUri Where to redirect after authentication
     * @return LoginInitiationResponse with redirect URL or inline result
     */
    LoginInitiationResponse initiateLogin(String realm, String providerHint, String redirectUri);

    /**
     * Setup TOTP MFA for a user.
     */
    MfaSetupResponse setupMfa(String realm, String userId);

    /**
     * Verify TOTP code for a user.
     */
    boolean verifyMfaCode(String realm, String userId, String code);

    /**
     * Check if user has MFA enabled.
     */
    boolean isMfaEnabled(String realm, String userId);

    /**
     * Get authentication events.
     */
    List<AuthEventDTO> getEvents(String realm, AuthEventQuery query);

    /**
     * Get event count for statistics.
     */
    long getEventCount(String realm, AuthEventQuery query);

    /**
     * Check if this provider supports a specific provider type.
     * Used for dynamic provider selection.
     */
    boolean supports(String providerType);

    /**
     * Get the provider type identifier.
     */
    String getProviderType();
}
