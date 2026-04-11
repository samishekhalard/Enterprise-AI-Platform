package com.ems.tenant.repository;

import com.ems.tenant.entity.BrandCatalogStatus;
import com.ems.tenant.entity.BrandStarterKitEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BrandStarterKitRepository extends JpaRepository<BrandStarterKitEntity, String> {

    List<BrandStarterKitEntity> findByStatusOrderByNameAsc(BrandCatalogStatus status);
}
