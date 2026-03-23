package com.ems.process.dto;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for BpmnElementTypeDTO and its inner records.
 * Tests record construction, accessors, equality, and builder patterns.
 */
@DisplayName("BpmnElementTypeDTO Tests")
class BpmnElementTypeDTOTest {

    private UUID testId;
    private BpmnElementTypeDTO dto;

    @BeforeEach
    void setUp() {
        testId = UUID.randomUUID();
        dto = BpmnElementTypeDTO.builder()
                .id(testId)
                .code("bpmn:Task")
                .name("Task")
                .category("task")
                .subCategory("user")
                .strokeColor("#1E88E5")
                .fillColor("#FFFFFF")
                .strokeWidth(2.0)
                .defaultSize(BpmnElementTypeDTO.ElementSizeDTO.builder()
                        .width(100)
                        .height(80)
                        .build())
                .iconSvg("<svg></svg>")
                .sortOrder(1)
                .build();
    }

    @Nested
    @DisplayName("Record Construction Tests")
    class ConstructionTests {

        @Test
        @DisplayName("Should create DTO using builder pattern")
        void shouldCreateDtoUsingBuilder() {
            // Arrange
            UUID id = UUID.randomUUID();

            // Act
            BpmnElementTypeDTO newDto = BpmnElementTypeDTO.builder()
                    .id(id)
                    .code("bpmn:StartEvent")
                    .name("Start Event")
                    .category("event")
                    .strokeColor("#43A047")
                    .fillColor("#E8F5E9")
                    .strokeWidth(2.0)
                    .sortOrder(0)
                    .build();

            // Assert
            assertThat(newDto).isNotNull();
            assertThat(newDto.id()).isEqualTo(id);
            assertThat(newDto.code()).isEqualTo("bpmn:StartEvent");
        }

        @Test
        @DisplayName("Should create DTO using canonical constructor")
        void shouldCreateDtoUsingCanonicalConstructor() {
            // Arrange
            UUID id = UUID.randomUUID();
            BpmnElementTypeDTO.ElementSizeDTO size = new BpmnElementTypeDTO.ElementSizeDTO(100, 80);

            // Act
            BpmnElementTypeDTO newDto = new BpmnElementTypeDTO(
                    id, "bpmn:Task", "Task", "task", "user",
                    "#1E88E5", "#FFFFFF", 2.0, size, "<svg></svg>", 1
            );

            // Assert
            assertThat(newDto.id()).isEqualTo(id);
            assertThat(newDto.code()).isEqualTo("bpmn:Task");
            assertThat(newDto.defaultSize()).isEqualTo(size);
        }

        @Test
        @DisplayName("Should create DTO with null optional fields")
        void shouldCreateDtoWithNullOptionalFields() {
            // Arrange & Act
            BpmnElementTypeDTO newDto = BpmnElementTypeDTO.builder()
                    .id(null)
                    .code("bpmn:Task")
                    .name("Task")
                    .category("task")
                    .subCategory(null)
                    .strokeColor("#1E88E5")
                    .fillColor("#FFFFFF")
                    .strokeWidth(2.0)
                    .defaultSize(null)
                    .iconSvg(null)
                    .sortOrder(0)
                    .build();

            // Assert
            assertThat(newDto.id()).isNull();
            assertThat(newDto.subCategory()).isNull();
            assertThat(newDto.defaultSize()).isNull();
            assertThat(newDto.iconSvg()).isNull();
        }

