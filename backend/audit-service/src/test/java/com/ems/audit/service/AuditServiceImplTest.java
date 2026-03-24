package com.ems.audit.service;

import com.ems.audit.dto.*;
import com.ems.audit.entity.AuditEventEntity;
import com.ems.audit.mapper.AuditEventMapper;
import com.ems.audit.repository.AuditEventRepository;
import com.ems.audit.repository.AuditEventSpecifications;
import com.ems.common.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuditServiceImpl Unit Tests")
class AuditServiceImplTest {

    @Mock
    private AuditEventRepository repository;

    @Mock
    private AuditEventMapper mapper;

    @InjectMocks
    private AuditServiceImpl auditService;

    private AuditEventEntity sampleEntity;
    private AuditEventDTO sampleDTO;
    private CreateAuditEventRequest sampleCreateRequest;

    @BeforeEach
    void setUp() {
        UUID eventId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        Instant now = Instant.now();

        sampleEntity = AuditEventEntity.builder()
                .id(eventId)
                .tenantId("tenant-1")
                .userId(userId)
                .username("admin")
                .eventType("USER_LOGIN")
                .eventCategory("AUTHENTICATION")
                .severity("INFO")
                .message("User logged in successfully")
                .resourceType("USER")
                .resourceId(userId.toString())
                .outcome("SUCCESS")
                .serviceName("auth-facade")
                .timestamp(now)
                .build();

        sampleDTO = AuditEventDTO.builder()
                .id(eventId)
                .tenantId("tenant-1")
                .userId(userId)
                .username("admin")
                .eventType("USER_LOGIN")
                .eventCategory("AUTHENTICATION")
                .severity("INFO")
                .message("User logged in successfully")
                .resourceType("USER")
                .resourceId(userId.toString())
                .outcome("SUCCESS")
                .serviceName("auth-facade")
                .timestamp(now)
                .build();

        sampleCreateRequest = CreateAuditEventRequest.builder()
                .tenantId("tenant-1")
                .userId(userId)
                .username("admin")
                .eventType("USER_LOGIN")
                .eventCategory("AUTHENTICATION")
                .message("User logged in successfully")
                .resourceType("USER")
                .resourceId(userId.toString())
                .serviceName("auth-facade")
                .build();
    }

    @Nested
    @DisplayName("createEvent")
    class CreateEvent {

        @Test
        @DisplayName("createEvent_withValidRequest_shouldSaveAndReturnDTO")
        void createEvent_withValidRequest_shouldSaveAndReturnDTO() {
            // Arrange
            when(mapper.toEntity(sampleCreateRequest)).thenReturn(sampleEntity);
            when(repository.save(sampleEntity)).thenReturn(sampleEntity);
            when(mapper.toDTO(sampleEntity)).thenReturn(sampleDTO);

            // Act
            AuditEventDTO result = auditService.createEvent(sampleCreateRequest);

            // Assert
            assertThat(result).isEqualTo(sampleDTO);
            verify(mapper).toEntity(sampleCreateRequest);
            verify(repository).save(sampleEntity);
            verify(mapper).toDTO(sampleEntity);
        }

        @Test
        @DisplayName("createEvent_withNullSeverity_shouldDefaultToINFO")
        void createEvent_withNullSeverity_shouldDefaultToINFO() {
            // Arrange
            AuditEventEntity entityWithNullSeverity = AuditEventEntity.builder()
                    .tenantId("tenant-1")
                    .eventType("USER_LOGIN")
                    .severity(null)
                    .outcome("SUCCESS")
                    .build();

            when(mapper.toEntity(sampleCreateRequest)).thenReturn(entityWithNullSeverity);
            when(repository.save(entityWithNullSeverity)).thenReturn(entityWithNullSeverity);
            when(mapper.toDTO(entityWithNullSeverity)).thenReturn(sampleDTO);

            // Act
            auditService.createEvent(sampleCreateRequest);

            // Assert
            assertThat(entityWithNullSeverity.getSeverity()).isEqualTo("INFO");
        }

