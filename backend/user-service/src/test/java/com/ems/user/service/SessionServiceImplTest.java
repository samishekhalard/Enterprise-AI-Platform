package com.ems.user.service;

import com.ems.common.enums.SessionStatus;
import com.ems.common.exception.ResourceNotFoundException;
import com.ems.user.dto.UserSessionDTO;
import com.ems.user.entity.UserDeviceEntity;
import com.ems.user.entity.UserProfileEntity;
import com.ems.user.entity.UserSessionEntity;
import com.ems.user.mapper.UserMapper;
import com.ems.user.repository.UserDeviceRepository;
import com.ems.user.repository.UserProfileRepository;
import com.ems.user.repository.UserSessionRepository;
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
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("SessionServiceImpl Unit Tests")
class SessionServiceImplTest {

    @Mock
    private UserSessionRepository sessionRepository;

    @Mock
    private UserProfileRepository userProfileRepository;

    @Mock
    private UserDeviceRepository deviceRepository;

    @Mock
    private UserMapper userMapper;

    @InjectMocks
    private SessionServiceImpl sessionService;

    private static final String TENANT_ID = "tenant-acme";
    private static final UUID USER_ID = UUID.randomUUID();
    private static final UUID KEYCLOAK_ID = UUID.randomUUID();
    private static final UUID SESSION_ID = UUID.randomUUID();
    private static final UUID DEVICE_ID = UUID.randomUUID();
    private static final String SESSION_TOKEN = "session-token-abc";

    private UserProfileEntity userEntity;
    private UserSessionEntity sessionEntity;

    @BeforeEach
    void setUp() {
        userEntity = UserProfileEntity.builder()
            .id(USER_ID)
            .keycloakId(KEYCLOAK_ID)
            .tenantId(TENANT_ID)
            .email("john.doe@acme.com")
            .build();

        sessionEntity = UserSessionEntity.builder()
            .id(SESSION_ID)
            .userId(USER_ID)
            .tenantId(TENANT_ID)
            .deviceId(DEVICE_ID)
            .sessionToken(SESSION_TOKEN)
            .ipAddress("192.168.1.100")
            .status(SessionStatus.ACTIVE)
            .expiresAt(Instant.now().plus(1, ChronoUnit.HOURS))
            .isRemembered(false)
            .mfaVerified(true)
            .build();
    }

    @Nested
    @DisplayName("getCurrentUserSessions")
    class GetCurrentUserSessions {

        @Test
        @DisplayName("Should return active sessions with device info and current flag")
        void getCurrentUserSessions_whenSessionsExist_shouldReturnEnrichedSessions() {
            // Arrange
            UserDeviceEntity device = UserDeviceEntity.builder()
                .id(DEVICE_ID)
                .deviceName("Chrome on MacOS")
                .build();

            when(userProfileRepository.findByKeycloakId(KEYCLOAK_ID)).thenReturn(Optional.of(userEntity));
            when(sessionRepository.findActiveSessionsByUserId(eq(USER_ID), any(Instant.class)))
                .thenReturn(List.of(sessionEntity));
            when(deviceRepository.findById(DEVICE_ID)).thenReturn(Optional.of(device));

            // Act
            List<UserSessionDTO> result = sessionService.getCurrentUserSessions(KEYCLOAK_ID, TENANT_ID, SESSION_TOKEN);

            // Assert
            assertThat(result).hasSize(1);
            UserSessionDTO session = result.get(0);
            assertThat(session.id()).isEqualTo(SESSION_ID);
            assertThat(session.deviceName()).isEqualTo("Chrome on MacOS");
            assertThat(session.isCurrent()).isTrue();
            assertThat(session.ipAddress()).isEqualTo("192.168.1.100");
        }

        @Test
        @DisplayName("Should mark session as not current when token does not match")
        void getCurrentUserSessions_whenTokenDoesNotMatch_shouldSetIsCurrentFalse() {
            // Arrange
            when(userProfileRepository.findByKeycloakId(KEYCLOAK_ID)).thenReturn(Optional.of(userEntity));
            when(sessionRepository.findActiveSessionsByUserId(eq(USER_ID), any(Instant.class)))
                .thenReturn(List.of(sessionEntity));
            when(deviceRepository.findById(DEVICE_ID)).thenReturn(Optional.empty());

            // Act
            List<UserSessionDTO> result = sessionService.getCurrentUserSessions(KEYCLOAK_ID, TENANT_ID, "different-token");

            // Assert
            assertThat(result).hasSize(1);
            assertThat(result.get(0).isCurrent()).isFalse();
        }

