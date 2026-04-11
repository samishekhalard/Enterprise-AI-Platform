package com.ems.tenant.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.Instant;

@Entity
@Table(name = "tenant_brand_draft")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BrandDraftEntity {

    @Id
    @Column(name = "tenant_id", length = 50)
    private String tenantId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "draft_manifest_json", nullable = false, columnDefinition = "jsonb")
    private String draftManifestJson;

    @Column(name = "selected_starter_kit_id", length = 64)
    private String selectedStarterKitId;

    @Column(name = "selected_palette_pack_id", length = 64)
    private String selectedPalettePackId;

    @Column(name = "selected_typography_pack_id", length = 64)
    private String selectedTypographyPackId;

    @Column(name = "selected_icon_library_id", length = 64)
    private String selectedIconLibraryId;

    @Column(name = "updated_by", length = 100)
    private String updatedBy;

    @Column(name = "last_validated_at")
    private Instant lastValidatedAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void prePersist() {
        if (draftManifestJson == null || draftManifestJson.isBlank()) {
            draftManifestJson = "{}";
        }
    }
}
