package com.ems.ai.repository;

import com.ems.ai.entity.MessageEntity;
import com.ems.ai.entity.MessageEntity.MessageRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MessageRepository extends JpaRepository<MessageEntity, UUID> {

    // Find messages by conversation
    Page<MessageEntity> findByConversationIdOrderByCreatedAtAsc(UUID conversationId, Pageable pageable);

    // Find all messages by conversation (no pagination)
    List<MessageEntity> findByConversationIdOrderByCreatedAtAsc(UUID conversationId);

    // Find recent messages for context
    @Query("""
        SELECT m FROM MessageEntity m
        WHERE m.conversation.id = :conversationId
        ORDER BY m.createdAt DESC
        LIMIT :limit
        """)
    List<MessageEntity> findRecentMessages(
        @Param("conversationId") UUID conversationId,
        @Param("limit") int limit
    );

    // Find messages by role
    List<MessageEntity> findByConversationIdAndRoleOrderByCreatedAtAsc(UUID conversationId, MessageRole role);

    // Count messages in conversation
    long countByConversationId(UUID conversationId);

    // Sum tokens in conversation
    @Query("SELECT COALESCE(SUM(m.tokenCount), 0) FROM MessageEntity m WHERE m.conversation.id = :conversationId")
    int sumTokensByConversationId(@Param("conversationId") UUID conversationId);
}
