package com.ems.auth.graph.entity;

import org.springframework.data.neo4j.core.schema.Id;
import org.springframework.data.neo4j.core.schema.Node;
import org.springframework.data.neo4j.core.schema.Relationship;

import java.time.Instant;
import java.util.List;

import static org.springframework.data.neo4j.core.schema.Relationship.Direction.OUTGOING;

/**
 * Neo4j Node representing a Group in the identity graph.
 *
 * Groups aggregate users and can have roles assigned to them.
 * All users in a group inherit the group's roles.
 *
 * Graph Structure:
 * (User)-[:MEMBER_OF]->(Group)
 * (Group)-[:HAS_ROLE]->(Role)
 * (Group)-[:CHILD_OF]->(Group) - for nested groups
 */
@Node("Group")
public record GroupNode(

    /**
     * Unique group identifier (UUID).
     */
    @Id
    String id,

    /**
     * Group name (unique per tenant).
     */
    String name,

    /**
     * Display name for UI presentation.
     */
    String displayName,

    /**
     * Description of the group.
     */
    String description,

    /**
     * Tenant ID this group belongs to.
     */
    String tenantId,

    /**
     * Whether this is a system group (cannot be deleted).
     */
    boolean systemGroup,

    /**
     * Roles assigned to this group.
     */
    @Relationship(type = "HAS_ROLE", direction = OUTGOING)
    List<RoleNode> roles,

    /**
     * Parent groups (for nested group hierarchies).
     */
    @Relationship(type = "CHILD_OF", direction = OUTGOING)
    List<GroupNode> parentGroups,

    /**
     * Timestamp when the group was created.
     */
    Instant createdAt,

    /**
     * Timestamp when the group was last updated.
     */
    Instant updatedAt

) {
    /**
     * Builder for creating GroupNode instances.
     */
    public static Builder builder() {
        return new Builder();
    }

    /**
     * Builder class for GroupNode.
     */
    public static class Builder {
        private String id;
        private String name;
        private String displayName;
        private String description;
        private String tenantId;
        private boolean systemGroup = false;
        private List<RoleNode> roles = List.of();
        private List<GroupNode> parentGroups = List.of();
        private Instant createdAt;
        private Instant updatedAt;

        public Builder id(String id) { this.id = id; return this; }
        public Builder name(String name) { this.name = name; return this; }
        public Builder displayName(String displayName) { this.displayName = displayName; return this; }
        public Builder description(String description) { this.description = description; return this; }
        public Builder tenantId(String tenantId) { this.tenantId = tenantId; return this; }
        public Builder systemGroup(boolean systemGroup) { this.systemGroup = systemGroup; return this; }
        public Builder roles(List<RoleNode> roles) { this.roles = roles; return this; }
        public Builder parentGroups(List<GroupNode> parentGroups) { this.parentGroups = parentGroups; return this; }
        public Builder createdAt(Instant createdAt) { this.createdAt = createdAt; return this; }
        public Builder updatedAt(Instant updatedAt) { this.updatedAt = updatedAt; return this; }

        public GroupNode build() {
            return new GroupNode(
                id, name, displayName, description, tenantId, systemGroup,
                roles, parentGroups, createdAt, updatedAt
            );
        }
    }
}
