package com.ems.user.service;

import com.ems.common.enums.DeviceTrustLevel;
import com.ems.common.enums.DeviceType;
import com.ems.common.exception.ResourceNotFoundException;
import com.ems.user.dto.UserDeviceDTO;
import com.ems.user.entity.UserDeviceEntity;
import com.ems.user.entity.UserProfileEntity;
import com.ems.user.mapper.UserMapper;
import com.ems.user.repository.UserDeviceRepository;
import com.ems.user.repository.UserProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("DeviceServiceImpl Unit Tests")
class DeviceServiceImplTest {

    @Mock
    private UserDeviceRepository deviceRepository;

    @Mock
    private UserProfileRepository userProfileRepository;

    @Mock
    private UserMapper userMapper;

    @InjectMocks
    private DeviceServiceImpl deviceService;

    private static final String TENANT_ID = "tenant-acme";
    private static final UUID USER_ID = UUID.randomUUID();
    private static final UUID KEYCLOAK_ID = UUID.randomUUID();
    private static final UUID DEVICE_ID = UUID.randomUUID();

    private UserProfileEntity userEntity;
    private UserDeviceEntity deviceEntity;
    private UserDeviceDTO deviceDTO;

    @BeforeEach
    void setUp() {
        userEntity = UserProfileEntity.builder()
            .id(USER_ID)
            .keycloakId(KEYCLOAK_ID)
            .tenantId(TENANT_ID)
            .email("john.doe@acme.com")
            .build();

        deviceEntity = UserDeviceEntity.builder()
            .id(DEVICE_ID)
            .user(userEntity)
            .tenantId(TENANT_ID)
            .fingerprint("fp-abc123")
            .deviceName("Chrome on MacOS")
            .deviceType(DeviceType.BROWSER)
            .osName("macOS")
            .browserName("Chrome")
            .trustLevel(DeviceTrustLevel.UNKNOWN)
            .isApproved(false)
            .loginCount(5)
            .build();

        deviceDTO = UserDeviceDTO.builder()
            .id(DEVICE_ID)
            .fingerprint("fp-abc123")
            .deviceName("Chrome on MacOS")
            .deviceType(DeviceType.BROWSER)
            .trustLevel(DeviceTrustLevel.UNKNOWN)
            .isApproved(false)
            .loginCount(5)
            .build();
    }

    @Nested
    @DisplayName("getCurrentUserDevices")
    class GetCurrentUserDevices {

