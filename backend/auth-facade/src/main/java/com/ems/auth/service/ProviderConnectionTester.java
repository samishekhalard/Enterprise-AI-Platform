package com.ems.auth.service;

import com.ems.auth.dto.ProviderConfigRequest;
import com.ems.auth.dto.TestConnectionResponse;
import com.ems.auth.dto.TestConnectionResponse.ConnectionDetails;
import com.ems.auth.provider.DynamicProviderResolver;
import com.ems.auth.provider.ProviderConfig;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import javax.naming.Context;
import javax.naming.directory.DirContext;
import javax.naming.directory.InitialDirContext;
import java.util.*;

/**
 * Service for testing connectivity to identity providers.
 *
 * Supports testing:
 * - OIDC: Fetches and validates discovery document
 * - SAML: Fetches and validates metadata
 * - LDAP: Tests bind operation
 * - OAuth2: Tests authorization and token endpoints
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ProviderConnectionTester {

    private final DynamicProviderResolver providerResolver;
    private final RestClient.Builder restClientBuilder;

    /**
     * Test connection to an existing provider configuration.
     *
     * @param tenantId The tenant identifier
     * @param providerId The provider identifier
     * @return Test result with connection details
     */
    public TestConnectionResponse testConnection(String tenantId, String providerId) {
        log.info("Testing connection for provider {} in tenant {}", providerId, tenantId);

        try {
            ProviderConfig config = providerResolver.resolveProvider(tenantId, providerId);
            return testProviderConnection(config);
        } catch (Exception e) {
            log.error("Failed to test connection for provider {}: {}", providerId, e.getMessage(), e);
            return TestConnectionResponse.failure("Failed to test connection", e.getMessage());
        }
    }

    /**
     * Validate provider configuration without saving.
     *
     * @param request The provider configuration to validate
     * @return Validation result
     */
    public TestConnectionResponse validateConfig(ProviderConfigRequest request) {
        log.info("Validating provider configuration for {}", request.providerName());

        List<String> errors = new ArrayList<>();

        // Validate required fields based on protocol
        switch (request.protocol().toUpperCase()) {
            case "OIDC" -> validateOidcConfig(request, errors);
            case "OAUTH2" -> validateOAuth2Config(request, errors);
            case "SAML" -> validateSamlConfig(request, errors);
            case "LDAP" -> validateLdapConfig(request, errors);
            default -> errors.add("Unknown protocol: " + request.protocol());
        }

        if (!errors.isEmpty()) {
            return TestConnectionResponse.failure(
                "Validation failed",
                String.join("; ", errors)
            );
        }

        return TestConnectionResponse.success("Configuration is valid", null);
    }

    /**
     * Test connection to a provider based on its protocol.
     */
    private TestConnectionResponse testProviderConnection(ProviderConfig config) {
        return switch (config.protocol().toUpperCase()) {
            case "OIDC" -> testOidcProvider(config);
            case "OAUTH2" -> testOAuth2Provider(config);
            case "SAML" -> testSamlProvider(config);
            case "LDAP" -> testLdapProvider(config);
            default -> TestConnectionResponse.failure(
                "Unsupported protocol",
                "Protocol " + config.protocol() + " is not supported for connection testing"
            );
        };
    }

    /**
     * Test OIDC provider by fetching discovery document.
     */
    private TestConnectionResponse testOidcProvider(ProviderConfig config) {
        String discoveryUrl = config.discoveryUrl();
        if (discoveryUrl == null || discoveryUrl.isBlank()) {
            return TestConnectionResponse.failure(
                "Missing discovery URL",
                "OIDC provider requires a discovery URL"
            );
        }

        long startTime = System.currentTimeMillis();
        try {
            RestClient client = restClientBuilder.build();
            JsonNode discovery = client.get()
                .uri(discoveryUrl)
                .retrieve()
                .body(JsonNode.class);

            long responseTime = System.currentTimeMillis() - startTime;

            if (discovery == null) {
                return TestConnectionResponse.failure(
                    "Invalid discovery document",
                    "Discovery endpoint returned null response"
                );
            }

            String issuer = discovery.has("issuer") ? discovery.get("issuer").asText() : null;
            List<String> scopes = new ArrayList<>();
            if (discovery.has("scopes_supported")) {
                discovery.get("scopes_supported").forEach(s -> scopes.add(s.asText()));
            }

            Map<String, String> endpoints = new LinkedHashMap<>();
            if (discovery.has("authorization_endpoint")) {
                endpoints.put("authorization", discovery.get("authorization_endpoint").asText());
            }
            if (discovery.has("token_endpoint")) {
                endpoints.put("token", discovery.get("token_endpoint").asText());
            }
            if (discovery.has("userinfo_endpoint")) {
                endpoints.put("userinfo", discovery.get("userinfo_endpoint").asText());
            }
            if (discovery.has("jwks_uri")) {
                endpoints.put("jwks", discovery.get("jwks_uri").asText());
            }

            log.info("Successfully connected to OIDC provider at {} ({}ms)", discoveryUrl, responseTime);

            return TestConnectionResponse.success(
                "Successfully connected to OIDC discovery endpoint",
                ConnectionDetails.oidc(issuer, discoveryUrl, scopes, endpoints, responseTime)
            );

        } catch (Exception e) {
            log.warn("Failed to connect to OIDC provider at {}: {}", discoveryUrl, e.getMessage());
            return TestConnectionResponse.failure(
                "Failed to fetch OIDC discovery document",
                e.getMessage()
            );
        }
    }

    /**
     * Test OAuth2 provider by verifying endpoint accessibility.
     */
    private TestConnectionResponse testOAuth2Provider(ProviderConfig config) {
        String authUrl = config.authorizationUrl();
        String tokenUrl = config.tokenUrl();

        if ((authUrl == null || authUrl.isBlank()) && (tokenUrl == null || tokenUrl.isBlank())) {
            return TestConnectionResponse.failure(
                "Missing endpoints",
                "OAuth2 provider requires authorization or token endpoint URL"
            );
        }

        long startTime = System.currentTimeMillis();
        Map<String, String> endpoints = new LinkedHashMap<>();

        try {
            RestClient client = restClientBuilder.build();

            // Test authorization endpoint (HEAD request)
            if (authUrl != null && !authUrl.isBlank()) {
                try {
                    client.head().uri(authUrl).retrieve().toBodilessEntity();
                    endpoints.put("authorization", "reachable");
                } catch (Exception e) {
                    endpoints.put("authorization", "unreachable: " + e.getMessage());
                }
            }

            // Test token endpoint (HEAD request)
            if (tokenUrl != null && !tokenUrl.isBlank()) {
                try {
                    client.head().uri(tokenUrl).retrieve().toBodilessEntity();
                    endpoints.put("token", "reachable");
                } catch (Exception e) {
                    endpoints.put("token", "unreachable: " + e.getMessage());
                }
            }

            long responseTime = System.currentTimeMillis() - startTime;

            boolean allReachable = endpoints.values().stream()
                .allMatch(v -> "reachable".equals(v));

            if (allReachable) {
                return TestConnectionResponse.success(
                    "OAuth2 endpoints are reachable",
                    new ConnectionDetails(null, null, null, endpoints, responseTime)
                );
            } else {
                return TestConnectionResponse.failure(
                    "Some OAuth2 endpoints are unreachable",
                    "Check endpoint URLs: " + endpoints
                );
            }

        } catch (Exception e) {
            log.warn("Failed to test OAuth2 provider: {}", e.getMessage());
            return TestConnectionResponse.failure(
                "Failed to test OAuth2 endpoints",
                e.getMessage()
            );
        }
    }

    /**
     * Test SAML provider by fetching metadata.
     */
    private TestConnectionResponse testSamlProvider(ProviderConfig config) {
        String metadataUrl = config.metadataUrl();
        if (metadataUrl == null || metadataUrl.isBlank()) {
            return TestConnectionResponse.failure(
                "Missing metadata URL",
                "SAML provider requires a metadata URL"
            );
        }

        long startTime = System.currentTimeMillis();
        try {
            RestClient client = restClientBuilder.build();
            String metadata = client.get()
                .uri(metadataUrl)
                .retrieve()
                .body(String.class);

            long responseTime = System.currentTimeMillis() - startTime;

            if (metadata == null || !metadata.contains("EntityDescriptor")) {
                return TestConnectionResponse.failure(
                    "Invalid SAML metadata",
                    "Response does not appear to be valid SAML metadata"
                );
            }

            // Extract entity ID from metadata
            String entityId = extractEntityId(metadata);

            Map<String, String> endpoints = new LinkedHashMap<>();
            endpoints.put("metadata", metadataUrl);
            if (metadata.contains("SingleSignOnService")) {
                endpoints.put("sso", "found");
            }
            if (metadata.contains("SingleLogoutService")) {
                endpoints.put("slo", "found");
            }

            log.info("Successfully fetched SAML metadata from {} ({}ms)", metadataUrl, responseTime);

            return TestConnectionResponse.success(
                "Successfully fetched SAML metadata",
                ConnectionDetails.saml(entityId, endpoints, responseTime)
            );

        } catch (Exception e) {
            log.warn("Failed to fetch SAML metadata from {}: {}", metadataUrl, e.getMessage());
            return TestConnectionResponse.failure(
                "Failed to fetch SAML metadata",
                e.getMessage()
            );
        }
    }

    /**
     * Test LDAP provider by attempting bind operation.
     */
    private TestConnectionResponse testLdapProvider(ProviderConfig config) {
        String serverUrl = config.serverUrl();
        Integer port = config.port();
        String bindDn = config.bindDn();
        String bindPassword = config.bindPassword();

        if (serverUrl == null || serverUrl.isBlank()) {
            return TestConnectionResponse.failure(
                "Missing server URL",
                "LDAP provider requires a server URL"
            );
        }

        String ldapUrl = serverUrl;
        if (port != null && port > 0) {
            // Ensure URL includes port
            if (!ldapUrl.matches(".*:\\d+$")) {
                ldapUrl = ldapUrl + ":" + port;
            }
        }

        long startTime = System.currentTimeMillis();
        try {
            Hashtable<String, String> env = new Hashtable<>();
            env.put(Context.INITIAL_CONTEXT_FACTORY, "com.sun.jndi.ldap.LdapCtxFactory");
            env.put(Context.PROVIDER_URL, ldapUrl);

            if (bindDn != null && !bindDn.isBlank()) {
                env.put(Context.SECURITY_AUTHENTICATION, "simple");
                env.put(Context.SECURITY_PRINCIPAL, bindDn);
                env.put(Context.SECURITY_CREDENTIALS, bindPassword != null ? bindPassword : "");
            } else {
                env.put(Context.SECURITY_AUTHENTICATION, "none");
            }

            // Set connection timeout
            env.put("com.sun.jndi.ldap.connect.timeout", "5000");
            env.put("com.sun.jndi.ldap.read.timeout", "10000");

            DirContext ctx = new InitialDirContext(env);
            ctx.close();

            long responseTime = System.currentTimeMillis() - startTime;

            log.info("Successfully connected to LDAP server at {} ({}ms)", ldapUrl, responseTime);

            return TestConnectionResponse.success(
                "Successfully connected and authenticated to LDAP server",
                ConnectionDetails.ldap(responseTime)
            );

        } catch (Exception e) {
            log.warn("Failed to connect to LDAP server at {}: {}", ldapUrl, e.getMessage());
            return TestConnectionResponse.failure(
                "Failed to connect to LDAP server",
                e.getMessage()
            );
        }
    }

    // =========================================================================
    // Validation Helpers
    // =========================================================================

    private void validateOidcConfig(ProviderConfigRequest request, List<String> errors) {
        if (isBlank(request.clientId())) {
            errors.add("Client ID is required for OIDC");
        }
        if (isBlank(request.discoveryUrl())) {
            errors.add("Discovery URL is required for OIDC");
        }
    }

    private void validateOAuth2Config(ProviderConfigRequest request, List<String> errors) {
        if (isBlank(request.clientId())) {
            errors.add("Client ID is required for OAuth2");
        }
        if (isBlank(request.authorizationUrl()) && isBlank(request.tokenUrl())) {
            errors.add("Authorization URL or Token URL is required for OAuth2");
        }
    }

    private void validateSamlConfig(ProviderConfigRequest request, List<String> errors) {
        if (isBlank(request.metadataUrl())) {
            errors.add("Metadata URL is required for SAML");
        }
    }

    private void validateLdapConfig(ProviderConfigRequest request, List<String> errors) {
        if (isBlank(request.serverUrl())) {
            errors.add("Server URL is required for LDAP");
        }
        if (isBlank(request.userSearchBase())) {
            errors.add("User search base is required for LDAP");
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private String extractEntityId(String metadata) {
        // Simple extraction - in production, use proper XML parsing
        int start = metadata.indexOf("entityID=\"");
        if (start == -1) {
            start = metadata.indexOf("entityID='");
        }
        if (start != -1) {
            start += 10;
            int end = metadata.indexOf("\"", start);
            if (end == -1) {
                end = metadata.indexOf("'", start);
            }
            if (end > start) {
                return metadata.substring(start, end);
            }
        }
        return null;
    }
}
