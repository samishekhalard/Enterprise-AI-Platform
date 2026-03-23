package com.ems.license.controller;

import com.ems.license.dto.SeatAssignmentRequest;
import com.ems.license.dto.SeatAssignmentResponse;
import com.ems.license.entity.TenantLicenseEntity;
import com.ems.license.entity.TierSeatAllocationEntity;
import com.ems.license.entity.UserLicenseAssignmentEntity;
import com.ems.license.entity.UserTier;
import com.ems.license.repository.TenantLicenseRepository;
import com.ems.license.repository.TierSeatAllocationRepository;
import com.ems.license.repository.UserLicenseAssignmentRepository;
import com.ems.license.service.SeatValidationService;
import com.ems.common.exception.BusinessException;
import com.ems.common.exception.ResourceNotFoundException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Tenant admin endpoints for managing user seat assignments within a tenant.
 */
@RestController
@RequestMapping("/api/v1/tenants/{tenantId}/seats")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Seat Management", description = "Tenant admin endpoints for user seat assignment and management")
public class SeatManagementController {

    private final UserLicenseAssignmentRepository assignmentRepository;
    private final TenantLicenseRepository tenantLicenseRepository;
    private final TierSeatAllocationRepository tierSeatAllocationRepository;
    private final SeatValidationService seatValidationService;

