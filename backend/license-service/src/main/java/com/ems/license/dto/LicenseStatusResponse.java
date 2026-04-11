package com.ems.license.dto;

import com.ems.license.entity.LicenseState;
import lombok.Builder;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Response DTO representing the current license status of the installation.
 *
 * @param state the current runtime license state
 * @param licenseId the globally unique license identifier (null if UNLICENSED)
 * @param licenseFileId UUID of the active license file (null if UNLICENSED)
 * @param product the licensed product name
 * @param expiresAt when the application license expires
 * @param gracePeriodDays days of grace period after expiry
 * @param graceExpiresAt when the grace period ends (expiresAt + gracePeriodDays)
 * @param features currently available features
 * @param degradedFeatures features that are disabled during grace period
 * @param maxTenants maximum tenants permitted
 * @param activeTenantCount current number of tenant licenses
 * @param issuer vendor name from the license
 * @param customerName customer name from the license
 * @param importedAt when the active license was imported
 */
@Builder
public record LicenseStatusResponse(
    LicenseState state,
    String licenseId,
    UUID licenseFileId,
    String product,
    Instant expiresAt,
    Integer gracePeriodDays,
    Instant graceExpiresAt,
    List<String> features,
    List<String> degradedFeatures,
    Integer maxTenants,
    Integer activeTenantCount,
    String issuer,
    String customerName,
    Instant importedAt
) {}
