package com.ems.common.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Builder;

@Builder
public record SuspendTenantRequest(
    @NotBlank String reason,
    String notes,
    String estimatedReactivationDate
) {}
