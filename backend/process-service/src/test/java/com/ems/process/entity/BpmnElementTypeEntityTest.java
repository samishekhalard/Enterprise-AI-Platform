package com.ems.process.entity;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for BpmnElementTypeEntity.
 * Tests entity creation, builder patterns, getters/setters, and default values.
 */
@DisplayName("BpmnElementTypeEntity Tests")
class BpmnElementTypeEntityTest {

    private BpmnElementTypeEntity entity;

    @BeforeEach
    void setUp() {
        entity = new BpmnElementTypeEntity();
    }

    @Nested
    @DisplayName("Entity Construction Tests")
    class ConstructionTests {

        @Test
        @DisplayName("Should create entity with no-args constructor")
        void shouldCreateEntityWithNoArgsConstructor() {
            // Arrange & Act
            BpmnElementTypeEntity newEntity = new BpmnElementTypeEntity();

            // Assert
            assertThat(newEntity).isNotNull();
            assertThat(newEntity.getId()).isNull();
        }

        @Test
        @DisplayName("Should create entity with all-args constructor")
        void shouldCreateEntityWithAllArgsConstructor() {
            // Arrange
            UUID id = UUID.randomUUID();
            String tenantId = "tenant-123";
            String code = "bpmn:Task";
            String name = "Task";
            String category = "task";
            String subCategory = "user";
            String strokeColor = "#1E88E5";
            String fillColor = "#FFFFFF";
            Double strokeWidth = 2.5;
            Integer defaultWidth = 100;
            Integer defaultHeight = 80;
            String iconSvg = "<svg></svg>";
            Integer sortOrder = 1;
            Boolean isActive = true;
            Instant createdAt = Instant.now();
            Instant updatedAt = Instant.now();

            // Act
            Long version = 0L;
            BpmnElementTypeEntity newEntity = new BpmnElementTypeEntity(
                id, tenantId, code, name, category, subCategory,
                strokeColor, fillColor, strokeWidth, defaultWidth, defaultHeight,
                iconSvg, sortOrder, isActive, version, createdAt, updatedAt
            );

            // Assert
            assertThat(newEntity.getId()).isEqualTo(id);
            assertThat(newEntity.getTenantId()).isEqualTo(tenantId);
            assertThat(newEntity.getCode()).isEqualTo(code);
            assertThat(newEntity.getName()).isEqualTo(name);
        }

        @Test
        @DisplayName("Should create entity using builder pattern")
        void shouldCreateEntityUsingBuilder() {
            // Arrange & Act
            BpmnElementTypeEntity builtEntity = BpmnElementTypeEntity.builder()
                    .code("bpmn:StartEvent")
                    .name("Start Event")
                    .category("event")
                    .subCategory("start")
                    .strokeColor("#43A047")
                    .fillColor("#E8F5E9")
                    .build();

            // Assert
            assertThat(builtEntity.getCode()).isEqualTo("bpmn:StartEvent");
            assertThat(builtEntity.getName()).isEqualTo("Start Event");
            assertThat(builtEntity.getCategory()).isEqualTo("event");
        }

        @Test
        @DisplayName("Should have default stroke width of 2.0 when using builder")
        void shouldHaveDefaultStrokeWidthWhenUsingBuilder() {
            // Arrange & Act
            BpmnElementTypeEntity builtEntity = BpmnElementTypeEntity.builder()
                    .code("bpmn:Task")
                    .name("Task")
                    .category("task")
                    .strokeColor("#1E88E5")
                    .fillColor("#FFFFFF")
                    .build();

            // Assert
            assertThat(builtEntity.getStrokeWidth()).isEqualTo(2.0);
        }

        @Test
        @DisplayName("Should have default sort order of 0 when using builder")
        void shouldHaveDefaultSortOrderWhenUsingBuilder() {
            // Arrange & Act
            BpmnElementTypeEntity builtEntity = BpmnElementTypeEntity.builder()
                    .code("bpmn:Task")
                    .name("Task")
                    .category("task")
                    .strokeColor("#1E88E5")
                    .fillColor("#FFFFFF")
                    .build();

            // Assert
            assertThat(builtEntity.getSortOrder()).isEqualTo(0);
        }

