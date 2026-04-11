package com.ems.definition.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request body for adding a connection (CAN_CONNECT_TO) from one ObjectType to another.
 */
public record AddConnectionRequest(

    @NotBlank(message = "TargetObjectTypeId is required")
    String targetObjectTypeId,

    @NotBlank(message = "RelationshipKey is required")
    @Size(max = 100, message = "RelationshipKey must be at most 100 characters")
    String relationshipKey,

    @Size(max = 255, message = "ActiveName must be at most 255 characters")
    String activeName,

    @Size(max = 255, message = "PassiveName must be at most 255 characters")
    String passiveName,

    @NotBlank(message = "Cardinality is required")
    @Size(max = 20, message = "Cardinality must be at most 20 characters")
    String cardinality,

    boolean isDirected
) {}