        @Test
        @DisplayName("Should create DTO with all fields populated")
        void shouldCreateDtoWithAllFieldsPopulated() {
            // Arrange
            UUID id = UUID.randomUUID();
            BpmnElementTypeDTO.ElementSizeDTO size = BpmnElementTypeDTO.ElementSizeDTO.builder()
                    .width(100)
                    .height(80)
                    .build();

            // Act
            BpmnElementTypeDTO newDto = BpmnElementTypeDTO.builder()
                    .id(id)
                    .code("bpmn:UserTask")
                    .name("User Task")
                    .category("task")
                    .subCategory("user")
                    .strokeColor("#1E88E5")
                    .fillColor("#E3F2FD")
                    .strokeWidth(2.5)
                    .defaultSize(size)
                    .iconSvg("<svg xmlns=\"http://www.w3.org/2000/svg\"><path/></svg>")
                    .sortOrder(5)
                    .build();

            // Assert
            assertThat(newDto.id()).isEqualTo(id);
            assertThat(newDto.code()).isEqualTo("bpmn:UserTask");
            assertThat(newDto.name()).isEqualTo("User Task");
            assertThat(newDto.category()).isEqualTo("task");
            assertThat(newDto.subCategory()).isEqualTo("user");
            assertThat(newDto.strokeColor()).isEqualTo("#1E88E5");
            assertThat(newDto.fillColor()).isEqualTo("#E3F2FD");
            assertThat(newDto.strokeWidth()).isEqualTo(2.5);
            assertThat(newDto.defaultSize()).isEqualTo(size);
            assertThat(newDto.iconSvg()).contains("svg");
            assertThat(newDto.sortOrder()).isEqualTo(5);
        }
    }

    @Nested
    @DisplayName("ID Accessor Tests")
    class IdAccessorTests {

        @Test
        @DisplayName("Should return correct ID")
        void shouldReturnCorrectId() {
            // Assert
            assertThat(dto.id()).isEqualTo(testId);
        }

        @Test
        @DisplayName("Should handle null ID")
        void shouldHandleNullId() {
            // Arrange
            BpmnElementTypeDTO nullIdDto = BpmnElementTypeDTO.builder()
                    .id(null)
                    .code("bpmn:Task")
                    .name("Task")
                    .category("task")
                    .strokeColor("#1E88E5")
                    .fillColor("#FFFFFF")
                    .strokeWidth(2.0)
                    .sortOrder(0)
                    .build();

            // Assert
            assertThat(nullIdDto.id()).isNull();
        }

        @Test
        @DisplayName("Should return different IDs for different DTOs")
        void shouldReturnDifferentIdsForDifferentDtos() {
            // Arrange
            UUID id1 = UUID.randomUUID();
            UUID id2 = UUID.randomUUID();

            BpmnElementTypeDTO dto1 = BpmnElementTypeDTO.builder().id(id1).code("code1").name("name1")
                    .category("cat").strokeColor("#000000").fillColor("#FFFFFF").strokeWidth(1.0).sortOrder(0).build();
            BpmnElementTypeDTO dto2 = BpmnElementTypeDTO.builder().id(id2).code("code2").name("name2")
                    .category("cat").strokeColor("#000000").fillColor("#FFFFFF").strokeWidth(1.0).sortOrder(0).build();

            // Assert
            assertThat(dto1.id()).isNotEqualTo(dto2.id());
        }
    }

    @Nested
    @DisplayName("Code Accessor Tests")
    class CodeAccessorTests {

        @Test
        @DisplayName("Should return correct code")
        void shouldReturnCorrectCode() {
            // Assert
            assertThat(dto.code()).isEqualTo("bpmn:Task");
        }

        @Test
        @DisplayName("Should handle BPMN task codes")
        void shouldHandleBpmnTaskCodes() {
            // Arrange
            String[] codes = {"bpmn:Task", "bpmn:UserTask", "bpmn:ServiceTask", "bpmn:ScriptTask"};

            for (String code : codes) {
                // Act
                BpmnElementTypeDTO newDto = BpmnElementTypeDTO.builder()
                        .code(code)
                        .name("Test")
                        .category("task")
                        .strokeColor("#000000")
                        .fillColor("#FFFFFF")
                        .strokeWidth(1.0)
                        .sortOrder(0)
                        .build();

                // Assert
                assertThat(newDto.code()).isEqualTo(code);
            }
        }

        @Test
        @DisplayName("Should handle BPMN event codes")
        void shouldHandleBpmnEventCodes() {
            // Arrange
            String[] codes = {"bpmn:StartEvent", "bpmn:EndEvent", "bpmn:IntermediateThrowEvent"};

            for (String code : codes) {
                // Act
                BpmnElementTypeDTO newDto = BpmnElementTypeDTO.builder()
                        .code(code)
                        .name("Test")
                        .category("event")
                        .strokeColor("#000000")
                        .fillColor("#FFFFFF")
                        .strokeWidth(1.0)
                        .sortOrder(0)
                        .build();

                // Assert
                assertThat(newDto.code()).isEqualTo(code);
            }
        }

