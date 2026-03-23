package com.ems.license.repository;

import com.ems.license.entity.*;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Integration tests for {@link TierSeatAllocationRepository} using Testcontainers PostgreSQL.
 * Tests composite unique constraints, CHECK constraints on tier and max_seats, and finder methods.
 */
@DataJpaTest
@Testcontainers
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
@DisplayName("TierSeatAllocationRepository Integration Tests")
class TierSeatAllocationRepositoryIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("license_db")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", () -> postgres.getJdbcUrl() + "&stringtype=unspecified");
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private TierSeatAllocationRepository tierSeatAllocationRepository;

    @Autowired
    private TenantLicenseRepository tenantLicenseRepository;

    @Autowired
    private ApplicationLicenseRepository applicationLicenseRepository;

    @Autowired
    private LicenseFileRepository licenseFileRepository;

    @Autowired
    private EntityManager entityManager;

    private TenantLicenseEntity savedTenantLicense;

    @BeforeEach
    void setUp() {
        LicenseFileEntity file = licenseFileRepository.saveAndFlush(LicenseFileEntity.builder()
                .licenseId("LIC-TSA-" + UUID.randomUUID().toString().substring(0, 8))
                .formatVersion("1.0")
                .kid("key-001")
                .issuer("EMS Vendor GmbH")
                .issuedAt(Instant.parse("2026-01-15T10:00:00Z"))
                .customerId("CUST-001")
                .customerName("Acme Corp")
                .customerCountry("DE")
                .rawContent("raw".getBytes(StandardCharsets.UTF_8))
                .payloadJson("{}")
                .signature("sig".getBytes(StandardCharsets.UTF_8))
                .importStatus(LicenseImportStatus.SUPERSEDED)
                .importedBy(UUID.randomUUID())
                .build());

        ApplicationLicenseEntity appLicense = applicationLicenseRepository.saveAndFlush(ApplicationLicenseEntity.builder()
                .licenseFile(file)
                .product("EMSIST")
                .versionMin("1.0.0")
                .versionMax("2.99.99")
                .maxTenants(10)
                .expiresAt(Instant.parse("2027-12-31T23:59:59Z"))
                .features(Arrays.asList("basic_workflows"))
                .gracePeriodDays(30)
                .degradedFeatures(List.of())
                .build());

        savedTenantLicense = tenantLicenseRepository.saveAndFlush(TenantLicenseEntity.builder()
                .applicationLicense(appLicense)
                .tenantId("tenant-tsa-test")
                .displayName("TSA Test Tenant")
                .expiresAt(Instant.parse("2027-06-30T23:59:59Z"))
                .features(Arrays.asList("basic_workflows"))
                .build());
    }

    private TierSeatAllocationEntity buildAllocation(UserTier tier, int maxSeats) {
        return TierSeatAllocationEntity.builder()
                .tenantLicense(savedTenantLicense)
                .tier(tier)
                .maxSeats(maxSeats)
                .build();
    }

    // ---- Tests ----

    @Test
    @DisplayName("Save 4 allocations per tenant license (one per tier) should work")
    void save_fourAllocationsPerTenantLicense_shouldWork() {
        // Arrange & Act
        tierSeatAllocationRepository.saveAndFlush(buildAllocation(UserTier.TENANT_ADMIN, 2));
        tierSeatAllocationRepository.saveAndFlush(buildAllocation(UserTier.POWER_USER, 5));
        tierSeatAllocationRepository.saveAndFlush(buildAllocation(UserTier.CONTRIBUTOR, 20));
        tierSeatAllocationRepository.saveAndFlush(buildAllocation(UserTier.VIEWER, -1));

        List<TierSeatAllocationEntity> all = tierSeatAllocationRepository.findByTenantLicenseId(savedTenantLicense.getId());

        // Assert
        assertThat(all).hasSize(4);
    }

    @Test
    @DisplayName("Duplicate (tenant_license_id + tier) should violate composite unique constraint")
    void save_duplicateTierForSameTenantLicense_shouldViolateCompositeUnique() {
        // Arrange
        tierSeatAllocationRepository.saveAndFlush(buildAllocation(UserTier.POWER_USER, 5));

        TierSeatAllocationEntity duplicate = buildAllocation(UserTier.POWER_USER, 10);

        // Act & Assert
        assertThatThrownBy(() -> {
            tierSeatAllocationRepository.saveAndFlush(duplicate);
        }).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("Invalid tier value should be rejected by chk_tier_seat_tier CHECK constraint")
    void save_withInvalidTierValue_shouldBeRejectedByCheckConstraint() {
        // Arrange -- insert directly with native SQL to bypass enum safety
        UUID tenantLicenseId = savedTenantLicense.getId();

        // Act & Assert
        assertThatThrownBy(() -> {
            entityManager.createNativeQuery(
                    "INSERT INTO tier_seat_allocations (id, tenant_license_id, tier, max_seats, version, created_at, updated_at) " +
                    "VALUES (:id, :tlId, 'INVALID_TIER', 5, 0, NOW(), NOW())")
                    .setParameter("id", UUID.randomUUID())
                    .setParameter("tlId", tenantLicenseId)
                    .executeUpdate();
            entityManager.flush();
        }).isInstanceOf(Exception.class);
    }

    @Test
    @DisplayName("max_seats = -2 should be rejected by chk_tier_seat_max_seats (must be -1 or >= 0)")
    void save_withMaxSeatsMinusTwo_shouldBeRejected() {
        // Arrange -- use native SQL to bypass Java-level validation
        UUID tenantLicenseId = savedTenantLicense.getId();

        // Act & Assert
        assertThatThrownBy(() -> {
            entityManager.createNativeQuery(
                    "INSERT INTO tier_seat_allocations (id, tenant_license_id, tier, max_seats, version, created_at, updated_at) " +
                    "VALUES (:id, :tlId, 'TENANT_ADMIN', -2, 0, NOW(), NOW())")
                    .setParameter("id", UUID.randomUUID())
                    .setParameter("tlId", tenantLicenseId)
                    .executeUpdate();
            entityManager.flush();
        }).isInstanceOf(Exception.class);
    }

    @Test
    @DisplayName("max_seats = -1 (unlimited) should be accepted and isUnlimited() returns true")
    void save_withMaxSeatsMinusOne_shouldAcceptAsUnlimited() {
        // Arrange & Act
        TierSeatAllocationEntity alloc = buildAllocation(UserTier.VIEWER, -1);
        tierSeatAllocationRepository.saveAndFlush(alloc);
        entityManager.clear();

        TierSeatAllocationEntity loaded = tierSeatAllocationRepository.findById(alloc.getId()).orElseThrow();

        // Assert
        assertThat(loaded.getMaxSeats()).isEqualTo(-1);
        assertThat(loaded.isUnlimited()).isTrue();
    }

    @Test
    @DisplayName("max_seats = 0 should be accepted")
    void save_withMaxSeatsZero_shouldAccept() {
        // Arrange & Act
        TierSeatAllocationEntity alloc = buildAllocation(UserTier.CONTRIBUTOR, 0);
        tierSeatAllocationRepository.saveAndFlush(alloc);
        entityManager.clear();

        TierSeatAllocationEntity loaded = tierSeatAllocationRepository.findById(alloc.getId()).orElseThrow();

        // Assert
        assertThat(loaded.getMaxSeats()).isEqualTo(0);
        assertThat(loaded.isUnlimited()).isFalse();
    }

    @Test
    @DisplayName("findByTenantLicenseIdAndTier should return exact match")
    void findByTenantLicenseIdAndTier_shouldReturnExactMatch() {
        // Arrange
        tierSeatAllocationRepository.saveAndFlush(buildAllocation(UserTier.TENANT_ADMIN, 2));
        tierSeatAllocationRepository.saveAndFlush(buildAllocation(UserTier.POWER_USER, 5));

        // Act
        Optional<TierSeatAllocationEntity> found = tierSeatAllocationRepository
                .findByTenantLicenseIdAndTier(savedTenantLicense.getId(), UserTier.POWER_USER);

        // Assert
        assertThat(found).isPresent();
        assertThat(found.get().getTier()).isEqualTo(UserTier.POWER_USER);
        assertThat(found.get().getMaxSeats()).isEqualTo(5);
    }
}
