package com.ems.license.service;

import com.ems.license.dto.SeatValidationResponse;
import com.ems.license.entity.*;
import com.ems.license.repository.TenantLicenseRepository;
import com.ems.license.repository.TierSeatAllocationRepository;
import com.ems.license.repository.UserLicenseAssignmentRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("SeatValidationServiceImpl")
class SeatValidationServiceImplTest {

    @Mock
    private UserLicenseAssignmentRepository assignmentRepository;

    @Mock
    private TenantLicenseRepository tenantLicenseRepository;

    @Mock
    private TierSeatAllocationRepository tierSeatAllocationRepository;

    private TestStringRedisTemplate redisTemplate;

    private TestLicenseStateHolder licenseStateHolder;
    private SeatValidationServiceImpl seatValidationService;
    private ObjectMapper objectMapper;

    private static final String TENANT_ID = "tenant-1";
    private static final UUID USER_ID = UUID.randomUUID();
    private static final UUID TENANT_LICENSE_ID = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        licenseStateHolder = new TestLicenseStateHolder(LicenseState.ACTIVE);
        redisTemplate = new TestStringRedisTemplate();
        objectMapper = new ObjectMapper();
        objectMapper.findAndRegisterModules();
        seatValidationService = new SeatValidationServiceImpl(
                assignmentRepository,
                tenantLicenseRepository,
                tierSeatAllocationRepository,
                licenseStateHolder,
                redisTemplate,
                objectMapper
        );
    }

    private TenantLicenseEntity buildTenantLicense(Instant expiresAt) {
        return TenantLicenseEntity.builder()
                .id(TENANT_LICENSE_ID)
                .tenantId(TENANT_ID)
                .displayName("Test Tenant")
                .expiresAt(expiresAt)
                .features(List.of("basic_workflows"))
                .build();
    }

    private UserLicenseAssignmentEntity buildAssignment(TenantLicenseEntity tenantLicense, UserTier tier) {
        return UserLicenseAssignmentEntity.builder()
                .id(UUID.randomUUID())
                .tenantLicense(tenantLicense)
                .userId(USER_ID)
                .tenantId(TENANT_ID)
                .tier(tier)
                .assignedAt(Instant.now())
                .assignedBy(UUID.randomUUID())
                .build();
    }

    @Nested
    @DisplayName("validateSeat - license state checks")
    class LicenseStateChecks {

        @Test
        @DisplayName("Should return invalid when license state is UNLICENSED")
        void shouldReturnInvalid_whenUnlicensed() {
            // Arrange
            licenseStateHolder.setForcedState(LicenseState.UNLICENSED);

            // Act
            SeatValidationResponse response = seatValidationService.validateSeat(TENANT_ID, USER_ID);

            // Assert
            assertThat(response.isValid()).isFalse();
            assertThat(response.getReason()).contains("unlicensed");
        }

        @Test
        @DisplayName("Should return invalid when license state is EXPIRED")
        void shouldReturnInvalid_whenExpired() {
            // Arrange
            licenseStateHolder.setForcedState(LicenseState.EXPIRED);

            // Act
            SeatValidationResponse response = seatValidationService.validateSeat(TENANT_ID, USER_ID);

            // Assert
            assertThat(response.isValid()).isFalse();
            assertThat(response.getReason()).contains("expired");
        }

        @Test
        @DisplayName("Should return invalid when license state is TAMPERED")
        void shouldReturnInvalid_whenTampered() {
            // Arrange
            licenseStateHolder.setForcedState(LicenseState.TAMPERED);

            // Act
            SeatValidationResponse response = seatValidationService.validateSeat(TENANT_ID, USER_ID);

            // Assert
            assertThat(response.isValid()).isFalse();
            assertThat(response.getReason()).contains("tampered");
        }

        @Test
        @DisplayName("Should allow validation when license state is ACTIVE")
        void shouldAllowValidation_whenLicenseIsActive() {
            // Arrange
            licenseStateHolder.setForcedState(LicenseState.ACTIVE);

            TenantLicenseEntity tenantLicense = buildTenantLicense(Instant.now().plus(365, ChronoUnit.DAYS));
            UserLicenseAssignmentEntity assignment = buildAssignment(tenantLicense, UserTier.CONTRIBUTOR);

            given(assignmentRepository.findByUserIdAndTenantIdWithLicense(USER_ID, TENANT_ID))
                    .willReturn(Optional.of(assignment));

            // Act
            SeatValidationResponse response = seatValidationService.validateSeat(TENANT_ID, USER_ID);

            // Assert
            assertThat(response.isValid()).isTrue();
            assertThat(response.getTier()).isEqualTo(UserTier.CONTRIBUTOR);
        }

        @Test
        @DisplayName("Should allow validation when license state is GRACE")
        void shouldAllowValidation_whenLicenseIsInGrace() {
            // Arrange
            licenseStateHolder.setForcedState(LicenseState.GRACE);

            TenantLicenseEntity tenantLicense = buildTenantLicense(Instant.now().plus(365, ChronoUnit.DAYS));
            UserLicenseAssignmentEntity assignment = buildAssignment(tenantLicense, UserTier.POWER_USER);

            given(assignmentRepository.findByUserIdAndTenantIdWithLicense(USER_ID, TENANT_ID))
                    .willReturn(Optional.of(assignment));

            // Act
            SeatValidationResponse response = seatValidationService.validateSeat(TENANT_ID, USER_ID);

            // Assert
            assertThat(response.isValid()).isTrue();
            assertThat(response.getTier()).isEqualTo(UserTier.POWER_USER);
        }
    }

    @Nested
    @DisplayName("validateSeat - assignment checks")
    class AssignmentChecks {

        @Test
        @DisplayName("Should return invalid when no seat assignment found")
        void shouldReturnInvalid_whenNoAssignmentExists() {
            // Arrange
            given(assignmentRepository.findByUserIdAndTenantIdWithLicense(USER_ID, TENANT_ID))
                    .willReturn(Optional.empty());

            // Act
            SeatValidationResponse response = seatValidationService.validateSeat(TENANT_ID, USER_ID);

            // Assert
            assertThat(response.isValid()).isFalse();
            assertThat(response.getReason()).contains("No active seat assignment");
        }

        @Test
        @DisplayName("Should return invalid when tenant license has expired")
        void shouldReturnInvalid_whenTenantLicenseExpired() {
            // Arrange
            TenantLicenseEntity expiredLicense = buildTenantLicense(Instant.now().minus(10, ChronoUnit.DAYS));
            UserLicenseAssignmentEntity assignment = buildAssignment(expiredLicense, UserTier.VIEWER);

            given(assignmentRepository.findByUserIdAndTenantIdWithLicense(USER_ID, TENANT_ID))
                    .willReturn(Optional.of(assignment));

            // Act
            SeatValidationResponse response = seatValidationService.validateSeat(TENANT_ID, USER_ID);

            // Assert
            assertThat(response.isValid()).isFalse();
            assertThat(response.getReason()).contains("expired");
        }

        @Test
        @DisplayName("Should return valid response with correct tier and expiry")
        void shouldReturnValid_withCorrectDetails() {
            // Arrange
            Instant expiresAt = Instant.now().plus(180, ChronoUnit.DAYS);

            TenantLicenseEntity tenantLicense = buildTenantLicense(expiresAt);
            UserLicenseAssignmentEntity assignment = buildAssignment(tenantLicense, UserTier.TENANT_ADMIN);

            given(assignmentRepository.findByUserIdAndTenantIdWithLicense(USER_ID, TENANT_ID))
                    .willReturn(Optional.of(assignment));

            // Act
            SeatValidationResponse response = seatValidationService.validateSeat(TENANT_ID, USER_ID);

            // Assert
            assertThat(response.isValid()).isTrue();
            assertThat(response.getTier()).isEqualTo(UserTier.TENANT_ADMIN);
            assertThat(response.getTenantLicenseId()).isEqualTo(TENANT_LICENSE_ID);
            assertThat(response.getExpiresAt()).isEqualTo(expiresAt);
        }
    }

    @Nested
    @DisplayName("validateSeat - caching")
    class CachingBehavior {

        @Test
        @DisplayName("Should return cached result on cache hit")
        void shouldReturnCachedResult_onCacheHit() throws Exception {
            // Arrange
            SeatValidationResponse cachedResponse = SeatValidationResponse.valid(
                    TENANT_LICENSE_ID, UserTier.CONTRIBUTOR, Instant.now().plus(100, ChronoUnit.DAYS));
            String cachedJson = objectMapper.writeValueAsString(cachedResponse);

            String cacheKey = "seat:validation:" + TENANT_ID + ":" + USER_ID;
            redisTemplate.putCacheEntry(cacheKey, cachedJson);

            // Act
            SeatValidationResponse response = seatValidationService.validateSeat(TENANT_ID, USER_ID);

            // Assert
            assertThat(response.isValid()).isTrue();
            assertThat(response.getTier()).isEqualTo(UserTier.CONTRIBUTOR);
            verify(assignmentRepository, never()).findByUserIdAndTenantIdWithLicense(any(), anyString());
        }

        @Test
        @DisplayName("Should cache result after DB query on cache miss")
        void shouldCacheResult_afterDbQuery() {
            // Arrange
            TenantLicenseEntity tenantLicense = buildTenantLicense(Instant.now().plus(365, ChronoUnit.DAYS));
            UserLicenseAssignmentEntity assignment = buildAssignment(tenantLicense, UserTier.VIEWER);

            given(assignmentRepository.findByUserIdAndTenantIdWithLicense(USER_ID, TENANT_ID))
                    .willReturn(Optional.of(assignment));

            // Act
            seatValidationService.validateSeat(TENANT_ID, USER_ID);

            // Assert
            String cacheKey = "seat:validation:" + TENANT_ID + ":" + USER_ID;
            assertThat(redisTemplate.wasCached(cacheKey)).isTrue();
            assertThat(redisTemplate.getCacheEntry(cacheKey)).isNotNull();
        }

        @Test
        @DisplayName("Should handle cache read failure gracefully")
        void shouldHandleCacheReadFailure_gracefully() {
            // Arrange
            redisTemplate.setGetException(new RuntimeException("Redis down"));

            given(assignmentRepository.findByUserIdAndTenantIdWithLicense(USER_ID, TENANT_ID))
                    .willReturn(Optional.empty());

            // Act
            SeatValidationResponse response = seatValidationService.validateSeat(TENANT_ID, USER_ID);

            // Assert
            assertThat(response.isValid()).isFalse();
        }
    }

    @Nested
    @DisplayName("hasAvailableSeats")
    class HasAvailableSeats {

        @Test
        @DisplayName("Should return false when no tenant license exists")
        void shouldReturnFalse_whenNoTenantLicenseExists() {
            // Arrange
            given(tenantLicenseRepository.findByTenantId(TENANT_ID))
                    .willReturn(Collections.emptyList());

            // Act
            boolean available = seatValidationService.hasAvailableSeats(TENANT_ID, UserTier.CONTRIBUTOR);

            // Assert
            assertThat(available).isFalse();
        }

        @Test
        @DisplayName("Should return false when no seat allocation found for tier")
        void shouldReturnFalse_whenNoAllocationForTier() {
            // Arrange
            TenantLicenseEntity tenantLicense = buildTenantLicense(Instant.now().plus(365, ChronoUnit.DAYS));

            given(tenantLicenseRepository.findByTenantId(TENANT_ID))
                    .willReturn(List.of(tenantLicense));
            given(tierSeatAllocationRepository.findByTenantLicenseIdAndTier(TENANT_LICENSE_ID, UserTier.CONTRIBUTOR))
                    .willReturn(Optional.empty());

            // Act
            boolean available = seatValidationService.hasAvailableSeats(TENANT_ID, UserTier.CONTRIBUTOR);

            // Assert
            assertThat(available).isFalse();
        }

        @Test
        @DisplayName("Should return true when unlimited seats configured (-1)")
        void shouldReturnTrue_whenUnlimitedSeats() {
            // Arrange
            TenantLicenseEntity tenantLicense = buildTenantLicense(Instant.now().plus(365, ChronoUnit.DAYS));
            TierSeatAllocationEntity allocation = TierSeatAllocationEntity.builder()
                    .id(UUID.randomUUID())
                    .tenantLicense(tenantLicense)
                    .tier(UserTier.VIEWER)
                    .maxSeats(-1)
                    .build();

            given(tenantLicenseRepository.findByTenantId(TENANT_ID))
                    .willReturn(List.of(tenantLicense));
            given(tierSeatAllocationRepository.findByTenantLicenseIdAndTier(TENANT_LICENSE_ID, UserTier.VIEWER))
                    .willReturn(Optional.of(allocation));

            // Act
            boolean available = seatValidationService.hasAvailableSeats(TENANT_ID, UserTier.VIEWER);

            // Assert
            assertThat(available).isTrue();
        }

        @Test
        @DisplayName("Should return true when tier has available seats")
        void shouldReturnTrue_whenSeatsAvailable() {
            // Arrange
            TenantLicenseEntity tenantLicense = buildTenantLicense(Instant.now().plus(365, ChronoUnit.DAYS));
            TierSeatAllocationEntity allocation = TierSeatAllocationEntity.builder()
                    .id(UUID.randomUUID())
                    .tenantLicense(tenantLicense)
                    .tier(UserTier.POWER_USER)
                    .maxSeats(5)
                    .build();

            given(tenantLicenseRepository.findByTenantId(TENANT_ID))
                    .willReturn(List.of(tenantLicense));
            given(tierSeatAllocationRepository.findByTenantLicenseIdAndTier(TENANT_LICENSE_ID, UserTier.POWER_USER))
                    .willReturn(Optional.of(allocation));
            given(assignmentRepository.countByTenantIdAndTier(TENANT_ID, UserTier.POWER_USER))
                    .willReturn(3L);

            // Act
            boolean available = seatValidationService.hasAvailableSeats(TENANT_ID, UserTier.POWER_USER);

            // Assert
            assertThat(available).isTrue();
        }

        @Test
        @DisplayName("Should return false when tier is full")
        void shouldReturnFalse_whenTierIsFull() {
            // Arrange
            TenantLicenseEntity tenantLicense = buildTenantLicense(Instant.now().plus(365, ChronoUnit.DAYS));
            TierSeatAllocationEntity allocation = TierSeatAllocationEntity.builder()
                    .id(UUID.randomUUID())
                    .tenantLicense(tenantLicense)
                    .tier(UserTier.TENANT_ADMIN)
                    .maxSeats(2)
                    .build();

            given(tenantLicenseRepository.findByTenantId(TENANT_ID))
                    .willReturn(List.of(tenantLicense));
            given(tierSeatAllocationRepository.findByTenantLicenseIdAndTier(TENANT_LICENSE_ID, UserTier.TENANT_ADMIN))
                    .willReturn(Optional.of(allocation));
            given(assignmentRepository.countByTenantIdAndTier(TENANT_ID, UserTier.TENANT_ADMIN))
                    .willReturn(2L);

            // Act
            boolean available = seatValidationService.hasAvailableSeats(TENANT_ID, UserTier.TENANT_ADMIN);

            // Assert
            assertThat(available).isFalse();
        }
    }

    @Nested
    @DisplayName("invalidateCache")
    class InvalidateCache {

        @Test
        @DisplayName("Should delete cache key for user in tenant")
        void shouldDeleteCacheKey() {
            // Arrange
            String cacheKey = "seat:validation:" + TENANT_ID + ":" + USER_ID;
            redisTemplate.putCacheEntry(cacheKey, "some-cached-value");

            // Act
            seatValidationService.invalidateCache(TENANT_ID, USER_ID);

            // Assert
            assertThat(redisTemplate.wasDeleted(cacheKey)).isTrue();
            assertThat(redisTemplate.getCacheEntry(cacheKey)).isNull();
        }

        @Test
        @DisplayName("Should handle cache deletion failure gracefully")
        void shouldHandleCacheDeletionFailure_gracefully() {
            // Arrange
            redisTemplate.setDeleteException(new RuntimeException("Redis down"));

            // Act - should not throw
            seatValidationService.invalidateCache(TENANT_ID, USER_ID);

            // Assert - no exception thrown, test passes
        }
    }
}
