package com.ems.common.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.UNAUTHORIZED)
public class InvalidTokenException extends AuthenticationException {

    public InvalidTokenException() {
        super("Invalid or malformed token", "invalid_token");
    }

    public InvalidTokenException(String message) {
        super(message, "invalid_token");
    }
}
