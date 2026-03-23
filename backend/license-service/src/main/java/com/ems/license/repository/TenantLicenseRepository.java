package com.ems.license.repository;

import com.ems.license.entity.TenantLicenseEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for {@link TenantLicenseEntity} operations.
 */
@Repository
public interface TenantLicenseRepository extends JpaRepository<TenantLicenseEntity, UUID> {

    /**
     * Find all tenant licenses for a specific tenant.
     *
     * @param tenantId the tenant identifier
     * @return list of tenant licenses for the given tenant
     */
    List<TenantLicenseEntity> findByTenantId(String tenantId);

    /**
     * Find all tenant licenses belonging to a specific application license.
     *
     * @param applicationLicenseId the application license UUID
     * @return list of tenant licenses for the given application license
     */
    List<TenantLicenseEntity> findByApplicationLicenseId(UUID applicationLicenseId);

    /**
     * Find a tenant license by tenant ID with its seat allocations eagerly loaded.
     *
     * @param tenantId the tenant identifier
     * @return list of tenant licenses with seat allocations
     */
    @Query("SELECT tl FROM TenantLicenseEntity tl " +
           "LEFT JOIN FETCH tl.seatAllocations " +
           "WHERE tl.tenantId = :tenantId")
    List<TenantLicenseEntity> findByTenantIdWithAllocations(@Param("tenantId") String tenantId);

    /**
     * Find a tenant license by ID with seat allocations eagerly loaded.
     *
     * @param id the tenant license UUID
     * @return the tenant license with allocations, if found
     */
    @Query("SELECT tl FROM TenantLicenseEntity tl " +
           "LEFT JOIN FETCH tl.seatAllocations " +
           "WHERE tl.id = :id")
    Optional<TenantLicenseEntity> findByIdWithAllocations(@Param("id") UUID id);
}
