package com.ems.tenant.repository;

import com.ems.tenant.entity.BrandCatalogStatus;
import com.ems.tenant.entity.PalettePackEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PalettePackRepository extends JpaRepository<PalettePackEntity, String> {

    List<PalettePackEntity> findByStatusOrderByNameAsc(BrandCatalogStatus status);
}
