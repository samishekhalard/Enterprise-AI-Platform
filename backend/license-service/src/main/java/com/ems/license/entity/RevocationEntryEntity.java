package com.ems.license.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

/**
 * Record of a revoked license identifier, imported from an optional {@code .revoke} file.
 * Allows the vendor to invalidate specific license files without requiring internet connectivity.
 *
 * <p>Revocation entries are <strong>immutable</strong>: INSERT only, no UPDATE or DELETE.
 * This entity intentionally has no {@code @Version} or {@code updatedAt} fields.</p>
 *
 * @see LicenseFileEntity
 */
@Entity
@Table(name = "revocation_entries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RevocationEntryEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /** The license identifier that is no longer valid (matches license_files.license_id). */
    @Column(name = "revoked_license_id", nullable = false, unique = true, length = 100)
    private String revokedLicenseId;

    /** Human-readable reason for revocation. */
    @Column(name = "revocation_reason", columnDefinition = "TEXT")
    private String revocationReason;

    /** When the revocation was issued by the vendor. */
    @Column(name = "revoked_at", nullable = false)
    private Instant revokedAt;

    /** When this entry was imported into the system. */
    @Column(name = "imported_at", nullable = false)
    @Builder.Default
    private Instant importedAt = Instant.now();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
