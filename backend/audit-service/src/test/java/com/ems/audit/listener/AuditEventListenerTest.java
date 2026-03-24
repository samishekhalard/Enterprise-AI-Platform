package com.ems.audit.listener;

import com.ems.audit.dto.AuditEventDTO;
import com.ems.audit.dto.CreateAuditEventRequest;
import com.ems.audit.service.AuditService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.support.Acknowledgment;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuditEventListener Unit Tests")
class AuditEventListenerTest {

    @Mock
    private AuditService auditService;

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private Acknowledgment acknowledgment;

    @InjectMocks
    private AuditEventListener listener;

    private String validJson;
    private CreateAuditEventRequest validRequest;

    @BeforeEach
    void setUp() {
        validRequest = CreateAuditEventRequest.builder()
                .tenantId("tenant-1")
                .eventType("USER_LOGIN")
                .userId(UUID.randomUUID())
                .username("admin")
                .message("User logged in")
                .serviceName("auth-facade")
                .build();

        validJson = "{\"tenantId\":\"tenant-1\",\"eventType\":\"USER_LOGIN\"}";
    }

    @Nested
    @DisplayName("handleAuditEvent")
    class HandleAuditEvent {

        @Test
        @DisplayName("handleAuditEvent_withValidMessage_shouldCreateEventAndAcknowledge")
        void handleAuditEvent_withValidMessage_shouldCreateEventAndAcknowledge() throws Exception {
            // Arrange
            when(objectMapper.readValue(validJson, CreateAuditEventRequest.class)).thenReturn(validRequest);
            when(auditService.createEvent(validRequest)).thenReturn(
                    AuditEventDTO.builder().id(UUID.randomUUID()).build()
            );

            // Act
            listener.handleAuditEvent(validJson, acknowledgment);

            // Assert
            verify(objectMapper).readValue(validJson, CreateAuditEventRequest.class);
            verify(auditService).createEvent(validRequest);
            verify(acknowledgment).acknowledge();
        }

        @Test
        @DisplayName("handleAuditEvent_withInvalidJson_shouldNotAcknowledge")
        void handleAuditEvent_withInvalidJson_shouldNotAcknowledge() throws Exception {
            // Arrange
            String invalidJson = "not-valid-json{{{";
            when(objectMapper.readValue(invalidJson, CreateAuditEventRequest.class))
                    .thenThrow(new JsonProcessingException("Invalid JSON") {});

            // Act
            listener.handleAuditEvent(invalidJson, acknowledgment);

            // Assert
            verify(auditService, never()).createEvent(any());
            verify(acknowledgment, never()).acknowledge();
        }

        @Test
        @DisplayName("handleAuditEvent_whenServiceThrowsException_shouldNotAcknowledge")
        void handleAuditEvent_whenServiceThrowsException_shouldNotAcknowledge() throws Exception {
            // Arrange
            when(objectMapper.readValue(validJson, CreateAuditEventRequest.class)).thenReturn(validRequest);
            when(auditService.createEvent(validRequest)).thenThrow(new RuntimeException("DB error"));

            // Act
            listener.handleAuditEvent(validJson, acknowledgment);

            // Assert
            verify(auditService).createEvent(validRequest);
            verify(acknowledgment, never()).acknowledge();
        }

        @Test
        @DisplayName("handleAuditEvent_whenObjectMapperThrowsUnexpectedError_shouldNotAcknowledge")
        void handleAuditEvent_whenObjectMapperThrowsUnexpectedError_shouldNotAcknowledge() throws Exception {
            // Arrange
            when(objectMapper.readValue(anyString(), eq(CreateAuditEventRequest.class)))
                    .thenThrow(new RuntimeException("Unexpected error"));

            // Act
            listener.handleAuditEvent(validJson, acknowledgment);

            // Assert
            verify(auditService, never()).createEvent(any());
            verify(acknowledgment, never()).acknowledge();
        }
    }
}
