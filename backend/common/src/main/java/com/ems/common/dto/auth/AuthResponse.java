package com.ems.common.dto.auth;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record AuthResponse(
    String accessToken,
    String refreshToken,
    long expiresIn,
    String tokenType,
    UserInfo user,
    boolean mfaRequired,
    String mfaSessionToken
) {
    public static AuthResponse success(String accessToken, String refreshToken, long expiresIn, UserInfo user) {
        return new AuthResponse(accessToken, refreshToken, expiresIn, "Bearer", user, false, null);
    }

    public static AuthResponse mfaRequired(String mfaSessionToken) {
        return new AuthResponse(null, null, 0, null, null, true, mfaSessionToken);
    }
}
