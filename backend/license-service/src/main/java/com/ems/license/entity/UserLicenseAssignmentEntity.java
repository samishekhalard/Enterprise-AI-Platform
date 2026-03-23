package com.ems.license.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

/**
 * Assignment of an individual user to a capability tier within their tenant.
 * This is the only licensing entity actively managed at runtime (all others are
 * imported from the license file).
 *
 * <p>Each user holds at most one seat tier per tenant, enforced by the unique
 * constraint on {@code (user_id, tenant_id)}.</p>
 *
 * <p>Tier assignment drives RBAC role synchronization with auth-facade.</p>
 *
 * @see TenantLicenseEntity
 * @see UserTier
 */
@Entity
@Table(name = "user_license_assignments",
    uniqueConstraints = @UniqueConstraint(
        name = "idx_user_license_assignments_user_tenant",
        columnNames = {"user_id", "tenant_id"}
    ))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserLicenseAssignmentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /** Reference to the parent tenant license. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_license_id", nullable = false)
    private TenantLicenseEntity tenantLicense;

    /** The user holding this seat (cross-service ref to user-service, no DB-level FK). */
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    /** Tenant context (denormalized from tenant_license for query efficiency). */
    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    /** Assigned capability tier: TENANT_ADMIN, POWER_USER, CONTRIBUTOR, VIEWER. */
    @Enumerated(EnumType.STRING)
    @Column(name = "tier", nullable = false, length = 20)
    private UserTier tier;

    /** When the seat was allocated. */
    @Column(name = "assigned_at", nullable = false)
    @Builder.Default
    private Instant assignedAt = Instant.now();

    /** Administrator who allocated the seat (cross-service ref to user-service). */
    @Column(name = "assigned_by", nullable = false)
    private UUID assignedBy;

    /** Optimistic locking version. */
    @Version
    @Column(name = "version")
    private Long version;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
