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
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "platform_palette_pack")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PalettePackEntity {

    @Id
    @Column(name = "palette_pack_id", length = 64)
    private String palettePackId;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "primary_color", nullable = false, length = 20)
    private String primary;

    @Column(name = "secondary_color", nullable = false, length = 20)
    private String secondary;

    @Column(name = "accent_color", nullable = false, length = 20)
    private String accent;

    @Column(name = "surface_color", nullable = false, length = 20)
    private String surface;

    @Column(name = "surface_raised_color", nullable = false, length = 20)
    private String surfaceRaised;

    @Column(name = "text_color", nullable = false, length = 20)
    private String text;

    @Column(name = "text_muted_color", nullable = false, length = 20)
    private String textMuted;

    @Column(name = "border_color", nullable = false, length = 20)
    private String border;

    @Column(name = "success_color", nullable = false, length = 20)
    private String success;

    @Column(name = "warning_color", nullable = false, length = 20)
    private String warning;

    @Column(name = "error_color", nullable = false, length = 20)
    private String error;

    @Column(name = "info_color", nullable = false, length = 20)
    private String info;

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
        if (palettePackId == null || palettePackId.isBlank()) {
            palettePackId = "palette_" + UUID.randomUUID();
        }
        if (status == null) {
            status = BrandCatalogStatus.ACTIVE;
        }
    }
}
