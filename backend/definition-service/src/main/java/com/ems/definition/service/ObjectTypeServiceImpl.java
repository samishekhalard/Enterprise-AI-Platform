package com.ems.definition.service;

import com.ems.definition.dto.AddAttributeRequest;
import com.ems.definition.dto.AddConnectionRequest;
import com.ems.definition.dto.AttributeTypeCreateRequest;
import com.ems.definition.dto.AttributeTypeDTO;
import com.ems.definition.dto.AttributeTypeUpdateRequest;
import com.ems.definition.dto.ConnectionDTO;
import com.ems.definition.dto.ObjectTypeCreateRequest;
import com.ems.definition.dto.ObjectTypeDTO;
import com.ems.definition.dto.ObjectTypeUpdateRequest;
import com.ems.definition.dto.PagedResponse;
import com.ems.definition.node.AttributeTypeNode;
import com.ems.definition.node.ObjectTypeNode;
import com.ems.definition.node.relationship.CanConnectToRelationship;
import com.ems.definition.node.relationship.HasAttributeRelationship;
import com.ems.definition.repository.AttributeTypeRepository;
import com.ems.definition.repository.ObjectTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Implementation of {@link ObjectTypeService}.
 *
 * Manages ObjectType and AttributeType definitions in Neo4j
 * with tenant isolation enforced on every operation.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class ObjectTypeServiceImpl implements ObjectTypeService {

    private final ObjectTypeRepository objectTypeRepository;
    private final AttributeTypeRepository attributeTypeRepository;

    @Override
    public PagedResponse<ObjectTypeDTO> listObjectTypes(String tenantId, int page, int size, String search, String status) {
        log.debug("Listing object types for tenant={}, page={}, size={}, search={}, status={}",
                tenantId, page, size, search, status);

        long totalElements = objectTypeRepository.countByTenantId(tenantId);
        List<ObjectTypeNode> nodes = objectTypeRepository.findByTenantId(tenantId, PageRequest.of(page, size));

        // Apply in-memory filtering for search and status
        List<ObjectTypeDTO> filtered = nodes.stream()
                .filter(node -> matchesSearch(node, search))
                .filter(node -> matchesStatus(node, status))
                .map(this::toDTO)
                .collect(Collectors.toList());

        // When filtering is applied, total may differ from DB count
        long effectiveTotal = (search != null || status != null) ? filtered.size() : totalElements;

        return PagedResponse.of(filtered, page, size, effectiveTotal);
    }

    @Override
    @Transactional
    public ObjectTypeDTO createObjectType(String tenantId, ObjectTypeCreateRequest request) {
        log.info("Creating object type name={} for tenant={}", request.name(), tenantId);

        // Validate typeKey uniqueness within tenant
        String typeKey = resolveTypeKey(request.name(), request.typeKey());
        if (objectTypeRepository.existsByTypeKeyAndTenantId(typeKey, tenantId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "TypeKey '" + typeKey + "' already exists for this tenant");
        }

        // Auto-generate code if not provided
        String code = request.code();
        if (code == null || code.isBlank()) {
            long count = objectTypeRepository.countByTenantId(tenantId);
            code = String.format("OBJ_%03d", count + 1);
        }

        Instant now = Instant.now();
        ObjectTypeNode node = ObjectTypeNode.builder()
                .id(UUID.randomUUID().toString())
                .tenantId(tenantId)
                .name(request.name())
                .typeKey(typeKey)
                .code(code)
                .description(request.description())
                .iconName(request.iconName() != null ? request.iconName() : "box")
                .iconColor(request.iconColor() != null ? request.iconColor() : "#428177")
                .status(request.status() != null ? request.status() : "active")
                .state(request.state() != null ? request.state() : "user_defined")
                .createdAt(now)
                .updatedAt(now)
                .attributes(new ArrayList<>())
                .connections(new ArrayList<>())
                .build();

        ObjectTypeNode saved = objectTypeRepository.save(node);
        log.info("Created object type id={} typeKey={} for tenant={}", saved.getId(), saved.getTypeKey(), tenantId);

        return toDTO(saved);
    }

    @Override
    public ObjectTypeDTO getObjectType(String tenantId, String id) {
        log.debug("Getting object type id={} for tenant={}", id, tenantId);

        ObjectTypeNode node = findObjectTypeOrThrow(tenantId, id);
        return toDTO(node);
    }

    @Override
    @Transactional
    public ObjectTypeDTO updateObjectType(String tenantId, String id, ObjectTypeUpdateRequest request) {
        log.info("Updating object type id={} for tenant={}", id, tenantId);

        ObjectTypeNode node = findObjectTypeOrThrow(tenantId, id);

        // Transition state: editing a default type marks it as customized
        if ("default".equals(node.getState()) && request.state() == null) {
            node.setState("customized");
        }

        // Partial update: only set non-null fields
        if (request.name() != null) {
            node.setName(request.name());
        }
        if (request.typeKey() != null) {
            // Validate uniqueness if typeKey is changing
            if (!request.typeKey().equals(node.getTypeKey())
                    && objectTypeRepository.existsByTypeKeyAndTenantId(request.typeKey(), tenantId)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "TypeKey '" + request.typeKey() + "' already exists for this tenant");
            }
            node.setTypeKey(request.typeKey());
        }
        if (request.code() != null) {
            node.setCode(request.code());
        }
        if (request.description() != null) {
            node.setDescription(request.description());
        }
        if (request.iconName() != null) {
            node.setIconName(request.iconName());
        }
        if (request.iconColor() != null) {
            node.setIconColor(request.iconColor());
        }
        if (request.status() != null) {
            node.setStatus(request.status());
        }
        if (request.state() != null) {
            node.setState(request.state());
        }
        node.setUpdatedAt(Instant.now());

        ObjectTypeNode saved = objectTypeRepository.save(node);
        log.info("Updated object type id={} for tenant={}", saved.getId(), tenantId);

        return toDTO(saved);
    }

    @Override
    @Transactional
    public void deleteObjectType(String tenantId, String id) {
        log.info("Deleting object type id={} for tenant={}", id, tenantId);

        ObjectTypeNode node = findObjectTypeOrThrow(tenantId, id);
        objectTypeRepository.delete(node);

        log.info("Deleted object type id={} for tenant={}", id, tenantId);
    }

    @Override
    @Transactional
    public ObjectTypeDTO addAttribute(String tenantId, String objectTypeId, AddAttributeRequest request) {
        log.info("Adding attribute {} to object type {} for tenant={}",
                request.attributeTypeId(), objectTypeId, tenantId);

        ObjectTypeNode objectType = findObjectTypeOrThrow(tenantId, objectTypeId);

        AttributeTypeNode attributeType = attributeTypeRepository
                .findByIdAndTenantId(request.attributeTypeId(), tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "AttributeType not found: " + request.attributeTypeId()));

        // Check for duplicate attribute
        boolean alreadyLinked = objectType.getAttributes().stream()
                .anyMatch(rel -> rel.getAttribute().getId().equals(request.attributeTypeId()));
        if (alreadyLinked) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Attribute already linked to this object type");
        }

        HasAttributeRelationship relationship = HasAttributeRelationship.builder()
                .isRequired(request.isRequired())
                .displayOrder(request.displayOrder())
                .attribute(attributeType)
                .build();

        objectType.getAttributes().add(relationship);
        objectType.setUpdatedAt(Instant.now());

        ObjectTypeNode saved = objectTypeRepository.save(objectType);
        log.info("Added attribute {} to object type {} for tenant={}",
                request.attributeTypeId(), objectTypeId, tenantId);

        return toDTO(saved);
    }

    @Override
    @Transactional
    public void removeAttribute(String tenantId, String objectTypeId, String attributeTypeId) {
        log.info("Removing attribute {} from object type {} for tenant={}",
                attributeTypeId, objectTypeId, tenantId);

        ObjectTypeNode objectType = findObjectTypeOrThrow(tenantId, objectTypeId);

        boolean removed = objectType.getAttributes()
                .removeIf(rel -> rel.getAttribute().getId().equals(attributeTypeId));

        if (!removed) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "Attribute not linked to this object type: " + attributeTypeId);
        }

        objectType.setUpdatedAt(Instant.now());
        objectTypeRepository.save(objectType);

        log.info("Removed attribute {} from object type {} for tenant={}",
                attributeTypeId, objectTypeId, tenantId);
    }

    @Override
    @Transactional
    public ObjectTypeDTO addConnection(String tenantId, String objectTypeId, AddConnectionRequest request) {
        log.info("Adding connection {} from object type {} to {} for tenant={}",
                request.relationshipKey(), objectTypeId, request.targetObjectTypeId(), tenantId);

        ObjectTypeNode sourceType = findObjectTypeOrThrow(tenantId, objectTypeId);

        ObjectTypeNode targetType = objectTypeRepository
                .findByIdAndTenantId(request.targetObjectTypeId(), tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Target ObjectType not found: " + request.targetObjectTypeId()));

        CanConnectToRelationship connection = CanConnectToRelationship.builder()
                .relationshipKey(request.relationshipKey())
                .activeName(request.activeName())
                .passiveName(request.passiveName())
                .cardinality(request.cardinality())
                .isDirected(request.isDirected())
                .targetType(targetType)
                .build();

        sourceType.getConnections().add(connection);
        sourceType.setUpdatedAt(Instant.now());

        ObjectTypeNode saved = objectTypeRepository.save(sourceType);
        log.info("Added connection {} from object type {} to {} for tenant={}",
                request.relationshipKey(), objectTypeId, request.targetObjectTypeId(), tenantId);

        return toDTO(saved);
    }

    @Override
    @Transactional
    public void removeConnection(String tenantId, String objectTypeId, String targetId) {
        log.info("Removing connection to {} from object type {} for tenant={}",
                targetId, objectTypeId, tenantId);

        ObjectTypeNode objectType = findObjectTypeOrThrow(tenantId, objectTypeId);

        boolean removed = objectType.getConnections()
                .removeIf(rel -> rel.getTargetType().getId().equals(targetId));

        if (!removed) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "Connection not found to target: " + targetId);
        }

        objectType.setUpdatedAt(Instant.now());
        objectTypeRepository.save(objectType);

        log.info("Removed connection to {} from object type {} for tenant={}",
                targetId, objectTypeId, tenantId);
    }

    @Override
    public List<AttributeTypeDTO> listAttributeTypes(String tenantId) {
        log.debug("Listing attribute types for tenant={}", tenantId);

        return attributeTypeRepository.findByTenantId(tenantId).stream()
                .map(this::toAttributeTypeDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AttributeTypeDTO createAttributeType(String tenantId, AttributeTypeCreateRequest request) {
        log.info("Creating attribute type name={} for tenant={}", request.name(), tenantId);

        Instant now = Instant.now();
        AttributeTypeNode node = AttributeTypeNode.builder()
                .id(UUID.randomUUID().toString())
                .tenantId(tenantId)
                .name(request.name())
                .attributeKey(request.attributeKey())
                .dataType(request.dataType())
                .attributeGroup(request.attributeGroup())
                .description(request.description())
                .defaultValue(request.defaultValue())
                .validationRules(request.validationRules())
                .createdAt(now)
                .updatedAt(now)
                .build();

        AttributeTypeNode saved = attributeTypeRepository.save(node);
        log.info("Created attribute type id={} key={} for tenant={}", saved.getId(), saved.getAttributeKey(), tenantId);

        return toAttributeTypeDTO(saved);
    }

    @Override
    public AttributeTypeDTO getAttributeType(String tenantId, String id) {
        log.debug("Getting attribute type id={} for tenant={}", id, tenantId);

        AttributeTypeNode node = findAttributeTypeOrThrow(tenantId, id);
        return toAttributeTypeDTO(node);
    }

    @Override
    @Transactional
    public AttributeTypeDTO updateAttributeType(String tenantId, String id, AttributeTypeUpdateRequest request) {
        log.info("Updating attribute type id={} for tenant={}", id, tenantId);

        AttributeTypeNode node = findAttributeTypeOrThrow(tenantId, id);

        // Partial update: only set non-null fields
        if (request.name() != null) {
            node.setName(request.name());
        }
        if (request.attributeKey() != null) {
            node.setAttributeKey(request.attributeKey());
        }
        if (request.dataType() != null) {
            node.setDataType(request.dataType());
        }
        if (request.attributeGroup() != null) {
            node.setAttributeGroup(request.attributeGroup());
        }
        if (request.description() != null) {
            node.setDescription(request.description());
        }
        if (request.defaultValue() != null) {
            node.setDefaultValue(request.defaultValue());
        }
        if (request.validationRules() != null) {
            node.setValidationRules(request.validationRules());
        }
        node.setUpdatedAt(Instant.now());

        AttributeTypeNode saved = attributeTypeRepository.save(node);
        log.info("Updated attribute type id={} for tenant={}", saved.getId(), tenantId);

        return toAttributeTypeDTO(saved);
    }

    @Override
    @Transactional
    public void deleteAttributeType(String tenantId, String id) {
        log.info("Deleting attribute type id={} for tenant={}", id, tenantId);

        AttributeTypeNode node = findAttributeTypeOrThrow(tenantId, id);

        // Check if the attribute type is in use by any ObjectType
        List<ObjectTypeNode> objectTypes = objectTypeRepository.findByTenantId(tenantId,
                PageRequest.of(0, Integer.MAX_VALUE));
        boolean inUse = objectTypes.stream()
                .filter(ot -> ot.getAttributes() != null)
                .flatMap(ot -> ot.getAttributes().stream())
                .anyMatch(rel -> rel.getAttribute().getId().equals(id));

        if (inUse) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "AttributeType is in use by one or more ObjectTypes and cannot be deleted: " + id);
        }

        attributeTypeRepository.delete(node);
        log.info("Deleted attribute type id={} for tenant={}", id, tenantId);
    }

    @Override
    @Transactional
    public ObjectTypeDTO duplicateObjectType(String tenantId, String id) {
        log.info("Duplicating object type id={} for tenant={}", id, tenantId);

        ObjectTypeNode source = findObjectTypeOrThrow(tenantId, id);

        // Generate new typeKey and code
        String newTypeKey = resolveTypeKey(source.getName() + "_copy", null);
        // Ensure uniqueness
        int suffix = 1;
        String candidateKey = newTypeKey;
        while (objectTypeRepository.existsByTypeKeyAndTenantId(candidateKey, tenantId)) {
            candidateKey = newTypeKey + "_" + suffix++;
        }

        long count = objectTypeRepository.countByTenantId(tenantId);
        String newCode = String.format("OBJ_%03d", count + 1);

        Instant now = Instant.now();
        ObjectTypeNode copy = ObjectTypeNode.builder()
                .id(UUID.randomUUID().toString())
                .tenantId(tenantId)
                .name(source.getName() + " (Copy)")
                .typeKey(candidateKey)
                .code(newCode)
                .description(source.getDescription())
                .iconName(source.getIconName())
                .iconColor(source.getIconColor())
                .status(source.getStatus())
                .state("user_defined")
                .createdAt(now)
                .updatedAt(now)
                .attributes(source.getAttributes() != null ? new ArrayList<>(source.getAttributes()) : new ArrayList<>())
                .connections(source.getConnections() != null ? new ArrayList<>(source.getConnections()) : new ArrayList<>())
                .build();

        ObjectTypeNode saved = objectTypeRepository.save(copy);
        log.info("Duplicated object type id={} -> new id={} for tenant={}", id, saved.getId(), tenantId);

        return toDTO(saved);
    }

    @Override
    @Transactional
    public ObjectTypeDTO restoreObjectType(String tenantId, String id) {
        log.info("Restoring object type id={} to default state for tenant={}", id, tenantId);

        ObjectTypeNode node = findObjectTypeOrThrow(tenantId, id);

        if (!"customized".equals(node.getState())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Only customized object types can be restored to default");
        }

        node.setState("default");
        node.setUpdatedAt(Instant.now());

        ObjectTypeNode saved = objectTypeRepository.save(node);
        log.info("Restored object type id={} to default state for tenant={}", id, tenantId);

        return toDTO(saved);
    }

    // ========================================================================
    // Private helpers
    // ========================================================================

    private ObjectTypeNode findObjectTypeOrThrow(String tenantId, String id) {
        return objectTypeRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "ObjectType not found: " + id));
    }

    private AttributeTypeNode findAttributeTypeOrThrow(String tenantId, String id) {
        return attributeTypeRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "AttributeType not found: " + id));
    }

    /**
     * Resolve typeKey: use provided value or derive from name (lowercase, spaces to underscores).
     */
    private String resolveTypeKey(String name, String typeKey) {
        if (typeKey != null && !typeKey.isBlank()) {
            return typeKey;
        }
        return name.toLowerCase().replaceAll("\\s+", "_").replaceAll("[^a-z0-9_]", "");
    }

    private boolean matchesSearch(ObjectTypeNode node, String search) {
        if (search == null || search.isBlank()) {
            return true;
        }
        String term = search.toLowerCase();
        return (node.getName() != null && node.getName().toLowerCase().contains(term))
                || (node.getTypeKey() != null && node.getTypeKey().toLowerCase().contains(term));
    }

    private boolean matchesStatus(ObjectTypeNode node, String status) {
        if (status == null || status.isBlank()) {
            return true;
        }
        return status.equalsIgnoreCase(node.getStatus());
    }

    private ObjectTypeDTO toDTO(ObjectTypeNode node) {
        List<ObjectTypeDTO.AttributeReferenceDTO> attrDTOs = node.getAttributes() != null
                ? node.getAttributes().stream()
                    .map(rel -> new ObjectTypeDTO.AttributeReferenceDTO(
                            rel.getRelId(),
                            rel.getAttribute().getId(),
                            rel.getAttribute().getName(),
                            rel.getAttribute().getAttributeKey(),
                            rel.getAttribute().getDataType(),
                            rel.isRequired(),
                            rel.getDisplayOrder()
                    ))
                    .collect(Collectors.toList())
                : Collections.emptyList();

        List<ConnectionDTO> connDTOs = node.getConnections() != null
                ? node.getConnections().stream()
                    .map(rel -> new ConnectionDTO(
                            rel.getRelId(),
                            rel.getTargetType().getId(),
                            rel.getTargetType().getName(),
                            rel.getRelationshipKey(),
                            rel.getActiveName(),
                            rel.getPassiveName(),
                            rel.getCardinality(),
                            rel.isDirected()
                    ))
                    .collect(Collectors.toList())
                : Collections.emptyList();

        String parentTypeId = node.getParentType() != null ? node.getParentType().getId() : null;

        return new ObjectTypeDTO(
                node.getId(),
                node.getTenantId(),
                node.getName(),
                node.getTypeKey(),
                node.getCode(),
                node.getDescription(),
                node.getIconName(),
                node.getIconColor(),
                node.getStatus(),
                node.getState(),
                node.getCreatedAt(),
                node.getUpdatedAt(),
                attrDTOs,
                connDTOs,
                parentTypeId,
                0
        );
    }

    private AttributeTypeDTO toAttributeTypeDTO(AttributeTypeNode node) {
        return new AttributeTypeDTO(
                node.getId(),
                node.getTenantId(),
                node.getName(),
                node.getAttributeKey(),
                node.getDataType(),
                node.getAttributeGroup(),
                node.getDescription(),
                node.getDefaultValue(),
                node.getValidationRules(),
                node.getCreatedAt(),
                node.getUpdatedAt()
        );
    }
}
