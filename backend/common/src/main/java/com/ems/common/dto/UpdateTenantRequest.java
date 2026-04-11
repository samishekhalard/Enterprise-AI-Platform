package com.ems.common.dto;

import com.ems.common.enums.TenantTier;
import lombok.Builder;

@Builder
public record UpdateTenantRequest(
    String fullName,
    String shortName,
    String description,
    String logo,
    TenantTier tier
) {}
