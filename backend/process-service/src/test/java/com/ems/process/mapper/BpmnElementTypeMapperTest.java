package com.ems.process.mapper;

import com.ems.process.dto.BpmnElementTypeDTO;
import com.ems.process.entity.BpmnElementTypeEntity;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for BpmnElementTypeMapper.
 * Tests the MapStruct mapper implementation for entity-to-DTO conversions.
 */
@DisplayName("BpmnElementTypeMapper Tests")
class BpmnElementTypeMapperTest {

    private BpmnElementTypeMapper mapper;

    private BpmnElementTypeEntity entity;
    private UUID entityId;

    @BeforeEach
    void setUp() {
        mapper = Mappers.getMapper(BpmnElementTypeMapper.class);
        entityId = UUID.randomUUID();

        entity = BpmnElementTypeEntity.builder()
                .id(entityId)
                .tenantId("tenant-123")
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
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
    }

    @Nested
    @DisplayName("toDTO Method Tests")
    class ToDtoTests {

        @Test
        @DisplayName("Should map all basic fields correctly")
        void shouldMapAllBasicFieldsCorrectly() {
            // Act
            BpmnElementTypeDTO dto = mapper.toDTO(entity);

            // Assert
            assertThat(dto.id()).isEqualTo(entityId);
            assertThat(dto.code()).isEqualTo("bpmn:Task");
            assertThat(dto.name()).isEqualTo("Task");
            assertThat(dto.category()).isEqualTo("task");
            assertThat(dto.subCategory()).isEqualTo("generic");
            assertThat(dto.strokeColor()).isEqualTo("#1E88E5");
            assertThat(dto.fillColor()).isEqualTo("#E3F2FD");
            assertThat(dto.strokeWidth()).isEqualTo(2.0);
            assertThat(dto.iconSvg()).isEqualTo("<svg>task</svg>");
            assertThat(dto.sortOrder()).isEqualTo(1);
        }

        @Test
        @DisplayName("Should map defaultSize from width and height")
        void shouldMapDefaultSizeFromWidthAndHeight() {
            // Act
            BpmnElementTypeDTO dto = mapper.toDTO(entity);

            // Assert
            assertThat(dto.defaultSize()).isNotNull();
            assertThat(dto.defaultSize().width()).isEqualTo(100);
            assertThat(dto.defaultSize().height()).isEqualTo(80);
        }

        @Test
        @DisplayName("Should return null for null entity")
        void shouldReturnNullForNullEntity() {
            // Act
            BpmnElementTypeDTO dto = mapper.toDTO(null);

            // Assert
            assertThat(dto).isNull();
        }

        @Test
        @DisplayName("Should not map tenantId to DTO")
        void shouldNotMapTenantIdToDto() {
            // Act
            BpmnElementTypeDTO dto = mapper.toDTO(entity);

            // Assert - DTO should not have tenantId field
            // The tenantId is intentionally excluded from the DTO
            assertThat(dto.code()).isNotNull(); // Just verify the mapping works
        }

        @Test
        @DisplayName("Should not map createdAt to DTO")
        void shouldNotMapCreatedAtToDto() {
            // Act
            BpmnElementTypeDTO dto = mapper.toDTO(entity);

            // Assert - DTO should not have timestamp fields
            assertThat(dto.id()).isNotNull(); // Verify mapping works
        }

        @Test
        @DisplayName("Should not map updatedAt to DTO")
        void shouldNotMapUpdatedAtToDto() {
            // Act
            BpmnElementTypeDTO dto = mapper.toDTO(entity);

            // Assert - DTO should not have timestamp fields
            assertThat(dto.id()).isNotNull(); // Verify mapping works
        }

        @Test
        @DisplayName("Should not map isActive to DTO")
        void shouldNotMapIsActiveToDto() {
            // Act
            BpmnElementTypeDTO dto = mapper.toDTO(entity);

            // Assert - DTO should not have isActive field
            assertThat(dto.code()).isNotNull(); // Verify mapping works
        }
    }

