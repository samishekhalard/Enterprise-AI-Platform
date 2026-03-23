package com.ems.user.entity;

import com.ems.common.enums.SessionStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "user_sessions", indexes = {
    @Index(name = "idx_sessions_user", columnList = "user_id"),
    @Index(name = "idx_sessions_tenant", columnList = "tenant_id"),
    @Index(name = "idx_sessions_expires", columnList = "expires_at"),
    @Index(name = "idx_sessions_status", columnList = "status")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSessionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    @Column(name = "device_id")
    private UUID deviceId;

    // Session Info
    @Column(name = "session_token", nullable = false, unique = true, length = 500)
    private String sessionToken;

    @Column(name = "refresh_token_id")
    private String refreshTokenId;

    // Location
    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> location;

    // Timestamps
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "last_activity")
    private Instant lastActivity;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    // Flags
    @Column(name = "is_remembered")
    @Builder.Default
    private Boolean isRemembered = false;

    @Column(name = "mfa_verified")
    @Builder.Default
    private Boolean mfaVerified = false;

    // Status
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private SessionStatus status = SessionStatus.ACTIVE;

    @Column(name = "revoked_at")
    private Instant revokedAt;

    @Column(name = "revoked_by")
    private UUID revokedBy;

    @Column(name = "revoke_reason")
    private String revokeReason;

    public boolean isActive() {
        return status == SessionStatus.ACTIVE &&
               expiresAt != null &&
               expiresAt.isAfter(Instant.now());
    }

    public void revoke(UUID revokedByUserId, String reason) {
        this.status = SessionStatus.REVOKED;
        this.revokedAt = Instant.now();
        this.revokedBy = revokedByUserId;
        this.revokeReason = reason;
    }

    public void updateActivity() {
        this.lastActivity = Instant.now();
    }
}