        @Test
        @DisplayName("Should handle BPMN gateway codes")
        void shouldHandleBpmnGatewayCodes() {
            // Arrange
            String[] codes = {"bpmn:ExclusiveGateway", "bpmn:ParallelGateway", "bpmn:InclusiveGateway"};

            for (String code : codes) {
                // Act
                BpmnElementTypeDTO newDto = BpmnElementTypeDTO.builder()
                        .code(code)
                        .name("Test")
                        .category("gateway")
                        .strokeColor("#000000")
                        .fillColor("#FFFFFF")
                        .strokeWidth(1.0)
                        .sortOrder(0)
                        .build();

                // Assert
                assertThat(newDto.code()).isEqualTo(code);
            }
        }
    }

    @Nested
    @DisplayName("Name Accessor Tests")
    class NameAccessorTests {

        @Test
        @DisplayName("Should return correct name")
        void shouldReturnCorrectName() {
            // Assert
            assertThat(dto.name()).isEqualTo("Task");
        }

        @Test
        @DisplayName("Should handle names with special characters")
        void shouldHandleNamesWithSpecialCharacters() {
            // Arrange
            BpmnElementTypeDTO newDto = BpmnElementTypeDTO.builder()
                    .code("bpmn:Task")
                    .name("Task (Multi-Instance)")
                    .category("task")
                    .strokeColor("#000000")
                    .fillColor("#FFFFFF")
                    .strokeWidth(1.0)
                    .sortOrder(0)
                    .build();

            // Assert
            assertThat(newDto.name()).isEqualTo("Task (Multi-Instance)");
        }

        @Test
        @DisplayName("Should handle names with unicode characters")
        void shouldHandleNamesWithUnicodeCharacters() {
            // Arrange
            BpmnElementTypeDTO newDto = BpmnElementTypeDTO.builder()
                    .code("bpmn:Task")
                    .name("Tarea del Usuario")
                    .category("task")
                    .strokeColor("#000000")
                    .fillColor("#FFFFFF")
                    .strokeWidth(1.0)
                    .sortOrder(0)
                    .build();

            // Assert
            assertThat(newDto.name()).isEqualTo("Tarea del Usuario");
        }
    }

    @Nested
    @DisplayName("Category Accessor Tests")
    class CategoryAccessorTests {

        @Test
        @DisplayName("Should return correct category")
        void shouldReturnCorrectCategory() {
            // Assert
            assertThat(dto.category()).isEqualTo("task");
        }

        @Test
        @DisplayName("Should handle all BPMN categories")
        void shouldHandleAllBpmnCategories() {
            // Arrange
            String[] categories = {"task", "event", "gateway", "data", "artifact", "flow"};

            for (String category : categories) {
                // Act
                BpmnElementTypeDTO newDto = BpmnElementTypeDTO.builder()
                        .code("bpmn:Test")
                        .name("Test")
                        .category(category)
                        .strokeColor("#000000")
                        .fillColor("#FFFFFF")
                        .strokeWidth(1.0)
                        .sortOrder(0)
                        .build();

                // Assert
                assertThat(newDto.category()).isEqualTo(category);
            }
        }
    }

    @Nested
    @DisplayName("SubCategory Accessor Tests")
    class SubCategoryAccessorTests {

        @Test
        @DisplayName("Should return correct sub-category")
        void shouldReturnCorrectSubCategory() {
            // Assert
            assertThat(dto.subCategory()).isEqualTo("user");
        }

        @Test
        @DisplayName("Should handle null sub-category")
        void shouldHandleNullSubCategory() {
            // Arrange
            BpmnElementTypeDTO newDto = BpmnElementTypeDTO.builder()
                    .code("bpmn:Task")
                    .name("Task")
                    .category("task")
                    .subCategory(null)
                    .strokeColor("#000000")
                    .fillColor("#FFFFFF")
                    .strokeWidth(1.0)
                    .sortOrder(0)
                    .build();

            // Assert
            assertThat(newDto.subCategory()).isNull();
        }

