package com.ems.auth.graph.repository;

import com.ems.auth.graph.entity.ConfigNode;
import com.ems.auth.graph.entity.ProviderNode;
import com.ems.auth.graph.entity.TenantNode;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

/**
 * Neo4j Repository for the Identity Graph.
 *
 * This repository provides Cypher queries for:
 * - Provider configuration resolution per tenant
 * - Deep role lookup with inheritance
 * - User and group management
 *
 * The identity graph structure:
 * (Tenant)-[:USES]->(Provider)-[:SUPPORTS]->(Protocol)
 * (Tenant)-[:CONFIGURED_WITH]->(Config)<-[:HAS_CONFIG]-(Provider)
 * (User)-[:MEMBER_OF*0..]->(Group)-[:HAS_ROLE]->(Role)-[:INHERITS_FROM*0..]->(Role)
 */
@Repository
public interface AuthGraphRepository extends Neo4jRepository<TenantNode, String> {

    // ==========================================================================
    // Provider Configuration Queries
    // ==========================================================================

    /**
     * Find provider configuration for a tenant.
     *
     * Matches the tenant, provider, and associated config node.
     * Returns the full config with protocol information.
     *
     * @param tenantId The tenant identifier
     * @param providerName The provider name
     * @return Optional containing the config node if found
     */
    @Query("""
        MATCH (t:Tenant {id: $tenantId})-[:USES]->(p:Provider {name: $providerName})
        MATCH (p)-[:SUPPORTS]->(proto:Protocol)
        MATCH (t)-[:CONFIGURED_WITH]->(c:Config)<-[:HAS_CONFIG]-(p)
        WHERE c.enabled = true
        RETURN c
        """)
    Optional<ConfigNode> findProviderConfig(
        @Param("tenantId") String tenantId,
        @Param("providerName") String providerName
    );

    /**
     * Find provider configuration by ID.
     *
     * @param tenantId The tenant identifier
     * @param configId The configuration ID
     * @return Optional containing the config node if found
     */
    @Query("""
        MATCH (t:Tenant {id: $tenantId})-[:CONFIGURED_WITH]->(c:Config {id: $configId})
        RETURN c
        """)
    Optional<ConfigNode> findConfigById(
        @Param("tenantId") String tenantId,
        @Param("configId") String configId
    );

    /**
     * List all providers for a tenant.
     *
     * Returns providers with their protocol and configuration info.
     *
     * @param tenantId The tenant identifier
     * @return List of provider nodes
     */
    @Query("""
        MATCH (t:Tenant {id: $tenantId})-[:USES]->(p:Provider)
        MATCH (p)-[:SUPPORTS]->(proto:Protocol)
        OPTIONAL MATCH (t)-[:CONFIGURED_WITH]->(c:Config)<-[:HAS_CONFIG]-(p)
        RETURN p, collect(proto) as protocols, collect(c) as configs
        """)
    List<ProviderNode> findAllProvidersByTenant(@Param("tenantId") String tenantId);

    /**
     * List all enabled configurations for a tenant.
     *
     * @param tenantId The tenant identifier
     * @return List of enabled config nodes
     */
    @Query("""
        MATCH (t:Tenant {id: $tenantId})-[:CONFIGURED_WITH]->(c:Config)
        WHERE c.enabled = true
        RETURN c
        ORDER BY c.priority ASC
        """)
    List<ConfigNode> findAllEnabledConfigsByTenant(@Param("tenantId") String tenantId);

    /**
     * List all configurations for a tenant (including disabled).
     *
     * @param tenantId The tenant identifier
     * @return List of all config nodes
     */
    @Query("""
        MATCH (t:Tenant {id: $tenantId})-[:CONFIGURED_WITH]->(c:Config)
        RETURN c
        ORDER BY c.priority ASC
        """)
    List<ConfigNode> findAllConfigsByTenant(@Param("tenantId") String tenantId);

    // ==========================================================================
    // Role and Permission Queries
    // ==========================================================================

    /**
     * Deep role lookup with inheritance.
     *
     * Traverses the following paths:
     * 1. User's direct roles
     * 2. Roles from groups the user is a member of
     * 3. Roles inherited from parent roles (transitive)
     *
     * @param email The user's email address
     * @return Set of effective role names
     */
    @Query("""
        MATCH (u:User {email: $email})-[:MEMBER_OF*0..]->(groupOrUser)
        MATCH (groupOrUser)-[:HAS_ROLE]->(rootRole:Role)
        MATCH (rootRole)-[:INHERITS_FROM*0..]->(effectiveRole:Role)
        RETURN DISTINCT effectiveRole.name
        """)
    Set<String> findEffectiveRoles(@Param("email") String email);

    /**
     * Deep role lookup by user ID.
     *
     * @param userId The user's unique identifier
     * @return Set of effective role names
     */
    @Query("""
        MATCH (u:User {id: $userId})-[:MEMBER_OF*0..]->(groupOrUser)
        MATCH (groupOrUser)-[:HAS_ROLE]->(rootRole:Role)
        MATCH (rootRole)-[:INHERITS_FROM*0..]->(effectiveRole:Role)
        RETURN DISTINCT effectiveRole.name
        """)
    Set<String> findEffectiveRolesById(@Param("userId") String userId);

