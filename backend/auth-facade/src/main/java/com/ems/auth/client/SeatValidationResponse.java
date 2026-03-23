package com.ems.auth.client;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO for seat validation from license-service.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SeatValidationResponse {

    /**
     * Whether the user has a valid active seat.
     */
    private boolean valid;

    /**
     * The ID of the license if valid.
     */
    private UUID licenseId;

    /**
     * The name of the product if valid.
     */
    private String productName;

    /**
     * When the license expires.
     */
    private LocalDateTime expiresAt;
}