        @Test
        @DisplayName("Should handle event sub-categories")
        void shouldHandleEventSubCategories() {
            // Arrange
            String[] subCategories = {"start", "end", "intermediate"};

            for (String subCategory : subCategories) {
                // Act
                BpmnElementTypeDTO newDto = BpmnElementTypeDTO.builder()
                        .code("bpmn:Event")
                        .name("Event")
                        .category("event")
                        .subCategory(subCategory)
                        .strokeColor("#000000")
                        .fillColor("#FFFFFF")
                        .strokeWidth(1.0)
                        .sortOrder(0)
                        .build();

                // Assert
                assertThat(newDto.subCategory()).isEqualTo(subCategory);
            }
        }
    }

    @Nested
    @DisplayName("Color Accessor Tests")
    class ColorAccessorTests {

        @Test
        @DisplayName("Should return correct stroke color")
        void shouldReturnCorrectStrokeColor() {
            // Assert
            assertThat(dto.strokeColor()).isEqualTo("#1E88E5");
        }

        @Test
        @DisplayName("Should return correct fill color")
        void shouldReturnCorrectFillColor() {
            // Assert
            assertThat(dto.fillColor()).isEqualTo("#FFFFFF");
        }

        @Test
        @DisplayName("Should handle valid hex color format")
        void shouldHandleValidHexColorFormat() {
            // Arrange
            BpmnElementTypeDTO newDto = BpmnElementTypeDTO.builder()
                    .code("bpmn:Task")
                    .name("Task")
                    .category("task")
                    .strokeColor("#FF5722")
                    .fillColor("#FBE9E7")
                    .strokeWidth(1.0)
                    .sortOrder(0)
                    .build();

            // Assert
            assertThat(newDto.strokeColor()).startsWith("#");
            assertThat(newDto.strokeColor()).hasSize(7);
            assertThat(newDto.fillColor()).startsWith("#");
            assertThat(newDto.fillColor()).hasSize(7);
        }

        @Test
        @DisplayName("Should handle lowercase hex colors")
        void shouldHandleLowercaseHexColors() {
            // Arrange
            BpmnElementTypeDTO newDto = BpmnElementTypeDTO.builder()
                    .code("bpmn:Task")
                    .name("Task")
                    .category("task")
                    .strokeColor("#ff5722")
                    .fillColor("#fbe9e7")
                    .strokeWidth(1.0)
                    .sortOrder(0)
                    .build();

            // Assert
            assertThat(newDto.strokeColor()).isEqualTo("#ff5722");
            assertThat(newDto.fillColor()).isEqualTo("#fbe9e7");
        }
    }

    @Nested
    @DisplayName("Stroke Width Accessor Tests")
    class StrokeWidthAccessorTests {

        @Test
        @DisplayName("Should return correct stroke width")
        void shouldReturnCorrectStrokeWidth() {
            // Assert
            assertThat(dto.strokeWidth()).isEqualTo(2.0);
        }

        @Test
        @DisplayName("Should handle different stroke widths")
        void shouldHandleDifferentStrokeWidths() {
            // Arrange
            Double[] widths = {0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 5.0};

            for (Double width : widths) {
                // Act
                BpmnElementTypeDTO newDto = BpmnElementTypeDTO.builder()
                        .code("bpmn:Task")
                        .name("Task")
                        .category("task")
                        .strokeColor("#000000")
                        .fillColor("#FFFFFF")
                        .strokeWidth(width)
                        .sortOrder(0)
                        .build();

                // Assert
                assertThat(newDto.strokeWidth()).isEqualTo(width);
            }
        }

        @Test
        @DisplayName("Should handle null stroke width")
        void shouldHandleNullStrokeWidth() {
            // Arrange
            BpmnElementTypeDTO newDto = BpmnElementTypeDTO.builder()
                    .code("bpmn:Task")
                    .name("Task")
                    .category("task")
                    .strokeColor("#000000")
                    .fillColor("#FFFFFF")
                    .strokeWidth(null)
                    .sortOrder(0)
                    .build();

            // Assert
            assertThat(newDto.strokeWidth()).isNull();
        }
    }

    @Nested
    @DisplayName("Default Size Accessor Tests")
    class DefaultSizeAccessorTests {

