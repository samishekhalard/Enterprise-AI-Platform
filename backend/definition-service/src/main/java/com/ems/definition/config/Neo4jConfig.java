package com.ems.definition.config;

import org.neo4j.cypherdsl.core.renderer.Dialect;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.neo4j.config.EnableNeo4jAuditing;
import org.springframework.data.neo4j.repository.config.EnableNeo4jRepositories;
import org.springframework.transaction.annotation.EnableTransactionManagement;

/**
 * Neo4j Configuration for the Definition Graph.
 *
 * Configures Spring Data Neo4j for managing the type-definition graph:
 * - ObjectTypes, AttributeTypes
 * - HAS_ATTRIBUTE relationships
 * - CAN_CONNECT_TO relationships
 * - IS_SUBTYPE_OF relationships
 */
@Configuration
@EnableNeo4jRepositories(basePackages = "com.ems.definition.repository")
@EnableNeo4jAuditing
@EnableTransactionManagement
public class Neo4jConfig {

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
}
