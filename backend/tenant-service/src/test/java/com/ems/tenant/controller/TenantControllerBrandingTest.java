package com.ems.tenant.controller;

import com.ems.common.exception.TenantNotFoundException;
import com.ems.tenant.config.GlobalExceptionHandler;
import com.ems.tenant.mapper.TenantMapper;
import com.ems.tenant.service.TenantService;
import com.ems.tenant.service.branding.BrandingValidationResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * MockMvc controller tests for branding endpoints added by the Tenant Theme Builder.
 *
 * <p>Uses standalone MockMvc setup (no Spring context) to avoid Java 25
 * compatibility issues with @WebMvcTest and OAuth2 security configuration.
 * This follows the project pattern from LicenseAdminControllerTest.</p>
 *
 * Tests:
 * - GET /api/tenants/{tenantId}/branding -- 200 with all branding fields
 * - GET /api/tenants/{tenantId}/branding -- 404 when tenant not found
 * - PUT /api/tenants/{tenantId}/branding -- accepts new neumorphic fields
 * - PUT /api/tenants/{tenantId}/branding -- returns updated branding including new fields
 * - PUT /api/tenants/{tenantId}/branding -- 404 when tenant not found
 */
@DisplayName("TenantController -- Branding Endpoints")
class TenantControllerBrandingTest {

    private MockMvc mockMvc;
    private TenantService tenantService;
    private TenantMapper tenantMapper;

