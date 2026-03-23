package com.ems.common.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.UNAUTHORIZED)
public class InvalidCredentialsException extends AuthenticationException {

    public InvalidCredentialsException() {
        super("Invalid email or password", "invalid_credentials");
    }

    public InvalidCredentialsException(String message) {
        super(message, "invalid_credentials");
    }
}
