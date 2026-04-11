package com.ems.common.dto.auth;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record AuthResponse(
    String accessToken,
    String refreshToken,
    long expiresIn,
    String tokenType,
    UserInfo user,
    boolean mfaRequired,
    String mfaSessionToken,
    List<String> features
) {
    public static AuthResponse success(String accessToken, String refreshToken, long expiresIn, UserInfo user) {
        return new AuthResponse(accessToken, refreshToken, expiresIn, "Bearer", user, false, null, null);
    }

    public static AuthResponse mfaRequired(String mfaSessionToken) {
        return new AuthResponse(null, null, 0, null, null, true, mfaSessionToken, null);
    }

    public AuthResponse withFeatures(List<String> features) {
        return new AuthResponse(accessToken, refreshToken, expiresIn, tokenType, user, mfaRequired, mfaSessionToken, features);
    }
}