    @BeforeEach
    void setUp() {
        tenantService = mock(TenantService.class);
        tenantMapper = mock(TenantMapper.class);

        TenantController controller = new TenantController(tenantService, tenantMapper);

        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    /**
     * Builds a full branding response map matching the buildBrandingResponse() output
     * from TenantServiceImpl, including all 24 fields.
     */
    private Map<String, Object> buildFullBrandingResponse() {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("primaryColor", "#428177");
        map.put("primaryColorDark", "#054239");
        map.put("secondaryColor", "#b9a779");
        map.put("surfaceColor", "#edebe0");
        map.put("textColor", "#3d3a3b");
        map.put("shadowDarkColor", "#988561");
        map.put("shadowLightColor", "#ffffff");
        map.put("logoUrl", "");
        map.put("logoUrlDark", "");
        map.put("faviconUrl", "");
        map.put("loginBackgroundUrl", "");
        map.put("fontFamily", "'Gotham Rounded', 'Nunito', sans-serif");
        map.put("customCss", "");
        map.put("cornerRadius", 16);
        map.put("buttonDepth", 12);
        map.put("shadowIntensity", 50);
        map.put("softShadows", true);
        map.put("compactNav", false);
        map.put("hoverButton", "lift");
        map.put("hoverCard", "lift");
        map.put("hoverInput", "press");
        map.put("hoverNav", "slide");
        map.put("hoverTableRow", "highlight");
        map.put("updatedAt", "2026-03-02T10:30:00Z");
        return map;
    }

    // =========================================================================
    // GET /api/tenants/{tenantId}/branding
    // =========================================================================

    @Nested
    @DisplayName("GET /api/tenants/{tenantId}/branding")
    class GetBrandingEndpointTests {

        @Test
        @DisplayName("shouldReturn200WithAllBrandingFields")
        void shouldReturn200WithAllBrandingFields() throws Exception {
            // Arrange
            Map<String, Object> brandingResponse = buildFullBrandingResponse();
            when(tenantService.getBranding("tenant-master"))
                    .thenReturn(brandingResponse);

            // Act & Assert
            mockMvc.perform(get("/api/tenants/tenant-master/branding")
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                    // Original fields
                    .andExpect(jsonPath("$.primaryColor").value("#428177"))
                    .andExpect(jsonPath("$.primaryColorDark").value("#054239"))
                    .andExpect(jsonPath("$.secondaryColor").value("#b9a779"))
                    .andExpect(jsonPath("$.fontFamily").value("'Gotham Rounded', 'Nunito', sans-serif"))
                    // New neumorphic color fields
                    .andExpect(jsonPath("$.surfaceColor").value("#edebe0"))
                    .andExpect(jsonPath("$.textColor").value("#3d3a3b"))
                    .andExpect(jsonPath("$.shadowDarkColor").value("#988561"))
                    .andExpect(jsonPath("$.shadowLightColor").value("#ffffff"))
                    // New neumorphic shape fields
                    .andExpect(jsonPath("$.cornerRadius").value(16))
                    .andExpect(jsonPath("$.buttonDepth").value(12))
                    .andExpect(jsonPath("$.shadowIntensity").value(50))
                    .andExpect(jsonPath("$.softShadows").value(true))
                    .andExpect(jsonPath("$.compactNav").value(false))
                    // New hover behaviour fields
                    .andExpect(jsonPath("$.hoverButton").value("lift"))
                    .andExpect(jsonPath("$.hoverCard").value("lift"))
                    .andExpect(jsonPath("$.hoverInput").value("press"))
                    .andExpect(jsonPath("$.hoverNav").value("slide"))
                    .andExpect(jsonPath("$.hoverTableRow").value("highlight"))
                    // Timestamp
                    .andExpect(jsonPath("$.updatedAt").value("2026-03-02T10:30:00Z"));

            verify(tenantService).getBranding("tenant-master");
        }

        @Test
        @DisplayName("shouldReturn404WhenTenantNotFound")
        void shouldReturn404WhenTenantNotFound() throws Exception {
            // Arrange
            when(tenantService.getBranding("nonexistent"))
                    .thenThrow(new TenantNotFoundException("Tenant not found: nonexistent"));

            // Act & Assert
            mockMvc.perform(get("/api/tenants/nonexistent/branding")
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isNotFound());

            verify(tenantService).getBranding("nonexistent");
        }
    }

    // =========================================================================
    // PUT /api/tenants/{tenantId}/branding
    // =========================================================================

    @Nested
    @DisplayName("PUT /api/tenants/{tenantId}/branding")
    class UpdateBrandingEndpointTests {

        @Test
        @DisplayName("shouldAcceptNeumorphicFieldsInRequestBody")
        void shouldAcceptNeumorphicFieldsInRequestBody() throws Exception {
            // Arrange
            Map<String, Object> updatedResponse = buildFullBrandingResponse();
            updatedResponse.put("surfaceColor", "#f0f0e0");
            updatedResponse.put("cornerRadius", 24);
            updatedResponse.put("hoverButton", "glow");

            when(tenantService.getBranding("tenant-test1"))
                    .thenReturn(updatedResponse);

            String requestBody = """
                    {
                        "surfaceColor": "#f0f0e0",
                        "cornerRadius": 24,
                        "hoverButton": "glow",
                        "softShadows": false,
                        "compactNav": true
                    }
                    """;

            // Act & Assert
            mockMvc.perform(put("/api/tenants/tenant-test1/branding")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.surfaceColor").value("#f0f0e0"))
                    .andExpect(jsonPath("$.cornerRadius").value(24))
                    .andExpect(jsonPath("$.hoverButton").value("glow"));

            // Verify updateBranding was called with the right tenantId
            verify(tenantService).updateBranding(eq("tenant-test1"), anyMap());
            // Verify getBranding was called to return the updated state
            verify(tenantService).getBranding("tenant-test1");
        }

        @Test
        @DisplayName("shouldReturnUpdatedBrandingWithAllFieldsAfterUpdate")
        void shouldReturnUpdatedBrandingWithAllFieldsAfterUpdate() throws Exception {
            // Arrange
            Map<String, Object> updatedResponse = buildFullBrandingResponse();
            updatedResponse.put("primaryColor", "#ff5733");
            updatedResponse.put("hoverNav", "highlight");
            updatedResponse.put("buttonDepth", 20);

            when(tenantService.getBranding("tenant-test1"))
                    .thenReturn(updatedResponse);

            String requestBody = """
                    {
                        "primaryColor": "#ff5733",
                        "hoverNav": "highlight",
                        "buttonDepth": 20
                    }
                    """;

            // Act & Assert
            mockMvc.perform(put("/api/tenants/tenant-test1/branding")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isOk())
                    // Updated fields
                    .andExpect(jsonPath("$.primaryColor").value("#ff5733"))
                    .andExpect(jsonPath("$.hoverNav").value("highlight"))
                    .andExpect(jsonPath("$.buttonDepth").value(20))
                    // All other fields still present with defaults
                    .andExpect(jsonPath("$.surfaceColor").value("#edebe0"))
                    .andExpect(jsonPath("$.hoverButton").value("lift"))
                    .andExpect(jsonPath("$.cornerRadius").value(16));
        }

        @Test
        @DisplayName("shouldReturn404WhenUpdatingNonexistentTenant")
        void shouldReturn404WhenUpdatingNonexistentTenant() throws Exception {
            // Arrange
            doThrow(new TenantNotFoundException("Tenant not found: nonexistent"))
                    .when(tenantService).updateBranding(eq("nonexistent"), anyMap());

            String requestBody = """
                    {
                        "primaryColor": "#ff5733"
                    }
                    """;

            // Act & Assert
            mockMvc.perform(put("/api/tenants/nonexistent/branding")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("POST /api/tenants/{tenantId}/branding/validate")
    class ValidateBrandingEndpointTests {

        @Test
        @DisplayName("shouldReturnValidationResultForValidPayload")
        void shouldReturnValidationResultForValidPayload() throws Exception {
            when(tenantService.validateBranding(eq("tenant-test1"), anyMap()))
                    .thenReturn(new BrandingValidationResult(
                            true,
                            List.of(),
                            List.of("componentTokens present but no valid entries were found"),
                            Map.of("surfaceColor", "#edebe0")
                    ));

            String requestBody = """
                    {
                      "surfaceColor": "#edebe0"
                    }
                    """;

            mockMvc.perform(post("/api/tenants/tenant-test1/branding/validate")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.valid").value(true))
                    .andExpect(jsonPath("$.violations").isArray())
                    .andExpect(jsonPath("$.warnings").isArray())
                    .andExpect(jsonPath("$.normalized.surfaceColor").value("#edebe0"));

            verify(tenantService).validateBranding(eq("tenant-test1"), anyMap());
        }

        @Test
        @DisplayName("shouldReturnValidationResultForInvalidPayload")
        void shouldReturnValidationResultForInvalidPayload() throws Exception {
            when(tenantService.validateBranding(eq("tenant-test1"), anyMap()))
                    .thenReturn(new BrandingValidationResult(
                            false,
                            List.of("surfaceColor value #ffffff is outside approved palette"),
                            List.of(),
                            Map.of()
                    ));

            String requestBody = """
                    {
                      "surfaceColor": "#ffffff"
                    }
                    """;

            mockMvc.perform(post("/api/tenants/tenant-test1/branding/validate")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.valid").value(false))
                    .andExpect(jsonPath("$.violations[0]").value("surfaceColor value #ffffff is outside approved palette"));

            verify(tenantService).validateBranding(eq("tenant-test1"), anyMap());
        }
    }
}
