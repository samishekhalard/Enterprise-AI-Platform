package com.ems.definition.controller;

import com.ems.definition.dto.ObjectTypeCreateRequest;
import com.ems.definition.dto.ObjectTypeDTO;
import com.ems.definition.dto.ObjectTypeUpdateRequest;
import com.ems.definition.dto.PagedResponse;
import com.ems.definition.service.ObjectTypeService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Unit tests for {@link ObjectTypeController}.
 *
 * Uses @WebMvcTest with MockMvc and Spring Security Test JWT support.
 */
@WebMvcTest(ObjectTypeController.class)
class ObjectTypeControllerTest {

    private static final String BASE_URL = "/api/v1/definitions/object-types";
    private static final String TENANT_ID = "tenant-001";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ObjectTypeService objectTypeService;

    private SecurityMockMvcRequestPostProcessors.JwtRequestPostProcessor tenantJwt() {
        return jwt().jwt(builder -> builder
                .claim("tenant_id", TENANT_ID)
                .claim("realm_access", java.util.Map.of("roles", List.of("ADMIN"))));
    }

    private ObjectTypeDTO sampleDTO() {
        return new ObjectTypeDTO(
                "ot-001", TENANT_ID, "Server", "server", "OBJ_001",
                "A server", "server", "#428177", "active", "user_defined",
                Instant.now(), Instant.now(),
                Collections.emptyList(), Collections.emptyList(), null, 0);
    }

    @Nested
    @DisplayName("GET /object-types")
    class ListObjectTypes {

