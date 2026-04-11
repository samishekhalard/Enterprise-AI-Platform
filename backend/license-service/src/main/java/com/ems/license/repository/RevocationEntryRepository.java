package com.ems.license.repository;

import com.ems.license.entity.RevocationEntryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

/**
 * Repository for {@link RevocationEntryEntity} operations.
 * Revocation entries are immutable (INSERT only).
 */
@Repository
public interface RevocationEntryRepository extends JpaRepository<RevocationEntryEntity, UUID> {

    /**
     * Check if a specific license identifier has been revoked.
     *
     * @param revokedLicenseId the license identifier to check
     * @return {@code true} if a revocation entry exists for this license ID
     */
    boolean existsByRevokedLicenseId(String revokedLicenseId);
}
