package com.ems.license.service;

import com.ems.license.dto.SeatValidationResponse;
import com.ems.license.entity.UserTier;

import java.util.UUID;

/**
 * Service for validating user license seat assignments.
 * Used during authentication to verify a user has an active seat,
 * and for seat availability checks during assignment.
 */
public interface SeatValidationService {

    /**
     * Validates that a user has an active license seat in the given tenant.
     *
     * @param tenantId the tenant identifier
     * @param userId   the user's UUID
     * @return validation response with license details and tier if valid
     */
    SeatValidationResponse validateSeat(String tenantId, UUID userId);

    /**
     * Check if there are available seats for a given tier in a tenant.
     *
     * @param tenantId the tenant identifier
     * @param tier     the user tier to check availability for
     * @return {@code true} if seats are available (or unlimited)
     */
    boolean hasAvailableSeats(String tenantId, UserTier tier);

    /**
     * Invalidates the cached seat validation for a user.
     * Should be called when license assignments change.
     *
     * @param tenantId the tenant identifier
     * @param userId   the user's UUID
     */
    void invalidateCache(String tenantId, UUID userId);
}
