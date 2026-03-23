package com.ems.definition.controller;

import com.ems.definition.dto.AttributeTypeCreateRequest;
import com.ems.definition.dto.AttributeTypeDTO;
import com.ems.definition.service.ObjectTypeService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Unit tests for {@link AttributeTypeController}.
 */
@WebMvcTest(AttributeTypeController.class)
class AttributeTypeControllerTest {

    private static final String BASE_URL = "/api/v1/definitions/attribute-types";
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

    private AttributeTypeDTO sampleDTO() {
        return new AttributeTypeDTO(
                "at-001", TENANT_ID, "Hostname", "hostname", "string",
                "general", "The server hostname", null, null,
                Instant.now(), Instant.now());
    }

    @Test
    @DisplayName("GET /attribute-types should return 200 with list")
    void shouldReturnListOfAttributeTypes() throws Exception {
        when(objectTypeService.listAttributeTypes(TENANT_ID))
                .thenReturn(List.of(sampleDTO()));

        mockMvc.perform(get(BASE_URL)
                        .with(tenantJwt()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].name").value("Hostname"))
                .andExpect(jsonPath("$[0].attributeKey").value("hostname"));
    }

    @Test
    @DisplayName("POST /attribute-types should return 201 on creation")
    void shouldReturn201OnCreate() throws Exception {
        AttributeTypeCreateRequest request = new AttributeTypeCreateRequest(
                "Hostname", "hostname", "string", "general",
                "The server hostname", null, null);

        when(objectTypeService.createAttributeType(eq(TENANT_ID), any(AttributeTypeCreateRequest.class)))
                .thenReturn(sampleDTO());

        mockMvc.perform(post(BASE_URL)
                        .with(tenantJwt())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Hostname"))
                .andExpect(jsonPath("$.dataType").value("string"));
    }

    @Test
    @DisplayName("POST /attribute-types should return 400 when name is blank")
    void shouldReturn400WhenNameBlank() throws Exception {
        AttributeTypeCreateRequest request = new AttributeTypeCreateRequest(
                "", "", "", null, null, null, null);

        mockMvc.perform(post(BASE_URL)
                        .with(tenantJwt())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /attribute-types should return 401 without auth")
    void shouldReturn401WithoutAuth() throws Exception {
        mockMvc.perform(get(BASE_URL))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("should return 400 when JWT has no tenant_id claim")
    void shouldReturn400WhenTenantMissing() throws Exception {
        mockMvc.perform(get(BASE_URL)
                        .with(jwt().jwt(b -> b.claim("sub", "user-no-tenant"))))
                .andExpect(status().isBadRequest());
    }
}