        @Test
        @DisplayName("Should have default isActive of true when using builder")
        void shouldHaveDefaultIsActiveWhenUsingBuilder() {
            // Arrange & Act
            BpmnElementTypeEntity builtEntity = BpmnElementTypeEntity.builder()
                    .code("bpmn:Task")
                    .name("Task")
                    .category("task")
                    .strokeColor("#1E88E5")
                    .fillColor("#FFFFFF")
                    .build();

            // Assert
            assertThat(builtEntity.getIsActive()).isTrue();
        }
    }

    @Nested
    @DisplayName("ID Field Tests")
    class IdFieldTests {

        @Test
        @DisplayName("Should set and get ID correctly")
        void shouldSetAndGetId() {
            // Arrange
            UUID id = UUID.randomUUID();

            // Act
            entity.setId(id);

            // Assert
            assertThat(entity.getId()).isEqualTo(id);
        }

        @Test
        @DisplayName("Should allow null ID")
        void shouldAllowNullId() {
            // Arrange
            entity.setId(UUID.randomUUID());

            // Act
            entity.setId(null);

            // Assert
            assertThat(entity.getId()).isNull();
        }

        @Test
        @DisplayName("Should generate unique IDs")
        void shouldGenerateUniqueIds() {
            // Arrange
            UUID id1 = UUID.randomUUID();
            UUID id2 = UUID.randomUUID();

            // Act & Assert
            assertThat(id1).isNotEqualTo(id2);
        }
    }

    @Nested
    @DisplayName("Tenant ID Field Tests")
    class TenantIdFieldTests {

        @Test
        @DisplayName("Should set and get tenant ID correctly")
        void shouldSetAndGetTenantId() {
            // Arrange
            String tenantId = "tenant-123";

            // Act
            entity.setTenantId(tenantId);

            // Assert
            assertThat(entity.getTenantId()).isEqualTo(tenantId);
        }

        @Test
        @DisplayName("Should allow null tenant ID for system defaults")
        void shouldAllowNullTenantIdForSystemDefaults() {
            // Arrange & Act
            entity.setTenantId(null);

            // Assert
            assertThat(entity.getTenantId()).isNull();
        }

        @Test
        @DisplayName("Should handle empty tenant ID string")
        void shouldHandleEmptyTenantIdString() {
            // Arrange & Act
            entity.setTenantId("");

            // Assert
            assertThat(entity.getTenantId()).isEmpty();
        }

        @Test
        @DisplayName("Should handle UUID formatted tenant ID")
        void shouldHandleUuidFormattedTenantId() {
            // Arrange
            String tenantId = UUID.randomUUID().toString();

            // Act
            entity.setTenantId(tenantId);

            // Assert
            assertThat(entity.getTenantId()).isEqualTo(tenantId);
        }
    }

    @Nested
    @DisplayName("Code Field Tests")
    class CodeFieldTests {

        @Test
        @DisplayName("Should set and get code correctly")
        void shouldSetAndGetCode() {
            // Arrange
            String code = "bpmn:Task";

            // Act
            entity.setCode(code);

            // Assert
            assertThat(entity.getCode()).isEqualTo(code);
        }

        @Test
        @DisplayName("Should handle BPMN task codes")
        void shouldHandleBpmnTaskCodes() {
            // Arrange
            String[] taskCodes = {"bpmn:Task", "bpmn:UserTask", "bpmn:ServiceTask", "bpmn:ScriptTask"};

            for (String code : taskCodes) {
                // Act
                entity.setCode(code);

                // Assert
                assertThat(entity.getCode()).isEqualTo(code);
            }
        }

        @Test
        @DisplayName("Should handle BPMN event codes")
        void shouldHandleBpmnEventCodes() {
            // Arrange
            String[] eventCodes = {"bpmn:StartEvent", "bpmn:EndEvent", "bpmn:IntermediateThrowEvent"};

            for (String code : eventCodes) {
                // Act
                entity.setCode(code);

                // Assert
                assertThat(entity.getCode()).isEqualTo(code);
            }
        }

        @Test
        @DisplayName("Should handle BPMN gateway codes")
        void shouldHandleBpmnGatewayCodes() {
            // Arrange
            String[] gatewayCodes = {"bpmn:ExclusiveGateway", "bpmn:ParallelGateway", "bpmn:InclusiveGateway"};

            for (String code : gatewayCodes) {
                // Act
                entity.setCode(code);

                // Assert
                assertThat(entity.getCode()).isEqualTo(code);
            }
        }