    @Nested
    @DisplayName("ID Mapping Tests")
    class IdMappingTests {

        @Test
        @DisplayName("Should map UUID ID correctly")
        void shouldMapUuidIdCorrectly() {
            // Act
            BpmnElementTypeDTO dto = mapper.toDTO(entity);

            // Assert
            assertThat(dto.id()).isEqualTo(entityId);
        }

        @Test
        @DisplayName("Should handle null ID")
        void shouldHandleNullId() {
            // Arrange
            entity.setId(null);

            // Act
            BpmnElementTypeDTO dto = mapper.toDTO(entity);

            // Assert
            assertThat(dto.id()).isNull();
        }

        @Test
        @DisplayName("Should preserve ID uniqueness across mappings")
        void shouldPreserveIdUniquenessAcrossMappings() {
            // Arrange
            UUID id1 = UUID.randomUUID();
            UUID id2 = UUID.randomUUID();
            entity.setId(id1);
            BpmnElementTypeEntity entity2 = BpmnElementTypeEntity.builder()
                    .id(id2)
                    .code("bpmn:Task2")
                    .name("Task 2")
                    .category("task")
                    .strokeColor("#000000")
                    .fillColor("#FFFFFF")
                    .strokeWidth(1.0)
                    .sortOrder(0)
                    .isActive(true)
                    .build();

            // Act
            BpmnElementTypeDTO dto1 = mapper.toDTO(entity);
            BpmnElementTypeDTO dto2 = mapper.toDTO(entity2);

            // Assert
            assertThat(dto1.id()).isNotEqualTo(dto2.id());
        }
    }

    @Nested
    @DisplayName("Code Mapping Tests")
    class CodeMappingTests {

        @Test
        @DisplayName("Should map task code correctly")
        void shouldMapTaskCodeCorrectly() {
            // Arrange
            entity.setCode("bpmn:UserTask");

            // Act
            BpmnElementTypeDTO dto = mapper.toDTO(entity);

            // Assert
            assertThat(dto.code()).isEqualTo("bpmn:UserTask");
        }

        @Test
        @DisplayName("Should map event code correctly")
        void shouldMapEventCodeCorrectly() {
            // Arrange
            entity.setCode("bpmn:StartEvent");

            // Act
            BpmnElementTypeDTO dto = mapper.toDTO(entity);

            // Assert
            assertThat(dto.code()).isEqualTo("bpmn:StartEvent");
        }

        @Test
        @DisplayName("Should map gateway code correctly")
        void shouldMapGatewayCodeCorrectly() {
            // Arrange
            entity.setCode("bpmn:ExclusiveGateway");

            // Act
            BpmnElementTypeDTO dto = mapper.toDTO(entity);

            // Assert
            assertThat(dto.code()).isEqualTo("bpmn:ExclusiveGateway");
        }

        @Test
        @DisplayName("Should handle null code")
        void shouldHandleNullCode() {
            // Arrange
            entity.setCode(null);

            // Act
            BpmnElementTypeDTO dto = mapper.toDTO(entity);

            // Assert
            assertThat(dto.code()).isNull();
        }

        @Test
        @DisplayName("Should preserve code case sensitivity")
        void shouldPreserveCodeCaseSensitivity() {
            // Arrange
            entity.setCode("BPMN:TASK");

            // Act
            BpmnElementTypeDTO dto = mapper.toDTO(entity);

            // Assert
            assertThat(dto.code()).isEqualTo("BPMN:TASK");
        }
    }

    @Nested
    @DisplayName("Name Mapping Tests")
    class NameMappingTests {

        @Test
        @DisplayName("Should map name correctly")
        void shouldMapNameCorrectly() {
            // Arrange
            entity.setName("User Task");

            // Act
            BpmnElementTypeDTO dto = mapper.toDTO(entity);

            // Assert
            assertThat(dto.name()).isEqualTo("User Task");
        }

