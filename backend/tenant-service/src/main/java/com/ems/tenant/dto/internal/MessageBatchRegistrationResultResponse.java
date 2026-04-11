package com.ems.tenant.dto.internal;

public record MessageBatchRegistrationResultResponse(
    int registeredCount,
    int ignoredCount
) {
}