        @Test
        @DisplayName("createEvent_withNullOutcome_shouldDefaultToSUCCESS")
        void createEvent_withNullOutcome_shouldDefaultToSUCCESS() {
            // Arrange
            AuditEventEntity entityWithNullOutcome = AuditEventEntity.builder()
                    .tenantId("tenant-1")
                    .eventType("USER_LOGIN")
                    .severity("INFO")
                    .outcome(null)
                    .build();

            when(mapper.toEntity(sampleCreateRequest)).thenReturn(entityWithNullOutcome);
            when(repository.save(entityWithNullOutcome)).thenReturn(entityWithNullOutcome);
            when(mapper.toDTO(entityWithNullOutcome)).thenReturn(sampleDTO);

            // Act
            auditService.createEvent(sampleCreateRequest);

            // Assert
            assertThat(entityWithNullOutcome.getOutcome()).isEqualTo("SUCCESS");
        }

        @Test
        @DisplayName("createEvent_withCustomRetentionDays_shouldSetCorrectExpiration")
        void createEvent_withCustomRetentionDays_shouldSetCorrectExpiration() {
            // Arrange
            CreateAuditEventRequest requestWithRetention = CreateAuditEventRequest.builder()
                    .tenantId("tenant-1")
                    .eventType("USER_LOGIN")
                    .retentionDays(90)
                    .build();

            AuditEventEntity entity = AuditEventEntity.builder()
                    .tenantId("tenant-1")
                    .eventType("USER_LOGIN")
                    .severity("INFO")
                    .outcome("SUCCESS")
                    .build();

            when(mapper.toEntity(requestWithRetention)).thenReturn(entity);
            when(repository.save(entity)).thenReturn(entity);
            when(mapper.toDTO(entity)).thenReturn(sampleDTO);

            // Act
            Instant beforeCall = Instant.now();
            auditService.createEvent(requestWithRetention);
            Instant afterCall = Instant.now();

            // Assert
            Instant expectedMin = beforeCall.plus(90, ChronoUnit.DAYS);
            Instant expectedMax = afterCall.plus(90, ChronoUnit.DAYS);
            assertThat(entity.getExpiresAt()).isBetween(expectedMin, expectedMax);
        }

        @Test
        @DisplayName("createEvent_withNullRetentionDays_shouldUseDefault365Days")
        void createEvent_withNullRetentionDays_shouldUseDefault365Days() {
            // Arrange
            AuditEventEntity entity = AuditEventEntity.builder()
                    .tenantId("tenant-1")
                    .eventType("USER_LOGIN")
                    .severity("INFO")
                    .outcome("SUCCESS")
                    .build();

            when(mapper.toEntity(sampleCreateRequest)).thenReturn(entity);
            when(repository.save(entity)).thenReturn(entity);
            when(mapper.toDTO(entity)).thenReturn(sampleDTO);

            // Act
            Instant beforeCall = Instant.now();
            auditService.createEvent(sampleCreateRequest);
            Instant afterCall = Instant.now();

            // Assert
            Instant expectedMin = beforeCall.plus(365, ChronoUnit.DAYS);
            Instant expectedMax = afterCall.plus(365, ChronoUnit.DAYS);
            assertThat(entity.getExpiresAt()).isBetween(expectedMin, expectedMax);
        }

        @Test
        @DisplayName("createEvent_withBothNullSeverityAndOutcome_shouldSetBothDefaults")
        void createEvent_withBothNullSeverityAndOutcome_shouldSetBothDefaults() {
            // Arrange
            AuditEventEntity entity = AuditEventEntity.builder()
                    .tenantId("tenant-1")
                    .eventType("USER_LOGIN")
                    .severity(null)
                    .outcome(null)
                    .build();

            when(mapper.toEntity(sampleCreateRequest)).thenReturn(entity);
            when(repository.save(entity)).thenReturn(entity);
            when(mapper.toDTO(entity)).thenReturn(sampleDTO);

            // Act
            auditService.createEvent(sampleCreateRequest);

            // Assert
            assertThat(entity.getSeverity()).isEqualTo("INFO");
            assertThat(entity.getOutcome()).isEqualTo("SUCCESS");
        }

