package com.ems.auth.service;

import com.ems.common.dto.auth.UserInfo;
import io.jsonwebtoken.Claims;

public interface TokenService {

    /**
     * Parse and validate a JWT token
     */
    Claims parseToken(String token);

    /**
     * Extract user info from JWT claims
     */
    UserInfo extractUserInfo(Claims claims);

    /**
     * Check if token is blacklisted
     */
    boolean isBlacklisted(String jti);

    /**
     * Blacklist a token (e.g., on logout)
     */
    void blacklistToken(String jti, long expirationTimeSeconds);

    /**
     * Create an MFA session token
     */
    String createMfaSessionToken(String userId, String tenantId);

    /**
     * Validate MFA session token and return user ID
     */
    String validateMfaSessionToken(String token);

    /**
     * Invalidate MFA session token after successful verification
     */
    void invalidateMfaSession(String token);
}
