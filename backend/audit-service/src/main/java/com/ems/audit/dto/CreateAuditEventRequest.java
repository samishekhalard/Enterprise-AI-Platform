package com.ems.audit.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Builder;

import java.util.Map;
import java.util.UUID;

@Builder
public record CreateAuditEventRequest(
    @NotBlank @Size(max = 50) String tenantId,
    UUID userId,
    @Size(max = 255) String username,
    @Size(max = 100) String sessionId,
    @NotBlank @Size(max = 50) String eventType,
    @Size(max = 50) String eventCategory,
    @Size(max = 20) String severity,
    String message,
    @Size(max = 100) String resourceType,
    @Size(max = 255) String resourceId,
    @Size(max = 255) String resourceName,
    @Size(max = 20) String action,
    @Size(max = 20) String outcome,
    String failureReason,
    Map<String, Object> oldValues,
    Map<String, Object> newValues,
    @Size(max = 45) String ipAddress,
    @Size(max = 500) String userAgent,
    @Size(max = 100) String requestId,
    @Size(max = 100) String correlationId,
    @Size(max = 100) String serviceName,
    @Size(max = 50) String serviceVersion,
    Map<String, Object> metadata,
    Integer retentionDays
) {}