        @Test
        @DisplayName("createEvent_withExistingSeverityAndOutcome_shouldNotOverride")
        void createEvent_withExistingSeverityAndOutcome_shouldNotOverride() {
            // Arrange
            AuditEventEntity entity = AuditEventEntity.builder()
                    .tenantId("tenant-1")
                    .eventType("USER_LOGIN")
                    .severity("CRITICAL")
                    .outcome("FAILURE")
                    .build();

            when(mapper.toEntity(sampleCreateRequest)).thenReturn(entity);
            when(repository.save(entity)).thenReturn(entity);
            when(mapper.toDTO(entity)).thenReturn(sampleDTO);

            // Act
            auditService.createEvent(sampleCreateRequest);

            // Assert
            assertThat(entity.getSeverity()).isEqualTo("CRITICAL");
            assertThat(entity.getOutcome()).isEqualTo("FAILURE");
        }
    }

    @Nested
    @DisplayName("getEvent")
    class GetEvent {

        @Test
        @DisplayName("getEvent_whenEventExists_shouldReturnDTO")
        void getEvent_whenEventExists_shouldReturnDTO() {
            // Arrange
            UUID eventId = sampleEntity.getId();
            when(repository.findById(eventId)).thenReturn(Optional.of(sampleEntity));
            when(mapper.toDTO(sampleEntity)).thenReturn(sampleDTO);

            // Act
            AuditEventDTO result = auditService.getEvent(eventId);

            // Assert
            assertThat(result).isEqualTo(sampleDTO);
            verify(repository).findById(eventId);
        }

