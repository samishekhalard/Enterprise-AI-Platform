package com.ems.tenant.repository;

import com.ems.tenant.entity.TenantLocaleEntity;
import com.ems.tenant.entity.TenantLocaleId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TenantLocaleRepository extends JpaRepository<TenantLocaleEntity, TenantLocaleId> {

    List<TenantLocaleEntity> findByTenantUuidOrderByLocaleCodeAsc(UUID tenantUuid);

    boolean existsByTenantUuidAndLocaleCode(UUID tenantUuid, String localeCode);
}
