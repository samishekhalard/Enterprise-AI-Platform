package com.ems.tenant.repository;

import com.ems.tenant.entity.ProvisioningStepStatus;
import com.ems.tenant.entity.TenantProvisioningStepEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantProvisioningStepRepository extends JpaRepository<TenantProvisioningStepEntity, Long> {

    List<TenantProvisioningStepEntity> findByTenantUuidOrderByStepOrderAsc(UUID tenantUuid);

    Optional<TenantProvisioningStepEntity> findByTenantUuidAndStepName(UUID tenantUuid, String stepName);

    List<TenantProvisioningStepEntity> findByTenantUuidAndStatusOrderByStepOrderAsc(UUID tenantUuid, ProvisioningStepStatus status);
}