        @Test
        @DisplayName("getEvent_whenEventNotFound_shouldThrowResourceNotFoundException")
        void getEvent_whenEventNotFound_shouldThrowResourceNotFoundException() {
            // Arrange
            UUID eventId = UUID.randomUUID();
            when(repository.findById(eventId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> auditService.getEvent(eventId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("AuditEvent")
                    .hasMessageContaining(eventId.toString());
        }
    }

    @Nested
    @DisplayName("searchEvents")
    class SearchEvents {

        @Test
        @DisplayName("searchEvents_withValidRequest_shouldReturnPaginatedResponse")
        void searchEvents_withValidRequest_shouldReturnPaginatedResponse() {
            // Arrange
            AuditSearchRequest request = new AuditSearchRequest(
                    "tenant-1", null, null, null, null, null,
                    null, null, null, null, null, null, null,
                    0, 50, "timestamp", "DESC"
            );

            Page<AuditEventEntity> page = new PageImpl<>(
                    List.of(sampleEntity), PageRequest.of(0, 50), 1
            );

            when(repository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);
            when(mapper.toDTOList(page.getContent())).thenReturn(List.of(sampleDTO));

            // Act
            AuditSearchResponse response = auditService.searchEvents(request);

            // Assert
            assertThat(response.content()).hasSize(1);
            assertThat(response.page()).isZero();
            assertThat(response.totalElements()).isEqualTo(1);
            assertThat(response.totalPages()).isEqualTo(1);
        }

        @Test
        @DisplayName("searchEvents_withAscDirection_shouldUseSortAsc")
        void searchEvents_withAscDirection_shouldUseSortAsc() {
            // Arrange
            AuditSearchRequest request = new AuditSearchRequest(
                    "tenant-1", null, null, null, null, null,
                    null, null, null, null, null, null, null,
                    0, 50, "timestamp", "ASC"
            );

            Page<AuditEventEntity> page = new PageImpl<>(List.of(), PageRequest.of(0, 50), 0);
            ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);

            when(repository.findAll(any(Specification.class), pageableCaptor.capture())).thenReturn(page);
            when(mapper.toDTOList(anyList())).thenReturn(List.of());

            // Act
            auditService.searchEvents(request);

            // Assert
            Pageable capturedPageable = pageableCaptor.getValue();
            assertThat(capturedPageable.getSort().getOrderFor("timestamp"))
                    .isNotNull()
                    .satisfies(order -> assertThat(order.getDirection()).isEqualTo(Sort.Direction.ASC));
        }

        @Test
        @DisplayName("searchEvents_withDefaultDescDirection_shouldUseSortDesc")
        void searchEvents_withDefaultDescDirection_shouldUseSortDesc() {
            // Arrange
            AuditSearchRequest request = new AuditSearchRequest(
                    "tenant-1", null, null, null, null, null,
                    null, null, null, null, null, null, null,
                    0, 50, "timestamp", "DESC"
            );

            Page<AuditEventEntity> page = new PageImpl<>(List.of(), PageRequest.of(0, 50), 0);
            ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);

            when(repository.findAll(any(Specification.class), pageableCaptor.capture())).thenReturn(page);
            when(mapper.toDTOList(anyList())).thenReturn(List.of());

            // Act
            auditService.searchEvents(request);

            // Assert
            Pageable capturedPageable = pageableCaptor.getValue();
            assertThat(capturedPageable.getSort().getOrderFor("timestamp"))
                    .isNotNull()
                    .satisfies(order -> assertThat(order.getDirection()).isEqualTo(Sort.Direction.DESC));
        }

        @Test
        @DisplayName("searchEvents_withEmptyResult_shouldReturnEmptyContent")
        void searchEvents_withEmptyResult_shouldReturnEmptyContent() {
            // Arrange
            AuditSearchRequest request = new AuditSearchRequest(
                    "tenant-1", null, null, null, null, null,
                    null, null, null, null, null, null, null,
                    0, 50, "timestamp", "DESC"
            );

            Page<AuditEventEntity> page = new PageImpl<>(List.of(), PageRequest.of(0, 50), 0);
            when(repository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);
            when(mapper.toDTOList(anyList())).thenReturn(List.of());

            // Act
            AuditSearchResponse response = auditService.searchEvents(request);

            // Assert
            assertThat(response.content()).isEmpty();
            assertThat(response.totalElements()).isZero();
            assertThat(response.hasNext()).isFalse();
            assertThat(response.hasPrevious()).isFalse();
        }

        @Test
        @DisplayName("searchEvents_withMultiplePages_shouldReportPaginationCorrectly")
        void searchEvents_withMultiplePages_shouldReportPaginationCorrectly() {
            // Arrange
            AuditSearchRequest request = new AuditSearchRequest(
                    "tenant-1", null, null, null, null, null,
                    null, null, null, null, null, null, null,
                    0, 10, "timestamp", "DESC"
            );

            List<AuditEventEntity> entities = new ArrayList<>();
            for (int i = 0; i < 10; i++) {
                entities.add(AuditEventEntity.builder()
                        .id(UUID.randomUUID())
                        .tenantId("tenant-1")
                        .eventType("EVENT_" + i)
                        .build());
            }

            Page<AuditEventEntity> page = new PageImpl<>(entities, PageRequest.of(0, 10), 25);
            when(repository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);
            when(mapper.toDTOList(anyList())).thenReturn(List.of());

            // Act
            AuditSearchResponse response = auditService.searchEvents(request);

            // Assert
            assertThat(response.totalElements()).isEqualTo(25);
            assertThat(response.totalPages()).isEqualTo(3);
            assertThat(response.hasNext()).isTrue();
            assertThat(response.hasPrevious()).isFalse();
        }
    }

    @Nested
    @DisplayName("getEventsByCorrelationId")
    class GetEventsByCorrelationId {

