package com.ems.user.entity;

import com.ems.common.enums.SessionStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("UserSessionEntity Unit Tests")
class UserSessionEntityTest {

    @Nested
    @DisplayName("isActive")
    class IsActive {

        @Test
        @DisplayName("Should return true when status is ACTIVE and not expired")
        void isActive_whenActiveAndNotExpired_shouldReturnTrue() {
            // Arrange
            UserSessionEntity session = UserSessionEntity.builder()
                .status(SessionStatus.ACTIVE)
                .expiresAt(Instant.now().plus(1, ChronoUnit.HOURS))
                .build();

            // Act & Assert
            assertThat(session.isActive()).isTrue();
        }

        @Test
        @DisplayName("Should return false when status is REVOKED")
        void isActive_whenRevoked_shouldReturnFalse() {
            // Arrange
            UserSessionEntity session = UserSessionEntity.builder()
                .status(SessionStatus.REVOKED)
                .expiresAt(Instant.now().plus(1, ChronoUnit.HOURS))
                .build();

            // Act & Assert
            assertThat(session.isActive()).isFalse();
        }

        @Test
        @DisplayName("Should return false when expired")
        void isActive_whenExpired_shouldReturnFalse() {
            // Arrange
            UserSessionEntity session = UserSessionEntity.builder()
                .status(SessionStatus.ACTIVE)
                .expiresAt(Instant.now().minus(1, ChronoUnit.HOURS))
                .build();

            // Act & Assert
            assertThat(session.isActive()).isFalse();
        }

        @Test
        @DisplayName("Should return false when expiresAt is null")
        void isActive_whenExpiresAtNull_shouldReturnFalse() {
            // Arrange
            UserSessionEntity session = UserSessionEntity.builder()
                .status(SessionStatus.ACTIVE)
                .expiresAt(null)
                .build();

            // Act & Assert
            assertThat(session.isActive()).isFalse();
        }

        @Test
        @DisplayName("Should return false when status is EXPIRED")
        void isActive_whenStatusExpired_shouldReturnFalse() {
            // Arrange
            UserSessionEntity session = UserSessionEntity.builder()
                .status(SessionStatus.EXPIRED)
                .expiresAt(Instant.now().plus(1, ChronoUnit.HOURS))
                .build();

            // Act & Assert
            assertThat(session.isActive()).isFalse();
        }
    }

    @Nested
    @DisplayName("revoke")
    class Revoke {

        @Test
        @DisplayName("Should set status to REVOKED with details")
        void revoke_shouldSetStatusAndDetails() {
            // Arrange
            UUID revokedByUserId = UUID.randomUUID();
            UserSessionEntity session = UserSessionEntity.builder()
                .status(SessionStatus.ACTIVE)
                .build();

            // Act
            session.revoke(revokedByUserId, "Security concern");

            // Assert
            assertThat(session.getStatus()).isEqualTo(SessionStatus.REVOKED);
            assertThat(session.getRevokedBy()).isEqualTo(revokedByUserId);
            assertThat(session.getRevokedAt()).isNotNull();
            assertThat(session.getRevokeReason()).isEqualTo("Security concern");
        }

        @Test
        @DisplayName("Should set revokedAt to approximately now")
        void revoke_shouldSetRevokedAtToNow() {
            // Arrange
            UserSessionEntity session = UserSessionEntity.builder()
                .status(SessionStatus.ACTIVE)
                .build();
            Instant before = Instant.now();

            // Act
            session.revoke(UUID.randomUUID(), "test");

            // Assert
            assertThat(session.getRevokedAt()).isAfterOrEqualTo(before);
            assertThat(session.getRevokedAt()).isBeforeOrEqualTo(Instant.now());
        }
    }

    @Nested
    @DisplayName("updateActivity")
    class UpdateActivity {

        @Test
        @DisplayName("Should update lastActivity to current time")
        void updateActivity_shouldSetLastActivityToNow() {
            // Arrange
            UserSessionEntity session = UserSessionEntity.builder()
                .lastActivity(Instant.now().minus(10, ChronoUnit.MINUTES))
                .build();
            Instant before = Instant.now();

            // Act
            session.updateActivity();

            // Assert
            assertThat(session.getLastActivity()).isAfterOrEqualTo(before);
            assertThat(session.getLastActivity()).isBeforeOrEqualTo(Instant.now());
        }
    }

    @Nested
    @DisplayName("Builder Defaults")
    class BuilderDefaults {

        @Test
        @DisplayName("Should default status to ACTIVE")
        void builder_shouldDefaultStatusToActive() {
            // Arrange & Act
            UserSessionEntity session = UserSessionEntity.builder().build();

            // Assert
            assertThat(session.getStatus()).isEqualTo(SessionStatus.ACTIVE);
        }

        @Test
        @DisplayName("Should default isRemembered to false")
        void builder_shouldDefaultIsRememberedToFalse() {
            // Arrange & Act
            UserSessionEntity session = UserSessionEntity.builder().build();

            // Assert
            assertThat(session.getIsRemembered()).isFalse();
        }

        @Test
        @DisplayName("Should default mfaVerified to false")
        void builder_shouldDefaultMfaVerifiedToFalse() {
            // Arrange & Act
            UserSessionEntity session = UserSessionEntity.builder().build();

            // Assert
            assertThat(session.getMfaVerified()).isFalse();
        }
    }
}
