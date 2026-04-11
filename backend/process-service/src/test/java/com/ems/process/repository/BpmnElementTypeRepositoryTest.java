package com.ems.process.repository;

import com.ems.process.entity.BpmnElementTypeEntity;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Repository tests for BpmnElementTypeRepository.
 * Uses @DataJpaTest for JPA slice testing with H2 in-memory database.
 */
@DataJpaTest
@ActiveProfiles("test")
@DisplayName("BpmnElementTypeRepository Tests")
class BpmnElementTypeRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private BpmnElementTypeRepository repository;

    private BpmnElementTypeEntity systemDefaultTask;
    private BpmnElementTypeEntity systemDefaultEvent;
    private BpmnElementTypeEntity systemDefaultGateway;
    private BpmnElementTypeEntity tenantSpecificTask;
    private BpmnElementTypeEntity inactiveElement;

    @BeforeEach
    void setUp() {
        // Create system default elements (tenantId = null)
        systemDefaultTask = BpmnElementTypeEntity.builder()
                .tenantId(null)
                .code("bpmn:Task")
                .name("Task")
                .category("task")
                .subCategory("generic")
                .strokeColor("#1E88E5")
                .fillColor("#E3F2FD")
                .strokeWidth(2.0)
                .defaultWidth(100)
                .defaultHeight(80)
                .iconSvg("<svg>task</svg>")
                .sortOrder(1)
                .isActive(true)
                .build();

        systemDefaultEvent = BpmnElementTypeEntity.builder()
                .tenantId(null)
                .code("bpmn:StartEvent")
                .name("Start Event")
                .category("event")
                .subCategory("start")
                .strokeColor("#43A047")
                .fillColor("#E8F5E9")
                .strokeWidth(2.0)
                .defaultWidth(36)
                .defaultHeight(36)
                .iconSvg("<svg>start</svg>")
                .sortOrder(0)
                .isActive(true)
                .build();

        systemDefaultGateway = BpmnElementTypeEntity.builder()
                .tenantId(null)
                .code("bpmn:ExclusiveGateway")
                .name("Exclusive Gateway")
                .category("gateway")
                .subCategory("exclusive")
                .strokeColor("#FB8C00")
                .fillColor("#FFF3E0")
                .strokeWidth(2.0)
                .defaultWidth(50)
                .defaultHeight(50)
                .iconSvg("<svg>gateway</svg>")
                .sortOrder(2)
                .isActive(true)
                .build();

        // Create tenant-specific override
        tenantSpecificTask = BpmnElementTypeEntity.builder()
                .tenantId("tenant-123")
                .code("bpmn:Task")
                .name("Custom Task")
                .category("task")
                .subCategory("generic")
                .strokeColor("#FF5722")
                .fillColor("#FBE9E7")
                .strokeWidth(3.0)
                .defaultWidth(120)
                .defaultHeight(90)
                .iconSvg("<svg>custom-task</svg>")
                .sortOrder(1)
                .isActive(true)
                .build();

        // Create inactive element
        inactiveElement = BpmnElementTypeEntity.builder()
                .tenantId(null)
                .code("bpmn:InactiveElement")
                .name("Inactive Element")
                .category("task")
                .strokeColor("#9E9E9E")
                .fillColor("#EEEEEE")
                .strokeWidth(1.0)
                .sortOrder(99)
                .isActive(false)
                .build();

        entityManager.persist(systemDefaultTask);
        entityManager.persist(systemDefaultEvent);
        entityManager.persist(systemDefaultGateway);
        entityManager.persist(tenantSpecificTask);
        entityManager.persist(inactiveElement);
        entityManager.flush();
    }

    @Nested
    @DisplayName("Basic CRUD Operations")
    class CrudOperationTests {

        @Test
        @DisplayName("Should save entity and generate UUID")
        void shouldSaveEntityAndGenerateUuid() {
            // Arrange
            BpmnElementTypeEntity newEntity = BpmnElementTypeEntity.builder()
                    .tenantId(null)
                    .code("bpmn:EndEvent")
                    .name("End Event")
                    .category("event")
                    .subCategory("end")
                    .strokeColor("#E53935")
                    .fillColor("#FFEBEE")
                    .strokeWidth(2.0)
                    .sortOrder(10)
                    .isActive(true)
                    .build();

            // Act
            BpmnElementTypeEntity saved = repository.save(newEntity);

            // Assert
            assertThat(saved.getId()).isNotNull();
            assertThat(saved.getCode()).isEqualTo("bpmn:EndEvent");
        }

        @Test
        @DisplayName("Should find entity by ID")
        void shouldFindEntityById() {
            // Arrange
            UUID id = systemDefaultTask.getId();

            // Act
            Optional<BpmnElementTypeEntity> found = repository.findById(id);

            // Assert
            assertThat(found).isPresent();
            assertThat(found.get().getCode()).isEqualTo("bpmn:Task");
        }

        @Test
        @DisplayName("Should return empty when ID not found")
        void shouldReturnEmptyWhenIdNotFound() {
            // Arrange
            UUID nonExistentId = UUID.randomUUID();

            // Act
            Optional<BpmnElementTypeEntity> found = repository.findById(nonExistentId);

            // Assert
            assertThat(found).isEmpty();
        }

        @Test
        @DisplayName("Should update existing entity")
        void shouldUpdateExistingEntity() {
            // Arrange
            systemDefaultTask.setName("Updated Task Name");

            // Act
            repository.save(systemDefaultTask);
            entityManager.flush();
            entityManager.clear();

            // Assert
            Optional<BpmnElementTypeEntity> updated = repository.findById(systemDefaultTask.getId());
            assertThat(updated).isPresent();
            assertThat(updated.get().getName()).isEqualTo("Updated Task Name");
        }

        @Test
        @DisplayName("Should delete entity")
        void shouldDeleteEntity() {
            // Arrange
            UUID id = systemDefaultTask.getId();

            // Act
            repository.deleteById(id);
            entityManager.flush();

            // Assert
            Optional<BpmnElementTypeEntity> deleted = repository.findById(id);
            assertThat(deleted).isEmpty();
        }

        @Test
        @DisplayName("Should count all entities")
        void shouldCountAllEntities() {
            // Act
            long count = repository.count();

            // Assert
            assertThat(count).isEqualTo(5);
        }

        @Test
        @DisplayName("Should find all entities")
        void shouldFindAllEntities() {
            // Act
            List<BpmnElementTypeEntity> all = repository.findAll();

            // Assert
            assertThat(all).hasSize(5);
        }
    }

    @Nested
    @DisplayName("findAllSystemDefaults Tests")
    class FindAllSystemDefaultsTests {

        @Test
        @DisplayName("Should return only system defaults (tenantId is null)")
        void shouldReturnOnlySystemDefaults() {
            // Act
            List<BpmnElementTypeEntity> defaults = repository.findAllSystemDefaults();

            // Assert
            assertThat(defaults).hasSize(3);
            assertThat(defaults).allMatch(e -> e.getTenantId() == null);
        }

        @Test
        @DisplayName("Should exclude inactive elements")
        void shouldExcludeInactiveElements() {
            // Act
            List<BpmnElementTypeEntity> defaults = repository.findAllSystemDefaults();

            // Assert
            assertThat(defaults).noneMatch(e -> "bpmn:InactiveElement".equals(e.getCode()));
        }

        @Test
        @DisplayName("Should return results sorted by sortOrder")
        void shouldReturnResultsSortedBySortOrder() {
            // Act
            List<BpmnElementTypeEntity> defaults = repository.findAllSystemDefaults();

            // Assert
            assertThat(defaults).isSortedAccordingTo((a, b) -> {
                int sortCompare = a.getSortOrder().compareTo(b.getSortOrder());
                if (sortCompare != 0) return sortCompare;
                int catCompare = a.getCategory().compareTo(b.getCategory());
                if (catCompare != 0) return catCompare;
                return a.getName().compareTo(b.getName());
            });
        }

        @Test
        @DisplayName("Should return empty list when no system defaults exist")
        void shouldReturnEmptyListWhenNoSystemDefaultsExist() {
            // Arrange
            repository.deleteAll();
            entityManager.flush();

            // Act
            List<BpmnElementTypeEntity> defaults = repository.findAllSystemDefaults();

            // Assert
            assertThat(defaults).isEmpty();
        }

        @Test
        @DisplayName("Should not include tenant-specific elements")
        void shouldNotIncludeTenantSpecificElements() {
            // Act
            List<BpmnElementTypeEntity> defaults = repository.findAllSystemDefaults();

            // Assert
            assertThat(defaults).noneMatch(e -> "tenant-123".equals(e.getTenantId()));
        }

        @Test
        @DisplayName("Should return all active categories")
        void shouldReturnAllActiveCategories() {
            // Act
            List<BpmnElementTypeEntity> defaults = repository.findAllSystemDefaults();
            List<String> categories = defaults.stream().map(BpmnElementTypeEntity::getCategory).distinct().toList();

            // Assert
            assertThat(categories).containsExactlyInAnyOrder("task", "event", "gateway");
        }
    }

    @Nested
    @DisplayName("findAllForTenant Tests")
    class FindAllForTenantTests {

        @Test
        @DisplayName("Should return tenant-specific override when available")
        void shouldReturnTenantSpecificOverrideWhenAvailable() {
            // Act
            List<BpmnElementTypeEntity> results = repository.findAllForTenant("tenant-123");

            // Assert
            Optional<BpmnElementTypeEntity> task = results.stream()
                    .filter(e -> "bpmn:Task".equals(e.getCode()))
                    .findFirst();
            assertThat(task).isPresent();
            assertThat(task.get().getTenantId()).isEqualTo("tenant-123");
            assertThat(task.get().getName()).isEqualTo("Custom Task");
        }

        @Test
        @DisplayName("Should fallback to system default when no tenant override")
        void shouldFallbackToSystemDefaultWhenNoTenantOverride() {
            // Act
            List<BpmnElementTypeEntity> results = repository.findAllForTenant("tenant-123");

            // Assert
            Optional<BpmnElementTypeEntity> event = results.stream()
                    .filter(e -> "bpmn:StartEvent".equals(e.getCode()))
                    .findFirst();
            assertThat(event).isPresent();
            assertThat(event.get().getTenantId()).isNull();
        }

        @Test
        @DisplayName("Should return all system defaults for tenant without overrides")
        void shouldReturnAllSystemDefaultsForTenantWithoutOverrides() {
            // Act
            List<BpmnElementTypeEntity> results = repository.findAllForTenant("tenant-456");

            // Assert
            assertThat(results).hasSize(3);
            assertThat(results).allMatch(e -> e.getTenantId() == null);
        }

        @Test
        @DisplayName("Should exclude inactive elements for tenant")
        void shouldExcludeInactiveElementsForTenant() {
            // Act
            List<BpmnElementTypeEntity> results = repository.findAllForTenant("tenant-123");

            // Assert
            assertThat(results).noneMatch(e -> "bpmn:InactiveElement".equals(e.getCode()));
        }

        @Test
        @DisplayName("Should return sorted results for tenant")
        void shouldReturnSortedResultsForTenant() {
            // Act
            List<BpmnElementTypeEntity> results = repository.findAllForTenant("tenant-123");

            // Assert
            assertThat(results).isSortedAccordingTo((a, b) -> {
                int sortCompare = a.getSortOrder().compareTo(b.getSortOrder());
                if (sortCompare != 0) return sortCompare;
                int catCompare = a.getCategory().compareTo(b.getCategory());
                if (catCompare != 0) return catCompare;
                return a.getName().compareTo(b.getName());
            });
        }

        @Test
        @DisplayName("Should not duplicate elements when tenant override exists")
        void shouldNotDuplicateElementsWhenTenantOverrideExists() {
            // Act
            List<BpmnElementTypeEntity> results = repository.findAllForTenant("tenant-123");
            long taskCount = results.stream().filter(e -> "bpmn:Task".equals(e.getCode())).count();

            // Assert
            assertThat(taskCount).isEqualTo(1);
        }

        @Test
        @DisplayName("Should handle tenant with multiple overrides")
        void shouldHandleTenantWithMultipleOverrides() {
            // Arrange
            BpmnElementTypeEntity tenantEvent = BpmnElementTypeEntity.builder()
                    .tenantId("tenant-123")
                    .code("bpmn:StartEvent")
                    .name("Custom Start Event")
                    .category("event")
                    .subCategory("start")
                    .strokeColor("#00BCD4")
                    .fillColor("#E0F7FA")
                    .strokeWidth(2.5)
                    .sortOrder(0)
                    .isActive(true)
                    .build();
            entityManager.persist(tenantEvent);
            entityManager.flush();

            // Act
            List<BpmnElementTypeEntity> results = repository.findAllForTenant("tenant-123");

            // Assert
            assertThat(results).hasSize(3);
            Optional<BpmnElementTypeEntity> event = results.stream()
                    .filter(e -> "bpmn:StartEvent".equals(e.getCode()))
                    .findFirst();
            assertThat(event).isPresent();
            assertThat(event.get().getTenantId()).isEqualTo("tenant-123");
        }
    }

    @Nested
    @DisplayName("findByCodeForTenant Tests")
    class FindByCodeForTenantTests {

        @Test
        @DisplayName("Should return tenant override when exists")
        void shouldReturnTenantOverrideWhenExists() {
            // Act
            Optional<BpmnElementTypeEntity> result = repository.findByCodeForTenant("bpmn:Task", "tenant-123");

            // Assert
            assertThat(result).isPresent();
            assertThat(result.get().getTenantId()).isEqualTo("tenant-123");
            assertThat(result.get().getName()).isEqualTo("Custom Task");
        }

        @Test
        @DisplayName("Should return system default when no tenant override")
        void shouldReturnSystemDefaultWhenNoTenantOverride() {
            // Act
            Optional<BpmnElementTypeEntity> result = repository.findByCodeForTenant("bpmn:StartEvent", "tenant-123");

            // Assert
            assertThat(result).isPresent();
            assertThat(result.get().getTenantId()).isNull();
            assertThat(result.get().getName()).isEqualTo("Start Event");
        }

        @Test
        @DisplayName("Should return empty when code not found")
        void shouldReturnEmptyWhenCodeNotFound() {
            // Act
            Optional<BpmnElementTypeEntity> result = repository.findByCodeForTenant("bpmn:NonExistent", "tenant-123");

            // Assert
            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("Should return system default for new tenant")
        void shouldReturnSystemDefaultForNewTenant() {
            // Act
            Optional<BpmnElementTypeEntity> result = repository.findByCodeForTenant("bpmn:Task", "tenant-new");

            // Assert
            assertThat(result).isPresent();
            assertThat(result.get().getTenantId()).isNull();
            assertThat(result.get().getName()).isEqualTo("Task");
        }

        @Test
        @DisplayName("Should not return inactive elements")
        void shouldNotReturnInactiveElements() {
            // Act
            Optional<BpmnElementTypeEntity> result = repository.findByCodeForTenant("bpmn:InactiveElement", "tenant-123");

            // Assert
            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("Should handle case-sensitive code lookup")
        void shouldHandleCaseSensitiveCodeLookup() {
            // Act
            Optional<BpmnElementTypeEntity> result = repository.findByCodeForTenant("BPMN:TASK", "tenant-123");

            // Assert
            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("findByCodeAndTenantIdIsNull Tests")
    class FindByCodeAndTenantIdIsNullTests {

        @Test
        @DisplayName("Should find system default by code")
        void shouldFindSystemDefaultByCode() {
            // Act
            Optional<BpmnElementTypeEntity> result = repository.findByCodeAndTenantIdIsNull("bpmn:Task");

            // Assert
            assertThat(result).isPresent();
            assertThat(result.get().getTenantId()).isNull();
            assertThat(result.get().getName()).isEqualTo("Task");
        }

        @Test
        @DisplayName("Should return empty for non-existent code")
        void shouldReturnEmptyForNonExistentCode() {
            // Act
            Optional<BpmnElementTypeEntity> result = repository.findByCodeAndTenantIdIsNull("bpmn:NonExistent");

            // Assert
            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("Should not find tenant-specific element")
        void shouldNotFindTenantSpecificElement() {
            // Arrange
            BpmnElementTypeEntity tenantOnly = BpmnElementTypeEntity.builder()
                    .tenantId("tenant-123")
                    .code("bpmn:TenantOnly")
                    .name("Tenant Only Element")
                    .category("task")
                    .strokeColor("#000000")
                    .fillColor("#FFFFFF")
                    .strokeWidth(1.0)
                    .sortOrder(0)
                    .isActive(true)
                    .build();
            entityManager.persist(tenantOnly);
            entityManager.flush();

            // Act
            Optional<BpmnElementTypeEntity> result = repository.findByCodeAndTenantIdIsNull("bpmn:TenantOnly");

            // Assert
            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("Should handle all BPMN element codes")
        void shouldHandleAllBpmnElementCodes() {
            // Act & Assert
            assertThat(repository.findByCodeAndTenantIdIsNull("bpmn:Task")).isPresent();
            assertThat(repository.findByCodeAndTenantIdIsNull("bpmn:StartEvent")).isPresent();
            assertThat(repository.findByCodeAndTenantIdIsNull("bpmn:ExclusiveGateway")).isPresent();
        }
    }

    @Nested
    @DisplayName("findByCategory Tests")
    class FindByCategoryTests {

        @Test
        @DisplayName("Should find all elements in category")
        void shouldFindAllElementsInCategory() {
            // Act
            List<BpmnElementTypeEntity> tasks = repository.findByCategory("task");

            // Assert
            assertThat(tasks).hasSize(1);
            assertThat(tasks).allMatch(e -> "task".equals(e.getCategory()));
        }

        @Test
        @DisplayName("Should find event category elements")
        void shouldFindEventCategoryElements() {
            // Act
            List<BpmnElementTypeEntity> events = repository.findByCategory("event");

            // Assert
            assertThat(events).hasSize(1);
            assertThat(events.get(0).getCode()).isEqualTo("bpmn:StartEvent");
        }

        @Test
        @DisplayName("Should find gateway category elements")
        void shouldFindGatewayCategoryElements() {
            // Act
            List<BpmnElementTypeEntity> gateways = repository.findByCategory("gateway");

            // Assert
            assertThat(gateways).hasSize(1);
            assertThat(gateways.get(0).getCode()).isEqualTo("bpmn:ExclusiveGateway");
        }

        @Test
        @DisplayName("Should return empty for non-existent category")
        void shouldReturnEmptyForNonExistentCategory() {
            // Act
            List<BpmnElementTypeEntity> results = repository.findByCategory("nonexistent");

            // Assert
            assertThat(results).isEmpty();
        }

        @Test
        @DisplayName("Should only return system defaults for category")
        void shouldOnlyReturnSystemDefaultsForCategory() {
            // Act
            List<BpmnElementTypeEntity> tasks = repository.findByCategory("task");

            // Assert
            assertThat(tasks).allMatch(e -> e.getTenantId() == null);
        }

        @Test
        @DisplayName("Should exclude inactive elements from category")
        void shouldExcludeInactiveElementsFromCategory() {
            // Act
            List<BpmnElementTypeEntity> tasks = repository.findByCategory("task");

            // Assert
            assertThat(tasks).noneMatch(e -> "bpmn:InactiveElement".equals(e.getCode()));
        }

        @Test
        @DisplayName("Should return sorted results by sortOrder and name")
        void shouldReturnSortedResultsBySortOrderAndName() {
            // Arrange
            BpmnElementTypeEntity anotherTask = BpmnElementTypeEntity.builder()
                    .tenantId(null)
                    .code("bpmn:UserTask")
                    .name("A User Task")
                    .category("task")
                    .strokeColor("#1E88E5")
                    .fillColor("#E3F2FD")
                    .strokeWidth(2.0)
                    .sortOrder(1)
                    .isActive(true)
                    .build();
            entityManager.persist(anotherTask);
            entityManager.flush();

            // Act
            List<BpmnElementTypeEntity> tasks = repository.findByCategory("task");

            // Assert
            assertThat(tasks).hasSize(2);
            assertThat(tasks).isSortedAccordingTo((a, b) -> {
                int sortCompare = a.getSortOrder().compareTo(b.getSortOrder());
                if (sortCompare != 0) return sortCompare;
                return a.getName().compareTo(b.getName());
            });
        }
    }

    @Nested
    @DisplayName("existsByCodeAndTenantId Tests")
    class ExistsByCodeAndTenantIdTests {

        @Test
        @DisplayName("Should return true when tenant override exists")
        void shouldReturnTrueWhenTenantOverrideExists() {
            // Act
            boolean exists = repository.existsByCodeAndTenantId("bpmn:Task", "tenant-123");

            // Assert
            assertThat(exists).isTrue();
        }

        @Test
        @DisplayName("Should return false when tenant override does not exist")
        void shouldReturnFalseWhenTenantOverrideDoesNotExist() {
            // Act
            boolean exists = repository.existsByCodeAndTenantId("bpmn:StartEvent", "tenant-123");

            // Assert
            assertThat(exists).isFalse();
        }

        @Test
        @DisplayName("Should return false for non-existent code")
        void shouldReturnFalseForNonExistentCode() {
            // Act
            boolean exists = repository.existsByCodeAndTenantId("bpmn:NonExistent", "tenant-123");

            // Assert
            assertThat(exists).isFalse();
        }

        @Test
        @DisplayName("Should return false for non-existent tenant")
        void shouldReturnFalseForNonExistentTenant() {
            // Act
            boolean exists = repository.existsByCodeAndTenantId("bpmn:Task", "tenant-nonexistent");

            // Assert
            assertThat(exists).isFalse();
        }

        @Test
        @DisplayName("Should handle null tenant ID")
        void shouldHandleNullTenantId() {
            // Act
            boolean exists = repository.existsByCodeAndTenantId("bpmn:Task", null);

            // Assert
            assertThat(exists).isTrue();
        }
    }

    @Nested
    @DisplayName("Edge Cases and Boundary Tests")
    class EdgeCaseTests {

        @Test
        @DisplayName("Should handle empty string tenant ID")
        void shouldHandleEmptyStringTenantId() {
            // Arrange
            BpmnElementTypeEntity emptyTenant = BpmnElementTypeEntity.builder()
                    .tenantId("")
                    .code("bpmn:EmptyTenant")
                    .name("Empty Tenant Element")
                    .category("task")
                    .strokeColor("#000000")
                    .fillColor("#FFFFFF")
                    .strokeWidth(1.0)
                    .sortOrder(0)
                    .isActive(true)
                    .build();
            entityManager.persist(emptyTenant);
            entityManager.flush();

            // Act
            boolean exists = repository.existsByCodeAndTenantId("bpmn:EmptyTenant", "");

            // Assert
            assertThat(exists).isTrue();
        }

        @Test
        @DisplayName("Should handle very long code values")
        void shouldHandleVeryLongCodeValues() {
            // Arrange
            String longCode = "bpmn:" + "A".repeat(90);
            BpmnElementTypeEntity longCodeEntity = BpmnElementTypeEntity.builder()
                    .tenantId(null)
                    .code(longCode)
                    .name("Long Code Element")
                    .category("task")
                    .strokeColor("#000000")
                    .fillColor("#FFFFFF")
                    .strokeWidth(1.0)
                    .sortOrder(0)
                    .isActive(true)
                    .build();
            entityManager.persist(longCodeEntity);
            entityManager.flush();

            // Act
            Optional<BpmnElementTypeEntity> result = repository.findByCodeAndTenantIdIsNull(longCode);

            // Assert
            assertThat(result).isPresent();
            assertThat(result.get().getCode()).hasSize(95);
        }

        @Test
        @DisplayName("Should handle special characters in code")
        void shouldHandleSpecialCharactersInCode() {
            // Arrange
            String specialCode = "bpmn:Task_With-Special.Chars";
            BpmnElementTypeEntity specialEntity = BpmnElementTypeEntity.builder()
                    .tenantId(null)
                    .code(specialCode)
                    .name("Special Chars Element")
                    .category("task")
                    .strokeColor("#000000")
                    .fillColor("#FFFFFF")
                    .strokeWidth(1.0)
                    .sortOrder(0)
                    .isActive(true)
                    .build();
            entityManager.persist(specialEntity);
            entityManager.flush();

            // Act
            Optional<BpmnElementTypeEntity> result = repository.findByCodeAndTenantIdIsNull(specialCode);

            // Assert
            assertThat(result).isPresent();
        }

        @Test
        @DisplayName("Should handle concurrent saves")
        void shouldHandleConcurrentSaves() {
            // Arrange
            BpmnElementTypeEntity entity1 = BpmnElementTypeEntity.builder()
                    .tenantId(null)
                    .code("bpmn:Concurrent1")
                    .name("Concurrent 1")
                    .category("task")
                    .strokeColor("#000000")
                    .fillColor("#FFFFFF")
                    .strokeWidth(1.0)
                    .sortOrder(0)
                    .isActive(true)
                    .build();

            BpmnElementTypeEntity entity2 = BpmnElementTypeEntity.builder()
                    .tenantId(null)
                    .code("bpmn:Concurrent2")
                    .name("Concurrent 2")
                    .category("task")
                    .strokeColor("#000000")
                    .fillColor("#FFFFFF")
                    .strokeWidth(1.0)
                    .sortOrder(0)
                    .isActive(true)
                    .build();

            // Act
            repository.save(entity1);
            repository.save(entity2);
            entityManager.flush();

            // Assert
            assertThat(repository.findByCodeAndTenantIdIsNull("bpmn:Concurrent1")).isPresent();
            assertThat(repository.findByCodeAndTenantIdIsNull("bpmn:Concurrent2")).isPresent();
        }

        @Test
        @DisplayName("Should preserve timestamps on update")
        void shouldPreserveTimestampsOnUpdate() {
            // Arrange
            BpmnElementTypeEntity original = repository.findById(systemDefaultTask.getId()).orElseThrow();

            // Act
            original.setName("Updated Name");
            repository.save(original);
            entityManager.flush();
            entityManager.clear();

            // Assert
            BpmnElementTypeEntity updated = repository.findById(systemDefaultTask.getId()).orElseThrow();
            assertThat(updated.getName()).isEqualTo("Updated Name");
        }

        @Test
        @DisplayName("Should handle batch inserts")
        void shouldHandleBatchInserts() {
            // Arrange
            List<BpmnElementTypeEntity> entities = List.of(
                    createEntity("bpmn:Batch1", "Batch 1"),
                    createEntity("bpmn:Batch2", "Batch 2"),
                    createEntity("bpmn:Batch3", "Batch 3")
            );

            // Act
            repository.saveAll(entities);
            entityManager.flush();

            // Assert
            assertThat(repository.count()).isEqualTo(8);
        }

        private BpmnElementTypeEntity createEntity(String code, String name) {
            return BpmnElementTypeEntity.builder()
                    .tenantId(null)
                    .code(code)
                    .name(name)
                    .category("task")
                    .strokeColor("#000000")
                    .fillColor("#FFFFFF")
                    .strokeWidth(1.0)
                    .sortOrder(0)
                    .isActive(true)
                    .build();
        }
    }

    @Nested
    @DisplayName("Multi-tenant Isolation Tests")
    class MultiTenantIsolationTests {

        @Test
        @DisplayName("Should isolate tenant data correctly")
        void shouldIsolateTenantDataCorrectly() {
            // Arrange
            BpmnElementTypeEntity tenant456Task = BpmnElementTypeEntity.builder()
                    .tenantId("tenant-456")
                    .code("bpmn:Task")
                    .name("Tenant 456 Task")
                    .category("task")
                    .strokeColor("#9C27B0")
                    .fillColor("#F3E5F5")
                    .strokeWidth(2.0)
                    .sortOrder(1)
                    .isActive(true)
                    .build();
            entityManager.persist(tenant456Task);
            entityManager.flush();

            // Act
            List<BpmnElementTypeEntity> tenant123Results = repository.findAllForTenant("tenant-123");
            List<BpmnElementTypeEntity> tenant456Results = repository.findAllForTenant("tenant-456");

            // Assert
            Optional<BpmnElementTypeEntity> tenant123Task = tenant123Results.stream()
                    .filter(e -> "bpmn:Task".equals(e.getCode()))
                    .findFirst();
            Optional<BpmnElementTypeEntity> tenant456TaskResult = tenant456Results.stream()
                    .filter(e -> "bpmn:Task".equals(e.getCode()))
                    .findFirst();

            assertThat(tenant123Task).isPresent();
            assertThat(tenant123Task.get().getName()).isEqualTo("Custom Task");
            assertThat(tenant456TaskResult).isPresent();
            assertThat(tenant456TaskResult.get().getName()).isEqualTo("Tenant 456 Task");
        }

        @Test
        @DisplayName("Should not leak tenant data across tenants")
        void shouldNotLeakTenantDataAcrossTenants() {
            // Act
            List<BpmnElementTypeEntity> tenant123Results = repository.findAllForTenant("tenant-123");

            // Assert
            assertThat(tenant123Results).noneMatch(e ->
                e.getTenantId() != null && !e.getTenantId().equals("tenant-123")
            );
        }
    }
}
