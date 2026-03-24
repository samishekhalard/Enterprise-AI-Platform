package com.ems.notification.service;

import com.ems.notification.dto.NotificationPreferenceDTO;
import com.ems.notification.dto.UpdatePreferenceRequest;
import com.ems.notification.entity.NotificationPreferenceEntity;
import com.ems.notification.mapper.NotificationMapper;
import com.ems.notification.repository.NotificationPreferenceRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("PreferenceServiceImpl Unit Tests")
class PreferenceServiceImplTest {

    @Mock
    private NotificationPreferenceRepository repository;

    @Mock
    private NotificationMapper mapper;

    @InjectMocks
    private PreferenceServiceImpl preferenceService;

    private static final String TENANT_ID = "tenant-1";
    private static final UUID USER_ID = UUID.randomUUID();

    private NotificationPreferenceEntity buildDefaultEntity() {
        return NotificationPreferenceEntity.builder()
                .id(UUID.randomUUID())
                .tenantId(TENANT_ID)
                .userId(USER_ID)
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

    private NotificationPreferenceDTO buildPreferenceDTO() {
        return NotificationPreferenceDTO.builder()
                .id(UUID.randomUUID())
                .tenantId(TENANT_ID)
                .userId(USER_ID)
                .emailEnabled(true)
                .pushEnabled(true)
                .smsEnabled(false)
                .inAppEnabled(true)
                .build();
    }

    @Nested
    @DisplayName("getPreferences()")
    class GetPreferences {

        @Test
        @DisplayName("Should return existing preferences when found")
        void getPreferences_whenExists_shouldReturn() {
            // Arrange
            NotificationPreferenceEntity entity = buildDefaultEntity();
            NotificationPreferenceDTO dto = buildPreferenceDTO();

            when(repository.findByTenantIdAndUserId(TENANT_ID, USER_ID))
                    .thenReturn(Optional.of(entity));
            when(mapper.toPreferenceDTO(entity)).thenReturn(dto);

            // Act
            NotificationPreferenceDTO result = preferenceService.getPreferences(TENANT_ID, USER_ID);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.tenantId()).isEqualTo(TENANT_ID);
            verify(repository).findByTenantIdAndUserId(TENANT_ID, USER_ID);
        }

        @Test
        @DisplayName("Should create default preferences when none exist")
        void getPreferences_whenNotExists_shouldCreateDefaults() {
            // Arrange
            when(repository.findByTenantIdAndUserId(TENANT_ID, USER_ID))
                    .thenReturn(Optional.empty());
            when(repository.existsByTenantIdAndUserId(TENANT_ID, USER_ID)).thenReturn(false);

            NotificationPreferenceEntity savedEntity = buildDefaultEntity();
            when(repository.save(any(NotificationPreferenceEntity.class))).thenReturn(savedEntity);
            when(mapper.toPreferenceDTO(savedEntity)).thenReturn(buildPreferenceDTO());

            // Act
            NotificationPreferenceDTO result = preferenceService.getPreferences(TENANT_ID, USER_ID);

            // Assert
            assertThat(result).isNotNull();
            verify(repository).save(any(NotificationPreferenceEntity.class));
        }
    }

    @Nested
    @DisplayName("updatePreferences()")
    class UpdatePreferences {

        @Test
        @DisplayName("Should update existing preferences")
        void updatePreferences_whenExists_shouldUpdate() {
            // Arrange
            UpdatePreferenceRequest request = UpdatePreferenceRequest.builder()
                    .emailEnabled(false)
                    .pushEnabled(true)
                    .digestEnabled(true)
                    .digestFrequency("WEEKLY")
                    .build();

            NotificationPreferenceEntity entity = buildDefaultEntity();
            when(repository.findByTenantIdAndUserId(TENANT_ID, USER_ID))
                    .thenReturn(Optional.of(entity));
            when(repository.save(any(NotificationPreferenceEntity.class))).thenReturn(entity);
            when(mapper.toPreferenceDTO(entity)).thenReturn(buildPreferenceDTO());

            // Act
            NotificationPreferenceDTO result = preferenceService.updatePreferences(TENANT_ID, USER_ID, request);

            // Assert
            assertThat(result).isNotNull();
            verify(mapper).updatePreference(request, entity);
            verify(repository).save(entity);
        }

