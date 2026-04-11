package com.ems.notification.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "notification_preferences", indexes = {
    @Index(name = "idx_pref_tenant_user", columnList = "tenant_id, user_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationPreferenceEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    // Channel preferences
    @Column(name = "email_enabled")
    @Builder.Default
    private Boolean emailEnabled = true;

    @Column(name = "push_enabled")
    @Builder.Default
    private Boolean pushEnabled = true;

    @Column(name = "sms_enabled")
    @Builder.Default
    private Boolean smsEnabled = false;

    @Column(name = "in_app_enabled")
    @Builder.Default
    private Boolean inAppEnabled = true;

    // Category preferences
    @Column(name = "system_notifications")
    @Builder.Default
    private Boolean systemNotifications = true;

    @Column(name = "marketing_notifications")
    @Builder.Default
    private Boolean marketingNotifications = false;

    @Column(name = "transactional_notifications")
    @Builder.Default
    private Boolean transactionalNotifications = true;

    @Column(name = "alert_notifications")
    @Builder.Default
    private Boolean alertNotifications = true;

    // Quiet hours
    @Column(name = "quiet_hours_enabled")
    @Builder.Default
    private Boolean quietHoursEnabled = false;

    @Column(name = "quiet_hours_start", length = 5)
    private String quietHoursStart; // HH:mm format

    @Column(name = "quiet_hours_end", length = 5)
    private String quietHoursEnd; // HH:mm format

    @Column(length = 50)
    @Builder.Default
    private String timezone = "UTC";

    // Digest preferences
    @Column(name = "digest_enabled")
    @Builder.Default
    private Boolean digestEnabled = false;

    @Column(name = "digest_frequency", length = 20)
    @Builder.Default
    private String digestFrequency = "DAILY"; // DAILY, WEEKLY

    // Timestamps
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
