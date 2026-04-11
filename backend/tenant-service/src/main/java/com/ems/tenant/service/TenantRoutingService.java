package com.ems.tenant.service;

import com.ems.common.exception.TenantNotFoundException;
import com.ems.tenant.dto.internal.TenantRoutingResponse;
import com.ems.tenant.entity.TenantEntity;
import com.ems.tenant.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TenantRoutingService {

    private final TenantRepository tenantRepository;

    public TenantRoutingResponse getRouting(String tenantIdentifier) {
        TenantEntity tenant = resolveTenant(tenantIdentifier);
        return new TenantRoutingResponse(
            tenant.getUuid(),
            tenant.getSlug(),
            tenant.getAuthDbName(),
            tenant.getDefinitionsDbName(),
            tenant.getDefaultLocale() != null ? tenant.getDefaultLocale() : "en",
            tenant.getBaselineVersion(),
            tenant.getStatus()
        );
    }

    private TenantEntity resolveTenant(String tenantIdentifier) {
        if (tenantIdentifier == null || tenantIdentifier.isBlank()) {
            throw new TenantNotFoundException("Tenant identifier is required");
        }

        return tenantRepository.findById(tenantIdentifier)
            .or(() -> findByUuid(tenantIdentifier))
            .orElseThrow(() -> new TenantNotFoundException("Tenant not found: " + tenantIdentifier));
    }

    private java.util.Optional<TenantEntity> findByUuid(String tenantIdentifier) {
        try {
            return tenantRepository.findByUuid(UUID.fromString(tenantIdentifier));
        } catch (IllegalArgumentException ignored) {
            return java.util.Optional.empty();
        }
    }
}
