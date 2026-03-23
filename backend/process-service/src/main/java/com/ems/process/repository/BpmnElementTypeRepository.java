package com.ems.process.repository;

import com.ems.process.entity.BpmnElementTypeEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BpmnElementTypeRepository extends JpaRepository<BpmnElementTypeEntity, UUID> {

    /**
     * Find all system default element types (tenant_id is null)
     */
    @Query("SELECT e FROM BpmnElementTypeEntity e WHERE e.tenantId IS NULL AND e.isActive = true ORDER BY e.sortOrder, e.category, e.name")
    List<BpmnElementTypeEntity> findAllSystemDefaults();

    /**
     * Find element types for a specific tenant, falling back to system defaults.
     * Returns tenant-specific override if exists, otherwise returns system default.
     */
    @Query("""
        SELECT e FROM BpmnElementTypeEntity e
        WHERE e.isActive = true
        AND (e.tenantId = :tenantId OR (e.tenantId IS NULL AND e.code NOT IN
            (SELECT e2.code FROM BpmnElementTypeEntity e2 WHERE e2.tenantId = :tenantId)))
        ORDER BY e.sortOrder, e.category, e.name
        """)
    List<BpmnElementTypeEntity> findAllForTenant(@Param("tenantId") String tenantId);

    /**
     * Find by code for a specific tenant (or system default if tenant has no override)
     */
    @Query("""
        SELECT e FROM BpmnElementTypeEntity e
        WHERE e.code = :code AND e.isActive = true
        AND (e.tenantId = :tenantId OR (e.tenantId IS NULL AND NOT EXISTS
            (SELECT 1 FROM BpmnElementTypeEntity e2 WHERE e2.code = :code AND e2.tenantId = :tenantId)))
        """)
    Optional<BpmnElementTypeEntity> findByCodeForTenant(@Param("code") String code, @Param("tenantId") String tenantId);

    /**
     * Find system default by code
     */
    Optional<BpmnElementTypeEntity> findByCodeAndTenantIdIsNull(String code);

    /**
     * Find all by category
     */
    @Query("SELECT e FROM BpmnElementTypeEntity e WHERE e.category = :category AND e.tenantId IS NULL AND e.isActive = true ORDER BY e.sortOrder, e.name")
    List<BpmnElementTypeEntity> findByCategory(@Param("category") String category);

    /**
     * Check if a tenant-specific override exists
     */
    boolean existsByCodeAndTenantId(String code, String tenantId);
}
