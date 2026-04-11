package com.ems.ai.service;

import com.ems.ai.dto.*;
import com.ems.ai.entity.*;
import com.ems.ai.entity.AgentEntity.AgentStatus;
import com.ems.ai.entity.AgentEntity.LlmProvider;
import com.ems.ai.entity.ConversationEntity.ConversationStatus;
import com.ems.ai.entity.MessageEntity.MessageRole;
import com.ems.ai.mapper.ConversationMapper;
import com.ems.ai.mapper.MessageMapper;
import com.ems.ai.provider.LlmProviderFactory;
import com.ems.ai.provider.LlmProviderService;
import com.ems.ai.provider.LlmProviderService.ChatRequest;
import com.ems.ai.provider.LlmProviderService.ChatResponse;
import com.ems.ai.repository.AgentRepository;
import com.ems.ai.repository.ConversationRepository;
import com.ems.ai.repository.MessageRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import reactor.core.publisher.Flux;
import reactor.test.StepVerifier;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.CompletableFuture;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ConversationServiceImplTest {

    @Mock private ConversationRepository conversationRepository;
    @Mock private MessageRepository messageRepository;
    @Mock private AgentRepository agentRepository;
    @Mock private ConversationMapper conversationMapper;
    @Mock private MessageMapper messageMapper;
    @Mock private LlmProviderFactory providerFactory;
    @Mock private AgentService agentService;
    @Mock private RagService ragService;

    @InjectMocks
    private ConversationServiceImpl conversationService;

    private static final String TENANT_ID = "tenant-1";
    private static final UUID USER_ID = UUID.randomUUID();
    private static final UUID AGENT_ID = UUID.randomUUID();
    private static final UUID CONVERSATION_ID = UUID.randomUUID();

    private AgentEntity sampleAgent;
    private ConversationEntity sampleConversation;
    private ConversationDTO sampleConversationDTO;

    @BeforeEach
    void setUp() {
        sampleAgent = AgentEntity.builder()
            .id(AGENT_ID)
            .tenantId(TENANT_ID)
            .ownerId(UUID.randomUUID())
            .name("Test Agent")
            .systemPrompt("You are helpful")
            .provider(LlmProvider.OPENAI)
            .model("gpt-4o")
            .ragEnabled(false)
            .isPublic(true)
            .isSystem(false)
            .status(AgentStatus.ACTIVE)
            .knowledgeSources(new ArrayList<>())
            .build();

        sampleConversation = ConversationEntity.builder()
            .id(CONVERSATION_ID)
            .tenantId(TENANT_ID)
            .userId(USER_ID)
            .agent(sampleAgent)
            .title("New conversation")
            .messageCount(0)
            .totalTokens(0)
            .status(ConversationStatus.ACTIVE)
            .messages(new ArrayList<>())
            .build();

        sampleConversationDTO = ConversationDTO.builder()
            .id(CONVERSATION_ID)
            .tenantId(TENANT_ID)
            .userId(USER_ID)
            .agentId(AGENT_ID)
            .agentName("Test Agent")
            .title("New conversation")
            .messageCount(0)
            .totalTokens(0)
            .status(ConversationStatus.ACTIVE)
            .build();
    }

    @Nested
    @DisplayName("createConversation")
    class CreateConversation {

        @Test
        @DisplayName("should create conversation without initial message")
        void createConversation_withoutInitialMessage_shouldReturnDTO() {
            // Arrange
            CreateConversationRequest request = CreateConversationRequest.builder()
                .agentId(AGENT_ID)
                .title("My Chat")
                .build();

            when(agentRepository.findAccessibleById(AGENT_ID, TENANT_ID, AgentStatus.ACTIVE))
                .thenReturn(Optional.of(sampleAgent));
            when(conversationRepository.save(any(ConversationEntity.class))).thenReturn(sampleConversation);
            when(conversationMapper.toDTO(any())).thenReturn(sampleConversationDTO);

            // Act
            ConversationDTO result = conversationService.createConversation(TENANT_ID, USER_ID, request);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.agentId()).isEqualTo(AGENT_ID);
            verify(conversationRepository).save(any(ConversationEntity.class));
        }

        @Test
        @DisplayName("should use default title when title is null")
        void createConversation_withNullTitle_shouldUseDefaultTitle() {
            // Arrange
            CreateConversationRequest request = CreateConversationRequest.builder()
                .agentId(AGENT_ID)
                .title(null)
                .build();

            when(agentRepository.findAccessibleById(AGENT_ID, TENANT_ID, AgentStatus.ACTIVE))
                .thenReturn(Optional.of(sampleAgent));

            ArgumentCaptor<ConversationEntity> captor = ArgumentCaptor.forClass(ConversationEntity.class);
            when(conversationRepository.save(captor.capture())).thenReturn(sampleConversation);
            when(conversationMapper.toDTO(any())).thenReturn(sampleConversationDTO);

            // Act
            conversationService.createConversation(TENANT_ID, USER_ID, request);

            // Assert
            assertThat(captor.getValue().getTitle()).isEqualTo("New conversation");
        }

        @Test
        @DisplayName("should throw when agent not found or not accessible")
        void createConversation_whenAgentNotAccessible_shouldThrow() {
            // Arrange
            CreateConversationRequest request = CreateConversationRequest.builder()
                .agentId(AGENT_ID)
                .build();

            when(agentRepository.findAccessibleById(AGENT_ID, TENANT_ID, AgentStatus.ACTIVE))
                .thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> conversationService.createConversation(TENANT_ID, USER_ID, request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Agent not found or not accessible");
        }
    }

    @Nested
    @DisplayName("getConversation")
    class GetConversation {

        @Test
        @DisplayName("should return conversation DTO when accessible")
        void getConversation_whenAccessible_shouldReturnDTO() {
            // Arrange
            when(conversationRepository.findByIdAndAccess(CONVERSATION_ID, TENANT_ID, USER_ID))
                .thenReturn(Optional.of(sampleConversation));
            when(conversationMapper.toDTO(sampleConversation)).thenReturn(sampleConversationDTO);

            // Act
            ConversationDTO result = conversationService.getConversation(CONVERSATION_ID, TENANT_ID, USER_ID);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.id()).isEqualTo(CONVERSATION_ID);
        }

        @Test
        @DisplayName("should throw when conversation not found")
        void getConversation_whenNotFound_shouldThrow() {
            // Arrange
            when(conversationRepository.findByIdAndAccess(CONVERSATION_ID, TENANT_ID, USER_ID))
                .thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> conversationService.getConversation(CONVERSATION_ID, TENANT_ID, USER_ID))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Conversation not found");
        }
    }

    @Nested
    @DisplayName("getUserConversations")
    class GetUserConversations {

        @Test
        @DisplayName("should return paginated conversations for user")
        void getUserConversations_shouldReturnPage() {
            // Arrange
            Pageable pageable = PageRequest.of(0, 10);
            Page<ConversationEntity> entityPage = new PageImpl<>(List.of(sampleConversation));
            when(conversationRepository.findByTenantIdAndUserIdAndStatusOrderByLastMessageAtDesc(
                TENANT_ID, USER_ID, ConversationStatus.ACTIVE, pageable)).thenReturn(entityPage);
            when(conversationMapper.toDTO(any())).thenReturn(sampleConversationDTO);

            // Act
            Page<ConversationDTO> result = conversationService.getUserConversations(TENANT_ID, USER_ID, pageable);

            // Assert
            assertThat(result.getContent()).hasSize(1);
        }
    }

    @Nested
    @DisplayName("getUserConversationsWithAgent")
    class GetUserConversationsWithAgent {

        @Test
        @DisplayName("should return conversations filtered by agent")
        void getUserConversationsWithAgent_shouldReturnFilteredPage() {
            // Arrange
            Pageable pageable = PageRequest.of(0, 10);
            Page<ConversationEntity> entityPage = new PageImpl<>(List.of(sampleConversation));
            when(conversationRepository.findByTenantIdAndUserIdAndAgentIdAndStatusOrderByLastMessageAtDesc(
                TENANT_ID, USER_ID, AGENT_ID, ConversationStatus.ACTIVE, pageable)).thenReturn(entityPage);
            when(conversationMapper.toDTO(any())).thenReturn(sampleConversationDTO);

            // Act
            Page<ConversationDTO> result = conversationService.getUserConversationsWithAgent(
                TENANT_ID, USER_ID, AGENT_ID, pageable);

            // Assert
            assertThat(result.getContent()).hasSize(1);
        }
    }

    @Nested
    @DisplayName("getRecentConversations")
    class GetRecentConversations {

        @Test
        @DisplayName("should return up to 10 recent conversations")
        void getRecentConversations_shouldReturnList() {
            // Arrange
            when(conversationRepository.findTop10ByTenantIdAndUserIdAndStatusOrderByLastMessageAtDesc(
                TENANT_ID, USER_ID, ConversationStatus.ACTIVE)).thenReturn(List.of(sampleConversation));
            when(conversationMapper.toDTOList(any())).thenReturn(List.of(sampleConversationDTO));

            // Act
            List<ConversationDTO> result = conversationService.getRecentConversations(TENANT_ID, USER_ID);

            // Assert
            assertThat(result).hasSize(1);
        }
    }

    @Nested
    @DisplayName("archiveConversation")
    class ArchiveConversation {

        @Test
        @DisplayName("should set conversation status to ARCHIVED")
        void archiveConversation_shouldSetStatusArchived() {
            // Arrange
            when(conversationRepository.findByIdAndAccess(CONVERSATION_ID, TENANT_ID, USER_ID))
                .thenReturn(Optional.of(sampleConversation));
            when(conversationRepository.save(any())).thenReturn(sampleConversation);

            // Act
            conversationService.archiveConversation(CONVERSATION_ID, TENANT_ID, USER_ID);

            // Assert
            assertThat(sampleConversation.getStatus()).isEqualTo(ConversationStatus.ARCHIVED);
            verify(conversationRepository).save(sampleConversation);
        }

        @Test
        @DisplayName("should throw when conversation not found")
        void archiveConversation_whenNotFound_shouldThrow() {
            // Arrange
            when(conversationRepository.findByIdAndAccess(CONVERSATION_ID, TENANT_ID, USER_ID))
                .thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> conversationService.archiveConversation(CONVERSATION_ID, TENANT_ID, USER_ID))
                .isInstanceOf(RuntimeException.class);
        }
    }

    @Nested
    @DisplayName("deleteConversation")
    class DeleteConversation {

        @Test
        @DisplayName("should set conversation status to DELETED")
        void deleteConversation_shouldSetStatusDeleted() {
            // Arrange
            when(conversationRepository.findByIdAndAccess(CONVERSATION_ID, TENANT_ID, USER_ID))
                .thenReturn(Optional.of(sampleConversation));
            when(conversationRepository.save(any())).thenReturn(sampleConversation);

            // Act
            conversationService.deleteConversation(CONVERSATION_ID, TENANT_ID, USER_ID);

            // Assert
            assertThat(sampleConversation.getStatus()).isEqualTo(ConversationStatus.DELETED);
            verify(conversationRepository).save(sampleConversation);
        }
    }

    @Nested
    @DisplayName("getMessages")
    class GetMessages {

        @Test
        @DisplayName("should return paginated messages after verifying access")
        void getMessages_shouldReturnMessagePage() {
            // Arrange
            Pageable pageable = PageRequest.of(0, 20);
            MessageEntity message = MessageEntity.builder()
                .id(UUID.randomUUID())
                .conversation(sampleConversation)
                .role(MessageRole.USER)
                .content("Hello")
                .build();
            MessageDTO messageDTO = MessageDTO.builder()
                .id(message.getId())
                .conversationId(CONVERSATION_ID)
                .role(MessageRole.USER)
                .content("Hello")
                .build();

            when(conversationRepository.findByIdAndAccess(CONVERSATION_ID, TENANT_ID, USER_ID))
                .thenReturn(Optional.of(sampleConversation));
            when(messageRepository.findByConversationIdOrderByCreatedAtAsc(CONVERSATION_ID, pageable))
                .thenReturn(new PageImpl<>(List.of(message)));
            when(messageMapper.toDTO(any())).thenReturn(messageDTO);

            // Act
            Page<MessageDTO> result = conversationService.getMessages(CONVERSATION_ID, TENANT_ID, USER_ID, pageable);

            // Assert
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).content()).isEqualTo("Hello");
        }

        @Test
        @DisplayName("should throw when conversation not accessible")
        void getMessages_whenNotAccessible_shouldThrow() {
            // Arrange
            Pageable pageable = PageRequest.of(0, 20);
            when(conversationRepository.findByIdAndAccess(CONVERSATION_ID, TENANT_ID, USER_ID))
                .thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> conversationService.getMessages(CONVERSATION_ID, TENANT_ID, USER_ID, pageable))
                .isInstanceOf(RuntimeException.class);
        }
    }

    @Nested
    @DisplayName("sendMessage")
    class SendMessage {

        @Mock
        private LlmProviderService mockProvider;

        @Test
        @DisplayName("should send user message and return assistant response")
        void sendMessage_shouldReturnAssistantMessage() {
            // Arrange
            SendMessageRequest request = SendMessageRequest.builder()
                .content("Hello AI")
                .stream(false)
                .build();

            when(conversationRepository.findByIdAndAccess(CONVERSATION_ID, TENANT_ID, USER_ID))
                .thenReturn(Optional.of(sampleConversation));

            MessageEntity savedUserMsg = MessageEntity.builder()
                .id(UUID.randomUUID())
                .conversation(sampleConversation)
                .role(MessageRole.USER)
                .content("Hello AI")
                .build();

            MessageEntity savedAssistantMsg = MessageEntity.builder()
                .id(UUID.randomUUID())
                .conversation(sampleConversation)
                .role(MessageRole.ASSISTANT)
                .content("Hello! How can I help?")
                .tokenCount(50)
                .build();

            when(messageRepository.save(any(MessageEntity.class)))
                .thenReturn(savedUserMsg)
                .thenReturn(savedAssistantMsg);
            when(messageRepository.findRecentMessages(eq(CONVERSATION_ID), eq(20)))
                .thenReturn(Collections.emptyList());

            ChatResponse chatResponse = new ChatResponse("Hello! How can I help?", 10, 40, "stop");
            when(providerFactory.getProvider(LlmProvider.OPENAI)).thenReturn(mockProvider);
            when(mockProvider.chat(any(ChatRequest.class)))
                .thenReturn(CompletableFuture.completedFuture(chatResponse));

            when(conversationRepository.save(any())).thenReturn(sampleConversation);

            MessageDTO expectedDTO = MessageDTO.builder()
                .id(savedAssistantMsg.getId())
                .conversationId(CONVERSATION_ID)
                .role(MessageRole.ASSISTANT)
                .content("Hello! How can I help?")
                .tokenCount(50)
                .build();
            when(messageMapper.toDTO(any())).thenReturn(expectedDTO);

            // Act
            MessageDTO result = conversationService.sendMessage(CONVERSATION_ID, TENANT_ID, USER_ID, request);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.content()).isEqualTo("Hello! How can I help?");
            assertThat(result.role()).isEqualTo(MessageRole.ASSISTANT);
            verify(providerFactory).getProvider(LlmProvider.OPENAI);
            verify(agentService).incrementUsage(AGENT_ID);
        }

        @Test
        @DisplayName("should include RAG context when agent has RAG enabled")
        void sendMessage_whenRagEnabled_shouldIncludeRagContext() {
            // Arrange
            sampleAgent.setRagEnabled(true);

            SendMessageRequest request = SendMessageRequest.builder()
                .content("Tell me about policies")
                .stream(false)
                .build();

            when(conversationRepository.findByIdAndAccess(CONVERSATION_ID, TENANT_ID, USER_ID))
                .thenReturn(Optional.of(sampleConversation));
            when(messageRepository.save(any())).thenReturn(
                MessageEntity.builder().id(UUID.randomUUID()).build());
            when(messageRepository.findRecentMessages(any(), eq(20))).thenReturn(Collections.emptyList());
            when(ragService.getRelevantContext(AGENT_ID, "Tell me about policies"))
                .thenReturn("Policy document content...");

            ChatResponse chatResponse = new ChatResponse("Based on the policy...", 100, 50, "stop");
            when(providerFactory.getProvider(LlmProvider.OPENAI)).thenReturn(mockProvider);
            when(mockProvider.chat(any(ChatRequest.class)))
                .thenReturn(CompletableFuture.completedFuture(chatResponse));
            when(conversationRepository.save(any())).thenReturn(sampleConversation);
            when(messageMapper.toDTO(any())).thenReturn(MessageDTO.builder().content("Based on the policy...").build());

            // Act
            conversationService.sendMessage(CONVERSATION_ID, TENANT_ID, USER_ID, request);

            // Assert
            verify(ragService).getRelevantContext(AGENT_ID, "Tell me about policies");
            ArgumentCaptor<ChatRequest> requestCaptor = ArgumentCaptor.forClass(ChatRequest.class);
            verify(mockProvider).chat(requestCaptor.capture());
            assertThat(requestCaptor.getValue().systemPrompt()).contains("Relevant context");
        }

        @Test
        @DisplayName("should throw wrapped exception when LLM call fails")
        void sendMessage_whenLlmFails_shouldThrowException() {
            // Arrange
            SendMessageRequest request = SendMessageRequest.builder()
                .content("Hello")
                .stream(false)
                .build();

            when(conversationRepository.findByIdAndAccess(CONVERSATION_ID, TENANT_ID, USER_ID))
                .thenReturn(Optional.of(sampleConversation));
            when(messageRepository.save(any())).thenReturn(
                MessageEntity.builder().id(UUID.randomUUID()).build());
            when(messageRepository.findRecentMessages(any(), eq(20))).thenReturn(Collections.emptyList());

            when(providerFactory.getProvider(LlmProvider.OPENAI)).thenReturn(mockProvider);
            when(mockProvider.chat(any(ChatRequest.class)))
                .thenReturn(CompletableFuture.failedFuture(new RuntimeException("API timeout")));

            // Act & Assert
            assertThatThrownBy(() -> conversationService.sendMessage(CONVERSATION_ID, TENANT_ID, USER_ID, request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Failed to get response from AI");
        }

        @Test
        @DisplayName("should throw when conversation not found for send")
        void sendMessage_whenConversationNotFound_shouldThrow() {
            // Arrange
            SendMessageRequest request = SendMessageRequest.builder().content("Hi").stream(false).build();
            when(conversationRepository.findByIdAndAccess(CONVERSATION_ID, TENANT_ID, USER_ID))
                .thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> conversationService.sendMessage(CONVERSATION_ID, TENANT_ID, USER_ID, request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Conversation not found");
        }
    }

    @Nested
    @DisplayName("updateConversationTitle")
    class UpdateConversationTitle {

        @Test
        @DisplayName("should update title on existing conversation")
        void updateConversationTitle_shouldUpdateTitle() {
            // Arrange
            when(conversationRepository.findByIdAndAccess(CONVERSATION_ID, TENANT_ID, USER_ID))
                .thenReturn(Optional.of(sampleConversation));
            when(conversationRepository.save(any())).thenReturn(sampleConversation);

            // Act
            conversationService.updateConversationTitle(CONVERSATION_ID, TENANT_ID, USER_ID, "New Title");

            // Assert
            assertThat(sampleConversation.getTitle()).isEqualTo("New Title");
            verify(conversationRepository).save(sampleConversation);
        }

        @Test
        @DisplayName("should throw when conversation not found for title update")
        void updateConversationTitle_whenNotFound_shouldThrow() {
            // Arrange
            when(conversationRepository.findByIdAndAccess(CONVERSATION_ID, TENANT_ID, USER_ID))
                .thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> conversationService.updateConversationTitle(
                CONVERSATION_ID, TENANT_ID, USER_ID, "Title"))
                .isInstanceOf(RuntimeException.class);
        }
    }
}