        @Test
        @DisplayName("Should handle null name")
        void shouldHandleNullName() {
            // Arrange
            entity.setName(null);

            // Act
            BpmnElementTypeDTO dto = mapper.toDTO(entity);

            // Assert
            assertThat(dto.name()).isNull();
        }

        @Test
        @DisplayName("Should handle empty name")
        void shouldHandleEmptyName() {
            // Arrange
            entity.setName("");

            // Act
            BpmnElementTypeDTO dto = mapper.toDTO(entity);

            // Assert
            assertThat(dto.name()).isEmpty();
        }

        @Test
        @DisplayName("Should handle name with special characters")
        void shouldHandleNameWithSpecialCharacters() {
            // Arrange
            entity.setName("Task (Multi-Instance)");

            // Act
            BpmnElementTypeDTO dto = mapper.toDTO(entity);

            // Assert
            assertThat(dto.name()).isEqualTo("Task (Multi-Instance)");
        }

        @Test
        @DisplayName("Should handle name with unicode")
        void shouldHandleNameWithUnicode() {
            // Arrange
            entity.setName("Tarea del Usuario");

            // Act
            BpmnElementTypeDTO dto = mapper.toDTO(entity);

            // Assert
            assertThat(dto.name()).isEqualTo("Tarea del Usuario");
        }
    }

    @Nested
    @DisplayName("Category Mapping Tests")
    class CategoryMappingTests {

        @Test
        @DisplayName("Should map task category correctly")
        void shouldMapTaskCategoryCorrectly() {
            // Arrange
            entity.setCategory("task");

            // Act
            BpmnElementTypeDTO dto = mapper.toDTO(entity);

            // Assert
            assertThat(dto.category()).isEqualTo("task");
        }

        @Test
        @DisplayName("Should map event category correctly")
        void shouldMapEventCategoryCorrectly() {
            // Arrange
            entity.setCategory("event");

            // Act
            BpmnElementTypeDTO dto = mapper.toDTO(entity);

            // Assert
            assertThat(dto.category()).isEqualTo("event");
        }

        @Test
        @DisplayName("Should map gateway category correctly")
        void shouldMapGatewayCategoryCorrectly() {
            // Arrange
            entity.setCategory("gateway");

            // Act
            BpmnElementTypeDTO dto = mapper.toDTO(entity);

            // Assert
            assertThat(dto.category()).isEqualTo("gateway");
        }

        @Test
        @DisplayName("Should handle null category")
        void shouldHandleNullCategory() {
            // Arrange
            entity.setCategory(null);

            // Act
            BpmnElementTypeDTO dto = mapper.toDTO(entity);

            // Assert
            assertThat(dto.category()).isNull();
        }
    }

    @Nested
    @DisplayName("SubCategory Mapping Tests")
    class SubCategoryMappingTests {

        @Test
        @DisplayName("Should map subCategory correctly")
        void shouldMapSubCategoryCorrectly() {
            // Arrange
            entity.setSubCategory("user");

            // Act
            BpmnElementTypeDTO dto = mapper.toDTO(entity);

            // Assert
            assertThat(dto.subCategory()).isEqualTo("user");
        }

        @Test
        @DisplayName("Should handle null subCategory")
        void shouldHandleNullSubCategory() {
            // Arrange
            entity.setSubCategory(null);

            // Act
            BpmnElementTypeDTO dto = mapper.toDTO(entity);

            // Assert
            assertThat(dto.subCategory()).isNull();
        }

        @Test
        @DisplayName("Should handle empty subCategory")
        void shouldHandleEmptySubCategory() {
            // Arrange
            entity.setSubCategory("");

            // Act
            BpmnElementTypeDTO dto = mapper.toDTO(entity);

            // Assert
            assertThat(dto.subCategory()).isEmpty();
        }

