package com.ems.tenant.controller.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = false)
public record BrandRollbackRequest(
        String targetBrandProfileId
) {
}
