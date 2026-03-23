package com.ems.auth.service;

import com.ems.common.dto.auth.*;

public interface AuthService {

    /**
     * Login with email or username and password
     */
    AuthResponse login(String tenantId, LoginRequest request);

    /**
     * Login with Google One Tap
     */
    AuthResponse loginWithGoogle(String tenantId, GoogleTokenRequest request);

    /**
     * Login with Microsoft MSAL
     */
    AuthResponse loginWithMicrosoft(String tenantId, MicrosoftTokenRequest request);

    /**
     * Refresh access token
     */
    AuthResponse refreshToken(String tenantId, RefreshTokenRequest request);

    /**
     * Logout and invalidate tokens
     */
    void logout(String tenantId, LogoutRequest request);

    /**
     * Setup MFA for authenticated user
     */
    MfaSetupResponse setupMfa(String userId, String tenantId, MfaSetupRequest request);

    /**
     * Verify MFA code and complete authentication
     */
    AuthResponse verifyMfa(String tenantId, MfaVerifyRequest request);

    /**
     * Get current user profile
     */
    UserInfo getCurrentUser(String userId, String tenantId);
}
