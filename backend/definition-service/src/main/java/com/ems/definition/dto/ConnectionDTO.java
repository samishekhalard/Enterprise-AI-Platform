package com.ems.definition.dto;

/**
 * Representation of a CAN_CONNECT_TO relationship from an ObjectType.
 */
public record ConnectionDTO(
    Long relId,
    String targetObjectTypeId,
    String targetObjectTypeName,
    String relationshipKey,
    String activeName,
    String passiveName,
    String cardinality,
    boolean isDirected
) {}
