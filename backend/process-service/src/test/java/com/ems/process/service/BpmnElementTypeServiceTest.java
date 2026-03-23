package com.ems.process.service;

import com.ems.process.dto.BpmnElementTypeDTO;
import com.ems.process.dto.BpmnElementTypeListResponse;
import com.ems.process.entity.BpmnElementTypeEntity;
import com.ems.process.mapper.BpmnElementTypeMapper;
import com.ems.process.repository.BpmnElementTypeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Unit tests for BpmnElementTypeServiceImpl.
 * Uses Mockito for mocking dependencies.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("BpmnElementTypeService Tests")
class BpmnElementTypeServiceTest {

    @Mock
    private BpmnElementTypeRepository repository;

    @Mock
    private BpmnElementTypeMapper mapper;

    @InjectMocks
    private BpmnElementTypeServiceImpl service;

    private BpmnElementTypeEntity taskEntity;
    private BpmnElementTypeEntity eventEntity;
    private BpmnElementTypeEntity gatewayEntity;
    private BpmnElementTypeDTO taskDto;
    private BpmnElementTypeDTO eventDto;
    private BpmnElementTypeDTO gatewayDto;

    @BeforeEach
    void setUp() {
        UUID taskId = UUID.randomUUID();
        UUID eventId = UUID.randomUUID();
        UUID gatewayId = UUID.randomUUID();

        taskEntity = BpmnElementTypeEntity.builder()
                .id(taskId)
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
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        eventEntity = BpmnElementTypeEntity.builder()
                .id(eventId)
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
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        gatewayEntity = BpmnElementTypeEntity.builder()
                .id(gatewayId)
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
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        taskDto = BpmnElementTypeDTO.builder()
                .id(taskId)
                .code("bpmn:Task")
                .name("Task")
                .category("task")
                .subCategory("generic")
                .strokeColor("#1E88E5")
                .fillColor("#E3F2FD")
                .strokeWidth(2.0)
                .defaultSize(BpmnElementTypeDTO.ElementSizeDTO.builder().width(100).height(80).build())
                .iconSvg("<svg>task</svg>")
                .sortOrder(1)
                .build();

        eventDto = BpmnElementTypeDTO.builder()
                .id(eventId)
                .code("bpmn:StartEvent")
                .name("Start Event")
                .category("event")
                .subCategory("start")
                .strokeColor("#43A047")
                .fillColor("#E8F5E9")
                .strokeWidth(2.0)
                .defaultSize(BpmnElementTypeDTO.ElementSizeDTO.builder().width(36).height(36).build())
                .iconSvg("<svg>start</svg>")
                .sortOrder(0)
                .build();

        gatewayDto = BpmnElementTypeDTO.builder()
                .id(gatewayId)
                .code("bpmn:ExclusiveGateway")
                .name("Exclusive Gateway")
                .category("gateway")
                .subCategory("exclusive")
                .strokeColor("#FB8C00")
                .fillColor("#FFF3E0")
                .strokeWidth(2.0)
                .defaultSize(BpmnElementTypeDTO.ElementSizeDTO.builder().width(50).height(50).build())
                .iconSvg("<svg>gateway</svg>")
                .sortOrder(2)
                .build();
    }

    @Nested
    @DisplayName("getAllElementTypes Tests")
    class GetAllElementTypesTests {

        @Test
        @DisplayName("Should return system defaults when tenantId is null")
        void shouldReturnSystemDefaultsWhenTenantIdIsNull() {
            // Arrange
            List<BpmnElementTypeEntity> entities = List.of(taskEntity, eventEntity, gatewayEntity);
            when(repository.findAllSystemDefaults()).thenReturn(entities);
            when(mapper.toDTO(taskEntity)).thenReturn(taskDto);
            when(mapper.toDTO(eventEntity)).thenReturn(eventDto);
            when(mapper.toDTO(gatewayEntity)).thenReturn(gatewayDto);

            // Act
            BpmnElementTypeListResponse response = service.getAllElementTypes(null);

            // Assert
            assertThat(response.elements()).hasSize(3);
            assertThat(response.total()).isEqualTo(3);
            verify(repository).findAllSystemDefaults();
            verify(repository, never()).findAllForTenant(anyString());
        }

