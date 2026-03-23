package com.ems.common.dto.auth;

import java.time.Instant;
import java.util.Map;

/**
 * DTO representing a Keycloak authentication event.
 * Used for audit logging and security monitoring.
 */
public record AuthEventDTO(
    String id,
    String type,
    String userId,
    String username,
    String ipAddress,
    String clientId,
    String sessionId,
    Instant timestamp,
    String error,
    Map<String, String> details
) {
    /**
     * Common event types from Keycloak
     */
    public static final String LOGIN = "LOGIN";
    public static final String LOGIN_ERROR = "LOGIN_ERROR";
    public static final String LOGOUT = "LOGOUT";
    public static final String LOGOUT_ERROR = "LOGOUT_ERROR";
    public static final String REFRESH_TOKEN = "REFRESH_TOKEN";
    public static final String REFRESH_TOKEN_ERROR = "REFRESH_TOKEN_ERROR";
    public static final String CODE_TO_TOKEN = "CODE_TO_TOKEN";
    public static final String CODE_TO_TOKEN_ERROR = "CODE_TO_TOKEN_ERROR";
    public static final String REGISTER = "REGISTER";
    public static final String REGISTER_ERROR = "REGISTER_ERROR";
    public static final String UPDATE_PASSWORD = "UPDATE_PASSWORD";
    public static final String UPDATE_PASSWORD_ERROR = "UPDATE_PASSWORD_ERROR";
    public static final String RESET_PASSWORD = "RESET_PASSWORD";
    public static final String RESET_PASSWORD_ERROR = "RESET_PASSWORD_ERROR";
    public static final String SEND_RESET_PASSWORD = "SEND_RESET_PASSWORD";
    public static final String SEND_RESET_PASSWORD_ERROR = "SEND_RESET_PASSWORD_ERROR";
    public static final String IMPERSONATE = "IMPERSONATE";
    public static final String TOKEN_EXCHANGE = "TOKEN_EXCHANGE";
    public static final String TOKEN_EXCHANGE_ERROR = "TOKEN_EXCHANGE_ERROR";

    /**
     * Check if this is an error event
     */
    public boolean isError() {
        return type != null && type.endsWith("_ERROR");
    }

    /**
     * Check if this is a login-related event
     */
    public boolean isLoginEvent() {
        return LOGIN.equals(type) || LOGIN_ERROR.equals(type);
    }
}
