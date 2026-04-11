package com.ems.auth.tenant;

public class TenantRoutingUnavailableException extends RuntimeException {

    public TenantRoutingUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }

    public TenantRoutingUnavailableException(String message) {
        super(message);
    }
}
