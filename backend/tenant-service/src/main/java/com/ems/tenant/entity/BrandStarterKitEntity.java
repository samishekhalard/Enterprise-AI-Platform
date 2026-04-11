package com.ems.tenant.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "platform_brand_starter_kit")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BrandStarterKitEntity {

    @Id
    @Column(name = "starter_kit_id", length = 64)
    private String starterKitId;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "preview_thumbnail_asset_id", length = 64)
    private String previewThumbnailAssetId;

    @Column(name = "base_palette_pack_id", nullable = false, length = 64)
    private String basePalettePackId;

    @Column(name = "base_typography_pack_id", nullable = false, length = 64)
    private String baseTypographyPackId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "base_component_recipe_json", nullable = false, columnDefinition = "jsonb")
    private String baseComponentRecipeJson;

    @Column(name = "is_default", nullable = false)
    @Builder.Default
    private Boolean isDefault = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private BrandCatalogStatus status;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void prePersist() {
        if (starterKitId == null || starterKitId.isBlank()) {
            starterKitId = "starter_" + UUID.randomUUID();
        }
        if (baseComponentRecipeJson == null || baseComponentRecipeJson.isBlank()) {
            baseComponentRecipeJson = "{}";
        }
        if (status == null) {
            status = BrandCatalogStatus.ACTIVE;
        }
    }
}
