package com.ems.notification.controller;

import com.ems.notification.dto.CreateTemplateRequest;
import com.ems.notification.dto.NotificationTemplateDTO;
import com.ems.notification.service.TemplateService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.bean.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(TemplateController.class)
@AutoConfigureMockMvc
@DisplayName("TemplateController Unit Tests")
class TemplateControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private TemplateService templateService;

    private static final String BASE_URL = "/api/v1/notification-templates";
    private static final String TENANT_ID = "tenant-1";
    private static final UUID TEMPLATE_ID = UUID.randomUUID();

    private NotificationTemplateDTO buildTemplateDTO() {
        return NotificationTemplateDTO.builder()
                .id(TEMPLATE_ID)
                .tenantId(TENANT_ID)
                .code("WELCOME_EMAIL")
                .name("Welcome Email")
                .type("EMAIL")
                .category("SYSTEM")
                .bodyTemplate("Hello")
                .isActive(true)
                .isSystem(false)
                .locale("en")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
    }

    private CreateTemplateRequest buildCreateRequest() {
        return CreateTemplateRequest.builder()
                .tenantId(TENANT_ID)
                .code("WELCOME_EMAIL")
                .name("Welcome Email")
                .type("EMAIL")
                .category("SYSTEM")
                .bodyTemplate("Hello [[${name}]]")
                .build();
    }

    @Nested
    @DisplayName("POST /api/v1/notification-templates")
    class CreateTemplate {

        @Test
        @DisplayName("Should return 201 Created when template created by admin")
        void createTemplate_asAdmin_shouldReturn201() throws Exception {
            // Arrange
            when(templateService.createTemplate(any(CreateTemplateRequest.class)))
                    .thenReturn(buildTemplateDTO());

            // Act & Assert
            mockMvc.perform(post(BASE_URL)
                            .with(jwt().jwt(j -> j.subject("admin-id"))
                                    .authorities(new SimpleGrantedAuthority("ROLE_TENANT_ADMIN")))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(buildCreateRequest())))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.id").value(TEMPLATE_ID.toString()))
                    .andExpect(jsonPath("$.code").value("WELCOME_EMAIL"));
        }

        @Test
        @DisplayName("Should return 403 when user is not admin")
        void createTemplate_asRegularUser_shouldReturn403() throws Exception {
            // Act & Assert
            mockMvc.perform(post(BASE_URL)
                            .with(jwt().jwt(j -> j.subject("user-id"))
                                    .authorities(new SimpleGrantedAuthority("ROLE_USER")))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(buildCreateRequest())))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("Should return 400 when required code field is missing")
        void createTemplate_whenMissingCode_shouldReturn400() throws Exception {
            // Arrange
            CreateTemplateRequest invalid = CreateTemplateRequest.builder()
                    .name("Name")
                    .type("EMAIL")
                    .category("SYSTEM")
                    .bodyTemplate("body")
                    .build();

            // Act & Assert
            mockMvc.perform(post(BASE_URL)
                            .with(jwt().jwt(j -> j.subject("admin-id"))
                                    .authorities(new SimpleGrantedAuthority("ROLE_TENANT_ADMIN")))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(invalid)))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("GET /api/v1/notification-templates/{id}")
    class GetTemplate {

        @Test
        @DisplayName("Should return 200 with template when found")
        void getTemplate_shouldReturn200() throws Exception {
            // Arrange
            when(templateService.getTemplate(TEMPLATE_ID)).thenReturn(buildTemplateDTO());

            // Act & Assert
            mockMvc.perform(get(BASE_URL + "/{id}", TEMPLATE_ID)
                            .with(jwt().jwt(j -> j.subject("admin-id"))
                                    .authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(TEMPLATE_ID.toString()));
        }
    }

    @Nested
    @DisplayName("GET /api/v1/notification-templates/code/{code}")
    class GetTemplateByCode {

        @Test
        @DisplayName("Should return 200 with template when found by code and type")
        void getTemplateByCode_shouldReturn200() throws Exception {
            // Arrange
            when(templateService.getTemplateByCode(TENANT_ID, "WELCOME_EMAIL", "EMAIL"))
                    .thenReturn(buildTemplateDTO());

            // Act & Assert
            mockMvc.perform(get(BASE_URL + "/code/{code}", "WELCOME_EMAIL")
                            .with(jwt().jwt(j -> j.subject("admin-id"))
                                    .authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
                            .header("X-Tenant-ID", TENANT_ID)
                            .param("type", "EMAIL"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value("WELCOME_EMAIL"));
        }
    }

    @Nested
    @DisplayName("GET /api/v1/notification-templates")
    class ListTemplates {

        @Test
        @DisplayName("Should return 200 with list of templates for tenant")
        void getAllTemplates_shouldReturn200() throws Exception {
            // Arrange
            when(templateService.getAllTemplates(TENANT_ID))
                    .thenReturn(List.of(buildTemplateDTO()));

            // Act & Assert
            mockMvc.perform(get(BASE_URL)
                            .with(jwt().jwt(j -> j.subject("admin-id"))
                                    .authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
                            .header("X-Tenant-ID", TENANT_ID))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$[0].code").value("WELCOME_EMAIL"));
        }
    }

    @Nested
    @DisplayName("GET /api/v1/notification-templates/system")
    class SystemTemplates {

        @Test
        @DisplayName("Should return 200 with system templates")
        void getSystemTemplates_shouldReturn200() throws Exception {
            // Arrange
            when(templateService.getSystemTemplates()).thenReturn(List.of(buildTemplateDTO()));

            // Act & Assert
            mockMvc.perform(get(BASE_URL + "/system")
                            .with(jwt().jwt(j -> j.subject("admin-id"))
                                    .authorities(new SimpleGrantedAuthority("ROLE_SUPER_ADMIN"))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray());
        }
    }

    @Nested
    @DisplayName("PUT /api/v1/notification-templates/{id}")
    class UpdateTemplate {

        @Test
        @DisplayName("Should return 200 when template updated successfully")
        void updateTemplate_shouldReturn200() throws Exception {
            // Arrange
            when(templateService.updateTemplate(eq(TEMPLATE_ID), any(CreateTemplateRequest.class)))
                    .thenReturn(buildTemplateDTO());

            // Act & Assert
            mockMvc.perform(put(BASE_URL + "/{id}", TEMPLATE_ID)
                            .with(jwt().jwt(j -> j.subject("admin-id"))
                                    .authorities(new SimpleGrantedAuthority("ROLE_TENANT_ADMIN")))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(buildCreateRequest())))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(TEMPLATE_ID.toString()));
        }
    }

    @Nested
    @DisplayName("DELETE /api/v1/notification-templates/{id}")
    class DeleteTemplate {

        @Test
        @DisplayName("Should return 204 when template deleted")
        void deleteTemplate_shouldReturn204() throws Exception {
            // Act & Assert
            mockMvc.perform(delete(BASE_URL + "/{id}", TEMPLATE_ID)
                            .with(jwt().jwt(j -> j.subject("admin-id"))
                                    .authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))))
                    .andExpect(status().isNoContent());

            verify(templateService).deleteTemplate(TEMPLATE_ID);
        }
    }

    @Nested
    @DisplayName("POST /api/v1/notification-templates/{id}/activate & deactivate")
    class ActivateDeactivate {

        @Test
        @DisplayName("Should return 200 when activating template")
        void activateTemplate_shouldReturn200() throws Exception {
            // Act & Assert
            mockMvc.perform(post(BASE_URL + "/{id}/activate", TEMPLATE_ID)
                            .with(jwt().jwt(j -> j.subject("admin-id"))
                                    .authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))))
                    .andExpect(status().isOk());

            verify(templateService).activateTemplate(TEMPLATE_ID);
        }

        @Test
        @DisplayName("Should return 200 when deactivating template")
        void deactivateTemplate_shouldReturn200() throws Exception {
            // Act & Assert
            mockMvc.perform(post(BASE_URL + "/{id}/deactivate", TEMPLATE_ID)
                            .with(jwt().jwt(j -> j.subject("admin-id"))
                                    .authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))))
                    .andExpect(status().isOk());

            verify(templateService).deactivateTemplate(TEMPLATE_ID);
        }
    }
}
