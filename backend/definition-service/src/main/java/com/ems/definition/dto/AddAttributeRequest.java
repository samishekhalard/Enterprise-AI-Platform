package com.ems.definition.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

/**
 * Request body for adding an attribute to an ObjectType.
 */
public record AddAttributeRequest(

    @NotBlank(message = "AttributeTypeId is required")
    String attributeTypeId,

    boolean isRequired,

    @Min(value = 0, message = "DisplayOrder must be >= 0")
    int displayOrder
) {}