        @Test
        @DisplayName("Should allow null code")
        void shouldAllowNullCode() {
            // Arrange & Act
            entity.setCode(null);

            // Assert
            assertThat(entity.getCode()).isNull();
        }
    }

    @Nested
    @DisplayName("Name Field Tests")
    class NameFieldTests {

        @Test
        @DisplayName("Should set and get name correctly")
        void shouldSetAndGetName() {
            // Arrange
            String name = "User Task";

            // Act
            entity.setName(name);

            // Assert
            assertThat(entity.getName()).isEqualTo(name);
        }

        @Test
        @DisplayName("Should handle names with special characters")
        void shouldHandleNamesWithSpecialCharacters() {
            // Arrange
            String name = "Task (Multi-Instance)";

            // Act
            entity.setName(name);

            // Assert
            assertThat(entity.getName()).isEqualTo(name);
        }

        @Test
        @DisplayName("Should handle names with unicode characters")
        void shouldHandleNamesWithUnicodeCharacters() {
            // Arrange
            String name = "Tache Utilisateur";

            // Act
            entity.setName(name);

            // Assert
            assertThat(entity.getName()).isEqualTo(name);
        }

        @Test
        @DisplayName("Should handle maximum length name")
        void shouldHandleMaximumLengthName() {
            // Arrange
            String name = "A".repeat(100);

            // Act
            entity.setName(name);

            // Assert
            assertThat(entity.getName()).hasSize(100);
        }
    }

    @Nested
    @DisplayName("Category Field Tests")
    class CategoryFieldTests {

        @Test
        @DisplayName("Should set and get category correctly")
        void shouldSetAndGetCategory() {
            // Arrange
            String category = "task";

            // Act
            entity.setCategory(category);

            // Assert
            assertThat(entity.getCategory()).isEqualTo(category);
        }

        @Test
        @DisplayName("Should handle task category")
        void shouldHandleTaskCategory() {
            // Arrange & Act
            entity.setCategory("task");

            // Assert
            assertThat(entity.getCategory()).isEqualTo("task");
        }

        @Test
        @DisplayName("Should handle event category")
        void shouldHandleEventCategory() {
            // Arrange & Act
            entity.setCategory("event");

            // Assert
            assertThat(entity.getCategory()).isEqualTo("event");
        }

        @Test
        @DisplayName("Should handle gateway category")
        void shouldHandleGatewayCategory() {
            // Arrange & Act
            entity.setCategory("gateway");

            // Assert
            assertThat(entity.getCategory()).isEqualTo("gateway");
        }

        @Test
        @DisplayName("Should handle data category")
        void shouldHandleDataCategory() {
            // Arrange & Act
            entity.setCategory("data");

            // Assert
            assertThat(entity.getCategory()).isEqualTo("data");
        }

        @Test
        @DisplayName("Should handle artifact category")
        void shouldHandleArtifactCategory() {
            // Arrange & Act
            entity.setCategory("artifact");

            // Assert
            assertThat(entity.getCategory()).isEqualTo("artifact");
        }

        @Test
        @DisplayName("Should handle flow category")
        void shouldHandleFlowCategory() {
            // Arrange & Act
            entity.setCategory("flow");

            // Assert
            assertThat(entity.getCategory()).isEqualTo("flow");
        }
    }

    @Nested
    @DisplayName("SubCategory Field Tests")
    class SubCategoryFieldTests {

        @Test
        @DisplayName("Should set and get sub-category correctly")
        void shouldSetAndGetSubCategory() {
            // Arrange
            String subCategory = "user";

            // Act
            entity.setSubCategory(subCategory);

            // Assert
            assertThat(entity.getSubCategory()).isEqualTo(subCategory);
        }

        @Test
        @DisplayName("Should allow null sub-category")
        void shouldAllowNullSubCategory() {
            // Arrange & Act
            entity.setSubCategory(null);

            // Assert
            assertThat(entity.getSubCategory()).isNull();
        }

