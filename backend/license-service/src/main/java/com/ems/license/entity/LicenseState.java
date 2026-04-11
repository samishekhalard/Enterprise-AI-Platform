package com.ems.license.entity;

/**
 * Runtime license state computed from the currently active license file.
 * This enum is NOT persisted; it is derived at runtime by {@code LicenseStateHolder}
 * based on signature verification, expiry dates, and grace periods.
 *
 * <p>State transitions follow the ADR-015 state machine:
 * UNLICENSED -> ACTIVE -> GRACE -> EXPIRED, with TAMPERED reachable from ACTIVE or GRACE.</p>
 */
public enum LicenseState {

    /** No license file has been imported. System operates in limited trial/demo mode. */
    UNLICENSED,

    /** A valid, non-expired license file is active. Full feature access per entitlements. */
    ACTIVE,

    /** License has expired but is within the grace period. Degraded features may be disabled. */
    GRACE,

    /** License has expired and the grace period has ended. System is locked down. */
    EXPIRED,

    /** Signature verification failed on the stored license file. Emergency lockdown state. */
    TAMPERED
}