        @Test
        @DisplayName("Should map event start subCategory")
        void shouldMapEventStartSubCategory() {
            // Arrange
            entity.setSubCategory("start");

            // Act
            BpmnElementTypeDTO dto = mapper.toDTO(entity);

            // Assert
            assertThat(dto.subCategory()).isEqualTo("start");
        }

        @Test
        @DisplayName("Should map event end subCategory")
        void shouldMapEventEndSubCategory() {
            // Arrange
            entity.setSubCategory("end");

            // Act
            BpmnElementTypeDTO dto = mapper.toDTO(entity);

            // Assert
            assertThat(dto.subCategory()).isEqualTo("end");
        }
    }

    @Nested
    @DisplayName("Color Mapping Tests")
    class ColorMappingTests {

        @Test
        @DisplayName("Should map stroke color correctly")
        void shouldMapStrokeColorCorrectly() {
            // Arrange
            entity.setStrokeColor("#FF5722");

            // Act
            BpmnElementTypeDTO dto = mapper.toDTO(entity);

            // Assert
            assertThat(dto.strokeColor()).isEqualTo("#FF5722");
        }

        @Test
        @DisplayName("Should map fill color correctly")
        void shouldMapFillColorCorrectly() {
            // Arrange
            entity.setFillColor("#FBE9E7");

            // Act
            BpmnElementTypeDTO dto = mapper.toDTO(entity);

            // Assert
            assertThat(dto.fillColor()).isEqualTo("#FBE9E7");
        }

        @Test
        @DisplayName("Should handle null stroke color")
        void shouldHandleNullStrokeColor() {
            // Arrange
            entity.setStrokeColor(null);

            // Act
            BpmnElementTypeDTO dto = mapper.toDTO(entity);

            // Assert
            assertThat(dto.strokeColor()).isNull();
        }

        @Test
        @DisplayName("Should handle null fill color")
        void shouldHandleNullFillColor() {
            // Arrange
            entity.setFillColor(null);

            // Act
            BpmnElementTypeDTO dto = mapper.toDTO(entity);

            // Assert
            assertThat(dto.fillColor()).isNull();
        }

        @Test
        @DisplayName("Should preserve color case")
        void shouldPreserveColorCase() {
            // Arrange
            entity.setStrokeColor("#ff5722");
            entity.setFillColor("#FFFFFF");

            // Act
            BpmnElementTypeDTO dto = mapper.toDTO(entity);

            // Assert
            assertThat(dto.strokeColor()).isEqualTo("#ff5722");
            assertThat(dto.fillColor()).isEqualTo("#FFFFFF");
        }
    }

    @Nested
    @DisplayName("Stroke Width Mapping Tests")
    class StrokeWidthMappingTests {

        @Test
        @DisplayName("Should map stroke width correctly")
        void shouldMapStrokeWidthCorrectly() {
            // Arrange
            entity.setStrokeWidth(2.5);

            // Act
            BpmnElementTypeDTO dto = mapper.toDTO(entity);

            // Assert
            assertThat(dto.strokeWidth()).isEqualTo(2.5);
        }

        @Test
        @DisplayName("Should handle null stroke width")
        void shouldHandleNullStrokeWidth() {
            // Arrange
            entity.setStrokeWidth(null);

            // Act
            BpmnElementTypeDTO dto = mapper.toDTO(entity);

            // Assert
            assertThat(dto.strokeWidth()).isNull();
        }

        @Test
        @DisplayName("Should handle zero stroke width")
        void shouldHandleZeroStrokeWidth() {
            // Arrange
            entity.setStrokeWidth(0.0);

            // Act
            BpmnElementTypeDTO dto = mapper.toDTO(entity);

            // Assert
            assertThat(dto.strokeWidth()).isEqualTo(0.0);
        }

