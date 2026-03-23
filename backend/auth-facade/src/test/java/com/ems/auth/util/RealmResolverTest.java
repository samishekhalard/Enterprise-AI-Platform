package com.ems.auth.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Unit tests for {@link RealmResolver}.
 *
 * Verifies that all tenant-to-realm resolution logic is consistent,
 * fixing the previous bug where EventController stripped "tenant-" prefix
 * while AuthServiceImpl and AuthController added it.
 */
class RealmResolverTest {

    @Nested
    @DisplayName("resolve()")
    class Resolve {

        @Test
        @DisplayName("should return 'master' for 'master' tenant ID")
        void shouldReturnMasterForMasterTenantId() {
            assertThat(RealmResolver.resolve("master")).isEqualTo("master");
        }

        @Test
        @DisplayName("should return 'master' for 'MASTER' (case-insensitive)")
        void shouldReturnMasterForUpperCaseMaster() {
            assertThat(RealmResolver.resolve("MASTER")).isEqualTo("master");
        }

        @Test
        @DisplayName("should return 'master' for 'tenant-master'")
        void shouldReturnMasterForTenantMaster() {
            assertThat(RealmResolver.resolve("tenant-master")).isEqualTo("master");
        }

        @Test
        @DisplayName("should return 'master' for 'TENANT-MASTER' (case-insensitive)")
        void shouldReturnMasterForUpperCaseTenantMaster() {
            assertThat(RealmResolver.resolve("TENANT-MASTER")).isEqualTo("master");
        }

        @Test
        @DisplayName("should return 'master' for master tenant UUID")
        void shouldReturnMasterForMasterTenantUuid() {
            assertThat(RealmResolver.resolve("68cd2a56-98c9-4ed4-8534-c299566d5b27"))
                    .isEqualTo("master");
        }

        @Test
        @DisplayName("should return tenant-prefixed realm for plain tenant ID")
        void shouldPrefixPlainTenantId() {
            assertThat(RealmResolver.resolve("acme")).isEqualTo("tenant-acme");
        }

        @Test
        @DisplayName("should return as-is when already prefixed with 'tenant-'")
        void shouldReturnAsIsWhenAlreadyPrefixed() {
            assertThat(RealmResolver.resolve("tenant-acme")).isEqualTo("tenant-acme");
        }

        @Test
        @DisplayName("should handle UUID tenant IDs by prefixing them")
        void shouldPrefixUuidTenantId() {
            String uuid = "b1234567-1234-1234-1234-123456789012";
            assertThat(RealmResolver.resolve(uuid)).isEqualTo("tenant-" + uuid);
        }

        @ParameterizedTest
        @NullAndEmptySource
        @ValueSource(strings = {"  ", "\t", "\n"})
        @DisplayName("should throw IllegalArgumentException for null or blank tenant ID")
        void shouldThrowForNullOrBlankTenantId(String tenantId) {
            assertThatThrownBy(() -> RealmResolver.resolve(tenantId))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("tenantId must not be null or blank");
        }
    }

    @Nested
    @DisplayName("isMasterTenant()")
    class IsMasterTenant {

        @Test
        @DisplayName("should return true for 'master'")
        void shouldReturnTrueForMaster() {
            assertThat(RealmResolver.isMasterTenant("master")).isTrue();
        }

        @Test
        @DisplayName("should return true for 'Master' (case-insensitive)")
        void shouldReturnTrueForMixedCaseMaster() {
            assertThat(RealmResolver.isMasterTenant("Master")).isTrue();
        }

        @Test
        @DisplayName("should return true for 'tenant-master'")
        void shouldReturnTrueForTenantMaster() {
            assertThat(RealmResolver.isMasterTenant("tenant-master")).isTrue();
        }

        @Test
        @DisplayName("should return true for master tenant UUID")
        void shouldReturnTrueForMasterUuid() {
            assertThat(RealmResolver.isMasterTenant("68cd2a56-98c9-4ed4-8534-c299566d5b27")).isTrue();
        }

        @Test
        @DisplayName("should return false for regular tenant ID")
        void shouldReturnFalseForRegularTenant() {
            assertThat(RealmResolver.isMasterTenant("acme")).isFalse();
        }

        @Test
        @DisplayName("should return false for prefixed regular tenant ID")
        void shouldReturnFalseForPrefixedRegularTenant() {
            assertThat(RealmResolver.isMasterTenant("tenant-acme")).isFalse();
        }

        @Test
        @DisplayName("should return false for random UUID")
        void shouldReturnFalseForRandomUuid() {
            assertThat(RealmResolver.isMasterTenant("b1234567-1234-1234-1234-123456789012")).isFalse();
        }
    }

    @Test
    @DisplayName("MASTER_TENANT_UUID constant should match migration value")
    void masterTenantUuidShouldMatchMigration() {
        assertThat(RealmResolver.MASTER_TENANT_UUID)
                .isEqualTo("68cd2a56-98c9-4ed4-8534-c299566d5b27");
    }
}
