package com.ems.tenant.controller.dto;

import com.ems.tenant.service.branding.BrandingValidationResult;

import java.util.List;
import java.util.Map;

public record BrandingValidationResponse(
        boolean valid,
        List<String> violations,
        List<String> warnings,
        Map<String, Object> normalized
) {
    public static BrandingValidationResponse from(BrandingValidationResult result) {
        return new BrandingValidationResponse(
                result.valid(),
                result.violations(),
                result.warnings(),
                result.normalized()
        );
    }
}
