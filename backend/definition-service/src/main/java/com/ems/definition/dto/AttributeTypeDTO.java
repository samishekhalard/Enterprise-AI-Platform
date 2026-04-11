package com.ems.definition.dto;

import java.time.Instant;

/**
 * Full representation of an AttributeType.
 */
public record AttributeTypeDTO(
    String id,
    String tenantId,
    String name,
    String attributeKey,
    String dataType,
    String attributeGroup,
    String description,
    String defaultValue,
    String validationRules,
    Instant createdAt,
    Instant updatedAt
) {}
