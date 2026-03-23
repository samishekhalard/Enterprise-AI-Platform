package com.ems.auth.service;

import com.ems.auth.config.KeycloakConfig;
import com.ems.auth.dto.PagedResponse;
import com.ems.auth.dto.UserResponse;
import com.ems.auth.exception.UserNotFoundException;
import com.ems.auth.graph.entity.GroupNode;
import com.ems.auth.graph.entity.RoleNode;
import com.ems.auth.graph.entity.UserNode;
import com.ems.auth.graph.repository.UserGraphRepository;
import com.ems.auth.util.RealmResolver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.admin.client.resource.UsersResource;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Implementation of UserManagementService.
 *
 * Combines Keycloak Admin API (source of truth for user identity) with
 * Neo4j graph data (roles, groups) to provide a unified user view.
 *
 * The service uses Keycloak for:
 * - User listing with search/pagination
 * - User details (email, name, enabled status)
 * - Last login timestamps
 *
 * And enriches with Neo4j for:
 * - Effective roles (direct + inherited via groups)
 * - Group memberships
 * - Identity provider information
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class UserManagementServiceImpl implements UserManagementService {

    private static final int MAX_PAGE_SIZE = 100;

    private final KeycloakConfig keycloakConfig;
    private final UserGraphRepository userGraphRepository;

    @Override
    public PagedResponse<UserResponse> listUsers(
            String tenantId,
            int page,
            int size,
            String search,
            String role,
            String status
    ) {
        log.debug("Listing users for tenant {} (page={}, size={}, search={}, role={}, status={})",
            tenantId, page, size, search, role, status);

        int effectiveSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        String realm = resolveRealm(tenantId);

        try (Keycloak keycloak = getAdminClient()) {
            RealmResource realmResource = keycloak.realm(realm);
            UsersResource usersResource = realmResource.users();

            // Get total count for pagination metadata
            int totalCount = usersResource.count(search);

            if (totalCount == 0) {
                log.debug("No users found for tenant {} with given filters", tenantId);
                return PagedResponse.empty(page, effectiveSize);
            }

            // Fetch the page of users from Keycloak
            int firstResult = page * effectiveSize;
            List<UserRepresentation> keycloakUsers = usersResource.search(
                search,         // search term (name or email)
                firstResult,    // offset
                effectiveSize   // max results
            );

            // Load graph data for enrichment (roles, groups)
            Map<String, UserNode> graphUserMap = loadGraphUsers(tenantId, keycloakUsers);

            // Map to response DTOs, enriching with graph data
            List<UserResponse> users = keycloakUsers.stream()
                .map(kcUser -> toUserResponse(kcUser, graphUserMap.get(kcUser.getId())))
                .toList();

            // Apply post-fetch filters (Keycloak search API doesn't support role or enabled filtering inline)
            List<UserResponse> filteredUsers = users;
            long filteredTotal = totalCount;

            // Status filter
            if (status != null && !status.isBlank()) {
                boolean wantActive = "active".equalsIgnoreCase(status);
                filteredUsers = filteredUsers.stream()
                    .filter(u -> u.active() == wantActive)
                    .toList();
                filteredTotal = filteredUsers.size();
            }

            // Role filter
            if (role != null && !role.isBlank()) {
                filteredUsers = filteredUsers.stream()
                    .filter(u -> u.roles().stream().anyMatch(r -> r.equalsIgnoreCase(role)))
                    .toList();
                filteredTotal = filteredUsers.size();
            }

            log.debug("Retrieved {} users (total: {}) for tenant {}", filteredUsers.size(), filteredTotal, tenantId);
            return PagedResponse.of(filteredUsers, page, effectiveSize, filteredTotal);
        } catch (Exception e) {
            log.error("Failed to list users for tenant {}: {}", tenantId, e.getMessage(), e);
            return PagedResponse.empty(page, effectiveSize);
        }
    }

    @Override
    public UserResponse getUser(String tenantId, String userId) {
        log.debug("Getting user {} for tenant {}", userId, tenantId);

        String realm = resolveRealm(tenantId);

        try (Keycloak keycloak = getAdminClient()) {
            RealmResource realmResource = keycloak.realm(realm);
            UserRepresentation kcUser = realmResource.users().get(userId).toRepresentation();

            if (kcUser == null) {
                throw new UserNotFoundException(tenantId, userId);
            }

            // Load graph data for enrichment
            Optional<UserNode> graphUser = userGraphRepository.findByIdAndTenantId(userId, tenantId);

            UserResponse response = toUserResponse(kcUser, graphUser.orElse(null));
            log.debug("Retrieved user {} ({}) for tenant {}", userId, kcUser.getEmail(), tenantId);
            return response;
        } catch (UserNotFoundException e) {
            throw e;
        } catch (jakarta.ws.rs.NotFoundException e) {
            log.warn("User {} not found in Keycloak realm for tenant {}", userId, tenantId);
            throw new UserNotFoundException(tenantId, userId);
        } catch (Exception e) {
            log.error("Failed to get user {} for tenant {}: {}", userId, tenantId, e.getMessage(), e);
            throw new UserNotFoundException(tenantId, userId);
        }
    }

    // =========================================================================
    // Private Helper Methods
    // =========================================================================

    /**
     * Resolve tenant ID to Keycloak realm name.
     * Master tenant uses 'master' realm directly.
     */
    private String resolveRealm(String tenantId) {
        if (isMasterTenant(tenantId)) {
            return "master";
        }
        if (tenantId.startsWith("tenant-")) {
            return tenantId;
        }
        return "tenant-" + tenantId;
    }

    /**
     * Check if the tenant is the master/admin tenant.
     */
    private boolean isMasterTenant(String tenantId) {
        return RealmResolver.isMasterTenant(tenantId);
    }

    /**
     * Resolve status string to Keycloak enabled filter.
     *
     * @param status "active", "inactive", or null
     * @return Boolean enabled filter or null for no filter
     */
    private Boolean resolveEnabledFilter(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }
        return switch (status.toLowerCase()) {
            case "active" -> Boolean.TRUE;
            case "inactive" -> Boolean.FALSE;
            default -> null;
        };
    }

    /**
     * Load graph user data from Neo4j for a batch of Keycloak users.
     * Returns a map of userId to UserNode for O(1) lookup during enrichment.
     */
    private Map<String, UserNode> loadGraphUsers(String tenantId, List<UserRepresentation> keycloakUsers) {
        if (keycloakUsers.isEmpty()) {
            return Collections.emptyMap();
        }

        try {
            List<UserNode> graphUsers = userGraphRepository.findAllByTenantId(tenantId);
            return graphUsers.stream()
                .collect(Collectors.toMap(UserNode::id, Function.identity(), (a, b) -> a));
        } catch (Exception e) {
            log.warn("Failed to load graph data for tenant {}: {}. Returning users without graph enrichment.",
                tenantId, e.getMessage());
            return Collections.emptyMap();
        }
    }

    /**
     * Map Keycloak UserRepresentation + optional Neo4j UserNode to UserResponse.
     */
    private UserResponse toUserResponse(UserRepresentation kcUser, UserNode graphUser) {
        // Extract roles from graph data
        List<String> roles = List.of();
        List<String> groups = List.of();
        String identityProvider = "keycloak";
        Instant lastLoginAt = null;

        if (graphUser != null) {
            roles = extractRoleNames(graphUser);
            groups = extractGroupNames(graphUser);
            if (graphUser.identityProvider() != null) {
                identityProvider = graphUser.identityProvider();
            }
            lastLoginAt = graphUser.lastLoginAt();
        }

        // Fall back to Keycloak realm roles if no graph roles found
        if (roles.isEmpty() && kcUser.getRealmRoles() != null) {
            roles = kcUser.getRealmRoles();
        }

        // Build display name
        String displayName = buildDisplayName(
            kcUser.getFirstName(),
            kcUser.getLastName(),
            kcUser.getEmail(),
            kcUser.getUsername()
        );

        // Determine creation timestamp
        Instant createdAt = null;
        if (kcUser.getCreatedTimestamp() != null && kcUser.getCreatedTimestamp() > 0) {
            createdAt = Instant.ofEpochMilli(kcUser.getCreatedTimestamp());
        }

        return UserResponse.builder()
            .id(kcUser.getId())
            .email(kcUser.getEmail())
            .firstName(kcUser.getFirstName())
            .lastName(kcUser.getLastName())
            .displayName(displayName)
            .active(Boolean.TRUE.equals(kcUser.isEnabled()))
            .emailVerified(Boolean.TRUE.equals(kcUser.isEmailVerified()))
            .roles(roles)
            .groups(groups)
            .identityProvider(identityProvider)
            .lastLoginAt(lastLoginAt)
            .createdAt(createdAt)
            .build();
    }

    /**
     * Extract role names from a user's direct roles.
     */
    private List<String> extractRoleNames(UserNode graphUser) {
        if (graphUser.directRoles() == null || graphUser.directRoles().isEmpty()) {
            return List.of();
        }
        return graphUser.directRoles().stream()
            .map(RoleNode::name)
            .toList();
    }

    /**
     * Extract group names from a user's group memberships.
     */
    private List<String> extractGroupNames(UserNode graphUser) {
        if (graphUser.groups() == null || graphUser.groups().isEmpty()) {
            return List.of();
        }
        return graphUser.groups().stream()
            .map(GroupNode::name)
            .toList();
    }

    /**
     * Build a display name from first name, last name, and email.
     */
    private String buildDisplayName(String firstName, String lastName, String email, String username) {
        if (firstName == null && lastName == null) {
            if (email != null && !email.isBlank()) {
                return email;
            }
            if (username != null && !username.isBlank()) {
                return username;
            }
            return "Unknown User";
        }
        if (firstName == null) {
            return lastName;
        }
        if (lastName == null) {
            return firstName;
        }
        return firstName + " " + lastName;
    }

    /**
     * Create a Keycloak admin client for realm management.
     */
    private Keycloak getAdminClient() {
        return KeycloakBuilder.builder()
            .serverUrl(keycloakConfig.getServerUrl())
            .realm(keycloakConfig.getMasterRealm())
            .clientId(keycloakConfig.getAdmin().getClientId())
            .username(keycloakConfig.getAdmin().getUsername())
            .password(keycloakConfig.getAdmin().getPassword())
            .build();
    }
}
