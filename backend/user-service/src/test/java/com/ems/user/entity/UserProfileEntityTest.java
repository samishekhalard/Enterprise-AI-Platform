package com.ems.user.entity;

import com.ems.common.enums.UserStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("UserProfileEntity Unit Tests")
class UserProfileEntityTest {

    @Nested
    @DisplayName("getFullName")
    class GetFullName {

        @Test
        @DisplayName("Should return 'firstName lastName' when both are set")
        void getFullName_whenBothNames_shouldReturnConcatenated() {
            // Arrange
            UserProfileEntity entity = UserProfileEntity.builder()
                .firstName("John")
                .lastName("Doe")
                .build();

            // Act
            String result = entity.getFullName();

            // Assert
            assertThat(result).isEqualTo("John Doe");
        }

        @Test
        @DisplayName("Should return firstName only when lastName is null")
        void getFullName_whenLastNameNull_shouldReturnFirstNameOnly() {
            // Arrange
            UserProfileEntity entity = UserProfileEntity.builder()
                .firstName("John")
                .lastName(null)
                .build();

            // Act
            String result = entity.getFullName();

            // Assert
            assertThat(result).isEqualTo("John");
        }

        @Test
        @DisplayName("Should return lastName only when firstName is null")
        void getFullName_whenFirstNameNull_shouldReturnLastNameOnly() {
            // Arrange
            UserProfileEntity entity = UserProfileEntity.builder()
                .firstName(null)
                .lastName("Doe")
                .build();

            // Act
            String result = entity.getFullName();

            // Assert
            assertThat(result).isEqualTo("Doe");
        }

        @Test
        @DisplayName("Should return displayName when both names are null")
        void getFullName_whenBothNamesNull_shouldReturnDisplayName() {
            // Arrange
            UserProfileEntity entity = UserProfileEntity.builder()
                .firstName(null)
                .lastName(null)
                .displayName("JD")
                .build();

            // Act
            String result = entity.getFullName();

            // Assert
            assertThat(result).isEqualTo("JD");
        }

        @Test
        @DisplayName("Should return email when all name fields are null")
        void getFullName_whenAllNamesNull_shouldReturnEmail() {
            // Arrange
            UserProfileEntity entity = UserProfileEntity.builder()
                .firstName(null)
                .lastName(null)
                .displayName(null)
                .email("john@example.com")
                .build();

            // Act
            String result = entity.getFullName();

            // Assert
            assertThat(result).isEqualTo("john@example.com");
        }
    }

    @Nested
    @DisplayName("addDevice / removeDevice")
    class DeviceManagement {

        @Test
        @DisplayName("Should add device and set bidirectional relationship")
        void addDevice_shouldSetBidirectionalRelationship() {
            // Arrange
            UserProfileEntity user = UserProfileEntity.builder()
                .id(UUID.randomUUID())
                .build();
            UserDeviceEntity device = UserDeviceEntity.builder()
                .id(UUID.randomUUID())
                .fingerprint("fp-123")
                .build();

            // Act
            user.addDevice(device);

            // Assert
            assertThat(user.getDevices()).contains(device);
            assertThat(device.getUser()).isEqualTo(user);
        }

        @Test
        @DisplayName("Should remove device and clear bidirectional relationship")
        void removeDevice_shouldClearBidirectionalRelationship() {
            // Arrange
            UserProfileEntity user = UserProfileEntity.builder()
                .id(UUID.randomUUID())
                .build();
            UserDeviceEntity device = UserDeviceEntity.builder()
                .id(UUID.randomUUID())
                .fingerprint("fp-123")
                .build();
            user.addDevice(device);

            // Act
            user.removeDevice(device);

            // Assert
            assertThat(user.getDevices()).doesNotContain(device);
            assertThat(device.getUser()).isNull();
        }
    }

    @Nested
    @DisplayName("Builder Defaults")
    class BuilderDefaults {

        @Test
        @DisplayName("Should set default status to ACTIVE")
        void builder_shouldDefaultStatusToActive() {
            // Arrange & Act
            UserProfileEntity entity = UserProfileEntity.builder().build();

            // Assert
            assertThat(entity.getStatus()).isEqualTo(UserStatus.ACTIVE);
        }

        @Test
        @DisplayName("Should set default timezone to UTC")
        void builder_shouldDefaultTimezoneToUtc() {
            // Arrange & Act
            UserProfileEntity entity = UserProfileEntity.builder().build();

            // Assert
            assertThat(entity.getTimezone()).isEqualTo("UTC");
        }

        @Test
        @DisplayName("Should set default locale to en")
        void builder_shouldDefaultLocaleToEn() {
            // Arrange & Act
            UserProfileEntity entity = UserProfileEntity.builder().build();

            // Assert
            assertThat(entity.getLocale()).isEqualTo("en");
        }

        @Test
        @DisplayName("Should set default mfaEnabled to false")
        void builder_shouldDefaultMfaEnabledToFalse() {
            // Arrange & Act
            UserProfileEntity entity = UserProfileEntity.builder().build();

            // Assert
            assertThat(entity.getMfaEnabled()).isFalse();
        }

        @Test
        @DisplayName("Should set default accountLocked to false")
        void builder_shouldDefaultAccountLockedToFalse() {
            // Arrange & Act
            UserProfileEntity entity = UserProfileEntity.builder().build();

            // Assert
            assertThat(entity.getAccountLocked()).isFalse();
        }

        @Test
        @DisplayName("Should set default failedLoginAttempts to 0")
        void builder_shouldDefaultFailedLoginAttemptsToZero() {
            // Arrange & Act
            UserProfileEntity entity = UserProfileEntity.builder().build();

            // Assert
            assertThat(entity.getFailedLoginAttempts()).isZero();
        }

        @Test
        @DisplayName("Should set default employeeType to FULL_TIME")
        void builder_shouldDefaultEmployeeTypeToFullTime() {
            // Arrange & Act
            UserProfileEntity entity = UserProfileEntity.builder().build();

            // Assert
            assertThat(entity.getEmployeeType()).isEqualTo("FULL_TIME");
        }

        @Test
        @DisplayName("Should initialize empty devices list")
        void builder_shouldInitializeEmptyDevicesList() {
            // Arrange & Act
            UserProfileEntity entity = UserProfileEntity.builder().build();

            // Assert
            assertThat(entity.getDevices()).isNotNull().isEmpty();
        }

        @Test
        @DisplayName("Should initialize empty mfaMethods list")
        void builder_shouldInitializeEmptyMfaMethodsList() {
            // Arrange & Act
            UserProfileEntity entity = UserProfileEntity.builder().build();

            // Assert
            assertThat(entity.getMfaMethods()).isNotNull().isEmpty();
        }
    }
}
