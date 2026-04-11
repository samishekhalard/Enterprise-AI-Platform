package com.ems.license.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

/**
 * Defines the maximum number of seats for a specific user tier within a tenant license.
 * Each tenant license has exactly four records -- one per {@link UserTier} value.
 *
 * <p>A {@code maxSeats} value of {@code -1} means unlimited seats for that tier.</p>
 *
 * @see TenantLicenseEntity
 * @see UserTier
 */
@Entity
@Table(name = "tier_seat_allocations",
    uniqueConstraints = @UniqueConstraint(
        name = "idx_tier_seat_allocations_license_tier",
        columnNames = {"tenant_license_id", "tier"}
    ))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TierSeatAllocationEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /** Reference to the parent tenant license. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_license_id", nullable = false)
    private TenantLicenseEntity tenantLicense;

    /** User tier: TENANT_ADMIN, POWER_USER, CONTRIBUTOR, VIEWER. */
    @Enumerated(EnumType.STRING)
    @Column(name = "tier", nullable = false, length = 20)
    private UserTier tier;

    /** Maximum seats for this tier. {@code -1} means unlimited. */
    @Column(name = "max_seats", nullable = false)
    private Integer maxSeats;

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

    /**
     * Returns whether this allocation allows unlimited seats.
     *
     * @return {@code true} if maxSeats is -1
     */
    public boolean isUnlimited() {
        return maxSeats != null && maxSeats == -1;
    }
}
