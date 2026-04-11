package com.ems.ai.service;

import com.ems.ai.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.UUID;

public interface ConversationService {

    ConversationDTO createConversation(String tenantId, UUID userId, CreateConversationRequest request);

    ConversationDTO getConversation(UUID conversationId, String tenantId, UUID userId);

    Page<ConversationDTO> getUserConversations(String tenantId, UUID userId, Pageable pageable);

    Page<ConversationDTO> getUserConversationsWithAgent(String tenantId, UUID userId, UUID agentId, Pageable pageable);

    List<ConversationDTO> getRecentConversations(String tenantId, UUID userId);

    void archiveConversation(UUID conversationId, String tenantId, UUID userId);

    void deleteConversation(UUID conversationId, String tenantId, UUID userId);

    Page<MessageDTO> getMessages(UUID conversationId, String tenantId, UUID userId, Pageable pageable);

    MessageDTO sendMessage(UUID conversationId, String tenantId, UUID userId, SendMessageRequest request);

    Flux<StreamChunkDTO> streamMessage(UUID conversationId, String tenantId, UUID userId, SendMessageRequest request);

    void updateConversationTitle(UUID conversationId, String tenantId, UUID userId, String title);
}
