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
 * Integration tests for {@link UserLicenseAssignmentRepository} using Testcontainers PostgreSQL.
 * Tests unique constraints, aggregate queries, CHECK constraints, and JPQL fetch queries.
 */
@DataJpaTest
@Testcontainers
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
@DisplayName("UserLicenseAssignmentRepository Integration Tests")
class UserLicenseAssignmentRepositoryIntegrationTest {

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
    private UserLicenseAssignmentRepository userLicenseAssignmentRepository;

    @Autowired
    private TenantLicenseRepository tenantLicenseRepository;

    @Autowired
    private ApplicationLicenseRepository applicationLicenseRepository;

    @Autowired
    private LicenseFileRepository licenseFileRepository;

    @Autowired
    private EntityManager entityManager;

    private TenantLicenseEntity savedTenantLicense;
    private final String tenantId = "tenant-ula-test";

    @BeforeEach
    void setUp() {
        LicenseFileEntity file = licenseFileRepository.saveAndFlush(LicenseFileEntity.builder()
                .licenseId("LIC-ULA-" + UUID.randomUUID().toString().substring(0, 8))
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
                .tenantId(tenantId)
                .displayName("ULA Test Tenant")
                .expiresAt(Instant.parse("2027-06-30T23:59:59Z"))
                .features(Arrays.asList("basic_workflows"))
                .build());
    }

    private UserLicenseAssignmentEntity buildAssignment(UUID userId, UserTier tier) {
        return UserLicenseAssignmentEntity.builder()
                .tenantLicense(savedTenantLicense)
                .userId(userId)
                .tenantId(tenantId)
                .tier(tier)
                .assignedAt(Instant.now())
                .assignedBy(UUID.randomUUID())
                .build();
    }

    // ---- Tests ----

    @Test
    @DisplayName("Save and findByUserIdAndTenantId should return the assignment")
    void save_andFindByUserIdAndTenantId_shouldWork() {
        // Arrange
        UUID userId = UUID.randomUUID();
        UserLicenseAssignmentEntity assignment = buildAssignment(userId, UserTier.CONTRIBUTOR);

        // Act
        userLicenseAssignmentRepository.saveAndFlush(assignment);
        Optional<UserLicenseAssignmentEntity> found = userLicenseAssignmentRepository
                .findByUserIdAndTenantId(userId, tenantId);

        // Assert
        assertThat(found).isPresent();
        assertThat(found.get().getTier()).isEqualTo(UserTier.CONTRIBUTOR);
        assertThat(found.get().getUserId()).isEqualTo(userId);
    }

