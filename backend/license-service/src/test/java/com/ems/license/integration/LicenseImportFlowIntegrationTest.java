package com.ems.license.integration;

import com.ems.license.entity.*;
import com.ems.license.repository.*;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
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
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Full integration flow tests for on-premise licensing.
 * Tests the complete hierarchy: license_file -> application_license -> tenant_licenses ->
 * tier_seat_allocations -> user_license_assignments, plus revocation checks.
 */
@DataJpaTest
@Testcontainers
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
@DisplayName("License Import Flow Integration Tests")
class LicenseImportFlowIntegrationTest {

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
    private LicenseFileRepository licenseFileRepository;

    @Autowired
    private ApplicationLicenseRepository applicationLicenseRepository;

    @Autowired
    private TenantLicenseRepository tenantLicenseRepository;

    @Autowired
    private TierSeatAllocationRepository tierSeatAllocationRepository;

    @Autowired
    private UserLicenseAssignmentRepository userLicenseAssignmentRepository;

    @Autowired
    private RevocationEntryRepository revocationEntryRepository;

    @Autowired
    private EntityManager entityManager;

    // ---- Helpers ----

    private LicenseFileEntity createLicenseFile(String licenseId, LicenseImportStatus status) {
        return LicenseFileEntity.builder()
                .licenseId(licenseId)
                .formatVersion("1.0")
                .kid("key-001")
                .issuer("EMS Vendor GmbH")
                .issuedAt(Instant.parse("2026-01-15T10:00:00Z"))
                .customerId("CUST-001")
                .customerName("Acme Corp")
                .customerCountry("DE")
                .rawContent("raw-license-bytes".getBytes(StandardCharsets.UTF_8))
                .payloadJson("{\"product\":\"EMSIST\",\"version\":\"1.0\"}")
                .signature("sig-bytes-ed25519".getBytes(StandardCharsets.UTF_8))
                .payloadChecksum("sha256-abc123")
                .importStatus(status)
                .importedBy(UUID.randomUUID())
                .build();
    }

    private ApplicationLicenseEntity createAppLicense(LicenseFileEntity file) {
        return ApplicationLicenseEntity.builder()
                .licenseFile(file)
                .product("EMSIST")
                .versionMin("1.0.0")
                .versionMax("2.99.99")
                .maxTenants(10)
                .expiresAt(Instant.parse("2027-12-31T23:59:59Z"))
                .features(Arrays.asList("basic_workflows", "advanced_reports", "ai_persona"))
                .gracePeriodDays(30)
                .degradedFeatures(List.of("ai_persona"))
                .build();
    }

    private TenantLicenseEntity createTenantLicense(ApplicationLicenseEntity appLicense, String tenantId) {
        return TenantLicenseEntity.builder()
                .applicationLicense(appLicense)
                .tenantId(tenantId)
                .displayName("Tenant " + tenantId)
                .expiresAt(Instant.parse("2027-06-30T23:59:59Z"))
                .features(Arrays.asList("basic_workflows", "advanced_reports"))
                .build();
    }

    private void createAllSeatAllocations(TenantLicenseEntity tenantLicense) {
        tierSeatAllocationRepository.saveAndFlush(TierSeatAllocationEntity.builder()
                .tenantLicense(tenantLicense).tier(UserTier.TENANT_ADMIN).maxSeats(2).build());
        tierSeatAllocationRepository.saveAndFlush(TierSeatAllocationEntity.builder()
                .tenantLicense(tenantLicense).tier(UserTier.POWER_USER).maxSeats(5).build());
        tierSeatAllocationRepository.saveAndFlush(TierSeatAllocationEntity.builder()
                .tenantLicense(tenantLicense).tier(UserTier.CONTRIBUTOR).maxSeats(20).build());
        tierSeatAllocationRepository.saveAndFlush(TierSeatAllocationEntity.builder()
                .tenantLicense(tenantLicense).tier(UserTier.VIEWER).maxSeats(-1).build());
    }

    // ---- Tests ----

    @Test
    @DisplayName("Full import flow: persist entire hierarchy across 6 tables")
    void fullImportFlow_shouldPersistEntireHierarchy() {
        // Arrange & Act -- simulate a complete license import

        // 1. Import the signed license file
        LicenseFileEntity file = licenseFileRepository.saveAndFlush(createLicenseFile("LIC-FLOW-001", LicenseImportStatus.ACTIVE));

        // 2. Extract application license from payload
        ApplicationLicenseEntity appLicense = applicationLicenseRepository.saveAndFlush(createAppLicense(file));

        // 3. Create tenant licenses (2 tenants)
        TenantLicenseEntity tl1 = tenantLicenseRepository.saveAndFlush(createTenantLicense(appLicense, "tenant-alpha"));
        TenantLicenseEntity tl2 = tenantLicenseRepository.saveAndFlush(createTenantLicense(appLicense, "tenant-beta"));

        // 4. Create seat allocations for each tenant (4 per tenant = 8 total)
        createAllSeatAllocations(tl1);
        createAllSeatAllocations(tl2);

        // 5. Assign users to seats
        UUID adminUser = UUID.randomUUID();
        UUID contributorUser = UUID.randomUUID();
        userLicenseAssignmentRepository.saveAndFlush(UserLicenseAssignmentEntity.builder()
                .tenantLicense(tl1).userId(adminUser).tenantId("tenant-alpha")
                .tier(UserTier.TENANT_ADMIN).assignedAt(Instant.now()).assignedBy(UUID.randomUUID())
                .build());
        userLicenseAssignmentRepository.saveAndFlush(UserLicenseAssignmentEntity.builder()
                .tenantLicense(tl1).userId(contributorUser).tenantId("tenant-alpha")
                .tier(UserTier.CONTRIBUTOR).assignedAt(Instant.now()).assignedBy(adminUser)
                .build());

        entityManager.clear();

        // Assert -- verify all 6 tables are populated
        assertThat(licenseFileRepository.count()).isEqualTo(1);
        assertThat(applicationLicenseRepository.count()).isEqualTo(1);
        assertThat(tenantLicenseRepository.count()).isEqualTo(2);
        assertThat(tierSeatAllocationRepository.count()).isEqualTo(8);
        assertThat(userLicenseAssignmentRepository.count()).isEqualTo(2);

        // Verify cross-table relationships
        List<TenantLicenseEntity> alphaLicenses = tenantLicenseRepository.findByTenantIdWithAllocations("tenant-alpha");
        assertThat(alphaLicenses).hasSize(1);
        assertThat(alphaLicenses.get(0).getSeatAllocations()).hasSize(4);

        long adminCount = userLicenseAssignmentRepository.countByTenantIdAndTier("tenant-alpha", UserTier.TENANT_ADMIN);
        long contributorCount = userLicenseAssignmentRepository.countByTenantIdAndTier("tenant-alpha", UserTier.CONTRIBUTOR);
        assertThat(adminCount).isEqualTo(1);
        assertThat(contributorCount).isEqualTo(1);
    }

