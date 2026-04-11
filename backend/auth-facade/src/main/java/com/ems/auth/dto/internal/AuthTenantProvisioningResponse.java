package com.ems.auth.dto.internal;

import java.util.UUID;

public record AuthTenantProvisioningResponse(
    UUID tenantId,
    String slug,
    String authDbName,
    String realm,
    boolean created
) {
}
