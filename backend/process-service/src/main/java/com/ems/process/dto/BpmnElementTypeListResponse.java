package com.ems.process.dto;

import lombok.Builder;

import java.util.List;
import java.util.Map;

/**
 * Response DTO for list of BPMN element types.
 * Includes CSS variables for frontend styling.
 */
@Builder
public record BpmnElementTypeListResponse(
    List<BpmnElementTypeDTO> elements,
    Map<String, String> cssVariables,
    int total
) {}
