package com.ems.auth.dto.internal;

import java.util.UUID;

public record TenantRoutingRecord(
    UUID tenantId,
    String slug,
    String authDbName,
    String definitionsDbName,
    String defaultLocale,
    String baselineVersion,
    String status
) {
}
