package com.ems.common.dto;

import lombok.Builder;

@Builder
public record LicenseAllocationDTO(
    int powerUsers,
    int contributors,
    int viewers
) {}