        @Test
        @DisplayName("Should handle event sub-categories")
        void shouldHandleEventSubCategories() {
            // Arrange
            String[] subCategories = {"start", "end", "intermediate"};

            for (String subCategory : subCategories) {
                // Act
                entity.setSubCategory(subCategory);

                // Assert
                assertThat(entity.getSubCategory()).isEqualTo(subCategory);
            }
        }

        @Test
        @DisplayName("Should handle task sub-categories")
        void shouldHandleTaskSubCategories() {
            // Arrange
            String[] subCategories = {"user", "service", "script", "manual", "business-rule"};

            for (String subCategory : subCategories) {
                // Act
                entity.setSubCategory(subCategory);

                // Assert
                assertThat(entity.getSubCategory()).isEqualTo(subCategory);
            }
        }
    }

    @Nested
    @DisplayName("Color Field Tests")
    class ColorFieldTests {

        @Test
        @DisplayName("Should set and get stroke color correctly")
        void shouldSetAndGetStrokeColor() {
            // Arrange
            String strokeColor = "#1E88E5";

            // Act
            entity.setStrokeColor(strokeColor);

            // Assert
            assertThat(entity.getStrokeColor()).isEqualTo(strokeColor);
        }

        @Test
        @DisplayName("Should set and get fill color correctly")
        void shouldSetAndGetFillColor() {
            // Arrange
            String fillColor = "#FFFFFF";

            // Act
            entity.setFillColor(fillColor);

            // Assert
            assertThat(entity.getFillColor()).isEqualTo(fillColor);
        }

        @Test
        @DisplayName("Should handle valid hex color format with hash")
        void shouldHandleValidHexColorFormatWithHash() {
            // Arrange
            String color = "#FF5722";

            // Act
            entity.setStrokeColor(color);

            // Assert
            assertThat(entity.getStrokeColor()).startsWith("#");
            assertThat(entity.getStrokeColor()).hasSize(7);
        }

        @Test
        @DisplayName("Should handle lowercase hex colors")
        void shouldHandleLowercaseHexColors() {
            // Arrange
            String color = "#ff5722";

            // Act
            entity.setStrokeColor(color);

            // Assert
            assertThat(entity.getStrokeColor()).isEqualTo("#ff5722");
        }

        @Test
        @DisplayName("Should handle uppercase hex colors")
        void shouldHandleUppercaseHexColors() {
            // Arrange
            String color = "#FF5722";

            // Act
            entity.setStrokeColor(color);

            // Assert
            assertThat(entity.getStrokeColor()).isEqualTo("#FF5722");
        }

        @Test
        @DisplayName("Should handle black color")
        void shouldHandleBlackColor() {
            // Arrange & Act
            entity.setFillColor("#000000");

            // Assert
            assertThat(entity.getFillColor()).isEqualTo("#000000");
        }

        @Test
        @DisplayName("Should handle white color")
        void shouldHandleWhiteColor() {
            // Arrange & Act
            entity.setFillColor("#FFFFFF");

            // Assert
            assertThat(entity.getFillColor()).isEqualTo("#FFFFFF");
        }
    }

    @Nested
    @DisplayName("Stroke Width Field Tests")
    class StrokeWidthFieldTests {

        @Test
        @DisplayName("Should set and get stroke width correctly")
        void shouldSetAndGetStrokeWidth() {
            // Arrange
            Double strokeWidth = 3.5;

            // Act
            entity.setStrokeWidth(strokeWidth);

            // Assert
            assertThat(entity.getStrokeWidth()).isEqualTo(3.5);
        }

        @Test
        @DisplayName("Should handle minimum stroke width")
        void shouldHandleMinimumStrokeWidth() {
            // Arrange & Act
            entity.setStrokeWidth(0.5);

            // Assert
            assertThat(entity.getStrokeWidth()).isEqualTo(0.5);
        }

        @Test
        @DisplayName("Should handle zero stroke width")
        void shouldHandleZeroStrokeWidth() {
            // Arrange & Act
            entity.setStrokeWidth(0.0);

            // Assert
            assertThat(entity.getStrokeWidth()).isEqualTo(0.0);
        }

        @Test
        @DisplayName("Should handle large stroke width")
        void shouldHandleLargeStrokeWidth() {
            // Arrange & Act
            entity.setStrokeWidth(10.0);

            // Assert
            assertThat(entity.getStrokeWidth()).isEqualTo(10.0);
        }

