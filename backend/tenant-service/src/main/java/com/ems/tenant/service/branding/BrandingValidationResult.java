package com.ems.tenant.service.branding;

import java.util.List;
import java.util.Map;

public record BrandingValidationResult(
        boolean valid,
        List<String> violations,
        List<String> warnings,
        Map<String, Object> normalized
) {
}
