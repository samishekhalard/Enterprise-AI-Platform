package com.ems.tenant.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
    name = "tenant_brand_profile",
    indexes = {
        @Index(name = "idx_tenant_brand_profile_tenant", columnList = "tenant_id"),
        @Index(name = "idx_tenant_brand_profile_version", columnList = "tenant_id, profile_version")
    }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BrandProfileEntity {

    @Id
    @Column(name = "brand_profile_id", length = 64)
    private String brandProfileId;

    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    @Column(name = "profile_version", nullable = false)
    private Integer profileVersion;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "manifest_json", nullable = false, columnDefinition = "jsonb")
    private String manifestJson;

    @Column(name = "published_at", nullable = false)
    private Instant publishedAt;

    @Column(name = "published_by", length = 100)
    private String publishedBy;

    @Column(name = "rolled_back_from_profile_id", length = 64)
    private String rolledBackFromProfileId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void prePersist() {
        if (brandProfileId == null || brandProfileId.isBlank()) {
            brandProfileId = "bp_" + UUID.randomUUID();
        }
        if (profileVersion == null || profileVersion < 1) {
            profileVersion = 1;
        }
        if (publishedAt == null) {
            publishedAt = Instant.now();
        }
        if (manifestJson == null || manifestJson.isBlank()) {
            manifestJson = "{}";
        }
    }
}
