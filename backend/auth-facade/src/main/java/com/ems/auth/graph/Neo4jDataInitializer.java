package com.ems.auth.graph;

import com.ems.auth.domain.ProtocolType;
import com.ems.auth.domain.ProviderType;
import com.ems.auth.graph.repository.AuthGraphRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Instant;
import java.util.Map;

/**
 * Neo4j Data Initializer for Identity Graph.
 *
 * Initializes seed data in Neo4j including:
 * - Default providers (Keycloak, Google, Microsoft, etc.)
 * - Standard protocols (OIDC, SAML, LDAP, OAUTH2)
 * - Master tenant
 *
 * Only runs when auth.dynamic-broker.storage=neo4j and
 * auth.dynamic-broker.init-data=true.
 */
@Configuration
@ConditionalOnProperty(name = "auth.dynamic-broker.storage", havingValue = "neo4j", matchIfMissing = true)
@RequiredArgsConstructor
@Slf4j
public class Neo4jDataInitializer {

    private final AuthGraphRepository repository;

    /**
     * Initialize seed data on application startup.
     */
    @Bean
    @ConditionalOnProperty(name = "auth.dynamic-broker.init-data", havingValue = "true", matchIfMissing = false)
    CommandLineRunner initNeo4jData() {
        return args -> {
            log.info("Initializing Neo4j seed data for identity graph...");

            initializeProtocols();
            initializeProviders();
            initializeMasterTenant();

            log.info("Neo4j seed data initialization complete");
        };
    }

    /**
     * Initialize standard authentication protocols.
     */
    private void initializeProtocols() {
        log.debug("Initializing authentication protocols...");

        // OIDC Protocol
        repository.linkProviderToProtocol(ProviderType.KEYCLOAK.name(), ProtocolType.OIDC.name());
        repository.linkProviderToProtocol(ProviderType.AUTH0.name(), ProtocolType.OIDC.name());
        repository.linkProviderToProtocol(ProviderType.OKTA.name(), ProtocolType.OIDC.name());
        repository.linkProviderToProtocol(ProviderType.AZURE_AD.name(), ProtocolType.OIDC.name());
        repository.linkProviderToProtocol(ProviderType.GOOGLE.name(), ProtocolType.OIDC.name());
        repository.linkProviderToProtocol(ProviderType.MICROSOFT.name(), ProtocolType.OIDC.name());

        // SAML Protocol
        repository.linkProviderToProtocol(ProviderType.SAML_GENERIC.name(), ProtocolType.SAML.name());

        // LDAP Protocol
        repository.linkProviderToProtocol(ProviderType.LDAP_GENERIC.name(), ProtocolType.LDAP.name());

        // OAuth2 Protocol
        repository.linkProviderToProtocol(ProviderType.GITHUB.name(), ProtocolType.OAUTH2.name());

        log.debug("Authentication protocols initialized");
    }

    /**
     * Initialize default identity providers.
     */
    private void initializeProviders() {
        log.debug("Initializing identity providers...");

        ensureProvider(ProviderType.KEYCLOAK.name(), "Keycloak", "Red Hat");
        ensureProvider(ProviderType.AUTH0.name(), "Auth0", "Okta");
        ensureProvider(ProviderType.OKTA.name(), "Okta", "Okta");
        ensureProvider(ProviderType.AZURE_AD.name(), "Azure Active Directory", "Microsoft");
        ensureProvider(ProviderType.GOOGLE.name(), "Google", "Google");
        ensureProvider(ProviderType.MICROSOFT.name(), "Microsoft Account", "Microsoft");
        ensureProvider(ProviderType.GITHUB.name(), "GitHub", "Microsoft");
        ensureProvider(ProviderType.UAE_PASS.name(), "UAE Pass", "UAE Government");
        ensureProvider(ProviderType.SAML_GENERIC.name(), "SAML Provider", "Generic");
        ensureProvider(ProviderType.LDAP_GENERIC.name(), "LDAP Server", "Generic");

        log.debug("Identity providers initialized");
    }

    /**
     * Initialize master tenant.
     */
    private void initializeMasterTenant() {
        log.debug("Initializing master tenant...");

        Instant now = Instant.now();
        Map<String, Object> tenantProps = Map.of(
            "id", "master",
            "domain", "localhost",
            "name", "Master Tenant",
            "active", true,
            "createdAt", now,
            "updatedAt", now
        );

        // Only create if not exists
        if (repository.findById("master").isEmpty()) {
            repository.createTenant(tenantProps);
            log.info("Master tenant created");
        } else {
            log.debug("Master tenant already exists");
        }
    }

    /**
     * Ensure a provider exists with the given properties.
     */
    private void ensureProvider(String name, String displayName, String vendor) {
        Map<String, Object> props = Map.of(
            "displayName", displayName,
            "vendor", vendor
        );
        repository.ensureProvider(name, props);
    }
}
