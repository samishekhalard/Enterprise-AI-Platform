package com.ems.common.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.FORBIDDEN)
public class AccountLockedException extends AuthenticationException {

    public AccountLockedException() {
        super("Account is locked", "account_locked");
    }

    public AccountLockedException(String message) {
        super(message, "account_locked");
    }
}
