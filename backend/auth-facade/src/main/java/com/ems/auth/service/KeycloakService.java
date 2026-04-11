package com.ems.auth.service;

import com.ems.common.dto.auth.AuthEventDTO;
import com.ems.common.dto.auth.AuthEventQuery;
import com.ems.common.dto.auth.AuthResponse;
import com.ems.common.dto.auth.MfaSetupResponse;

import java.util.List;

public interface KeycloakService {

    /**
     * Authenticate user via Direct Access Grant (Resource Owner Password Credentials)
     */
    AuthResponse login(String realm, String email, String password);

    /**
     * Refresh access token using refresh token
     */
    AuthResponse refreshToken(String realm, String refreshToken);

    /**
     * Revoke/logout a refresh token
     */
    void logout(String realm, String refreshToken);

    /**
     * Exchange Google ID token for Keycloak tokens
     */
    AuthResponse exchangeGoogleToken(String realm, String googleIdToken);

    /**
     * Exchange Microsoft access token for Keycloak tokens
     */
    AuthResponse exchangeMicrosoftToken(String realm, String microsoftAccessToken);

    /**
     * Setup TOTP MFA for a user
     */
    MfaSetupResponse setupMfa(String realm, String userId);

    /**
     * Verify TOTP code for a user
     */
    boolean verifyMfaCode(String realm, String userId, String code);

    /**
     * Check if user has MFA enabled
     */
    boolean isMfaEnabled(String realm, String userId);

    /**
     * Get authentication events from Keycloak
     */
    List<AuthEventDTO> getEvents(String realm, AuthEventQuery query);

    /**
     * Get event count for statistics
     */
    long getEventCount(String realm, AuthEventQuery query);
}
