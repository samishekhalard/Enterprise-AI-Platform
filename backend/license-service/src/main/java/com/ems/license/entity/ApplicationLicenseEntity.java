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
 * Top-level entitlement extracted from the license file payload.
 * Exactly one per active license file. Defines platform-wide constraints:
 * product version range, max tenants, expiry, master feature set, and grace period.
 *
 * @see LicenseFileEntity
 * @see TenantLicenseEntity
 */
@Entity
@Table(name = "application_licenses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApplicationLicenseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /** The license file this entitlement was extracted from (1:1). */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "license_file_id", nullable = false, unique = true)
    private LicenseFileEntity licenseFile;

    /** Product identifier (must match "EMSIST"). */
    @Column(name = "product", nullable = false, length = 100)
    private String product;

    /** Minimum application version (semver, e.g., "1.0.0"). */
    @Column(name = "version_min", nullable = false, length = 20)
    private String versionMin;

    /** Maximum application version (semver, e.g., "2.99.99"). */
    @Column(name = "version_max", nullable = false, length = 20)
    private String versionMax;

    /** Optional hardware/instance binding identifier. */
    @Column(name = "instance_id")
    private String instanceId;

    /** Maximum number of tenants permitted by this license. */
    @Column(name = "max_tenants", nullable = false)
    private Integer maxTenants;

    /** Application-level license expiry date. */
    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    /** Master feature set as JSON array (e.g., ["basic_workflows","advanced_reports"]). */
    @Convert(converter = StringListJsonConverter.class)
    @Column(name = "features", nullable = false, columnDefinition = "jsonb")
    @Builder.Default
    private List<String> features = new ArrayList<>();

    /** Days of degraded operation after expiry (default 30). */
    @Column(name = "grace_period_days", nullable = false)
    @Builder.Default
    private Integer gracePeriodDays = 30;

    /** Features disabled during grace period as JSON array. */
    @Convert(converter = StringListJsonConverter.class)
    @Column(name = "degraded_features", nullable = false, columnDefinition = "jsonb")
    @Builder.Default
    private List<String> degradedFeatures = new ArrayList<>();

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

    /** Tenant-level entitlements carved from this application license. */
    @OneToMany(mappedBy = "applicationLicense", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<TenantLicenseEntity> tenantLicenses = new ArrayList<>();
}
