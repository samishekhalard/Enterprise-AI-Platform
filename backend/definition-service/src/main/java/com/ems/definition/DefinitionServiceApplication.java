package com.ems.definition;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.autoconfigure.jdbc.DataSourceTransactionManagerAutoConfiguration;
import org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration;

/**
 * Definition Service Application.
 *
 * Manages master type definitions and metadata contracts for the EMS platform.
 * Uses Neo4j as the primary data store — JDBC/JPA auto-config is explicitly
 * excluded because ems-common pulls those starters onto the classpath.
 */
@SpringBootApplication(exclude = {
    DataSourceAutoConfiguration.class,
    DataSourceTransactionManagerAutoConfiguration.class,
    HibernateJpaAutoConfiguration.class,
})
public class DefinitionServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(DefinitionServiceApplication.class, args);
    }
}
