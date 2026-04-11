package com.ems.auth.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

/**
 * Feign client for tenant-service's centralized message registry.
 */
@FeignClient(name = "tenant-service", contextId = "messageRegistryClient")
public interface MessageRegistryClient {

    @GetMapping("/api/v1/internal/messages/{code}")
    ResolvedMessageResponse resolveMessage(
        @PathVariable("code") String code,
        @RequestParam(value = "locale", required = false) String locale,
        @RequestParam(value = "tenantId", required = false) String tenantId
    );
}
