package com.ems.audit.service;

import com.ems.audit.dto.*;

import java.util.List;
import java.util.UUID;

public interface AuditService {

    AuditEventDTO createEvent(CreateAuditEventRequest request);

    AuditEventDTO getEvent(UUID eventId);

    AuditSearchResponse searchEvents(AuditSearchRequest request);

    List<AuditEventDTO> getEventsByCorrelationId(String correlationId);

    AuditStatsDTO getStats(String tenantId, int days);

    List<AuditEventDTO> getUserActivity(UUID userId, int limit);

    List<AuditEventDTO> getResourceHistory(String tenantId, String resourceType, String resourceId, int limit);

    int purgeExpiredEvents();
}
