package com.ems.tenant.repository;

import com.ems.tenant.entity.BrandProfileEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BrandProfileRepository extends JpaRepository<BrandProfileEntity, String> {

    List<BrandProfileEntity> findByTenantIdOrderByProfileVersionDesc(String tenantId);

    Optional<BrandProfileEntity> findTopByTenantIdOrderByProfileVersionDesc(String tenantId);
}
