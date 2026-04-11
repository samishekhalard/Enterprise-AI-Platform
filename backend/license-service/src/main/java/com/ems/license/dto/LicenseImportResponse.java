package com.ems.license.dto;

import lombok.Builder;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Response DTO returned after a successful license file import.
 * Contains the key details extracted from the license payload.
 *
 * @param licenseFileId the UUID of the persisted license file record
 * @param licenseId the globally unique license identifier from the payload
 * @param product the product name (e.g., "EMSIST")
 * @param versionRange the supported version range (e.g., "1.0.0 - 2.99.99")
 * @param maxTenants maximum number of tenants permitted
 * @param expiresAt application-level expiry date
 * @param features master feature set
 * @param gracePeriodDays days of degraded operation after expiry
 * @param tenantCount number of tenant licenses imported
 * @param importedAt when the import was processed
 */
@Builder
public record LicenseImportResponse(
    UUID licenseFileId,
    String licenseId,
    String product,
    String versionRange,
    Integer maxTenants,
    Instant expiresAt,
    List<String> features,
    Integer gracePeriodDays,
    Integer tenantCount,
    Instant importedAt
) {}
