package com.ems.audit.controller;

import com.ems.audit.dto.*;
import com.ems.audit.service.AuditService;
import com.ems.common.exception.ResourceNotFoundException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.Instant;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuditController Unit Tests")
class AuditControllerTest {

    @Mock
    private AuditService auditService;

    @InjectMocks
    private AuditController controller;

    private AuditEventDTO sampleDTO;
    private UUID sampleEventId;
    private UUID sampleUserId;

    @BeforeEach
    void setUp() {
        sampleEventId = UUID.randomUUID();
        sampleUserId = UUID.randomUUID();

        sampleDTO = AuditEventDTO.builder()
                .id(sampleEventId)
                .tenantId("tenant-1")
                .userId(sampleUserId)
                .username("admin")
                .eventType("USER_LOGIN")
                .eventCategory("AUTHENTICATION")
                .severity("INFO")
                .outcome("SUCCESS")
                .timestamp(Instant.now())
                .build();
    }

    @Nested
    @DisplayName("POST /api/v1/audit/events")
    class CreateEvent {

        @Test
        @DisplayName("createEvent_withValidRequest_shouldReturn201Created")
        void createEvent_withValidRequest_shouldReturn201Created() {
            // Arrange
            CreateAuditEventRequest request = CreateAuditEventRequest.builder()
                    .tenantId("tenant-1")
                    .eventType("USER_LOGIN")
                    .build();

            when(auditService.createEvent(request)).thenReturn(sampleDTO);

            // Act
            ResponseEntity<AuditEventDTO> response = controller.createEvent(request);

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
            assertThat(response.getBody()).isEqualTo(sampleDTO);
            verify(auditService).createEvent(request);
        }
    }

    @Nested
    @DisplayName("GET /api/v1/audit/events/{eventId}")
    class GetEvent {

        @Test
        @DisplayName("getEvent_whenExists_shouldReturn200Ok")
        void getEvent_whenExists_shouldReturn200Ok() {
            // Arrange
            when(auditService.getEvent(sampleEventId)).thenReturn(sampleDTO);

            // Act
            ResponseEntity<AuditEventDTO> response = controller.getEvent(sampleEventId);

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).isEqualTo(sampleDTO);
        }

        @Test
        @DisplayName("getEvent_whenNotFound_shouldPropagateException")
        void getEvent_whenNotFound_shouldPropagateException() {
            // Arrange
            UUID unknownId = UUID.randomUUID();
            when(auditService.getEvent(unknownId))
                    .thenThrow(new ResourceNotFoundException("AuditEvent", unknownId.toString()));

            // Act & Assert
            assertThatThrownBy(() -> controller.getEvent(unknownId))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("POST /api/v1/audit/events/search")
    class SearchEvents {

        @Test
        @DisplayName("searchEvents_withValidRequest_shouldReturn200Ok")
        void searchEvents_withValidRequest_shouldReturn200Ok() {
            // Arrange
            AuditSearchRequest request = new AuditSearchRequest(
                    "tenant-1", null, null, null, null, null,
                    null, null, null, null, null, null, null,
                    0, 50, "timestamp", "DESC"
            );

            AuditSearchResponse searchResponse = AuditSearchResponse.builder()
                    .content(List.of(sampleDTO))
                    .page(0)
                    .size(50)
                    .totalElements(1)
                    .totalPages(1)
                    .hasNext(false)
                    .hasPrevious(false)
                    .build();

            when(auditService.searchEvents(request)).thenReturn(searchResponse);

            // Act
            ResponseEntity<AuditSearchResponse> response = controller.searchEvents(request);

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody().content()).hasSize(1);
            assertThat(response.getBody().totalElements()).isEqualTo(1);
        }
    }

    @Nested
    @DisplayName("GET /api/v1/audit/events (listEvents)")
    class ListEvents {

        @Test
        @DisplayName("listEvents_withTenantIdOnly_shouldBuildSearchRequestAndReturn200")
        void listEvents_withTenantIdOnly_shouldBuildSearchRequestAndReturn200() {
            // Arrange
            AuditSearchResponse searchResponse = AuditSearchResponse.builder()
                    .content(List.of(sampleDTO))
                    .page(0)
                    .size(50)
                    .totalElements(1)
                    .totalPages(1)
                    .hasNext(false)
                    .hasPrevious(false)
                    .build();

            when(auditService.searchEvents(any(AuditSearchRequest.class))).thenReturn(searchResponse);

            // Act
            ResponseEntity<AuditSearchResponse> response = controller.listEvents(
                    "tenant-1", null, null, null, null, null, null, null, 0, 50
            );

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody().content()).hasSize(1);
            verify(auditService).searchEvents(any(AuditSearchRequest.class));
        }

