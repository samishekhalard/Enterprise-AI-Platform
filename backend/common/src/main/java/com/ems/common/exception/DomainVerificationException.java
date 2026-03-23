package com.ems.common.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.BAD_REQUEST)
public class DomainVerificationException extends RuntimeException {

    private final String domain;

    public DomainVerificationException(String message) {
        super(message);
        this.domain = null;
    }

    public DomainVerificationException(String domain, String reason) {
        super(String.format("Domain verification failed for '%s': %s", domain, reason));
        this.domain = domain;
    }

    public String getDomain() {
        return domain;
    }
}
