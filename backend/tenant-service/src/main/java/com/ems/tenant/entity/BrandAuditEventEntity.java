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
    name = "tenant_brand_audit_event",
    indexes = {
        @Index(name = "idx_tenant_brand_audit_tenant", columnList = "tenant_id"),
        @Index(name = "idx_tenant_brand_audit_type", columnList = "tenant_id, event_type")
    }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BrandAuditEventEntity {

    @Id
    @Column(name = "event_id", length = 64)
    private String eventId;

    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 32)
    private BrandAuditEventType eventType;

    @Column(name = "actor_id", length = 100)
    private String actorId;

    @Column(name = "target_brand_profile_id", length = 64)
    private String targetBrandProfileId;

    @Column(name = "target_asset_id", length = 64)
    private String targetAssetId;

    @Column(name = "target_icon_library_id", length = 64)
    private String targetIconLibraryId;

    @Column(name = "summary", nullable = false, length = 512)
    private String summary;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "details_json", columnDefinition = "jsonb")
    private String detailsJson;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void prePersist() {
        if (eventId == null || eventId.isBlank()) {
            eventId = "baudit_" + UUID.randomUUID();
        }
        if (detailsJson == null || detailsJson.isBlank()) {
            detailsJson = "{}";
        }
    }
}