    @PostMapping
    @Operation(
        summary = "Assign a seat to a user",
        description = "Assign a capability tier seat to a user within a tenant. " +
                      "Validates seat availability and prevents duplicate assignments."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Seat assigned successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid request or no seats available"),
        @ApiResponse(responseCode = "404", description = "Tenant license not found"),
        @ApiResponse(responseCode = "409", description = "User already has a seat in this tenant")
    })
    @Transactional
    public ResponseEntity<SeatAssignmentResponse> assignSeat(
            @Parameter(description = "Tenant identifier", required = true)
            @PathVariable String tenantId,
            @Parameter(description = "Authenticated admin principal", required = true, hidden = true)
            Principal principal,
            @Valid @RequestBody SeatAssignmentRequest request
    ) {
        UUID assignedBy = getAuthenticatedUserId(principal);
        log.info("Assigning seat to user {} in tenant {} with tier {}",
            request.userId(), tenantId, request.tier());

        // Validate request tenantId matches path
        if (!tenantId.equals(request.tenantId())) {
            throw new BusinessException("tenant_mismatch",
                "Request tenantId does not match path tenantId");
        }

        // Find tenant license
        List<TenantLicenseEntity> tenantLicenses = tenantLicenseRepository.findByTenantId(tenantId);
        if (tenantLicenses.isEmpty()) {
            throw new ResourceNotFoundException("TenantLicense", tenantId);
        }
        TenantLicenseEntity tenantLicense = tenantLicenses.getFirst();

        // Check for existing assignment (BR-ULA001: one tier per tenant per user)
        if (assignmentRepository.findByUserIdAndTenantId(request.userId(), tenantId).isPresent()) {
            throw new BusinessException("already_assigned",
                "User already has a seat assignment in tenant '" + tenantId + "'");
        }

        // Check seat availability
        if (!seatValidationService.hasAvailableSeats(tenantId, request.tier())) {
            throw new BusinessException("no_seats_available",
                "No available seats for tier " + request.tier().getDisplayName() + " in tenant '" + tenantId + "'");
        }

        // Create assignment
        UserLicenseAssignmentEntity assignment = UserLicenseAssignmentEntity.builder()
            .tenantLicense(tenantLicense)
            .userId(request.userId())
            .tenantId(tenantId)
            .tier(request.tier())
            .assignedAt(Instant.now())
            .assignedBy(assignedBy)
            .build();

        assignment = assignmentRepository.save(assignment);
        log.info("Assigned seat to user {} in tenant {} with tier {} (assignment: {})",
            request.userId(), tenantId, request.tier(), assignment.getId());

        // Invalidate cache
        seatValidationService.invalidateCache(tenantId, request.userId());

        SeatAssignmentResponse response = SeatAssignmentResponse.builder()
            .assignmentId(assignment.getId())
            .userId(assignment.getUserId())
            .tenantId(assignment.getTenantId())
            .tier(assignment.getTier())
            .assignedAt(assignment.getAssignedAt())
            .assignedBy(assignment.getAssignedBy())
            .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/{userId}")
    @Operation(
        summary = "Revoke a user's seat",
        description = "Remove a user's seat assignment from a tenant."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Seat revoked successfully"),
        @ApiResponse(responseCode = "404", description = "Assignment not found")
    })
    @Transactional
    public ResponseEntity<Void> revokeSeat(
            @Parameter(description = "Tenant identifier", required = true)
            @PathVariable String tenantId,
            @Parameter(description = "User whose seat to revoke", required = true)
            @PathVariable UUID userId
    ) {
        log.info("Revoking seat for user {} in tenant {}", userId, tenantId);

        UserLicenseAssignmentEntity assignment = assignmentRepository
            .findByUserIdAndTenantId(userId, tenantId)
            .orElseThrow(() -> new ResourceNotFoundException("UserLicenseAssignment",
                "userId=" + userId + ", tenantId=" + tenantId));

        assignmentRepository.delete(assignment);
        log.info("Revoked seat for user {} in tenant {} (was tier: {})",
            userId, tenantId, assignment.getTier());

        // Invalidate cache
        seatValidationService.invalidateCache(tenantId, userId);

        return ResponseEntity.noContent().build();
    }

    @GetMapping
    @Operation(
        summary = "List seat assignments",
        description = "Get all user seat assignments within a tenant."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Seat assignments retrieved")
    })
    public ResponseEntity<List<SeatAssignmentResponse>> listSeats(
            @Parameter(description = "Tenant identifier", required = true)
            @PathVariable String tenantId
    ) {
        log.debug("Listing seat assignments for tenant {}", tenantId);

        List<SeatAssignmentResponse> assignments = assignmentRepository.findByTenantId(tenantId)
            .stream()
            .map(a -> SeatAssignmentResponse.builder()
                .assignmentId(a.getId())
                .userId(a.getUserId())
                .tenantId(a.getTenantId())
                .tier(a.getTier())
                .assignedAt(a.getAssignedAt())
                .assignedBy(a.getAssignedBy())
                .build())
            .toList();

        return ResponseEntity.ok(assignments);
    }

    @GetMapping("/availability")
    @Operation(
        summary = "Check seat availability by tier",
        description = "Returns seat availability for all tiers in a tenant."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Seat availability retrieved"),
        @ApiResponse(responseCode = "404", description = "Tenant license not found")
    })
    public ResponseEntity<Map<UserTier, SeatAvailabilityInfo>> getSeatAvailability(
            @Parameter(description = "Tenant identifier", required = true)
            @PathVariable String tenantId
    ) {
        log.debug("Checking seat availability for tenant {}", tenantId);

        List<TenantLicenseEntity> tenantLicenses = tenantLicenseRepository.findByTenantId(tenantId);
        if (tenantLicenses.isEmpty()) {
            throw new ResourceNotFoundException("TenantLicense", tenantId);
        }

        TenantLicenseEntity tenantLicense = tenantLicenses.getFirst();
        List<TierSeatAllocationEntity> allocations =
            tierSeatAllocationRepository.findByTenantLicenseId(tenantLicense.getId());

        Map<UserTier, SeatAvailabilityInfo> availability = new java.util.LinkedHashMap<>();

        for (TierSeatAllocationEntity allocation : allocations) {
            long assigned = assignmentRepository.countByTenantIdAndTier(tenantId, allocation.getTier());
            int maxSeats = allocation.getMaxSeats();
            boolean unlimited = allocation.isUnlimited();
            long available = unlimited ? -1 : (maxSeats - assigned);

            availability.put(allocation.getTier(), new SeatAvailabilityInfo(
                maxSeats,
                assigned,
                available,
                unlimited
            ));
        }

        return ResponseEntity.ok(availability);
    }

    /**
     * Seat availability information for a specific tier.
     *
     * @param maxSeats the maximum allowed seats (-1 = unlimited)
     * @param assigned the number of currently assigned seats
     * @param available the number of available seats (-1 = unlimited)
     * @param unlimited whether this tier has unlimited seats
     */
    public record SeatAvailabilityInfo(
        int maxSeats,
        long assigned,
        long available,
        boolean unlimited
    ) {}

    private UUID getAuthenticatedUserId(Principal principal) {
        if (principal == null || principal.getName() == null || principal.getName().isBlank()) {
            throw new IllegalArgumentException("Authenticated JWT subject is required");
        }
        return UUID.fromString(principal.getName());
    }
}
