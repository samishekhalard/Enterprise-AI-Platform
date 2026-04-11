package com.ems.tenant.dto.internal;

import com.ems.common.enums.TenantStatus;

import java.util.UUID;

public record TenantRoutingResponse(
    UUID tenantId,
    String slug,
    String authDbName,
    String definitionsDbName,
    String defaultLocale,
    String baselineVersion,
    TenantStatus status
) {
}
