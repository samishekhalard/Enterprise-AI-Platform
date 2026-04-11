package com.ems.notification.dto;

import lombok.Builder;

import java.util.UUID;

@Builder
public record NotificationPreferenceDTO(
    UUID id,
    String tenantId,
    UUID userId,
    Boolean emailEnabled,
    Boolean pushEnabled,
    Boolean smsEnabled,
    Boolean inAppEnabled,
    Boolean systemNotifications,
    Boolean marketingNotifications,
    Boolean transactionalNotifications,
    Boolean alertNotifications,
    Boolean quietHoursEnabled,
    String quietHoursStart,
    String quietHoursEnd,
    String timezone,
    Boolean digestEnabled,
    String digestFrequency
) {}
