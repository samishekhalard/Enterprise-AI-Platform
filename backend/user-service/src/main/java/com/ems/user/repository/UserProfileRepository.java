package com.ems.user.repository;

import com.ems.common.enums.UserStatus;
import com.ems.user.entity.UserProfileEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserProfileRepository extends JpaRepository<UserProfileEntity, UUID> {

    Optional<UserProfileEntity> findByKeycloakId(UUID keycloakId);

    Optional<UserProfileEntity> findByEmailAndTenantId(String email, String tenantId);

    Page<UserProfileEntity> findByTenantId(String tenantId, Pageable pageable);

    Page<UserProfileEntity> findByTenantIdAndStatus(String tenantId, UserStatus status, Pageable pageable);

    @Query("SELECT u FROM UserProfileEntity u WHERE u.tenantId = :tenantId " +
           "AND (LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(u.firstName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(u.lastName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(u.displayName) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<UserProfileEntity> searchByTenantId(
        @Param("tenantId") String tenantId,
        @Param("search") String search,
        Pageable pageable
    );

    List<UserProfileEntity> findByManagerId(UUID managerId);

    @Query("SELECT COUNT(u) FROM UserProfileEntity u WHERE u.tenantId = :tenantId")
    long countByTenantId(@Param("tenantId") String tenantId);

    @Query("SELECT COUNT(u) FROM UserProfileEntity u WHERE u.tenantId = :tenantId AND u.status = :status")
    long countByTenantIdAndStatus(@Param("tenantId") String tenantId, @Param("status") UserStatus status);

    boolean existsByEmailAndTenantId(String email, String tenantId);

    boolean existsByKeycloakId(UUID keycloakId);
}
