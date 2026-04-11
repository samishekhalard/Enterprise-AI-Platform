package com.ems.tenant.dto.internal;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record MessageTranslationRequest(
    @NotBlank @Size(max = 10) String localeCode,
    @NotBlank @Size(max = 255) String title,
    String detail
) {
}