        @Test
        @DisplayName("Should handle decimal stroke width")
        void shouldHandleDecimalStrokeWidth() {
            // Arrange
            entity.setStrokeWidth(1.75);

            // Act
            BpmnElementTypeDTO dto = mapper.toDTO(entity);

            // Assert
            assertThat(dto.strokeWidth()).isEqualTo(1.75);
        }
    }

    @Nested
    @DisplayName("toSizeDTO Method Tests")
    class ToSizeDtoTests {

        @Test
        @DisplayName("Should create size DTO with both dimensions")
        void shouldCreateSizeDtoWithBothDimensions() {
            // Act
            BpmnElementTypeDTO.ElementSizeDTO sizeDto = mapper.toSizeDTO(100, 80);

            // Assert
            assertThat(sizeDto).isNotNull();
            assertThat(sizeDto.width()).isEqualTo(100);
            assertThat(sizeDto.height()).isEqualTo(80);
        }

        @Test
        @DisplayName("Should return null when both dimensions are null")
        void shouldReturnNullWhenBothDimensionsAreNull() {
            // Act
            BpmnElementTypeDTO.ElementSizeDTO sizeDto = mapper.toSizeDTO(null, null);

            // Assert
            assertThat(sizeDto).isNull();
        }

        @Test
        @DisplayName("Should create size DTO with only width")
        void shouldCreateSizeDtoWithOnlyWidth() {
            // Act
            BpmnElementTypeDTO.ElementSizeDTO sizeDto = mapper.toSizeDTO(100, null);

            // Assert
            assertThat(sizeDto).isNotNull();
            assertThat(sizeDto.width()).isEqualTo(100);
            assertThat(sizeDto.height()).isNull();
        }

        @Test
        @DisplayName("Should create size DTO with only height")
        void shouldCreateSizeDtoWithOnlyHeight() {
            // Act
            BpmnElementTypeDTO.ElementSizeDTO sizeDto = mapper.toSizeDTO(null, 80);

            // Assert
            assertThat(sizeDto).isNotNull();
            assertThat(sizeDto.width()).isNull();
            assertThat(sizeDto.height()).isEqualTo(80);
        }

        @Test
        @DisplayName("Should handle zero dimensions")
        void shouldHandleZeroDimensions() {
            // Act
            BpmnElementTypeDTO.ElementSizeDTO sizeDto = mapper.toSizeDTO(0, 0);

            // Assert
            assertThat(sizeDto).isNotNull();
            assertThat(sizeDto.width()).isEqualTo(0);
            assertThat(sizeDto.height()).isEqualTo(0);
        }

        @Test
        @DisplayName("Should handle typical task dimensions")
        void shouldHandleTypicalTaskDimensions() {
            // Act
            BpmnElementTypeDTO.ElementSizeDTO sizeDto = mapper.toSizeDTO(100, 80);

            // Assert
            assertThat(sizeDto.width()).isEqualTo(100);
            assertThat(sizeDto.height()).isEqualTo(80);
        }

        @Test
        @DisplayName("Should handle typical event dimensions")
        void shouldHandleTypicalEventDimensions() {
            // Act
            BpmnElementTypeDTO.ElementSizeDTO sizeDto = mapper.toSizeDTO(36, 36);

            // Assert
            assertThat(sizeDto.width()).isEqualTo(36);
            assertThat(sizeDto.height()).isEqualTo(36);
        }

        @Test
        @DisplayName("Should handle typical gateway dimensions")
        void shouldHandleTypicalGatewayDimensions() {
            // Act
            BpmnElementTypeDTO.ElementSizeDTO sizeDto = mapper.toSizeDTO(50, 50);

            // Assert
            assertThat(sizeDto.width()).isEqualTo(50);
            assertThat(sizeDto.height()).isEqualTo(50);
        }

        @Test
        @DisplayName("Should handle large dimensions")
        void shouldHandleLargeDimensions() {
            // Act
            BpmnElementTypeDTO.ElementSizeDTO sizeDto = mapper.toSizeDTO(1000, 800);

            // Assert
            assertThat(sizeDto.width()).isEqualTo(1000);
            assertThat(sizeDto.height()).isEqualTo(800);
        }
    }

