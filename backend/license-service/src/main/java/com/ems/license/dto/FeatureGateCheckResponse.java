package com.ems.license.dto;

import lombok.Builder;

/**
 * Response DTO for feature gate checks.
 *
 * @param allowed whether the feature is permitted for the tenant
 * @param featureKey the feature key that was checked
 * @param reason human-readable explanation (especially useful when denied)
 */
@Builder
public record FeatureGateCheckResponse(
    boolean allowed,
    String featureKey,
    String reason
) {

    /**
     * Create an allowed response.
     *
     * @param featureKey the feature key
     * @return a response indicating feature access is granted
     */
    public static FeatureGateCheckResponse allowed(String featureKey) {
        return FeatureGateCheckResponse.builder()
            .allowed(true)
            .featureKey(featureKey)
            .reason("Feature access granted")
            .build();
    }

    /**
     * Create a denied response.
     *
     * @param featureKey the feature key
     * @param reason why access was denied
     * @return a response indicating feature access is denied
     */
    public static FeatureGateCheckResponse denied(String featureKey, String reason) {
        return FeatureGateCheckResponse.builder()
            .allowed(false)
            .featureKey(featureKey)
            .reason(reason)
            .build();
    }
}
