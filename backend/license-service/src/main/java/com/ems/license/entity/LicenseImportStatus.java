package com.ems.license.entity;

/**
 * Status of a license file import. Each installation has at most one ACTIVE license file;
 * all prior imports are marked SUPERSEDED.
 */
public enum LicenseImportStatus {

    /** The currently active license file for this installation. */
    ACTIVE,

    /** A previously active license file that has been replaced by a newer import. */
    SUPERSEDED
}
