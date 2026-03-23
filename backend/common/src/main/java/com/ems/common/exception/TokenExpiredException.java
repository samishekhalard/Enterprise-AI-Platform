package com.ems.common.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.UNAUTHORIZED)
public class TokenExpiredException extends AuthenticationException {

    public TokenExpiredException() {
        super("Token has expired", "token_expired");
    }

    public TokenExpiredException(String message) {
        super(message, "token_expired");
    }
}
