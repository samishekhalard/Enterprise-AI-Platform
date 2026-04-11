package com.ems.tenant.entity;

import com.ems.common.enums.TenantStatus;
import com.ems.common.enums.TenantTier;
import com.ems.common.enums.TenantType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "tenants")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantEntity {

    @Id
    @Column(length = 50)
    private String id;

    @Column(unique = true, nullable = false)
    private UUID uuid;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "short_name", nullable = false, length = 100)
    private String shortName;

    @Column(unique = true, nullable = false, length = 100)
    private String slug;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "tenant_type", nullable = false, length = 20)
    private TenantType tenantType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TenantTier tier;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TenantStatus status;

    @Column(name = "keycloak_realm", length = 100)
    private String keycloakRealm;

    @Column(name = "auth_db_name", length = 255)
    private String authDbName;

    @Column(name = "definitions_db_name", length = 255)
    private String definitionsDbName;

    @Column(name = "identity_endpoint", length = 512)
    private String identityEndpoint;

    @Column(name = "baseline_version", length = 50)
    private String baselineVersion;

    @Column(name = "default_locale", nullable = false, length = 10)
    @Builder.Default
    private String defaultLocale = "en";

    @Column(name = "is_protected", nullable = false)
    @Builder.Default
    private Boolean isProtected = false;

    @Column(name = "suspension_reason", length = 50)
    private String suspensionReason;

    @Column(name = "suspension_notes", columnDefinition = "TEXT")
    private String suspensionNotes;

    @Column(name = "suspended_at")
    private Instant suspendedAt;

    @Column(name = "estimated_reactivation_date")
    private Instant estimatedReactivationDate;

    @Column(name = "decommissioned_at")
    private Instant decommissionedAt;

    @Column(name = "last_activity_at")
    private Instant lastActivityAt;

    @OneToMany(mappedBy = "tenant", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<TenantDomainEntity> domains = new ArrayList<>();

    @OneToMany(mappedBy = "tenant", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<TenantAuthProviderEntity> authProviders = new ArrayList<>();

    @OneToOne(mappedBy = "tenant", cascade = CascadeType.ALL, orphanRemoval = true)
    private TenantBrandingEntity branding;

    @OneToOne(mappedBy = "tenant", cascade = CascadeType.ALL, orphanRemoval = true)
    private TenantSessionConfigEntity sessionConfig;

    @OneToOne(mappedBy = "tenant", cascade = CascadeType.ALL, orphanRemoval = true)
    private TenantMFAConfigEntity mfaConfig;

    @Version
    @Column(name = "version")
    private Long version;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "created_by", length = 50)
    private String createdBy;

    @PrePersist
    public void prePersist() {
        if (id == null) {
            id = "tenant-" + UUID.randomUUID().toString().substring(0, 8);
        }
        if (uuid == null) {
            uuid = UUID.randomUUID();
        }
        if (status == null) {
            status = TenantStatus.PENDING;
        }
        if (defaultLocale == null || defaultLocale.isBlank()) {
            defaultLocale = "en";
        }
        if (keycloakRealm == null && slug != null) {
            keycloakRealm = "realm-" + slug;
        }
    }

    // Helper methods
    public String getPrimaryDomain() {
        return domains.stream()
            .filter(TenantDomainEntity::isPrimary)
            .findFirst()
            .map(TenantDomainEntity::getDomain)
            .orElse(null);
    }

    public int getDomainsCount() {
        return domains.size();
    }

    public void addDomain(TenantDomainEntity domain) {
        domains.add(domain);
        domain.setTenant(this);
    }

    public void removeDomain(TenantDomainEntity domain) {
        domains.remove(domain);
        domain.setTenant(null);
    }
}
