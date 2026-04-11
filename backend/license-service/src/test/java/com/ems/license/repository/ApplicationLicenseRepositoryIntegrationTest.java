package com.ems.license.repository;

import com.ems.license.entity.ApplicationLicenseEntity;
import com.ems.license.entity.LicenseFileEntity;
import com.ems.license.entity.LicenseImportStatus;
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
 * Integration tests for {@link ApplicationLicenseRepository} using Testcontainers PostgreSQL.
 * Tests FK relationships, JSONB converter, CHECK constraints, unique indexes, and cascade deletes.
 */
@DataJpaTest
@Testcontainers
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
@DisplayName("ApplicationLicenseRepository Integration Tests")
class ApplicationLicenseRepositoryIntegrationTest {

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
    private ApplicationLicenseRepository applicationLicenseRepository;

    @Autowired
    private LicenseFileRepository licenseFileRepository;

    @Autowired
    private EntityManager entityManager;

    private LicenseFileEntity savedFile;

    @BeforeEach
    void setUp() {
        savedFile = createAndSaveLicenseFile("LIC-APPTEST-" + UUID.randomUUID().toString().substring(0, 8));
    }

    // ---- Helpers ----

    private LicenseFileEntity createAndSaveLicenseFile(String licenseId) {
        LicenseFileEntity file = LicenseFileEntity.builder()
                .licenseId(licenseId)
                .formatVersion("1.0")
                .kid("key-001")
                .issuer("EMS Vendor GmbH")
                .issuedAt(Instant.parse("2026-01-15T10:00:00Z"))
                .customerId("CUST-001")
                .customerName("Acme Corp")
                .customerCountry("DE")
                .rawContent("raw-bytes".getBytes(StandardCharsets.UTF_8))
                .payloadJson("{\"product\":\"EMSIST\"}")
                .signature("sig-bytes".getBytes(StandardCharsets.UTF_8))
                .importStatus(LicenseImportStatus.SUPERSEDED)
                .importedBy(UUID.randomUUID())
                .build();
        return licenseFileRepository.saveAndFlush(file);
    }

    private ApplicationLicenseEntity buildAppLicense(LicenseFileEntity file) {
        return ApplicationLicenseEntity.builder()
                .licenseFile(file)
                .product("EMSIST")
                .versionMin("1.0.0")
                .versionMax("2.99.99")
                .maxTenants(10)
                .expiresAt(Instant.parse("2027-12-31T23:59:59Z"))
                .features(Arrays.asList("basic_workflows", "advanced_reports"))
                .gracePeriodDays(30)
                .degradedFeatures(List.of("advanced_reports"))
                .build();
    }

    // ---- Tests ----

    @Test
    @DisplayName("Save with FK to license_file and findByLicenseFileId should work")
    void save_withFkToLicenseFile_shouldPersist() {
        // Arrange
        ApplicationLicenseEntity appLicense = buildAppLicense(savedFile);

        // Act
        applicationLicenseRepository.saveAndFlush(appLicense);
        Optional<ApplicationLicenseEntity> found = applicationLicenseRepository.findByLicenseFileId(savedFile.getId());

        // Assert
        assertThat(found).isPresent();
        assertThat(found.get().getProduct()).isEqualTo("EMSIST");
        assertThat(found.get().getMaxTenants()).isEqualTo(10);
        assertThat(found.get().getGracePeriodDays()).isEqualTo(30);
    }

    @Test
    @DisplayName("JSONB features should round-trip as List<String> via StringListJsonConverter")
    void save_withJsonbFeatures_shouldRoundTripList() {
        // Arrange
        List<String> features = Arrays.asList("basic_workflows", "advanced_reports", "ai_persona", "sso_integration");
        ApplicationLicenseEntity appLicense = buildAppLicense(savedFile);
        appLicense.setFeatures(features);
        appLicense.setDegradedFeatures(Arrays.asList("ai_persona", "sso_integration"));

        // Act
        applicationLicenseRepository.saveAndFlush(appLicense);
        entityManager.clear();
        ApplicationLicenseEntity loaded = applicationLicenseRepository.findById(appLicense.getId()).orElseThrow();

        // Assert
        assertThat(loaded.getFeatures()).containsExactly("basic_workflows", "advanced_reports", "ai_persona", "sso_integration");
        assertThat(loaded.getDegradedFeatures()).containsExactly("ai_persona", "sso_integration");
    }

