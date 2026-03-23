package com.ems.common.dto;

import lombok.Builder;

import java.util.List;

@Builder
public record TenantListResponse(
    List<TenantSummaryDTO> tenants,
    int total,
    int page,
    int limit
) {}
