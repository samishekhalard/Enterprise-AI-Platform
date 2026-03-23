package com.ems.license.service;

import com.ems.license.dto.FeatureGateCheckResponse;
import com.ems.license.entity.LicenseState;
import com.ems.license.entity.TenantLicenseEntity;
import com.ems.license.repository.TenantLicenseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Feature gate service implementation for the on-premise licensing model.
 *
 * <p>Features are checked at the tenant level based on the tenant license's
 * JSONB features array. The license state (ACTIVE, GRACE, EXPIRED, etc.)
 * determines whether feature checks pass.</p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class FeatureGateServiceImpl implements FeatureGateService {

    private final TenantLicenseRepository tenantLicenseRepository;
    private final LicenseStateHolder licenseStateHolder;
    private final StringRedisTemplate redisTemplate;

    private static final String CACHE_PREFIX = "license:feature:";
    private static final Duration CACHE_TTL = Duration.ofMinutes(5);

    @Override
    public FeatureGateCheckResponse checkFeature(String tenantId, String featureKey) {
        log.debug("Checking feature {} for tenant {}", featureKey, tenantId);

        // Check global license state
        LicenseState state = licenseStateHolder.getCurrentState();
        if (state == LicenseState.UNLICENSED || state == LicenseState.EXPIRED || state == LicenseState.TAMPERED) {
            return FeatureGateCheckResponse.denied(featureKey,
                "License is " + state.name().toLowerCase() + ". Feature access denied.");
        }

        // Check cache
        String cacheKey = CACHE_PREFIX + tenantId + ":tenant:" + featureKey;
        String cached = getCached(cacheKey);
        if (cached != null) {
            boolean hasAccess = "1".equals(cached);
            return hasAccess
                ? FeatureGateCheckResponse.allowed(featureKey)
                : FeatureGateCheckResponse.denied(featureKey, "Feature not available for tenant");
        }

        // Query tenant license
        List<TenantLicenseEntity> tenantLicenses = tenantLicenseRepository.findByTenantId(tenantId);
        if (tenantLicenses.isEmpty()) {
            cacheResult(cacheKey, false);
            return FeatureGateCheckResponse.denied(featureKey, "No tenant license found");
        }

        // Find the active (non-expired) tenant license with this feature
        boolean hasAccess = tenantLicenses.stream()
            .filter(tl -> tl.getExpiresAt().isAfter(Instant.now()))
            .anyMatch(tl -> tl.getFeatures().contains(featureKey));

        cacheResult(cacheKey, hasAccess);

        if (hasAccess) {
            return FeatureGateCheckResponse.allowed(featureKey);
        } else {
            return FeatureGateCheckResponse.denied(featureKey,
                "Feature '" + featureKey + "' is not licensed for tenant '" + tenantId + "'");
        }
    }

    @Override
    public List<String> getTenantFeatures(String tenantId) {
        log.debug("Getting all features for tenant {}", tenantId);

        // Check global license state
        LicenseState state = licenseStateHolder.getCurrentState();
        if (state == LicenseState.UNLICENSED || state == LicenseState.EXPIRED || state == LicenseState.TAMPERED) {
            return Collections.emptyList();
        }

        List<TenantLicenseEntity> tenantLicenses = tenantLicenseRepository.findByTenantId(tenantId);
        if (tenantLicenses.isEmpty()) {
            return Collections.emptyList();
        }

        // Collect all features from non-expired tenant licenses
        List<String> features = new ArrayList<>();
        for (TenantLicenseEntity tl : tenantLicenses) {
            if (tl.getExpiresAt().isAfter(Instant.now())) {
                features.addAll(tl.getFeatures());
            }
        }

        return features.stream().distinct().toList();
    }

    private String getCached(String cacheKey) {
        try {
            return redisTemplate.opsForValue().get(cacheKey);
        } catch (Exception e) {
            log.warn("Failed to read feature check from cache: {}", e.getMessage());
            return null;
        }
    }

    private void cacheResult(String key, boolean hasAccess) {
        try {
            redisTemplate.opsForValue().set(key, hasAccess ? "1" : "0", CACHE_TTL);
        } catch (Exception e) {
            log.warn("Failed to cache feature check result: {}", e.getMessage());
        }
    }
}