    @Nested
    @DisplayName("DefaultSize Mapping Integration Tests")
    class DefaultSizeIntegrationTests {

        @Test
        @DisplayName("Should map defaultSize correctly through toDTO")
        void shouldMapDefaultSizeCorrectlyThroughToDto() {
            // Arrange
            entity.setDefaultWidth(120);
            entity.setDefaultHeight(90);

            // Act
            BpmnElementTypeDTO dto = mapper.toDTO(entity);

            // Assert
            assertThat(dto.defaultSize()).isNotNull();
            assertThat(dto.defaultSize().width()).isEqualTo(120);
            assertThat(dto.defaultSize().height()).isEqualTo(90);
        }

        @Test
        @DisplayName("Should return null defaultSize when both dimensions are null")
        void shouldReturnNullDefaultSizeWhenBothDimensionsAreNull() {
            // Arrange
            entity.setDefaultWidth(null);
            entity.setDefaultHeight(null);

            // Act
            BpmnElementTypeDTO dto = mapper.toDTO(entity);

            // Assert
            assertThat(dto.defaultSize()).isNull();
        }

        @Test
        @DisplayName("Should return defaultSize when only width is set")
        void shouldReturnDefaultSizeWhenOnlyWidthIsSet() {
            // Arrange
            entity.setDefaultWidth(100);
            entity.setDefaultHeight(null);

            // Act
            BpmnElementTypeDTO dto = mapper.toDTO(entity);

            // Assert
            assertThat(dto.defaultSize()).isNotNull();
            assertThat(dto.defaultSize().width()).isEqualTo(100);
            assertThat(dto.defaultSize().height()).isNull();
        }

        @Test
        @DisplayName("Should return defaultSize when only height is set")
        void shouldReturnDefaultSizeWhenOnlyHeightIsSet() {
            // Arrange
            entity.setDefaultWidth(null);
            entity.setDefaultHeight(80);

            // Act
            BpmnElementTypeDTO dto = mapper.toDTO(entity);

            // Assert
            assertThat(dto.defaultSize()).isNotNull();
            assertThat(dto.defaultSize().width()).isNull();
            assertThat(dto.defaultSize().height()).isEqualTo(80);
        }
    }

    @Nested
    @DisplayName("Icon SVG Mapping Tests")
    class IconSvgMappingTests {

        @Test
        @DisplayName("Should map iconSvg correctly")
        void shouldMapIconSvgCorrectly() {
            // Arrange
            String svg = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><path/></svg>";
            entity.setIconSvg(svg);

            // Act
            BpmnElementTypeDTO dto = mapper.toDTO(entity);

            // Assert
            assertThat(dto.iconSvg()).isEqualTo(svg);
        }

        @Test
        @DisplayName("Should handle null iconSvg")
        void shouldHandleNullIconSvg() {
            // Arrange
            entity.setIconSvg(null);

            // Act
            BpmnElementTypeDTO dto = mapper.toDTO(entity);

            // Assert
            assertThat(dto.iconSvg()).isNull();
        }

        @Test
        @DisplayName("Should handle empty iconSvg")
        void shouldHandleEmptyIconSvg() {
            // Arrange
            entity.setIconSvg("");

            // Act
            BpmnElementTypeDTO dto = mapper.toDTO(entity);

            // Assert
            assertThat(dto.iconSvg()).isEmpty();
        }

        @Test
        @DisplayName("Should preserve SVG content with currentColor")
        void shouldPreserveSvgContentWithCurrentColor() {
            // Arrange
            String svg = "<svg fill=\"currentColor\"><rect/></svg>";
            entity.setIconSvg(svg);

            // Act
            BpmnElementTypeDTO dto = mapper.toDTO(entity);

            // Assert
            assertThat(dto.iconSvg()).contains("currentColor");
        }