        @Test
        @DisplayName("listEvents_withAllFilters_shouldPassThemToService")
        void listEvents_withAllFilters_shouldPassThemToService() {
            // Arrange
            Instant from = Instant.now().minus(7, java.time.temporal.ChronoUnit.DAYS);
            Instant to = Instant.now();

            AuditSearchResponse searchResponse = AuditSearchResponse.builder()
                    .content(List.of())
                    .page(0)
                    .size(50)
                    .totalElements(0)
                    .totalPages(0)
                    .hasNext(false)
                    .hasPrevious(false)
                    .build();

            when(auditService.searchEvents(any(AuditSearchRequest.class))).thenReturn(searchResponse);

            // Act
            ResponseEntity<AuditSearchResponse> response = controller.listEvents(
                    "tenant-1", sampleUserId, List.of("USER_LOGIN", "USER_LOGOUT"),
                    "USER", "user-123", "SUCCESS", from, to, 0, 50
            );

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            verify(auditService).searchEvents(argThat(req ->
                    "tenant-1".equals(req.tenantId()) &&
                    sampleUserId.equals(req.userId()) &&
                    req.eventTypes().contains("USER_LOGIN") &&
                    "USER".equals(req.resourceType()) &&
                    "user-123".equals(req.resourceId()) &&
                    "SUCCESS".equals(req.outcome())
            ));
        }
    }

    @Nested
    @DisplayName("GET /api/v1/audit/correlation/{correlationId}")
    class GetByCorrelationId {

        @Test
        @DisplayName("getByCorrelationId_whenEventsExist_shouldReturn200Ok")
        void getByCorrelationId_whenEventsExist_shouldReturn200Ok() {
            // Arrange
            String correlationId = "corr-abc-123";
            when(auditService.getEventsByCorrelationId(correlationId))
                    .thenReturn(List.of(sampleDTO));

            // Act
            ResponseEntity<List<AuditEventDTO>> response = controller.getByCorrelationId(correlationId);

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).hasSize(1);
        }

        @Test
        @DisplayName("getByCorrelationId_whenNoEvents_shouldReturnEmptyList")
        void getByCorrelationId_whenNoEvents_shouldReturnEmptyList() {
            // Arrange
            when(auditService.getEventsByCorrelationId("corr-none")).thenReturn(List.of());

            // Act
            ResponseEntity<List<AuditEventDTO>> response = controller.getByCorrelationId("corr-none");

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).isEmpty();
        }
    }

    @Nested
    @DisplayName("GET /api/v1/audit/users/{userId}/activity")
    class GetUserActivity {

        @Test
        @DisplayName("getUserActivity_withDefaultLimit_shouldReturn200Ok")
        void getUserActivity_withDefaultLimit_shouldReturn200Ok() {
            // Arrange
            when(auditService.getUserActivity(sampleUserId, 50)).thenReturn(List.of(sampleDTO));

            // Act
            ResponseEntity<List<AuditEventDTO>> response = controller.getUserActivity(sampleUserId, 50);

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).hasSize(1);
        }

        @Test
        @DisplayName("getUserActivity_withCustomLimit_shouldPassLimitToService")
        void getUserActivity_withCustomLimit_shouldPassLimitToService() {
            // Arrange
            when(auditService.getUserActivity(sampleUserId, 10)).thenReturn(List.of());

            // Act
            ResponseEntity<List<AuditEventDTO>> response = controller.getUserActivity(sampleUserId, 10);

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            verify(auditService).getUserActivity(sampleUserId, 10);
        }
    }

    @Nested
    @DisplayName("GET /api/v1/audit/resources/{resourceType}/{resourceId}/history")
    class GetResourceHistory {

        @Test
        @DisplayName("getResourceHistory_withValidParams_shouldReturn200Ok")
        void getResourceHistory_withValidParams_shouldReturn200Ok() {
            // Arrange
            when(auditService.getResourceHistory("tenant-1", "USER", "user-123", 50))
                    .thenReturn(List.of(sampleDTO));

            // Act
            ResponseEntity<List<AuditEventDTO>> response =
                    controller.getResourceHistory("tenant-1", "USER", "user-123", 50);

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).hasSize(1);
        }
    }

    @Nested
    @DisplayName("GET /api/v1/audit/stats")
    class GetStats {

        @Test
        @DisplayName("getStats_withValidParams_shouldReturn200Ok")
        void getStats_withValidParams_shouldReturn200Ok() {
            // Arrange
            AuditStatsDTO stats = AuditStatsDTO.builder()
                    .tenantId("tenant-1")
                    .totalEvents(100)
                    .eventsByType(Map.of("USER_LOGIN", 100L))
                    .eventsByCategory(Map.of("AUTHENTICATION", 100L))
                    .eventsByOutcome(Map.of("SUCCESS", 100L))
                    .eventsBySeverity(Map.of("INFO", 100L))
                    .eventsByService(Map.of("auth-facade", 100L))
                    .eventsByDay(Map.of())
                    .build();

            when(auditService.getStats("tenant-1", 30)).thenReturn(stats);

            // Act
            ResponseEntity<AuditStatsDTO> response = controller.getStats("tenant-1", 30);

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody().totalEvents()).isEqualTo(100);
        }
    }

    @Nested
    @DisplayName("DELETE /api/v1/audit/events/expired")
    class PurgeExpired {

        @Test
        @DisplayName("purgeExpired_shouldReturn204NoContent")
        void purgeExpired_shouldReturn204NoContent() {
            // Arrange
            when(auditService.purgeExpiredEvents()).thenReturn(10);

            // Act
            ResponseEntity<Void> response = controller.purgeExpired();

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
            verify(auditService).purgeExpiredEvents();
        }
    }
}
