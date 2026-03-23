package com.ems.auth.exception;

/**
 * Exception thrown when a requested user is not found in the identity provider.
 */
public class UserNotFoundException extends RuntimeException {

    private final String tenantId;
    private final String userId;

    public UserNotFoundException(String message) {
        super(message);
        this.tenantId = null;
        this.userId = null;
    }

    public UserNotFoundException(String tenantId, String userId) {
        super(String.format("User '%s' not found in tenant '%s'", userId, tenantId));
        this.tenantId = tenantId;
        this.userId = userId;
    }

    public String getTenantId() {
        return tenantId;
    }

    public String getUserId() {
        return userId;
    }
}
