package com.ems.auth.controller;

import com.ems.auth.dto.PagedResponse;
import com.ems.auth.dto.UserResponse;
import com.ems.auth.service.UserManagementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Admin Controller for managing users within a tenant.
 *
 * Provides read-only endpoints for listing and retrieving user details.
 * User data is sourced from Keycloak (identity provider) and enriched
 * with Neo4j graph data (roles, groups).
 *
 * All endpoints require ADMIN role.
 */
@RestController
@RequestMapping("/api/v1/admin/tenants/{tenantId}/users")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin User Management", description = "Administrative endpoints for viewing users within a tenant")
@SecurityRequirement(name = "bearerAuth")
public class AdminUserController {

    private final UserManagementService userManagementService;

    /**
     * List users for a tenant with pagination, search, and filters.
     *
     * @param tenantId The tenant identifier
     * @param page     Page number (zero-based, default: 0)
     * @param size     Page size (default: 20, max: 100)
     * @param search   Optional search term (filters by name or email)
     * @param role     Optional role filter
     * @param status   Optional status filter ("active" or "inactive")
     * @return Paginated list of users
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @Operation(
        summary = "List users for a tenant",
        description = """
            Returns a paginated list of users for the specified tenant.
            Users are sourced from Keycloak and enriched with Neo4j graph data
            (roles, groups).

            **Filters:**
            - `search` - Filter by name or email (partial match)
            - `role` - Filter by role name (exact match)
            - `status` - Filter by account status ("active" or "inactive")

            **Pagination:**
            - `page` - Zero-based page number (default: 0)
            - `size` - Page size (default: 20, max: 100)
            """
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "User list retrieved successfully",
            content = @Content(schema = @Schema(implementation = PagedResponse.class))
        ),
        @ApiResponse(responseCode = "401", description = "Not authenticated"),
        @ApiResponse(responseCode = "403", description = "Insufficient permissions (requires ADMIN role)"),
        @ApiResponse(responseCode = "404", description = "Tenant not found")
    })
    public ResponseEntity<PagedResponse<UserResponse>> listUsers(
            @Parameter(description = "Tenant identifier", required = true, example = "tenant-acme")
            @PathVariable String tenantId,
            @Parameter(description = "Page number (zero-based)", example = "0")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size (max 100)", example = "20")
            @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Search term (name or email)", example = "john")
            @RequestParam(required = false) String search,
            @Parameter(description = "Filter by role name", example = "ADMIN")
            @RequestParam(required = false) String role,
            @Parameter(description = "Filter by status (active/inactive)", example = "active")
            @RequestParam(required = false) String status
    ) {
        log.debug("Listing users for tenant {} (page={}, size={}, search={}, role={}, status={})",
            tenantId, page, size, search, role, status);

        PagedResponse<UserResponse> response = userManagementService.listUsers(
            tenantId, page, size, search, role, status
        );

        log.info("Retrieved {} users (total: {}) for tenant {}",
            response.content().size(), response.totalElements(), tenantId);
        return ResponseEntity.ok(response);
    }

    /**
     * Get a single user by ID within a tenant.
     *
     * @param tenantId The tenant identifier
     * @param userId   The user identifier
     * @return User details
     */
    @GetMapping("/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @Operation(
        summary = "Get user by ID",
        description = """
            Returns detailed information for a specific user within a tenant.
            Data is sourced from Keycloak and enriched with Neo4j graph data
            (roles via HAS_ROLE, groups via MEMBER_OF).
            """
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "User retrieved successfully",
            content = @Content(schema = @Schema(implementation = UserResponse.class))
        ),
        @ApiResponse(responseCode = "401", description = "Not authenticated"),
        @ApiResponse(responseCode = "403", description = "Insufficient permissions (requires ADMIN role)"),
        @ApiResponse(responseCode = "404", description = "User not found")
    })
    public ResponseEntity<UserResponse> getUser(
            @Parameter(description = "Tenant identifier", required = true, example = "tenant-acme")
            @PathVariable String tenantId,
            @Parameter(description = "User identifier", required = true, example = "550e8400-e29b-41d4-a716-446655440000")
            @PathVariable String userId
    ) {
        log.debug("Getting user {} for tenant {}", userId, tenantId);

        UserResponse response = userManagementService.getUser(tenantId, userId);

        log.info("Retrieved user {} ({}) for tenant {}", userId, response.email(), tenantId);
        return ResponseEntity.ok(response);
    }
}
