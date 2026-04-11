package com.ems.license.controller;

import com.ems.license.config.GlobalExceptionHandler;
import com.ems.license.dto.LicenseImportResponse;
import com.ems.license.dto.LicenseStatusResponse;
import com.ems.license.entity.*;
import com.ems.license.repository.ApplicationLicenseRepository;
import com.ems.license.repository.LicenseFileRepository;
import com.ems.license.repository.TenantLicenseRepository;
import com.ems.license.service.LicenseImportService;
import com.ems.license.service.LicenseStateHolder;
import com.ems.common.exception.BusinessException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit tests for LicenseAdminController using standalone MockMvc setup.
 *
 * <p>This test avoids @WebMvcTest because the Spring @MockBean mechanism
 * cannot mock concrete classes (like LicenseStateHolder) on Java 25.
 * Instead, we use a standalone MockMvc with manually constructed mocks
 * and a TestLicenseStateHolder stub.</p>
 */
@DisplayName("LicenseAdminController")
class LicenseAdminControllerTest {

    private MockMvc mockMvc;

    private LicenseImportService licenseImportService;
    private LicenseFileRepository licenseFileRepository;
    private ApplicationLicenseRepository applicationLicenseRepository;
    private TenantLicenseRepository tenantLicenseRepository;
    private TestControllerLicenseStateHolder licenseStateHolder;

    private static final UUID IMPORTER_ID = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        licenseImportService = mock(LicenseImportService.class);
        licenseFileRepository = mock(LicenseFileRepository.class);
        applicationLicenseRepository = mock(ApplicationLicenseRepository.class);
        tenantLicenseRepository = mock(TenantLicenseRepository.class);
        licenseStateHolder = new TestControllerLicenseStateHolder(LicenseState.UNLICENSED);

        LicenseAdminController controller = new LicenseAdminController(
                licenseImportService,
                licenseStateHolder,
                licenseFileRepository,
                applicationLicenseRepository,
                tenantLicenseRepository
        );

        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Nested
    @DisplayName("POST /api/v1/admin/licenses/import")
    class ImportLicense {

        @Test
        @DisplayName("Should return 201 when license is imported successfully")
        void shouldReturn201_whenImportSucceeds() throws Exception {
            // Arrange
            MockMultipartFile file = new MockMultipartFile(
                    "file", "license.lic", "application/octet-stream",
                    "kid: key-001---{\"test\":\"payload\"}---c2lnbmF0dXJl".getBytes()
            );

            LicenseImportResponse response = LicenseImportResponse.builder()
                    .licenseFileId(UUID.randomUUID())
                    .licenseId("LIC-2026-0001")
                    .product("EMSIST")
                    .versionRange("1.0.0 - 2.99.99")
                    .maxTenants(5)
                    .expiresAt(Instant.now().plus(365, ChronoUnit.DAYS))
                    .features(List.of("basic_workflows", "advanced_reports"))
                    .gracePeriodDays(30)
                    .tenantCount(1)
                    .importedAt(Instant.now())
                    .build();

            given(licenseImportService.importLicense(any(byte[].class), eq(IMPORTER_ID)))
                    .willReturn(response);

            // Act & Assert
            mockMvc.perform(multipart("/api/v1/admin/licenses/import")
                            .file(file)
                            .principal(() -> IMPORTER_ID.toString()))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.licenseId").value("LIC-2026-0001"))
                    .andExpect(jsonPath("$.product").value("EMSIST"))
                    .andExpect(jsonPath("$.maxTenants").value(5))
                    .andExpect(jsonPath("$.tenantCount").value(1));
        }

        @Test
        @DisplayName("Should return 400 when license validation fails")
        void shouldReturn400_whenValidationFails() throws Exception {
            // Arrange
            MockMultipartFile file = new MockMultipartFile(
                    "file", "bad.lic", "application/octet-stream",
                    "invalid-license-data".getBytes()
            );

            given(licenseImportService.importLicense(any(byte[].class), eq(IMPORTER_ID)))
                    .willThrow(new BusinessException("signature_invalid", "Signature verification failed"));

            // Act & Assert
            mockMvc.perform(multipart("/api/v1/admin/licenses/import")
                            .file(file)
                            .principal(() -> IMPORTER_ID.toString()))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.error").value("signature_invalid"));
        }
    }

    @Nested
    @DisplayName("GET /api/v1/admin/licenses/status")
    class GetLicenseStatus {

