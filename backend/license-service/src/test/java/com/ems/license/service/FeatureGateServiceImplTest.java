package com.ems.license.service;

import com.ems.license.dto.FeatureGateCheckResponse;
import com.ems.license.entity.LicenseState;
import com.ems.license.entity.TenantLicenseEntity;
import com.ems.license.repository.TenantLicenseRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("FeatureGateServiceImpl")
class FeatureGateServiceImplTest {

    @Mock
    private TenantLicenseRepository tenantLicenseRepository;

    private TestStringRedisTemplate redisTemplate;

    private TestLicenseStateHolder licenseStateHolder;
    private FeatureGateServiceImpl featureGateService;

    private static final String TENANT_ID = "tenant-1";
    private static final String FEATURE_KEY = "advanced_reports";

    @BeforeEach
    void setUp() {
        licenseStateHolder = new TestLicenseStateHolder(LicenseState.ACTIVE);
        redisTemplate = new TestStringRedisTemplate();
        featureGateService = new FeatureGateServiceImpl(
                tenantLicenseRepository,
                licenseStateHolder,
                redisTemplate
        );
    }

    private TenantLicenseEntity buildTenantLicense(List<String> features, Instant expiresAt) {
        return TenantLicenseEntity.builder()
                .id(UUID.randomUUID())
                .tenantId(TENANT_ID)
                .displayName("Test Tenant")
                .expiresAt(expiresAt)
                .features(features)
                .build();
    }

    @Nested
    @DisplayName("checkFeature - license state checks")
    class LicenseStateChecks {

        @Test
        @DisplayName("Should deny feature access when license is UNLICENSED")
        void shouldDenyAccess_whenUnlicensed() {
            // Arrange
            licenseStateHolder.setForcedState(LicenseState.UNLICENSED);

            // Act
            FeatureGateCheckResponse response = featureGateService.checkFeature(TENANT_ID, FEATURE_KEY);

            // Assert
            assertThat(response.allowed()).isFalse();
            assertThat(response.featureKey()).isEqualTo(FEATURE_KEY);
            assertThat(response.reason()).contains("unlicensed");
        }

        @Test
        @DisplayName("Should deny feature access when license is EXPIRED")
        void shouldDenyAccess_whenExpired() {
            // Arrange
            licenseStateHolder.setForcedState(LicenseState.EXPIRED);

            // Act
            FeatureGateCheckResponse response = featureGateService.checkFeature(TENANT_ID, FEATURE_KEY);

            // Assert
            assertThat(response.allowed()).isFalse();
            assertThat(response.reason()).contains("expired");
        }

        @Test
        @DisplayName("Should deny feature access when license is TAMPERED")
        void shouldDenyAccess_whenTampered() {
            // Arrange
            licenseStateHolder.setForcedState(LicenseState.TAMPERED);

            // Act
            FeatureGateCheckResponse response = featureGateService.checkFeature(TENANT_ID, FEATURE_KEY);

            // Assert
            assertThat(response.allowed()).isFalse();
            assertThat(response.reason()).contains("tampered");
        }
    }

    @Nested
    @DisplayName("checkFeature - cache behavior")
    class CacheBehavior {

        @Test
        @DisplayName("Should return allowed from cache when cache has '1'")
        void shouldReturnAllowed_whenCacheHasOne() {
            // Arrange
            String cacheKey = "license:feature:" + TENANT_ID + ":tenant:" + FEATURE_KEY;
            redisTemplate.putCacheEntry(cacheKey, "1");

            // Act
            FeatureGateCheckResponse response = featureGateService.checkFeature(TENANT_ID, FEATURE_KEY);

            // Assert
            assertThat(response.allowed()).isTrue();
            assertThat(response.featureKey()).isEqualTo(FEATURE_KEY);
            verifyNoInteractions(tenantLicenseRepository);
        }

        @Test
        @DisplayName("Should return denied from cache when cache has '0'")
        void shouldReturnDenied_whenCacheHasZero() {
            // Arrange
            String cacheKey = "license:feature:" + TENANT_ID + ":tenant:" + FEATURE_KEY;
            redisTemplate.putCacheEntry(cacheKey, "0");

            // Act
            FeatureGateCheckResponse response = featureGateService.checkFeature(TENANT_ID, FEATURE_KEY);

            // Assert
            assertThat(response.allowed()).isFalse();
            verifyNoInteractions(tenantLicenseRepository);
        }

