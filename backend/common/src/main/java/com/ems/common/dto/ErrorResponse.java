package com.ems.common.dto;

import lombok.Builder;

import java.time.Instant;
import java.util.Map;

@Builder
public record ErrorResponse(
    String error,
    String message,
    Map<String, String> details,
    Instant timestamp
) {
    public static ErrorResponse of(String error, String message) {
        return ErrorResponse.builder()
            .error(error)
            .message(message)
            .timestamp(Instant.now())
            .build();
    }

    public static ErrorResponse of(String error, String message, Map<String, String> details) {
        return ErrorResponse.builder()
            .error(error)
            .message(message)
            .details(details)
            .timestamp(Instant.now())
            .build();
    }
}
