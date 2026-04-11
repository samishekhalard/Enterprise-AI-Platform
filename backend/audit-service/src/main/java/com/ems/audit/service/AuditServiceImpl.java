package com.ems.audit.service;

import com.ems.audit.dto.*;
import com.ems.audit.entity.AuditEventEntity;
import com.ems.audit.mapper.AuditEventMapper;
import com.ems.audit.repository.AuditEventRepository;
import com.ems.audit.repository.AuditEventSpecifications;
import com.ems.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AuditServiceImpl implements AuditService {

    private final AuditEventRepository repository;
    private final AuditEventMapper mapper;

    private static final int DEFAULT_RETENTION_DAYS = 365;

    @Override
    @Transactional
    public AuditEventDTO createEvent(CreateAuditEventRequest request) {
        log.debug("Creating audit event: type={}, tenant={}", request.eventType(), request.tenantId());

        AuditEventEntity entity = mapper.toEntity(request);

        // Set defaults
        if (entity.getSeverity() == null) {
            entity.setSeverity("INFO");
        }
        if (entity.getOutcome() == null) {
            entity.setOutcome("SUCCESS");
        }

        // Set expiration
        int retentionDays = request.retentionDays() != null ? request.retentionDays() : DEFAULT_RETENTION_DAYS;
        entity.setExpiresAt(Instant.now().plus(retentionDays, ChronoUnit.DAYS));

        AuditEventEntity saved = repository.save(entity);
        log.info("Created audit event: id={}, type={}", saved.getId(), saved.getEventType());

        return mapper.toDTO(saved);
    }

    @Override
    public AuditEventDTO getEvent(UUID eventId) {
        AuditEventEntity entity = repository.findById(eventId)
            .orElseThrow(() -> new ResourceNotFoundException("AuditEvent", eventId.toString()));
        return mapper.toDTO(entity);
    }

    @Override
    public AuditSearchResponse searchEvents(AuditSearchRequest request) {
        log.debug("Searching audit events: tenant={}, types={}", request.tenantId(), request.eventTypes());

        Sort.Direction direction = "ASC".equalsIgnoreCase(request.sortDirection())
            ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(request.page(), request.size(), Sort.by(direction, request.sortBy()));

        Page<AuditEventEntity> page = repository.findAll(
            AuditEventSpecifications.fromSearchRequest(request),
            pageable
        );

        return AuditSearchResponse.builder()
            .content(mapper.toDTOList(page.getContent()))
            .page(page.getNumber())
            .size(page.getSize())
            .totalElements(page.getTotalElements())
            .totalPages(page.getTotalPages())
            .hasNext(page.hasNext())
            .hasPrevious(page.hasPrevious())
            .build();
    }

    @Override
    public List<AuditEventDTO> getEventsByCorrelationId(String correlationId) {
        List<AuditEventEntity> events = repository.findByCorrelationId(correlationId);
        return mapper.toDTOList(events);
    }

    @Override
    public AuditStatsDTO getStats(String tenantId, int days) {
        log.debug("Getting audit stats for tenant={}, days={}", tenantId, days);

        Instant since = Instant.now().minus(days, ChronoUnit.DAYS);

        long totalEvents = repository.countByTenantIdAndTimestampAfter(tenantId, since);

        Map<String, Long> eventsByType = aggregateToMap(repository.countByEventType(tenantId, since));
        Map<String, Long> eventsByCategory = aggregateToMap(repository.countByEventCategory(tenantId, since));
        Map<String, Long> eventsByOutcome = aggregateToMap(repository.countByOutcome(tenantId, since));
        Map<String, Long> eventsBySeverity = aggregateToMap(repository.countBySeverity(tenantId, since));
        Map<String, Long> eventsByService = aggregateToMap(repository.countByServiceName(tenantId, since));
        Map<String, Long> eventsByDay = aggregateDaysToMap(repository.countByDay(tenantId, since));

        return AuditStatsDTO.builder()
            .tenantId(tenantId)
            .totalEvents(totalEvents)
            .eventsByType(eventsByType)
            .eventsByCategory(eventsByCategory)
            .eventsByOutcome(eventsByOutcome)
            .eventsBySeverity(eventsBySeverity)
            .eventsByService(eventsByService)
            .eventsByDay(eventsByDay)
            .build();
    }

    @Override
    public List<AuditEventDTO> getUserActivity(UUID userId, int limit) {
        Pageable pageable = PageRequest.of(0, Math.min(limit, 100), Sort.by(Sort.Direction.DESC, "timestamp"));
        Page<AuditEventEntity> page = repository.findByUserId(userId, pageable);
        return mapper.toDTOList(page.getContent());
    }

    @Override
    public List<AuditEventDTO> getResourceHistory(String tenantId, String resourceType, String resourceId, int limit) {
        Pageable pageable = PageRequest.of(0, Math.min(limit, 100), Sort.by(Sort.Direction.DESC, "timestamp"));
        Page<AuditEventEntity> page = repository.findByTenantIdAndResourceTypeAndResourceId(
            tenantId, resourceType, resourceId, pageable);
        return mapper.toDTOList(page.getContent());
    }

    @Override
    @Transactional
    public int purgeExpiredEvents() {
        log.info("Purging expired audit events");
        int deleted = repository.deleteExpiredEvents(Instant.now());
        log.info("Purged {} expired audit events", deleted);
        return deleted;
    }

    private Map<String, Long> aggregateToMap(List<Object[]> results) {
        return results.stream()
            .filter(row -> row[0] != null)
            .collect(Collectors.toMap(
                row -> row[0].toString(),
                row -> ((Number) row[1]).longValue(),
                (a, b) -> a,
                LinkedHashMap::new
            ));
    }

    private Map<String, Long> aggregateDaysToMap(List<Object[]> results) {
        return results.stream()
            .filter(row -> row[0] != null)
            .collect(Collectors.toMap(
                row -> row[0].toString(),
                row -> ((Number) row[1]).longValue(),
                (a, b) -> a,
                LinkedHashMap::new
            ));
    }
}
