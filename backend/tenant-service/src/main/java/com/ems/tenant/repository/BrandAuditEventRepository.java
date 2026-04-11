package com.ems.tenant.repository;

import com.ems.tenant.entity.BrandAuditEventEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BrandAuditEventRepository extends JpaRepository<BrandAuditEventEntity, String> {

    List<BrandAuditEventEntity> findByTenantIdOrderByCreatedAtDesc(String tenantId);
}
