package com.ems.tenant.repository;

import com.ems.tenant.entity.TenantMessageTranslationEntity;
import com.ems.tenant.entity.TenantMessageTranslationId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantMessageTranslationRepository
    extends JpaRepository<TenantMessageTranslationEntity, TenantMessageTranslationId> {

    Optional<TenantMessageTranslationEntity> findByTenantUuidAndCodeAndLocaleCode(
        UUID tenantUuid,
        String code,
        String localeCode
    );
}
