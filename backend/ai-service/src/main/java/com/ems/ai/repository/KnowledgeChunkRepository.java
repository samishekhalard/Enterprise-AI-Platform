package com.ems.ai.repository;

import com.ems.ai.entity.KnowledgeChunkEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface KnowledgeChunkRepository extends JpaRepository<KnowledgeChunkEntity, UUID> {

    // Find by source
    List<KnowledgeChunkEntity> findBySourceIdOrderByChunkIndexAsc(UUID sourceId);

    // Find by agent
    List<KnowledgeChunkEntity> findByAgentId(UUID agentId);

    // Vector similarity search using pgvector
    @Query(value = """
        SELECT kc.* FROM knowledge_chunks kc
        WHERE kc.agent_id = :agentId
        AND kc.embedding IS NOT NULL
        ORDER BY kc.embedding <=> cast(:embedding as vector)
        LIMIT :limit
        """, nativeQuery = true)
    List<KnowledgeChunkEntity> findSimilarChunks(
        @Param("agentId") UUID agentId,
        @Param("embedding") String embedding,
        @Param("limit") int limit
    );

    // Vector similarity search with threshold
    @Query(value = """
        SELECT kc.* FROM knowledge_chunks kc
        WHERE kc.agent_id = :agentId
        AND kc.embedding IS NOT NULL
        AND 1 - (kc.embedding <=> cast(:embedding as vector)) >= :threshold
        ORDER BY kc.embedding <=> cast(:embedding as vector)
        LIMIT :limit
        """, nativeQuery = true)
    List<KnowledgeChunkEntity> findSimilarChunksWithThreshold(
        @Param("agentId") UUID agentId,
        @Param("embedding") String embedding,
        @Param("threshold") double threshold,
        @Param("limit") int limit
    );

    // Count by agent
    long countByAgentId(UUID agentId);

    // Delete by source
    void deleteBySourceId(UUID sourceId);
}