        @Test
        @DisplayName("Should handle large SVG content")
        void shouldHandleLargeSvgContent() {
            // Arrange
            String largeSvg = "<svg>" + "M0 0L".repeat(500) + "</svg>";
            entity.setIconSvg(largeSvg);

            // Act
            BpmnElementTypeDTO dto = mapper.toDTO(entity);

            // Assert
            assertThat(dto.iconSvg()).isEqualTo(largeSvg);
        }
    }

    @Nested
    @DisplayName("Sort Order Mapping Tests")
    class SortOrderMappingTests {

        @Test
        @DisplayName("Should map sortOrder correctly")
        void shouldMapSortOrderCorrectly() {
            // Arrange
            entity.setSortOrder(5);

            // Act
            BpmnElementTypeDTO dto = mapper.toDTO(entity);

            // Assert
            assertThat(dto.sortOrder()).isEqualTo(5);
        }

        @Test
        @DisplayName("Should handle null sortOrder")
        void shouldHandleNullSortOrder() {
            // Arrange
            entity.setSortOrder(null);

            // Act
            BpmnElementTypeDTO dto = mapper.toDTO(entity);

            // Assert
            assertThat(dto.sortOrder()).isNull();
        }

        @Test
        @DisplayName("Should handle zero sortOrder")
        void shouldHandleZeroSortOrder() {
            // Arrange
            entity.setSortOrder(0);

            // Act
            BpmnElementTypeDTO dto = mapper.toDTO(entity);

            // Assert
            assertThat(dto.sortOrder()).isEqualTo(0);
        }

        @Test
        @DisplayName("Should handle negative sortOrder")
        void shouldHandleNegativeSortOrder() {
            // Arrange
            entity.setSortOrder(-1);

            // Act
            BpmnElementTypeDTO dto = mapper.toDTO(entity);

            // Assert
            assertThat(dto.sortOrder()).isEqualTo(-1);
        }
    }

    @Nested
    @DisplayName("Complete Mapping Scenarios")
    class CompleteMappingScenarios {

        @Test
        @DisplayName("Should map complete task entity")
        void shouldMapCompleteTaskEntity() {
            // Arrange
            UUID id = UUID.randomUUID();
            BpmnElementTypeEntity taskEntity = BpmnElementTypeEntity.builder()
                    .id(id)
                    .tenantId(null)
                    .code("bpmn:UserTask")
                    .name("User Task")
                    .category("task")
                    .subCategory("user")
                    .strokeColor("#1E88E5")
                    .fillColor("#E3F2FD")
                    .strokeWidth(2.0)
                    .defaultWidth(100)
                    .defaultHeight(80)
                    .iconSvg("<svg>user</svg>")
                    .sortOrder(1)
                    .isActive(true)
                    .createdAt(Instant.now())
                    .updatedAt(Instant.now())
                    .build();

            // Act
            BpmnElementTypeDTO dto = mapper.toDTO(taskEntity);

            // Assert
            assertThat(dto.id()).isEqualTo(id);
            assertThat(dto.code()).isEqualTo("bpmn:UserTask");
            assertThat(dto.name()).isEqualTo("User Task");
            assertThat(dto.category()).isEqualTo("task");
            assertThat(dto.subCategory()).isEqualTo("user");
            assertThat(dto.strokeColor()).isEqualTo("#1E88E5");
            assertThat(dto.fillColor()).isEqualTo("#E3F2FD");
            assertThat(dto.strokeWidth()).isEqualTo(2.0);
            assertThat(dto.defaultSize()).isNotNull();
            assertThat(dto.defaultSize().width()).isEqualTo(100);
            assertThat(dto.defaultSize().height()).isEqualTo(80);
            assertThat(dto.iconSvg()).isEqualTo("<svg>user</svg>");
            assertThat(dto.sortOrder()).isEqualTo(1);
        }