        @Test
        @DisplayName("Should handle decimal precision")
        void shouldHandleDecimalPrecision() {
            // Arrange & Act
            entity.setStrokeWidth(2.75);

            // Assert
            assertThat(entity.getStrokeWidth()).isEqualTo(2.75);
        }
    }

    @Nested
    @DisplayName("Dimension Field Tests")
    class DimensionFieldTests {

        @Test
        @DisplayName("Should set and get default width correctly")
        void shouldSetAndGetDefaultWidth() {
            // Arrange
            Integer width = 100;

            // Act
            entity.setDefaultWidth(width);

            // Assert
            assertThat(entity.getDefaultWidth()).isEqualTo(100);
        }

        @Test
        @DisplayName("Should set and get default height correctly")
        void shouldSetAndGetDefaultHeight() {
            // Arrange
            Integer height = 80;

            // Act
            entity.setDefaultHeight(height);

            // Assert
            assertThat(entity.getDefaultHeight()).isEqualTo(80);
        }

        @Test
        @DisplayName("Should allow null default width")
        void shouldAllowNullDefaultWidth() {
            // Arrange & Act
            entity.setDefaultWidth(null);

            // Assert
            assertThat(entity.getDefaultWidth()).isNull();
        }

        @Test
        @DisplayName("Should allow null default height")
        void shouldAllowNullDefaultHeight() {
            // Arrange & Act
            entity.setDefaultHeight(null);

            // Assert
            assertThat(entity.getDefaultHeight()).isNull();
        }

        @Test
        @DisplayName("Should handle typical task dimensions")
        void shouldHandleTypicalTaskDimensions() {
            // Arrange & Act
            entity.setDefaultWidth(100);
            entity.setDefaultHeight(80);

            // Assert
            assertThat(entity.getDefaultWidth()).isEqualTo(100);
            assertThat(entity.getDefaultHeight()).isEqualTo(80);
        }

        @Test
        @DisplayName("Should handle typical event dimensions")
        void shouldHandleTypicalEventDimensions() {
            // Arrange & Act
            entity.setDefaultWidth(36);
            entity.setDefaultHeight(36);

            // Assert
            assertThat(entity.getDefaultWidth()).isEqualTo(36);
            assertThat(entity.getDefaultHeight()).isEqualTo(36);
        }
    }

    @Nested
    @DisplayName("Icon SVG Field Tests")
    class IconSvgFieldTests {

        @Test
        @DisplayName("Should set and get icon SVG correctly")
        void shouldSetAndGetIconSvg() {
            // Arrange
            String iconSvg = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><path d=\"M12 2L2 7l10 5 10-5-10-5z\"/></svg>";

            // Act
            entity.setIconSvg(iconSvg);

            // Assert
            assertThat(entity.getIconSvg()).isEqualTo(iconSvg);
        }

        @Test
        @DisplayName("Should allow null icon SVG")
        void shouldAllowNullIconSvg() {
            // Arrange & Act
            entity.setIconSvg(null);

            // Assert
            assertThat(entity.getIconSvg()).isNull();
        }

        @Test
        @DisplayName("Should handle empty icon SVG")
        void shouldHandleEmptyIconSvg() {
            // Arrange & Act
            entity.setIconSvg("");

            // Assert
            assertThat(entity.getIconSvg()).isEmpty();
        }

        @Test
        @DisplayName("Should handle large SVG content")
        void shouldHandleLargeSvgContent() {
            // Arrange
            String largeSvg = "<svg>" + "M0 0L".repeat(1000) + "</svg>";

            // Act
            entity.setIconSvg(largeSvg);

            // Assert
            assertThat(entity.getIconSvg()).isEqualTo(largeSvg);
        }

        @Test
        @DisplayName("Should handle SVG with currentColor")
        void shouldHandleSvgWithCurrentColor() {
            // Arrange
            String iconSvg = "<svg fill=\"currentColor\"><rect/></svg>";

            // Act
            entity.setIconSvg(iconSvg);

            // Assert
            assertThat(entity.getIconSvg()).contains("currentColor");
        }
    }

