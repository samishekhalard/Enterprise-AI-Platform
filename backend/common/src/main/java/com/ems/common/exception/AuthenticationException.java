package com.ems.common.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.UNAUTHORIZED)
public class AuthenticationException extends RuntimeException {

    private final String errorCode;

    public AuthenticationException(String message) {
        super(message);
        this.errorCode = "authentication_error";
    }

    public AuthenticationException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
    }

    public AuthenticationException(String message, Throwable cause) {
        super(message, cause);
        this.errorCode = "authentication_error";
    }

    public String getErrorCode() {
        return errorCode;
    }
}
