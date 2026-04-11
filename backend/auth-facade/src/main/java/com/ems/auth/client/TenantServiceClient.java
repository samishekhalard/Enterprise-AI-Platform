package com.ems.auth.client;

import com.ems.auth.dto.internal.TenantRoutingRecord;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "tenant-service", contextId = "tenantRoutingClient")
public interface TenantServiceClient {

    @GetMapping("/api/v1/internal/tenants/{tenantId}/routing")
    TenantRoutingRecord getRouting(@PathVariable("tenantId") String tenantId);
}
