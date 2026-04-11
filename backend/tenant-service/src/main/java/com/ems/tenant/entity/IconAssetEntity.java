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
    name = "tenant_icon_asset",
    indexes = {
        @Index(name = "idx_tenant_icon_asset_library", columnList = "icon_library_id"),
        @Index(name = "idx_tenant_icon_asset_key", columnList = "icon_library_id, icon_key")
    }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IconAssetEntity {

    @Id
    @Column(name = "icon_asset_id", length = 64)
    private String iconAssetId;

    @Column(name = "icon_library_id", nullable = false, length = 64)
    private String iconLibraryId;

    @Column(name = "icon_key", nullable = false, length = 128)
    private String iconKey;

    @Column(name = "display_name", nullable = false, length = 255)
    private String displayName;

    @Column(name = "svg_content", nullable = false, columnDefinition = "TEXT")
    private String svgContent;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "tags_json", columnDefinition = "jsonb")
    private String tagsJson;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void prePersist() {
        if (iconAssetId == null || iconAssetId.isBlank()) {
            iconAssetId = "icon_" + UUID.randomUUID();
        }
        if (tagsJson == null || tagsJson.isBlank()) {
            tagsJson = "[]";
        }
    }
}
