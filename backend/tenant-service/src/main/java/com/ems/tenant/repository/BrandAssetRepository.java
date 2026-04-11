package com.ems.tenant.repository;

import com.ems.tenant.entity.BrandAssetEntity;
import com.ems.tenant.entity.BrandAssetKind;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BrandAssetRepository extends JpaRepository<BrandAssetEntity, String> {

    List<BrandAssetEntity> findByTenantIdOrderByCreatedAtDesc(String tenantId);

    List<BrandAssetEntity> findByTenantIdAndKindOrderByCreatedAtDesc(String tenantId, BrandAssetKind kind);
}
