package com.ems.license.entity;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.MethodSource;

import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("UserTier")
class UserTierTest {

    @Nested
    @DisplayName("Enum values")
    class EnumValues {

        @Test
        @DisplayName("Should have exactly 4 tier values")
        void shouldHaveExactly4Values() {
            // Act & Assert
            assertThat(UserTier.values()).hasSize(4);
        }

        @Test
        @DisplayName("Should contain all expected tier values")
        void shouldContainAllExpectedValues() {
            // Act & Assert
            assertThat(UserTier.values()).containsExactly(
                    UserTier.TENANT_ADMIN,
                    UserTier.POWER_USER,
                    UserTier.CONTRIBUTOR,
                    UserTier.VIEWER
            );
        }
    }

    @Nested
    @DisplayName("Display names")
    class DisplayNames {

        static Stream<Arguments> tierDisplayNameProvider() {
            return Stream.of(
                    Arguments.of(UserTier.TENANT_ADMIN, "Tenant Admin"),
                    Arguments.of(UserTier.POWER_USER, "Power User"),
                    Arguments.of(UserTier.CONTRIBUTOR, "Contributor"),
                    Arguments.of(UserTier.VIEWER, "Viewer")
            );
        }

        @ParameterizedTest
        @MethodSource("tierDisplayNameProvider")
        @DisplayName("Should have correct display name")
        void shouldHaveCorrectDisplayName(UserTier tier, String expectedDisplayName) {
            // Act & Assert
            assertThat(tier.getDisplayName()).isEqualTo(expectedDisplayName);
        }

        @ParameterizedTest
        @EnumSource(UserTier.class)
        @DisplayName("Should have non-blank display name for all tiers")
        void shouldHaveNonBlankDisplayName(UserTier tier) {
            // Act & Assert
            assertThat(tier.getDisplayName()).isNotBlank();
        }
    }

    @Nested
    @DisplayName("RBAC role mappings")
    class RbacRoles {

        static Stream<Arguments> tierRoleProvider() {
            return Stream.of(
                    Arguments.of(UserTier.TENANT_ADMIN, "ROLE_TENANT_ADMIN"),
                    Arguments.of(UserTier.POWER_USER, "ROLE_POWER_USER"),
                    Arguments.of(UserTier.CONTRIBUTOR, "ROLE_CONTRIBUTOR"),
                    Arguments.of(UserTier.VIEWER, "ROLE_VIEWER")
            );
        }

        @ParameterizedTest
        @MethodSource("tierRoleProvider")
        @DisplayName("Should map to correct RBAC role")
        void shouldMapToCorrectRbacRole(UserTier tier, String expectedRole) {
            // Act & Assert
            assertThat(tier.getRbacRole()).isEqualTo(expectedRole);
        }

        @ParameterizedTest
        @EnumSource(UserTier.class)
        @DisplayName("Should have RBAC role starting with ROLE_ prefix")
        void shouldHaveRolePrefixed(UserTier tier) {
            // Act & Assert
            assertThat(tier.getRbacRole()).startsWith("ROLE_");
        }

        @ParameterizedTest
        @EnumSource(UserTier.class)
        @DisplayName("Should have non-blank RBAC role for all tiers")
        void shouldHaveNonBlankRbacRole(UserTier tier) {
            // Act & Assert
            assertThat(tier.getRbacRole()).isNotBlank();
        }
    }

    @Nested
    @DisplayName("valueOf")
    class ValueOf {

        @ParameterizedTest
        @EnumSource(UserTier.class)
        @DisplayName("Should resolve from name string for all tiers")
        void shouldResolveFromName(UserTier tier) {
            // Act
            UserTier resolved = UserTier.valueOf(tier.name());

            // Assert
            assertThat(resolved).isEqualTo(tier);
        }
    }
}
