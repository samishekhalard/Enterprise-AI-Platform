package com.ems.definition.node.relationship;

import com.ems.definition.node.AttributeTypeNode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.neo4j.core.schema.GeneratedValue;
import org.springframework.data.neo4j.core.schema.Id;
import org.springframework.data.neo4j.core.schema.RelationshipProperties;
import org.springframework.data.neo4j.core.schema.TargetNode;

/**
 * Relationship properties for the HAS_ATTRIBUTE edge
 * between an ObjectTypeNode and an AttributeTypeNode.
 *
 * Captures whether the attribute is required and its display order.
 */
@RelationshipProperties
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HasAttributeRelationship {

    @Id
    @GeneratedValue
    private Long relId;

    private boolean isRequired;

    private int displayOrder;

    @TargetNode
    private AttributeTypeNode attribute;
}
