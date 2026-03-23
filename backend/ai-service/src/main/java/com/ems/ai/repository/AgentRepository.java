package com.ems.ai.repository;

import com.ems.ai.entity.AgentEntity;
import com.ems.ai.entity.AgentEntity.AgentStatus;
import com.ems.ai.entity.AgentEntity.LlmProvider;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AgentRepository extends JpaRepository<AgentEntity, UUID> {

    // Find by tenant
    Page<AgentEntity> findByTenantIdAndStatus(String tenantId, AgentStatus status, Pageable pageable);

    // Find user's own agents
    Page<AgentEntity> findByTenantIdAndOwnerIdAndStatus(String tenantId, UUID ownerId, AgentStatus status, Pageable pageable);

    // Find public agents
    Page<AgentEntity> findByIsPublicTrueAndStatus(AgentStatus status, Pageable pageable);

    // Find system agents
    List<AgentEntity> findByIsSystemTrueAndStatus(AgentStatus status);

    // Find by category
    Page<AgentEntity> findByCategoryIdAndStatus(UUID categoryId, AgentStatus status, Pageable pageable);

    // Search agents
    @Query("""
        SELECT a FROM AgentEntity a
        WHERE a.status = :status
        AND (a.tenantId = :tenantId OR a.isPublic = true OR a.isSystem = true)
        AND (LOWER(a.name) LIKE LOWER(CONCAT('%', :query, '%'))
             OR LOWER(a.description) LIKE LOWER(CONCAT('%', :query, '%')))
        ORDER BY a.usageCount DESC
        """)
    Page<AgentEntity> searchAgents(
        @Param("tenantId") String tenantId,
        @Param("query") String query,
        @Param("status") AgentStatus status,
        Pageable pageable
    );

    // Find accessible agents (own + public + system)
    @Query("""
        SELECT a FROM AgentEntity a
        WHERE a.status = :status
        AND (a.tenantId = :tenantId OR a.isPublic = true OR a.isSystem = true)
        ORDER BY a.usageCount DESC
        """)
    Page<AgentEntity> findAccessibleAgents(
        @Param("tenantId") String tenantId,
        @Param("status") AgentStatus status,
        Pageable pageable
    );

    // Find agent by id with access check
    @Query("""
        SELECT a FROM AgentEntity a
        WHERE a.id = :id
        AND a.status = :status
        AND (a.tenantId = :tenantId OR a.isPublic = true OR a.isSystem = true)
        """)
    Optional<AgentEntity> findAccessibleById(
        @Param("id") UUID id,
        @Param("tenantId") String tenantId,
        @Param("status") AgentStatus status
    );

    // Increment usage count
    @Modifying
    @Query("UPDATE AgentEntity a SET a.usageCount = a.usageCount + 1 WHERE a.id = :agentId")
    void incrementUsageCount(@Param("agentId") UUID agentId);

    // Find by provider
    List<AgentEntity> findByProviderAndStatus(LlmProvider provider, AgentStatus status);

    // Count by tenant
    long countByTenantIdAndStatus(String tenantId, AgentStatus status);
}