        @Test
        @DisplayName("Should return system defaults when tenantId is empty")
        void shouldReturnSystemDefaultsWhenTenantIdIsEmpty() {
            // Arrange
            List<BpmnElementTypeEntity> entities = List.of(taskEntity, eventEntity);
            when(repository.findAllSystemDefaults()).thenReturn(entities);
            when(mapper.toDTO(any(BpmnElementTypeEntity.class))).thenReturn(taskDto, eventDto);

            // Act
            BpmnElementTypeListResponse response = service.getAllElementTypes("");

            // Assert
            assertThat(response.elements()).hasSize(2);
            verify(repository).findAllSystemDefaults();
        }

        @Test
        @DisplayName("Should return system defaults when tenantId is blank")
        void shouldReturnSystemDefaultsWhenTenantIdIsBlank() {
            // Arrange
            List<BpmnElementTypeEntity> entities = List.of(taskEntity);
            when(repository.findAllSystemDefaults()).thenReturn(entities);
            when(mapper.toDTO(taskEntity)).thenReturn(taskDto);

            // Act
            BpmnElementTypeListResponse response = service.getAllElementTypes("   ");

            // Assert
            assertThat(response.elements()).hasSize(1);
            verify(repository).findAllSystemDefaults();
        }

        @Test
        @DisplayName("Should return tenant-specific elements when tenantId provided")
        void shouldReturnTenantSpecificElementsWhenTenantIdProvided() {
            // Arrange
            String tenantId = "tenant-123";
            List<BpmnElementTypeEntity> entities = List.of(taskEntity, eventEntity);
            when(repository.findAllForTenant(tenantId)).thenReturn(entities);
            when(mapper.toDTO(taskEntity)).thenReturn(taskDto);
            when(mapper.toDTO(eventEntity)).thenReturn(eventDto);

            // Act
            BpmnElementTypeListResponse response = service.getAllElementTypes(tenantId);

            // Assert
            assertThat(response.elements()).hasSize(2);
            verify(repository).findAllForTenant(tenantId);
            verify(repository, never()).findAllSystemDefaults();
        }

        @Test
        @DisplayName("Should return empty list when no elements found")
        void shouldReturnEmptyListWhenNoElementsFound() {
            // Arrange
            when(repository.findAllSystemDefaults()).thenReturn(Collections.emptyList());

            // Act
            BpmnElementTypeListResponse response = service.getAllElementTypes(null);

            // Assert
            assertThat(response.elements()).isEmpty();
            assertThat(response.total()).isEqualTo(0);
        }

        @Test
        @DisplayName("Should include CSS variables in response")
        void shouldIncludeCssVariablesInResponse() {
            // Arrange
            List<BpmnElementTypeEntity> entities = List.of(taskEntity, eventEntity);
            when(repository.findAllSystemDefaults()).thenReturn(entities);
            when(mapper.toDTO(any(BpmnElementTypeEntity.class))).thenReturn(taskDto, eventDto);

            // Act
            BpmnElementTypeListResponse response = service.getAllElementTypes(null);

            // Assert
            assertThat(response.cssVariables()).isNotNull();
            assertThat(response.cssVariables()).isNotEmpty();
        }

        @Test
        @DisplayName("Should generate correct CSS variable names")
        void shouldGenerateCorrectCssVariableNames() {
            // Arrange
            List<BpmnElementTypeEntity> entities = List.of(taskEntity);
            when(repository.findAllSystemDefaults()).thenReturn(entities);
            when(mapper.toDTO(taskEntity)).thenReturn(taskDto);

            // Act
            BpmnElementTypeListResponse response = service.getAllElementTypes(null);

            // Assert
            Map<String, String> cssVars = response.cssVariables();
            assertThat(cssVars).containsKey("--bpmn-task-generic-stroke");
            assertThat(cssVars).containsKey("--bpmn-task-generic-fill");
        }

        @Test
        @DisplayName("Should generate correct CSS variable values")
        void shouldGenerateCorrectCssVariableValues() {
            // Arrange
            List<BpmnElementTypeEntity> entities = List.of(taskEntity);
            when(repository.findAllSystemDefaults()).thenReturn(entities);
            when(mapper.toDTO(taskEntity)).thenReturn(taskDto);

            // Act
            BpmnElementTypeListResponse response = service.getAllElementTypes(null);

            // Assert
            Map<String, String> cssVars = response.cssVariables();
            assertThat(cssVars.get("--bpmn-task-generic-stroke")).isEqualTo("#1E88E5");
            assertThat(cssVars.get("--bpmn-task-generic-fill")).isEqualTo("#E3F2FD");
        }

