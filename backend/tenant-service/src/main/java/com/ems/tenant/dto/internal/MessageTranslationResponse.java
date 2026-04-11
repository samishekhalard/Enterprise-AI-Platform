package com.ems.tenant.dto.internal;

public record MessageTranslationResponse(
    String localeCode,
    String title,
    String detail
) {
}
