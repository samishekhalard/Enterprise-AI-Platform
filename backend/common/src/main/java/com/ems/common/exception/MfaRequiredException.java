package com.ems.common.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.FORBIDDEN)
public class MfaRequiredException extends RuntimeException {

    private final String mfaSessionToken;

    public MfaRequiredException(String mfaSessionToken) {
        super("MFA verification required");
        this.mfaSessionToken = mfaSessionToken;
    }

    public String getMfaSessionToken() {
        return mfaSessionToken;
    }
}
