package com.ems.license.repository;

import com.ems.license.entity.LicenseFileEntity;
import com.ems.license.entity.LicenseImportStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for {@link LicenseFileEntity} operations.
 */
@Repository
public interface LicenseFileRepository extends JpaRepository<LicenseFileEntity, UUID> {

    /**
     * Find all license files with the given import status.
     *
     * @param status the import status to filter by
     * @return list of matching license files
     */
    List<LicenseFileEntity> findByImportStatus(LicenseImportStatus status);

    /**
     * Find a license file by its globally unique license identifier.
     *
     * @param licenseId the license identifier (e.g., "LIC-2026-0001")
     * @return the matching license file, if found
     */
    Optional<LicenseFileEntity> findByLicenseId(String licenseId);
}