    @Test
    @DisplayName("Duplicate (user_id + tenant_id) should violate unique constraint")
    void save_duplicateUserAndTenant_shouldViolateUniqueConstraint() {
        // Arrange
        UUID userId = UUID.randomUUID();
        userLicenseAssignmentRepository.saveAndFlush(buildAssignment(userId, UserTier.CONTRIBUTOR));

        UserLicenseAssignmentEntity duplicate = buildAssignment(userId, UserTier.POWER_USER);

        // Act & Assert
        assertThatThrownBy(() -> {
            userLicenseAssignmentRepository.saveAndFlush(duplicate);
        }).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("countByTenantIdAndTier should return correct aggregate count")
    void countByTenantIdAndTier_shouldReturnCorrectCount() {
        // Arrange -- 3 contributors, 1 viewer
        userLicenseAssignmentRepository.saveAndFlush(buildAssignment(UUID.randomUUID(), UserTier.CONTRIBUTOR));
        userLicenseAssignmentRepository.saveAndFlush(buildAssignment(UUID.randomUUID(), UserTier.CONTRIBUTOR));
        userLicenseAssignmentRepository.saveAndFlush(buildAssignment(UUID.randomUUID(), UserTier.CONTRIBUTOR));
        userLicenseAssignmentRepository.saveAndFlush(buildAssignment(UUID.randomUUID(), UserTier.VIEWER));

        // Act
        long contributorCount = userLicenseAssignmentRepository.countByTenantIdAndTier(tenantId, UserTier.CONTRIBUTOR);
        long viewerCount = userLicenseAssignmentRepository.countByTenantIdAndTier(tenantId, UserTier.VIEWER);
        long adminCount = userLicenseAssignmentRepository.countByTenantIdAndTier(tenantId, UserTier.TENANT_ADMIN);

        // Assert
        assertThat(contributorCount).isEqualTo(3);
        assertThat(viewerCount).isEqualTo(1);
        assertThat(adminCount).isEqualTo(0);
    }

    @Test
    @DisplayName("Invalid tier value should be rejected by chk_user_license_tier CHECK constraint")
    void save_withInvalidTier_shouldBeRejectedByCheckConstraint() {
        // Arrange -- use native SQL to bypass enum type safety
        UUID tenantLicenseId = savedTenantLicense.getId();

        // Act & Assert
        assertThatThrownBy(() -> {
            entityManager.createNativeQuery(
                    "INSERT INTO user_license_assignments (id, tenant_license_id, user_id, tenant_id, tier, assigned_at, assigned_by, version, created_at, updated_at) " +
                    "VALUES (:id, :tlId, :userId, :tenantId, 'SUPER_ADMIN', NOW(), :assignedBy, 0, NOW(), NOW())")
                    .setParameter("id", UUID.randomUUID())
                    .setParameter("tlId", tenantLicenseId)
                    .setParameter("userId", UUID.randomUUID())
                    .setParameter("tenantId", tenantId)
                    .setParameter("assignedBy", UUID.randomUUID())
                    .executeUpdate();
            entityManager.flush();
        }).isInstanceOf(Exception.class);
    }

    @Test
    @DisplayName("Reassignment flow: delete old + insert new in same tenant should work")
    void reassignmentFlow_deleteOldInsertNew_shouldWork() {
        // Arrange
        UUID userId = UUID.randomUUID();
        UserLicenseAssignmentEntity oldAssignment = buildAssignment(userId, UserTier.VIEWER);
        userLicenseAssignmentRepository.saveAndFlush(oldAssignment);

        // Act -- delete old assignment
        userLicenseAssignmentRepository.delete(oldAssignment);
        userLicenseAssignmentRepository.flush();

        // Insert new assignment with different tier
        UserLicenseAssignmentEntity newAssignment = buildAssignment(userId, UserTier.POWER_USER);
        userLicenseAssignmentRepository.saveAndFlush(newAssignment);

        // Assert
        Optional<UserLicenseAssignmentEntity> found = userLicenseAssignmentRepository
                .findByUserIdAndTenantId(userId, tenantId);
        assertThat(found).isPresent();
        assertThat(found.get().getTier()).isEqualTo(UserTier.POWER_USER);
    }

    @Test
    @DisplayName("findByTenantId should return all assignments for a tenant")
    void findByTenantId_shouldReturnAllAssignmentsForTenant() {
        // Arrange
        userLicenseAssignmentRepository.saveAndFlush(buildAssignment(UUID.randomUUID(), UserTier.TENANT_ADMIN));
        userLicenseAssignmentRepository.saveAndFlush(buildAssignment(UUID.randomUUID(), UserTier.POWER_USER));
        userLicenseAssignmentRepository.saveAndFlush(buildAssignment(UUID.randomUUID(), UserTier.VIEWER));

        // Act
        List<UserLicenseAssignmentEntity> found = userLicenseAssignmentRepository.findByTenantId(tenantId);

        // Assert
        assertThat(found).hasSize(3);
    }

    @Test
    @DisplayName("findByUserIdAndTenantIdWithLicense should eager-load tenant license")
    void findByUserIdAndTenantIdWithLicense_shouldEagerLoadTenantLicense() {
        // Arrange
        UUID userId = UUID.randomUUID();
        userLicenseAssignmentRepository.saveAndFlush(buildAssignment(userId, UserTier.CONTRIBUTOR));
        entityManager.clear();

        // Act
        Optional<UserLicenseAssignmentEntity> found = userLicenseAssignmentRepository
                .findByUserIdAndTenantIdWithLicense(userId, tenantId);

        // Assert
        assertThat(found).isPresent();
        assertThat(found.get().getTenantLicense()).isNotNull();
        assertThat(found.get().getTenantLicense().getDisplayName()).isEqualTo("ULA Test Tenant");
    }
}