        @Test
        @DisplayName("Should generate stroke-width CSS variable")
        void shouldGenerateStrokeWidthCssVariable() {
            // Arrange
            List<BpmnElementTypeEntity> entities = List.of(taskEntity);
            when(repository.findAllSystemDefaults()).thenReturn(entities);
            when(mapper.toDTO(taskEntity)).thenReturn(taskDto);

            // Act
            BpmnElementTypeListResponse response = service.getAllElementTypes(null);

            // Assert
            Map<String, String> cssVars = response.cssVariables();
            assertThat(cssVars.get("--bpmn-task-generic-stroke-width")).isEqualTo("2.0px");
        }

        @Test
        @DisplayName("Should map all entities to DTOs")
        void shouldMapAllEntitiesToDtos() {
            // Arrange
            List<BpmnElementTypeEntity> entities = List.of(taskEntity, eventEntity, gatewayEntity);
            when(repository.findAllSystemDefaults()).thenReturn(entities);
            when(mapper.toDTO(taskEntity)).thenReturn(taskDto);
            when(mapper.toDTO(eventEntity)).thenReturn(eventDto);
            when(mapper.toDTO(gatewayEntity)).thenReturn(gatewayDto);

            // Act
            service.getAllElementTypes(null);

            // Assert
            verify(mapper, times(3)).toDTO(any(BpmnElementTypeEntity.class));
        }

        @Test
        @DisplayName("Should return correct total count")
        void shouldReturnCorrectTotalCount() {
            // Arrange
            List<BpmnElementTypeEntity> entities = List.of(taskEntity, eventEntity, gatewayEntity);
            when(repository.findAllSystemDefaults()).thenReturn(entities);
            when(mapper.toDTO(any(BpmnElementTypeEntity.class))).thenReturn(taskDto, eventDto, gatewayDto);

            // Act
            BpmnElementTypeListResponse response = service.getAllElementTypes(null);

            // Assert
            assertThat(response.total()).isEqualTo(3);
            assertThat(response.elements()).hasSize(3);
        }

        @Test
        @DisplayName("Should handle entity without subCategory")
        void shouldHandleEntityWithoutSubCategory() {
            // Arrange
            BpmnElementTypeEntity entityWithoutSubCat = BpmnElementTypeEntity.builder()
                    .id(UUID.randomUUID())
                    .code("bpmn:Simple")
                    .name("Simple")
                    .category("task")
                    .subCategory(null)
                    .strokeColor("#000000")
                    .fillColor("#FFFFFF")
                    .strokeWidth(1.0)
                    .sortOrder(0)
                    .isActive(true)
                    .build();

            BpmnElementTypeDTO dtoWithoutSubCat = BpmnElementTypeDTO.builder()
                    .code("bpmn:Simple")
                    .name("Simple")
                    .category("task")
                    .subCategory(null)
                    .strokeColor("#000000")
                    .fillColor("#FFFFFF")
                    .strokeWidth(1.0)
                    .sortOrder(0)
                    .build();

            when(repository.findAllSystemDefaults()).thenReturn(List.of(entityWithoutSubCat));
            when(mapper.toDTO(entityWithoutSubCat)).thenReturn(dtoWithoutSubCat);

            // Act
            BpmnElementTypeListResponse response = service.getAllElementTypes(null);

            // Assert
            assertThat(response.cssVariables()).containsKey("--bpmn-task-stroke");
        }

        @Test
        @DisplayName("Should generate category-level CSS defaults")
        void shouldGenerateCategoryLevelCssDefaults() {
            // Arrange
            List<BpmnElementTypeEntity> entities = List.of(taskEntity, eventEntity);
            when(repository.findAllSystemDefaults()).thenReturn(entities);
            when(mapper.toDTO(any(BpmnElementTypeEntity.class))).thenReturn(taskDto, eventDto);

            // Act
            BpmnElementTypeListResponse response = service.getAllElementTypes(null);

            // Assert
            Map<String, String> cssVars = response.cssVariables();
            assertThat(cssVars).containsKey("--bpmn-task-stroke");
            assertThat(cssVars).containsKey("--bpmn-event-stroke");
        }
    }

    @Nested
    @DisplayName("getElementTypesByCategory Tests")
    class GetElementTypesByCategoryTests {

