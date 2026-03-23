package com.ems.auth.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.UUID;

/**
 * Feign client for communicating with license-service.
 * Uses Eureka service discovery for URL resolution.
 */
@FeignClient(
        name = "license-service",
        fallbackFactory = LicenseServiceClientFallbackFactory.class
)
public interface LicenseServiceClient {

    /**
     * Validates that a user has an active license seat in the given tenant.
     *
     * @param tenantId the tenant identifier
     * @param userId   the user's UUID
     * @return seat validation response
     */
    @GetMapping("/api/v1/internal/seats/validate")
    SeatValidationResponse validateSeat(
            @RequestParam("tenantId") String tenantId,
            @RequestParam("userId") UUID userId
    );
}
