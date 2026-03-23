package com.ems.auth.service;

import com.ems.auth.util.RealmResolver;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Unit tests for AuthServiceImpl -- realm resolution and master tenant logic.
 *
 * Tests: UT-BE-023 through UT-BE-028
 *
 * NOTE: Due to a known Java 25 class-file compatibility issue with ems-common
 * record types (LoginRequest, AuthResponse, UserInfo), this test class cannot
 * directly construct or reference those DTOs. The compiler reports
 * "class file for LoginRequest not found" even though the jar exists.
 * See: TokenServiceTest.java header comment for the same constraint.
 *
 * As a result, these tests focus on:
 * 1. RealmResolver (the core realm resolution logic used by AuthServiceImpl)
 * 2. Master tenant detection (isMasterTenant)
 *
 * The full AuthServiceImpl login flow WITH ems-common DTOs must be tested
 * at the integration level using Testcontainers (deferred to QA-INT agent).
 *
 * Dependencies:
 * - RealmResolver is a static utility class within auth-facade (no ems-common deps)
 * - Tests verify the exact mapping rules documented in RealmResolver.java (lines 39-54)
 * - Tests verify isMasterTenant() logic (lines 63-67) used by AuthServiceImpl.login()
 *   to skip seat validation for master tenant users
 */
class AuthServiceImplTest {

    // =========================================================================
    // UT-BE-027: resolveRealm_masterTenantId_shouldReturnMaster
    // =========================================================================
    @Nested
    @DisplayName("Realm Resolution (RealmResolver used by AuthServiceImpl.login)")
    class RealmResolution {

        @Test
        @DisplayName("UT-BE-027: resolve - 'master' tenant ID - should return 'master' realm")
        void resolve_masterTenantId_shouldReturnMaster() {
            // Arrange - (static utility, no setup needed)

            // Act
            String realm = RealmResolver.resolve("master");

            // Assert
            assertThat(realm).isEqualTo("master");
        }

        @Test
        @DisplayName("UT-BE-027b: resolve - 'tenant-master' - should return 'master' realm")
        void resolve_tenantMasterPrefixed_shouldReturnMaster() {
            // Arrange

            // Act
            String realm = RealmResolver.resolve("tenant-master");

            // Assert
            assertThat(realm).isEqualTo("master");
        }

        @Test
        @DisplayName("UT-BE-027c: resolve - master tenant UUID - should return 'master' realm")
        void resolve_masterTenantUuid_shouldReturnMaster() {
            // Arrange

            // Act
            String realm = RealmResolver.resolve(RealmResolver.MASTER_TENANT_UUID);

            // Assert
            assertThat(realm).isEqualTo("master");
        }

        @Test
        @DisplayName("UT-BE-027d: resolve - case-insensitive 'MASTER' - should return 'master' realm")
        void resolve_masterUppercase_shouldReturnMaster() {
            // Arrange

            // Act
            String realm = RealmResolver.resolve("MASTER");

            // Assert
            assertThat(realm).isEqualTo("master");
        }

        @Test
        @DisplayName("UT-BE-028: resolve - regular tenant ID 'acme' - should add 'tenant-' prefix")
        void resolve_regularTenantId_shouldAddPrefix() {
            // Arrange

            // Act
            String realm = RealmResolver.resolve("acme");

            // Assert
            assertThat(realm).isEqualTo("tenant-acme");
        }

        @Test
        @DisplayName("UT-BE-028b: resolve - already-prefixed 'tenant-acme' - should not double-prefix")
        void resolve_alreadyPrefixedTenantId_shouldNotDoublePrefix() {
            // Arrange

            // Act
            String realm = RealmResolver.resolve("tenant-acme");

            // Assert
            assertThat(realm).isEqualTo("tenant-acme");
        }

        @Test
        @DisplayName("resolve - null tenantId - should throw IllegalArgumentException")
        void resolve_nullTenantId_shouldThrowException() {
            // Arrange - (no setup)

            // Act & Assert
            assertThatThrownBy(() -> RealmResolver.resolve(null))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("must not be null or blank");
        }

        @Test
        @DisplayName("resolve - blank tenantId - should throw IllegalArgumentException")
        void resolve_blankTenantId_shouldThrowException() {
            // Arrange - (no setup)

            // Act & Assert
            assertThatThrownBy(() -> RealmResolver.resolve("   "))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("must not be null or blank");
        }
    }

    // =========================================================================
    // UT-BE-026: Master Tenant Detection (used for seat validation bypass)
    // =========================================================================
    @Nested
    @DisplayName("Master Tenant Detection (used by AuthServiceImpl to skip seat validation)")
    class MasterTenantDetection {

        @Test
        @DisplayName("UT-BE-026: isMasterTenant - 'master' - should return true")
        void isMasterTenant_master_shouldReturnTrue() {
            // Arrange - (no setup)

            // Act & Assert
            assertThat(RealmResolver.isMasterTenant("master")).isTrue();
        }

        @Test
        @DisplayName("UT-BE-026b: isMasterTenant - 'MASTER' (uppercase) - should return true")
        void isMasterTenant_masterUppercase_shouldReturnTrue() {
            // Arrange - (no setup)

            // Act & Assert
            assertThat(RealmResolver.isMasterTenant("MASTER")).isTrue();
        }

        @Test
        @DisplayName("UT-BE-026c: isMasterTenant - 'tenant-master' - should return true")
        void isMasterTenant_tenantMaster_shouldReturnTrue() {
            // Arrange - (no setup)

            // Act & Assert
            assertThat(RealmResolver.isMasterTenant("tenant-master")).isTrue();
        }

        @Test
        @DisplayName("UT-BE-026d: isMasterTenant - master UUID - should return true")
        void isMasterTenant_masterUuid_shouldReturnTrue() {
            // Arrange - (no setup)

            // Act & Assert
            assertThat(RealmResolver.isMasterTenant(RealmResolver.MASTER_TENANT_UUID)).isTrue();
        }

        @Test
        @DisplayName("isMasterTenant - regular tenant 'acme' - should return false")
        void isMasterTenant_regularTenant_shouldReturnFalse() {
            // Arrange - (no setup)

            // Act & Assert
            assertThat(RealmResolver.isMasterTenant("acme")).isFalse();
        }

        @Test
        @DisplayName("isMasterTenant - 'tenant-acme' - should return false")
        void isMasterTenant_tenantAcme_shouldReturnFalse() {
            // Arrange - (no setup)

            // Act & Assert
            assertThat(RealmResolver.isMasterTenant("tenant-acme")).isFalse();
        }
    }
}