        @Test
        @DisplayName("Should handle null current session token")
        void getCurrentUserSessions_withNullToken_shouldSetIsCurrentFalse() {
            // Arrange
            when(userProfileRepository.findByKeycloakId(KEYCLOAK_ID)).thenReturn(Optional.of(userEntity));
            when(sessionRepository.findActiveSessionsByUserId(eq(USER_ID), any(Instant.class)))
                .thenReturn(List.of(sessionEntity));
            when(deviceRepository.findById(DEVICE_ID)).thenReturn(Optional.empty());

            // Act
            List<UserSessionDTO> result = sessionService.getCurrentUserSessions(KEYCLOAK_ID, TENANT_ID, null);

            // Assert
            assertThat(result).hasSize(1);
            assertThat(result.get(0).isCurrent()).isFalse();
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when user not found")
        void getCurrentUserSessions_whenUserNotFound_shouldThrowException() {
            // Arrange
            when(userProfileRepository.findByKeycloakId(KEYCLOAK_ID)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() ->
                sessionService.getCurrentUserSessions(KEYCLOAK_ID, TENANT_ID, SESSION_TOKEN)
            ).isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("Should handle session with null deviceId")
        void getCurrentUserSessions_whenDeviceIdNull_shouldReturnNullDeviceName() {
            // Arrange
            sessionEntity.setDeviceId(null);
            when(userProfileRepository.findByKeycloakId(KEYCLOAK_ID)).thenReturn(Optional.of(userEntity));
            when(sessionRepository.findActiveSessionsByUserId(eq(USER_ID), any(Instant.class)))
                .thenReturn(List.of(sessionEntity));

            // Act
            List<UserSessionDTO> result = sessionService.getCurrentUserSessions(KEYCLOAK_ID, TENANT_ID, null);

            // Assert
            assertThat(result).hasSize(1);
            assertThat(result.get(0).deviceName()).isNull();
        }
    }

    @Nested
    @DisplayName("getUserSessions")
    class GetUserSessions {

        @Test
        @DisplayName("Should return active sessions for given user ID (admin)")
        void getUserSessions_shouldReturnActiveSessions() {
            // Arrange
            when(sessionRepository.findActiveSessionsByUserId(eq(USER_ID), any(Instant.class)))
                .thenReturn(List.of(sessionEntity));
            when(deviceRepository.findById(DEVICE_ID)).thenReturn(Optional.empty());

            // Act
            List<UserSessionDTO> result = sessionService.getUserSessions(USER_ID, TENANT_ID);

            // Assert
            assertThat(result).hasSize(1);
            assertThat(result.get(0).isCurrent()).isFalse();
        }

        @Test
        @DisplayName("Should return empty list when no active sessions")
        void getUserSessions_whenNoSessions_shouldReturnEmpty() {
            // Arrange
            when(sessionRepository.findActiveSessionsByUserId(eq(USER_ID), any(Instant.class)))
                .thenReturn(List.of());

            // Act
            List<UserSessionDTO> result = sessionService.getUserSessions(USER_ID, TENANT_ID);

            // Assert
            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("getTenantSessions")
    class GetTenantSessions {

        @Test
        @DisplayName("Should return all active sessions for tenant")
        void getTenantSessions_shouldReturnAllTenantSessions() {
            // Arrange
            when(sessionRepository.findActiveSessionsByTenantId(eq(TENANT_ID), any(Instant.class)))
                .thenReturn(List.of(sessionEntity));
            when(deviceRepository.findById(DEVICE_ID)).thenReturn(Optional.empty());

            // Act
            List<UserSessionDTO> result = sessionService.getTenantSessions(TENANT_ID);

            // Assert
            assertThat(result).hasSize(1);
        }
    }

    @Nested
    @DisplayName("revokeSession")
    class RevokeSession {

        @Test
        @DisplayName("Should revoke session and save with revocation details")
        void revokeSession_whenSessionExists_shouldRevokeAndSave() {
            // Arrange
            when(userProfileRepository.findByKeycloakId(KEYCLOAK_ID)).thenReturn(Optional.of(userEntity));
            when(sessionRepository.findByIdAndUserId(SESSION_ID, USER_ID)).thenReturn(Optional.of(sessionEntity));

            // Act
            sessionService.revokeSession(SESSION_ID, KEYCLOAK_ID, TENANT_ID);

            // Assert
            ArgumentCaptor<UserSessionEntity> captor = ArgumentCaptor.forClass(UserSessionEntity.class);
            verify(sessionRepository).save(captor.capture());
            UserSessionEntity saved = captor.getValue();
            assertThat(saved.getStatus()).isEqualTo(SessionStatus.REVOKED);
            assertThat(saved.getRevokedBy()).isEqualTo(USER_ID);
            assertThat(saved.getRevokedAt()).isNotNull();
            assertThat(saved.getRevokeReason()).isEqualTo("User requested revocation");
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when user not found")
        void revokeSession_whenUserNotFound_shouldThrowException() {
            // Arrange
            when(userProfileRepository.findByKeycloakId(KEYCLOAK_ID)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() ->
                sessionService.revokeSession(SESSION_ID, KEYCLOAK_ID, TENANT_ID)
            ).isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when session not found for user")
        void revokeSession_whenSessionNotFound_shouldThrowException() {
            // Arrange
            when(userProfileRepository.findByKeycloakId(KEYCLOAK_ID)).thenReturn(Optional.of(userEntity));
            when(sessionRepository.findByIdAndUserId(SESSION_ID, USER_ID)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() ->
                sessionService.revokeSession(SESSION_ID, KEYCLOAK_ID, TENANT_ID)
            ).isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("revokeAllUserSessions")
    class RevokeAllUserSessions {

        @Test
        @DisplayName("Should revoke all sessions for user via bulk update")
        void revokeAllUserSessions_shouldCallBulkRevoke() {
            // Arrange
            UUID revokerKeycloakId = UUID.randomUUID();
            UUID revokerId = UUID.randomUUID();
            UserProfileEntity revoker = UserProfileEntity.builder()
                .id(revokerId)
                .keycloakId(revokerKeycloakId)
                .build();

            when(userProfileRepository.findByKeycloakId(revokerKeycloakId)).thenReturn(Optional.of(revoker));
            when(sessionRepository.revokeAllUserSessions(eq(USER_ID), any(Instant.class), eq(revokerId),
                eq("Admin revoked all sessions"))).thenReturn(3);

            // Act
            sessionService.revokeAllUserSessions(USER_ID, TENANT_ID, revokerKeycloakId);

            // Assert
            verify(sessionRepository).revokeAllUserSessions(
                eq(USER_ID), any(Instant.class), eq(revokerId), eq("Admin revoked all sessions")
            );
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when revoker not found")
        void revokeAllUserSessions_whenRevokerNotFound_shouldThrowException() {
            // Arrange
            UUID revokerKeycloakId = UUID.randomUUID();
            when(userProfileRepository.findByKeycloakId(revokerKeycloakId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() ->
                sessionService.revokeAllUserSessions(USER_ID, TENANT_ID, revokerKeycloakId)
            ).isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("revokeAllTenantSessions")
    class RevokeAllTenantSessions {

        @Test
        @DisplayName("Should revoke all active sessions for tenant")
        void revokeAllTenantSessions_shouldRevokeAllActiveSessions() {
            // Arrange
            UUID revokerKeycloakId = UUID.randomUUID();
            UUID revokerId = UUID.randomUUID();
            UserProfileEntity revoker = UserProfileEntity.builder()
                .id(revokerId)
                .keycloakId(revokerKeycloakId)
                .build();

            UserSessionEntity session1 = UserSessionEntity.builder()
                .id(UUID.randomUUID())
                .status(SessionStatus.ACTIVE)
                .build();
            UserSessionEntity session2 = UserSessionEntity.builder()
                .id(UUID.randomUUID())
                .status(SessionStatus.ACTIVE)
                .build();

            when(userProfileRepository.findByKeycloakId(revokerKeycloakId)).thenReturn(Optional.of(revoker));
            when(sessionRepository.findByTenantIdAndStatus(TENANT_ID, SessionStatus.ACTIVE))
                .thenReturn(List.of(session1, session2));

            // Act
            sessionService.revokeAllTenantSessions(TENANT_ID, revokerKeycloakId);

            // Assert
            verify(sessionRepository).saveAll(List.of(session1, session2));
            assertThat(session1.getStatus()).isEqualTo(SessionStatus.REVOKED);
            assertThat(session1.getRevokedBy()).isEqualTo(revokerId);
            assertThat(session2.getStatus()).isEqualTo(SessionStatus.REVOKED);
            assertThat(session2.getRevokedBy()).isEqualTo(revokerId);
        }

        @Test
        @DisplayName("Should handle no active sessions gracefully")
        void revokeAllTenantSessions_whenNoActiveSessions_shouldSaveEmptyList() {
            // Arrange
            UUID revokerKeycloakId = UUID.randomUUID();
            UserProfileEntity revoker = UserProfileEntity.builder()
                .id(UUID.randomUUID())
                .keycloakId(revokerKeycloakId)
                .build();

            when(userProfileRepository.findByKeycloakId(revokerKeycloakId)).thenReturn(Optional.of(revoker));
            when(sessionRepository.findByTenantIdAndStatus(TENANT_ID, SessionStatus.ACTIVE))
                .thenReturn(List.of());

            // Act
            sessionService.revokeAllTenantSessions(TENANT_ID, revokerKeycloakId);

            // Assert
            verify(sessionRepository).saveAll(List.of());
        }
    }

    @Nested
    @DisplayName("countActiveSessions")
    class CountActiveSessions {

        @Test
        @DisplayName("Should return count of active sessions")
        void countActiveSessions_shouldReturnCount() {
            // Arrange
            when(sessionRepository.countActiveSessionsByUserId(eq(USER_ID), any(Instant.class))).thenReturn(5L);

            // Act
            long result = sessionService.countActiveSessions(USER_ID);

            // Assert
            assertThat(result).isEqualTo(5L);
        }

        @Test
        @DisplayName("Should return zero when no active sessions")
        void countActiveSessions_whenNone_shouldReturnZero() {
            // Arrange
            when(sessionRepository.countActiveSessionsByUserId(eq(USER_ID), any(Instant.class))).thenReturn(0L);

            // Act
            long result = sessionService.countActiveSessions(USER_ID);

            // Assert
            assertThat(result).isZero();
        }
    }
}
