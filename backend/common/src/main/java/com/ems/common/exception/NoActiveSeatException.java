package com.ems.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exception thrown when a user attempts to authenticate but does not have
 * an active license seat assignment for the tenant.
 */
@Getter
@ResponseStatus(HttpStatus.FORBIDDEN)
public class NoActiveSeatException extends RuntimeException {

    private final String errorCode;
    private final String tenantId;
    private final String userId;

    public NoActiveSeatException(String tenantId, String userId) {
        super("User does not have an active license seat for this tenant");
        this.errorCode = "no_active_seat";
        this.tenantId = tenantId;
        this.userId = userId;
    }

    public NoActiveSeatException(String message, String tenantId, String userId) {
        super(message);
        this.errorCode = "no_active_seat";
        this.tenantId = tenantId;
        this.userId = userId;
    }
}
