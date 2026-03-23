package com.ems.auth.service;

import com.ems.auth.dto.PagedResponse;
import com.ems.auth.dto.UserResponse;

/**
 * Service interface for user management operations.
 *
 * Combines Keycloak (source of truth for user identity) with
 * Neo4j graph data (roles, groups, relationships) to provide
 * a unified view of users within a tenant.
 */
public interface UserManagementService {

    /**
     * List users for a tenant with pagination, search, and filters.
     *
     * Retrieves users from Keycloak Admin API and enriches with
     * Neo4j graph data (roles via HAS_ROLE, groups via MEMBER_OF).
     *
     * @param tenantId The tenant identifier
     * @param page     Page number (zero-based)
     * @param size     Page size (max 100)
     * @param search   Optional search term (filters by name or email)
     * @param role     Optional role filter
     * @param status   Optional status filter ("active" or "inactive")
     * @return Paginated list of users
     */
    PagedResponse<UserResponse> listUsers(
        String tenantId,
        int page,
        int size,
        String search,
        String role,
        String status
    );

    /**
     * Get a single user by ID within a tenant.
     *
     * Retrieves user from Keycloak and enriches with Neo4j graph data.
     *
     * @param tenantId The tenant identifier
     * @param userId   The user identifier
     * @return User details
     * @throws com.ems.auth.exception.UserNotFoundException if user not found
     */
    UserResponse getUser(String tenantId, String userId);
}