        @Test
        @DisplayName("Should create default entity first when no preferences exist")
        void updatePreferences_whenNotExists_shouldCreateDefaultFirst() {
            // Arrange
            UpdatePreferenceRequest request = UpdatePreferenceRequest.builder()
                    .emailEnabled(false)
                    .build();

            when(repository.findByTenantIdAndUserId(TENANT_ID, USER_ID))
                    .thenReturn(Optional.empty());

            NotificationPreferenceEntity savedEntity = buildDefaultEntity();
            when(repository.save(any(NotificationPreferenceEntity.class))).thenReturn(savedEntity);
            when(mapper.toPreferenceDTO(any(NotificationPreferenceEntity.class))).thenReturn(buildPreferenceDTO());

            // Act
            NotificationPreferenceDTO result = preferenceService.updatePreferences(TENANT_ID, USER_ID, request);

            // Assert
            assertThat(result).isNotNull();
            ArgumentCaptor<NotificationPreferenceEntity> captor = ArgumentCaptor.forClass(NotificationPreferenceEntity.class);
            verify(repository).save(captor.capture());
            NotificationPreferenceEntity captured = captor.getValue();
            assertThat(captured.getTenantId()).isEqualTo(TENANT_ID);
            assertThat(captured.getUserId()).isEqualTo(USER_ID);
        }
    }

    @Nested
    @DisplayName("createDefaultPreferences()")
    class CreateDefaultPreferences {

        @Test
        @DisplayName("Should create new default preferences when none exist")
        void createDefaultPreferences_whenNotExists_shouldCreate() {
            // Arrange
            when(repository.existsByTenantIdAndUserId(TENANT_ID, USER_ID)).thenReturn(false);

            NotificationPreferenceEntity savedEntity = buildDefaultEntity();
            when(repository.save(any(NotificationPreferenceEntity.class))).thenReturn(savedEntity);
            when(mapper.toPreferenceDTO(savedEntity)).thenReturn(buildPreferenceDTO());

            // Act
            NotificationPreferenceDTO result = preferenceService.createDefaultPreferences(TENANT_ID, USER_ID);

            // Assert
            assertThat(result).isNotNull();
            ArgumentCaptor<NotificationPreferenceEntity> captor = ArgumentCaptor.forClass(NotificationPreferenceEntity.class);
            verify(repository).save(captor.capture());
            NotificationPreferenceEntity saved = captor.getValue();
            assertThat(saved.getEmailEnabled()).isTrue();
            assertThat(saved.getSmsEnabled()).isFalse();
            assertThat(saved.getTimezone()).isEqualTo("UTC");
            assertThat(saved.getDigestFrequency()).isEqualTo("DAILY");
        }

        @Test
        @DisplayName("Should return existing preferences when they already exist")
        void createDefaultPreferences_whenAlreadyExists_shouldReturnExisting() {
            // Arrange
            NotificationPreferenceEntity existing = buildDefaultEntity();
            when(repository.existsByTenantIdAndUserId(TENANT_ID, USER_ID)).thenReturn(true);
            when(repository.findByTenantIdAndUserId(TENANT_ID, USER_ID))
                    .thenReturn(Optional.of(existing));
            when(mapper.toPreferenceDTO(existing)).thenReturn(buildPreferenceDTO());

            // Act
            NotificationPreferenceDTO result = preferenceService.createDefaultPreferences(TENANT_ID, USER_ID);

            // Assert
            assertThat(result).isNotNull();
            verify(repository, never()).save(any());
        }
    }
}
