package com.ems.license.controller;

import com.ems.license.dto.FeatureGateCheckResponse;
import com.ems.license.service.FeatureGateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Internal endpoint for feature gate checks.
 * Used by other services to verify if a tenant has access to a specific feature.
 */
@RestController
@RequestMapping("/api/v1/internal/features")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Feature Gates (Internal)", description = "Internal API for feature access checking based on license entitlements")
public class FeatureGateController {

    private static final String TENANT_HEADER = "X-Tenant-ID";

    private final FeatureGateService featureGateService;

    @GetMapping("/check")
    @Operation(
        summary = "Check feature access",
        description = "Check if a tenant has access to a specific feature based on their license entitlements."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Feature check completed (check 'allowed' field)")
    })
    public ResponseEntity<FeatureGateCheckResponse> checkFeature(
            @Parameter(description = "Tenant ID", required = true)
            @RequestHeader(TENANT_HEADER) String tenantId,
            @Parameter(description = "Feature key to check", required = true)
            @RequestParam String featureKey
    ) {
        log.debug("Feature check: tenant={}, feature={}", tenantId, featureKey);
        FeatureGateCheckResponse response = featureGateService.checkFeature(tenantId, featureKey);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/tenant")
    @Operation(
        summary = "Get tenant features",
        description = "Get all features available to a tenant based on their license entitlements."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Tenant features retrieved")
    })
    public ResponseEntity<List<String>> getTenantFeatures(
            @Parameter(description = "Tenant ID", required = true)
            @RequestHeader(TENANT_HEADER) String tenantId
    ) {
        log.debug("Get tenant features: tenant={}", tenantId);
        return ResponseEntity.ok(featureGateService.getTenantFeatures(tenantId));
    }
}
