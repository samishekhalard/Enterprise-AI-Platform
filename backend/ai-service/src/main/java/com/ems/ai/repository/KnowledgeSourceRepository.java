package com.ems.ai.repository;

import com.ems.ai.entity.KnowledgeSourceEntity;
import com.ems.ai.entity.KnowledgeSourceEntity.SourceStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface KnowledgeSourceRepository extends JpaRepository<KnowledgeSourceEntity, UUID> {

    // Find by agent
    Page<KnowledgeSourceEntity> findByAgentIdOrderByCreatedAtDesc(UUID agentId, Pageable pageable);

    List<KnowledgeSourceEntity> findByAgentId(UUID agentId);

    // Find pending sources for processing
    List<KnowledgeSourceEntity> findByStatusOrderByCreatedAtAsc(SourceStatus status);

    // Count by agent and status
    long countByAgentIdAndStatus(UUID agentId, SourceStatus status);

    // Sum chunk count by agent
    int countChunksByAgentId(UUID agentId);
}
