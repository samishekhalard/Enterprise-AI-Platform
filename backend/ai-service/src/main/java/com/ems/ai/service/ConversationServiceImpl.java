package com.ems.ai.service;

import com.ems.ai.dto.*;
import com.ems.ai.entity.*;
import com.ems.ai.entity.AgentEntity.AgentStatus;
import com.ems.ai.entity.ConversationEntity.ConversationStatus;
import com.ems.ai.entity.MessageEntity.MessageRole;
import com.ems.ai.mapper.ConversationMapper;
import com.ems.ai.mapper.MessageMapper;
import com.ems.ai.provider.LlmProviderFactory;
import com.ems.ai.provider.LlmProviderService;
import com.ems.ai.provider.LlmProviderService.ChatMessage;
import com.ems.ai.provider.LlmProviderService.ChatRequest;
import com.ems.ai.repository.AgentRepository;
import com.ems.ai.repository.ConversationRepository;
import com.ems.ai.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ConversationServiceImpl implements ConversationService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final AgentRepository agentRepository;
    private final ConversationMapper conversationMapper;
    private final MessageMapper messageMapper;
    private final LlmProviderFactory providerFactory;
    private final AgentService agentService;
    private final RagService ragService;

    @Override
    public ConversationDTO createConversation(String tenantId, UUID userId, CreateConversationRequest request) {
        log.debug("Creating conversation for tenant: {}, user: {}, agent: {}", tenantId, userId, request.agentId());

        AgentEntity agent = agentRepository.findAccessibleById(request.agentId(), tenantId, AgentStatus.ACTIVE)
            .orElseThrow(() -> new RuntimeException("Agent not found or not accessible: " + request.agentId()));

        ConversationEntity conversation = ConversationEntity.builder()
            .tenantId(tenantId)
            .userId(userId)
            .agent(agent)
            .title(request.title() != null ? request.title() : "New conversation")
            .build();

        conversation = conversationRepository.save(conversation);
        log.info("Created conversation: {} for user: {}", conversation.getId(), userId);

        // If initial message provided, send it
        if (request.initialMessage() != null && !request.initialMessage().isBlank()) {
            sendMessage(conversation.getId(), tenantId, userId,
                SendMessageRequest.builder().content(request.initialMessage()).stream(false).build());
        }

        return conversationMapper.toDTO(conversation);
    }

    @Override
    @Transactional(readOnly = true)
    public ConversationDTO getConversation(UUID conversationId, String tenantId, UUID userId) {
        return conversationRepository.findByIdAndAccess(conversationId, tenantId, userId)
            .map(conversationMapper::toDTO)
            .orElseThrow(() -> new RuntimeException("Conversation not found: " + conversationId));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ConversationDTO> getUserConversations(String tenantId, UUID userId, Pageable pageable) {
        return conversationRepository.findByTenantIdAndUserIdAndStatusOrderByLastMessageAtDesc(
            tenantId, userId, ConversationStatus.ACTIVE, pageable
        ).map(conversationMapper::toDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ConversationDTO> getUserConversationsWithAgent(String tenantId, UUID userId, UUID agentId, Pageable pageable) {
        return conversationRepository.findByTenantIdAndUserIdAndAgentIdAndStatusOrderByLastMessageAtDesc(
            tenantId, userId, agentId, ConversationStatus.ACTIVE, pageable
        ).map(conversationMapper::toDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ConversationDTO> getRecentConversations(String tenantId, UUID userId) {
        return conversationMapper.toDTOList(
            conversationRepository.findTop10ByTenantIdAndUserIdAndStatusOrderByLastMessageAtDesc(
                tenantId, userId, ConversationStatus.ACTIVE
            )
        );
    }

    @Override
    public void archiveConversation(UUID conversationId, String tenantId, UUID userId) {
        ConversationEntity conversation = conversationRepository.findByIdAndAccess(conversationId, tenantId, userId)
            .orElseThrow(() -> new RuntimeException("Conversation not found: " + conversationId));

        conversation.setStatus(ConversationStatus.ARCHIVED);
        conversationRepository.save(conversation);
        log.info("Archived conversation: {}", conversationId);
    }

    @Override
    public void deleteConversation(UUID conversationId, String tenantId, UUID userId) {
        ConversationEntity conversation = conversationRepository.findByIdAndAccess(conversationId, tenantId, userId)
            .orElseThrow(() -> new RuntimeException("Conversation not found: " + conversationId));

        conversation.setStatus(ConversationStatus.DELETED);
        conversationRepository.save(conversation);
        log.info("Deleted conversation: {}", conversationId);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MessageDTO> getMessages(UUID conversationId, String tenantId, UUID userId, Pageable pageable) {
        // Verify access
        conversationRepository.findByIdAndAccess(conversationId, tenantId, userId)
            .orElseThrow(() -> new RuntimeException("Conversation not found: " + conversationId));

        return messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId, pageable)
            .map(messageMapper::toDTO);
    }

    @Override
    public MessageDTO sendMessage(UUID conversationId, String tenantId, UUID userId, SendMessageRequest request) {
        log.debug("Sending message to conversation: {}", conversationId);

        ConversationEntity conversation = conversationRepository.findByIdAndAccess(conversationId, tenantId, userId)
            .orElseThrow(() -> new RuntimeException("Conversation not found: " + conversationId));

        AgentEntity agent = conversation.getAgent();

        // Save user message
        MessageEntity userMessage = MessageEntity.builder()
            .conversation(conversation)
            .role(MessageRole.USER)
            .content(request.content())
            .build();
        userMessage = messageRepository.save(userMessage);
        conversation.incrementMessageCount();

        // Build context
        List<ChatMessage> messages = buildChatContext(conversation, request.content());

        // Get RAG context if enabled
        String systemPrompt = agent.getSystemPrompt();
        if (agent.getRagEnabled()) {
            String ragContext = ragService.getRelevantContext(agent.getId(), request.content());
            if (ragContext != null && !ragContext.isEmpty()) {
                systemPrompt = systemPrompt + "\n\nRelevant context:\n" + ragContext;
            }
        }

        // Call LLM
        LlmProviderService provider = providerFactory.getProvider(agent.getProvider());
        ChatRequest chatRequest = new ChatRequest(
            agent.getModel(),
            messages,
            agent.getModelConfig(),
            systemPrompt
        );

        try {
            var response = provider.chat(chatRequest).join();

            // Save assistant message
            MessageEntity assistantMessage = MessageEntity.builder()
                .conversation(conversation)
                .role(MessageRole.ASSISTANT)
                .content(response.content())
                .tokenCount(response.inputTokens() + response.outputTokens())
                .build();
            assistantMessage = messageRepository.save(assistantMessage);

            conversation.incrementMessageCount();
            conversation.addTokens(response.inputTokens() + response.outputTokens());
            conversationRepository.save(conversation);

            // Update agent usage
            agentService.incrementUsage(agent.getId());

            // Auto-generate title for first message
            if (conversation.getMessageCount() == 2 && "New conversation".equals(conversation.getTitle())) {
                generateTitle(conversation, request.content());
            }

            return messageMapper.toDTO(assistantMessage);
        } catch (Exception e) {
            log.error("Error calling LLM provider", e);
            throw new RuntimeException("Failed to get response from AI: " + e.getMessage(), e);
        }
    }

    @Override
    public Flux<StreamChunkDTO> streamMessage(UUID conversationId, String tenantId, UUID userId, SendMessageRequest request) {
        log.debug("Streaming message to conversation: {}", conversationId);

        ConversationEntity conversation = conversationRepository.findByIdAndAccess(conversationId, tenantId, userId)
            .orElseThrow(() -> new RuntimeException("Conversation not found: " + conversationId));

        AgentEntity agent = conversation.getAgent();

        // Save user message
        MessageEntity userMessage = MessageEntity.builder()
            .conversation(conversation)
            .role(MessageRole.USER)
            .content(request.content())
            .build();
        messageRepository.save(userMessage);
        conversation.incrementMessageCount();
        conversationRepository.save(conversation);

        // Build context
        List<ChatMessage> messages = buildChatContext(conversation, request.content());

        // Get RAG context if enabled
        String systemPrompt = agent.getSystemPrompt();
        if (agent.getRagEnabled()) {
            String ragContext = ragService.getRelevantContext(agent.getId(), request.content());
            if (ragContext != null && !ragContext.isEmpty()) {
                systemPrompt = systemPrompt + "\n\nRelevant context:\n" + ragContext;
            }
        }

        LlmProviderService provider = providerFactory.getProvider(agent.getProvider());
        ChatRequest chatRequest = new ChatRequest(
            agent.getModel(),
            messages,
            agent.getModelConfig(),
            systemPrompt
        );

        StringBuilder fullResponse = new StringBuilder();

        return Flux.concat(
            Flux.just(StreamChunkDTO.start()),
            provider.streamChat(chatRequest)
                .doOnNext(chunk -> {
                    if (chunk.content() != null) {
                        fullResponse.append(chunk.content());
                    }
                }),
            Mono.fromCallable(() -> {
                // Save assistant message after stream completes
                MessageEntity assistantMessage = MessageEntity.builder()
                    .conversation(conversation)
                    .role(MessageRole.ASSISTANT)
                    .content(fullResponse.toString())
                    .build();
                assistantMessage = messageRepository.save(assistantMessage);

                conversation.incrementMessageCount();
                conversationRepository.save(conversation);
                agentService.incrementUsage(agent.getId());

                // Auto-generate title for first exchange
                if (conversation.getMessageCount() == 2 && "New conversation".equals(conversation.getTitle())) {
                    generateTitle(conversation, request.content());
                }

                return StreamChunkDTO.done(assistantMessage.getId().toString(), 0);
            }).flux()
        ).onErrorResume(e -> {
            log.error("Stream error", e);
            return Flux.just(StreamChunkDTO.error(e.getMessage()));
        });
    }

    @Override
    public void updateConversationTitle(UUID conversationId, String tenantId, UUID userId, String title) {
        ConversationEntity conversation = conversationRepository.findByIdAndAccess(conversationId, tenantId, userId)
            .orElseThrow(() -> new RuntimeException("Conversation not found: " + conversationId));

        conversation.setTitle(title);
        conversationRepository.save(conversation);
    }

    private List<ChatMessage> buildChatContext(ConversationEntity conversation, String currentMessage) {
        List<MessageEntity> recentMessages = messageRepository.findRecentMessages(conversation.getId(), 20);

        List<ChatMessage> messages = new ArrayList<>();

        // Add messages in chronological order (oldest first)
        for (int i = recentMessages.size() - 1; i >= 0; i--) {
            MessageEntity msg = recentMessages.get(i);
            messages.add(new ChatMessage(msg.getRole().name(), msg.getContent()));
        }

        // Add current user message
        messages.add(new ChatMessage("USER", currentMessage));

        return messages;
    }

    private void generateTitle(ConversationEntity conversation, String firstMessage) {
        try {
            // Simple title generation - take first 50 chars of message
            String title = firstMessage.length() > 50
                ? firstMessage.substring(0, 47) + "..."
                : firstMessage;
            conversation.setTitle(title);
            conversationRepository.save(conversation);
        } catch (Exception e) {
            log.warn("Failed to generate title", e);
        }
    }
}
