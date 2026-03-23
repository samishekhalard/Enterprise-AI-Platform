package com.ems.definition.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request body for creating a new AttributeType.
 */
public record AttributeTypeCreateRequest(

    @NotBlank(message = "Name is required")
    @Size(max = 255, message = "Name must be at most 255 characters")
    String name,

    @NotBlank(message = "AttributeKey is required")
    @Size(max = 100, message = "AttributeKey must be at most 100 characters")
    String attributeKey,

    @NotBlank(message = "DataType is required")
    @Size(max = 30, message = "DataType must be at most 30 characters")
    String dataType,

    @Size(max = 100, message = "AttributeGroup must be at most 100 characters")
    String attributeGroup,

    @Size(max = 2000, message = "Description must be at most 2000 characters")
    String description,

    @Size(max = 500, message = "DefaultValue must be at most 500 characters")
    String defaultValue,

    @Size(max = 2000, message = "ValidationRules must be at most 2000 characters")
    String validationRules
) {}
