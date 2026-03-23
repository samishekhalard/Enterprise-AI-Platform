package com.ems.user.entity;

import com.ems.common.enums.DeviceTrustLevel;
import com.ems.common.enums.DeviceType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "user_devices",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "fingerprint"}),
    indexes = {
        @Index(name = "idx_devices_user", columnList = "user_id"),
        @Index(name = "idx_devices_tenant", columnList = "tenant_id"),
        @Index(name = "idx_devices_fingerprint", columnList = "fingerprint")
    })
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDeviceEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserProfileEntity user;

    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    // Device Identity
    @Column(nullable = false)
    private String fingerprint;

    @Column(name = "device_name")
    private String deviceName;

    @Enumerated(EnumType.STRING)
    @Column(name = "device_type", length = 20)
    private DeviceType deviceType;

    @Column(name = "os_name", length = 100)
    private String osName;

    @Column(name = "os_version", length = 50)
    private String osVersion;

    @Column(name = "browser_name", length = 100)
    private String browserName;

    @Column(name = "browser_version", length = 50)
    private String browserVersion;

    // Trust & Approval
    @Enumerated(EnumType.STRING)
    @Column(name = "trust_level", length = 20)
    @Builder.Default
    private DeviceTrustLevel trustLevel = DeviceTrustLevel.UNKNOWN;

    @Column(name = "is_approved")
    @Builder.Default
    private Boolean isApproved = false;

    @Column(name = "approved_by")
    private UUID approvedBy;

    @Column(name = "approved_at")
    private Instant approvedAt;

    // Activity
    @Column(name = "first_seen_at")
    private Instant firstSeenAt;

    @Column(name = "last_seen_at")
    private Instant lastSeenAt;

    @Column(name = "last_ip_address", length = 45)
    private String lastIpAddress;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "last_location", columnDefinition = "jsonb")
    private Map<String, Object> lastLocation;

    @Column(name = "login_count")
    @Builder.Default
    private Integer loginCount = 0;

    // Timestamps
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    public void prePersist() {
        if (firstSeenAt == null) {
            firstSeenAt = Instant.now();
        }
        lastSeenAt = Instant.now();
    }

    public void recordLogin(String ipAddress, Map<String, Object> location) {
        this.lastSeenAt = Instant.now();
        this.lastIpAddress = ipAddress;
        this.lastLocation = location;
        this.loginCount = (this.loginCount == null ? 0 : this.loginCount) + 1;
    }
}
