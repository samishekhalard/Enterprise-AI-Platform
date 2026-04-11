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

@RestController
@RequestMapping("/api/v1/features")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Feature Gates", description = "Public API for checking feature access based on license entitlements")
public class FeatureGatePublicController {

    private static final String TENANT_HEADER = "X-Tenant-ID";

    private final FeatureGateService featureGateService;

    @GetMapping("/check")
    @Operation(
        summary = "Check feature access",
        description = "Check if the current tenant has access to a specific feature based on their license entitlements."
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
        log.debug("Public feature check: tenant={}, feature={}", tenantId, featureKey);
        FeatureGateCheckResponse response = featureGateService.checkFeature(tenantId, featureKey);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/tenant")
    @Operation(
        summary = "Get tenant features",
        description = "Get all features available to the current tenant based on their license entitlements."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Tenant features retrieved")
    })
    public ResponseEntity<List<String>> getTenantFeatures(
            @Parameter(description = "Tenant ID", required = true)
            @RequestHeader(TENANT_HEADER) String tenantId
    ) {
        log.debug("Public get tenant features: tenant={}", tenantId);
        return ResponseEntity.ok(featureGateService.getTenantFeatures(tenantId));
    }
}
