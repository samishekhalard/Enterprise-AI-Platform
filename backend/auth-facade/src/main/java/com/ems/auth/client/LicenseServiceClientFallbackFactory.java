package com.ems.auth.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.openfeign.FallbackFactory;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Fallback factory for LicenseServiceClient.
 * Provides graceful degradation when license-service is unavailable.
 */
@Component
@Slf4j
public class LicenseServiceClientFallbackFactory implements FallbackFactory<LicenseServiceClient> {

    @Override
    public LicenseServiceClient create(Throwable cause) {
        return new LicenseServiceClient() {
            @Override
            public SeatValidationResponse validateSeat(String tenantId, UUID userId) {
                log.error("License service unavailable for seat validation. Tenant: {}, User: {}, Error: {}",
                        tenantId, userId, cause.getMessage());

                // In production, you might want to:
                // 1. Return invalid (fail-safe) - prevents access when license service is down
                // 2. Return valid (fail-open) - allows access but logs for later reconciliation
                //
                // Current implementation: fail-safe (return invalid)
                // This prevents unauthorized access when the license service is unavailable.
                return SeatValidationResponse.builder()
                        .valid(false)
                        .build();
            }
        };
    }
}
