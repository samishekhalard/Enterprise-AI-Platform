package com.ems.audit.controller;

import com.ems.audit.dto.*;
import com.ems.audit.service.AuditService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/audit")
@RequiredArgsConstructor
@Tag(name = "Audit Events", description = "Audit logging and retrieval APIs")
public class AuditController {

    private final AuditService auditService;

    @PostMapping("/events")
    @Operation(summary = "Create audit event", description = "Record a new audit event")
    public ResponseEntity<AuditEventDTO> createEvent(@Valid @RequestBody CreateAuditEventRequest request) {
        AuditEventDTO event = auditService.createEvent(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(event);
    }

    @GetMapping("/events/{eventId}")
    @Operation(summary = "Get audit event", description = "Retrieve a specific audit event by ID")
    public ResponseEntity<AuditEventDTO> getEvent(@PathVariable UUID eventId) {
        AuditEventDTO event = auditService.getEvent(eventId);
        return ResponseEntity.ok(event);
    }

    @PostMapping("/events/search")
    @Operation(summary = "Search audit events", description = "Search and filter audit events with pagination")
    public ResponseEntity<AuditSearchResponse> searchEvents(@RequestBody AuditSearchRequest request) {
        AuditSearchResponse response = auditService.searchEvents(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/events")
    @Operation(summary = "List audit events", description = "List audit events with optional filters")
    public ResponseEntity<AuditSearchResponse> listEvents(
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestParam(required = false) UUID userId,
            @RequestParam(required = false) List<String> eventTypes,
            @RequestParam(required = false) String resourceType,
            @RequestParam(required = false) String resourceId,
            @RequestParam(required = false) String outcome,
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {

        AuditSearchRequest request = new AuditSearchRequest(
            tenantId, userId, eventTypes, null, resourceType, resourceId,
            null, outcome, null, null, from, to, null, page, size, "timestamp", "DESC"
        );

        AuditSearchResponse response = auditService.searchEvents(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/correlation/{correlationId}")
    @Operation(summary = "Get events by correlation ID", description = "Retrieve all events linked by a correlation ID")
    public ResponseEntity<List<AuditEventDTO>> getByCorrelationId(@PathVariable String correlationId) {
        List<AuditEventDTO> events = auditService.getEventsByCorrelationId(correlationId);
        return ResponseEntity.ok(events);
    }

    @GetMapping("/users/{userId}/activity")
    @Operation(summary = "Get user activity", description = "Retrieve recent activity for a specific user")
    public ResponseEntity<List<AuditEventDTO>> getUserActivity(
            @PathVariable UUID userId,
            @RequestParam(defaultValue = "50") int limit) {
        List<AuditEventDTO> events = auditService.getUserActivity(userId, limit);
        return ResponseEntity.ok(events);
    }

    @GetMapping("/resources/{resourceType}/{resourceId}/history")
    @Operation(summary = "Get resource history", description = "Retrieve audit history for a specific resource")
    public ResponseEntity<List<AuditEventDTO>> getResourceHistory(
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String resourceType,
            @PathVariable String resourceId,
            @RequestParam(defaultValue = "50") int limit) {
        List<AuditEventDTO> events = auditService.getResourceHistory(tenantId, resourceType, resourceId, limit);
        return ResponseEntity.ok(events);
    }

    @GetMapping("/stats")
    @Operation(summary = "Get audit statistics", description = "Get aggregated statistics for audit events")
    public ResponseEntity<AuditStatsDTO> getStats(
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestParam(defaultValue = "30") int days) {
        AuditStatsDTO stats = auditService.getStats(tenantId, days);
        return ResponseEntity.ok(stats);
    }

    @DeleteMapping("/events/expired")
    @Operation(summary = "Purge expired events", description = "Delete events that have exceeded their retention period")
    public ResponseEntity<Void> purgeExpired() {
        int deleted = auditService.purgeExpiredEvents();
        return ResponseEntity.noContent().build();
    }
}
