package com.ems.notification.listener;

import com.ems.notification.dto.SendNotificationRequest;
import com.ems.notification.service.NotificationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "spring.kafka.enabled", havingValue = "true", matchIfMissing = false)
public class NotificationEventListener {

    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    @KafkaListener(
        topics = "${notification.kafka.topic:notification-events}",
        groupId = "${spring.kafka.consumer.group-id:notification-service}"
    )
    public void handleNotificationEvent(@Payload String message, Acknowledgment acknowledgment) {
        try {
            log.debug("Received notification event from Kafka: {}", message);

            SendNotificationRequest request = objectMapper.readValue(message, SendNotificationRequest.class);
            notificationService.send(request);

            acknowledgment.acknowledge();
            log.debug("Successfully processed notification event");
        } catch (Exception e) {
            log.error("Failed to process notification event: {}", e.getMessage(), e);
            // Don't acknowledge - message will be retried
        }
    }
}
