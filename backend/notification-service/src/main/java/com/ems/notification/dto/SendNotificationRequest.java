package com.ems.notification.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Builder;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Builder
public record SendNotificationRequest(
    @NotBlank @Size(max = 50) String tenantId,
    @NotNull UUID userId,
    @NotBlank @Size(max = 20) String type, // EMAIL, PUSH, IN_APP, SMS
    @Size(max = 50) String category, // SYSTEM, MARKETING, TRANSACTIONAL, ALERT
    String subject,
    String body,
    String bodyHtml,
    UUID templateId,
    Map<String, Object> templateData,
    String recipientAddress,
    @Size(max = 10) String priority, // LOW, NORMAL, HIGH, URGENT
    Instant scheduledAt,
    @Size(max = 500) String actionUrl,
    @Size(max = 100) String actionLabel,
    Map<String, Object> metadata,
    @Size(max = 100) String correlationId,
    Integer expiresInHours
) {}
