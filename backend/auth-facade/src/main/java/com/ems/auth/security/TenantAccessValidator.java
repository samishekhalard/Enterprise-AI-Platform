package com.ems.auth.security;

import com.ems.common.dto.auth.UserInfo;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Validates that the authenticated user has access to the requested tenant's resources.
 *
 * <p>This component enforces tenant isolation by comparing the tenant_id claim from
 * the user's JWT against the tenant identifier in the request (path variable or header).
 * Without this check, an admin of Tenant A could access Tenant B's resources by
 * manipulating the URL path — an IDOR (Insecure Direct Object Reference) vulnerability.</p>
 *
 * <p>Access is granted if any of the following conditions are met:</p>
 * <ul>
 *   <li>The user's JWT tenant_id matches the requested tenantId</li>
 *   <li>The user has the SUPER_ADMIN (or SUPER-ADMIN) role, which grants cross-tenant access</li>
 * </ul>
 *
 * @see <a href="https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/05-Authorization_Testing/04-Testing_for_Insecure_Direct_Object_References">OWASP IDOR</a>
 */
@Component
@Slf4j
public class TenantAccessValidator {

    /** Role that grants cross-tenant access (uppercase, without ROLE_ prefix). */
    private static final String SUPER_ADMIN_ROLE = "super-admin";

    /** Alternate casing variant for SUPER_ADMIN role. */
    private static final String SUPER_ADMIN_ROLE_ALT = "SUPER_ADMIN";

    /**
     * Validates that the currently authenticated user is authorized to access
     * resources belonging to the specified tenant.
     *
     * <p><b>SEC-F02 IDOR Fix:</b> Ensures an admin of Tenant A cannot access
     * Tenant B's data by manipulating the tenantId path parameter or header.</p>
     *
     * @param requestedTenantId the tenant identifier from the request path or header
     * @throws AccessDeniedException if the user's tenant does not match and the user
     *         is not a SUPER_ADMIN
     * @throws AccessDeniedException if no authenticated user is found in the security context
     */
    public void validateTenantAccess(String requestedTenantId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !(authentication.getPrincipal() instanceof UserInfo userInfo)) {
            log.warn("Tenant access check failed: no authenticated user in security context");
            throw new AccessDeniedException("Access denied: not authenticated");
        }

        // SUPER_ADMIN bypasses tenant isolation — they manage all tenants
        if (isSuperAdmin(userInfo)) {
            log.debug("SUPER_ADMIN access granted for tenant {} (user: {})",
                    requestedTenantId, userInfo.email());
            return;
        }

        // Tenant isolation: user's JWT tenant_id must match the requested tenant
        String userTenantId = userInfo.tenantId();
        if (userTenantId == null || !userTenantId.equals(requestedTenantId)) {
            log.warn("Tenant access denied: user {} (tenant: {}) attempted to access tenant {}",
                    userInfo.email(), userTenantId, requestedTenantId);
            throw new AccessDeniedException(
                    "Access denied: you do not have permission to access resources for tenant " + requestedTenantId);
        }

        log.debug("Tenant access granted for tenant {} (user: {})", requestedTenantId, userInfo.email());
    }

    /**
     * Checks whether the given user holds the SUPER_ADMIN role.
     *
     * @param userInfo the authenticated user's info extracted from JWT
     * @return true if the user is a SUPER_ADMIN
     */
    private boolean isSuperAdmin(UserInfo userInfo) {
        if (userInfo.roles() == null) {
            return false;
        }
        return userInfo.roles().stream()
                .anyMatch(role -> SUPER_ADMIN_ROLE.equalsIgnoreCase(role)
                        || SUPER_ADMIN_ROLE_ALT.equalsIgnoreCase(role));
    }
}
