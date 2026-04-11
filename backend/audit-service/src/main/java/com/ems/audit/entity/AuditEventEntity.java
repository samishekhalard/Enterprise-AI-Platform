package com.ems.audit.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "audit_events", indexes = {
    @Index(name = "idx_audit_tenant", columnList = "tenant_id"),
    @Index(name = "idx_audit_user", columnList = "user_id"),
    @Index(name = "idx_audit_event_type", columnList = "event_type"),
    @Index(name = "idx_audit_resource", columnList = "resource_type, resource_id"),
    @Index(name = "idx_audit_timestamp", columnList = "timestamp"),
    @Index(name = "idx_audit_service", columnList = "service_name")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditEventEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // Context
    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "username", length = 255)
    private String username;

    @Column(name = "session_id", length = 100)
    private String sessionId;

    // Event Details
    @Column(name = "event_type", nullable = false, length = 50)
    private String eventType;

    @Column(name = "event_category", length = 50)
    private String eventCategory;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String severity = "INFO";

    @Column(columnDefinition = "TEXT")
    private String message;

    // Resource being acted upon
    @Column(name = "resource_type", length = 100)
    private String resourceType;

    @Column(name = "resource_id", length = 255)
    private String resourceId;

    @Column(name = "resource_name", length = 255)
    private String resourceName;

    // Action details
    @Column(length = 20)
    private String action;

    @Column(length = 20)
    @Builder.Default
    private String outcome = "SUCCESS";

    @Column(name = "failure_reason", columnDefinition = "TEXT")
    private String failureReason;

    // Change tracking
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "old_values", columnDefinition = "jsonb")
    private Map<String, Object> oldValues;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "new_values", columnDefinition = "jsonb")
    private Map<String, Object> newValues;

    // Request metadata
    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(name = "request_id", length = 100)
    private String requestId;

    @Column(name = "correlation_id", length = 100)
    private String correlationId;

    // Source service
    @Column(name = "service_name", length = 100)
    private String serviceName;

    @Column(name = "service_version", length = 50)
    private String serviceVersion;

    // Additional context
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> metadata;

    // Timestamp
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant timestamp;

    // Retention
    @Column(name = "expires_at")
    private Instant expiresAt;
}
