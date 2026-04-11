package com.ems.common.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class TenantNotFoundException extends ResourceNotFoundException {

    public TenantNotFoundException(String message) {
        super(message);
    }

    public TenantNotFoundException(String field, String value) {
        super("Tenant", field + "=" + value);
    }
}