        @Test
        @DisplayName("Should return correct default size")
        void shouldReturnCorrectDefaultSize() {
            // Assert
            assertThat(dto.defaultSize()).isNotNull();
            assertThat(dto.defaultSize().width()).isEqualTo(100);
            assertThat(dto.defaultSize().height()).isEqualTo(80);
        }

        @Test
        @DisplayName("Should handle null default size")
        void shouldHandleNullDefaultSize() {
            // Arrange
            BpmnElementTypeDTO newDto = BpmnElementTypeDTO.builder()
                    .code("bpmn:Task")
                    .name("Task")
                    .category("task")
                    .strokeColor("#000000")
                    .fillColor("#FFFFFF")
                    .strokeWidth(1.0)
                    .defaultSize(null)
                    .sortOrder(0)
                    .build();

            // Assert
            assertThat(newDto.defaultSize()).isNull();
        }

        @Test
        @DisplayName("Should handle typical task dimensions")
        void shouldHandleTypicalTaskDimensions() {
            // Arrange
            BpmnElementTypeDTO.ElementSizeDTO size = BpmnElementTypeDTO.ElementSizeDTO.builder()
                    .width(100)
                    .height(80)
                    .build();

            // Act
            BpmnElementTypeDTO newDto = BpmnElementTypeDTO.builder()
                    .code("bpmn:Task")
                    .name("Task")
                    .category("task")
                    .strokeColor("#000000")
                    .fillColor("#FFFFFF")
                    .strokeWidth(1.0)
                    .defaultSize(size)
                    .sortOrder(0)
                    .build();

            // Assert
            assertThat(newDto.defaultSize().width()).isEqualTo(100);
            assertThat(newDto.defaultSize().height()).isEqualTo(80);
        }

        @Test
        @DisplayName("Should handle typical event dimensions")
        void shouldHandleTypicalEventDimensions() {
            // Arrange
            BpmnElementTypeDTO.ElementSizeDTO size = BpmnElementTypeDTO.ElementSizeDTO.builder()
                    .width(36)
                    .height(36)
                    .build();

            // Act
            BpmnElementTypeDTO newDto = BpmnElementTypeDTO.builder()
                    .code("bpmn:StartEvent")
                    .name("Start Event")
                    .category("event")
                    .strokeColor("#000000")
                    .fillColor("#FFFFFF")
                    .strokeWidth(1.0)
                    .defaultSize(size)
                    .sortOrder(0)
                    .build();

            // Assert
            assertThat(newDto.defaultSize().width()).isEqualTo(36);
            assertThat(newDto.defaultSize().height()).isEqualTo(36);
        }

        @Test
        @DisplayName("Should handle typical gateway dimensions")
        void shouldHandleTypicalGatewayDimensions() {
            // Arrange
            BpmnElementTypeDTO.ElementSizeDTO size = BpmnElementTypeDTO.ElementSizeDTO.builder()
                    .width(50)
                    .height(50)
                    .build();

            // Act
            BpmnElementTypeDTO newDto = BpmnElementTypeDTO.builder()
                    .code("bpmn:ExclusiveGateway")
                    .name("Exclusive Gateway")
                    .category("gateway")
                    .strokeColor("#000000")
                    .fillColor("#FFFFFF")
                    .strokeWidth(1.0)
                    .defaultSize(size)
                    .sortOrder(0)
                    .build();

            // Assert
            assertThat(newDto.defaultSize().width()).isEqualTo(50);
            assertThat(newDto.defaultSize().height()).isEqualTo(50);
        }
    }

    @Nested
    @DisplayName("Icon SVG Accessor Tests")
    class IconSvgAccessorTests {

        @Test
        @DisplayName("Should return correct icon SVG")
        void shouldReturnCorrectIconSvg() {
            // Assert
            assertThat(dto.iconSvg()).isEqualTo("<svg></svg>");
        }

        @Test
        @DisplayName("Should handle null icon SVG")
        void shouldHandleNullIconSvg() {
            // Arrange
            BpmnElementTypeDTO newDto = BpmnElementTypeDTO.builder()
                    .code("bpmn:Task")
                    .name("Task")
                    .category("task")
                    .strokeColor("#000000")
                    .fillColor("#FFFFFF")
                    .strokeWidth(1.0)
                    .iconSvg(null)
                    .sortOrder(0)
                    .build();

            // Assert
            assertThat(newDto.iconSvg()).isNull();
        }

