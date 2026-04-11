package com.ems.license.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/**
 * Request DTO for internal seat validation checks.
 *
 * @param tenantId the tenant identifier
 * @param userId the user UUID to validate
 */
public record SeatValidationRequest(
    @NotBlank(message = "Tenant ID is required")
    String tenantId,

    @NotNull(message = "User ID is required")
    UUID userId
) {}
