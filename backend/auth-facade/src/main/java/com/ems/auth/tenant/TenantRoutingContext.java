package com.ems.auth.tenant;

import java.util.UUID;

public record TenantRoutingContext(
    UUID tenantId,
    String slug,
    String authDbName,
    String defaultLocale,
    String baselineVersion
) {

    public String tenantIdValue() {
        return tenantId != null ? tenantId.toString() : null;
    }
}