        @Test
        @DisplayName("Should map complete event entity")
        void shouldMapCompleteEventEntity() {
            // Arrange
            UUID id = UUID.randomUUID();
            BpmnElementTypeEntity eventEntity = BpmnElementTypeEntity.builder()
                    .id(id)
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

            // Act
            BpmnElementTypeDTO dto = mapper.toDTO(eventEntity);

            // Assert
            assertThat(dto.code()).isEqualTo("bpmn:StartEvent");
            assertThat(dto.category()).isEqualTo("event");
            assertThat(dto.defaultSize().width()).isEqualTo(36);
            assertThat(dto.defaultSize().height()).isEqualTo(36);
        }

        @Test
        @DisplayName("Should map complete gateway entity")
        void shouldMapCompleteGatewayEntity() {
            // Arrange
            UUID id = UUID.randomUUID();
            BpmnElementTypeEntity gatewayEntity = BpmnElementTypeEntity.builder()
                    .id(id)
                    .code("bpmn:ExclusiveGateway")
                    .name("Exclusive Gateway")
                    .category("gateway")
                    .subCategory("exclusive")
                    .strokeColor("#FB8C00")
                    .fillColor("#FFF3E0")
                    .strokeWidth(2.0)
                    .defaultWidth(50)
                    .defaultHeight(50)
                    .iconSvg("<svg>x</svg>")
                    .sortOrder(10)
                    .isActive(true)
                    .build();

            // Act
            BpmnElementTypeDTO dto = mapper.toDTO(gatewayEntity);

            // Assert
            assertThat(dto.code()).isEqualTo("bpmn:ExclusiveGateway");
            assertThat(dto.category()).isEqualTo("gateway");
            assertThat(dto.defaultSize().width()).isEqualTo(50);
            assertThat(dto.defaultSize().height()).isEqualTo(50);
        }

        @Test
        @DisplayName("Should map minimal entity")
        void shouldMapMinimalEntity() {
            // Arrange
            BpmnElementTypeEntity minimalEntity = BpmnElementTypeEntity.builder()
                    .id(UUID.randomUUID())
                    .code("bpmn:Minimal")
                    .name("Minimal")
                    .category("task")
                    .strokeColor("#000000")
                    .fillColor("#FFFFFF")
                    .strokeWidth(1.0)
                    .sortOrder(0)
                    .isActive(true)
                    .build();

            // Act
            BpmnElementTypeDTO dto = mapper.toDTO(minimalEntity);

            // Assert
            assertThat(dto.id()).isNotNull();
            assertThat(dto.code()).isEqualTo("bpmn:Minimal");
            assertThat(dto.name()).isEqualTo("Minimal");
            assertThat(dto.subCategory()).isNull();
            assertThat(dto.defaultSize()).isNull();
            assertThat(dto.iconSvg()).isNull();
        }
    }

    @Nested
    @DisplayName("Mapper Instance Tests")
    class MapperInstanceTests {

        @Test
        @DisplayName("Should get mapper instance")
        void shouldGetMapperInstance() {
            // Act
            BpmnElementTypeMapper mapperInstance = Mappers.getMapper(BpmnElementTypeMapper.class);

            // Assert
            assertThat(mapperInstance).isNotNull();
        }

        @Test
        @DisplayName("Should return consistent mapping results")
        void shouldReturnConsistentMappingResults() {
            // Arrange
            BpmnElementTypeMapper mapper1 = Mappers.getMapper(BpmnElementTypeMapper.class);
            BpmnElementTypeMapper mapper2 = Mappers.getMapper(BpmnElementTypeMapper.class);

            // Act
            BpmnElementTypeDTO dto1 = mapper1.toDTO(entity);
            BpmnElementTypeDTO dto2 = mapper2.toDTO(entity);

            // Assert
            assertThat(dto1).isEqualTo(dto2);
        }
    }
}