    @Nested
    @DisplayName("Sort Order Field Tests")
    class SortOrderFieldTests {

        @Test
        @DisplayName("Should set and get sort order correctly")
        void shouldSetAndGetSortOrder() {
            // Arrange
            Integer sortOrder = 5;

            // Act
            entity.setSortOrder(sortOrder);

            // Assert
            assertThat(entity.getSortOrder()).isEqualTo(5);
        }

        @Test
        @DisplayName("Should allow zero sort order")
        void shouldAllowZeroSortOrder() {
            // Arrange & Act
            entity.setSortOrder(0);

            // Assert
            assertThat(entity.getSortOrder()).isEqualTo(0);
        }

        @Test
        @DisplayName("Should allow negative sort order")
        void shouldAllowNegativeSortOrder() {
            // Arrange & Act
            entity.setSortOrder(-1);

            // Assert
            assertThat(entity.getSortOrder()).isEqualTo(-1);
        }

        @Test
        @DisplayName("Should allow large sort order")
        void shouldAllowLargeSortOrder() {
            // Arrange & Act
            entity.setSortOrder(999);

            // Assert
            assertThat(entity.getSortOrder()).isEqualTo(999);
        }
    }

    @Nested
    @DisplayName("IsActive Field Tests")
    class IsActiveFieldTests {

        @Test
        @DisplayName("Should set and get isActive correctly")
        void shouldSetAndGetIsActive() {
            // Arrange & Act
            entity.setIsActive(true);

            // Assert
            assertThat(entity.getIsActive()).isTrue();
        }

        @Test
        @DisplayName("Should handle false isActive")
        void shouldHandleFalseIsActive() {
            // Arrange & Act
            entity.setIsActive(false);

            // Assert
            assertThat(entity.getIsActive()).isFalse();
        }

        @Test
        @DisplayName("Should allow null isActive")
        void shouldAllowNullIsActive() {
            // Arrange & Act
            entity.setIsActive(null);

            // Assert
            assertThat(entity.getIsActive()).isNull();
        }
    }

    @Nested
    @DisplayName("Timestamp Field Tests")
    class TimestampFieldTests {

        @Test
        @DisplayName("Should set and get createdAt correctly")
        void shouldSetAndGetCreatedAt() {
            // Arrange
            Instant createdAt = Instant.now();

            // Act
            entity.setCreatedAt(createdAt);

            // Assert
            assertThat(entity.getCreatedAt()).isEqualTo(createdAt);
        }

        @Test
        @DisplayName("Should set and get updatedAt correctly")
        void shouldSetAndGetUpdatedAt() {
            // Arrange
            Instant updatedAt = Instant.now();

            // Act
            entity.setUpdatedAt(updatedAt);

            // Assert
            assertThat(entity.getUpdatedAt()).isEqualTo(updatedAt);
        }

        @Test
        @DisplayName("Should allow null createdAt")
        void shouldAllowNullCreatedAt() {
            // Arrange & Act
            entity.setCreatedAt(null);

            // Assert
            assertThat(entity.getCreatedAt()).isNull();
        }

        @Test
        @DisplayName("Should allow null updatedAt")
        void shouldAllowNullUpdatedAt() {
            // Arrange & Act
            entity.setUpdatedAt(null);

            // Assert
            assertThat(entity.getUpdatedAt()).isNull();
        }

        @Test
        @DisplayName("Should handle timestamps in the past")
        void shouldHandleTimestampsInThePast() {
            // Arrange
            Instant pastTimestamp = Instant.parse("2020-01-01T00:00:00Z");

            // Act
            entity.setCreatedAt(pastTimestamp);

            // Assert
            assertThat(entity.getCreatedAt()).isEqualTo(pastTimestamp);
        }

        @Test
        @DisplayName("Should updatedAt be after or equal to createdAt in typical usage")
        void shouldUpdatedAtBeAfterOrEqualToCreatedAt() {
            // Arrange
            Instant createdAt = Instant.now();
            Instant updatedAt = createdAt.plusSeconds(60);

            // Act
            entity.setCreatedAt(createdAt);
            entity.setUpdatedAt(updatedAt);

            // Assert
            assertThat(entity.getUpdatedAt()).isAfterOrEqualTo(entity.getCreatedAt());
        }
    }

