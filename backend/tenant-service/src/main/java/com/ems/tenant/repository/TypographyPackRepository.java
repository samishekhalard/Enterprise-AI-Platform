package com.ems.tenant.repository;

import com.ems.tenant.entity.BrandCatalogStatus;
import com.ems.tenant.entity.TypographyPackEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TypographyPackRepository extends JpaRepository<TypographyPackEntity, String> {

    List<TypographyPackEntity> findByStatusOrderByNameAsc(BrandCatalogStatus status);
}
