package com.ems.license.repository;

import com.ems.license.entity.LicenseFileEntity;
import com.ems.license.entity.LicenseImportStatus;
import jakarta.persistence.EntityManager;
import jakarta.persistence.OptimisticLockException;
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
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Integration tests for {@link LicenseFileRepository} using Testcontainers PostgreSQL.
 * Flyway runs V1-V4 migrations so real CHECK, UNIQUE, and partial index constraints are tested.
 */
@DataJpaTest
@Testcontainers
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
@DisplayName("LicenseFileRepository Integration Tests")
class LicenseFileRepositoryIntegrationTest {

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
    private EntityManager entityManager;

    // ---- Helper ----

    private LicenseFileEntity buildLicenseFile(String licenseId, LicenseImportStatus status) {
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

    // ---- Tests ----

    @Test
    @DisplayName("Save and findByImportStatus should return ACTIVE file")
    void save_andFindByImportStatus_shouldReturnActiveFile() {
        // Arrange
        LicenseFileEntity file = buildLicenseFile("LIC-2026-0001", LicenseImportStatus.ACTIVE);

        // Act
        licenseFileRepository.saveAndFlush(file);
        List<LicenseFileEntity> activeFiles = licenseFileRepository.findByImportStatus(LicenseImportStatus.ACTIVE);

        // Assert
        assertThat(activeFiles).hasSize(1);
        assertThat(activeFiles.get(0).getLicenseId()).isEqualTo("LIC-2026-0001");
        assertThat(activeFiles.get(0).getId()).isNotNull();
        assertThat(activeFiles.get(0).getCreatedAt()).isNotNull();
        assertThat(activeFiles.get(0).getVersion()).isEqualTo(0L);
    }

    @Test
    @DisplayName("Two ACTIVE files should violate partial unique index (idx_license_files_active_singleton)")
    void save_twoActiveFiles_shouldViolatePartialUniqueIndex() {
        // Arrange
        LicenseFileEntity file1 = buildLicenseFile("LIC-2026-0001", LicenseImportStatus.ACTIVE);
        licenseFileRepository.saveAndFlush(file1);

        LicenseFileEntity file2 = buildLicenseFile("LIC-2026-0002", LicenseImportStatus.ACTIVE);

        // Act & Assert
        assertThatThrownBy(() -> {
            licenseFileRepository.saveAndFlush(file2);
        }).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("Supersede flow: mark old SUPERSEDED then save new ACTIVE should work")
    void supersedeFlow_oldSupersededNewActive_shouldWork() {
        // Arrange: save first ACTIVE file
        LicenseFileEntity file1 = buildLicenseFile("LIC-2026-0001", LicenseImportStatus.ACTIVE);
        licenseFileRepository.saveAndFlush(file1);

        // Act: supersede old, save new
        file1.setImportStatus(LicenseImportStatus.SUPERSEDED);
        licenseFileRepository.saveAndFlush(file1);

        LicenseFileEntity file2 = buildLicenseFile("LIC-2026-0002", LicenseImportStatus.ACTIVE);
        licenseFileRepository.saveAndFlush(file2);

        // Assert
        List<LicenseFileEntity> active = licenseFileRepository.findByImportStatus(LicenseImportStatus.ACTIVE);
        List<LicenseFileEntity> superseded = licenseFileRepository.findByImportStatus(LicenseImportStatus.SUPERSEDED);

        assertThat(active).hasSize(1);
        assertThat(active.get(0).getLicenseId()).isEqualTo("LIC-2026-0002");
        assertThat(superseded).hasSize(1);
        assertThat(superseded.get(0).getLicenseId()).isEqualTo("LIC-2026-0001");
    }

    @Test
    @DisplayName("findByLicenseId should return exact match")
    void findByLicenseId_shouldReturnExactMatch() {
        // Arrange
        LicenseFileEntity file = buildLicenseFile("LIC-2026-UNIQUE", LicenseImportStatus.ACTIVE);
        licenseFileRepository.saveAndFlush(file);

        // Act
        Optional<LicenseFileEntity> found = licenseFileRepository.findByLicenseId("LIC-2026-UNIQUE");
        Optional<LicenseFileEntity> notFound = licenseFileRepository.findByLicenseId("LIC-NONEXISTENT");

        // Assert
        assertThat(found).isPresent();
        assertThat(found.get().getIssuer()).isEqualTo("EMS Vendor GmbH");
        assertThat(notFound).isEmpty();
    }

    @Test
    @DisplayName("3-char country code should be rejected by chk_license_file_customer_country")
    void save_withThreeCharCountryCode_shouldBeRejectedByCheckConstraint() {
        // Arrange -- set a 3-character country code which violates CHECK (length = 2)
        LicenseFileEntity file = buildLicenseFile("LIC-2026-CC3", LicenseImportStatus.ACTIVE);
        file.setCustomerCountry("USA");

        // Act & Assert
        assertThatThrownBy(() -> {
            licenseFileRepository.saveAndFlush(file);
        }).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("BYTEA columns should persist and retrieve raw bytes correctly")
    void save_withByteaContent_shouldPersistAndRetrieve() {
        // Arrange -- use binary data that is NOT valid UTF-8
        byte[] rawContent = new byte[256];
        byte[] signature = new byte[64];
        for (int i = 0; i < 256; i++) rawContent[i] = (byte) i;
        for (int i = 0; i < 64; i++) signature[i] = (byte) (255 - i);

        LicenseFileEntity file = buildLicenseFile("LIC-2026-BYTEA", LicenseImportStatus.ACTIVE);
        file.setRawContent(rawContent);
        file.setSignature(signature);

        // Act
        licenseFileRepository.saveAndFlush(file);
        entityManager.clear(); // Force reload from DB
        LicenseFileEntity loaded = licenseFileRepository.findByLicenseId("LIC-2026-BYTEA").orElseThrow();

        // Assert
        assertThat(loaded.getRawContent()).isEqualTo(rawContent);
        assertThat(loaded.getSignature()).isEqualTo(signature);
    }

    @Test
    @DisplayName("Large TEXT payload_json should persist and retrieve correctly")
    void save_withLargePayloadJson_shouldPersist() {
        // Arrange -- build a large JSON payload (~100KB)
        StringBuilder sb = new StringBuilder("{\"data\":\"");
        for (int i = 0; i < 100_000; i++) sb.append('X');
        sb.append("\"}");
        String largePayload = sb.toString();

        LicenseFileEntity file = buildLicenseFile("LIC-2026-LARGE", LicenseImportStatus.ACTIVE);
        file.setPayloadJson(largePayload);

        // Act
        licenseFileRepository.saveAndFlush(file);
        entityManager.clear();
        LicenseFileEntity loaded = licenseFileRepository.findByLicenseId("LIC-2026-LARGE").orElseThrow();

        // Assert
        assertThat(loaded.getPayloadJson()).isEqualTo(largePayload);
        assertThat(loaded.getPayloadJson().length()).isGreaterThan(100_000);
    }

    @Test
    @DisplayName("Concurrent update on same record should throw OptimisticLockException")
    void concurrentUpdate_shouldThrowOptimisticLockException() {
        // Arrange
        LicenseFileEntity file = buildLicenseFile("LIC-2026-OPT", LicenseImportStatus.ACTIVE);
        licenseFileRepository.saveAndFlush(file);
        entityManager.clear();

        // Simulate two concurrent reads
        LicenseFileEntity copy1 = licenseFileRepository.findByLicenseId("LIC-2026-OPT").orElseThrow();
        entityManager.detach(copy1);

        LicenseFileEntity copy2 = licenseFileRepository.findByLicenseId("LIC-2026-OPT").orElseThrow();

        // First update succeeds
        copy2.setCustomerName("Updated Name");
        licenseFileRepository.saveAndFlush(copy2);

        // Act & Assert -- second update with stale version should fail
        copy1.setCustomerName("Stale Update");
        assertThatThrownBy(() -> {
            entityManager.merge(copy1);
            entityManager.flush();
        }).isInstanceOf(OptimisticLockException.class);
    }
}
