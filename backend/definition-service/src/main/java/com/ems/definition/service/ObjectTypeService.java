package com.ems.definition.service;

import com.ems.definition.dto.AddAttributeRequest;
import com.ems.definition.dto.AddConnectionRequest;
import com.ems.definition.dto.AttributeTypeCreateRequest;
import com.ems.definition.dto.AttributeTypeDTO;
import com.ems.definition.dto.ObjectTypeCreateRequest;
import com.ems.definition.dto.ObjectTypeDTO;
import com.ems.definition.dto.ObjectTypeUpdateRequest;
import com.ems.definition.dto.PagedResponse;

import java.util.List;

/**
 * Service interface for managing ObjectType and AttributeType definitions.
 */
public interface ObjectTypeService {

    /**
     * List object types for a tenant with optional search and status filtering.
     *
     * @param tenantId the tenant UUID
     * @param page     page number (0-based)
     * @param size     page size
     * @param search   optional search term (filters on name and typeKey)
     * @param status   optional status filter
     * @return paged response of object types
     */
    PagedResponse<ObjectTypeDTO> listObjectTypes(String tenantId, int page, int size, String search, String status);

    /**
     * Create a new object type.
     *
     * @param tenantId the tenant UUID
     * @param request  creation request
     * @return the created object type
     */
    ObjectTypeDTO createObjectType(String tenantId, ObjectTypeCreateRequest request);

    /**
     * Get an object type by ID.
     *
     * @param tenantId the tenant UUID
     * @param id       the object type UUID
     * @return the object type
     */
    ObjectTypeDTO getObjectType(String tenantId, String id);

    /**
     * Update an existing object type.
     *
     * @param tenantId the tenant UUID
     * @param id       the object type UUID
     * @param request  update request (nullable fields for partial update)
     * @return the updated object type
     */
    ObjectTypeDTO updateObjectType(String tenantId, String id, ObjectTypeUpdateRequest request);

    /**
     * Delete an object type.
     *
     * @param tenantId the tenant UUID
     * @param id       the object type UUID
     */
    void deleteObjectType(String tenantId, String id);

    /**
     * Add an attribute to an object type.
     *
     * @param tenantId     the tenant UUID
     * @param objectTypeId the object type UUID
     * @param request      the attribute addition request
     * @return the updated object type
     */
    ObjectTypeDTO addAttribute(String tenantId, String objectTypeId, AddAttributeRequest request);

    /**
     * Remove an attribute from an object type.
     *
     * @param tenantId        the tenant UUID
     * @param objectTypeId    the object type UUID
     * @param attributeTypeId the attribute type UUID to remove
     */
    void removeAttribute(String tenantId, String objectTypeId, String attributeTypeId);

    /**
     * Add a connection (CAN_CONNECT_TO) from one object type to another.
     *
     * @param tenantId     the tenant UUID
     * @param objectTypeId the source object type UUID
     * @param request      the connection addition request
     * @return the updated object type
     */
    ObjectTypeDTO addConnection(String tenantId, String objectTypeId, AddConnectionRequest request);

    /**
     * Remove a connection from an object type.
     *
     * @param tenantId     the tenant UUID
     * @param objectTypeId the source object type UUID
     * @param targetId     the target object type UUID to disconnect
     */
    void removeConnection(String tenantId, String objectTypeId, String targetId);

    /**
     * Duplicate an object type (creates a copy with state=user_defined).
     *
     * @param tenantId the tenant UUID
     * @param id       the object type UUID to duplicate
     * @return the new (duplicate) object type
     */
    ObjectTypeDTO duplicateObjectType(String tenantId, String id);

    /**
     * Restore a customized object type back to default state.
     *
     * @param tenantId the tenant UUID
     * @param id       the object type UUID (must have state=customized)
     * @return the updated object type
     */
    ObjectTypeDTO restoreObjectType(String tenantId, String id);

    /**
     * List all attribute types for a tenant.
     *
     * @param tenantId the tenant UUID
     * @return list of attribute types
     */
    List<AttributeTypeDTO> listAttributeTypes(String tenantId);

    /**
     * Create a new attribute type.
     *
     * @param tenantId the tenant UUID
     * @param request  creation request
     * @return the created attribute type
     */
    AttributeTypeDTO createAttributeType(String tenantId, AttributeTypeCreateRequest request);
}
