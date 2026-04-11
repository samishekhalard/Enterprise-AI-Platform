package com.ems.tenant.repository;

import com.ems.common.enums.TenantStatus;
import com.ems.common.enums.TenantType;
import com.ems.tenant.entity.TenantEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantRepository extends JpaRepository<TenantEntity, String> {

    Optional<TenantEntity> findBySlug(String slug);

    Optional<TenantEntity> findByUuid(UUID uuid);

    @Query("SELECT t FROM TenantEntity t WHERE t.status = :status")
    Page<TenantEntity> findByStatus(@Param("status") TenantStatus status, Pageable pageable);

    @Query("SELECT t FROM TenantEntity t WHERE t.tenantType = :type")
    Page<TenantEntity> findByTenantType(@Param("type") TenantType type, Pageable pageable);

    Page<TenantEntity> findByStatusAndTenantType(TenantStatus status, TenantType type, Pageable pageable);

    @Query("SELECT DISTINCT t FROM TenantEntity t " +
           "LEFT JOIN FETCH t.authProviders " +
           "LEFT JOIN FETCH t.branding " +
           "LEFT JOIN FETCH t.sessionConfig " +
           "LEFT JOIN FETCH t.mfaConfig " +
           "JOIN t.domains d WHERE d.domain = :domain AND d.isVerified = true")
    Optional<TenantEntity> findByVerifiedDomain(@Param("domain") String domain);

    @Query("SELECT DISTINCT t FROM TenantEntity t " +
           "LEFT JOIN FETCH t.authProviders " +
           "LEFT JOIN FETCH t.branding " +
           "JOIN t.domains d WHERE d.domain = :domain")
    Optional<TenantEntity> findByDomain(@Param("domain") String domain);

    boolean existsBySlug(String slug);

    @Query("SELECT COUNT(t) FROM TenantEntity t WHERE t.status = :status")
    long countByStatus(@Param("status") TenantStatus status);

    @Query("SELECT t FROM TenantEntity t WHERE " +
           "LOWER(t.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(t.shortName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(t.slug) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<TenantEntity> searchTenants(@Param("search") String search, Pageable pageable);

    @Query("SELECT CASE WHEN COUNT(t) > 0 THEN true ELSE false END FROM TenantEntity t WHERE UPPER(t.shortName) = UPPER(:shortName)")
    boolean existsByShortNameIgnoreCase(@Param("shortName") String shortName);
}