        @Test
        @DisplayName("getEventsByCorrelationId_whenEventsExist_shouldReturnDTOList")
        void getEventsByCorrelationId_whenEventsExist_shouldReturnDTOList() {
            // Arrange
            String correlationId = "corr-123";
            when(repository.findByCorrelationId(correlationId)).thenReturn(List.of(sampleEntity));
            when(mapper.toDTOList(List.of(sampleEntity))).thenReturn(List.of(sampleDTO));

            // Act
            List<AuditEventDTO> result = auditService.getEventsByCorrelationId(correlationId);

            // Assert
            assertThat(result).hasSize(1);
            verify(repository).findByCorrelationId(correlationId);
        }

        @Test
        @DisplayName("getEventsByCorrelationId_whenNoEventsExist_shouldReturnEmptyList")
        void getEventsByCorrelationId_whenNoEventsExist_shouldReturnEmptyList() {
            // Arrange
            String correlationId = "corr-unknown";
            when(repository.findByCorrelationId(correlationId)).thenReturn(List.of());
            when(mapper.toDTOList(List.of())).thenReturn(List.of());

            // Act
            List<AuditEventDTO> result = auditService.getEventsByCorrelationId(correlationId);

            // Assert
            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("getStats")
    class GetStats {

        @Test
        @DisplayName("getStats_withValidTenantAndDays_shouldReturnAggregatedStats")
        void getStats_withValidTenantAndDays_shouldReturnAggregatedStats() {
            // Arrange
            String tenantId = "tenant-1";
            int days = 30;

            when(repository.countByTenantIdAndTimestampAfter(eq(tenantId), any(Instant.class)))
                    .thenReturn(100L);
            when(repository.countByEventType(eq(tenantId), any(Instant.class)))
                    .thenReturn(List.of(new Object[]{"USER_LOGIN", 50L}, new Object[]{"USER_LOGOUT", 50L}));
            when(repository.countByEventCategory(eq(tenantId), any(Instant.class)))
                    .thenReturn(List.of(new Object[]{"AUTHENTICATION", 100L}));
            when(repository.countByOutcome(eq(tenantId), any(Instant.class)))
                    .thenReturn(List.of(new Object[]{"SUCCESS", 90L}, new Object[]{"FAILURE", 10L}));
            when(repository.countBySeverity(eq(tenantId), any(Instant.class)))
                    .thenReturn(List.of(new Object[]{"INFO", 95L}, new Object[]{"WARNING", 5L}));
            when(repository.countByServiceName(eq(tenantId), any(Instant.class)))
                    .thenReturn(List.of(new Object[]{"auth-facade", 100L}));
            when(repository.countByDay(eq(tenantId), any(Instant.class)))
                    .thenReturn(List.of(new Object[]{"2026-03-01", 10L}));

            // Act
            AuditStatsDTO stats = auditService.getStats(tenantId, days);

            // Assert
            assertThat(stats.tenantId()).isEqualTo(tenantId);
            assertThat(stats.totalEvents()).isEqualTo(100L);
            assertThat(stats.eventsByType()).containsEntry("USER_LOGIN", 50L);
            assertThat(stats.eventsByType()).containsEntry("USER_LOGOUT", 50L);
            assertThat(stats.eventsByCategory()).containsEntry("AUTHENTICATION", 100L);
            assertThat(stats.eventsByOutcome()).containsEntry("SUCCESS", 90L);
            assertThat(stats.eventsBySeverity()).containsEntry("INFO", 95L);
            assertThat(stats.eventsByService()).containsEntry("auth-facade", 100L);
            assertThat(stats.eventsByDay()).containsEntry("2026-03-01", 10L);
        }

        @Test
        @DisplayName("getStats_withEmptyResults_shouldReturnEmptyMaps")
        void getStats_withEmptyResults_shouldReturnEmptyMaps() {
            // Arrange
            String tenantId = "tenant-empty";
            int days = 7;

            when(repository.countByTenantIdAndTimestampAfter(eq(tenantId), any(Instant.class)))
                    .thenReturn(0L);
            when(repository.countByEventType(eq(tenantId), any(Instant.class))).thenReturn(List.of());
            when(repository.countByEventCategory(eq(tenantId), any(Instant.class))).thenReturn(List.of());
            when(repository.countByOutcome(eq(tenantId), any(Instant.class))).thenReturn(List.of());
            when(repository.countBySeverity(eq(tenantId), any(Instant.class))).thenReturn(List.of());
            when(repository.countByServiceName(eq(tenantId), any(Instant.class))).thenReturn(List.of());
            when(repository.countByDay(eq(tenantId), any(Instant.class))).thenReturn(List.of());

            // Act
            AuditStatsDTO stats = auditService.getStats(tenantId, days);

            // Assert
            assertThat(stats.totalEvents()).isZero();
            assertThat(stats.eventsByType()).isEmpty();
            assertThat(stats.eventsByCategory()).isEmpty();
            assertThat(stats.eventsByOutcome()).isEmpty();
            assertThat(stats.eventsBySeverity()).isEmpty();
            assertThat(stats.eventsByService()).isEmpty();
            assertThat(stats.eventsByDay()).isEmpty();
        }

        @Test
        @DisplayName("getStats_withNullKeyInAggregation_shouldFilterOut")
        void getStats_withNullKeyInAggregation_shouldFilterOut() {
            // Arrange
            String tenantId = "tenant-1";
            when(repository.countByTenantIdAndTimestampAfter(eq(tenantId), any(Instant.class)))
                    .thenReturn(10L);
            when(repository.countByEventType(eq(tenantId), any(Instant.class)))
                    .thenReturn(List.of(new Object[]{null, 5L}, new Object[]{"USER_LOGIN", 5L}));
            when(repository.countByEventCategory(eq(tenantId), any(Instant.class))).thenReturn(List.of());
            when(repository.countByOutcome(eq(tenantId), any(Instant.class))).thenReturn(List.of());
            when(repository.countBySeverity(eq(tenantId), any(Instant.class))).thenReturn(List.of());
            when(repository.countByServiceName(eq(tenantId), any(Instant.class))).thenReturn(List.of());
            when(repository.countByDay(eq(tenantId), any(Instant.class))).thenReturn(List.of());

            // Act
            AuditStatsDTO stats = auditService.getStats(tenantId, 30);

            // Assert
            assertThat(stats.eventsByType()).hasSize(1);
            assertThat(stats.eventsByType()).containsEntry("USER_LOGIN", 5L);
            assertThat(stats.eventsByType()).doesNotContainKey(null);
        }
    }

    @Nested
    @DisplayName("getUserActivity")
    class GetUserActivity {

        @Test
        @DisplayName("getUserActivity_withValidUserId_shouldReturnSortedEvents")
        void getUserActivity_withValidUserId_shouldReturnSortedEvents() {
            // Arrange
            UUID userId = UUID.randomUUID();
            int limit = 50;
            Page<AuditEventEntity> page = new PageImpl<>(List.of(sampleEntity));

            when(repository.findByUserId(eq(userId), any(Pageable.class))).thenReturn(page);
            when(mapper.toDTOList(page.getContent())).thenReturn(List.of(sampleDTO));

            // Act
            List<AuditEventDTO> result = auditService.getUserActivity(userId, limit);

            // Assert
            assertThat(result).hasSize(1);
            verify(repository).findByUserId(eq(userId), any(Pageable.class));
        }

        @Test
        @DisplayName("getUserActivity_withLimitAbove100_shouldCapAt100")
        void getUserActivity_withLimitAbove100_shouldCapAt100() {
            // Arrange
            UUID userId = UUID.randomUUID();
            ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
            Page<AuditEventEntity> page = new PageImpl<>(List.of());

            when(repository.findByUserId(eq(userId), pageableCaptor.capture())).thenReturn(page);
            when(mapper.toDTOList(anyList())).thenReturn(List.of());

            // Act
            auditService.getUserActivity(userId, 500);

            // Assert
            assertThat(pageableCaptor.getValue().getPageSize()).isEqualTo(100);
        }

        @ParameterizedTest
        @ValueSource(ints = {1, 10, 50, 100})
        @DisplayName("getUserActivity_withVariousLimits_shouldRespectLimit")
        void getUserActivity_withVariousLimits_shouldRespectLimit(int limit) {
            // Arrange
            UUID userId = UUID.randomUUID();
            ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
            Page<AuditEventEntity> page = new PageImpl<>(List.of());

            when(repository.findByUserId(eq(userId), pageableCaptor.capture())).thenReturn(page);
            when(mapper.toDTOList(anyList())).thenReturn(List.of());

            // Act
            auditService.getUserActivity(userId, limit);

            // Assert
            assertThat(pageableCaptor.getValue().getPageSize()).isEqualTo(limit);
        }
    }

    @Nested
    @DisplayName("getResourceHistory")
    class GetResourceHistory {

        @Test
        @DisplayName("getResourceHistory_withValidParams_shouldReturnFilteredEvents")
        void getResourceHistory_withValidParams_shouldReturnFilteredEvents() {
            // Arrange
            String tenantId = "tenant-1";
            String resourceType = "USER";
            String resourceId = "user-123";
            int limit = 50;
            Page<AuditEventEntity> page = new PageImpl<>(List.of(sampleEntity));

            when(repository.findByTenantIdAndResourceTypeAndResourceId(
                    eq(tenantId), eq(resourceType), eq(resourceId), any(Pageable.class)))
                    .thenReturn(page);
            when(mapper.toDTOList(page.getContent())).thenReturn(List.of(sampleDTO));

            // Act
            List<AuditEventDTO> result = auditService.getResourceHistory(tenantId, resourceType, resourceId, limit);

            // Assert
            assertThat(result).hasSize(1);
            verify(repository).findByTenantIdAndResourceTypeAndResourceId(
                    eq(tenantId), eq(resourceType), eq(resourceId), any(Pageable.class));
        }

        @Test
        @DisplayName("getResourceHistory_withLimitAbove100_shouldCapAt100")
        void getResourceHistory_withLimitAbove100_shouldCapAt100() {
            // Arrange
            ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
            Page<AuditEventEntity> page = new PageImpl<>(List.of());

            when(repository.findByTenantIdAndResourceTypeAndResourceId(
                    anyString(), anyString(), anyString(), pageableCaptor.capture()))
                    .thenReturn(page);
            when(mapper.toDTOList(anyList())).thenReturn(List.of());

            // Act
            auditService.getResourceHistory("t1", "USER", "u1", 200);

            // Assert
            assertThat(pageableCaptor.getValue().getPageSize()).isEqualTo(100);
        }
    }

    @Nested
    @DisplayName("purgeExpiredEvents")
    class PurgeExpiredEvents {

        @Test
        @DisplayName("purgeExpiredEvents_shouldCallRepositoryDeleteAndReturnCount")
        void purgeExpiredEvents_shouldCallRepositoryDeleteAndReturnCount() {
            // Arrange
            when(repository.deleteExpiredEvents(any(Instant.class))).thenReturn(42);

            // Act
            int result = auditService.purgeExpiredEvents();

            // Assert
            assertThat(result).isEqualTo(42);
            verify(repository).deleteExpiredEvents(any(Instant.class));
        }

        @Test
        @DisplayName("purgeExpiredEvents_whenNothingToDelete_shouldReturnZero")
        void purgeExpiredEvents_whenNothingToDelete_shouldReturnZero() {
            // Arrange
            when(repository.deleteExpiredEvents(any(Instant.class))).thenReturn(0);

            // Act
            int result = auditService.purgeExpiredEvents();

            // Assert
            assertThat(result).isZero();
        }
    }
}