    @Test
    @DisplayName("max_tenants = 0 should violate chk_app_license_max_tenants (must be > 0)")
    void save_withMaxTenantsZero_shouldViolateCheckConstraint() {
        // Arrange
        ApplicationLicenseEntity appLicense = buildAppLicense(savedFile);
        appLicense.setMaxTenants(0);

        // Act & Assert
        assertThatThrownBy(() -> {
            applicationLicenseRepository.saveAndFlush(appLicense);
        }).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("max_tenants = -1 should violate chk_app_license_max_tenants (must be > 0)")
    void save_withNegativeMaxTenants_shouldViolateCheckConstraint() {
        // Arrange
        ApplicationLicenseEntity appLicense = buildAppLicense(savedFile);
        appLicense.setMaxTenants(-1);

        // Act & Assert
        assertThatThrownBy(() -> {
            applicationLicenseRepository.saveAndFlush(appLicense);
        }).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("grace_period_days = -1 should violate chk_app_license_grace_period (must be >= 0)")
    void save_withNegativeGracePeriod_shouldViolateCheckConstraint() {
        // Arrange
        ApplicationLicenseEntity appLicense = buildAppLicense(savedFile);
        appLicense.setGracePeriodDays(-1);

        // Act & Assert
        assertThatThrownBy(() -> {
            applicationLicenseRepository.saveAndFlush(appLicense);
        }).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("Duplicate license_file_id should violate unique index (idx_application_licenses_license_file)")
    void save_duplicateLicenseFileId_shouldViolateUniqueIndex() {
        // Arrange
        ApplicationLicenseEntity first = buildAppLicense(savedFile);
        applicationLicenseRepository.saveAndFlush(first);
        entityManager.clear();

        // Create second app license pointing to same file
        ApplicationLicenseEntity duplicate = ApplicationLicenseEntity.builder()
                .licenseFile(savedFile)
                .product("EMSIST")
                .versionMin("1.0.0")
                .versionMax("2.99.99")
                .maxTenants(5)
                .expiresAt(Instant.parse("2028-12-31T23:59:59Z"))
                .features(List.of("basic_workflows"))
                .gracePeriodDays(15)
                .degradedFeatures(List.of())
                .build();

        // Act & Assert
        assertThatThrownBy(() -> {
            applicationLicenseRepository.saveAndFlush(duplicate);
        }).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("Deleting license_file should cascade delete to application_license")
    void deleteLicenseFile_shouldCascadeToApplicationLicense() {
        // Arrange
        ApplicationLicenseEntity appLicense = buildAppLicense(savedFile);
        applicationLicenseRepository.saveAndFlush(appLicense);
        UUID appLicenseId = appLicense.getId();
        entityManager.clear();

        // Act -- delete the parent license file
        licenseFileRepository.deleteById(savedFile.getId());
        licenseFileRepository.flush();
        entityManager.clear();

        // Assert -- application license should be cascade-deleted
        Optional<ApplicationLicenseEntity> found = applicationLicenseRepository.findById(appLicenseId);
        assertThat(found).isEmpty();
    }

    @Test
    @DisplayName("findByIdWithLicenseFile should eager-load the license file")
    void findByIdWithLicenseFile_shouldEagerLoad() {
        // Arrange
        ApplicationLicenseEntity appLicense = buildAppLicense(savedFile);
        applicationLicenseRepository.saveAndFlush(appLicense);
        entityManager.clear();

        // Act
        Optional<ApplicationLicenseEntity> found = applicationLicenseRepository.findByIdWithLicenseFile(appLicense.getId());

        // Assert
        assertThat(found).isPresent();
        assertThat(found.get().getLicenseFile()).isNotNull();
        assertThat(found.get().getLicenseFile().getLicenseId()).startsWith("LIC-APPTEST-");
    }
}
