package com.ems.common.dto;

import com.ems.common.enums.TenantTier;
import com.ems.common.enums.TenantType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;

@Builder
public record CreateTenantRequest(
    @NotBlank String fullName,
    @NotBlank String shortName,
    String description,
    @NotNull TenantType tenantType,
    @NotNull TenantTier tier,
    String primaryDomain,
    @Email @NotBlank String adminEmail,
    LicenseAllocationDTO licenses
) {}
