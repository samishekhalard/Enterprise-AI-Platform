package com.ems.definition.node;

import com.ems.definition.node.relationship.CanConnectToRelationship;
import com.ems.definition.node.relationship.HasAttributeRelationship;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.springframework.data.neo4j.core.schema.Id;
import org.springframework.data.neo4j.core.schema.Node;
import org.springframework.data.neo4j.core.schema.Relationship;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Neo4j node representing an ObjectType in the definition graph.
 *
 * An ObjectType is the master definition of a business object
 * (e.g., "Server", "Application", "Contract", "Person").
 * It holds metadata about the type and its relationships
 * to AttributeTypes and other ObjectTypes.
 */
@Node("ObjectType")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ObjectTypeNode {

    @Id
    private String id;

    private String tenantId;

    private String name;

    /** Unique key within tenant (e.g., "server", "application"). */
    private String typeKey;

    /** Auto-generated code (e.g., OBJ_001) if not provided. */
    private String code;

    private String description;

    /** Lucide icon name (default: "box"). */
    @Builder.Default
    private String iconName = "box";

    /** Hex color for the icon (default: "#428177"). */
    @Builder.Default
    private String iconColor = "#428177";

    /** Lifecycle status: active | planned | hold | retired. */
    @Builder.Default
    private String status = "active";

    /** State: default | customized | user_defined. */
    @Builder.Default
    private String state = "user_defined";

    private Instant createdAt;

    private Instant updatedAt;

    @Relationship(type = "HAS_ATTRIBUTE", direction = Relationship.Direction.OUTGOING)
    @Builder.Default
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private List<HasAttributeRelationship> attributes = new ArrayList<>();

    @Relationship(type = "CAN_CONNECT_TO", direction = Relationship.Direction.OUTGOING)
    @Builder.Default
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private List<CanConnectToRelationship> connections = new ArrayList<>();

    @Relationship(type = "IS_SUBTYPE_OF", direction = Relationship.Direction.OUTGOING)
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private ObjectTypeNode parentType;
}