        @Test
        @DisplayName("Should query DB on cache miss and cache the result")
        void shouldQueryDb_onCacheMiss_andCacheResult() {
            // Arrange
            TenantLicenseEntity tenantLicense = buildTenantLicense(
                    List.of("basic_workflows", FEATURE_KEY),
                    Instant.now().plus(365, ChronoUnit.DAYS)
            );
            given(tenantLicenseRepository.findByTenantId(TENANT_ID))
                    .willReturn(List.of(tenantLicense));

            // Act
            FeatureGateCheckResponse response = featureGateService.checkFeature(TENANT_ID, FEATURE_KEY);

            // Assert
            assertThat(response.allowed()).isTrue();
            String cacheKey = "license:feature:" + TENANT_ID + ":tenant:" + FEATURE_KEY;
            assertThat(redisTemplate.getCacheEntry(cacheKey)).isEqualTo("1");
        }

        @Test
        @DisplayName("Should handle cache read failure gracefully")
        void shouldHandleCacheReadFailure_gracefully() {
            // Arrange
            redisTemplate.setGetException(new RuntimeException("Redis down"));

            TenantLicenseEntity tenantLicense = buildTenantLicense(
                    List.of(FEATURE_KEY),
                    Instant.now().plus(365, ChronoUnit.DAYS)
            );
            given(tenantLicenseRepository.findByTenantId(TENANT_ID))
                    .willReturn(List.of(tenantLicense));

            // Act
            FeatureGateCheckResponse response = featureGateService.checkFeature(TENANT_ID, FEATURE_KEY);

            // Assert
            assertThat(response.allowed()).isTrue();
        }
    }

    @Nested
    @DisplayName("checkFeature - feature access")
    class FeatureAccess {

        @Test
        @DisplayName("Should allow feature that is licensed for tenant")
        void shouldAllowFeature_whenLicensedForTenant() {
            // Arrange
            TenantLicenseEntity tenantLicense = buildTenantLicense(
                    List.of("basic_workflows", FEATURE_KEY),
                    Instant.now().plus(365, ChronoUnit.DAYS)
            );
            given(tenantLicenseRepository.findByTenantId(TENANT_ID))
                    .willReturn(List.of(tenantLicense));

            // Act
            FeatureGateCheckResponse response = featureGateService.checkFeature(TENANT_ID, FEATURE_KEY);

            // Assert
            assertThat(response.allowed()).isTrue();
            assertThat(response.featureKey()).isEqualTo(FEATURE_KEY);
        }

        @Test
        @DisplayName("Should deny feature that is NOT licensed for tenant")
        void shouldDenyFeature_whenNotLicensed() {
            // Arrange
            TenantLicenseEntity tenantLicense = buildTenantLicense(
                    List.of("basic_workflows"),
                    Instant.now().plus(365, ChronoUnit.DAYS)
            );
            given(tenantLicenseRepository.findByTenantId(TENANT_ID))
                    .willReturn(List.of(tenantLicense));

            // Act
            FeatureGateCheckResponse response = featureGateService.checkFeature(TENANT_ID, "nonexistent_feature");

            // Assert
            assertThat(response.allowed()).isFalse();
            assertThat(response.reason()).contains("not licensed");
        }

        @Test
        @DisplayName("Should deny feature when no tenant license found")
        void shouldDenyFeature_whenNoTenantLicenseFound() {
            // Arrange
            given(tenantLicenseRepository.findByTenantId(TENANT_ID))
                    .willReturn(Collections.emptyList());

            // Act
            FeatureGateCheckResponse response = featureGateService.checkFeature(TENANT_ID, FEATURE_KEY);

            // Assert
            assertThat(response.allowed()).isFalse();
            assertThat(response.reason()).contains("No tenant license found");
        }

        @Test
        @DisplayName("Should deny feature when tenant license is expired")
        void shouldDenyFeature_whenTenantLicenseExpired() {
            // Arrange
            TenantLicenseEntity expiredLicense = buildTenantLicense(
                    List.of(FEATURE_KEY),
                    Instant.now().minus(10, ChronoUnit.DAYS)
            );
            given(tenantLicenseRepository.findByTenantId(TENANT_ID))
                    .willReturn(List.of(expiredLicense));

            // Act
            FeatureGateCheckResponse response = featureGateService.checkFeature(TENANT_ID, FEATURE_KEY);

            // Assert
            assertThat(response.allowed()).isFalse();
        }

        @Test
        @DisplayName("Should allow feature in GRACE state when license is active")
        void shouldAllowFeature_whenInGraceState() {
            // Arrange
            licenseStateHolder.setForcedState(LicenseState.GRACE);

            TenantLicenseEntity tenantLicense = buildTenantLicense(
                    List.of(FEATURE_KEY),
                    Instant.now().plus(365, ChronoUnit.DAYS)
            );
            given(tenantLicenseRepository.findByTenantId(TENANT_ID))
                    .willReturn(List.of(tenantLicense));

            // Act
            FeatureGateCheckResponse response = featureGateService.checkFeature(TENANT_ID, FEATURE_KEY);

            // Assert
            assertThat(response.allowed()).isTrue();
        }
    }