        @Test
        @DisplayName("should return 200 with paged response")
        void shouldReturnPagedResponse() throws Exception {
            PagedResponse<ObjectTypeDTO> response = PagedResponse.of(
                    List.of(sampleDTO()), 0, 20, 1L);

            when(objectTypeService.listObjectTypes(eq(TENANT_ID), eq(0), eq(20), any(), any()))
                    .thenReturn(response);

            mockMvc.perform(get(BASE_URL)
                            .with(tenantJwt()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content").isArray())
                    .andExpect(jsonPath("$.content[0].name").value("Server"))
                    .andExpect(jsonPath("$.totalElements").value(1))
                    .andExpect(jsonPath("$.page").value(0));
        }

        @Test
        @DisplayName("should return 401 without authentication")
        void shouldReturn401WithoutAuth() throws Exception {
            mockMvc.perform(get(BASE_URL))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("POST /object-types")
    class CreateObjectType {

        @Test
        @DisplayName("should return 201 on successful creation")
        void shouldReturn201OnCreate() throws Exception {
            ObjectTypeCreateRequest request = new ObjectTypeCreateRequest(
                    "Server", "server", null, "A server", null, null, null, null);

            when(objectTypeService.createObjectType(eq(TENANT_ID), any(ObjectTypeCreateRequest.class)))
                    .thenReturn(sampleDTO());

            mockMvc.perform(post(BASE_URL)
                            .with(tenantJwt())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.name").value("Server"))
                    .andExpect(jsonPath("$.typeKey").value("server"));
        }

        @Test
        @DisplayName("should return 400 when name is blank")
        void shouldReturn400WhenNameBlank() throws Exception {
            ObjectTypeCreateRequest request = new ObjectTypeCreateRequest(
                    "", null, null, null, null, null, null, null);

            mockMvc.perform(post(BASE_URL)
                            .with(tenantJwt())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("GET /object-types/{id}")
    class GetObjectType {

        @Test
        @DisplayName("should return 200 with object type")
        void shouldReturnObjectType() throws Exception {
            when(objectTypeService.getObjectType(TENANT_ID, "ot-001"))
                    .thenReturn(sampleDTO());

            mockMvc.perform(get(BASE_URL + "/ot-001")
                            .with(tenantJwt()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value("ot-001"))
                    .andExpect(jsonPath("$.name").value("Server"));
        }
    }

    @Nested
    @DisplayName("PUT /object-types/{id}")
    class UpdateObjectType {

        @Test
        @DisplayName("should return 200 on successful update")
        void shouldReturn200OnUpdate() throws Exception {
            ObjectTypeUpdateRequest request = new ObjectTypeUpdateRequest(
                    "Updated Server", null, null, null, null, null, null, null);

            ObjectTypeDTO updatedDTO = new ObjectTypeDTO(
                    "ot-001", TENANT_ID, "Updated Server", "server", "OBJ_001",
                    "A server", "server", "#428177", "active", "user_defined",
                    Instant.now(), Instant.now(),
                    Collections.emptyList(), Collections.emptyList(), null, 0);

            when(objectTypeService.updateObjectType(eq(TENANT_ID), eq("ot-001"), any(ObjectTypeUpdateRequest.class)))
                    .thenReturn(updatedDTO);

            mockMvc.perform(put(BASE_URL + "/ot-001")
                            .with(tenantJwt())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.name").value("Updated Server"));
        }
    }

    @Nested
    @DisplayName("DELETE /object-types/{id}")
    class DeleteObjectType {

        @Test
        @DisplayName("should return 204 on successful deletion")
        void shouldReturn204OnDelete() throws Exception {
            mockMvc.perform(delete(BASE_URL + "/ot-001")
                            .with(tenantJwt()))
                    .andExpect(status().isNoContent());

            verify(objectTypeService).deleteObjectType(TENANT_ID, "ot-001");
        }
    }

    @Nested
    @DisplayName("Tenant extraction")
    class TenantExtraction {

        @Test
        @DisplayName("should use X-Tenant-ID header when JWT claim is absent")
        void shouldFallbackToHeader() throws Exception {
            PagedResponse<ObjectTypeDTO> response = PagedResponse.of(
                    List.of(sampleDTO()), 0, 20, 1L);

            when(objectTypeService.listObjectTypes(eq(TENANT_ID), eq(0), eq(20), any(), any()))
                    .thenReturn(response);

            mockMvc.perform(get(BASE_URL)
                            .with(jwt().jwt(b -> b.claim("sub", "user-no-tenant")))
                            .header("X-Tenant-ID", TENANT_ID))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("should return 400 when no tenant context is available")
        void shouldReturn400WhenTenantMissing() throws Exception {
            mockMvc.perform(get(BASE_URL)
                            .with(jwt().jwt(b -> b.claim("sub", "user-no-tenant"))))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("Sub-resource endpoints")
    class SubResourceEndpoints {

        @Test
        @DisplayName("GET /{id}/attributes should return 200 with attribute list")
        void shouldListAttributes() throws Exception {
            when(objectTypeService.getObjectType(TENANT_ID, "ot-001")).thenReturn(sampleDTO());

            mockMvc.perform(get(BASE_URL + "/ot-001/attributes").with(tenantJwt()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray());
        }

        @Test
        @DisplayName("POST /{id}/attributes should return 201")
        void shouldAddAttribute() throws Exception {
            com.ems.definition.dto.AddAttributeRequest request =
                    new com.ems.definition.dto.AddAttributeRequest("at-001", false, 0);

            when(objectTypeService.addAttribute(eq(TENANT_ID), eq("ot-001"),
                    any(com.ems.definition.dto.AddAttributeRequest.class))).thenReturn(sampleDTO());

            mockMvc.perform(post(BASE_URL + "/ot-001/attributes")
                            .with(tenantJwt())
                            .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated());
        }

        @Test
        @DisplayName("DELETE /{id}/attributes/{attrId} should return 204")
        void shouldRemoveAttribute() throws Exception {
            mockMvc.perform(delete(BASE_URL + "/ot-001/attributes/at-001").with(tenantJwt()))
                    .andExpect(status().isNoContent());

            verify(objectTypeService).removeAttribute(TENANT_ID, "ot-001", "at-001");
        }

        @Test
        @DisplayName("GET /{id}/connections should return 200 with connection list")
        void shouldListConnections() throws Exception {
            when(objectTypeService.getObjectType(TENANT_ID, "ot-001")).thenReturn(sampleDTO());

            mockMvc.perform(get(BASE_URL + "/ot-001/connections").with(tenantJwt()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray());
        }

        @Test
        @DisplayName("POST /{id}/connections should return 201")
        void shouldAddConnection() throws Exception {
            com.ems.definition.dto.AddConnectionRequest request =
                    new com.ems.definition.dto.AddConnectionRequest(
                            "ot-002", "runs_on", "runs on", "hosts", "one-to-many", true);

            when(objectTypeService.addConnection(eq(TENANT_ID), eq("ot-001"),
                    any(com.ems.definition.dto.AddConnectionRequest.class))).thenReturn(sampleDTO());

            mockMvc.perform(post(BASE_URL + "/ot-001/connections")
                            .with(tenantJwt())
                            .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated());
        }

        @Test
        @DisplayName("DELETE /{id}/connections/{connId} should return 204")
        void shouldRemoveConnection() throws Exception {
            mockMvc.perform(delete(BASE_URL + "/ot-001/connections/conn-001").with(tenantJwt()))
                    .andExpect(status().isNoContent());

            verify(objectTypeService).removeConnection(TENANT_ID, "ot-001", "conn-001");
        }
    }

    @Nested
    @DisplayName("Exception handler")
    class ExceptionHandler {

        @Test
        @DisplayName("should return 500 on unexpected service exception")
        void shouldReturn500OnUnexpectedError() throws Exception {
            when(objectTypeService.listObjectTypes(any(), anyInt(), anyInt(), any(), any()))
                    .thenThrow(new RuntimeException("unexpected failure"));

            mockMvc.perform(get(BASE_URL).with(tenantJwt()))
                    .andExpect(status().isInternalServerError());
        }
    }
}
