package com.ems.user.entity;

import com.ems.common.enums.DeviceTrustLevel;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("UserDeviceEntity Unit Tests")
class UserDeviceEntityTest {

    @Nested
    @DisplayName("recordLogin")
    class RecordLogin {

        @Test
        @DisplayName("Should update lastSeen, IP, location and increment login count")
        void recordLogin_shouldUpdateAllFields() {
            // Arrange
            UserDeviceEntity device = UserDeviceEntity.builder()
                .loginCount(5)
                .lastIpAddress("10.0.0.1")
                .build();
            Map<String, Object> location = Map.of("city", "London", "country", "UK");
            Instant before = Instant.now();

            // Act
            device.recordLogin("192.168.1.100", location);

            // Assert
            assertThat(device.getLastSeenAt()).isAfterOrEqualTo(before);
            assertThat(device.getLastIpAddress()).isEqualTo("192.168.1.100");
            assertThat(device.getLastLocation()).isEqualTo(location);
            assertThat(device.getLoginCount()).isEqualTo(6);
        }

        @Test
        @DisplayName("Should handle null login count by treating as zero")
        void recordLogin_whenLoginCountNull_shouldTreatAsZero() {
            // Arrange
            UserDeviceEntity device = UserDeviceEntity.builder()
                .loginCount(null)
                .build();

            // Act
            device.recordLogin("10.0.0.1", null);

            // Assert
            assertThat(device.getLoginCount()).isEqualTo(1);
        }
    }

    @Nested
    @DisplayName("prePersist")
    class PrePersist {

        @Test
        @DisplayName("Should set firstSeenAt and lastSeenAt when firstSeenAt is null")
        void prePersist_whenFirstSeenAtNull_shouldSetBothTimestamps() {
            // Arrange
            UserDeviceEntity device = UserDeviceEntity.builder().build();
            Instant before = Instant.now();

            // Act
            device.prePersist();

            // Assert
            assertThat(device.getFirstSeenAt()).isAfterOrEqualTo(before);
            assertThat(device.getLastSeenAt()).isAfterOrEqualTo(before);
        }

        @Test
        @DisplayName("Should not override firstSeenAt if already set")
        void prePersist_whenFirstSeenAtSet_shouldNotOverride() {
            // Arrange
            Instant existingFirstSeen = Instant.now().minus(10, ChronoUnit.DAYS);
            UserDeviceEntity device = UserDeviceEntity.builder()
                .firstSeenAt(existingFirstSeen)
                .build();

            // Act
            device.prePersist();

            // Assert
            assertThat(device.getFirstSeenAt()).isEqualTo(existingFirstSeen);
            assertThat(device.getLastSeenAt()).isNotNull();
        }
    }

    @Nested
    @DisplayName("Builder Defaults")
    class BuilderDefaults {

        @Test
        @DisplayName("Should default trustLevel to UNKNOWN")
        void builder_shouldDefaultTrustLevelToUnknown() {
            // Arrange & Act
            UserDeviceEntity device = UserDeviceEntity.builder().build();

            // Assert
            assertThat(device.getTrustLevel()).isEqualTo(DeviceTrustLevel.UNKNOWN);
        }

        @Test
        @DisplayName("Should default isApproved to false")
        void builder_shouldDefaultIsApprovedToFalse() {
            // Arrange & Act
            UserDeviceEntity device = UserDeviceEntity.builder().build();

            // Assert
            assertThat(device.getIsApproved()).isFalse();
        }

        @Test
        @DisplayName("Should default loginCount to 0")
        void builder_shouldDefaultLoginCountToZero() {
            // Arrange & Act
            UserDeviceEntity device = UserDeviceEntity.builder().build();

            // Assert
            assertThat(device.getLoginCount()).isZero();
        }
    }
}
