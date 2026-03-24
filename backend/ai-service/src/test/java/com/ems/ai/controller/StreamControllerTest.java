package com.ems.ai.controller;

import com.ems.ai.dto.SendMessageRequest;
import com.ems.ai.dto.StreamChunkDTO;
import com.ems.ai.service.ConversationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.bean.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import reactor.core.publisher.Flux;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(StreamController.class)
class StreamControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ConversationService conversationService;

    private static final String TENANT_ID = "tenant-1";
    private static final UUID USER_ID = UUID.randomUUID();
    private static final UUID CONVERSATION_ID = UUID.randomUUID();

    @Nested
    @DisplayName("POST /api/v1/conversations/{id}/stream")
    class StreamMessage {

        @Test
        @DisplayName("should return SSE stream with content type text/event-stream")
        void streamMessage_shouldReturnEventStream() throws Exception {
            // Arrange
            Flux<StreamChunkDTO> flux = Flux.just(
                StreamChunkDTO.start(),
                StreamChunkDTO.content("Hello"),
                StreamChunkDTO.content(" world"),
                StreamChunkDTO.done(UUID.randomUUID().toString(), 20)
            );

            when(conversationService.streamMessage(
                eq(CONVERSATION_ID), eq(TENANT_ID), eq(USER_ID), any(SendMessageRequest.class)))
                .thenReturn(flux);

            SendMessageRequest request = SendMessageRequest.builder()
                .content("Hi there")
                .stream(true)
                .build();

            // Act & Assert
            mockMvc.perform(post("/api/v1/conversations/{id}/stream", CONVERSATION_ID)
                    .with(jwt().jwt(j -> j.subject(USER_ID.toString())))
                    .header("X-Tenant-ID", TENANT_ID)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request))
                    .accept(MediaType.TEXT_EVENT_STREAM_VALUE))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("should return 401 when not authenticated")
        void streamMessage_whenNotAuthenticated_shouldReturn401() throws Exception {
            // Arrange
            SendMessageRequest request = SendMessageRequest.builder()
                .content("Hello")
                .stream(true)
                .build();

            // Act & Assert
            mockMvc.perform(post("/api/v1/conversations/{id}/stream", CONVERSATION_ID)
                    .header("X-Tenant-ID", TENANT_ID)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
        }
    }
}
