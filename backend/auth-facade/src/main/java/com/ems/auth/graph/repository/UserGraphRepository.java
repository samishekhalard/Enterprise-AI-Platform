package com.ems.auth.graph.repository;

import com.ems.auth.graph.entity.UserNode;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Neo4j Repository for User nodes in the identity graph.
 *
 * Provides queries for user lookup with relationship traversal
 * (roles via HAS_ROLE, groups via MEMBER_OF).
 */
@Repository
public interface UserGraphRepository extends Neo4jRepository<UserNode, String> {

    /**
     * Find a user by ID and tenant, including group and role relationships.
     *
     * @param userId   The user identifier
     * @param tenantId The tenant identifier
     * @return Optional containing the user node if found
     */
    @Query("""
        MATCH (u:User {id: $userId, tenantId: $tenantId})
        OPTIONAL MATCH (u)-[:MEMBER_OF]->(g:Group)
        OPTIONAL MATCH (u)-[:HAS_ROLE]->(r:Role)
        RETURN u, collect(DISTINCT g) as groups, collect(DISTINCT r) as directRoles
        """)
    Optional<UserNode> findByIdAndTenantId(
        @Param("userId") String userId,
        @Param("tenantId") String tenantId
    );

    /**
     * Find all users for a tenant.
     *
     * @param tenantId The tenant identifier
     * @return List of user nodes
     */
    @Query("""
        MATCH (u:User {tenantId: $tenantId})
        OPTIONAL MATCH (u)-[:MEMBER_OF]->(g:Group)
        OPTIONAL MATCH (u)-[:HAS_ROLE]->(r:Role)
        RETURN u, collect(DISTINCT g) as groups, collect(DISTINCT r) as directRoles
        """)
    List<UserNode> findAllByTenantId(@Param("tenantId") String tenantId);
}
