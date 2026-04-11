package com.ems.definition.repository;

import com.ems.definition.node.AttributeTypeNode;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data Neo4j repository for AttributeTypeNode.
 *
 * Provides tenant-scoped CRUD operations for attribute type definitions.
 */
@Repository
public interface AttributeTypeRepository extends Neo4jRepository<AttributeTypeNode, String> {

    /**
     * Find all AttributeTypes for a tenant.
     *
     * @param tenantId the tenant UUID
     * @return list of attribute types
     */
    List<AttributeTypeNode> findByTenantId(String tenantId);

    /**
     * Find an AttributeType by ID and tenantId.
     *
     * @param id       the attribute type UUID
     * @param tenantId the tenant UUID
     * @return the attribute type, if found within the tenant
     */
    Optional<AttributeTypeNode> findByIdAndTenantId(String id, String tenantId);
}
