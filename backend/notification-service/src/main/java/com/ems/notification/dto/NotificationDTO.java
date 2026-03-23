package com.ems.notification.dto;

import lombok.Builder;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Builder
public record NotificationDTO(
    UUID id,
    String tenantId,
    UUID userId,
    String type,
    String category,
    String subject,
    String body,
    String bodyHtml,
    UUID templateId,
    String status,
    String recipientAddress,
    String priority,
    String actionUrl,
    String actionLabel,
    Map<String, Object> metadata,
    Instant sentAt,
    Instant deliveredAt,
    Instant readAt,
    Instant scheduledAt,
    Instant createdAt,
    Instant expiresAt
) {}
