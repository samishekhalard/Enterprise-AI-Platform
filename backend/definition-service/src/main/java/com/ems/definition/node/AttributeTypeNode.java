package com.ems.definition.node;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.neo4j.core.schema.Id;
import org.springframework.data.neo4j.core.schema.Node;

import java.time.Instant;

/**
 * Neo4j node representing an AttributeType in the definition graph.
 *
 * An AttributeType defines a reusable field definition that can be
 * attached to one or more ObjectTypes via the HAS_ATTRIBUTE relationship.
 *
 * Examples: "hostname" (string), "ip_address" (string), "cpu_cores" (integer).
 */
@Node("AttributeType")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttributeTypeNode {

    @Id
    private String id;

    private String tenantId;

    private String name;

    /** Unique key for this attribute (e.g., "hostname", "ip_address"). */
    private String attributeKey;

    /** Data type: string|text|integer|float|boolean|date|datetime|enum|json. */
    private String dataType;

    /** Grouping category (e.g., "general", "network", "hardware"). */
    private String attributeGroup;

    private String description;

    private String defaultValue;

    /** JSON string containing validation rules (e.g., min, max, pattern). */
    private String validationRules;

    private Instant createdAt;

    private Instant updatedAt;
}
