package com.ems.tenant.dto.internal;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

public record MessageBatchRegistrationRequest(
    @NotBlank @Size(max = 20) String code,
    @NotBlank @Pattern(regexp = "[EWCIS]") String type,
    @NotBlank @Size(max = 50) String category,
    Integer httpStatus,
    @NotBlank @Size(max = 255) String defaultTitle,
    String defaultDetail,
    @Valid List<MessageTranslationRequest> translations
) {
}
