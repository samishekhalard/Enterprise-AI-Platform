package com.ems.process.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;

import java.util.UUID;

/**
 * DTO for BPMN element type information.
 * Used for API responses.
 */
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public record BpmnElementTypeDTO(
    UUID id,
    String code,
    String name,
    String category,
    String subCategory,
    String strokeColor,
    String fillColor,
    Double strokeWidth,
    ElementSizeDTO defaultSize,
    String iconSvg,
    Integer sortOrder
) {
    @Builder
    public record ElementSizeDTO(
        Integer width,
        Integer height
    ) {}
}