        @Test
        @DisplayName("Should handle complex SVG content")
        void shouldHandleComplexSvgContent() {
            // Arrange
            String svg = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><path d=\"M12 2L2 7l10 5 10-5-10-5z\" fill=\"currentColor\"/></svg>";

            // Act
            BpmnElementTypeDTO newDto = BpmnElementTypeDTO.builder()
                    .code("bpmn:Task")
                    .name("Task")
                    .category("task")
                    .strokeColor("#000000")
                    .fillColor("#FFFFFF")
                    .strokeWidth(1.0)
                    .iconSvg(svg)
                    .sortOrder(0)
                    .build();

            // Assert
            assertThat(newDto.iconSvg()).contains("xmlns");
            assertThat(newDto.iconSvg()).contains("viewBox");
            assertThat(newDto.iconSvg()).contains("currentColor");
        }
    }

    @Nested
    @DisplayName("Sort Order Accessor Tests")
    class SortOrderAccessorTests {

        @Test
        @DisplayName("Should return correct sort order")
        void shouldReturnCorrectSortOrder() {
            // Assert
            assertThat(dto.sortOrder()).isEqualTo(1);
        }

        @Test
        @DisplayName("Should handle zero sort order")
        void shouldHandleZeroSortOrder() {
            // Arrange
            BpmnElementTypeDTO newDto = BpmnElementTypeDTO.builder()
                    .code("bpmn:Task")
                    .name("Task")
                    .category("task")
                    .strokeColor("#000000")
                    .fillColor("#FFFFFF")
                    .strokeWidth(1.0)
                    .sortOrder(0)
                    .build();

            // Assert
            assertThat(newDto.sortOrder()).isEqualTo(0);
        }

        @Test
        @DisplayName("Should handle large sort order")
        void shouldHandleLargeSortOrder() {
            // Arrange
            BpmnElementTypeDTO newDto = BpmnElementTypeDTO.builder()
                    .code("bpmn:Task")
                    .name("Task")
                    .category("task")
                    .strokeColor("#000000")
                    .fillColor("#FFFFFF")
                    .strokeWidth(1.0)
                    .sortOrder(999)
                    .build();

            // Assert
            assertThat(newDto.sortOrder()).isEqualTo(999);
        }

        @Test
        @DisplayName("Should handle null sort order")
        void shouldHandleNullSortOrder() {
            // Arrange
            BpmnElementTypeDTO newDto = BpmnElementTypeDTO.builder()
                    .code("bpmn:Task")
                    .name("Task")
                    .category("task")
                    .strokeColor("#000000")
                    .fillColor("#FFFFFF")
                    .strokeWidth(1.0)
                    .sortOrder(null)
                    .build();

            // Assert
            assertThat(newDto.sortOrder()).isNull();
        }
    }

    @Nested
    @DisplayName("Record Equality Tests")
    class EqualityTests {

        @Test
        @DisplayName("Should be equal to identical DTO")
        void shouldBeEqualToIdenticalDto() {
            // Arrange
            BpmnElementTypeDTO dto1 = BpmnElementTypeDTO.builder()
                    .id(testId)
                    .code("bpmn:Task")
                    .name("Task")
                    .category("task")
                    .strokeColor("#1E88E5")
                    .fillColor("#FFFFFF")
                    .strokeWidth(2.0)
                    .sortOrder(0)
                    .build();

            BpmnElementTypeDTO dto2 = BpmnElementTypeDTO.builder()
                    .id(testId)
                    .code("bpmn:Task")
                    .name("Task")
                    .category("task")
                    .strokeColor("#1E88E5")
                    .fillColor("#FFFFFF")
                    .strokeWidth(2.0)
                    .sortOrder(0)
                    .build();

            // Assert
            assertThat(dto1).isEqualTo(dto2);
        }

