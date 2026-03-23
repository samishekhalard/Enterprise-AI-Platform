package com.ems.license.dto;

import com.ems.license.entity.UserTier;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

/**
 * Response DTO for seat validation requests.
 * Used by internal services (e.g., auth-facade) to verify a user has an active license seat.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SeatValidationResponse {

    /** Whether the user has a valid active seat. */
    private boolean valid;

    /** The assigned capability tier, if valid. */
    private UserTier tier;

    /** The UUID of the tenant license, if valid. */
    private UUID tenantLicenseId;

    /** Human-readable explanation (e.g., reason for denial). */
    private String reason;

    /** When the tenant license expires. */
    private Instant expiresAt;

    /**
     * Create a valid response.
     *
     * @param tenantLicenseId the tenant license UUID
     * @param tier the assigned user tier
     * @param expiresAt when the license expires
     * @return a valid seat validation response
     */
    public static SeatValidationResponse valid(UUID tenantLicenseId, UserTier tier, Instant expiresAt) {
        return SeatValidationResponse.builder()
                .valid(true)
                .tenantLicenseId(tenantLicenseId)
                .tier(tier)
                .expiresAt(expiresAt)
                .reason("Seat assignment valid")
                .build();
    }

    /**
     * Create an invalid response with a reason.
     *
     * @param reason explanation of why validation failed
     * @return an invalid seat validation response
     */
    public static SeatValidationResponse invalid(String reason) {
        return SeatValidationResponse.builder()
                .valid(false)
                .reason(reason)
                .build();
    }
}
