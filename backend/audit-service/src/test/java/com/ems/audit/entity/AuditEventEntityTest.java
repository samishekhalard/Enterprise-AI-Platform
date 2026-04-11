package com.ems.audit.entity;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

@DisplayName("AuditEventEntity Unit Tests")
class AuditEventEntityTest {

    @Nested
    @DisplayName("Builder Defaults")
    class BuilderDefaults {

        @Test
        @DisplayName("builder_shouldSetDefaultSeverityToINFO")
        void builder_shouldSetDefaultSeverityToINFO() {
            // Arrange & Act
            AuditEventEntity entity = AuditEventEntity.builder()
                    .tenantId("tenant-1")
                    .eventType("USER_LOGIN")
                    .build();

            // Assert
            assertThat(entity.getSeverity()).isEqualTo("INFO");
        }

        @Test
        @DisplayName("builder_shouldSetDefaultOutcomeToSUCCESS")
        void builder_shouldSetDefaultOutcomeToSUCCESS() {
            // Arrange & Act
            AuditEventEntity entity = AuditEventEntity.builder()
                    .tenantId("tenant-1")
                    .eventType("USER_LOGIN")
                    .build();

            // Assert
            assertThat(entity.getOutcome()).isEqualTo("SUCCESS");
        }

        @Test
        @DisplayName("builder_withExplicitSeverity_shouldOverrideDefault")
        void builder_withExplicitSeverity_shouldOverrideDefault() {
            // Arrange & Act
            AuditEventEntity entity = AuditEventEntity.builder()
                    .tenantId("tenant-1")
                    .eventType("SECURITY_BREACH")
                    .severity("CRITICAL")
                    .build();

            // Assert
            assertThat(entity.getSeverity()).isEqualTo("CRITICAL");
        }

        @Test
        @DisplayName("builder_withExplicitOutcome_shouldOverrideDefault")
        void builder_withExplicitOutcome_shouldOverrideDefault() {
            // Arrange & Act
            AuditEventEntity entity = AuditEventEntity.builder()
                    .tenantId("tenant-1")
                    .eventType("USER_LOGIN")
                    .outcome("FAILURE")
                    .build();

            // Assert
            assertThat(entity.getOutcome()).isEqualTo("FAILURE");
        }
    }

    @Nested
    @DisplayName("Field Population")
    class FieldPopulation {

        @Test
        @DisplayName("builder_withAllFields_shouldPopulateCorrectly")
        void builder_withAllFields_shouldPopulateCorrectly() {
            // Arrange
            UUID id = UUID.randomUUID();
            UUID userId = UUID.randomUUID();
            Instant now = Instant.now();
            Instant expiresAt = now.plusSeconds(86400);
            Map<String, Object> oldValues = Map.of("status", "ACTIVE");
            Map<String, Object> newValues = Map.of("status", "INACTIVE");
            Map<String, Object> metadata = Map.of("browser", "Chrome");

            // Act
            AuditEventEntity entity = AuditEventEntity.builder()
                    .id(id)
                    .tenantId("tenant-1")
                    .userId(userId)
                    .username("admin")
                    .sessionId("session-abc")
                    .eventType("USER_UPDATE")
                    .eventCategory("USER_MANAGEMENT")
                    .severity("WARNING")
                    .message("User status changed")
                    .resourceType("USER")
                    .resourceId("user-123")
                    .resourceName("John Doe")
                    .action("UPDATE")
                    .outcome("SUCCESS")
                    .failureReason(null)
                    .oldValues(oldValues)
                    .newValues(newValues)
                    .ipAddress("192.168.1.1")
                    .userAgent("Mozilla/5.0")
                    .requestId("req-123")
                    .correlationId("corr-456")
                    .serviceName("user-service")
                    .serviceVersion("1.0.0")
                    .metadata(metadata)
                    .timestamp(now)
                    .expiresAt(expiresAt)
                    .build();

            // Assert
            assertThat(entity.getId()).isEqualTo(id);
            assertThat(entity.getTenantId()).isEqualTo("tenant-1");
            assertThat(entity.getUserId()).isEqualTo(userId);
            assertThat(entity.getUsername()).isEqualTo("admin");
            assertThat(entity.getSessionId()).isEqualTo("session-abc");
            assertThat(entity.getEventType()).isEqualTo("USER_UPDATE");
            assertThat(entity.getEventCategory()).isEqualTo("USER_MANAGEMENT");
            assertThat(entity.getSeverity()).isEqualTo("WARNING");
            assertThat(entity.getMessage()).isEqualTo("User status changed");
            assertThat(entity.getResourceType()).isEqualTo("USER");
            assertThat(entity.getResourceId()).isEqualTo("user-123");
            assertThat(entity.getResourceName()).isEqualTo("John Doe");
            assertThat(entity.getAction()).isEqualTo("UPDATE");
            assertThat(entity.getOutcome()).isEqualTo("SUCCESS");
            assertThat(entity.getFailureReason()).isNull();
            assertThat(entity.getOldValues()).isEqualTo(oldValues);
            assertThat(entity.getNewValues()).isEqualTo(newValues);
            assertThat(entity.getIpAddress()).isEqualTo("192.168.1.1");
            assertThat(entity.getUserAgent()).isEqualTo("Mozilla/5.0");
            assertThat(entity.getRequestId()).isEqualTo("req-123");
            assertThat(entity.getCorrelationId()).isEqualTo("corr-456");
            assertThat(entity.getServiceName()).isEqualTo("user-service");
            assertThat(entity.getServiceVersion()).isEqualTo("1.0.0");
            assertThat(entity.getMetadata()).isEqualTo(metadata);
            assertThat(entity.getTimestamp()).isEqualTo(now);
            assertThat(entity.getExpiresAt()).isEqualTo(expiresAt);
        }
    }

    @Nested
    @DisplayName("Setters")
    class Setters {

        @Test
        @DisplayName("setters_shouldAllowMutation")
        void setters_shouldAllowMutation() {
            // Arrange
            AuditEventEntity entity = new AuditEventEntity();

            // Act
            entity.setTenantId("tenant-2");
            entity.setEventType("DATA_EXPORT");
            entity.setSeverity("HIGH");
            entity.setOutcome("FAILURE");
            entity.setFailureReason("Permission denied");

            // Assert
            assertThat(entity.getTenantId()).isEqualTo("tenant-2");
            assertThat(entity.getEventType()).isEqualTo("DATA_EXPORT");
            assertThat(entity.getSeverity()).isEqualTo("HIGH");
            assertThat(entity.getOutcome()).isEqualTo("FAILURE");
            assertThat(entity.getFailureReason()).isEqualTo("Permission denied");
        }
    }
}
