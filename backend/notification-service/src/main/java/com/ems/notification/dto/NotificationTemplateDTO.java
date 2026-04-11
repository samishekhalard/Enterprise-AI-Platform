package com.ems.notification.dto;

import lombok.Builder;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Builder
public record NotificationTemplateDTO(
    UUID id,
    String tenantId,
    String code,
    String name,
    String description,
    String type,
    String category,
    String subjectTemplate,
    String bodyTemplate,
    String bodyHtmlTemplate,
    List<String> variables,
    Boolean isActive,
    Boolean isSystem,
    String locale,
    Instant createdAt,
    Instant updatedAt
) {}
