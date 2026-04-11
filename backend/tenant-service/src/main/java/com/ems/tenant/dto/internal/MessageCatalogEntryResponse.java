package com.ems.tenant.dto.internal;

import java.util.List;

public record MessageCatalogEntryResponse(
    String code,
    String type,
    String category,
    Integer httpStatus,
    String defaultTitle,
    String defaultDetail,
    List<MessageTranslationResponse> translations
) {
}
