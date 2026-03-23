package com.ems.auth.util;

/**
 * Utility class for resolving Keycloak realm names from tenant identifiers.
 *
 * <p>Centralizes the tenant-to-realm mapping logic that was previously duplicated
 * across AuthServiceImpl, AuthController, and EventController with inconsistent behavior.</p>
 *
 * <h3>Mapping rules:</h3>
 * <ul>
 *   <li>"master" or master tenant UUID -> "master" realm</li>
 *   <li>"tenant-master" -> "master" realm</li>
 *   <li>"tenant-{id}" (already prefixed) -> returned as-is</li>
 *   <li>"{id}" (no prefix) -> "tenant-{id}"</li>
 * </ul>
 */
public final class RealmResolver {

    /**
     * The well-known UUID for the master/admin tenant, as defined in
     * V008__fix_master_tenant_seed_superuser.cypher migration.
     */
    public static final String MASTER_TENANT_UUID = "68cd2a56-98c9-4ed4-8534-c299566d5b27";

    private static final String TENANT_PREFIX = "tenant-";

    private RealmResolver() {
        // Utility class - prevent instantiation
    }

    /**
     * Resolve the Keycloak realm name for a given tenant identifier.
     *
     * @param tenantId the tenant identifier (e.g., "master", "tenant-acme", "acme",
     *                 or the master tenant UUID)
     * @return the Keycloak realm name
     * @throws IllegalArgumentException if tenantId is null or blank
     */
    public static String resolve(String tenantId) {
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalArgumentException("tenantId must not be null or blank");
        }

        if (isMasterTenant(tenantId)) {
            return "master";
        }

        // If already prefixed with "tenant-", return as-is
        if (tenantId.startsWith(TENANT_PREFIX)) {
            return tenantId;
        }

        return TENANT_PREFIX + tenantId;
    }

    /**
     * Check if the given tenant identifier represents the master/admin tenant.
     * Master tenant users typically bypass license seat validation.
     *
     * @param tenantId the tenant identifier to check
     * @return true if this is the master tenant
     */
    public static boolean isMasterTenant(String tenantId) {
        return "master".equalsIgnoreCase(tenantId)
                || "tenant-master".equalsIgnoreCase(tenantId)
                || MASTER_TENANT_UUID.equals(tenantId);
    }
}