    /**
     * Find effective roles for a user within a specific tenant.
     *
     * @param email The user's email address
     * @param tenantId The tenant identifier
     * @return Set of effective role names
     */
    @Query("""
        MATCH (u:User {email: $email, tenantId: $tenantId})-[:MEMBER_OF*0..]->(groupOrUser)
        MATCH (groupOrUser)-[:HAS_ROLE]->(rootRole:Role)
        WHERE rootRole.tenantId = $tenantId OR rootRole.tenantId IS NULL
        MATCH (rootRole)-[:INHERITS_FROM*0..]->(effectiveRole:Role)
        RETURN DISTINCT effectiveRole.name
        """)
    Set<String> findEffectiveRolesForTenant(
        @Param("email") String email,
        @Param("tenantId") String tenantId
    );

    // ==========================================================================
    // Provider Configuration Management
    // ==========================================================================

    /**
     * Create tenant-provider relationship with configuration.
     *
     * Creates or updates:
     * - USES relationship between Tenant and Provider
     * - Config node with properties
     * - CONFIGURED_WITH relationship from Tenant to Config
     * - HAS_CONFIG relationship from Provider to Config
     *
     * @param tenantId The tenant identifier
     * @param providerName The provider name
     * @param configProps Map of configuration properties
     * @return The created config node
     */
    @Query("""
        MATCH (t:Tenant {id: $tenantId})
        MATCH (p:Provider {name: $providerName})
        MERGE (t)-[:USES]->(p)
        CREATE (c:Config $configProps)
        CREATE (t)-[:CONFIGURED_WITH]->(c)
        CREATE (p)-[:HAS_CONFIG]->(c)
        RETURN c
        """)
    ConfigNode createProviderConfig(
        @Param("tenantId") String tenantId,
        @Param("providerName") String providerName,
        @Param("configProps") Map<String, Object> configProps
    );

    /**
     * Create tenant-provider configuration without entity mapping return.
     * Used by bootstrap/self-healing flows to avoid SDN mapping mismatches.
     */
    @Query("""
        MATCH (t:Tenant {id: $tenantId})
        MATCH (p:Provider {name: $providerName})
        MERGE (t)-[:USES]->(p)
        CREATE (c:Config $configProps)
        CREATE (t)-[:CONFIGURED_WITH]->(c)
        CREATE (p)-[:HAS_CONFIG]->(c)
        """)
    void createProviderConfigWithoutReturn(
        @Param("tenantId") String tenantId,
        @Param("providerName") String providerName,
        @Param("configProps") Map<String, Object> configProps
    );

    /**
     * Update provider configuration.
     *
     * @param configId The configuration ID
     * @param configProps Map of updated configuration properties
     * @return The updated config node
     */
    @Query("""
        MATCH (c:Config {id: $configId})
        SET c += $configProps
        RETURN c
        """)
    ConfigNode updateProviderConfig(
        @Param("configId") String configId,
        @Param("configProps") Map<String, Object> configProps
    );

    /**
     * Delete provider configuration.
     *
     * Removes the config node and all relationships to it.
     *
     * @param tenantId The tenant identifier
     * @param configId The configuration ID
     */
    @Query("""
        MATCH (t:Tenant {id: $tenantId})-[:CONFIGURED_WITH]->(c:Config {id: $configId})
        DETACH DELETE c
        """)
    void deleteProviderConfig(
        @Param("tenantId") String tenantId,
        @Param("configId") String configId
    );

    /**
     * Check if a provider exists for a tenant.
     *
     * @param tenantId The tenant identifier
     * @param providerName The provider name
     * @return true if the provider is configured for the tenant
     */
    @Query("""
        MATCH (t:Tenant {id: $tenantId})-[:USES]->(p:Provider {name: $providerName})
        RETURN count(p) > 0
        """)
    boolean providerExistsForTenant(
        @Param("tenantId") String tenantId,
        @Param("providerName") String providerName
    );

    // ==========================================================================
    // Tenant Management
    // ==========================================================================

    /**
     * Create or update a tenant node.
     *
     * @param tenantProps Map of tenant properties
     */
    @Query("""
        MERGE (t:Tenant {id: $tenantProps.id})
        SET t += $tenantProps
        """)
    void createTenant(@Param("tenantProps") Map<String, Object> tenantProps);

    /**
     * Find tenant by domain.
     *
     * @param domain The tenant's domain
     * @return Optional containing the tenant if found
     */
    @Query("""
        MATCH (t:Tenant {domain: $domain})
        RETURN t
        """)
    Optional<TenantNode> findTenantByDomain(@Param("domain") String domain);

    /**
     * Check if a tenant node exists by tenant ID.
     *
     * @param tenantId The tenant identifier
     * @return true if tenant exists
     */
    @Query("""
        MATCH (t:Tenant {id: $tenantId})
        RETURN count(t) > 0
        """)
    boolean tenantExists(@Param("tenantId") String tenantId);

    // ==========================================================================
    // Provider Management
    // ==========================================================================

    /**
     * Create or ensure a provider exists.
     *
     * @param providerProps Map of provider properties
     */
    @Query("""
        MERGE (p:Provider {name: $name})
        SET p += $providerProps
        """)
    void ensureProvider(
        @Param("name") String name,
        @Param("providerProps") Map<String, Object> providerProps
    );

    /**
     * Link a provider to a protocol.
     *
     * @param providerName The provider name
     * @param protocolType The protocol type
     */
    @Query("""
        MATCH (p:Provider {name: $providerName})
        MERGE (proto:Protocol {type: $protocolType})
        MERGE (p)-[:SUPPORTS]->(proto)
        """)
    void linkProviderToProtocol(
        @Param("providerName") String providerName,
        @Param("protocolType") String protocolType
    );
}
