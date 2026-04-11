package com.ems.license.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * User capability tiers that define the level of platform access.
 * Each tier maps to a set of RBAC roles that are synchronized with auth-facade
 * when a seat is assigned or revoked.
 *
 * <p>Tiers are ordered from highest privilege (TENANT_ADMIN) to lowest (VIEWER).</p>
 */
@Getter
@RequiredArgsConstructor
public enum UserTier {

    /** Full tenant administration: user management, settings, all features. */
    TENANT_ADMIN("Tenant Admin", "ROLE_TENANT_ADMIN"),

    /** Advanced capabilities: process design, report creation, workflow management. */
    POWER_USER("Power User", "ROLE_POWER_USER"),

    /** Standard authoring: create and edit content within assigned areas. */
    CONTRIBUTOR("Contributor", "ROLE_CONTRIBUTOR"),

    /** Read-only access to dashboards, reports, and published content. */
    VIEWER("Viewer", "ROLE_VIEWER");

    /** Human-readable display name for UI presentation. */
    private final String displayName;

    /** The RBAC role that should be assigned in auth-facade when this tier is granted. */
    private final String rbacRole;
}
