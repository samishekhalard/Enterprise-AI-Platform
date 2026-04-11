package com.ems.license.service;

import com.ems.license.dto.SeatValidationResponse;
import com.ems.license.entity.*;
import com.ems.license.repository.TenantLicenseRepository;
import com.ems.license.repository.TierSeatAllocationRepository;
import com.ems.license.repository.UserLicenseAssignmentRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Implementation of seat validation service with Valkey caching.
 * Adapted for the on-premise licensing model (ADR-015).
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class SeatValidationServiceImpl implements SeatValidationService {

    private final UserLicenseAssignmentRepository assignmentRepository;
    private final TenantLicenseRepository tenantLicenseRepository;
    private final TierSeatAllocationRepository tierSeatAllocationRepository;
    private final LicenseStateHolder licenseStateHolder;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    private static final String CACHE_PREFIX = "seat:validation:";
    private static final Duration CACHE_TTL = Duration.ofMinutes(5);

    @Override
    public SeatValidationResponse validateSeat(String tenantId, UUID userId) {
        log.debug("Validating seat for user {} in tenant {}", userId, tenantId);

        // Check global license state first
        LicenseState state = licenseStateHolder.getCurrentState();
        if (state == LicenseState.UNLICENSED || state == LicenseState.EXPIRED || state == LicenseState.TAMPERED) {
            log.info("Seat validation denied for user {} in tenant {}: license state is {}",
                userId, tenantId, state);
            return SeatValidationResponse.invalid("License is " + state.name().toLowerCase());
        }

        String cacheKey = buildCacheKey(tenantId, userId);

        // Check cache first
        SeatValidationResponse cached = getCachedResponse(cacheKey);
        if (cached != null) {
            log.debug("Seat validation cache hit for user {} in tenant {}", userId, tenantId);
            return cached;
        }

        // Query database for user's assignment in this tenant
        Optional<UserLicenseAssignmentEntity> assignmentOpt =
            assignmentRepository.findByUserIdAndTenantIdWithLicense(userId, tenantId);

        SeatValidationResponse response;
        if (assignmentOpt.isPresent()) {
            UserLicenseAssignmentEntity assignment = assignmentOpt.get();
            TenantLicenseEntity tenantLicense = assignment.getTenantLicense();
            Instant expiresAt = tenantLicense.getExpiresAt();

            // Check if tenant license has expired
            if (expiresAt.isBefore(Instant.now())) {
                response = SeatValidationResponse.invalid("Tenant license has expired");
                log.info("Seat validation failed for user {} in tenant {} - tenant license expired",
                    userId, tenantId);
            } else {
                response = SeatValidationResponse.valid(
                    tenantLicense.getId(),
                    assignment.getTier(),
                    expiresAt
                );
                log.info("Seat validation successful for user {} in tenant {}, tier: {}",
                    userId, tenantId, assignment.getTier());
            }
        } else {
            response = SeatValidationResponse.invalid("No active seat assignment found");
            log.info("Seat validation failed for user {} in tenant {} - no assignment",
                userId, tenantId);
        }

        // Cache the result
        cacheResponse(cacheKey, response);

        return response;
    }

    @Override
    public boolean hasAvailableSeats(String tenantId, UserTier tier) {
        log.debug("Checking seat availability for tier {} in tenant {}", tier, tenantId);

        // Find the tenant license for this tenant
        List<TenantLicenseEntity> tenantLicenses = tenantLicenseRepository.findByTenantId(tenantId);
        if (tenantLicenses.isEmpty()) {
            log.debug("No tenant license found for tenant {}", tenantId);
            return false;
        }

        // Use the first (should be the only active one via the parent application license)
        TenantLicenseEntity tenantLicense = tenantLicenses.getFirst();

        // Find the seat allocation for this tier
        Optional<TierSeatAllocationEntity> allocationOpt =
            tierSeatAllocationRepository.findByTenantLicenseIdAndTier(tenantLicense.getId(), tier);

        if (allocationOpt.isEmpty()) {
            log.debug("No seat allocation found for tier {} in tenant {}", tier, tenantId);
            return false;
        }

        TierSeatAllocationEntity allocation = allocationOpt.get();

        // Unlimited seats
        if (allocation.isUnlimited()) {
            return true;
        }

        // Count current assignments for this tier in this tenant
        long currentCount = assignmentRepository.countByTenantIdAndTier(tenantId, tier);
        boolean available = currentCount < allocation.getMaxSeats();

        log.debug("Seat availability for tier {} in tenant {}: {}/{} (available: {})",
            tier, tenantId, currentCount, allocation.getMaxSeats(), available);

        return available;
    }

    @Override
    @Transactional
    public void invalidateCache(String tenantId, UUID userId) {
        String cacheKey = buildCacheKey(tenantId, userId);
        try {
            Boolean deleted = redisTemplate.delete(cacheKey);
            if (Boolean.TRUE.equals(deleted)) {
                log.debug("Invalidated seat validation cache for user {} in tenant {}", userId, tenantId);
            }
        } catch (Exception e) {
            log.warn("Failed to invalidate seat validation cache: {}", e.getMessage());
        }
    }

    private String buildCacheKey(String tenantId, UUID userId) {
        return CACHE_PREFIX + tenantId + ":" + userId;
    }

    private SeatValidationResponse getCachedResponse(String cacheKey) {
        try {
            String cached = redisTemplate.opsForValue().get(cacheKey);
            if (cached != null) {
                return objectMapper.readValue(cached, SeatValidationResponse.class);
            }
        } catch (Exception e) {
            log.warn("Failed to read seat validation from cache: {}", e.getMessage());
        }
        return null;
    }

    private void cacheResponse(String cacheKey, SeatValidationResponse response) {
        try {
            String json = objectMapper.writeValueAsString(response);
            redisTemplate.opsForValue().set(cacheKey, json, CACHE_TTL);
        } catch (JsonProcessingException e) {
            log.warn("Failed to cache seat validation response: {}", e.getMessage());
        }
    }
}
