package com.ems.definition.dto;

import jakarta.validation.constraints.Size;

/**
 * Request body for updating an existing AttributeType (partial update — null fields are ignored).
 */
public record AttributeTypeUpdateRequest(

    @Size(max = 255, message = "Name must be at most 255 characters")
    String name,

    @Size(max = 100, message = "AttributeKey must be at most 100 characters")
    String attributeKey,

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