    @Nested
    @DisplayName("Builder Pattern Tests")
    class BuilderPatternTests {

        @Test
        @DisplayName("Should build complete entity with all fields")
        void shouldBuildCompleteEntityWithAllFields() {
            // Arrange
            UUID id = UUID.randomUUID();
            Instant now = Instant.now();

            // Act
            BpmnElementTypeEntity builtEntity = BpmnElementTypeEntity.builder()
                    .id(id)
                    .tenantId("tenant-123")
                    .code("bpmn:UserTask")
                    .name("User Task")
                    .category("task")
                    .subCategory("user")
                    .strokeColor("#1E88E5")
                    .fillColor("#E3F2FD")
                    .strokeWidth(2.5)
                    .defaultWidth(100)
                    .defaultHeight(80)
                    .iconSvg("<svg></svg>")
                    .sortOrder(1)
                    .isActive(true)
                    .createdAt(now)
                    .updatedAt(now)
                    .build();

            // Assert
            assertThat(builtEntity.getId()).isEqualTo(id);
            assertThat(builtEntity.getTenantId()).isEqualTo("tenant-123");
            assertThat(builtEntity.getCode()).isEqualTo("bpmn:UserTask");
            assertThat(builtEntity.getName()).isEqualTo("User Task");
            assertThat(builtEntity.getCategory()).isEqualTo("task");
            assertThat(builtEntity.getSubCategory()).isEqualTo("user");
            assertThat(builtEntity.getStrokeColor()).isEqualTo("#1E88E5");
            assertThat(builtEntity.getFillColor()).isEqualTo("#E3F2FD");
            assertThat(builtEntity.getStrokeWidth()).isEqualTo(2.5);
            assertThat(builtEntity.getDefaultWidth()).isEqualTo(100);
            assertThat(builtEntity.getDefaultHeight()).isEqualTo(80);
            assertThat(builtEntity.getIconSvg()).isEqualTo("<svg></svg>");
            assertThat(builtEntity.getSortOrder()).isEqualTo(1);
            assertThat(builtEntity.getIsActive()).isTrue();
            assertThat(builtEntity.getCreatedAt()).isEqualTo(now);
            assertThat(builtEntity.getUpdatedAt()).isEqualTo(now);
        }

        @Test
        @DisplayName("Should build entity with minimal fields")
        void shouldBuildEntityWithMinimalFields() {
            // Arrange & Act
            BpmnElementTypeEntity builtEntity = BpmnElementTypeEntity.builder()
                    .code("bpmn:Task")
                    .name("Task")
                    .category("task")
                    .strokeColor("#1E88E5")
                    .fillColor("#FFFFFF")
                    .build();

            // Assert
            assertThat(builtEntity.getCode()).isEqualTo("bpmn:Task");
            assertThat(builtEntity.getId()).isNull();
            assertThat(builtEntity.getTenantId()).isNull();
        }

        @Test
        @DisplayName("Should override default values in builder")
        void shouldOverrideDefaultValuesInBuilder() {
            // Arrange & Act
            BpmnElementTypeEntity builtEntity = BpmnElementTypeEntity.builder()
                    .code("bpmn:Task")
                    .name("Task")
                    .category("task")
                    .strokeColor("#1E88E5")
                    .fillColor("#FFFFFF")
                    .strokeWidth(5.0)
                    .sortOrder(10)
                    .isActive(false)
                    .build();

            // Assert
            assertThat(builtEntity.getStrokeWidth()).isEqualTo(5.0);
            assertThat(builtEntity.getSortOrder()).isEqualTo(10);
            assertThat(builtEntity.getIsActive()).isFalse();
        }
    }

    @Nested
    @DisplayName("Entity Equality Tests")
    class EqualityTests {

        @Test
        @DisplayName("Should not be equal to null")
        void shouldNotBeEqualToNull() {
            // Arrange
            entity.setId(UUID.randomUUID());

            // Act & Assert
            assertThat(entity).isNotEqualTo(null);
        }

        @Test
        @DisplayName("Should not be equal to different type")
        void shouldNotBeEqualToDifferentType() {
            // Arrange
            entity.setId(UUID.randomUUID());

            // Act & Assert
            assertThat(entity).isNotEqualTo("string");
        }
    }
}
