package com.ems.license.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request DTO for checking if a specific feature is accessible for a tenant.
 *
 * @param tenantId the tenant identifier
 * @param featureKey the feature key to check (e.g., "advanced_reports")
 */
public record FeatureGateCheckRequest(
    @NotBlank(message = "Tenant ID is required")
    String tenantId,

    @NotBlank(message = "Feature key is required")
    String featureKey
) {}
