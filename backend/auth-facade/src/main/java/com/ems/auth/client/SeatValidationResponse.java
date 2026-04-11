package com.ems.auth.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

/**
 * Response DTO for seat validation from license-service.
 * Aligned with license-service SeatValidationResponse contract.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class SeatValidationResponse {
    private boolean valid;
    private String tier;
    private UUID tenantLicenseId;
    private String reason;
    private Instant expiresAt;
}
