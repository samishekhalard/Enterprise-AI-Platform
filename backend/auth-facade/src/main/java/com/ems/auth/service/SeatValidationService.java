package com.ems.auth.service;

import com.ems.auth.client.LicenseServiceClient;
import com.ems.auth.client.SeatValidationResponse;
import com.ems.common.exception.AuthenticationException;
import com.ems.common.exception.NoActiveSeatException;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Service for validating user license seats during authentication.
 * Uses circuit breaker pattern for resilience.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SeatValidationService {

    private final LicenseServiceClient licenseServiceClient;

    /**
     * Validates that a user has an active license seat for the given tenant.
     * Throws NoActiveSeatException if validation fails.
     *
     * @param tenantId the tenant identifier
     * @param userId   the user's UUID as string
     * @throws NoActiveSeatException if the user does not have an active seat
     */
    @CircuitBreaker(name = "licenseService", fallbackMethod = "validateSeatFallback")
    public void validateUserSeat(String tenantId, String userId) {
        log.debug("Validating seat for user {} in tenant {}", userId, tenantId);

        try {
            UUID userUuid = UUID.fromString(userId);
            SeatValidationResponse response = licenseServiceClient.validateSeat(tenantId, userUuid);

            if (!response.isValid()) {
                if ("service_unavailable".equalsIgnoreCase(response.getReason())) {
                    log.warn("License service unavailable during seat validation for tenant {}", tenantId);
                    throw new AuthenticationException(
                        "License service unavailable",
                        "license_service_unavailable"
                    );
                }
                log.info("Seat validation failed for user {} in tenant {}", userId, tenantId);
                throw new NoActiveSeatException(tenantId, userId);
            }

            log.debug("Seat validation successful for user {} in tenant {}, tenantLicenseId: {}, tier: {}",
                    userId, tenantId, response.getTenantLicenseId(), response.getTier());

        } catch (NoActiveSeatException e) {
            throw e;
        } catch (AuthenticationException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error validating seat for user {} in tenant {}: {}",
                    userId, tenantId, e.getMessage());
            throw new AuthenticationException("License service unavailable", "license_service_unavailable");
        }
    }

    /**
     * Fallback method when circuit breaker is open.
     * Returns invalid to fail-safe and prevent unauthorized access.
     */
    @SuppressWarnings("unused")
    private void validateSeatFallback(String tenantId, String userId, Throwable ex) {
        log.error("Circuit breaker open for license service. Denying access for user {} in tenant {}. Error: {}",
                userId, tenantId, ex.getMessage());
        throw new AuthenticationException("License service unavailable", "license_service_unavailable");
    }
}
