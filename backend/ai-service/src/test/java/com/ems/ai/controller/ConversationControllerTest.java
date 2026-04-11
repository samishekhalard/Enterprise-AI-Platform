package com.ems.ai.controller;

import com.ems.ai.dto.*;
import com.ems.ai.entity.ConversationEntity.ConversationStatus;
import com.ems.ai.entity.MessageEntity.MessageRole;
import com.ems.ai.service.ConversationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.bean.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ConversationController.class)
class ConversationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ConversationService conversationService;

    private static final String TENANT_ID = "tenant-1";
    private static final UUID USER_ID = UUID.randomUUID();
    private static final UUID AGENT_ID = UUID.randomUUID();
    private static final UUID CONVERSATION_ID = UUID.randomUUID();

    private ConversationDTO buildSampleConversationDTO() {
        return ConversationDTO.builder()
            .id(CONVERSATION_ID)
            .tenantId(TENANT_ID)
            .userId(USER_ID)
            .agentId(AGENT_ID)
            .agentName("Test Agent")
            .title("Test Conversation")
            .messageCount(2)
            .totalTokens(100)
            .status(ConversationStatus.ACTIVE)
            .lastMessageAt(Instant.now())
            .createdAt(Instant.now())
            .build();
    }

    @Nested
    @DisplayName("POST /api/v1/conversations")
    class CreateConversation {

        @Test
        @DisplayName("should create conversation and return 201")
        void createConversation_shouldReturn201() throws Exception {
            // Arrange
            ConversationDTO dto = buildSampleConversationDTO();
            when(conversationService.createConversation(eq(TENANT_ID), eq(USER_ID), any()))
                .thenReturn(dto);

            CreateConversationRequest request = CreateConversationRequest.builder()
                .agentId(AGENT_ID)
                .title("My Chat")
                .build();

            // Act & Assert
            mockMvc.perform(post("/api/v1/conversations")
                    .with(jwt().jwt(j -> j.subject(USER_ID.toString())))
                    .header("X-Tenant-ID", TENANT_ID)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", is(CONVERSATION_ID.toString())))
                .andExpect(jsonPath("$.agentName", is("Test Agent")));
        }

        @Test
        @DisplayName("should return 400 when agentId is missing")
        void createConversation_withoutAgentId_shouldReturn400() throws Exception {
            // Arrange
            String json = """
                {"title": "My Chat"}
                """;

            // Act & Assert
            mockMvc.perform(post("/api/v1/conversations")
                    .with(jwt().jwt(j -> j.subject(USER_ID.toString())))
                    .header("X-Tenant-ID", TENANT_ID)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json))
                .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("GET /api/v1/conversations/{id}")
    class GetConversation {

        @Test
        @DisplayName("should return conversation by ID")
        void getConversation_shouldReturn200() throws Exception {
            // Arrange
            ConversationDTO dto = buildSampleConversationDTO();
            when(conversationService.getConversation(CONVERSATION_ID, TENANT_ID, USER_ID))
                .thenReturn(dto);

            // Act & Assert
            mockMvc.perform(get("/api/v1/conversations/{id}", CONVERSATION_ID)
                    .with(jwt().jwt(j -> j.subject(USER_ID.toString())))
                    .header("X-Tenant-ID", TENANT_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title", is("Test Conversation")));
        }
    }

    @Nested
    @DisplayName("GET /api/v1/conversations")
    class GetConversations {

        @Test
        @DisplayName("should return user conversations without agentId filter")
        void getConversations_withoutAgentId_shouldReturnAll() throws Exception {
            // Arrange
            ConversationDTO dto = buildSampleConversationDTO();
            Page<ConversationDTO> page = new PageImpl<>(List.of(dto));
            when(conversationService.getUserConversations(eq(TENANT_ID), eq(USER_ID), any(Pageable.class)))
                .thenReturn(page);

            // Act & Assert
            mockMvc.perform(get("/api/v1/conversations")
                    .with(jwt().jwt(j -> j.subject(USER_ID.toString())))
                    .header("X-Tenant-ID", TENANT_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)));
        }

        @Test
        @DisplayName("should filter conversations by agentId when provided")
        void getConversations_withAgentId_shouldFilter() throws Exception {
            // Arrange
            ConversationDTO dto = buildSampleConversationDTO();
            Page<ConversationDTO> page = new PageImpl<>(List.of(dto));
            when(conversationService.getUserConversationsWithAgent(
                eq(TENANT_ID), eq(USER_ID), eq(AGENT_ID), any(Pageable.class)))
                .thenReturn(page);

            // Act & Assert
            mockMvc.perform(get("/api/v1/conversations")
                    .with(jwt().jwt(j -> j.subject(USER_ID.toString())))
                    .header("X-Tenant-ID", TENANT_ID)
                    .param("agentId", AGENT_ID.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)));

            verify(conversationService).getUserConversationsWithAgent(
                TENANT_ID, USER_ID, AGENT_ID, any());
        }
    }

    @Nested
    @DisplayName("GET /api/v1/conversations/recent")
    class GetRecentConversations {

        @Test
        @DisplayName("should return recent conversations list")
        void getRecentConversations_shouldReturnList() throws Exception {
            // Arrange
            ConversationDTO dto = buildSampleConversationDTO();
            when(conversationService.getRecentConversations(TENANT_ID, USER_ID))
                .thenReturn(List.of(dto));

            // Act & Assert
            mockMvc.perform(get("/api/v1/conversations/recent")
                    .with(jwt().jwt(j -> j.subject(USER_ID.toString())))
                    .header("X-Tenant-ID", TENANT_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
        }
    }

    @Nested
    @DisplayName("POST /api/v1/conversations/{id}/archive")
    class ArchiveConversation {

        @Test
        @DisplayName("should archive conversation and return 204")
        void archiveConversation_shouldReturn204() throws Exception {
            // Arrange
            doNothing().when(conversationService).archiveConversation(CONVERSATION_ID, TENANT_ID, USER_ID);

            // Act & Assert
            mockMvc.perform(post("/api/v1/conversations/{id}/archive", CONVERSATION_ID)
                    .with(jwt().jwt(j -> j.subject(USER_ID.toString())))
                    .header("X-Tenant-ID", TENANT_ID))
                .andExpect(status().isNoContent());

            verify(conversationService).archiveConversation(CONVERSATION_ID, TENANT_ID, USER_ID);
        }
    }

    @Nested
    @DisplayName("DELETE /api/v1/conversations/{id}")
    class DeleteConversation {

        @Test
        @DisplayName("should delete conversation and return 204")
        void deleteConversation_shouldReturn204() throws Exception {
            // Arrange
            doNothing().when(conversationService).deleteConversation(CONVERSATION_ID, TENANT_ID, USER_ID);

            // Act & Assert
            mockMvc.perform(delete("/api/v1/conversations/{id}", CONVERSATION_ID)
                    .with(jwt().jwt(j -> j.subject(USER_ID.toString())))
                    .header("X-Tenant-ID", TENANT_ID))
                .andExpect(status().isNoContent());
        }
    }

    @Nested
    @DisplayName("PATCH /api/v1/conversations/{id}/title")
    class UpdateTitle {

        @Test
        @DisplayName("should update title and return 204")
        void updateTitle_shouldReturn204() throws Exception {
            // Arrange
            doNothing().when(conversationService).updateConversationTitle(
                CONVERSATION_ID, TENANT_ID, USER_ID, "New Title");

            // Act & Assert
            mockMvc.perform(patch("/api/v1/conversations/{id}/title", CONVERSATION_ID)
                    .with(jwt().jwt(j -> j.subject(USER_ID.toString())))
                    .header("X-Tenant-ID", TENANT_ID)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("New Title"))
                .andExpect(status().isNoContent());
        }
    }

    @Nested
    @DisplayName("GET /api/v1/conversations/{id}/messages")
    class GetMessages {

        @Test
        @DisplayName("should return paginated messages")
        void getMessages_shouldReturnPage() throws Exception {
            // Arrange
            MessageDTO msg = MessageDTO.builder()
                .id(UUID.randomUUID())
                .conversationId(CONVERSATION_ID)
                .role(MessageRole.USER)
                .content("Hello")
                .tokenCount(5)
                .createdAt(Instant.now())
                .build();
            Page<MessageDTO> page = new PageImpl<>(List.of(msg));
            when(conversationService.getMessages(eq(CONVERSATION_ID), eq(TENANT_ID), eq(USER_ID), any(Pageable.class)))
                .thenReturn(page);

            // Act & Assert
            mockMvc.perform(get("/api/v1/conversations/{id}/messages", CONVERSATION_ID)
                    .with(jwt().jwt(j -> j.subject(USER_ID.toString())))
                    .header("X-Tenant-ID", TENANT_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].content", is("Hello")));
        }
    }

    @Nested
    @DisplayName("POST /api/v1/conversations/{id}/messages")
    class SendMessage {

        @Test
        @DisplayName("should send message and return 201")
        void sendMessage_shouldReturn201() throws Exception {
            // Arrange
            MessageDTO response = MessageDTO.builder()
                .id(UUID.randomUUID())
                .conversationId(CONVERSATION_ID)
                .role(MessageRole.ASSISTANT)
                .content("Hello! I can help.")
                .tokenCount(50)
                .createdAt(Instant.now())
                .build();

            when(conversationService.sendMessage(
                eq(CONVERSATION_ID), eq(TENANT_ID), eq(USER_ID), any(SendMessageRequest.class)))
                .thenReturn(response);

            SendMessageRequest request = SendMessageRequest.builder()
                .content("Hello AI")
                .stream(false)
                .build();

            // Act & Assert
            mockMvc.perform(post("/api/v1/conversations/{id}/messages", CONVERSATION_ID)
                    .with(jwt().jwt(j -> j.subject(USER_ID.toString())))
                    .header("X-Tenant-ID", TENANT_ID)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.role", is("ASSISTANT")))
                .andExpect(jsonPath("$.content", is("Hello! I can help.")));
        }

        @Test
        @DisplayName("should return 400 when content is blank")
        void sendMessage_withBlankContent_shouldReturn400() throws Exception {
            // Arrange
            SendMessageRequest request = SendMessageRequest.builder()
                .content("")
                .stream(false)
                .build();

            // Act & Assert
            mockMvc.perform(post("/api/v1/conversations/{id}/messages", CONVERSATION_ID)
                    .with(jwt().jwt(j -> j.subject(USER_ID.toString())))
                    .header("X-Tenant-ID", TENANT_ID)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
        }
    }
}
