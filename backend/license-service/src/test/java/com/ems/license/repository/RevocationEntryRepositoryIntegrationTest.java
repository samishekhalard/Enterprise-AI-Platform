package com.ems.license.repository;

import com.ems.license.entity.RevocationEntryEntity;
import jakarta.persistence.EntityManager;
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

import java.lang.reflect.Field;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Integration tests for {@link RevocationEntryRepository} using Testcontainers PostgreSQL.
 * Revocation entries are immutable (INSERT only, no @Version, no updatedAt).
 */
@DataJpaTest
@Testcontainers
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
@DisplayName("RevocationEntryRepository Integration Tests")
class RevocationEntryRepositoryIntegrationTest {

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
    private RevocationEntryRepository revocationEntryRepository;

    @Autowired
    private EntityManager entityManager;

    private RevocationEntryEntity buildRevocationEntry(String revokedLicenseId) {
        return RevocationEntryEntity.builder()
                .revokedLicenseId(revokedLicenseId)
                .revocationReason("License key compromised")
                .revokedAt(Instant.parse("2026-02-15T12:00:00Z"))
                .importedAt(Instant.now())
                .build();
    }

    // ---- Tests ----

    @Test
    @DisplayName("Save and existsByRevokedLicenseId should return true")
    void save_andExistsByRevokedLicenseId_shouldReturnTrue() {
        // Arrange
        revocationEntryRepository.saveAndFlush(buildRevocationEntry("LIC-REVOKED-001"));

        // Act
        boolean exists = revocationEntryRepository.existsByRevokedLicenseId("LIC-REVOKED-001");

        // Assert
        assertThat(exists).isTrue();
    }

    @Test
    @DisplayName("existsByRevokedLicenseId when not revoked should return false")
    void existsByRevokedLicenseId_whenNotRevoked_shouldReturnFalse() {
        // Act
        boolean exists = revocationEntryRepository.existsByRevokedLicenseId("LIC-NEVER-REVOKED");

        // Assert
        assertThat(exists).isFalse();
    }

    @Test
    @DisplayName("Duplicate revoked_license_id should violate unique constraint")
    void save_duplicateRevokedLicenseId_shouldViolateUniqueConstraint() {
        // Arrange
        revocationEntryRepository.saveAndFlush(buildRevocationEntry("LIC-DUP-001"));

        RevocationEntryEntity duplicate = buildRevocationEntry("LIC-DUP-001");

        // Act & Assert
        assertThatThrownBy(() -> {
            revocationEntryRepository.saveAndFlush(duplicate);
        }).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("Multiple entries with different license IDs should coexist")
    void save_multipleEntries_shouldCoexist() {
        // Arrange & Act
        revocationEntryRepository.saveAndFlush(buildRevocationEntry("LIC-REV-A"));
        revocationEntryRepository.saveAndFlush(buildRevocationEntry("LIC-REV-B"));
        revocationEntryRepository.saveAndFlush(buildRevocationEntry("LIC-REV-C"));

        // Assert
        assertThat(revocationEntryRepository.count()).isEqualTo(3);
        assertThat(revocationEntryRepository.existsByRevokedLicenseId("LIC-REV-A")).isTrue();
        assertThat(revocationEntryRepository.existsByRevokedLicenseId("LIC-REV-B")).isTrue();
        assertThat(revocationEntryRepository.existsByRevokedLicenseId("LIC-REV-C")).isTrue();
    }

    @Test
    @DisplayName("Entity should be immutable: no @Version field, no updatedAt field")
    void entity_shouldBeImmutable_noVersionNoUpdatedAt() {
        // Assert -- verify that RevocationEntryEntity does NOT have version or updatedAt fields
        Field[] fields = RevocationEntryEntity.class.getDeclaredFields();

        boolean hasVersion = false;
        boolean hasUpdatedAt = false;

        for (Field field : fields) {
            if (field.getName().equals("version")) hasVersion = true;
            if (field.getName().equals("updatedAt")) hasUpdatedAt = true;
        }

        assertThat(hasVersion)
                .as("RevocationEntryEntity should NOT have a 'version' field (immutable entity)")
                .isFalse();
        assertThat(hasUpdatedAt)
                .as("RevocationEntryEntity should NOT have an 'updatedAt' field (immutable entity)")
                .isFalse();
    }
}
