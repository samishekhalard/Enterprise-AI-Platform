package com.ems.definition.controller;

import com.ems.definition.dto.AttributeTypeCreateRequest;
import com.ems.definition.dto.AttributeTypeDTO;
import com.ems.definition.dto.AttributeTypeUpdateRequest;
import com.ems.definition.service.ObjectTypeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST controller for AttributeType CRUD operations.
 *
 * All endpoints require authentication and extract the tenant ID from the JWT.
 */
@RestController
@RequestMapping("/api/v1/definitions/attribute-types")
@RequiredArgsConstructor
@Validated
@Slf4j
@Tag(name = "Attribute Types", description = "Manage attribute type definitions")
public class AttributeTypeController {

    private final ObjectTypeService objectTypeService;

    @GetMapping
    @Operation(summary = "List attribute types", description = "List all attribute types for the current tenant")
    public ResponseEntity<List<AttributeTypeDTO>> listAttributeTypes(
            @AuthenticationPrincipal Jwt jwt) {

        String tenantId = extractTenantId(jwt);
        log.debug("GET /attribute-types tenant={}", tenantId);

        List<AttributeTypeDTO> result = objectTypeService.listAttributeTypes(tenantId);
        return ResponseEntity.ok(result);
    }

    @PostMapping
    @Operation(summary = "Create attribute type", description = "Create a new attribute type definition")
    public ResponseEntity<AttributeTypeDTO> createAttributeType(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody AttributeTypeCreateRequest request) {

        String tenantId = extractTenantId(jwt);
        log.debug("POST /attribute-types tenant={} name={}", tenantId, request.name());

        AttributeTypeDTO created = objectTypeService.createAttributeType(tenantId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get attribute type", description = "Get an attribute type by ID")
    public ResponseEntity<AttributeTypeDTO> getAttributeType(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String id) {

        String tenantId = extractTenantId(jwt);
        log.debug("GET /attribute-types/{} tenant={}", id, tenantId);

        AttributeTypeDTO dto = objectTypeService.getAttributeType(tenantId, id);
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update attribute type", description = "Update an existing attribute type (partial update)")
    public ResponseEntity<AttributeTypeDTO> updateAttributeType(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String id,
            @Valid @RequestBody AttributeTypeUpdateRequest request) {

        String tenantId = extractTenantId(jwt);
        log.info("PUT /attribute-types/{} tenant={}", id, tenantId);

        AttributeTypeDTO updated = objectTypeService.updateAttributeType(tenantId, id, request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete attribute type", description = "Delete an attribute type (fails if in use by any object type)")
    public ResponseEntity<Void> deleteAttributeType(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String id) {

        String tenantId = extractTenantId(jwt);
        log.info("DELETE /attribute-types/{} tenant={}", id, tenantId);

        objectTypeService.deleteAttributeType(tenantId, id);
        return ResponseEntity.noContent().build();
    }

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
