package com.ems.notification.listener;

import com.ems.notification.dto.NotificationDTO;
import com.ems.notification.dto.SendNotificationRequest;
import com.ems.notification.service.NotificationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.support.Acknowledgment;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("NotificationEventListener Unit Tests")
class NotificationEventListenerTest {

    @Mock
    private NotificationService notificationService;

    @Mock
    private Acknowledgment acknowledgment;

    private NotificationEventListener listener;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.findAndRegisterModules();
        listener = new NotificationEventListener(notificationService, objectMapper);
    }

    @Test
    @DisplayName("Should deserialize Kafka message, send notification, and acknowledge")
    void handleNotificationEvent_withValidMessage_shouldSendAndAcknowledge() throws Exception {
        // Arrange
        SendNotificationRequest request = SendNotificationRequest.builder()
                .tenantId("tenant-1")
                .userId(UUID.randomUUID())
                .type("EMAIL")
                .subject("Kafka Notification")
                .body("Message from Kafka")
                .recipientAddress("user@example.com")
                .build();

        String message = objectMapper.writeValueAsString(request);
        NotificationDTO dto = NotificationDTO.builder()
                .id(UUID.randomUUID())
                .status("SENT")
                .build();
        when(notificationService.send(any(SendNotificationRequest.class))).thenReturn(dto);

        // Act
        listener.handleNotificationEvent(message, acknowledgment);

        // Assert
        verify(notificationService).send(any(SendNotificationRequest.class));
        verify(acknowledgment).acknowledge();
    }

    @Test
    @DisplayName("Should not acknowledge when deserialization fails")
    void handleNotificationEvent_withInvalidJson_shouldNotAcknowledge() {
        // Arrange
        String invalidJson = "this is not valid json";

        // Act
        listener.handleNotificationEvent(invalidJson, acknowledgment);

        // Assert
        verify(notificationService, never()).send(any());
        verify(acknowledgment, never()).acknowledge();
    }

    @Test
    @DisplayName("Should not acknowledge when notification service throws exception")
    void handleNotificationEvent_whenServiceFails_shouldNotAcknowledge() throws Exception {
        // Arrange
        SendNotificationRequest request = SendNotificationRequest.builder()
                .tenantId("tenant-1")
                .userId(UUID.randomUUID())
                .type("EMAIL")
                .subject("Subject")
                .body("Body")
                .build();
        String message = objectMapper.writeValueAsString(request);

        when(notificationService.send(any(SendNotificationRequest.class)))
                .thenThrow(new RuntimeException("Processing failed"));

        // Act
        listener.handleNotificationEvent(message, acknowledgment);

        // Assert
        verify(acknowledgment, never()).acknowledge();
    }
}
