package com.ems.license.repository;

import com.ems.license.entity.TierSeatAllocationEntity;
import com.ems.license.entity.UserTier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for {@link TierSeatAllocationEntity} operations.
 */
@Repository
public interface TierSeatAllocationRepository extends JpaRepository<TierSeatAllocationEntity, UUID> {

    /**
     * Find all seat allocations for a specific tenant license.
     *
     * @param tenantLicenseId the tenant license UUID
     * @return list of tier seat allocations (should be exactly 4 per tenant license)
     */
    List<TierSeatAllocationEntity> findByTenantLicenseId(UUID tenantLicenseId);

    /**
     * Find the seat allocation for a specific tier within a tenant license.
     *
     * @param tenantLicenseId the tenant license UUID
     * @param tier the user tier
     * @return the matching allocation, if found
     */
    Optional<TierSeatAllocationEntity> findByTenantLicenseIdAndTier(UUID tenantLicenseId, UserTier tier);
}
