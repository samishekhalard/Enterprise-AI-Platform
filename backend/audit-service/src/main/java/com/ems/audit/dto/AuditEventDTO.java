package com.ems.audit.dto;

import lombok.Builder;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Builder
public record AuditEventDTO(
    UUID id,
    String tenantId,
    UUID userId,
    String username,
    String sessionId,
    String eventType,
    String eventCategory,
    String severity,
    String message,
    String resourceType,
    String resourceId,
    String resourceName,
    String action,
    String outcome,
    String failureReason,
    Map<String, Object> oldValues,
    Map<String, Object> newValues,
    String ipAddress,
    String userAgent,
    String requestId,
    String correlationId,
    String serviceName,
    String serviceVersion,
    Map<String, Object> metadata,
    Instant timestamp,
    Instant expiresAt
) {}
