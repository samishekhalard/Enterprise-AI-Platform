package com.ems.tenant.controller.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = false)
public record BrandDraftUpdateRequest(
        String selectedStarterKitId,
        String selectedPalettePackId,
        String selectedTypographyPackId,
        String selectedIconLibraryId,
        Map<String, Object> manifestOverrides
) {
}
