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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
    name = "tenant_icon_library",
    indexes = {
        @Index(name = "idx_tenant_icon_library_tenant", columnList = "tenant_id")
    }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IconLibraryEntity {

    @Id
    @Column(name = "icon_library_id", length = 64)
    private String iconLibraryId;

    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "source_type", nullable = false, length = 32)
    private IconLibrarySourceType sourceType;

    @Column(name = "version", nullable = false)
    private Integer version;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "manifest_json", nullable = false, columnDefinition = "jsonb")
    private String manifestJson;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void prePersist() {
        if (iconLibraryId == null || iconLibraryId.isBlank()) {
            iconLibraryId = "iconlib_" + UUID.randomUUID();
        }
        if (version == null || version < 1) {
            version = 1;
        }
        if (manifestJson == null || manifestJson.isBlank()) {
            manifestJson = "{}";
        }
        if (sourceType == null) {
            sourceType = IconLibrarySourceType.TENANT_UPLOAD;
        }
    }
}
