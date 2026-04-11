package com.ems.definition.controller;

import com.ems.definition.dto.AddAttributeRequest;
import com.ems.definition.dto.AddConnectionRequest;
import com.ems.definition.dto.ConnectionDTO;
import com.ems.definition.dto.ObjectTypeCreateRequest;
import com.ems.definition.dto.ObjectTypeDTO;
import com.ems.definition.dto.ObjectTypeUpdateRequest;
import com.ems.definition.dto.PagedResponse;
import com.ems.definition.service.ObjectTypeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST controller for ObjectType CRUD operations.
 *
 * All endpoints require authentication and extract the tenant ID from the JWT.
 */
@RestController
@RequestMapping("/api/v1/definitions/object-types")
@RequiredArgsConstructor
@Validated
@Slf4j
@Tag(name = "Object Types", description = "Manage object type definitions")
public class ObjectTypeController {

    private final ObjectTypeService objectTypeService;

    @GetMapping
    @Operation(summary = "List object types", description = "Paginated list of object types for the current tenant")
    public ResponseEntity<PagedResponse<ObjectTypeDTO>> listObjectTypes(
            @AuthenticationPrincipal Jwt jwt,
            @Parameter(description = "Page number (0-based)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Search term (filters on name and typeKey)") @RequestParam(required = false) String search,
            @Parameter(description = "Status filter") @RequestParam(required = false) String status) {

        String tenantId = extractTenantId(jwt);
        log.debug("GET /object-types tenant={} page={} size={}", tenantId, page, size);

        PagedResponse<ObjectTypeDTO> response = objectTypeService.listObjectTypes(tenantId, page, size, search, status);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    @Operation(summary = "Create object type", description = "Create a new object type definition")
    public ResponseEntity<ObjectTypeDTO> createObjectType(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody ObjectTypeCreateRequest request) {

        String tenantId = extractTenantId(jwt);
        log.debug("POST /object-types tenant={} name={}", tenantId, request.name());

        ObjectTypeDTO created = objectTypeService.createObjectType(tenantId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get object type", description = "Get an object type by ID")
    public ResponseEntity<ObjectTypeDTO> getObjectType(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String id) {

        String tenantId = extractTenantId(jwt);
        log.debug("GET /object-types/{} tenant={}", id, tenantId);

        ObjectTypeDTO dto = objectTypeService.getObjectType(tenantId, id);
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update object type", description = "Update an existing object type (partial update)")
    public ResponseEntity<ObjectTypeDTO> updateObjectType(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String id,
            @Valid @RequestBody ObjectTypeUpdateRequest request) {

        String tenantId = extractTenantId(jwt);
        log.debug("PUT /object-types/{} tenant={}", id, tenantId);

        ObjectTypeDTO updated = objectTypeService.updateObjectType(tenantId, id, request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete object type", description = "Delete an object type and its relationships")
    public ResponseEntity<Void> deleteObjectType(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String id) {

        String tenantId = extractTenantId(jwt);
        log.debug("DELETE /object-types/{} tenant={}", id, tenantId);

        objectTypeService.deleteObjectType(tenantId, id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/duplicate")
    @Operation(summary = "Duplicate object type", description = "Create a copy of an existing object type with state=user_defined")
    public ResponseEntity<ObjectTypeDTO> duplicateObjectType(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String id) {

        String tenantId = extractTenantId(jwt);
        log.debug("POST /object-types/{}/duplicate tenant={}", id, tenantId);

        ObjectTypeDTO duplicate = objectTypeService.duplicateObjectType(tenantId, id);
        return ResponseEntity.status(HttpStatus.CREATED).body(duplicate);
    }

    @PostMapping("/{id}/restore")
    @Operation(summary = "Restore object type", description = "Restore a customized object type back to default state")
    public ResponseEntity<ObjectTypeDTO> restoreObjectType(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String id) {

        String tenantId = extractTenantId(jwt);
        log.debug("POST /object-types/{}/restore tenant={}", id, tenantId);

        ObjectTypeDTO restored = objectTypeService.restoreObjectType(tenantId, id);
        return ResponseEntity.ok(restored);
    }

    // ========================================================================
    // Attribute sub-resource endpoints
    // ========================================================================

    @GetMapping("/{id}/attributes")
    @Operation(summary = "List attributes", description = "List attributes linked to an object type")
    public ResponseEntity<List<ObjectTypeDTO.AttributeReferenceDTO>> listAttributes(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String id) {

        String tenantId = extractTenantId(jwt);
        log.debug("GET /object-types/{}/attributes tenant={}", id, tenantId);

        ObjectTypeDTO dto = objectTypeService.getObjectType(tenantId, id);
        return ResponseEntity.ok(dto.attributes());
    }

    @PostMapping("/{id}/attributes")
    @Operation(summary = "Add attribute", description = "Link an attribute type to an object type")
    public ResponseEntity<ObjectTypeDTO> addAttribute(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String id,
            @Valid @RequestBody AddAttributeRequest request) {

        String tenantId = extractTenantId(jwt);
        log.debug("POST /object-types/{}/attributes tenant={} attrId={}", id, tenantId, request.attributeTypeId());

        ObjectTypeDTO updated = objectTypeService.addAttribute(tenantId, id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(updated);
    }

    @DeleteMapping("/{id}/attributes/{attrId}")
    @Operation(summary = "Remove attribute", description = "Unlink an attribute type from an object type")
    public ResponseEntity<Void> removeAttribute(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String id,
            @PathVariable String attrId) {

        String tenantId = extractTenantId(jwt);
        log.debug("DELETE /object-types/{}/attributes/{} tenant={}", id, attrId, tenantId);

        objectTypeService.removeAttribute(tenantId, id, attrId);
        return ResponseEntity.noContent().build();
    }

    // ========================================================================
    // Connection sub-resource endpoints
    // ========================================================================

    @GetMapping("/{id}/connections")
    @Operation(summary = "List connections", description = "List outgoing connections from an object type")
    public ResponseEntity<List<ConnectionDTO>> listConnections(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String id) {

        String tenantId = extractTenantId(jwt);
        log.debug("GET /object-types/{}/connections tenant={}", id, tenantId);

        ObjectTypeDTO dto = objectTypeService.getObjectType(tenantId, id);
        return ResponseEntity.ok(dto.connections());
    }

    @PostMapping("/{id}/connections")
    @Operation(summary = "Add connection", description = "Create a CAN_CONNECT_TO relationship to another object type")
    public ResponseEntity<ObjectTypeDTO> addConnection(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String id,
            @Valid @RequestBody AddConnectionRequest request) {

        String tenantId = extractTenantId(jwt);
        log.debug("POST /object-types/{}/connections tenant={} target={}", id, tenantId, request.targetObjectTypeId());

        ObjectTypeDTO updated = objectTypeService.addConnection(tenantId, id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(updated);
    }

    @DeleteMapping("/{id}/connections/{connId}")
    @Operation(summary = "Remove connection", description = "Remove a CAN_CONNECT_TO relationship to another object type")
    public ResponseEntity<Void> removeConnection(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String id,
            @PathVariable String connId) {

        String tenantId = extractTenantId(jwt);
        log.debug("DELETE /object-types/{}/connections/{} tenant={}", id, connId, tenantId);

        objectTypeService.removeConnection(tenantId, id, connId);
        return ResponseEntity.noContent().build();
    }

    // ========================================================================
    // Helpers
    // ========================================================================

    /**
     * Extract tenant ID from the JWT claim, falling back to the X-Tenant-ID header
     * forwarded by the API Gateway.
     *
     * @param jwt the authenticated JWT
     * @return the tenant ID
     */
    private String extractTenantId(Jwt jwt) {
        // Prefer JWT claim — Keycloak may emit the user attribute as a String or List<String>
        String tenantId = null;
        Object rawClaim = jwt.getClaim("tenant_id");
        if (rawClaim instanceof String s && !s.isBlank()) {
            tenantId = s.trim();
        } else if (rawClaim instanceof java.util.List<?> list && !list.isEmpty()) {
            Object first = list.get(0);
            if (first != null && !first.toString().isBlank()) {
                tenantId = first.toString().trim();
            }
        }

        // Fallback: read from the X-Tenant-ID header forwarded by the API Gateway
        if (tenantId == null) {
            try {
                var attrs = (org.springframework.web.context.request.ServletRequestAttributes)
                        org.springframework.web.context.request.RequestContextHolder.currentRequestAttributes();
                String header = attrs.getRequest().getHeader("X-Tenant-ID");
                if (header != null && !header.isBlank()) {
                    tenantId = header.trim();
                }
            } catch (Exception ignored) {
                // RequestContextHolder not available outside request scope
            }
        }

        if (tenantId == null || tenantId.isBlank()) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Missing tenant context (no tenant_id JWT claim or X-Tenant-ID header)");
        }
        return tenantId;
    }
}
