package com.ems.license.dto;

import com.ems.license.entity.UserTier;
import lombok.Builder;

import java.time.Instant;
import java.util.UUID;

/**
 * Response DTO returned after a successful seat assignment.
 *
 * @param assignmentId the UUID of the created assignment record
 * @param userId the user who was assigned the seat
 * @param tenantId the tenant context
 * @param tier the assigned capability tier
 * @param assignedAt when the seat was allocated
 * @param assignedBy the administrator who performed the assignment
 */
@Builder
public record SeatAssignmentResponse(
    UUID assignmentId,
    UUID userId,
    String tenantId,
    UserTier tier,
    Instant assignedAt,
    UUID assignedBy
) {}
