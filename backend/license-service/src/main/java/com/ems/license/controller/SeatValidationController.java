package com.ems.license.controller;

import com.ems.license.dto.SeatValidationResponse;
import com.ems.license.service.SeatValidationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Internal API for seat validation.
 * Used by auth-facade during authentication to verify users have active license seats.
 */
@RestController
@RequestMapping("/api/v1/internal/seats")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Seat Validation (Internal)", description = "Internal API for validating user license seats during authentication")
public class SeatValidationController {

    private final SeatValidationService seatValidationService;

    @GetMapping("/validate")
    @Operation(
        summary = "Validate user seat",
        description = "Check if a user has an active license seat assignment for the specified tenant. " +
                "This is an internal API used by auth-facade during login."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Validation completed (check 'valid' field in response)"),
        @ApiResponse(responseCode = "400", description = "Invalid request parameters")
    })
    public ResponseEntity<SeatValidationResponse> validateSeat(
            @Parameter(description = "Tenant identifier", required = true)
            @RequestParam String tenantId,
            @Parameter(description = "User UUID", required = true)
            @RequestParam UUID userId
    ) {
        log.debug("Seat validation request for user {} in tenant {}", userId, tenantId);

        SeatValidationResponse response = seatValidationService.validateSeat(tenantId, userId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/cache")
    @Operation(
        summary = "Invalidate seat validation cache",
        description = "Invalidate the cached seat validation for a user. " +
                "Should be called when license assignments change."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Cache invalidated successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid request parameters")
    })
    public ResponseEntity<Void> invalidateCache(
            @Parameter(description = "Tenant identifier", required = true)
            @RequestParam String tenantId,
            @Parameter(description = "User UUID", required = true)
            @RequestParam UUID userId
    ) {
        log.debug("Invalidating seat validation cache for user {} in tenant {}", userId, tenantId);

        seatValidationService.invalidateCache(tenantId, userId);
        return ResponseEntity.noContent().build();
    }
}
