package com.ems.license.dto;

import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for license file import.
 * The actual file bytes are typically provided via multipart upload,
 * but this record wraps them for service-layer processing.
 *
 * @param licenseFile the raw {@code .lic} file bytes
 */
public record LicenseImportRequest(
    @NotNull(message = "License file content is required")
    byte[] licenseFile
) {}
