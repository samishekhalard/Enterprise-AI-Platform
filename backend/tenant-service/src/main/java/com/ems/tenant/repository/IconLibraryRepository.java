package com.ems.tenant.repository;

import com.ems.tenant.entity.IconLibraryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IconLibraryRepository extends JpaRepository<IconLibraryEntity, String> {

    List<IconLibraryEntity> findByTenantIdOrderByCreatedAtDesc(String tenantId);
}