    @Test
    @DisplayName("Supersede flow: new file replaces old, cascade deletes old hierarchy")
    void supersedeFlow_shouldCascadeCorrectly() {
        // Arrange -- import first license file with full hierarchy
        LicenseFileEntity oldFile = licenseFileRepository.saveAndFlush(createLicenseFile("LIC-OLD-001", LicenseImportStatus.ACTIVE));
        ApplicationLicenseEntity oldAppLicense = applicationLicenseRepository.saveAndFlush(createAppLicense(oldFile));
        TenantLicenseEntity oldTenantLicense = tenantLicenseRepository.saveAndFlush(
                createTenantLicense(oldAppLicense, "tenant-supersede"));
        createAllSeatAllocations(oldTenantLicense);
        userLicenseAssignmentRepository.saveAndFlush(UserLicenseAssignmentEntity.builder()
                .tenantLicense(oldTenantLicense).userId(UUID.randomUUID()).tenantId("tenant-supersede")
                .tier(UserTier.VIEWER).assignedAt(Instant.now()).assignedBy(UUID.randomUUID())
                .build());
        entityManager.flush();
        entityManager.clear();

        // Verify initial state
        assertThat(tierSeatAllocationRepository.count()).isEqualTo(4);
        assertThat(userLicenseAssignmentRepository.count()).isEqualTo(1);

        // Act -- supersede: mark old as SUPERSEDED, delete old hierarchy, import new
        LicenseFileEntity oldFileReloaded = licenseFileRepository.findByLicenseId("LIC-OLD-001").orElseThrow();
        oldFileReloaded.setImportStatus(LicenseImportStatus.SUPERSEDED);
        // Remove the child app license to cascade delete the full hierarchy
        oldFileReloaded.setApplicationLicense(null);
        licenseFileRepository.saveAndFlush(oldFileReloaded);
        entityManager.flush();
        entityManager.clear();

        // Import new license file
        LicenseFileEntity newFile = licenseFileRepository.saveAndFlush(createLicenseFile("LIC-NEW-001", LicenseImportStatus.ACTIVE));
        ApplicationLicenseEntity newAppLicense = applicationLicenseRepository.saveAndFlush(createAppLicense(newFile));
        TenantLicenseEntity newTenantLicense = tenantLicenseRepository.saveAndFlush(
                createTenantLicense(newAppLicense, "tenant-supersede"));
        createAllSeatAllocations(newTenantLicense);
        entityManager.clear();

        // Assert -- old hierarchy should be gone, new one active
        List<LicenseFileEntity> activeFiles = licenseFileRepository.findByImportStatus(LicenseImportStatus.ACTIVE);
        assertThat(activeFiles).hasSize(1);
        assertThat(activeFiles.get(0).getLicenseId()).isEqualTo("LIC-NEW-001");

        List<LicenseFileEntity> superseded = licenseFileRepository.findByImportStatus(LicenseImportStatus.SUPERSEDED);
        assertThat(superseded).hasSize(1);
        assertThat(superseded.get(0).getLicenseId()).isEqualTo("LIC-OLD-001");

        // New hierarchy should be intact
        assertThat(applicationLicenseRepository.findByLicenseFileId(newFile.getId())).isPresent();
        assertThat(tenantLicenseRepository.findByTenantId("tenant-supersede")).hasSize(1);
        assertThat(tierSeatAllocationRepository.findByTenantLicenseId(newTenantLicense.getId())).hasSize(4);
    }

    @Test
    @DisplayName("Revocation check: revoked license ID should be detected")
    void revocationCheck_shouldBlockRevokedLicense() {
        // Arrange -- import a revocation entry
        revocationEntryRepository.saveAndFlush(RevocationEntryEntity.builder()
                .revokedLicenseId("LIC-COMPROMISED-001")
                .revocationReason("Key material leaked")
                .revokedAt(Instant.parse("2026-02-20T08:00:00Z"))
                .importedAt(Instant.now())
                .build());

        // Act -- check if a license is revoked
        boolean isRevoked = revocationEntryRepository.existsByRevokedLicenseId("LIC-COMPROMISED-001");
        boolean isNotRevoked = revocationEntryRepository.existsByRevokedLicenseId("LIC-VALID-001");

        // Assert
        assertThat(isRevoked).isTrue();
        assertThat(isNotRevoked).isFalse();
    }
}
