package com.ems.auth.config;

import com.ems.auth.tenant.TenantAwareAuthDatabaseSelectionProvider;
import org.neo4j.cypherdsl.core.renderer.Dialect;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.neo4j.config.EnableNeo4jAuditing;
import org.springframework.data.neo4j.core.DatabaseSelectionProvider;
import org.springframework.data.neo4j.repository.config.EnableNeo4jRepositories;
import org.springframework.transaction.annotation.EnableTransactionManagement;

/**
 * Neo4j Configuration for the Identity Graph.
 *
 * Configures Spring Data Neo4j for managing the identity graph:
 * - Tenants, Providers, Protocols, Configs
 * - Users, Groups, Roles
 *
 * Activation:
 * This configuration is activated when auth.dynamic-broker.storage=neo4j (default).
 */
@Configuration
@ConditionalOnProperty(name = "auth.dynamic-broker.storage", havingValue = "neo4j", matchIfMissing = true)
@EnableNeo4jRepositories(basePackages = "com.ems.auth.graph.repository")
@EnableNeo4jAuditing
@EnableTransactionManagement
public class Neo4jConfig {

    private final AuthGraphPerTenantProperties graphPerTenantProperties;

    public Neo4jConfig(AuthGraphPerTenantProperties graphPerTenantProperties) {
        this.graphPerTenantProperties = graphPerTenantProperties;
    }

    /**
     * Configure Neo4j Cypher DSL to use Neo4j 5 dialect.
     *
     * @return Configuration with Neo4j 5 dialect
     */
    @Bean
    org.neo4j.cypherdsl.core.renderer.Configuration cypherDslConfiguration() {
        return org.neo4j.cypherdsl.core.renderer.Configuration.newConfig()
            .withDialect(Dialect.NEO4J_5)
            .build();
    }

    @Bean
    DatabaseSelectionProvider databaseSelectionProvider() {
        return new TenantAwareAuthDatabaseSelectionProvider(graphPerTenantProperties);
    }
}
