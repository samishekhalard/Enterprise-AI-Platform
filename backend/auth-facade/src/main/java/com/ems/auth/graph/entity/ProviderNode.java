package com.ems.auth.graph.entity;

import org.springframework.data.neo4j.core.schema.Id;
import org.springframework.data.neo4j.core.schema.Node;
import org.springframework.data.neo4j.core.schema.Relationship;

import java.util.List;

import static org.springframework.data.neo4j.core.schema.Relationship.Direction.OUTGOING;

/**
 * Neo4j Node representing an Identity Provider.
 *
 * Providers are shared across tenants and represent the identity provider
 * vendor/type (e.g., Keycloak, Google, Azure AD, LDAP).
 *
 * Graph Structure:
 * (Provider)-[:SUPPORTS]->(Protocol)
 * (Provider)-[:HAS_CONFIG]->(Config)
 */
@Node("Provider")
public record ProviderNode(

    /**
     * Unique provider name/identifier (e.g., "KEYCLOAK", "GOOGLE", "AZURE_AD").
     */
    @Id
    String name,

    /**
     * Vendor of the identity provider (e.g., "Keycloak", "Google", "Microsoft").
     */
    String vendor,

    /**
     * Display name for UI presentation.
     */
    String displayName,

    /**
     * Optional icon URL for the provider.
     */
    String iconUrl,

    /**
     * Description of the provider.
     */
    String description,

    /**
     * Protocols supported by this provider.
     */
    @Relationship(type = "SUPPORTS", direction = OUTGOING)
    List<ProtocolNode> protocols,

    /**
     * Configurations associated with this provider across tenants.
     */
    @Relationship(type = "HAS_CONFIG", direction = OUTGOING)
    List<ConfigNode> configs

) {
    /**
     * Builder for creating ProviderNode instances.
     */
    public static Builder builder() {
        return new Builder();
    }

    /**
     * Check if this provider supports a specific protocol.
     */
    public boolean supportsProtocol(String protocolType) {
        if (protocols == null) return false;
        return protocols.stream()
            .anyMatch(p -> p.type().equalsIgnoreCase(protocolType));
    }

    /**
     * Builder class for ProviderNode.
     */
    public static class Builder {
        private String name;
        private String vendor;
        private String displayName;
        private String iconUrl;
        private String description;
        private List<ProtocolNode> protocols = List.of();
        private List<ConfigNode> configs = List.of();

        public Builder name(String name) { this.name = name; return this; }
        public Builder vendor(String vendor) { this.vendor = vendor; return this; }
        public Builder displayName(String displayName) { this.displayName = displayName; return this; }
        public Builder iconUrl(String iconUrl) { this.iconUrl = iconUrl; return this; }
        public Builder description(String description) { this.description = description; return this; }
        public Builder protocols(List<ProtocolNode> protocols) { this.protocols = protocols; return this; }
        public Builder configs(List<ConfigNode> configs) { this.configs = configs; return this; }

        public ProviderNode build() {
            return new ProviderNode(name, vendor, displayName, iconUrl, description, protocols, configs);
        }
    }
}