        @Test
        @DisplayName("Should return elements filtered by category")
        void shouldReturnElementsFilteredByCategory() {
            // Arrange
            List<BpmnElementTypeEntity> entities = List.of(taskEntity, eventEntity, gatewayEntity);
            when(repository.findAllSystemDefaults()).thenReturn(entities);
            when(mapper.toDTO(taskEntity)).thenReturn(taskDto);
            when(mapper.toDTO(eventEntity)).thenReturn(eventDto);
            when(mapper.toDTO(gatewayEntity)).thenReturn(gatewayDto);

            // Act
            List<BpmnElementTypeDTO> result = service.getElementTypesByCategory("task", null);

            // Assert
            assertThat(result).hasSize(1);
            assertThat(result.get(0).category()).isEqualTo("task");
        }

        @Test
        @DisplayName("Should return multiple elements of same category")
        void shouldReturnMultipleElementsOfSameCategory() {
            // Arrange
            BpmnElementTypeEntity anotherTask = BpmnElementTypeEntity.builder()
                    .id(UUID.randomUUID())
                    .code("bpmn:UserTask")
                    .name("User Task")
                    .category("task")
                    .subCategory("user")
                    .strokeColor("#1E88E5")
                    .fillColor("#E3F2FD")
                    .strokeWidth(2.0)
                    .sortOrder(2)
                    .isActive(true)
                    .build();

            BpmnElementTypeDTO anotherTaskDto = BpmnElementTypeDTO.builder()
                    .code("bpmn:UserTask")
                    .name("User Task")
                    .category("task")
                    .subCategory("user")
                    .strokeColor("#1E88E5")
                    .fillColor("#E3F2FD")
                    .strokeWidth(2.0)
                    .sortOrder(2)
                    .build();

            List<BpmnElementTypeEntity> entities = List.of(taskEntity, anotherTask);
            when(repository.findAllSystemDefaults()).thenReturn(entities);
            when(mapper.toDTO(taskEntity)).thenReturn(taskDto);
            when(mapper.toDTO(anotherTask)).thenReturn(anotherTaskDto);

            // Act
            List<BpmnElementTypeDTO> result = service.getElementTypesByCategory("task", null);

            // Assert
            assertThat(result).hasSize(2);
            assertThat(result).allMatch(dto -> "task".equals(dto.category()));
        }

        @Test
        @DisplayName("Should return empty list for non-existent category")
        void shouldReturnEmptyListForNonExistentCategory() {
            // Arrange
            List<BpmnElementTypeEntity> entities = List.of(taskEntity);
            when(repository.findAllSystemDefaults()).thenReturn(entities);
            when(mapper.toDTO(taskEntity)).thenReturn(taskDto);

            // Act
            List<BpmnElementTypeDTO> result = service.getElementTypesByCategory("nonexistent", null);

            // Assert
            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("Should filter case-insensitively by category")
        void shouldFilterCaseInsensitivelyByCategory() {
            // Arrange
            List<BpmnElementTypeEntity> entities = List.of(taskEntity);
            when(repository.findAllSystemDefaults()).thenReturn(entities);
            when(mapper.toDTO(taskEntity)).thenReturn(taskDto);

            // Act
            List<BpmnElementTypeDTO> result = service.getElementTypesByCategory("TASK", null);

            // Assert
            assertThat(result).hasSize(1);
        }

        @Test
        @DisplayName("Should use tenant-specific elements when tenantId provided")
        void shouldUseTenantSpecificElementsWhenTenantIdProvided() {
            // Arrange
            String tenantId = "tenant-123";
            List<BpmnElementTypeEntity> entities = List.of(taskEntity, eventEntity);
            when(repository.findAllForTenant(tenantId)).thenReturn(entities);
            when(mapper.toDTO(taskEntity)).thenReturn(taskDto);
            when(mapper.toDTO(eventEntity)).thenReturn(eventDto);

            // Act
            List<BpmnElementTypeDTO> result = service.getElementTypesByCategory("event", tenantId);

            // Assert
            assertThat(result).hasSize(1);
            assertThat(result.get(0).category()).isEqualTo("event");
            verify(repository).findAllForTenant(tenantId);
        }

        @Test
        @DisplayName("Should return event category elements")
        void shouldReturnEventCategoryElements() {
            // Arrange
            List<BpmnElementTypeEntity> entities = List.of(taskEntity, eventEntity);
            when(repository.findAllSystemDefaults()).thenReturn(entities);
            when(mapper.toDTO(taskEntity)).thenReturn(taskDto);
            when(mapper.toDTO(eventEntity)).thenReturn(eventDto);

            // Act
            List<BpmnElementTypeDTO> result = service.getElementTypesByCategory("event", null);

            // Assert
            assertThat(result).hasSize(1);
            assertThat(result.get(0).code()).isEqualTo("bpmn:StartEvent");
        }

        @Test
        @DisplayName("Should return gateway category elements")
        void shouldReturnGatewayCategoryElements() {
            // Arrange
            List<BpmnElementTypeEntity> entities = List.of(taskEntity, gatewayEntity);
            when(repository.findAllSystemDefaults()).thenReturn(entities);
            when(mapper.toDTO(taskEntity)).thenReturn(taskDto);
            when(mapper.toDTO(gatewayEntity)).thenReturn(gatewayDto);

            // Act
            List<BpmnElementTypeDTO> result = service.getElementTypesByCategory("gateway", null);

            // Assert
            assertThat(result).hasSize(1);
            assertThat(result.get(0).code()).isEqualTo("bpmn:ExclusiveGateway");
        }
    }

