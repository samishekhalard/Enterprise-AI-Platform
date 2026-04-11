package com.ems.license.repository;

import com.ems.license.entity.ApplicationLicenseEntity;
import com.ems.license.entity.LicenseFileEntity;
import com.ems.license.entity.LicenseImportStatus;
import com.ems.license.entity.TenantLicenseEntity;
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
 * Integration tests for {@link TenantLicenseRepository} using Testcontainers PostgreSQL.
 */
@DataJpaTest
@Testcontainers
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
@DisplayName("TenantLicenseRepository Integration Tests")
class TenantLicenseRepositoryIntegrationTest {

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
    private TenantLicenseRepository tenantLicenseRepository;

    @Autowired
    private ApplicationLicenseRepository applicationLicenseRepository;

    @Autowired
    private LicenseFileRepository licenseFileRepository;

    @Autowired
    private EntityManager entityManager;

    private LicenseFileEntity savedFile;
    private ApplicationLicenseEntity savedAppLicense;

    @BeforeEach
    void setUp() {
        savedFile = licenseFileRepository.saveAndFlush(LicenseFileEntity.builder()
                .licenseId("LIC-TL-" + UUID.randomUUID().toString().substring(0, 8))
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

        savedAppLicense = applicationLicenseRepository.saveAndFlush(ApplicationLicenseEntity.builder()
                .licenseFile(savedFile)
                .product("EMSIST")
                .versionMin("1.0.0")
                .versionMax("2.99.99")
                .maxTenants(10)
                .expiresAt(Instant.parse("2027-12-31T23:59:59Z"))
                .features(Arrays.asList("basic_workflows", "advanced_reports"))
                .gracePeriodDays(30)
                .degradedFeatures(List.of())
                .build());
    }

    private TenantLicenseEntity buildTenantLicense(String tenantId) {
        return TenantLicenseEntity.builder()
                .applicationLicense(savedAppLicense)
                .tenantId(tenantId)
                .displayName("Tenant " + tenantId)
                .expiresAt(Instant.parse("2027-06-30T23:59:59Z"))
                .features(Arrays.asList("basic_workflows", "advanced_reports"))
                .build();
    }

    // ---- Tests ----

    @Test
    @DisplayName("Save and findByTenantId should return matching records")
    void save_andFindByTenantId_shouldWork() {
        // Arrange
        TenantLicenseEntity tl = buildTenantLicense("tenant-alpha");
        tenantLicenseRepository.saveAndFlush(tl);

        // Act
        List<TenantLicenseEntity> found = tenantLicenseRepository.findByTenantId("tenant-alpha");

        // Assert
        assertThat(found).hasSize(1);
        assertThat(found.get(0).getDisplayName()).isEqualTo("Tenant tenant-alpha");
        assertThat(found.get(0).getId()).isNotNull();
    }

    @Test
    @DisplayName("Duplicate (app_license_id + tenant_id) should violate composite unique constraint")
    void save_duplicateAppLicenseAndTenant_shouldViolateCompositeUnique() {
        // Arrange
        TenantLicenseEntity tl1 = buildTenantLicense("tenant-dup");
        tenantLicenseRepository.saveAndFlush(tl1);

        TenantLicenseEntity tl2 = buildTenantLicense("tenant-dup");

        // Act & Assert
        assertThatThrownBy(() -> {
            tenantLicenseRepository.saveAndFlush(tl2);
        }).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("JSONB features should round-trip as List<String>")
    void save_withJsonbFeatures_shouldRoundTrip() {
        // Arrange
        List<String> features = Arrays.asList("basic_workflows", "ai_persona", "audit_logs");
        TenantLicenseEntity tl = buildTenantLicense("tenant-json");
        tl.setFeatures(features);

        // Act
        tenantLicenseRepository.saveAndFlush(tl);
        entityManager.clear();
        TenantLicenseEntity loaded = tenantLicenseRepository.findById(tl.getId()).orElseThrow();

        // Assert
        assertThat(loaded.getFeatures()).containsExactly("basic_workflows", "ai_persona", "audit_logs");
    }

    @Test
    @DisplayName("findByApplicationLicenseId should return all tenant licenses for an app license")
    void findByApplicationLicenseId_shouldReturnAll() {
        // Arrange
        tenantLicenseRepository.saveAndFlush(buildTenantLicense("tenant-a"));
        tenantLicenseRepository.saveAndFlush(buildTenantLicense("tenant-b"));
        tenantLicenseRepository.saveAndFlush(buildTenantLicense("tenant-c"));

        // Act
        List<TenantLicenseEntity> found = tenantLicenseRepository.findByApplicationLicenseId(savedAppLicense.getId());

        // Assert
        assertThat(found).hasSize(3);
    }

    @Test
    @DisplayName("Deleting license_file should cascade through app_license to tenant_licenses")
    void deleteLicenseFile_shouldCascadeToTenantLicenses() {
        // Arrange
        TenantLicenseEntity tl = buildTenantLicense("tenant-cascade");
        tenantLicenseRepository.saveAndFlush(tl);
        UUID tlId = tl.getId();
        entityManager.clear();

        // Act -- delete at the root: license file
        licenseFileRepository.deleteById(savedFile.getId());
        licenseFileRepository.flush();
        entityManager.clear();

        // Assert -- tenant license should be gone
        Optional<TenantLicenseEntity> found = tenantLicenseRepository.findById(tlId);
        assertThat(found).isEmpty();
    }

    @Test
    @DisplayName("findByTenantIdWithAllocations should eager-load seat allocations")
    void findByTenantIdWithAllocations_shouldEagerLoadSeatAllocations() {
        // Arrange -- tenant license without allocations initially
        TenantLicenseEntity tl = buildTenantLicense("tenant-eager");
        tenantLicenseRepository.saveAndFlush(tl);
        entityManager.clear();

        // Act
        List<TenantLicenseEntity> results = tenantLicenseRepository.findByTenantIdWithAllocations("tenant-eager");

        // Assert
        assertThat(results).hasSize(1);
        // seatAllocations collection should be initialized (even if empty)
        assertThat(results.get(0).getSeatAllocations()).isNotNull();
    }
}