    @Nested
    @DisplayName("getTenantFeatures")
    class GetTenantFeatures {

        @Test
        @DisplayName("Should return empty list when license state is UNLICENSED")
        void shouldReturnEmptyList_whenUnlicensed() {
            // Arrange
            licenseStateHolder.setForcedState(LicenseState.UNLICENSED);

            // Act
            List<String> features = featureGateService.getTenantFeatures(TENANT_ID);

            // Assert
            assertThat(features).isEmpty();
        }

        @Test
        @DisplayName("Should return empty list when license state is EXPIRED")
        void shouldReturnEmptyList_whenExpired() {
            // Arrange
            licenseStateHolder.setForcedState(LicenseState.EXPIRED);

            // Act
            List<String> features = featureGateService.getTenantFeatures(TENANT_ID);

            // Assert
            assertThat(features).isEmpty();
        }

        @Test
        @DisplayName("Should return empty list when license state is TAMPERED")
        void shouldReturnEmptyList_whenTampered() {
            // Arrange
            licenseStateHolder.setForcedState(LicenseState.TAMPERED);

            // Act
            List<String> features = featureGateService.getTenantFeatures(TENANT_ID);

            // Assert
            assertThat(features).isEmpty();
        }

        @Test
        @DisplayName("Should return all features for tenant with active license")
        void shouldReturnAllFeatures_forActiveLicense() {
            // Arrange
            TenantLicenseEntity tenantLicense = buildTenantLicense(
                    List.of("basic_workflows", "advanced_reports", "ai_assistant"),
                    Instant.now().plus(365, ChronoUnit.DAYS)
            );
            given(tenantLicenseRepository.findByTenantId(TENANT_ID))
                    .willReturn(List.of(tenantLicense));

            // Act
            List<String> features = featureGateService.getTenantFeatures(TENANT_ID);

            // Assert
            assertThat(features).containsExactlyInAnyOrder("basic_workflows", "advanced_reports", "ai_assistant");
        }

        @Test
        @DisplayName("Should return empty list when no tenant license exists")
        void shouldReturnEmptyList_whenNoTenantLicense() {
            // Arrange
            given(tenantLicenseRepository.findByTenantId(TENANT_ID))
                    .willReturn(Collections.emptyList());

            // Act
            List<String> features = featureGateService.getTenantFeatures(TENANT_ID);

            // Assert
            assertThat(features).isEmpty();
        }

        @Test
        @DisplayName("Should exclude features from expired tenant licenses")
        void shouldExcludeExpiredLicenseFeatures() {
            // Arrange
            TenantLicenseEntity activeLicense = buildTenantLicense(
                    List.of("basic_workflows"),
                    Instant.now().plus(365, ChronoUnit.DAYS)
            );
            TenantLicenseEntity expiredLicense = buildTenantLicense(
                    List.of("expired_feature"),
                    Instant.now().minus(10, ChronoUnit.DAYS)
            );
            given(tenantLicenseRepository.findByTenantId(TENANT_ID))
                    .willReturn(List.of(activeLicense, expiredLicense));

            // Act
            List<String> features = featureGateService.getTenantFeatures(TENANT_ID);

            // Assert
            assertThat(features).containsExactly("basic_workflows");
            assertThat(features).doesNotContain("expired_feature");
        }

        @Test
        @DisplayName("Should return deduplicated features from multiple tenant licenses")
        void shouldReturnDeduplicatedFeatures() {
            // Arrange
            TenantLicenseEntity license1 = buildTenantLicense(
                    List.of("basic_workflows", "advanced_reports"),
                    Instant.now().plus(365, ChronoUnit.DAYS)
            );
            TenantLicenseEntity license2 = buildTenantLicense(
                    List.of("basic_workflows", "ai_assistant"),
                    Instant.now().plus(100, ChronoUnit.DAYS)
            );
            given(tenantLicenseRepository.findByTenantId(TENANT_ID))
                    .willReturn(List.of(license1, license2));

            // Act
            List<String> features = featureGateService.getTenantFeatures(TENANT_ID);

            // Assert
            assertThat(features).containsExactlyInAnyOrder("basic_workflows", "advanced_reports", "ai_assistant");
            assertThat(features).hasSize(3);
        }
    }
}
