package com.ems.tenant.repository;

import com.ems.tenant.entity.TenantDomainEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TenantDomainRepository extends JpaRepository<TenantDomainEntity, String> {

    List<TenantDomainEntity> findByTenantId(String tenantId);

    Optional<TenantDomainEntity> findByDomain(String domain);

    Optional<TenantDomainEntity> findByTenantIdAndIsPrimaryTrue(String tenantId);

    boolean existsByDomain(String domain);

    @Modifying
    @Query("UPDATE TenantDomainEntity d SET d.isPrimary = false WHERE d.tenant.id = :tenantId")
    void clearPrimaryDomain(@Param("tenantId") String tenantId);

    @Query("SELECT d FROM TenantDomainEntity d WHERE d.tenant.id = :tenantId AND d.id = :domainId")
    Optional<TenantDomainEntity> findByTenantIdAndId(
        @Param("tenantId") String tenantId,
        @Param("domainId") String domainId
    );
}
