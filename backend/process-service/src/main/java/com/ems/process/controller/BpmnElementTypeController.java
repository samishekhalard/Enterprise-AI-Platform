package com.ems.process.controller;

import com.ems.process.dto.BpmnElementTypeDTO;
import com.ems.process.dto.BpmnElementTypeListResponse;
import com.ems.process.service.BpmnElementTypeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/process/element-types")
@RequiredArgsConstructor
@Tag(name = "BPMN Element Types", description = "APIs for retrieving BPMN element type definitions")
public class BpmnElementTypeController {

    private final BpmnElementTypeService service;

    @GetMapping
    @Operation(summary = "Get all element types", description = "Retrieve all BPMN element types with CSS variables for styling")
    public ResponseEntity<BpmnElementTypeListResponse> getAllElementTypes(
        @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId
    ) {
        BpmnElementTypeListResponse response = service.getAllElementTypes(tenantId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/category/{category}")
    @Operation(summary = "Get element types by category", description = "Filter element types by category (task, event, gateway, data, artifact, flow)")
    public ResponseEntity<List<BpmnElementTypeDTO>> getElementTypesByCategory(
        @PathVariable String category,
        @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId
    ) {
        List<BpmnElementTypeDTO> elements = service.getElementTypesByCategory(category, tenantId);
        return ResponseEntity.ok(elements);
    }

    @GetMapping("/code/{code}")
    @Operation(summary = "Get element type by code", description = "Get a specific BPMN element type by its code (e.g., bpmn:Task)")
    public ResponseEntity<BpmnElementTypeDTO> getElementTypeByCode(
        @PathVariable String code,
        @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId
    ) {
        return service.getElementTypeByCode(code, tenantId)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/cache/invalidate")
    @Operation(summary = "Invalidate cache", description = "Invalidate the element types cache for a tenant")
    public ResponseEntity<Void> invalidateCache(
        @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId
    ) {
        service.invalidateCache(tenantId);
        return ResponseEntity.noContent().build();
    }
}