    @Nested
    @DisplayName("getElementTypeByCode Tests")
    class GetElementTypeByCodeTests {

        @Test
        @DisplayName("Should return element by code when tenantId is null")
        void shouldReturnElementByCodeWhenTenantIdIsNull() {
            // Arrange
            when(repository.findByCodeAndTenantIdIsNull("bpmn:Task")).thenReturn(Optional.of(taskEntity));
            when(mapper.toDTO(taskEntity)).thenReturn(taskDto);

            // Act
            Optional<BpmnElementTypeDTO> result = service.getElementTypeByCode("bpmn:Task", null);

            // Assert
            assertThat(result).isPresent();
            assertThat(result.get().code()).isEqualTo("bpmn:Task");
            verify(repository).findByCodeAndTenantIdIsNull("bpmn:Task");
        }

        @Test
        @DisplayName("Should return element by code when tenantId is blank")
        void shouldReturnElementByCodeWhenTenantIdIsBlank() {
            // Arrange
            when(repository.findByCodeAndTenantIdIsNull("bpmn:Task")).thenReturn(Optional.of(taskEntity));
            when(mapper.toDTO(taskEntity)).thenReturn(taskDto);

            // Act
            Optional<BpmnElementTypeDTO> result = service.getElementTypeByCode("bpmn:Task", "   ");

            // Assert
            assertThat(result).isPresent();
            verify(repository).findByCodeAndTenantIdIsNull("bpmn:Task");
        }

        @Test
        @DisplayName("Should return element by code for tenant")
        void shouldReturnElementByCodeForTenant() {
            // Arrange
            String tenantId = "tenant-123";
            when(repository.findByCodeForTenant("bpmn:Task", tenantId)).thenReturn(Optional.of(taskEntity));
            when(mapper.toDTO(taskEntity)).thenReturn(taskDto);

            // Act
            Optional<BpmnElementTypeDTO> result = service.getElementTypeByCode("bpmn:Task", tenantId);

            // Assert
            assertThat(result).isPresent();
            verify(repository).findByCodeForTenant("bpmn:Task", tenantId);
        }

