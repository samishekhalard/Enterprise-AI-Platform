package com.ems.license.service;

import com.ems.license.dto.FeatureGateCheckResponse;

import java.util.List;

/**
 * Service for checking feature gate access at the tenant level.
 * In the on-premise model, features are licensed per-tenant via the license file.
 */
public interface FeatureGateService {

    /**
     * Check if a specific feature is licensed for a tenant.
     *
     * @param tenantId   the tenant identifier
     * @param featureKey the feature key to check (e.g., "advanced_reports")
     * @return response indicating whether the feature is allowed
     */
    FeatureGateCheckResponse checkFeature(String tenantId, String featureKey);

    /**
     * Get all licensed features for a tenant.
     *
     * @param tenantId the tenant identifier
     * @return list of feature keys licensed for the tenant
     */
    List<String> getTenantFeatures(String tenantId);
}
