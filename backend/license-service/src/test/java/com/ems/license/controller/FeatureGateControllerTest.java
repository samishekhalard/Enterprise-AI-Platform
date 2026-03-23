package com.ems.license.controller;

import com.ems.license.config.GlobalExceptionHandler;
import com.ems.license.dto.FeatureGateCheckResponse;
import com.ems.license.service.FeatureGateService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.List;

import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(FeatureGateController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
@DisplayName("FeatureGateController")
class FeatureGateControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private FeatureGateService featureGateService;

    private static final String TENANT_ID = "tenant-1";
    private static final String FEATURE_KEY = "advanced_reports";

    @Nested
    @DisplayName("GET /api/v1/internal/features/check")
    class CheckFeature {

        @Test
        @DisplayName("Should return allowed response when feature is licensed")
        void shouldReturnAllowed_whenFeatureLicensed() throws Exception {
            // Arrange
            given(featureGateService.checkFeature(TENANT_ID, FEATURE_KEY))
                    .willReturn(FeatureGateCheckResponse.allowed(FEATURE_KEY));

            // Act & Assert
            mockMvc.perform(get("/api/v1/internal/features/check")
                            .header("X-Tenant-ID", TENANT_ID)
                            .param("featureKey", FEATURE_KEY))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.allowed").value(true))
                    .andExpect(jsonPath("$.featureKey").value(FEATURE_KEY))
                    .andExpect(jsonPath("$.reason").value("Feature access granted"));
        }

        @Test
        @DisplayName("Should return denied response when feature is not licensed")
        void shouldReturnDenied_whenFeatureNotLicensed() throws Exception {
            // Arrange
            given(featureGateService.checkFeature(TENANT_ID, FEATURE_KEY))
                    .willReturn(FeatureGateCheckResponse.denied(FEATURE_KEY, "Feature not licensed"));

            // Act & Assert
            mockMvc.perform(get("/api/v1/internal/features/check")
                            .header("X-Tenant-ID", TENANT_ID)
                            .param("featureKey", FEATURE_KEY))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.allowed").value(false))
                    .andExpect(jsonPath("$.featureKey").value(FEATURE_KEY))
                    .andExpect(jsonPath("$.reason").value("Feature not licensed"));
        }

        @Test
        @DisplayName("Should return denied when license is expired")
        void shouldReturnDenied_whenLicenseExpired() throws Exception {
            // Arrange
            given(featureGateService.checkFeature(TENANT_ID, FEATURE_KEY))
                    .willReturn(FeatureGateCheckResponse.denied(FEATURE_KEY,
                            "License is expired. Feature access denied."));

            // Act & Assert
            mockMvc.perform(get("/api/v1/internal/features/check")
                            .header("X-Tenant-ID", TENANT_ID)
                            .param("featureKey", FEATURE_KEY))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.allowed").value(false))
                    .andExpect(jsonPath("$.reason").exists());
        }
    }

    @Nested
    @DisplayName("GET /api/v1/internal/features/tenant")
    class GetTenantFeatures {

        @Test
        @DisplayName("Should return list of tenant features")
        void shouldReturnFeatureList() throws Exception {
            // Arrange
            given(featureGateService.getTenantFeatures(TENANT_ID))
                    .willReturn(List.of("basic_workflows", "advanced_reports", "ai_assistant"));

            // Act & Assert
            mockMvc.perform(get("/api/v1/internal/features/tenant")
                            .header("X-Tenant-ID", TENANT_ID))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(3))
                    .andExpect(jsonPath("$[0]").value("basic_workflows"))
                    .andExpect(jsonPath("$[1]").value("advanced_reports"))
                    .andExpect(jsonPath("$[2]").value("ai_assistant"));
        }

        @Test
        @DisplayName("Should return empty list when no features are available")
        void shouldReturnEmptyList_whenNoFeatures() throws Exception {
            // Arrange
            given(featureGateService.getTenantFeatures(TENANT_ID))
                    .willReturn(Collections.emptyList());

            // Act & Assert
            mockMvc.perform(get("/api/v1/internal/features/tenant")
                            .header("X-Tenant-ID", TENANT_ID))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(0));
        }
    }
}
