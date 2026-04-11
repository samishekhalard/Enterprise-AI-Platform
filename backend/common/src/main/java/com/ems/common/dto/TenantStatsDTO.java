package com.ems.common.dto;

import lombok.Builder;

@Builder
public record TenantStatsDTO(
    long totalTenants,
    long activeTenants,
    long pendingTenants,
    long suspendedTenants,
    long decommissionedTenants,
    long totalUsers,
    double avgUtilizationPercent
) {}
