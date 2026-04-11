package com.ems.notification.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "notification_templates", indexes = {
    @Index(name = "idx_template_tenant", columnList = "tenant_id"),
    @Index(name = "idx_template_code", columnList = "code"),
    @Index(name = "idx_template_type", columnList = "type")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationTemplateEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", length = 50)
    private String tenantId; // null for system templates

    @Column(nullable = false, length = 100)
    private String code; // e.g., WELCOME_EMAIL, PASSWORD_RESET

    @Column(nullable = false, length = 100)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    // Template type
    @Column(nullable = false, length = 20)
    private String type; // EMAIL, PUSH, IN_APP, SMS

    @Column(nullable = false, length = 50)
    private String category; // SYSTEM, MARKETING, TRANSACTIONAL, ALERT

    // Content
    @Column(name = "subject_template")
    private String subjectTemplate;

    @Column(name = "body_template", columnDefinition = "TEXT", nullable = false)
    private String bodyTemplate;

    @Column(name = "body_html_template", columnDefinition = "TEXT")
    private String bodyHtmlTemplate;

    // Variables
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "variables", columnDefinition = "jsonb")
    private List<String> variables; // List of variable names used in template

    // Status
    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "is_system")
    @Builder.Default
    private Boolean isSystem = false; // System templates cannot be deleted

    // Localization
    @Column(length = 10)
    @Builder.Default
    private String locale = "en";

    // Timestamps
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
