package com.ems.user.entity;

import com.ems.common.enums.UserStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "user_profiles", indexes = {
    @Index(name = "idx_user_profiles_tenant", columnList = "tenant_id"),
    @Index(name = "idx_user_profiles_email", columnList = "email"),
    @Index(name = "idx_user_profiles_keycloak", columnList = "keycloak_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "keycloak_id", nullable = false, unique = true)
    private UUID keycloakId;

    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    // Identity (synced from Keycloak)
    @Column(nullable = false)
    private String email;

    @Column(name = "email_verified")
    private Boolean emailVerified;

    @Column(name = "first_name", length = 100)
    private String firstName;

    @Column(name = "last_name", length = 100)
    private String lastName;

    // Extended Profile (our data)
    @Column(name = "display_name")
    private String displayName;

    @Column(name = "job_title", length = 100)
    private String jobTitle;

    @Column(length = 100)
    private String department;

    @Column(length = 50)
    private String phone;

    @Column(length = 50)
    private String mobile;

    @Column(name = "office_location")
    private String officeLocation;

    @Column(name = "employee_id", length = 50)
    private String employeeId;

    @Column(name = "employee_type", length = 50)
    @Builder.Default
    private String employeeType = "FULL_TIME";

    @Column(name = "manager_id")
    private UUID managerId;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Column(length = 50)
    @Builder.Default
    private String timezone = "UTC";

    @Column(length = 10)
    @Builder.Default
    private String locale = "en";

    // Security info
    @Column(name = "mfa_enabled")
    @Builder.Default
    private Boolean mfaEnabled = false;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "mfa_methods", columnDefinition = "jsonb")
    @Builder.Default
    private List<String> mfaMethods = new ArrayList<>();

    @Column(name = "password_last_changed")
    private Instant passwordLastChanged;

    @Column(name = "password_expires_at")
    private Instant passwordExpiresAt;

    @Column(name = "account_locked")
    @Builder.Default
    private Boolean accountLocked = false;

    @Column(name = "lockout_end")
    private Instant lockoutEnd;

    @Column(name = "failed_login_attempts")
    @Builder.Default
    private Integer failedLoginAttempts = 0;

    @Column(name = "last_login_at")
    private Instant lastLoginAt;

    @Column(name = "last_login_ip", length = 45)
    private String lastLoginIp;

    // Status
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private UserStatus status = UserStatus.ACTIVE;

    // Relationships
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<UserDeviceEntity> devices = new ArrayList<>();

    // Timestamps
    @Version
    @Column(name = "version")
    private Long version;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    // Helper methods
    public String getFullName() {
        if (firstName == null && lastName == null) {
            return displayName != null ? displayName : email;
        }
        return String.format("%s %s",
            firstName != null ? firstName : "",
            lastName != null ? lastName : "").trim();
    }

    public void addDevice(UserDeviceEntity device) {
        devices.add(device);
        device.setUser(this);
    }

    public void removeDevice(UserDeviceEntity device) {
        devices.remove(device);
        device.setUser(null);
    }
}
