package com.ems.audit.listener;

import com.ems.audit.dto.CreateAuditEventRequest;
import com.ems.audit.service.AuditService;
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
public class AuditEventListener {

    private final AuditService auditService;
    private final ObjectMapper objectMapper;

    @KafkaListener(
        topics = "${audit.kafka.topic:audit-events}",
        groupId = "${spring.kafka.consumer.group-id:audit-service}"
    )
    public void handleAuditEvent(@Payload String message, Acknowledgment acknowledgment) {
        try {
            log.debug("Received audit event from Kafka: {}", message);

            CreateAuditEventRequest request = objectMapper.readValue(message, CreateAuditEventRequest.class);
            auditService.createEvent(request);

            acknowledgment.acknowledge();
            log.debug("Successfully processed audit event");
        } catch (Exception e) {
            log.error("Failed to process audit event: {}", e.getMessage(), e);
            // Don't acknowledge - message will be retried
        }
    }
}
