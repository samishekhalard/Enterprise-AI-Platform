package com.ems.definition.node.relationship;

import com.ems.definition.node.ObjectTypeNode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.neo4j.core.schema.GeneratedValue;
import org.springframework.data.neo4j.core.schema.Id;
import org.springframework.data.neo4j.core.schema.RelationshipProperties;
import org.springframework.data.neo4j.core.schema.TargetNode;

/**
 * Relationship properties for the CAN_CONNECT_TO edge
 * between two ObjectTypeNodes.
 *
 * Defines a permissible relationship between two object types,
 * including cardinality and directional labeling.
 */
@RelationshipProperties
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CanConnectToRelationship {

    @Id
    @GeneratedValue
    private Long relId;

    /** Unique key for this relationship type (e.g., "runs_on", "depends_on"). */
    private String relationshipKey;

    /** Active-voice label (e.g., "runs on", "depends on"). */
    private String activeName;

    /** Passive-voice label (e.g., "hosts", "is depended on by"). */
    private String passiveName;

    /** Cardinality: one-to-one | one-to-many | many-to-many. */
    private String cardinality;

    /** Whether this relationship has a direction. */
    private boolean isDirected;

    @TargetNode
    private ObjectTypeNode targetType;
}
