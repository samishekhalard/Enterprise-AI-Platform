package com.ems.tenant.controller;

import com.ems.tenant.dto.internal.TenantRoutingResponse;
import com.ems.tenant.service.TenantRoutingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/internal/tenants", "/api/v1/internal/tenants"})
@RequiredArgsConstructor
@Tag(name = "Internal Tenant Routing", description = "Internal routing APIs for service-to-service use")
public class InternalTenantRoutingController {

    private final TenantRoutingService tenantRoutingService;

    @GetMapping("/{tenantId}/routing")
    @Operation(summary = "Resolve per-service routing metadata for a tenant")
    public ResponseEntity<TenantRoutingResponse> getRouting(@PathVariable String tenantId) {
        return ResponseEntity.ok(tenantRoutingService.getRouting(tenantId));
    }
}