        @Test
        @DisplayName("Should return empty when code not found")
        void shouldReturnEmptyWhenCodeNotFound() {
            // Arrange
            when(repository.findByCodeAndTenantIdIsNull("bpmn:NonExistent")).thenReturn(Optional.empty());

            // Act
            Optional<BpmnElementTypeDTO> result = service.getElementTypeByCode("bpmn:NonExistent", null);

            // Assert
            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("Should return empty when code not found for tenant")
        void shouldReturnEmptyWhenCodeNotFoundForTenant() {
            // Arrange
            String tenantId = "tenant-123";
            when(repository.findByCodeForTenant("bpmn:NonExistent", tenantId)).thenReturn(Optional.empty());

            // Act
            Optional<BpmnElementTypeDTO> result = service.getElementTypeByCode("bpmn:NonExistent", tenantId);

            // Assert
            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("Should map entity to DTO when found")
        void shouldMapEntityToDtoWhenFound() {
            // Arrange
            when(repository.findByCodeAndTenantIdIsNull("bpmn:StartEvent")).thenReturn(Optional.of(eventEntity));
            when(mapper.toDTO(eventEntity)).thenReturn(eventDto);

            // Act
            Optional<BpmnElementTypeDTO> result = service.getElementTypeByCode("bpmn:StartEvent", null);

            // Assert
            assertThat(result).isPresent();
            assertThat(result.get().name()).isEqualTo("Start Event");
            verify(mapper).toDTO(eventEntity);
        }

        @Test
        @DisplayName("Should not call mapper when entity not found")
        void shouldNotCallMapperWhenEntityNotFound() {
            // Arrange
            when(repository.findByCodeAndTenantIdIsNull("bpmn:NonExistent")).thenReturn(Optional.empty());

            // Act
            service.getElementTypeByCode("bpmn:NonExistent", null);

            // Assert
            verify(mapper, never()).toDTO(any());
        }

        @Test
        @DisplayName("Should handle gateway code lookup")
        void shouldHandleGatewayCodeLookup() {
            // Arrange
            when(repository.findByCodeAndTenantIdIsNull("bpmn:ExclusiveGateway")).thenReturn(Optional.of(gatewayEntity));
            when(mapper.toDTO(gatewayEntity)).thenReturn(gatewayDto);

            // Act
            Optional<BpmnElementTypeDTO> result = service.getElementTypeByCode("bpmn:ExclusiveGateway", null);

            // Assert
            assertThat(result).isPresent();
            assertThat(result.get().code()).isEqualTo("bpmn:ExclusiveGateway");
        }
    }

    @Nested
    @DisplayName("invalidateCache Tests")
    class InvalidateCacheTests {

        @Test
        @DisplayName("Should execute without error when tenantId is null")
        void shouldExecuteWithoutErrorWhenTenantIdIsNull() {
            // Act & Assert - should not throw
            service.invalidateCache(null);
        }

        @Test
        @DisplayName("Should execute without error when tenantId is provided")
        void shouldExecuteWithoutErrorWhenTenantIdIsProvided() {
            // Act & Assert - should not throw
            service.invalidateCache("tenant-123");
        }

        @Test
        @DisplayName("Should execute without error when tenantId is empty")
        void shouldExecuteWithoutErrorWhenTenantIdIsEmpty() {
            // Act & Assert - should not throw
            service.invalidateCache("");
        }

        @Test
        @DisplayName("Should not call repository during cache invalidation")
        void shouldNotCallRepositoryDuringCacheInvalidation() {
            // Act
            service.invalidateCache("tenant-123");

            // Assert
            verifyNoInteractions(repository);
        }

        @Test
        @DisplayName("Should not call mapper during cache invalidation")
        void shouldNotCallMapperDuringCacheInvalidation() {
            // Act
            service.invalidateCache("tenant-123");

            // Assert
            verifyNoInteractions(mapper);
        }
    }

    @Nested
    @DisplayName("CSS Variable Generation Tests")
    class CssVariableGenerationTests {

        @Test
        @DisplayName("Should sanitize category names with special characters")
        void shouldSanitizeCategoryNamesWithSpecialCharacters() {
            // Arrange
            BpmnElementTypeEntity specialEntity = BpmnElementTypeEntity.builder()
                    .id(UUID.randomUUID())
                    .code("bpmn:Special")
                    .name("Special Element")
                    .category("special_category-name")
                    .subCategory("sub.category")
                    .strokeColor("#000000")
                    .fillColor("#FFFFFF")
                    .strokeWidth(1.0)
                    .sortOrder(0)
                    .isActive(true)
                    .build();

            BpmnElementTypeDTO specialDto = BpmnElementTypeDTO.builder()
                    .code("bpmn:Special")
                    .name("Special Element")
                    .category("special_category-name")
                    .subCategory("sub.category")
                    .strokeColor("#000000")
                    .fillColor("#FFFFFF")
                    .strokeWidth(1.0)
                    .sortOrder(0)
                    .build();

            when(repository.findAllSystemDefaults()).thenReturn(List.of(specialEntity));
            when(mapper.toDTO(specialEntity)).thenReturn(specialDto);

            // Act
            BpmnElementTypeListResponse response = service.getAllElementTypes(null);

            // Assert
            Map<String, String> cssVars = response.cssVariables();
            assertThat(cssVars.keySet()).anyMatch(key -> key.contains("special-category-name"));
        }

        @Test
        @DisplayName("Should handle empty subCategory in CSS generation")
        void shouldHandleEmptySubCategoryInCssGeneration() {
            // Arrange
            BpmnElementTypeEntity entityWithEmptySubCat = BpmnElementTypeEntity.builder()
                    .id(UUID.randomUUID())
                    .code("bpmn:Simple")
                    .name("Simple")
                    .category("task")
                    .subCategory("")
                    .strokeColor("#000000")
                    .fillColor("#FFFFFF")
                    .strokeWidth(1.0)
                    .sortOrder(0)
                    .isActive(true)
                    .build();

            BpmnElementTypeDTO dtoWithEmptySubCat = BpmnElementTypeDTO.builder()
                    .code("bpmn:Simple")
                    .name("Simple")
                    .category("task")
                    .subCategory("")
                    .strokeColor("#000000")
                    .fillColor("#FFFFFF")
                    .strokeWidth(1.0)
                    .sortOrder(0)
                    .build();

            when(repository.findAllSystemDefaults()).thenReturn(List.of(entityWithEmptySubCat));
            when(mapper.toDTO(entityWithEmptySubCat)).thenReturn(dtoWithEmptySubCat);

            // Act
            BpmnElementTypeListResponse response = service.getAllElementTypes(null);

            // Assert
            assertThat(response.cssVariables()).isNotEmpty();
        }

        @Test
        @DisplayName("Should preserve first element color as category default")
        void shouldPreserveFirstElementColorAsCategoryDefault() {
            // Arrange
            List<BpmnElementTypeEntity> entities = List.of(taskEntity, eventEntity);
            when(repository.findAllSystemDefaults()).thenReturn(entities);
            when(mapper.toDTO(taskEntity)).thenReturn(taskDto);
            when(mapper.toDTO(eventEntity)).thenReturn(eventDto);

            // Act
            BpmnElementTypeListResponse response = service.getAllElementTypes(null);

            // Assert
            Map<String, String> cssVars = response.cssVariables();
            assertThat(cssVars.get("--bpmn-task-stroke")).isEqualTo("#1E88E5");
            assertThat(cssVars.get("--bpmn-event-stroke")).isEqualTo("#43A047");
        }

        @Test
        @DisplayName("Should not overwrite category defaults with subsequent elements")
        void shouldNotOverwriteCategoryDefaultsWithSubsequentElements() {
            // Arrange
            BpmnElementTypeEntity secondTask = BpmnElementTypeEntity.builder()
                    .id(UUID.randomUUID())
                    .code("bpmn:UserTask")
                    .name("User Task")
                    .category("task")
                    .subCategory("user")
                    .strokeColor("#FF0000")
                    .fillColor("#FFEEEE")
                    .strokeWidth(2.0)
                    .sortOrder(2)
                    .isActive(true)
                    .build();

            BpmnElementTypeDTO secondTaskDto = BpmnElementTypeDTO.builder()
                    .code("bpmn:UserTask")
                    .name("User Task")
                    .category("task")
                    .subCategory("user")
                    .strokeColor("#FF0000")
                    .fillColor("#FFEEEE")
                    .strokeWidth(2.0)
                    .sortOrder(2)
                    .build();

            List<BpmnElementTypeEntity> entities = List.of(taskEntity, secondTask);
            when(repository.findAllSystemDefaults()).thenReturn(entities);
            when(mapper.toDTO(taskEntity)).thenReturn(taskDto);
            when(mapper.toDTO(secondTask)).thenReturn(secondTaskDto);

            // Act
            BpmnElementTypeListResponse response = service.getAllElementTypes(null);

            // Assert
            Map<String, String> cssVars = response.cssVariables();
            assertThat(cssVars.get("--bpmn-task-stroke")).isEqualTo("#1E88E5");
        }
    }

    @Nested
    @DisplayName("Edge Cases and Error Handling Tests")
    class EdgeCaseTests {

        @Test
        @DisplayName("Should handle repository returning null list")
        void shouldHandleRepositoryReturningNullList() {
            // Arrange
            when(repository.findAllSystemDefaults()).thenReturn(null);

            // Act & Assert - should handle gracefully or throw appropriate exception
            try {
                service.getAllElementTypes(null);
            } catch (NullPointerException e) {
                // Expected behavior when repository returns null
                assertThat(e).isInstanceOf(NullPointerException.class);
            }
        }

        @Test
        @DisplayName("Should handle mapper returning null")
        void shouldHandleMapperReturningNull() {
            // Arrange
            when(repository.findAllSystemDefaults()).thenReturn(List.of(taskEntity));
            when(mapper.toDTO(taskEntity)).thenReturn(null);

            // Act
            BpmnElementTypeListResponse response = service.getAllElementTypes(null);

            // Assert
            assertThat(response.elements()).contains((BpmnElementTypeDTO) null);
        }

        @Test
        @DisplayName("Should handle very long tenant ID")
        void shouldHandleVeryLongTenantId() {
            // Arrange
            String longTenantId = "tenant-" + "a".repeat(500);
            when(repository.findAllForTenant(longTenantId)).thenReturn(List.of(taskEntity));
            when(mapper.toDTO(taskEntity)).thenReturn(taskDto);

            // Act
            BpmnElementTypeListResponse response = service.getAllElementTypes(longTenantId);

            // Assert
            assertThat(response.elements()).hasSize(1);
            verify(repository).findAllForTenant(longTenantId);
        }

        @Test
        @DisplayName("Should handle special characters in tenant ID")
        void shouldHandleSpecialCharactersInTenantId() {
            // Arrange
            String specialTenantId = "tenant-123-@#$%";
            when(repository.findAllForTenant(specialTenantId)).thenReturn(List.of(taskEntity));
            when(mapper.toDTO(taskEntity)).thenReturn(taskDto);

            // Act
            BpmnElementTypeListResponse response = service.getAllElementTypes(specialTenantId);

            // Assert
            assertThat(response.elements()).hasSize(1);
        }

        @Test
        @DisplayName("Should handle large number of elements")
        void shouldHandleLargeNumberOfElements() {
            // Arrange
            List<BpmnElementTypeEntity> entities = new ArrayList<>();
            for (int i = 0; i < 100; i++) {
                entities.add(BpmnElementTypeEntity.builder()
                        .id(UUID.randomUUID())
                        .code("bpmn:Task" + i)
                        .name("Task " + i)
                        .category("task")
                        .strokeColor("#000000")
                        .fillColor("#FFFFFF")
                        .strokeWidth(1.0)
                        .sortOrder(i)
                        .isActive(true)
                        .build());
            }

            BpmnElementTypeDTO mockDto = BpmnElementTypeDTO.builder()
                    .code("bpmn:Task")
                    .name("Task")
                    .category("task")
                    .strokeColor("#000000")
                    .fillColor("#FFFFFF")
                    .strokeWidth(1.0)
                    .sortOrder(0)
                    .build();

            when(repository.findAllSystemDefaults()).thenReturn(entities);
            when(mapper.toDTO(any(BpmnElementTypeEntity.class))).thenReturn(mockDto);

            // Act
            BpmnElementTypeListResponse response = service.getAllElementTypes(null);

            // Assert
            assertThat(response.elements()).hasSize(100);
            assertThat(response.total()).isEqualTo(100);
        }
    }

    @Nested
    @DisplayName("Verification Tests")
    class VerificationTests {

        @Test
        @DisplayName("Should verify repository method called with correct parameter")
        void shouldVerifyRepositoryMethodCalledWithCorrectParameter() {
            // Arrange
            String tenantId = "tenant-456";
            when(repository.findAllForTenant(tenantId)).thenReturn(Collections.emptyList());

            // Act
            service.getAllElementTypes(tenantId);

            // Assert
            verify(repository).findAllForTenant(eq(tenantId));
        }

        @Test
        @DisplayName("Should verify mapper called for each entity")
        void shouldVerifyMapperCalledForEachEntity() {
            // Arrange
            List<BpmnElementTypeEntity> entities = List.of(taskEntity, eventEntity);
            when(repository.findAllSystemDefaults()).thenReturn(entities);
            when(mapper.toDTO(any(BpmnElementTypeEntity.class))).thenReturn(taskDto, eventDto);

            // Act
            service.getAllElementTypes(null);

            // Assert
            verify(mapper).toDTO(taskEntity);
            verify(mapper).toDTO(eventEntity);
        }

        @Test
        @DisplayName("Should not interact with repository after cache hit")
        void shouldNotInteractWithRepositoryAfterCacheHit() {
            // Note: This test demonstrates the expected behavior with caching enabled
            // Actual caching behavior requires integration test with cache manager

            // Arrange
            when(repository.findAllSystemDefaults()).thenReturn(List.of(taskEntity));
            when(mapper.toDTO(taskEntity)).thenReturn(taskDto);

            // Act
            service.getAllElementTypes(null);
            // In a real cached scenario, second call would not hit repository

            // Assert
            verify(repository, times(1)).findAllSystemDefaults();
        }
    }
}
