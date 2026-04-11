package com.ems.auth.controller;

import com.ems.auth.dto.internal.AuthTenantProvisioningResponse;
import com.ems.auth.service.AuthTenantProvisioningService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@ConditionalOnProperty(name = "auth.graph-per-tenant.enabled", havingValue = "true")
@RequestMapping({"/internal/provision/tenants", "/api/v1/internal/provision/tenants"})
@Tag(name = "Internal Tenant Provisioning", description = "Internal auth-facade tenant provisioning APIs")
public class InternalProvisioningController {

    private final AuthTenantProvisioningService provisioningService;

    @PostMapping("/{tenantId}")
    @Operation(summary = "Provision auth-facade resources for a tenant")
    public ResponseEntity<AuthTenantProvisioningResponse> provisionTenant(@PathVariable String tenantId) {
        AuthTenantProvisioningResponse response = provisioningService.provisionTenant(tenantId);
        HttpStatus status = response.created() ? HttpStatus.CREATED : HttpStatus.OK;
        return ResponseEntity.status(status).body(response);
    }
}
