package com.ems.auth.graph.entity;

import org.springframework.data.neo4j.core.schema.Id;
import org.springframework.data.neo4j.core.schema.Node;
import org.springframework.data.neo4j.core.schema.Relationship;

import java.time.Instant;
import java.util.List;

import static org.springframework.data.neo4j.core.schema.Relationship.Direction.OUTGOING;

/**
 * Neo4j Node representing a Tenant in the identity graph.
 *
 * The Tenant node is the root of the identity hierarchy and contains
 * relationships to providers configured for authentication.
 *
 * Graph Structure:
 * (Tenant)-[:USES]->(Provider)
 * (Tenant)-[:CONFIGURED_WITH]->(Config)
 */
@Node("Tenant")
public record TenantNode(

    /**
     * Unique tenant identifier (e.g., "acme-corp", "tenant-123").
     */
    @Id
    String id,

    /**
     * Primary domain for the tenant (e.g., "acme.com").
     * Used for domain-based tenant resolution.
     */
    String domain,

    /**
     * Display name of the tenant.
     */
    String name,

    /**
     * Whether this tenant is active.
     */
    boolean active,

    /**
     * Providers configured for this tenant.
     */
    @Relationship(type = "USES", direction = OUTGOING)
    List<ProviderNode> providers,

    /**
     * Configurations for providers.
     */
    @Relationship(type = "CONFIGURED_WITH", direction = OUTGOING)
    List<ConfigNode> configurations,

    /**
     * Timestamp when the tenant was created.
     */
    Instant createdAt,

    /**
     * Timestamp when the tenant was last updated.
     */
    Instant updatedAt

) {
    /**
     * Builder for creating TenantNode instances.
     */
    public static Builder builder() {
        return new Builder();
    }

    /**
     * Builder class for TenantNode.
     */
    public static class Builder {
        private String id;
        private String domain;
        private String name;
        private boolean active = true;
        private List<ProviderNode> providers = List.of();
        private List<ConfigNode> configurations = List.of();
        private Instant createdAt;
        private Instant updatedAt;

        public Builder id(String id) { this.id = id; return this; }
        public Builder domain(String domain) { this.domain = domain; return this; }
        public Builder name(String name) { this.name = name; return this; }
        public Builder active(boolean active) { this.active = active; return this; }
        public Builder providers(List<ProviderNode> providers) { this.providers = providers; return this; }
        public Builder configurations(List<ConfigNode> configurations) { this.configurations = configurations; return this; }
        public Builder createdAt(Instant createdAt) { this.createdAt = createdAt; return this; }
        public Builder updatedAt(Instant updatedAt) { this.updatedAt = updatedAt; return this; }

        public TenantNode build() {
            return new TenantNode(id, domain, name, active, providers, configurations, createdAt, updatedAt);
        }
    }
}
