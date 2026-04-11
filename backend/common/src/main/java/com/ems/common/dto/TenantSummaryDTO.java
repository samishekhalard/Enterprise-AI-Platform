package com.ems.common.dto;

import com.ems.common.enums.TenantStatus;
import com.ems.common.enums.TenantTier;
import com.ems.common.enums.TenantType;
import lombok.Builder;

import java.time.Instant;

@Builder
public record TenantSummaryDTO(
    String id,
    String uuid,
    String fullName,
    String shortName,
    String description,
    String logo,
    TenantType tenantType,
    TenantTier tier,
    TenantStatus status,
    boolean isProtected,
    String primaryDomain,
    int domainsCount,
    int usersCount,
    Instant createdAt,
    Instant updatedAt,
    Instant lastActivityAt,
    String suspensionReason,
    String suspensionNotes,
    Instant suspendedAt,
    Instant estimatedReactivationDate
) {}
