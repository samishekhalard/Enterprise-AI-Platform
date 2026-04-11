package com.ems.tenant.controller;

import com.ems.common.dto.CreateTenantRequest;
import com.ems.common.enums.TenantTier;
import com.ems.common.enums.TenantType;
import com.ems.tenant.config.TestConfig;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestConfig.class)
@ActiveProfiles("test")
class TenantControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("Should resolve tenant - public endpoint")
    void shouldResolveTenant() throws Exception {
        mockMvc.perform(get("/api/tenants/resolve")
                        .header("Host", "unknown.domain.com"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("tenant_not_found"));
    }

    @Test
    @DisplayName("Should require host header for tenant resolution")
    void shouldRequireHostHeader() throws Exception {
        mockMvc.perform(get("/api/tenants/resolve"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("missing_host"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("Should create tenant with valid request")
    void shouldCreateTenant() throws Exception {
        CreateTenantRequest request = CreateTenantRequest.builder()
                .fullName("Integration Test Corp")
                .shortName("IntTest")
                .tenantType(TenantType.REGULAR)
                .tier(TenantTier.PROFESSIONAL)
                .adminEmail("admin@inttest.com")
                .build();

        mockMvc.perform(post("/api/tenants")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.fullName").value("Integration Test Corp"))
                .andExpect(jsonPath("$.status").value("active"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("Should list tenants with pagination")
    void shouldListTenants() throws Exception {
        mockMvc.perform(get("/api/tenants")
                        .param("page", "1")
                        .param("limit", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tenants").isArray())
                .andExpect(jsonPath("$.page").value(1))
                .andExpect(jsonPath("$.limit").value(10));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("Should validate slug availability")
    void shouldValidateSlugAvailability() throws Exception {
        mockMvc.perform(get("/api/tenants/validate/slug/available-slug-" + System.currentTimeMillis()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.available").value(true));
    }

    @Test
    @DisplayName("Should require authentication for tenant list")
    void shouldRequireAuthForTenantList() throws Exception {
        mockMvc.perform(get("/api/tenants"))
                .andExpect(status().isUnauthorized());
    }
}
