package com.ems.definition.dto;

import java.time.Instant;
import java.util.List;

/**
 * Full representation of an ObjectType, including relationships.
 */
public record ObjectTypeDTO(
    String id,
    String tenantId,
    String name,
    String typeKey,
    String code,
    String description,
    String iconName,
    String iconColor,
    String status,
    String state,
    Instant createdAt,
    Instant updatedAt,
    List<AttributeReferenceDTO> attributes,
    List<ConnectionDTO> connections,
    String parentTypeId,
    int instanceCount
) {

    /**
     * Compact attribute reference within an ObjectType.
     */
    public record AttributeReferenceDTO(
        Long relId,
        String attributeTypeId,
        String name,
        String attributeKey,
        String dataType,
        boolean isRequired,
        int displayOrder
    ) {}
}