        @Test
        @DisplayName("Should return UNLICENSED state when no license exists")
        void shouldReturnUnlicensed_whenNoLicenseExists() throws Exception {
            // Arrange
            licenseStateHolder.setForcedState(LicenseState.UNLICENSED);

            // Act & Assert
            mockMvc.perform(get("/api/v1/admin/licenses/status"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.state").value("UNLICENSED"));
        }

        @Test
        @DisplayName("Should return full status details when active license exists")
        void shouldReturnFullStatus_whenActiveLicenseExists() throws Exception {
            // Arrange
            UUID licenseFileId = UUID.randomUUID();
            UUID appLicenseId = UUID.randomUUID();
            Instant expiresAt = Instant.now().plus(365, ChronoUnit.DAYS);

            licenseStateHolder.setForcedState(LicenseState.ACTIVE);

            LicenseFileEntity activeFile = LicenseFileEntity.builder()
                    .id(licenseFileId)
                    .licenseId("LIC-2026-0001")
                    .issuer("EMS Corp")
                    .customerName("Test Customer")
                    .createdAt(Instant.now())
                    .build();

            ApplicationLicenseEntity appLicense = ApplicationLicenseEntity.builder()
                    .id(appLicenseId)
                    .product("EMSIST")
                    .expiresAt(expiresAt)
                    .gracePeriodDays(30)
                    .features(List.of("basic_workflows"))
                    .degradedFeatures(List.of("advanced_reports"))
                    .maxTenants(5)
                    .build();

            given(licenseFileRepository.findByImportStatus(LicenseImportStatus.ACTIVE))
                    .willReturn(List.of(activeFile));
            given(applicationLicenseRepository.findByLicenseFileId(licenseFileId))
                    .willReturn(Optional.of(appLicense));
            given(tenantLicenseRepository.findByApplicationLicenseId(appLicenseId))
                    .willReturn(List.of(TenantLicenseEntity.builder().build()));

            // Act & Assert
            mockMvc.perform(get("/api/v1/admin/licenses/status"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.state").value("ACTIVE"))
                    .andExpect(jsonPath("$.licenseId").value("LIC-2026-0001"))
                    .andExpect(jsonPath("$.product").value("EMSIST"))
                    .andExpect(jsonPath("$.maxTenants").value(5))
                    .andExpect(jsonPath("$.activeTenantCount").value(1))
                    .andExpect(jsonPath("$.issuer").value("EMS Corp"));
        }

        @Test
        @DisplayName("Should return state only when no active files found in non-UNLICENSED state")
        void shouldReturnStateOnly_whenNoActiveFilesInNonUnlicensedState() throws Exception {
            // Arrange
            licenseStateHolder.setForcedState(LicenseState.TAMPERED);
            given(licenseFileRepository.findByImportStatus(LicenseImportStatus.ACTIVE))
                    .willReturn(Collections.emptyList());

            // Act & Assert
            mockMvc.perform(get("/api/v1/admin/licenses/status"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.state").value("TAMPERED"));
        }
    }

    @Nested
    @DisplayName("GET /api/v1/admin/licenses/current")
    class GetCurrentLicense {

        @Test
        @DisplayName("Should return 404 when no active license exists")
        void shouldReturn404_whenNoActiveLicenseExists() throws Exception {
            // Arrange
            given(licenseFileRepository.findByImportStatus(LicenseImportStatus.ACTIVE))
                    .willReturn(Collections.emptyList());

            // Act & Assert
            mockMvc.perform(get("/api/v1/admin/licenses/current"))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("Should return 404 when active file has no app license")
        void shouldReturn404_whenNoAppLicense() throws Exception {
            // Arrange
            LicenseFileEntity activeFile = LicenseFileEntity.builder()
                    .id(UUID.randomUUID())
                    .licenseId("LIC-2026-0001")
                    .build();

            given(licenseFileRepository.findByImportStatus(LicenseImportStatus.ACTIVE))
                    .willReturn(List.of(activeFile));
            given(applicationLicenseRepository.findByLicenseFileId(activeFile.getId()))
                    .willReturn(Optional.empty());

            // Act & Assert
            mockMvc.perform(get("/api/v1/admin/licenses/current"))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("Should return active license details with 200")
        void shouldReturn200_withActiveLicenseDetails() throws Exception {
            // Arrange
            UUID licenseFileId = UUID.randomUUID();
            UUID appLicenseId = UUID.randomUUID();

            LicenseFileEntity activeFile = LicenseFileEntity.builder()
                    .id(licenseFileId)
                    .licenseId("LIC-2026-0001")
                    .createdAt(Instant.now())
                    .build();

            ApplicationLicenseEntity appLicense = ApplicationLicenseEntity.builder()
                    .id(appLicenseId)
                    .product("EMSIST")
                    .versionMin("1.0.0")
                    .versionMax("2.99.99")
                    .maxTenants(5)
                    .expiresAt(Instant.now().plus(365, ChronoUnit.DAYS))
                    .features(List.of("basic_workflows"))
                    .gracePeriodDays(30)
                    .build();

            given(licenseFileRepository.findByImportStatus(LicenseImportStatus.ACTIVE))
                    .willReturn(List.of(activeFile));
            given(applicationLicenseRepository.findByLicenseFileId(licenseFileId))
                    .willReturn(Optional.of(appLicense));
            given(tenantLicenseRepository.findByApplicationLicenseId(appLicenseId))
                    .willReturn(List.of(TenantLicenseEntity.builder().build(), TenantLicenseEntity.builder().build()));

            // Act & Assert
            mockMvc.perform(get("/api/v1/admin/licenses/current"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.licenseId").value("LIC-2026-0001"))
                    .andExpect(jsonPath("$.product").value("EMSIST"))
                    .andExpect(jsonPath("$.versionRange").value("1.0.0 - 2.99.99"))
                    .andExpect(jsonPath("$.maxTenants").value(5))
                    .andExpect(jsonPath("$.tenantCount").value(2));
        }
    }

    /**
     * Test stub for LicenseStateHolder used in controller tests.
     * Placed here to keep the controller test package self-contained.
     */
    static class TestControllerLicenseStateHolder extends LicenseStateHolder {

        private LicenseState forcedState;

        TestControllerLicenseStateHolder(LicenseState initialState) {
            super(null, null, null, null);
            this.forcedState = initialState;
        }

        void setForcedState(LicenseState state) {
            this.forcedState = state;
        }

        @Override
        public LicenseState getCurrentState() {
            return forcedState != null ? forcedState : LicenseState.UNLICENSED;
        }

        @Override
        public void recomputeState() {
            // no-op for tests
        }
    }

}
