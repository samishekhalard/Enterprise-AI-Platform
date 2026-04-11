package com.ems.tenant.service;

import com.ems.common.dto.*;
import com.ems.common.enums.TenantStatus;
import com.ems.common.enums.TenantType;
import com.ems.tenant.entity.TenantDomainEntity;
import com.ems.tenant.entity.TenantEntity;
import com.ems.tenant.service.branding.BrandingValidationResult;

import java.util.List;

public interface TenantService {

    // CRUD operations
    TenantListResponse listTenants(int page, int limit, TenantStatus status, TenantType type, String search);

    TenantEntity getTenantById(String tenantId);

    TenantEntity getTenantBySlug(String slug);

    TenantEntity createTenant(CreateTenantRequest request, String createdBy);

    TenantEntity updateTenant(String tenantId, UpdateTenantRequest request);

    void deleteTenant(String tenantId);

    // Status management
    TenantEntity lockTenant(String tenantId);

    TenantEntity unlockTenant(String tenantId);

    TenantEntity suspendTenant(String tenantId);

    TenantEntity activateTenant(String tenantId, ActivateTenantRequest request);

    TenantEntity suspendTenantWithReason(String tenantId, SuspendTenantRequest request);

    TenantEntity reactivateTenant(String tenantId);

    TenantEntity decommissionTenant(String tenantId, DecommissionTenantRequest request);

    // Statistics
    TenantStatsDTO getTenantStats();

    // Domain management
    List<TenantDomainEntity> getTenantDomains(String tenantId);

    TenantDomainEntity addDomain(String tenantId, String domain, boolean isPrimary);

    TenantDomainEntity verifyDomain(String tenantId, String domainId);

    void removeDomain(String tenantId, String domainId);

    // Resolution
    TenantEntity resolveTenantByHostname(String hostname);

    // Validation
    boolean isSlugAvailable(String slug);

    boolean isShortCodeAvailable(String shortCode);

    // Configuration management
    TenantEntity updateAuthProviders(String tenantId, java.util.Map<String, Object> request);

    TenantEntity updateBranding(String tenantId, java.util.Map<String, Object> request);

    BrandingValidationResult validateBranding(String tenantId, java.util.Map<String, Object> request);

    // Branding query
    java.util.Map<String, Object> getBranding(String tenantId);
}
