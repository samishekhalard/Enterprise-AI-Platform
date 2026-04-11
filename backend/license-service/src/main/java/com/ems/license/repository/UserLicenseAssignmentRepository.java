package com.ems.license.repository;

import com.ems.license.entity.UserLicenseAssignmentEntity;
import com.ems.license.entity.UserTier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for {@link UserLicenseAssignmentEntity} operations.
 */
@Repository
public interface UserLicenseAssignmentRepository extends JpaRepository<UserLicenseAssignmentEntity, UUID> {

    /**
     * Find the seat assignment for a specific user within a specific tenant.
     * At most one result due to the unique constraint on (user_id, tenant_id).
     *
     * @param userId the user UUID
     * @param tenantId the tenant identifier
     * @return the matching assignment, if found
     */
    Optional<UserLicenseAssignmentEntity> findByUserIdAndTenantId(UUID userId, String tenantId);

    /**
     * Count the number of users assigned to a specific tier within a tenant.
     * Used for seat availability checks.
     *
     * @param tenantId the tenant identifier
     * @param tier the user tier
     * @return the count of assignments for the given tier in the given tenant
     */
    long countByTenantIdAndTier(String tenantId, UserTier tier);

    /**
     * Find all seat assignments within a tenant.
     *
     * @param tenantId the tenant identifier
     * @return list of all user license assignments for the given tenant
     */
    List<UserLicenseAssignmentEntity> findByTenantId(String tenantId);

    /**
     * Find all seat assignments for a specific tenant license.
     *
     * @param tenantLicenseId the tenant license UUID
     * @return list of assignments linked to the given tenant license
     */
    List<UserLicenseAssignmentEntity> findByTenantLicenseId(UUID tenantLicenseId);

    /**
     * Find a user's assignment within a tenant, eagerly fetching the tenant license.
     *
     * @param userId the user UUID
     * @param tenantId the tenant identifier
     * @return the assignment with tenant license loaded, if found
     */
    @Query("SELECT ula FROM UserLicenseAssignmentEntity ula " +
           "JOIN FETCH ula.tenantLicense tl " +
           "WHERE ula.userId = :userId AND ula.tenantId = :tenantId")
    Optional<UserLicenseAssignmentEntity> findByUserIdAndTenantIdWithLicense(
        @Param("userId") UUID userId,
        @Param("tenantId") String tenantId
    );
}
