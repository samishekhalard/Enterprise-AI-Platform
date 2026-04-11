package com.ems.auth.graph.entity;

import org.springframework.data.neo4j.core.schema.Id;
import org.springframework.data.neo4j.core.schema.Node;

/**
 * Neo4j Node representing an Authentication Protocol.
 *
 * Protocols define the authentication mechanism used by providers:
 * - OIDC: OpenID Connect (standard for modern identity providers)
 * - SAML: Security Assertion Markup Language (enterprise SSO)
 * - LDAP: Lightweight Directory Access Protocol (directory services)
 * - OAUTH2: Generic OAuth 2.0 (social logins)
 *
 * Graph Structure:
 * (Provider)-[:SUPPORTS]->(Protocol)
 */
@Node("Protocol")
public record ProtocolNode(

    /**
     * Protocol type identifier (e.g., "OIDC", "SAML", "LDAP", "OAUTH2").
     */
    @Id
    String type,

    /**
     * Protocol version (e.g., "1.0", "2.0").
     */
    String version,

    /**
     * Human-readable name of the protocol.
     */
    String displayName,

    /**
     * Description of the protocol.
     */
    String description

) {
    /**
     * Builder for creating ProtocolNode instances.
     */
    public static Builder builder() {
        return new Builder();
    }

    /**
     * Check if this is an OIDC protocol.
     */
    public boolean isOidc() {
        return "OIDC".equalsIgnoreCase(type);
    }

    /**
     * Check if this is a SAML protocol.
     */
    public boolean isSaml() {
        return "SAML".equalsIgnoreCase(type);
    }

    /**
     * Check if this is an LDAP protocol.
     */
    public boolean isLdap() {
        return "LDAP".equalsIgnoreCase(type);
    }

    /**
     * Check if this is an OAuth2 protocol.
     */
    public boolean isOauth2() {
        return "OAUTH2".equalsIgnoreCase(type);
    }

    /**
     * Builder class for ProtocolNode.
     */
    public static class Builder {
        private String type;
        private String version;
        private String displayName;
        private String description;

        public Builder type(String type) { this.type = type; return this; }
        public Builder version(String version) { this.version = version; return this; }
        public Builder displayName(String displayName) { this.displayName = displayName; return this; }
        public Builder description(String description) { this.description = description; return this; }

        public ProtocolNode build() {
            return new ProtocolNode(type, version, displayName, description);
        }
    }
}
