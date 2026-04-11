package com.ems.license.repository;

import com.ems.license.entity.ApplicationLicenseEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository for {@link ApplicationLicenseEntity} operations.
 */
@Repository
public interface ApplicationLicenseRepository extends JpaRepository<ApplicationLicenseEntity, UUID> {

    /**
     * Find the application license associated with a specific license file.
     *
     * @param licenseFileId the UUID of the license file
     * @return the matching application license, if found
     */
    Optional<ApplicationLicenseEntity> findByLicenseFileId(UUID licenseFileId);

    /**
     * Find the application license with its license file eagerly loaded.
     *
     * @param id the application license UUID
     * @return the application license with file, if found
     */
    @Query("SELECT al FROM ApplicationLicenseEntity al " +
           "JOIN FETCH al.licenseFile " +
           "WHERE al.id = :id")
    Optional<ApplicationLicenseEntity> findByIdWithLicenseFile(@Param("id") UUID id);
}