        @Test
        @DisplayName("Should not be equal to different DTO")
        void shouldNotBeEqualToDifferentDto() {
            // Arrange
            BpmnElementTypeDTO dto1 = BpmnElementTypeDTO.builder()
                    .id(UUID.randomUUID())
                    .code("bpmn:Task")
                    .name("Task")
                    .category("task")
                    .strokeColor("#1E88E5")
                    .fillColor("#FFFFFF")
                    .strokeWidth(2.0)
                    .sortOrder(0)
                    .build();

            BpmnElementTypeDTO dto2 = BpmnElementTypeDTO.builder()
                    .id(UUID.randomUUID())
                    .code("bpmn:StartEvent")
                    .name("Start Event")
                    .category("event")
                    .strokeColor("#43A047")
                    .fillColor("#E8F5E9")
                    .strokeWidth(2.0)
                    .sortOrder(1)
                    .build();

            // Assert
            assertThat(dto1).isNotEqualTo(dto2);
        }

        @Test
        @DisplayName("Should not be equal to null")
        void shouldNotBeEqualToNull() {
            // Assert
            assertThat(dto).isNotEqualTo(null);
        }

        @Test
        @DisplayName("Should have consistent hashCode for equal objects")
        void shouldHaveConsistentHashCodeForEqualObjects() {
            // Arrange
            BpmnElementTypeDTO dto1 = BpmnElementTypeDTO.builder()
                    .id(testId)
                    .code("bpmn:Task")
                    .name("Task")
                    .category("task")
                    .strokeColor("#1E88E5")
                    .fillColor("#FFFFFF")
                    .strokeWidth(2.0)
                    .sortOrder(0)
                    .build();

            BpmnElementTypeDTO dto2 = BpmnElementTypeDTO.builder()
                    .id(testId)
                    .code("bpmn:Task")
                    .name("Task")
                    .category("task")
                    .strokeColor("#1E88E5")
                    .fillColor("#FFFFFF")
                    .strokeWidth(2.0)
                    .sortOrder(0)
                    .build();

            // Assert
            assertThat(dto1.hashCode()).isEqualTo(dto2.hashCode());
        }
    }

    @Nested
    @DisplayName("Record toString Tests")
    class ToStringTests {

        @Test
        @DisplayName("Should have meaningful toString representation")
        void shouldHaveMeaningfulToStringRepresentation() {
            // Arrange & Act
            String toString = dto.toString();

            // Assert
            assertThat(toString).contains("BpmnElementTypeDTO");
            assertThat(toString).contains("bpmn:Task");
            assertThat(toString).contains("task");
        }

        @Test
        @DisplayName("Should include all field values in toString")
        void shouldIncludeAllFieldValuesInToString() {
            // Arrange & Act
            String toString = dto.toString();

            // Assert
            assertThat(toString).contains("code=bpmn:Task");
            assertThat(toString).contains("name=Task");
            assertThat(toString).contains("category=task");
        }
    }

    @Nested
    @DisplayName("ElementSizeDTO Tests")
    class ElementSizeDTOTests {

        @Test
        @DisplayName("Should create ElementSizeDTO using builder")
        void shouldCreateElementSizeDtoUsingBuilder() {
            // Arrange & Act
            BpmnElementTypeDTO.ElementSizeDTO size = BpmnElementTypeDTO.ElementSizeDTO.builder()
                    .width(100)
                    .height(80)
                    .build();

            // Assert
            assertThat(size).isNotNull();
            assertThat(size.width()).isEqualTo(100);
            assertThat(size.height()).isEqualTo(80);
        }

        @Test
        @DisplayName("Should create ElementSizeDTO using canonical constructor")
        void shouldCreateElementSizeDtoUsingCanonicalConstructor() {
            // Arrange & Act
            BpmnElementTypeDTO.ElementSizeDTO size = new BpmnElementTypeDTO.ElementSizeDTO(100, 80);

            // Assert
            assertThat(size.width()).isEqualTo(100);
            assertThat(size.height()).isEqualTo(80);
        }

        @Test
        @DisplayName("Should handle null width in ElementSizeDTO")
        void shouldHandleNullWidthInElementSizeDto() {
            // Arrange & Act
            BpmnElementTypeDTO.ElementSizeDTO size = BpmnElementTypeDTO.ElementSizeDTO.builder()
                    .width(null)
                    .height(80)
                    .build();

            // Assert
            assertThat(size.width()).isNull();
            assertThat(size.height()).isEqualTo(80);
        }

