package com.ems.definition.dto;

import jakarta.validation.constraints.Size;

/**
 * Request body for updating an ObjectType.
 * All fields are nullable for partial update.
 */
public record ObjectTypeUpdateRequest(

    @Size(max = 255, message = "Name must be at most 255 characters")
    String name,

    @Size(max = 100, message = "TypeKey must be at most 100 characters")
    String typeKey,

    @Size(max = 20, message = "Code must be at most 20 characters")
    String code,

    @Size(max = 2000, message = "Description must be at most 2000 characters")
    String description,

    @Size(max = 100, message = "IconName must be at most 100 characters")
    String iconName,

    @Size(max = 7, message = "IconColor must be at most 7 characters")
    String iconColor,

    @Size(max = 20, message = "Status must be at most 20 characters")
    String status,

    @Size(max = 30, message = "State must be at most 30 characters")
    String state
) {}
