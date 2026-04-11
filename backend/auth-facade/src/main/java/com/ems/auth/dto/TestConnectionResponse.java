package com.ems.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.Map;

/**
 * Response DTO for provider connection tests and validations.
 */
@Schema(description = "Provider connection test response")
public record TestConnectionResponse(

    @Schema(
        description = "Whether the connection test was successful",
        example = "true"
    )
    boolean success,

    @Schema(
        description = "Human-readable message describing the result",
        example = "Successfully connected to OIDC discovery endpoint"
    )
    String message,

    @Schema(
        description = "Connection details if successful"
    )
    ConnectionDetails details,

    @Schema(
        description = "Error message if the test failed",
        example = "Connection refused"
    )
    String error

) {
    /**
     * Create a successful response.
     */
    public static TestConnectionResponse success(String message, ConnectionDetails details) {
        return new TestConnectionResponse(true, message, details, null);
    }

    /**
     * Create a failed response.
     */
    public static TestConnectionResponse failure(String message, String error) {
        return new TestConnectionResponse(false, message, null, error);
    }

    /**
     * Connection details for successful tests.
     */
    @Schema(description = "Connection test details")
    public record ConnectionDetails(

        @Schema(
            description = "Discovered issuer URL",
            example = "https://keycloak.example.com/realms/acme"
        )
        String issuer,

        @Schema(
            description = "Discovery URL used",
            example = "https://keycloak.example.com/realms/acme/.well-known/openid-configuration"
        )
        String discoveryUrl,

        @Schema(
            description = "Supported scopes",
            example = "[\"openid\", \"profile\", \"email\"]"
        )
        java.util.List<String> supportedScopes,

        @Schema(
            description = "Discovered endpoints"
        )
        Map<String, String> endpoints,

        @Schema(
            description = "Response time in milliseconds",
            example = "245"
        )
        Long responseTimeMs

    ) {
        public static ConnectionDetails oidc(String issuer, String discoveryUrl,
                java.util.List<String> scopes, Map<String, String> endpoints, long responseTimeMs) {
            return new ConnectionDetails(issuer, discoveryUrl, scopes, endpoints, responseTimeMs);
        }

        public static ConnectionDetails ldap(long responseTimeMs) {
            return new ConnectionDetails(null, null, null, Map.of("status", "bind_successful"), responseTimeMs);
        }

        public static ConnectionDetails saml(String entityId, Map<String, String> endpoints, long responseTimeMs) {
            return new ConnectionDetails(entityId, null, null, endpoints, responseTimeMs);
        }
    }
}
