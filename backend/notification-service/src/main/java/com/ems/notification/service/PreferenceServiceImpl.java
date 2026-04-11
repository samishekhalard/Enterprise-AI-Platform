package com.ems.notification.service;

import com.ems.notification.dto.NotificationPreferenceDTO;
import com.ems.notification.dto.UpdatePreferenceRequest;
import com.ems.notification.entity.NotificationPreferenceEntity;
import com.ems.notification.mapper.NotificationMapper;
import com.ems.notification.repository.NotificationPreferenceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PreferenceServiceImpl implements PreferenceService {

    private final NotificationPreferenceRepository repository;
    private final NotificationMapper mapper;

    @Override
    @Transactional(readOnly = true)
    public NotificationPreferenceDTO getPreferences(String tenantId, UUID userId) {
        return repository.findByTenantIdAndUserId(tenantId, userId)
            .map(mapper::toPreferenceDTO)
            .orElseGet(() -> createDefaultPreferences(tenantId, userId));
    }

    @Override
    public NotificationPreferenceDTO updatePreferences(String tenantId, UUID userId, UpdatePreferenceRequest request) {
        log.debug("Updating preferences for user {} in tenant {}", userId, tenantId);

        NotificationPreferenceEntity entity = repository.findByTenantIdAndUserId(tenantId, userId)
            .orElseGet(() -> createDefaultEntity(tenantId, userId));

        mapper.updatePreference(request, entity);
        entity = repository.save(entity);

        log.info("Updated preferences for user {}", userId);
        return mapper.toPreferenceDTO(entity);
    }

    @Override
    public NotificationPreferenceDTO createDefaultPreferences(String tenantId, UUID userId) {
        log.debug("Creating default preferences for user {} in tenant {}", userId, tenantId);

        if (repository.existsByTenantIdAndUserId(tenantId, userId)) {
            return mapper.toPreferenceDTO(
                repository.findByTenantIdAndUserId(tenantId, userId).orElseThrow()
            );
        }

        NotificationPreferenceEntity entity = createDefaultEntity(tenantId, userId);
        entity = repository.save(entity);

        return mapper.toPreferenceDTO(entity);
    }

    private NotificationPreferenceEntity createDefaultEntity(String tenantId, UUID userId) {
        return NotificationPreferenceEntity.builder()
            .tenantId(tenantId)
            .userId(userId)
            .emailEnabled(true)
            .pushEnabled(true)
            .smsEnabled(false)
            .inAppEnabled(true)
            .systemNotifications(true)
            .marketingNotifications(false)
            .transactionalNotifications(true)
            .alertNotifications(true)
            .quietHoursEnabled(false)
            .timezone("UTC")
            .digestEnabled(false)
            .digestFrequency("DAILY")
            .build();
    }
}
