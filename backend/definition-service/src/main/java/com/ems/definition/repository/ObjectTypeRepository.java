package com.ems.definition.repository;

import com.ems.definition.node.ObjectTypeNode;
import org.springframework.data.domain.Pageable;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data Neo4j repository for ObjectTypeNode.
 *
 * Provides tenant-scoped CRUD operations for object type definitions.
 */
@Repository
public interface ObjectTypeRepository extends Neo4jRepository<ObjectTypeNode, String> {

    /**
     * Find an ObjectType by ID and tenantId.
     *
     * @param id       the object type UUID
     * @param tenantId the tenant UUID
     * @return the object type, if found within the tenant
     */
    Optional<ObjectTypeNode> findByIdAndTenantId(String id, String tenantId);

    /**
     * Find all ObjectTypes for a tenant, with pagination.
     *
     * @param tenantId the tenant UUID
     * @param pageable pagination parameters
     * @return paginated list of object types
     */
    List<ObjectTypeNode> findByTenantId(String tenantId, Pageable pageable);

    /**
     * Check if a typeKey already exists within a tenant.
     *
     * @param typeKey  the type key to check
     * @param tenantId the tenant UUID
     * @return true if the typeKey is already in use
     */
    boolean existsByTypeKeyAndTenantId(String typeKey, String tenantId);

    /**
     * Count all ObjectTypes for a tenant.
     *
     * @param tenantId the tenant UUID
     * @return the total count
     */
    long countByTenantId(String tenantId);
}
