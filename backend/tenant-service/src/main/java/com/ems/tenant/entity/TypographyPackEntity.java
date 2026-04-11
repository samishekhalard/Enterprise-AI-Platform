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
@Table(name = "platform_typography_pack")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TypographyPackEntity {

    @Id
    @Column(name = "typography_pack_id", length = 64)
    private String typographyPackId;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "heading_font_family", nullable = false, columnDefinition = "TEXT")
    private String headingFontFamily;

    @Column(name = "body_font_family", nullable = false, columnDefinition = "TEXT")
    private String bodyFontFamily;

    @Column(name = "mono_font_family", nullable = false, columnDefinition = "TEXT")
    private String monoFontFamily;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "heading_weight_scale_json", nullable = false, columnDefinition = "jsonb")
    private String headingWeightScaleJson;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "body_weight_scale_json", nullable = false, columnDefinition = "jsonb")
    private String bodyWeightScaleJson;

    @Enumerated(EnumType.STRING)
    @Column(name = "font_source_type", nullable = false, length = 32)
    private TypographyPackSourceType fontSourceType;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "preload_manifest_json", nullable = false, columnDefinition = "jsonb")
    private String preloadManifestJson;

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
        if (typographyPackId == null || typographyPackId.isBlank()) {
            typographyPackId = "type_" + UUID.randomUUID();
        }
        if (headingWeightScaleJson == null || headingWeightScaleJson.isBlank()) {
            headingWeightScaleJson = "{}";
        }
        if (bodyWeightScaleJson == null || bodyWeightScaleJson.isBlank()) {
            bodyWeightScaleJson = "{}";
        }
        if (preloadManifestJson == null || preloadManifestJson.isBlank()) {
            preloadManifestJson = "[]";
        }
        if (fontSourceType == null) {
            fontSourceType = TypographyPackSourceType.SYSTEM;
        }
        if (status == null) {
            status = BrandCatalogStatus.ACTIVE;
        }
    }
}
