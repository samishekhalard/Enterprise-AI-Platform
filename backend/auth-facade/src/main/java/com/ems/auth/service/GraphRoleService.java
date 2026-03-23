package com.ems.auth.service;

import com.ems.auth.graph.repository.AuthGraphRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.Collections;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Graph-based Role Service for RBAC.
 *
 * This service provides deep role lookup using the Neo4j identity graph.
 * It traverses:
 * 1. User's direct roles
 * 2. Roles from groups the user is a member of
 * 3. Roles inherited from parent roles (transitive)
 *
 * Results are cached in Valkey to minimize Neo4j queries.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GraphRoleService {

    private final AuthGraphRepository repository;

    /**
     * Get effective roles for a user by email.
     *
     * This method performs a deep lookup traversing:
     * - Direct user roles
     * - Group memberships (recursive)
     * - Role inheritance (recursive)
     *
     * Results are cached with key "userRoles::email".
     *
     * @param email The user's email address
     * @return Set of effective role names
     */
    @Cacheable(value = "userRoles", key = "#email")
    public Set<String> getEffectiveRoles(String email) {
        log.debug("Looking up effective roles for user: {}", email);

        if (email == null || email.isBlank()) {
            log.warn("Attempted to lookup roles for null/blank email");
            return Collections.emptySet();
        }

        Set<String> roles = repository.findEffectiveRoles(email);
        log.debug("Found {} effective roles for user {}: {}", roles.size(), email, roles);

        return roles;
    }

    /**
     * Get effective roles for a user by ID.
     *
     * @param userId The user's unique identifier
     * @return Set of effective role names
     */
    @Cacheable(value = "userRoles", key = "'id:' + #userId")
    public Set<String> getEffectiveRolesById(String userId) {
        log.debug("Looking up effective roles for user ID: {}", userId);

        if (userId == null || userId.isBlank()) {
            log.warn("Attempted to lookup roles for null/blank user ID");
            return Collections.emptySet();
        }

        Set<String> roles = repository.findEffectiveRolesById(userId);
        log.debug("Found {} effective roles for user {}: {}", roles.size(), userId, roles);

        return roles;
    }

    /**
     * Get effective roles for a user within a specific tenant.
     *
     * This restricts role lookup to tenant-specific roles and global roles.
     *
     * @param email The user's email address
     * @param tenantId The tenant identifier
     * @return Set of effective role names
     */
    @Cacheable(value = "userRoles", key = "#tenantId + ':' + #email")
    public Set<String> getEffectiveRolesForTenant(String email, String tenantId) {
        log.debug("Looking up effective roles for user {} in tenant {}", email, tenantId);

        if (email == null || email.isBlank()) {
            log.warn("Attempted to lookup roles for null/blank email");
            return Collections.emptySet();
        }

        if (tenantId == null || tenantId.isBlank()) {
            // Fall back to global role lookup
            return getEffectiveRoles(email);
        }

        Set<String> roles = repository.findEffectiveRolesForTenant(email, tenantId);
        log.debug("Found {} effective roles for user {} in tenant {}: {}",
            roles.size(), email, tenantId, roles);

        return roles;
    }

    /**
     * Get Spring Security authorities for a user.
     *
     * Converts role names to GrantedAuthority instances with ROLE_ prefix.
     *
     * @param email The user's email address
     * @return Collection of GrantedAuthority
     */
    public Collection<GrantedAuthority> getAuthorities(String email) {
        return getEffectiveRoles(email).stream()
            .map(role -> new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()))
            .collect(Collectors.toSet());
    }

    /**
     * Get Spring Security authorities for a user within a tenant.
     *
     * @param email The user's email address
     * @param tenantId The tenant identifier
     * @return Collection of GrantedAuthority
     */
    public Collection<GrantedAuthority> getAuthoritiesForTenant(String email, String tenantId) {
        return getEffectiveRolesForTenant(email, tenantId).stream()
            .map(role -> new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()))
            .collect(Collectors.toSet());
    }

    /**
     * Check if a user has a specific role.
     *
     * @param email The user's email address
     * @param roleName The role to check
     * @return true if the user has the role
     */
    public boolean hasRole(String email, String roleName) {
        return getEffectiveRoles(email).stream()
            .anyMatch(role -> role.equalsIgnoreCase(roleName));
    }

    /**
     * Check if a user has any of the specified roles.
     *
     * @param email The user's email address
     * @param roleNames The roles to check
     * @return true if the user has any of the roles
     */
    public boolean hasAnyRole(String email, String... roleNames) {
        Set<String> userRoles = getEffectiveRoles(email);
        for (String roleName : roleNames) {
            if (userRoles.stream().anyMatch(role -> role.equalsIgnoreCase(roleName))) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if a user has all of the specified roles.
     *
     * @param email The user's email address
     * @param roleNames The roles to check
     * @return true if the user has all of the roles
     */
    public boolean hasAllRoles(String email, String... roleNames) {
        Set<String> userRoles = getEffectiveRoles(email).stream()
            .map(String::toLowerCase)
            .collect(Collectors.toSet());

        for (String roleName : roleNames) {
            if (!userRoles.contains(roleName.toLowerCase())) {
                return false;
            }
        }
        return true;
    }
}
