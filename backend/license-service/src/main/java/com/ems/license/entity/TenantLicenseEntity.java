package com.ems.license.entity;

import com.ems.license.entity.converter.StringListJsonConverter;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Per-tenant entitlement carved from the application license.
 * Each licensed tenant has one tenant license record per active license file.
 * Specifies which features are enabled for that tenant and its expiry date.
 *
 * <p>The combination of {@code applicationLicenseId} and {@code tenantId} is unique,
 * enforced by {@code idx_tenant_licenses_app_tenant}.</p>
 *
 * @see ApplicationLicenseEntity
 * @see TierSeatAllocationEntity
 * @see UserLicenseAssignmentEntity
 */
@Entity
@Table(name = "tenant_licenses",
    uniqueConstraints = @UniqueConstraint(
        name = "idx_tenant_licenses_app_tenant",
        columnNames = {"application_license_id", "tenant_id"}
    ))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TenantLicenseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /** Reference to the parent application license. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_license_id", nullable = false)
    private ApplicationLicenseEntity applicationLicense;

    /** Tenant identifier (cross-service ref to tenant-service, no DB-level FK). */
    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    /** Human-readable tenant name from the license file. */
    @Column(name = "display_name", nullable = false)
    private String displayName;

    /** Tenant-specific expiry date (must be <= application expiry, enforced at app level). */
    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    /** Features enabled for this tenant as JSON array (subset of application features). */
    @Convert(converter = StringListJsonConverter.class)
    @Column(name = "features", nullable = false, columnDefinition = "jsonb")
    @Builder.Default
    private List<String> features = new ArrayList<>();

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

    /** Seat allocations per tier for this tenant license (exactly 4: one per UserTier). */
    @OneToMany(mappedBy = "tenantLicense", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<TierSeatAllocationEntity> seatAllocations = new ArrayList<>();

    /** Individual user seat assignments within this tenant. */
    @OneToMany(mappedBy = "tenantLicense", cascade = CascadeType.ALL)
    @Builder.Default
    private List<UserLicenseAssignmentEntity> assignments = new ArrayList<>();
}
