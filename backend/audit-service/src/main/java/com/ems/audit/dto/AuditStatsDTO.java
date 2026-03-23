package com.ems.audit.dto;

import lombok.Builder;

import java.util.Map;

@Builder
public record AuditStatsDTO(
    String tenantId,
    long totalEvents,
    Map<String, Long> eventsByType,
    Map<String, Long> eventsByCategory,
    Map<String, Long> eventsByOutcome,
    Map<String, Long> eventsBySeverity,
    Map<String, Long> eventsByService,
    Map<String, Long> eventsByDay
) {}
