package com.ems.notification.dto;

import jakarta.validation.constraints.Size;
import lombok.Builder;

@Builder
public record UpdatePreferenceRequest(
    Boolean emailEnabled,
    Boolean pushEnabled,
    Boolean smsEnabled,
    Boolean inAppEnabled,
    Boolean systemNotifications,
    Boolean marketingNotifications,
    Boolean transactionalNotifications,
    Boolean alertNotifications,
    Boolean quietHoursEnabled,
    @Size(max = 5) String quietHoursStart,
    @Size(max = 5) String quietHoursEnd,
    @Size(max = 50) String timezone,
    Boolean digestEnabled,
    @Size(max = 20) String digestFrequency
) {}
