package com.ems.license.controller;

import com.ems.license.dto.LicenseImportResponse;
import com.ems.license.dto.LicenseStatusResponse;
import com.ems.license.entity.*;
import com.ems.license.repository.ApplicationLicenseRepository;
import com.ems.license.repository.LicenseFileRepository;
import com.ems.license.repository.TenantLicenseRepository;
import com.ems.license.service.LicenseImportService;
import com.ems.license.service.LicenseStateHolder;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.Principal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

/**
 * Master tenant admin endpoints for license file import and status inspection.
 * Only accessible by SUPER_ADMIN users.
 */
@RestController
@RequestMapping("/api/v1/admin/licenses")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "License Administration", description = "Master tenant endpoints for on-premise license management")
public class LicenseAdminController {

    private final LicenseImportService licenseImportService;
    private final LicenseStateHolder licenseStateHolder;
    private final LicenseFileRepository licenseFileRepository;
    private final ApplicationLicenseRepository applicationLicenseRepository;
    private final TenantLicenseRepository tenantLicenseRepository;

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(
        summary = "Import a license file",
        description = "Upload and import a signed .lic file. Supersedes any previously active license."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "License imported successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid license file or validation failed"),
        @ApiResponse(responseCode = "409", description = "License already imported")
    })
    public ResponseEntity<LicenseImportResponse> importLicense(
            @Parameter(description = "The signed .lic file", required = true)
            @RequestParam("file") MultipartFile file,
            @Parameter(description = "Authenticated superadmin principal", required = true, hidden = true)
            Principal principal
    ) throws IOException {
        UUID importedBy = getAuthenticatedUserId(principal);
        log.info("License import request by user: {}, file: {} ({} bytes)",
            importedBy, file.getOriginalFilename(), file.getSize());

        byte[] fileBytes = file.getBytes();
        LicenseImportResponse response = licenseImportService.importLicense(fileBytes, importedBy);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/status")
    @Operation(
        summary = "Get current license status",
        description = "Returns the current runtime license state, expiry info, features, and seat counts."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "License status retrieved")
    })
    public ResponseEntity<LicenseStatusResponse> getLicenseStatus() {
        log.debug("License status request");

        LicenseState state = licenseStateHolder.getCurrentState();

        if (state == LicenseState.UNLICENSED) {
            return ResponseEntity.ok(LicenseStatusResponse.builder()
                .state(LicenseState.UNLICENSED)
                .build());
        }

        // Find active license file
        List<LicenseFileEntity> activeFiles = licenseFileRepository.findByImportStatus(LicenseImportStatus.ACTIVE);
        if (activeFiles.isEmpty()) {
            return ResponseEntity.ok(LicenseStatusResponse.builder()
                .state(state)
                .build());
        }

        LicenseFileEntity activeFile = activeFiles.getFirst();
        ApplicationLicenseEntity appLicense = applicationLicenseRepository
            .findByLicenseFileId(activeFile.getId())
            .orElse(null);

        if (appLicense == null) {
            return ResponseEntity.ok(LicenseStatusResponse.builder()
                .state(state)
                .licenseId(activeFile.getLicenseId())
                .licenseFileId(activeFile.getId())
                .build());
        }

        int activeTenantCount = tenantLicenseRepository
            .findByApplicationLicenseId(appLicense.getId())
            .size();

        Instant graceExpiresAt = appLicense.getExpiresAt()
            .plus(appLicense.getGracePeriodDays(), ChronoUnit.DAYS);

        return ResponseEntity.ok(LicenseStatusResponse.builder()
            .state(state)
            .licenseId(activeFile.getLicenseId())
            .licenseFileId(activeFile.getId())
            .product(appLicense.getProduct())
            .expiresAt(appLicense.getExpiresAt())
            .gracePeriodDays(appLicense.getGracePeriodDays())
            .graceExpiresAt(graceExpiresAt)
            .features(appLicense.getFeatures())
            .degradedFeatures(appLicense.getDegradedFeatures())
            .maxTenants(appLicense.getMaxTenants())
            .activeTenantCount(activeTenantCount)
            .issuer(activeFile.getIssuer())
            .customerName(activeFile.getCustomerName())
            .importedAt(activeFile.getCreatedAt())
            .build());
    }

    @GetMapping("/current")
    @Operation(
        summary = "Get current active license details",
        description = "Returns full details of the currently active license including all tenant licenses."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Active license details retrieved"),
        @ApiResponse(responseCode = "404", description = "No active license found")
    })
    public ResponseEntity<LicenseImportResponse> getCurrentLicense() {
        log.debug("Current license details request");

        List<LicenseFileEntity> activeFiles = licenseFileRepository.findByImportStatus(LicenseImportStatus.ACTIVE);
        if (activeFiles.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        LicenseFileEntity activeFile = activeFiles.getFirst();
        ApplicationLicenseEntity appLicense = applicationLicenseRepository
            .findByLicenseFileId(activeFile.getId())
            .orElse(null);

        if (appLicense == null) {
            return ResponseEntity.notFound().build();
        }

        int tenantCount = tenantLicenseRepository
            .findByApplicationLicenseId(appLicense.getId())
            .size();

        LicenseImportResponse response = LicenseImportResponse.builder()
            .licenseFileId(activeFile.getId())
            .licenseId(activeFile.getLicenseId())
            .product(appLicense.getProduct())
            .versionRange(appLicense.getVersionMin() + " - " + appLicense.getVersionMax())
            .maxTenants(appLicense.getMaxTenants())
            .expiresAt(appLicense.getExpiresAt())
            .features(appLicense.getFeatures() != null ? appLicense.getFeatures() : Collections.emptyList())
            .gracePeriodDays(appLicense.getGracePeriodDays())
            .tenantCount(tenantCount)
            .importedAt(activeFile.getCreatedAt())
            .build();

        return ResponseEntity.ok(response);
    }

    private UUID getAuthenticatedUserId(Principal principal) {
        if (principal == null || principal.getName() == null || principal.getName().isBlank()) {
            throw new IllegalArgumentException("Authenticated JWT subject is required");
        }
        return UUID.fromString(principal.getName());
    }
}
