package com.ems.tenant.repository;

import com.ems.common.enums.TenantStatus;
import com.ems.common.enums.TenantTier;
import com.ems.common.enums.TenantType;
import com.ems.tenant.entity.TenantEntity;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:postgresql://localhost:5432/master_db",
    "spring.datasource.username=postgres",
    "spring.datasource.password=postgres",
    "spring.jpa.hibernate.ddl-auto=create-drop"
})
class TenantRepositoryTest {

    @Autowired
    private TenantRepository tenantRepository;

    private TenantEntity testTenant;

    @BeforeEach
    void setUp() {
        tenantRepository.deleteAll();

        testTenant = TenantEntity.builder()
                .id("tenant-test-001")
                .fullName("Test Corporation")
                .shortName("TestCorp")
                .slug("test-corp")
                .description("A test tenant for unit testing")
                .tenantType(TenantType.REGULAR)
                .tier(TenantTier.PROFESSIONAL)
                .status(TenantStatus.ACTIVE)
                .keycloakRealm("realm-test-corp")
                .createdBy("test-user")
                .build();
    }

    @Test
    @DisplayName("Should save and retrieve tenant by ID")
    void shouldSaveAndRetrieveTenant() {
        // Given
        TenantEntity saved = tenantRepository.save(testTenant);

        // When
        Optional<TenantEntity> found = tenantRepository.findById(saved.getId());

        // Then
        assertThat(found).isPresent();
        assertThat(found.get().getFullName()).isEqualTo("Test Corporation");
        assertThat(found.get().getSlug()).isEqualTo("test-corp");
        assertThat(found.get().getUuid()).isNotNull();
    }

    @Test
    @DisplayName("Should find tenant by slug")
    void shouldFindTenantBySlug() {
        // Given
        tenantRepository.save(testTenant);

        // When
        Optional<TenantEntity> found = tenantRepository.findBySlug("test-corp");

        // Then
        assertThat(found).isPresent();
        assertThat(found.get().getFullName()).isEqualTo("Test Corporation");
    }

    @Test
    @DisplayName("Should find tenants by status")
    void shouldFindTenantsByStatus() {
        // Given
        tenantRepository.save(testTenant);

        TenantEntity lockedTenant = TenantEntity.builder()
                .id("tenant-locked-001")
                .fullName("Locked Corp")
                .shortName("Locked")
                .slug("locked-corp")
                .tenantType(TenantType.REGULAR)
                .tier(TenantTier.STANDARD)
                .status(TenantStatus.LOCKED)
                .build();
        tenantRepository.save(lockedTenant);

        // When
        Page<TenantEntity> activeTenants = tenantRepository.findByStatus(
                TenantStatus.ACTIVE, PageRequest.of(0, 10));

        // Then
        assertThat(activeTenants.getContent()).hasSize(1);
        assertThat(activeTenants.getContent().get(0).getSlug()).isEqualTo("test-corp");
    }

    @Test
    @DisplayName("Should find tenants by type")
    void shouldFindTenantsByType() {
        // Given
        tenantRepository.save(testTenant);

        TenantEntity masterTenant = TenantEntity.builder()
                .id("tenant-master-001")
                .fullName("Master Corp")
                .shortName("Master")
                .slug("master-corp")
                .tenantType(TenantType.MASTER)
                .tier(TenantTier.ENTERPRISE)
                .status(TenantStatus.ACTIVE)
                .build();
        tenantRepository.save(masterTenant);

        // When
        Page<TenantEntity> regularTenants = tenantRepository.findByTenantType(
                TenantType.REGULAR, PageRequest.of(0, 10));

        // Then
        assertThat(regularTenants.getContent()).hasSize(1);
        assertThat(regularTenants.getContent().get(0).getTenantType()).isEqualTo(TenantType.REGULAR);
    }

    @Test
    @DisplayName("Should search tenants by name")
    void shouldSearchTenantsByName() {
        // Given
        tenantRepository.save(testTenant);

        // When
        Page<TenantEntity> results = tenantRepository.searchTenants(
                "Test", PageRequest.of(0, 10));

        // Then
        assertThat(results.getContent()).hasSize(1);
        assertThat(results.getContent().get(0).getFullName()).contains("Test");
    }

    @Test
    @DisplayName("Should check slug availability")
    void shouldCheckSlugAvailability() {
        // Given
        tenantRepository.save(testTenant);

        // When & Then
        assertThat(tenantRepository.existsBySlug("test-corp")).isTrue();
        assertThat(tenantRepository.existsBySlug("non-existent")).isFalse();
    }

    @Test
    @DisplayName("Should count tenants by status")
    void shouldCountTenantsByStatus() {
        // Given
        tenantRepository.save(testTenant);

        TenantEntity anotherActive = TenantEntity.builder()
                .id("tenant-active-002")
                .fullName("Another Active Corp")
                .shortName("AAC")
                .slug("another-active")
                .tenantType(TenantType.REGULAR)
                .tier(TenantTier.STANDARD)
                .status(TenantStatus.ACTIVE)
                .build();
        tenantRepository.save(anotherActive);

        // When
        long activeCount = tenantRepository.countByStatus(TenantStatus.ACTIVE);

        // Then
        assertThat(activeCount).isEqualTo(2);
    }
}
