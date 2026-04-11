package com.ems.process.service;

import com.ems.process.dto.BpmnElementTypeDTO;
import com.ems.process.dto.BpmnElementTypeListResponse;
import com.ems.process.entity.BpmnElementTypeEntity;
import com.ems.process.mapper.BpmnElementTypeMapper;
import com.ems.process.repository.BpmnElementTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class BpmnElementTypeServiceImpl implements BpmnElementTypeService {

    private final BpmnElementTypeRepository repository;
    private final BpmnElementTypeMapper mapper;

    @Override
    @Cacheable(value = "bpmnElementTypes", key = "#tenantId ?: 'system'")
    public BpmnElementTypeListResponse getAllElementTypes(String tenantId) {
        log.debug("Fetching BPMN element types for tenant: {}", tenantId);

        List<BpmnElementTypeEntity> entities;
        if (tenantId == null || tenantId.isBlank()) {
            entities = repository.findAllSystemDefaults();
        } else {
            entities = repository.findAllForTenant(tenantId);
        }

        List<BpmnElementTypeDTO> dtos = entities.stream()
                .map(mapper::toDTO)
                .collect(Collectors.toList());

        Map<String, String> cssVariables = generateCssVariables(entities);

        return BpmnElementTypeListResponse.builder()
                .elements(dtos)
                .cssVariables(cssVariables)
                .total(dtos.size())
                .build();
    }

    @Override
    @Cacheable(value = "bpmnElementTypesByCategory", key = "#category + '_' + (#tenantId ?: 'system')")
    public List<BpmnElementTypeDTO> getElementTypesByCategory(String category, String tenantId) {
        log.debug("Fetching BPMN element types for category: {} and tenant: {}", category, tenantId);

        // For simplicity, filter from all elements
        return getAllElementTypes(tenantId).elements().stream()
                .filter(e -> category.equalsIgnoreCase(e.category()))
                .collect(Collectors.toList());
    }

    @Override
    public Optional<BpmnElementTypeDTO> getElementTypeByCode(String code, String tenantId) {
        log.debug("Fetching BPMN element type by code: {} for tenant: {}", code, tenantId);

        if (tenantId == null || tenantId.isBlank()) {
            return repository.findByCodeAndTenantIdIsNull(code)
                    .map(mapper::toDTO);
        }
        return repository.findByCodeForTenant(code, tenantId)
                .map(mapper::toDTO);
    }

    @Override
    @CacheEvict(value = {"bpmnElementTypes", "bpmnElementTypesByCategory"}, allEntries = true)
    public void invalidateCache(String tenantId) {
        log.info("Invalidating BPMN element types cache for tenant: {}", tenantId);
    }

    /**
     * Generate CSS variables from element types for frontend styling.
     * Creates variables like --bpmn-task-stroke: #1E88E5;
     */
    private Map<String, String> generateCssVariables(List<BpmnElementTypeEntity> entities) {
        Map<String, String> variables = new LinkedHashMap<>();

        for (BpmnElementTypeEntity entity : entities) {
            String prefix = "--bpmn-" + sanitizeCssName(entity.getCategory());
            if (entity.getSubCategory() != null && !entity.getSubCategory().isBlank()) {
                prefix += "-" + sanitizeCssName(entity.getSubCategory());
            }

            // Add stroke color
            variables.put(prefix + "-stroke", entity.getStrokeColor());
            // Add fill color
            variables.put(prefix + "-fill", entity.getFillColor());
            // Add stroke width
            variables.put(prefix + "-stroke-width", entity.getStrokeWidth() + "px");
        }

        // Add category-level defaults based on first element of each category
        Map<String, BpmnElementTypeEntity> categoryDefaults = entities.stream()
                .collect(Collectors.toMap(
                        BpmnElementTypeEntity::getCategory,
                        e -> e,
                        (existing, replacement) -> existing,
                        LinkedHashMap::new
                ));

        for (Map.Entry<String, BpmnElementTypeEntity> entry : categoryDefaults.entrySet()) {
            String prefix = "--bpmn-" + sanitizeCssName(entry.getKey());
            BpmnElementTypeEntity entity = entry.getValue();
            variables.putIfAbsent(prefix + "-stroke", entity.getStrokeColor());
            variables.putIfAbsent(prefix + "-fill", entity.getFillColor());
        }

        return variables;
    }

    /**
     * Sanitize a string for use as a CSS variable name.
     */
    private String sanitizeCssName(String name) {
        if (name == null) return "";
        return name.toLowerCase()
                .replaceAll("[^a-z0-9]", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
    }
}
