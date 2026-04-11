package com.ems.tenant.entity;

import com.ems.common.enums.MFAMethod;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.List;

@Entity
@Table(name = "tenant_mfa_config")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantMFAConfigEntity {

    @Id
    @Column(name = "tenant_id", length = 50)
    private String tenantId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "tenant_id")
    private TenantEntity tenant;

    @Column(nullable = false)
    @Builder.Default
    private boolean enabled = false;

    @Column(nullable = false)
    @Builder.Default
    private boolean required = false;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "allowed_methods")
    @Builder.Default
    private List<String> allowedMethods = List.of("totp", "email");

    @Enumerated(EnumType.STRING)
    @Column(name = "default_method", length = 20)
    @Builder.Default
    private MFAMethod defaultMethod = MFAMethod.TOTP;

    @Column(name = "grace_period_days")
    @Builder.Default
    private int gracePeriodDays = 7;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
