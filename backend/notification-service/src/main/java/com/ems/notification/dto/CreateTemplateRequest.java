package com.ems.notification.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Builder;

import java.util.List;

@Builder
public record CreateTemplateRequest(
    @Size(max = 50) String tenantId,
    @NotBlank @Size(max = 100) String code,
    @NotBlank @Size(max = 100) String name,
    String description,
    @NotBlank @Size(max = 20) String type,
    @NotBlank @Size(max = 50) String category,
    String subjectTemplate,
    @NotBlank String bodyTemplate,
    String bodyHtmlTemplate,
    List<String> variables,
    @Size(max = 10) String locale
) {}
