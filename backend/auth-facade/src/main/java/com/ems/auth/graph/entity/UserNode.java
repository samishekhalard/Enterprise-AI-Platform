package com.ems.auth.graph.entity;

import org.springframework.data.neo4j.core.schema.Id;
import org.springframework.data.neo4j.core.schema.Node;
import org.springframework.data.neo4j.core.schema.Relationship;

import java.time.Instant;
import java.util.List;

import static org.springframework.data.neo4j.core.schema.Relationship.Direction.OUTGOING;

/**
 * Neo4j Node representing a User in the identity graph.
 *
 * Users can have direct roles and can be members of groups that have roles.
 * Role resolution traverses both direct assignments and group memberships.
 *
 * Graph Structure:
 * (User)-[:MEMBER_OF]->(Group)
 * (User)-[:HAS_ROLE]->(Role)
 * (User)-[:BELONGS_TO]->(Tenant)
 */
@Node("User")
public record UserNode(

    /**
     * Unique user identifier (UUID from identity provider).
     */
    @Id
    String id,

    /**
     * User's email address (unique per tenant).
     */
    String email,

    /**
     * User's first name.
     */
    String firstName,

    /**
     * User's last name.
     */
    String lastName,

    /**
     * Tenant ID this user belongs to.
     */
    String tenantId,

    /**
     * Whether the user is active.
     */
    boolean active,

    /**
     * Whether email has been verified.
     */
    boolean emailVerified,

    /**
     * External identity provider user ID (if federated).
     */
    String externalId,

    /**
     * Identity provider that authenticated this user.
     */
    String identityProvider,

    /**
     * Groups the user is a member of.
     */
    @Relationship(type = "MEMBER_OF", direction = OUTGOING)
    List<GroupNode> groups,

    /**
     * Roles directly assigned to the user.
     */
    @Relationship(type = "HAS_ROLE", direction = OUTGOING)
    List<RoleNode> directRoles,

    /**
     * Timestamp when the user was created.
     */
    Instant createdAt,

    /**
     * Timestamp when the user was last updated.
     */
    Instant updatedAt,

    /**
     * Timestamp of the user's last login.
     */
    Instant lastLoginAt

) {
    /**
     * Builder for creating UserNode instances.
     */
    public static Builder builder() {
        return new Builder();
    }

    /**
     * Get the user's full name.
     */
    public String getFullName() {
        if (firstName == null && lastName == null) {
            return email;
        }
        if (firstName == null) {
            return lastName;
        }
        if (lastName == null) {
            return firstName;
        }
        return firstName + " " + lastName;
    }

    /**
     * Builder class for UserNode.
     */
    public static class Builder {
        private String id;
        private String email;
        private String firstName;
        private String lastName;
        private String tenantId;
        private boolean active = true;
        private boolean emailVerified = false;
        private String externalId;
        private String identityProvider;
        private List<GroupNode> groups = List.of();
        private List<RoleNode> directRoles = List.of();
        private Instant createdAt;
        private Instant updatedAt;
        private Instant lastLoginAt;

        public Builder id(String id) { this.id = id; return this; }
        public Builder email(String email) { this.email = email; return this; }
        public Builder firstName(String firstName) { this.firstName = firstName; return this; }
        public Builder lastName(String lastName) { this.lastName = lastName; return this; }
        public Builder tenantId(String tenantId) { this.tenantId = tenantId; return this; }
        public Builder active(boolean active) { this.active = active; return this; }
        public Builder emailVerified(boolean emailVerified) { this.emailVerified = emailVerified; return this; }
        public Builder externalId(String externalId) { this.externalId = externalId; return this; }
        public Builder identityProvider(String identityProvider) { this.identityProvider = identityProvider; return this; }
        public Builder groups(List<GroupNode> groups) { this.groups = groups; return this; }
        public Builder directRoles(List<RoleNode> directRoles) { this.directRoles = directRoles; return this; }
        public Builder createdAt(Instant createdAt) { this.createdAt = createdAt; return this; }
        public Builder updatedAt(Instant updatedAt) { this.updatedAt = updatedAt; return this; }
        public Builder lastLoginAt(Instant lastLoginAt) { this.lastLoginAt = lastLoginAt; return this; }

        public UserNode build() {
            return new UserNode(
                id, email, firstName, lastName, tenantId, active, emailVerified,
                externalId, identityProvider, groups, directRoles,
                createdAt, updatedAt, lastLoginAt
            );
        }
    }
}
