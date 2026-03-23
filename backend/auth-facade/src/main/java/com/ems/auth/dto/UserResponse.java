package com.ems.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;
import java.util.List;

/**
 * Response DTO for user information.
 *
 * Combines data from Keycloak (source of truth for identity) with
 * Neo4j graph data (roles via HAS_ROLE, groups via MEMBER_OF).
 */
@Schema(description = "User information combining identity provider and graph data")
public record UserResponse(

    @Schema(
        description = "Unique user identifier (from identity provider)",
        example = "550e8400-e29b-41d4-a716-446655440000"
    )
    String id,

    @Schema(
        description = "User's email address",
        example = "john.doe@example.com"
    )
    String email,

    @Schema(
        description = "User's first name",
        example = "John"
    )
    String firstName,

    @Schema(
        description = "User's last name",
        example = "Doe"
    )
    String lastName,

    @Schema(
        description = "User's display name (first + last, or email if names absent)",
        example = "John Doe"
    )
    String displayName,

    @Schema(
        description = "Whether the user account is active/enabled",
        example = "true"
    )
    boolean active,

    @Schema(
        description = "Whether the user's email has been verified",
        example = "true"
    )
    boolean emailVerified,

    @Schema(
        description = "Effective roles assigned to the user (direct + inherited via groups)",
        example = "[\"ADMIN\", \"USER\"]"
    )
    List<String> roles,

    @Schema(
        description = "Groups the user is a member of",
        example = "[\"administrators\", \"developers\"]"
    )
    List<String> groups,

    @Schema(
        description = "Identity provider that authenticated this user",
        example = "keycloak"
    )
    String identityProvider,

    @Schema(
        description = "Timestamp of the user's last login",
        example = "2026-02-25T10:30:00Z"
    )
    Instant lastLoginAt,

    @Schema(
        description = "Timestamp when the user was created",
        example = "2026-01-15T08:00:00Z"
    )
    Instant createdAt

) {
    /**
     * Builder for creating UserResponse instances.
     */
    public static Builder builder() {
        return new Builder();
    }

    /**
     * Builder class for UserResponse.
     */
    public static class Builder {
        private String id;
        private String email;
        private String firstName;
        private String lastName;
        private String displayName;
        private boolean active;
        private boolean emailVerified;
        private List<String> roles = List.of();
        private List<String> groups = List.of();
        private String identityProvider;
        private Instant lastLoginAt;
        private Instant createdAt;

        public Builder id(String id) { this.id = id; return this; }
        public Builder email(String email) { this.email = email; return this; }
        public Builder firstName(String firstName) { this.firstName = firstName; return this; }
        public Builder lastName(String lastName) { this.lastName = lastName; return this; }
        public Builder displayName(String displayName) { this.displayName = displayName; return this; }
        public Builder active(boolean active) { this.active = active; return this; }
        public Builder emailVerified(boolean emailVerified) { this.emailVerified = emailVerified; return this; }
        public Builder roles(List<String> roles) { this.roles = roles; return this; }
        public Builder groups(List<String> groups) { this.groups = groups; return this; }
        public Builder identityProvider(String identityProvider) { this.identityProvider = identityProvider; return this; }
        public Builder lastLoginAt(Instant lastLoginAt) { this.lastLoginAt = lastLoginAt; return this; }
        public Builder createdAt(Instant createdAt) { this.createdAt = createdAt; return this; }

        public UserResponse build() {
            return new UserResponse(
                id, email, firstName, lastName, displayName, active, emailVerified,
                roles, groups, identityProvider, lastLoginAt, createdAt
            );
        }
    }
}
