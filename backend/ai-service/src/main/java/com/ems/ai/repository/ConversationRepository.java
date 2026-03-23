package com.ems.ai.repository;

import com.ems.ai.entity.ConversationEntity;
import com.ems.ai.entity.ConversationEntity.ConversationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConversationRepository extends JpaRepository<ConversationEntity, UUID> {

    // Find user's conversations
    Page<ConversationEntity> findByTenantIdAndUserIdAndStatusOrderByLastMessageAtDesc(
        String tenantId,
        UUID userId,
        ConversationStatus status,
        Pageable pageable
    );

    // Find user's conversations with specific agent
    Page<ConversationEntity> findByTenantIdAndUserIdAndAgentIdAndStatusOrderByLastMessageAtDesc(
        String tenantId,
        UUID userId,
        UUID agentId,
        ConversationStatus status,
        Pageable pageable
    );

    // Find by id with access check
    @Query("""
        SELECT c FROM ConversationEntity c
        WHERE c.id = :id
        AND c.tenantId = :tenantId
        AND c.userId = :userId
        """)
    Optional<ConversationEntity> findByIdAndAccess(
        @Param("id") UUID id,
        @Param("tenantId") String tenantId,
        @Param("userId") UUID userId
    );

    // Find recent conversations
    List<ConversationEntity> findTop10ByTenantIdAndUserIdAndStatusOrderByLastMessageAtDesc(
        String tenantId,
        UUID userId,
        ConversationStatus status
    );

    // Archive old conversations
    @Modifying
    @Query("""
        UPDATE ConversationEntity c
        SET c.status = 'ARCHIVED'
        WHERE c.lastMessageAt < :before
        AND c.status = 'ACTIVE'
        """)
    int archiveOldConversations(@Param("before") Instant before);

    // Count user's conversations
    long countByTenantIdAndUserIdAndStatus(String tenantId, UUID userId, ConversationStatus status);

    // Count by agent
    long countByAgentIdAndStatus(UUID agentId, ConversationStatus status);
}
