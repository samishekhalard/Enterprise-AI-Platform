package com.ems.process.controller;

import com.ems.process.dto.BpmnElementTypeDTO;
import com.ems.process.dto.BpmnElementTypeListResponse;
import com.ems.process.service.BpmnElementTypeService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Controller tests for BpmnElementTypeController.
 * Uses @WebMvcTest for controller slice testing with MockMvc.
 */
@WebMvcTest(BpmnElementTypeController.class)
@DisplayName("BpmnElementTypeController Tests")
class BpmnElementTypeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private BpmnElementTypeService service;

    private BpmnElementTypeDTO taskDto;
    private BpmnElementTypeDTO eventDto;
    private BpmnElementTypeDTO gatewayDto;
    private BpmnElementTypeListResponse listResponse;

    @BeforeEach
    void setUp() {
        UUID taskId = UUID.randomUUID();
        UUID eventId = UUID.randomUUID();
        UUID gatewayId = UUID.randomUUID();

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

        Map<String, String> cssVariables = new LinkedHashMap<>();
        cssVariables.put("--bpmn-task-stroke", "#1E88E5");
        cssVariables.put("--bpmn-task-fill", "#E3F2FD");
        cssVariables.put("--bpmn-event-stroke", "#43A047");
        cssVariables.put("--bpmn-event-fill", "#E8F5E9");

        listResponse = BpmnElementTypeListResponse.builder()
                .elements(List.of(taskDto, eventDto, gatewayDto))
                .cssVariables(cssVariables)
                .total(3)
                .build();
    }

    @Nested
    @DisplayName("GET /api/process/element-types Tests")
    class GetAllElementTypesTests {

        @Test
        @WithMockUser
        @DisplayName("Should return 200 and all elements without tenant header")
        void shouldReturn200AndAllElementsWithoutTenantHeader() throws Exception {
            // Arrange
            when(service.getAllElementTypes(null)).thenReturn(listResponse);

            // Act & Assert
            mockMvc.perform(get("/api/process/element-types")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.elements").isArray())
                    .andExpect(jsonPath("$.elements.length()").value(3))
                    .andExpect(jsonPath("$.total").value(3));

            verify(service).getAllElementTypes(null);
        }

        @Test
        @WithMockUser
        @DisplayName("Should return 200 and elements with tenant header")
        void shouldReturn200AndElementsWithTenantHeader() throws Exception {
            // Arrange
            String tenantId = "tenant-123";
            when(service.getAllElementTypes(tenantId)).thenReturn(listResponse);

            // Act & Assert
            mockMvc.perform(get("/api/process/element-types")
                            .header("X-Tenant-ID", tenantId)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.elements.length()").value(3));

            verify(service).getAllElementTypes(tenantId);
        }

        @Test
        @WithMockUser
        @DisplayName("Should return elements with CSS variables")
        void shouldReturnElementsWithCssVariables() throws Exception {
            // Arrange
            when(service.getAllElementTypes(null)).thenReturn(listResponse);

            // Act & Assert
            mockMvc.perform(get("/api/process/element-types")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.cssVariables").exists())
                    .andExpect(jsonPath("$.cssVariables['--bpmn-task-stroke']").value("#1E88E5"));
        }

        @Test
        @WithMockUser
        @DisplayName("Should return correct element structure")
        void shouldReturnCorrectElementStructure() throws Exception {
            // Arrange
            when(service.getAllElementTypes(null)).thenReturn(listResponse);

            // Act & Assert
            mockMvc.perform(get("/api/process/element-types")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.elements[0].code").value("bpmn:Task"))
                    .andExpect(jsonPath("$.elements[0].name").value("Task"))
                    .andExpect(jsonPath("$.elements[0].category").value("task"))
                    .andExpect(jsonPath("$.elements[0].strokeColor").value("#1E88E5"))
                    .andExpect(jsonPath("$.elements[0].fillColor").value("#E3F2FD"));
        }

        @Test
        @WithMockUser
        @DisplayName("Should return element with default size")
        void shouldReturnElementWithDefaultSize() throws Exception {
            // Arrange
            when(service.getAllElementTypes(null)).thenReturn(listResponse);

            // Act & Assert
            mockMvc.perform(get("/api/process/element-types")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.elements[0].defaultSize.width").value(100))
                    .andExpect(jsonPath("$.elements[0].defaultSize.height").value(80));
        }

        @Test
        @WithMockUser
        @DisplayName("Should return empty list when no elements")
        void shouldReturnEmptyListWhenNoElements() throws Exception {
            // Arrange
            BpmnElementTypeListResponse emptyResponse = BpmnElementTypeListResponse.builder()
                    .elements(Collections.emptyList())
                    .cssVariables(Collections.emptyMap())
                    .total(0)
                    .build();
            when(service.getAllElementTypes(null)).thenReturn(emptyResponse);

            // Act & Assert
            mockMvc.perform(get("/api/process/element-types")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.elements").isArray())
                    .andExpect(jsonPath("$.elements.length()").value(0))
                    .andExpect(jsonPath("$.total").value(0));
        }

        @Test
        @WithMockUser
        @DisplayName("Should call service with correct tenant ID")
        void shouldCallServiceWithCorrectTenantId() throws Exception {
            // Arrange
            String tenantId = "my-tenant-id";
            when(service.getAllElementTypes(tenantId)).thenReturn(listResponse);

            // Act
            mockMvc.perform(get("/api/process/element-types")
                            .header("X-Tenant-ID", tenantId)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk());

            // Assert
            verify(service).getAllElementTypes(eq(tenantId));
        }

        @Test
        @WithMockUser
        @DisplayName("Should handle empty tenant header")
        void shouldHandleEmptyTenantHeader() throws Exception {
            // Arrange
            when(service.getAllElementTypes("")).thenReturn(listResponse);

            // Act & Assert
            mockMvc.perform(get("/api/process/element-types")
                            .header("X-Tenant-ID", "")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk());

            verify(service).getAllElementTypes("");
        }

        @Test
        @DisplayName("Should return 401 when not authenticated")
        void shouldReturn401WhenNotAuthenticated() throws Exception {
            // Act & Assert
            mockMvc.perform(get("/api/process/element-types")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isUnauthorized());

            verifyNoInteractions(service);
        }

        @Test
        @WithMockUser
        @DisplayName("Should return JSON content type")
        void shouldReturnJsonContentType() throws Exception {
            // Arrange
            when(service.getAllElementTypes(null)).thenReturn(listResponse);

            // Act & Assert
            mockMvc.perform(get("/api/process/element-types"))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON));
        }
    }

    @Nested
    @DisplayName("GET /api/process/element-types/category/{category} Tests")
    class GetElementTypesByCategoryTests {

        @Test
        @WithMockUser
        @DisplayName("Should return 200 and elements for task category")
        void shouldReturn200AndElementsForTaskCategory() throws Exception {
            // Arrange
            when(service.getElementTypesByCategory("task", null)).thenReturn(List.of(taskDto));

            // Act & Assert
            mockMvc.perform(get("/api/process/element-types/category/task")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$.length()").value(1))
                    .andExpect(jsonPath("$[0].category").value("task"));

            verify(service).getElementTypesByCategory("task", null);
        }

        @Test
        @WithMockUser
        @DisplayName("Should return 200 and elements for event category")
        void shouldReturn200AndElementsForEventCategory() throws Exception {
            // Arrange
            when(service.getElementTypesByCategory("event", null)).thenReturn(List.of(eventDto));

            // Act & Assert
            mockMvc.perform(get("/api/process/element-types/category/event")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].category").value("event"));
        }

        @Test
        @WithMockUser
        @DisplayName("Should return 200 and elements for gateway category")
        void shouldReturn200AndElementsForGatewayCategory() throws Exception {
            // Arrange
            when(service.getElementTypesByCategory("gateway", null)).thenReturn(List.of(gatewayDto));

            // Act & Assert
            mockMvc.perform(get("/api/process/element-types/category/gateway")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].category").value("gateway"));
        }

        @Test
        @WithMockUser
        @DisplayName("Should return elements with tenant header")
        void shouldReturnElementsWithTenantHeader() throws Exception {
            // Arrange
            String tenantId = "tenant-123";
            when(service.getElementTypesByCategory("task", tenantId)).thenReturn(List.of(taskDto));

            // Act & Assert
            mockMvc.perform(get("/api/process/element-types/category/task")
                            .header("X-Tenant-ID", tenantId)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk());

            verify(service).getElementTypesByCategory("task", tenantId);
        }

        @Test
        @WithMockUser
        @DisplayName("Should return empty list for non-existent category")
        void shouldReturnEmptyListForNonExistentCategory() throws Exception {
            // Arrange
            when(service.getElementTypesByCategory("nonexistent", null)).thenReturn(Collections.emptyList());

            // Act & Assert
            mockMvc.perform(get("/api/process/element-types/category/nonexistent")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$.length()").value(0));
        }

        @Test
        @WithMockUser
        @DisplayName("Should return multiple elements for category")
        void shouldReturnMultipleElementsForCategory() throws Exception {
            // Arrange
            BpmnElementTypeDTO anotherTask = BpmnElementTypeDTO.builder()
                    .id(UUID.randomUUID())
                    .code("bpmn:UserTask")
                    .name("User Task")
                    .category("task")
                    .strokeColor("#1E88E5")
                    .fillColor("#E3F2FD")
                    .strokeWidth(2.0)
                    .sortOrder(2)
                    .build();

            when(service.getElementTypesByCategory("task", null)).thenReturn(List.of(taskDto, anotherTask));

            // Act & Assert
            mockMvc.perform(get("/api/process/element-types/category/task")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(2));
        }

        @Test
        @DisplayName("Should return 401 when not authenticated")
        void shouldReturn401WhenNotAuthenticated() throws Exception {
            // Act & Assert
            mockMvc.perform(get("/api/process/element-types/category/task")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isUnauthorized());

            verifyNoInteractions(service);
        }

        @Test
        @WithMockUser
        @DisplayName("Should handle category with special characters")
        void shouldHandleCategoryWithSpecialCharacters() throws Exception {
            // Arrange
            when(service.getElementTypesByCategory("data-store", null)).thenReturn(Collections.emptyList());

            // Act & Assert
            mockMvc.perform(get("/api/process/element-types/category/data-store")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk());

            verify(service).getElementTypesByCategory("data-store", null);
        }
    }

    @Nested
    @DisplayName("GET /api/process/element-types/code/{code} Tests")
    class GetElementTypeByCodeTests {

        @Test
        @WithMockUser
        @DisplayName("Should return 200 and element when found")
        void shouldReturn200AndElementWhenFound() throws Exception {
            // Arrange
            when(service.getElementTypeByCode("bpmn:Task", null)).thenReturn(Optional.of(taskDto));

            // Act & Assert
            mockMvc.perform(get("/api/process/element-types/code/bpmn:Task")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value("bpmn:Task"))
                    .andExpect(jsonPath("$.name").value("Task"));

            verify(service).getElementTypeByCode("bpmn:Task", null);
        }

        @Test
        @WithMockUser
        @DisplayName("Should return 404 when element not found")
        void shouldReturn404WhenElementNotFound() throws Exception {
            // Arrange
            when(service.getElementTypeByCode("bpmn:NonExistent", null)).thenReturn(Optional.empty());

            // Act & Assert
            mockMvc.perform(get("/api/process/element-types/code/bpmn:NonExistent")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isNotFound());
        }

        @Test
        @WithMockUser
        @DisplayName("Should return element with tenant header")
        void shouldReturnElementWithTenantHeader() throws Exception {
            // Arrange
            String tenantId = "tenant-123";
            when(service.getElementTypeByCode("bpmn:Task", tenantId)).thenReturn(Optional.of(taskDto));

            // Act & Assert
            mockMvc.perform(get("/api/process/element-types/code/bpmn:Task")
                            .header("X-Tenant-ID", tenantId)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk());

            verify(service).getElementTypeByCode("bpmn:Task", tenantId);
        }

        @Test
        @WithMockUser
        @DisplayName("Should return StartEvent element")
        void shouldReturnStartEventElement() throws Exception {
            // Arrange
            when(service.getElementTypeByCode("bpmn:StartEvent", null)).thenReturn(Optional.of(eventDto));

            // Act & Assert
            mockMvc.perform(get("/api/process/element-types/code/bpmn:StartEvent")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value("bpmn:StartEvent"))
                    .andExpect(jsonPath("$.category").value("event"));
        }

        @Test
        @WithMockUser
        @DisplayName("Should return gateway element")
        void shouldReturnGatewayElement() throws Exception {
            // Arrange
            when(service.getElementTypeByCode("bpmn:ExclusiveGateway", null)).thenReturn(Optional.of(gatewayDto));

            // Act & Assert
            mockMvc.perform(get("/api/process/element-types/code/bpmn:ExclusiveGateway")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value("bpmn:ExclusiveGateway"));
        }

        @Test
        @DisplayName("Should return 401 when not authenticated")
        void shouldReturn401WhenNotAuthenticated() throws Exception {
            // Act & Assert
            mockMvc.perform(get("/api/process/element-types/code/bpmn:Task")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isUnauthorized());

            verifyNoInteractions(service);
        }

        @Test
        @WithMockUser
        @DisplayName("Should handle code with colon")
        void shouldHandleCodeWithColon() throws Exception {
            // Arrange
            when(service.getElementTypeByCode("bpmn:UserTask", null)).thenReturn(Optional.of(taskDto));

            // Act & Assert
            mockMvc.perform(get("/api/process/element-types/code/bpmn:UserTask")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk());

            verify(service).getElementTypeByCode("bpmn:UserTask", null);
        }

        @Test
        @WithMockUser
        @DisplayName("Should return complete element structure")
        void shouldReturnCompleteElementStructure() throws Exception {
            // Arrange
            when(service.getElementTypeByCode("bpmn:Task", null)).thenReturn(Optional.of(taskDto));

            // Act & Assert
            mockMvc.perform(get("/api/process/element-types/code/bpmn:Task")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").exists())
                    .andExpect(jsonPath("$.code").value("bpmn:Task"))
                    .andExpect(jsonPath("$.name").value("Task"))
                    .andExpect(jsonPath("$.category").value("task"))
                    .andExpect(jsonPath("$.subCategory").value("generic"))
                    .andExpect(jsonPath("$.strokeColor").value("#1E88E5"))
                    .andExpect(jsonPath("$.fillColor").value("#E3F2FD"))
                    .andExpect(jsonPath("$.strokeWidth").value(2.0))
                    .andExpect(jsonPath("$.defaultSize.width").value(100))
                    .andExpect(jsonPath("$.defaultSize.height").value(80))
                    .andExpect(jsonPath("$.iconSvg").value("<svg>task</svg>"))
                    .andExpect(jsonPath("$.sortOrder").value(1));
        }
    }

    @Nested
    @DisplayName("POST /api/process/element-types/cache/invalidate Tests")
    class InvalidateCacheTests {

        @Test
        @WithMockUser
        @DisplayName("Should return 204 when cache invalidated successfully")
        void shouldReturn204WhenCacheInvalidatedSuccessfully() throws Exception {
            // Arrange
            doNothing().when(service).invalidateCache(null);

            // Act & Assert
            mockMvc.perform(post("/api/process/element-types/cache/invalidate")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isNoContent());

            verify(service).invalidateCache(null);
        }

        @Test
        @WithMockUser
        @DisplayName("Should return 204 with tenant header")
        void shouldReturn204WithTenantHeader() throws Exception {
            // Arrange
            String tenantId = "tenant-123";
            doNothing().when(service).invalidateCache(tenantId);

            // Act & Assert
            mockMvc.perform(post("/api/process/element-types/cache/invalidate")
                            .header("X-Tenant-ID", tenantId)
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isNoContent());

            verify(service).invalidateCache(tenantId);
        }

        @Test
        @WithMockUser
        @DisplayName("Should call service with correct tenant ID")
        void shouldCallServiceWithCorrectTenantId() throws Exception {
            // Arrange
            String tenantId = "my-tenant-456";
            doNothing().when(service).invalidateCache(tenantId);

            // Act
            mockMvc.perform(post("/api/process/element-types/cache/invalidate")
                            .header("X-Tenant-ID", tenantId)
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isNoContent());

            // Assert
            verify(service).invalidateCache(eq(tenantId));
        }

        @Test
        @DisplayName("Should return 401 when not authenticated")
        void shouldReturn401WhenNotAuthenticated() throws Exception {
            // Act & Assert
            mockMvc.perform(post("/api/process/element-types/cache/invalidate")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isUnauthorized());

            verifyNoInteractions(service);
        }

        @Test
        @WithMockUser
        @DisplayName("Should return 403 without CSRF token")
        void shouldReturn403WithoutCsrfToken() throws Exception {
            // Act & Assert
            mockMvc.perform(post("/api/process/element-types/cache/invalidate")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isForbidden());

            verifyNoInteractions(service);
        }

        @Test
        @WithMockUser
        @DisplayName("Should return no content body")
        void shouldReturnNoContentBody() throws Exception {
            // Arrange
            doNothing().when(service).invalidateCache(null);

            // Act
            MvcResult result = mockMvc.perform(post("/api/process/element-types/cache/invalidate")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isNoContent())
                    .andReturn();

            // Assert
            assertThat(result.getResponse().getContentLength()).isEqualTo(0);
        }
    }

    @Nested
    @DisplayName("Response Format Tests")
    class ResponseFormatTests {

        @Test
        @WithMockUser
        @DisplayName("Should not include null fields in response due to @JsonInclude")
        void shouldNotIncludeNullFieldsInResponse() throws Exception {
            // Arrange
            BpmnElementTypeDTO dtoWithNulls = BpmnElementTypeDTO.builder()
                    .id(UUID.randomUUID())
                    .code("bpmn:Simple")
                    .name("Simple")
                    .category("task")
                    .subCategory(null)
                    .strokeColor("#000000")
                    .fillColor("#FFFFFF")
                    .strokeWidth(1.0)
                    .defaultSize(null)
                    .iconSvg(null)
                    .sortOrder(0)
                    .build();

            when(service.getElementTypeByCode("bpmn:Simple", null)).thenReturn(Optional.of(dtoWithNulls));

            // Act
            MvcResult result = mockMvc.perform(get("/api/process/element-types/code/bpmn:Simple")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andReturn();

            // Assert
            String json = result.getResponse().getContentAsString();
            assertThat(json).doesNotContain("\"subCategory\":null");
            assertThat(json).doesNotContain("\"defaultSize\":null");
            assertThat(json).doesNotContain("\"iconSvg\":null");
        }

        @Test
        @WithMockUser
        @DisplayName("Should return valid JSON format")
        void shouldReturnValidJsonFormat() throws Exception {
            // Arrange
            when(service.getAllElementTypes(null)).thenReturn(listResponse);

            // Act
            MvcResult result = mockMvc.perform(get("/api/process/element-types")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andReturn();

            // Assert
            String json = result.getResponse().getContentAsString();
            assertThat(json).startsWith("{");
            assertThat(json).endsWith("}");

            // Verify it can be parsed
            BpmnElementTypeListResponse parsed = objectMapper.readValue(json, BpmnElementTypeListResponse.class);
            assertThat(parsed.total()).isEqualTo(3);
        }

        @Test
        @WithMockUser
        @DisplayName("Should return array for category endpoint")
        void shouldReturnArrayForCategoryEndpoint() throws Exception {
            // Arrange
            when(service.getElementTypesByCategory("task", null)).thenReturn(List.of(taskDto));

            // Act
            MvcResult result = mockMvc.perform(get("/api/process/element-types/category/task")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andReturn();

            // Assert
            String json = result.getResponse().getContentAsString();
            assertThat(json).startsWith("[");
            assertThat(json).endsWith("]");
        }
    }

    @Nested
    @DisplayName("Edge Cases and Error Handling Tests")
    class EdgeCaseTests {

        @Test
        @WithMockUser
        @DisplayName("Should handle service exception gracefully")
        void shouldHandleServiceExceptionGracefully() throws Exception {
            // Arrange
            when(service.getAllElementTypes(null)).thenThrow(new RuntimeException("Service error"));

            // Act & Assert
            mockMvc.perform(get("/api/process/element-types")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isInternalServerError());
        }

        @Test
        @WithMockUser
        @DisplayName("Should handle very long tenant ID")
        void shouldHandleVeryLongTenantId() throws Exception {
            // Arrange
            String longTenantId = "tenant-" + "a".repeat(500);
            when(service.getAllElementTypes(longTenantId)).thenReturn(listResponse);

            // Act & Assert
            mockMvc.perform(get("/api/process/element-types")
                            .header("X-Tenant-ID", longTenantId)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk());
        }

        @Test
        @WithMockUser
        @DisplayName("Should handle special characters in tenant ID")
        void shouldHandleSpecialCharactersInTenantId() throws Exception {
            // Arrange
            String specialTenantId = "tenant-123-@#$%";
            when(service.getAllElementTypes(specialTenantId)).thenReturn(listResponse);

            // Act & Assert
            mockMvc.perform(get("/api/process/element-types")
                            .header("X-Tenant-ID", specialTenantId)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk());
        }

        @Test
        @WithMockUser
        @DisplayName("Should handle URL encoded code parameter")
        void shouldHandleUrlEncodedCodeParameter() throws Exception {
            // Act & Assert
            mockMvc.perform(get("/api/process/element-types/code/bpmn%3ATask")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isBadRequest());

            verifyNoInteractions(service);
        }

        @Test
        @WithMockUser
        @DisplayName("Should return 405 for unsupported HTTP method on GET endpoint")
        void shouldReturn405ForUnsupportedMethodOnGetEndpoint() throws Exception {
            // Act & Assert
            mockMvc.perform(put("/api/process/element-types")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isMethodNotAllowed());
        }

        @Test
        @WithMockUser
        @DisplayName("Should return 405 for GET on POST endpoint")
        void shouldReturn405ForGetOnPostEndpoint() throws Exception {
            // Act & Assert
            mockMvc.perform(get("/api/process/element-types/cache/invalidate")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isMethodNotAllowed());
        }
    }

    @Nested
    @DisplayName("Verification Tests")
    class VerificationTests {

        @Test
        @WithMockUser
        @DisplayName("Should verify service called exactly once for getAllElementTypes")
        void shouldVerifyServiceCalledExactlyOnceForGetAllElementTypes() throws Exception {
            // Arrange
            when(service.getAllElementTypes(null)).thenReturn(listResponse);

            // Act
            mockMvc.perform(get("/api/process/element-types")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk());

            // Assert
            verify(service, times(1)).getAllElementTypes(null);
            verifyNoMoreInteractions(service);
        }

        @Test
        @WithMockUser
        @DisplayName("Should verify service called exactly once for getElementTypesByCategory")
        void shouldVerifyServiceCalledExactlyOnceForGetElementTypesByCategory() throws Exception {
            // Arrange
            when(service.getElementTypesByCategory("task", null)).thenReturn(List.of(taskDto));

            // Act
            mockMvc.perform(get("/api/process/element-types/category/task")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk());

            // Assert
            verify(service, times(1)).getElementTypesByCategory("task", null);
            verifyNoMoreInteractions(service);
        }

        @Test
        @WithMockUser
        @DisplayName("Should verify service called exactly once for getElementTypeByCode")
        void shouldVerifyServiceCalledExactlyOnceForGetElementTypeByCode() throws Exception {
            // Arrange
            when(service.getElementTypeByCode("bpmn:Task", null)).thenReturn(Optional.of(taskDto));

            // Act
            mockMvc.perform(get("/api/process/element-types/code/bpmn:Task")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk());

            // Assert
            verify(service, times(1)).getElementTypeByCode("bpmn:Task", null);
            verifyNoMoreInteractions(service);
        }

        @Test
        @WithMockUser
        @DisplayName("Should verify service called exactly once for invalidateCache")
        void shouldVerifyServiceCalledExactlyOnceForInvalidateCache() throws Exception {
            // Arrange
            doNothing().when(service).invalidateCache(null);

            // Act
            mockMvc.perform(post("/api/process/element-types/cache/invalidate")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isNoContent());

            // Assert
            verify(service, times(1)).invalidateCache(null);
            verifyNoMoreInteractions(service);
        }
    }
}
