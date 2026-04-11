package com.ems.common.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Builder;

@Builder
public record DecommissionTenantRequest(
    @NotBlank String reason,
    String notes,
    boolean confirmDataDeletion
) {}
