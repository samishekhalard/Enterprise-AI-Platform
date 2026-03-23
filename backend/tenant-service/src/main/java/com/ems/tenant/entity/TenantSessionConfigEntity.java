package com.ems.tenant.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "tenant_session_config")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantSessionConfigEntity {

    @Id
    @Column(name = "tenant_id", length = 50)
    private String tenantId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "tenant_id")
    private TenantEntity tenant;

    @Column(name = "access_token_lifetime")
    @Builder.Default
    private int accessTokenLifetime = 5; // minutes

    @Column(name = "refresh_token_lifetime")
    @Builder.Default
    private int refreshTokenLifetime = 1440; // 24 hours in minutes

    @Column(name = "idle_timeout")
    @Builder.Default
    private int idleTimeout = 30; // minutes

    @Column(name = "absolute_timeout")
    @Builder.Default
    private int absoluteTimeout = 480; // 8 hours in minutes

    @Column(name = "max_concurrent_sessions")
    @Builder.Default
    private int maxConcurrentSessions = 5;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
