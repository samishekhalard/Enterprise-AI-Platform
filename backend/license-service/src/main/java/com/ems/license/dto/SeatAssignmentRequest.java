package com.ems.license.dto;

import com.ems.license.entity.UserTier;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/**
 * Request DTO for assigning a seat to a user within a tenant.
 *
 * @param userId the UUID of the user to assign
 * @param tenantId the tenant context for the assignment
 * @param tier the capability tier to grant
 */
public record SeatAssignmentRequest(
    @NotNull(message = "User ID is required")
    UUID userId,

    @NotBlank(message = "Tenant ID is required")
    String tenantId,

    @NotNull(message = "User tier is required")
    UserTier tier
) {}
