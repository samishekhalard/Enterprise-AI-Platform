package com.ems.notification.service;

import com.ems.notification.dto.NotificationPreferenceDTO;
import com.ems.notification.dto.UpdatePreferenceRequest;

import java.util.UUID;

public interface PreferenceService {

    NotificationPreferenceDTO getPreferences(String tenantId, UUID userId);

    NotificationPreferenceDTO updatePreferences(String tenantId, UUID userId, UpdatePreferenceRequest request);

    NotificationPreferenceDTO createDefaultPreferences(String tenantId, UUID userId);
}
