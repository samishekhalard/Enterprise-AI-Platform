package com.ems.process.service;

import com.ems.process.dto.BpmnElementTypeDTO;
import com.ems.process.dto.BpmnElementTypeListResponse;

import java.util.List;
import java.util.Optional;

/**
 * Service for managing BPMN element type definitions.
 */
public interface BpmnElementTypeService {

    /**
     * Get all element types for a tenant (with fallback to system defaults).
     * Results are cached for performance.
     *
     * @param tenantId tenant ID (can be null for system defaults only)
     * @return list response with elements and CSS variables
     */
    BpmnElementTypeListResponse getAllElementTypes(String tenantId);

    /**
     * Get element types by category.
     *
     * @param category the category (task, event, gateway, data, artifact, flow)
     * @param tenantId tenant ID (can be null for system defaults only)
     * @return list of element types in the category
     */
    List<BpmnElementTypeDTO> getElementTypesByCategory(String category, String tenantId);

    /**
     * Get a specific element type by code.
     *
     * @param code the BPMN element type code (e.g., "bpmn:Task")
     * @param tenantId tenant ID (can be null for system defaults)
     * @return the element type if found
     */
    Optional<BpmnElementTypeDTO> getElementTypeByCode(String code, String tenantId);

    /**
     * Invalidate cache for a tenant.
     *
     * @param tenantId tenant ID to invalidate cache for
     */
    void invalidateCache(String tenantId);
}