        @Test
        @DisplayName("Should handle null height in ElementSizeDTO")
        void shouldHandleNullHeightInElementSizeDto() {
            // Arrange & Act
            BpmnElementTypeDTO.ElementSizeDTO size = BpmnElementTypeDTO.ElementSizeDTO.builder()
                    .width(100)
                    .height(null)
                    .build();

            // Assert
            assertThat(size.width()).isEqualTo(100);
            assertThat(size.height()).isNull();
        }

        @Test
        @DisplayName("Should ElementSizeDTO be equal for same dimensions")
        void shouldElementSizeDtoBeEqualForSameDimensions() {
            // Arrange
            BpmnElementTypeDTO.ElementSizeDTO size1 = BpmnElementTypeDTO.ElementSizeDTO.builder()
                    .width(100)
                    .height(80)
                    .build();

            BpmnElementTypeDTO.ElementSizeDTO size2 = BpmnElementTypeDTO.ElementSizeDTO.builder()
                    .width(100)
                    .height(80)
                    .build();

            // Assert
            assertThat(size1).isEqualTo(size2);
            assertThat(size1.hashCode()).isEqualTo(size2.hashCode());
        }

        @Test
        @DisplayName("Should ElementSizeDTO not be equal for different dimensions")
        void shouldElementSizeDtoNotBeEqualForDifferentDimensions() {
            // Arrange
            BpmnElementTypeDTO.ElementSizeDTO size1 = BpmnElementTypeDTO.ElementSizeDTO.builder()
                    .width(100)
                    .height(80)
                    .build();

            BpmnElementTypeDTO.ElementSizeDTO size2 = BpmnElementTypeDTO.ElementSizeDTO.builder()
                    .width(50)
                    .height(50)
                    .build();

            // Assert
            assertThat(size1).isNotEqualTo(size2);
        }

        @Test
        @DisplayName("Should ElementSizeDTO have meaningful toString")
        void shouldElementSizeDtoHaveMeaningfulToString() {
            // Arrange
            BpmnElementTypeDTO.ElementSizeDTO size = BpmnElementTypeDTO.ElementSizeDTO.builder()
                    .width(100)
                    .height(80)
                    .build();

            // Act
            String toString = size.toString();

            // Assert
            assertThat(toString).contains("100");
            assertThat(toString).contains("80");
        }
    }

    @Nested
    @DisplayName("Immutability Tests")
    class ImmutabilityTests {

        @Test
        @DisplayName("Should be immutable - cannot modify after creation")
        void shouldBeImmutable() {
            // Arrange
            BpmnElementTypeDTO originalDto = BpmnElementTypeDTO.builder()
                    .id(testId)
                    .code("bpmn:Task")
                    .name("Task")
                    .category("task")
                    .strokeColor("#1E88E5")
                    .fillColor("#FFFFFF")
                    .strokeWidth(2.0)
                    .sortOrder(0)
                    .build();

            // Assert - record fields are final and cannot be modified
            assertThat(originalDto.code()).isEqualTo("bpmn:Task");
            // No setter methods exist on records
        }

        @Test
        @DisplayName("Should create new instance when values change")
        void shouldCreateNewInstanceWhenValuesChange() {
            // Arrange
            BpmnElementTypeDTO originalDto = BpmnElementTypeDTO.builder()
                    .id(testId)
                    .code("bpmn:Task")
                    .name("Task")
                    .category("task")
                    .strokeColor("#1E88E5")
                    .fillColor("#FFFFFF")
                    .strokeWidth(2.0)
                    .sortOrder(0)
                    .build();

            // Act
            BpmnElementTypeDTO modifiedDto = BpmnElementTypeDTO.builder()
                    .id(testId)
                    .code("bpmn:UserTask")
                    .name("User Task")
                    .category("task")
                    .strokeColor("#1E88E5")
                    .fillColor("#FFFFFF")
                    .strokeWidth(2.0)
                    .sortOrder(0)
                    .build();

            // Assert
            assertThat(originalDto).isNotSameAs(modifiedDto);
            assertThat(originalDto.code()).isEqualTo("bpmn:Task");
            assertThat(modifiedDto.code()).isEqualTo("bpmn:UserTask");
        }
    }
}
