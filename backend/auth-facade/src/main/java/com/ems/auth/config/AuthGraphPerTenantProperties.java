package com.ems.auth.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "auth.graph-per-tenant")
@Getter
@Setter
public class AuthGraphPerTenantProperties {

    /**
     * Enables tenant-aware Neo4j database routing and provisioning in auth-facade.
     * Default stays false so the existing shared-graph runtime remains stable until cutover.
     */
    private boolean enabled = false;

    /**
     * Valkey key prefix for cached routing metadata.
     */
    private String routingCachePrefix = "tenant:routing:";

    /**
     * TTL for routing metadata cache entries.
     */
    private long routingCacheTtlMinutes = 5;

    /**
     * Neo4j system database used for CREATE DATABASE and status checks.
     */
    private String systemDatabase = "system";
}
