package com.ems.auth.graph.entity;

import org.springframework.data.neo4j.core.schema.Id;
import org.springframework.data.neo4j.core.schema.Node;
import org.springframework.data.neo4j.core.schema.Relationship;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.springframework.data.neo4j.core.schema.Relationship.Direction.OUTGOING;

/**
 * Neo4j Node representing a Role in the RBAC hierarchy.
 *
 * Roles support inheritance, allowing deep role lookup with transitive permissions.
 * Example: USER inherits from VIEWER, ADMIN inherits from USER and MANAGER.
 *
 * Graph Structure:
 * (Role)-[:INHERITS_FROM]->(Role)
 * (User)-[:HAS_ROLE]->(Role)
 * (Group)-[:HAS_ROLE]->(Role)
 */
@Node("Role")
public record RoleNode(

    /**
     * Unique role name (e.g., "ADMIN", "USER", "VIEWER").
     */
    @Id
    String name,

    /**
     * Display name for UI presentation.
     */
    String displayName,

    /**
     * Description of the role and its permissions.
     */
    String description,

    /**
     * Tenant ID this role belongs to (null for global roles).
     */
    String tenantId,

    /**
     * Whether this is a system role (cannot be deleted).
     */
    boolean systemRole,

    /**
     * Roles that this role inherits from.
     * Permissions are inherited transitively.
     */
    @Relationship(type = "INHERITS_FROM", direction = OUTGOING)
    List<RoleNode> inheritsFrom,

    /**
     * Timestamp when the role was created.
     */
    Instant createdAt,

    /**
     * Timestamp when the role was last updated.
     */
    Instant updatedAt

) {
    /**
     * Builder for creating RoleNode instances.
     */
    public static Builder builder() {
        return new Builder();
    }

    /**
     * Get all effective roles including inherited roles (transitive).
     * Note: For deep lookup, use the Cypher query in AuthGraphRepository.
     */
    public Set<String> getEffectiveRoles() {
        Set<String> roles = new HashSet<>();
        collectRoles(this, roles);
        return roles;
    }

    private void collectRoles(RoleNode role, Set<String> collected) {
        if (role == null || collected.contains(role.name())) {
            return;
        }
        collected.add(role.name());
        if (role.inheritsFrom() != null) {
            for (RoleNode parent : role.inheritsFrom()) {
                collectRoles(parent, collected);
            }
        }
    }

    /**
     * Builder class for RoleNode.
     */
    public static class Builder {
        private String name;
        private String displayName;
        private String description;
        private String tenantId;
        private boolean systemRole = false;
        private List<RoleNode> inheritsFrom = List.of();
        private Instant createdAt;
        private Instant updatedAt;

        public Builder name(String name) { this.name = name; return this; }
        public Builder displayName(String displayName) { this.displayName = displayName; return this; }
        public Builder description(String description) { this.description = description; return this; }
        public Builder tenantId(String tenantId) { this.tenantId = tenantId; return this; }
        public Builder systemRole(boolean systemRole) { this.systemRole = systemRole; return this; }
        public Builder inheritsFrom(List<RoleNode> inheritsFrom) { this.inheritsFrom = inheritsFrom; return this; }
        public Builder createdAt(Instant createdAt) { this.createdAt = createdAt; return this; }
        public Builder updatedAt(Instant updatedAt) { this.updatedAt = updatedAt; return this; }

        public RoleNode build() {
            return new RoleNode(name, displayName, description, tenantId, systemRole, inheritsFrom, createdAt, updatedAt);
        }
    }
}
