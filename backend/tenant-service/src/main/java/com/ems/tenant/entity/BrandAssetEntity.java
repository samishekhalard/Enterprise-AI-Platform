package com.ems.tenant.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
    name = "tenant_brand_asset",
    indexes = {
        @Index(name = "idx_tenant_brand_asset_tenant", columnList = "tenant_id"),
        @Index(name = "idx_tenant_brand_asset_kind", columnList = "tenant_id, kind")
    }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BrandAssetEntity {

    @Id
    @Column(name = "asset_id", length = 64)
    private String assetId;

    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    @Enumerated(EnumType.STRING)
    @Column(name = "kind", nullable = false, length = 32)
    private BrandAssetKind kind;

    @Column(name = "display_name", nullable = false, length = 255)
    private String displayName;

    @Column(name = "storage_key", nullable = false, length = 512)
    private String storageKey;

    @Column(name = "delivery_url", nullable = false, length = 512)
    private String deliveryUrl;

    @Column(name = "mime_type", nullable = false, length = 100)
    private String mimeType;

    @Column(name = "checksum", nullable = false, length = 128)
    private String checksum;

    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    @Column(name = "width")
    private Integer width;

    @Column(name = "height")
    private Integer height;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "replaced_by_asset_id", length = 64)
    private String replacedByAssetId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void prePersist() {
        if (assetId == null || assetId.isBlank()) {
            assetId = "asset_" + UUID.randomUUID();
        }
    }
}
