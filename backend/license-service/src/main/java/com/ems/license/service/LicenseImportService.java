package com.ems.license.service;

import com.ems.license.dto.LicenseImportResponse;

import java.util.UUID;

/**
 * Service for importing and verifying cryptographic license files.
 *
 * <p>Handles parsing, signature verification, validation checks (ADR-015 Section 2.3),
 * superseding of the previous license, and persistence of the new license hierarchy
 * (LicenseFile -> ApplicationLicense -> TenantLicenses -> TierSeatAllocations).</p>
 */
public interface LicenseImportService {

    /**
     * Import a license file. Performs all validation checks, supersedes the previous
     * active license (if any), and persists the new license hierarchy.
     *
     * @param licenseFileBytes the raw {@code .lic} file bytes
     * @param importedBy the UUID of the superadmin performing the import
     * @return response with details of the imported license
     * @throws com.ems.common.exception.BusinessException if any validation check fails
     */
    LicenseImportResponse importLicense(byte[] licenseFileBytes, UUID importedBy);

    /**
     * Re-verify the stored active license at startup.
     * Recomputes the license state based on signature validity and expiry.
     */
    void reimportFromStorage();
}
