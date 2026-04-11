package com.ems.audit.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record AuditSearchRequest(
    String tenantId,
    UUID userId,
    List<String> eventTypes,
    List<String> eventCategories,
    String resourceType,
    String resourceId,
    String action,
    String outcome,
    List<String> severities,
    String serviceName,
    Instant fromTimestamp,
    Instant toTimestamp,
    String searchText,
    int page,
    int size,
    String sortBy,
    String sortDirection
) {
    public AuditSearchRequest {
        if (page < 0) page = 0;
        if (size <= 0 || size > 1000) size = 50;
        if (sortBy == null || sortBy.isBlank()) sortBy = "timestamp";
        if (sortDirection == null || sortDirection.isBlank()) sortDirection = "DESC";
    }
}
