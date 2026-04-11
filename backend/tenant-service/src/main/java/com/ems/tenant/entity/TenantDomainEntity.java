package com.ems.tenant.entity;

import com.ems.common.enums.SSLStatus;
import com.ems.common.enums.VerificationMethod;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "tenant_domains")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantDomainEntity {

    @Id
    @Column(length = 50)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private TenantEntity tenant;

    @Column(unique = true, nullable = false)
    private String domain;

    @Column(name = "is_primary", nullable = false)
    private boolean isPrimary;

    @Column(name = "is_verified", nullable = false)
    private boolean isVerified;

    @Column(name = "verification_token")
    private String verificationToken;

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_method", length = 20)
    private VerificationMethod verificationMethod;

    @Enumerated(EnumType.STRING)
    @Column(name = "ssl_status", length = 20)
    private SSLStatus sslStatus;

    @Column(name = "ssl_certificate_id", length = 100)
    private String sslCertificateId;

    @Column(name = "ssl_expires_at")
    private Instant sslExpiresAt;

    @Column(name = "verified_at")
    private Instant verifiedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    public void prePersist() {
        if (id == null) {
            id = "domain-" + UUID.randomUUID().toString().substring(0, 8);
        }
        if (sslStatus == null) {
            sslStatus = SSLStatus.PENDING;
        }
        if (verificationMethod == null) {
            verificationMethod = VerificationMethod.DNS_TXT;
        }
    }
}