        @Test
        @DisplayName("Should return devices for current user by keycloak ID")
        void getCurrentUserDevices_whenUserExists_shouldReturnDevices() {
            // Arrange
            when(userProfileRepository.findByKeycloakId(KEYCLOAK_ID)).thenReturn(Optional.of(userEntity));
            when(deviceRepository.findByUserIdOrderByLastSeenDesc(USER_ID)).thenReturn(List.of(deviceEntity));
            when(userMapper.toDeviceDTO(deviceEntity)).thenReturn(deviceDTO);

            // Act
            List<UserDeviceDTO> result = deviceService.getCurrentUserDevices(KEYCLOAK_ID, TENANT_ID);

            // Assert
            assertThat(result).hasSize(1);
            assertThat(result.get(0).deviceName()).isEqualTo("Chrome on MacOS");
            verify(deviceRepository).findByUserIdOrderByLastSeenDesc(USER_ID);
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when user not found")
        void getCurrentUserDevices_whenUserNotFound_shouldThrowException() {
            // Arrange
            when(userProfileRepository.findByKeycloakId(KEYCLOAK_ID)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() ->
                deviceService.getCurrentUserDevices(KEYCLOAK_ID, TENANT_ID)
            ).isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("Should return empty list when user has no devices")
        void getCurrentUserDevices_whenNoDevices_shouldReturnEmptyList() {
            // Arrange
            when(userProfileRepository.findByKeycloakId(KEYCLOAK_ID)).thenReturn(Optional.of(userEntity));
            when(deviceRepository.findByUserIdOrderByLastSeenDesc(USER_ID)).thenReturn(List.of());

            // Act
            List<UserDeviceDTO> result = deviceService.getCurrentUserDevices(KEYCLOAK_ID, TENANT_ID);

            // Assert
            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("getUserDevices")
    class GetUserDevices {

        @Test
        @DisplayName("Should return devices by user ID directly (admin)")
        void getUserDevices_shouldReturnDevicesDirectly() {
            // Arrange
            when(deviceRepository.findByUserIdOrderByLastSeenDesc(USER_ID)).thenReturn(List.of(deviceEntity));
            when(userMapper.toDeviceDTO(deviceEntity)).thenReturn(deviceDTO);

            // Act
            List<UserDeviceDTO> result = deviceService.getUserDevices(USER_ID, TENANT_ID);

            // Assert
            assertThat(result).hasSize(1);
            assertThat(result.get(0).fingerprint()).isEqualTo("fp-abc123");
        }
    }

    @Nested
    @DisplayName("trustDevice")
    class TrustDevice {

        @Test
        @DisplayName("Should set trust level to TRUSTED")
        void trustDevice_whenDeviceExists_shouldSetTrustLevelToTrusted() {
            // Arrange
            when(userProfileRepository.findByKeycloakId(KEYCLOAK_ID)).thenReturn(Optional.of(userEntity));
            when(deviceRepository.findByIdAndUserId(DEVICE_ID, USER_ID)).thenReturn(Optional.of(deviceEntity));
            when(deviceRepository.save(any(UserDeviceEntity.class))).thenReturn(deviceEntity);
            when(userMapper.toDeviceDTO(deviceEntity)).thenReturn(deviceDTO);

            // Act
            UserDeviceDTO result = deviceService.trustDevice(DEVICE_ID, KEYCLOAK_ID, TENANT_ID);

            // Assert
            assertThat(result).isNotNull();
            ArgumentCaptor<UserDeviceEntity> captor = ArgumentCaptor.forClass(UserDeviceEntity.class);
            verify(deviceRepository).save(captor.capture());
            assertThat(captor.getValue().getTrustLevel()).isEqualTo(DeviceTrustLevel.TRUSTED);
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when user not found")
        void trustDevice_whenUserNotFound_shouldThrowException() {
            // Arrange
            when(userProfileRepository.findByKeycloakId(KEYCLOAK_ID)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() ->
                deviceService.trustDevice(DEVICE_ID, KEYCLOAK_ID, TENANT_ID)
            ).isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when device not found for user")
        void trustDevice_whenDeviceNotFound_shouldThrowException() {
            // Arrange
            when(userProfileRepository.findByKeycloakId(KEYCLOAK_ID)).thenReturn(Optional.of(userEntity));
            when(deviceRepository.findByIdAndUserId(DEVICE_ID, USER_ID)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() ->
                deviceService.trustDevice(DEVICE_ID, KEYCLOAK_ID, TENANT_ID)
            ).isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("removeDevice")
    class RemoveDevice {

        @Test
        @DisplayName("Should delete device when found for user")
        void removeDevice_whenDeviceExists_shouldDelete() {
            // Arrange
            when(userProfileRepository.findByKeycloakId(KEYCLOAK_ID)).thenReturn(Optional.of(userEntity));
            when(deviceRepository.findByIdAndUserId(DEVICE_ID, USER_ID)).thenReturn(Optional.of(deviceEntity));

            // Act
            deviceService.removeDevice(DEVICE_ID, KEYCLOAK_ID, TENANT_ID);

            // Assert
            verify(deviceRepository).delete(deviceEntity);
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when device not found")
        void removeDevice_whenDeviceNotFound_shouldThrowException() {
            // Arrange
            when(userProfileRepository.findByKeycloakId(KEYCLOAK_ID)).thenReturn(Optional.of(userEntity));
            when(deviceRepository.findByIdAndUserId(DEVICE_ID, USER_ID)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() ->
                deviceService.removeDevice(DEVICE_ID, KEYCLOAK_ID, TENANT_ID)
            ).isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("blockDevice")
    class BlockDevice {

        @Test
        @DisplayName("Should set trust level to BLOCKED")
        void blockDevice_whenDeviceExists_shouldSetTrustLevelToBlocked() {
            // Arrange
            UUID blockedByKeycloakId = UUID.randomUUID();
            when(deviceRepository.findByIdAndUserId(DEVICE_ID, USER_ID)).thenReturn(Optional.of(deviceEntity));

            // Act
            deviceService.blockDevice(DEVICE_ID, USER_ID, TENANT_ID, blockedByKeycloakId);

            // Assert
            ArgumentCaptor<UserDeviceEntity> captor = ArgumentCaptor.forClass(UserDeviceEntity.class);
            verify(deviceRepository).save(captor.capture());
            assertThat(captor.getValue().getTrustLevel()).isEqualTo(DeviceTrustLevel.BLOCKED);
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when device not found")
        void blockDevice_whenDeviceNotFound_shouldThrowException() {
            // Arrange
            when(deviceRepository.findByIdAndUserId(DEVICE_ID, USER_ID)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() ->
                deviceService.blockDevice(DEVICE_ID, USER_ID, TENANT_ID, UUID.randomUUID())
            ).isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("approveDevice")
    class ApproveDevice {

        @Test
        @DisplayName("Should approve device and set trust to TRUSTED")
        void approveDevice_whenDeviceExists_shouldApproveAndTrust() {
            // Arrange
            UUID approverKeycloakId = UUID.randomUUID();
            UUID approverId = UUID.randomUUID();
            UserProfileEntity approver = UserProfileEntity.builder()
                .id(approverId)
                .keycloakId(approverKeycloakId)
                .build();

            when(userProfileRepository.findByKeycloakId(approverKeycloakId)).thenReturn(Optional.of(approver));
            when(deviceRepository.findByIdAndUserId(DEVICE_ID, USER_ID)).thenReturn(Optional.of(deviceEntity));

            // Act
            deviceService.approveDevice(DEVICE_ID, USER_ID, TENANT_ID, approverKeycloakId);

            // Assert
            ArgumentCaptor<UserDeviceEntity> captor = ArgumentCaptor.forClass(UserDeviceEntity.class);
            verify(deviceRepository).save(captor.capture());
            UserDeviceEntity saved = captor.getValue();
            assertThat(saved.getIsApproved()).isTrue();
            assertThat(saved.getApprovedBy()).isEqualTo(approverId);
            assertThat(saved.getApprovedAt()).isNotNull();
            assertThat(saved.getTrustLevel()).isEqualTo(DeviceTrustLevel.TRUSTED);
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when approver not found")
        void approveDevice_whenApproverNotFound_shouldThrowException() {
            // Arrange
            UUID approverKeycloakId = UUID.randomUUID();
            when(userProfileRepository.findByKeycloakId(approverKeycloakId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() ->
                deviceService.approveDevice(DEVICE_ID, USER_ID, TENANT_ID, approverKeycloakId)
            ).isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when device not found")
        void approveDevice_whenDeviceNotFound_shouldThrowException() {
            // Arrange
            UUID approverKeycloakId = UUID.randomUUID();
            UserProfileEntity approver = UserProfileEntity.builder()
                .id(UUID.randomUUID())
                .keycloakId(approverKeycloakId)
                .build();
            when(userProfileRepository.findByKeycloakId(approverKeycloakId)).thenReturn(Optional.of(approver));
            when(deviceRepository.findByIdAndUserId(DEVICE_ID, USER_ID)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() ->
                deviceService.approveDevice(DEVICE_ID, USER_ID, TENANT_ID, approverKeycloakId)
            ).isInstanceOf(ResourceNotFoundException.class);
        }
    }
}
