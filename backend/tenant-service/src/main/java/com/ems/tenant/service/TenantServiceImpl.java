package com.ems.tenant.service;

import com.ems.common.dto.*;
import com.ems.common.enums.SSLStatus;
import com.ems.common.enums.TenantStatus;
import com.ems.common.enums.TenantType;
import com.ems.common.enums.VerificationMethod;
import com.ems.common.exception.DomainVerificationException;
import com.ems.common.exception.DuplicateResourceException;
import com.ems.common.exception.ResourceNotFoundException;
import com.ems.common.exception.TenantNotFoundException;
import com.ems.tenant.entity.*;
import com.ems.tenant.mapper.TenantMapper;
import com.ems.tenant.repository.TenantLocaleRepository;
import com.ems.tenant.repository.TenantDomainRepository;
import com.ems.tenant.repository.TenantRepository;
import com.ems.tenant.service.branding.BrandingPolicyEnforcer;
import com.ems.tenant.service.branding.BrandingValidationResult;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class TenantServiceImpl implements TenantService {

    private static final int MAX_COMPONENT_TOKENS_BYTES = 512 * 1024; // 512 KB

    private final TenantRepository tenantRepository;
    private final TenantLocaleRepository tenantLocaleRepository;
    private final TenantDomainRepository domainRepository;
    private final TenantMapper tenantMapper;
    private final ApplicationEventPublisher eventPublisher;
    private final DnsVerificationService dnsVerificationService;
    private final BrandingPolicyEnforcer brandingPolicyEnforcer;
    private final ObjectMapper objectMapper;
    // private final KeycloakAdminService keycloakAdmin; // TODO: Inject when implemented

    @Override
    @Transactional(readOnly = true)
    public TenantListResponse listTenants(int page, int limit, TenantStatus status, TenantType type, String search) {
        Pageable pageable = PageRequest.of(page - 1, limit, Sort.by("createdAt").descending());

        Page<TenantEntity> result;

        if (search != null && !search.isBlank()) {
            result = tenantRepository.searchTenants(search.trim(), pageable);
        } else if (status != null && type != null) {
            result = tenantRepository.findByStatusAndTenantType(status, type, pageable);
        } else if (status != null) {
            result = tenantRepository.findByStatus(status, pageable);
        } else if (type != null) {
            result = tenantRepository.findByTenantType(type, pageable);
        } else {
            result = tenantRepository.findAll(pageable);
        }

        List<TenantSummaryDTO> tenants = result.getContent().stream()
            .map(tenantMapper::toSummaryDTO)
            .toList();

        return TenantListResponse.builder()
            .tenants(tenants)
            .total((int) result.getTotalElements())
            .page(page)
            .limit(limit)
            .build();
    }

    @Override
    @Transactional(readOnly = true)
    public TenantEntity getTenantById(String tenantId) {
        return resolveTenantByIdentifier(tenantId);
    }

    @Override
    @Transactional(readOnly = true)
    public TenantEntity getTenantBySlug(String slug) {
        return tenantRepository.findBySlug(slug)
            .orElseThrow(() -> new TenantNotFoundException("Tenant not found with slug: " + slug));
    }

    @Override
    public TenantEntity createTenant(CreateTenantRequest request, String createdBy) {
        log.info("Creating tenant: {}", request.fullName());

        // Generate infrastructure slug internally (not part of external API contract)
        String slug = generateSlug(request.shortName());
        if (tenantRepository.existsBySlug(slug)) {
            throw new DuplicateResourceException("Tenant with slug already exists: " + slug);
        }

        // Create tenant entity
        TenantEntity tenant = TenantEntity.builder()
            .fullName(request.fullName())
            .shortName(request.shortName())
            .slug(slug)
            .description(request.description())
            .tenantType(request.tenantType())
            .tier(request.tier())
            .status(TenantStatus.PENDING)
            .defaultLocale("en")
            .createdBy(createdBy)
            .build();

        // Create default branding
        TenantBrandingEntity branding = TenantBrandingEntity.builder()
            .tenant(tenant)
            .build();
        tenant.setBranding(branding);

        // Create default session config
        TenantSessionConfigEntity sessionConfig = TenantSessionConfigEntity.builder()
            .tenant(tenant)
            .build();
        tenant.setSessionConfig(sessionConfig);

        // Create default MFA config
        TenantMFAConfigEntity mfaConfig = TenantMFAConfigEntity.builder()
            .tenant(tenant)
            .build();
        tenant.setMfaConfig(mfaConfig);

        // Create default LOCAL auth provider
        TenantAuthProviderEntity localAuthProvider = TenantAuthProviderEntity.builder()
            .tenant(tenant)
            .type(com.ems.common.enums.AuthProviderType.LOCAL)
            .name("local")
            .displayName("Email & Password")
            .icon("email")
            .isEnabled(true)
            .isPrimary(true)
            .sortOrder(0)
            .config(java.util.Map.of(
                "passwordPolicy", java.util.Map.of(
                    "minLength", 8,
                    "requireUppercase", true,
                    "requireLowercase", true,
                    "requireNumber", true,
                    "requireSpecialChar", false
                )
            ))
            .build();
        tenant.getAuthProviders().add(localAuthProvider);

        tenant = tenantRepository.save(tenant);
        tenantLocaleRepository.save(TenantLocaleEntity.builder()
            .tenantUuid(tenant.getUuid())
            .localeCode(tenant.getDefaultLocale())
            .build());

        // Add primary domain if provided
        if (request.primaryDomain() != null && !request.primaryDomain().isBlank()) {
            addDomain(tenant.getId(), request.primaryDomain(), true);
        }

        // TODO: Create Keycloak realm
        // keycloakAdmin.createRealm(tenant.getKeycloakRealm(), tenant);

        // TODO: Create admin user in Keycloak
        // keycloakAdmin.createUser(tenant.getKeycloakRealm(), UserCreateRequest.builder()
        //     .email(request.adminEmail())
        //     .role("admin")
        //     .sendInvite(true)
        //     .build());

        // Activate tenant
        tenant.setStatus(TenantStatus.ACTIVE);
        tenant = tenantRepository.save(tenant);

        // Publish event
        // eventPublisher.publishEvent(new TenantCreatedEvent(this, tenant.getId()));

        log.info("Tenant created: {} ({})", tenant.getFullName(), tenant.getId());
        return tenant;
    }

    @Override
    public TenantEntity updateTenant(String tenantId, UpdateTenantRequest request) {
        TenantEntity tenant = getTenantById(tenantId);

        // Protected tenant: block identity field changes
        if (Boolean.TRUE.equals(tenant.getIsProtected())) {
            if (request.fullName() != null && !request.fullName().equals(tenant.getFullName())) {
                throw new IllegalStateException("Cannot modify protected tenant identity fields");
            }
            if (request.shortName() != null && !request.shortName().equals(tenant.getShortName())) {
                throw new IllegalStateException("Cannot modify protected tenant identity fields");
            }
        }

        if (request.fullName() != null) {
            tenant.setFullName(request.fullName());
        }
        if (request.shortName() != null) {
            tenant.setShortName(request.shortName());
        }
        if (request.description() != null) {
            tenant.setDescription(request.description());
        }
        if (request.logo() != null) {
            tenant.setLogoUrl(request.logo());
        }
        if (request.tier() != null) {
            tenant.setTier(request.tier());
        }

        return tenantRepository.save(tenant);
    }

    @Override
    public void deleteTenant(String tenantId) {
        TenantEntity tenant = getTenantById(tenantId);

        // Protected tenants cannot be deleted
        if (Boolean.TRUE.equals(tenant.getIsProtected())) {
            throw new IllegalStateException("Cannot delete protected tenant. Protected tenants are required for system operation.");
        }

        // TODO: Delete Keycloak realm
        // keycloakAdmin.deleteRealm(tenant.getKeycloakRealm());

        tenantRepository.delete(tenant);
        log.info("Tenant deleted: {}", tenantId);
    }

    @Override
    public TenantEntity lockTenant(String tenantId) {
        TenantEntity tenant = getTenantById(tenantId);

        // Protected tenants cannot be locked
        if (Boolean.TRUE.equals(tenant.getIsProtected())) {
            throw new IllegalStateException("Cannot lock protected tenant. Protected tenants must remain ACTIVE.");
        }

        tenant.setStatus(TenantStatus.LOCKED);
        log.info("Tenant locked: {}", tenantId);
        return tenantRepository.save(tenant);
    }

    @Override
    public TenantEntity unlockTenant(String tenantId) {
        TenantEntity tenant = getTenantById(tenantId);
        tenant.setStatus(TenantStatus.ACTIVE);
        log.info("Tenant unlocked: {}", tenantId);
        return tenantRepository.save(tenant);
    }

    @Override
    public TenantEntity suspendTenant(String tenantId) {
        TenantEntity tenant = getTenantById(tenantId);

        // Protected tenants cannot be suspended
        if (Boolean.TRUE.equals(tenant.getIsProtected())) {
            throw new IllegalStateException("Cannot suspend protected tenant. Protected tenants must remain ACTIVE.");
        }

        tenant.setStatus(TenantStatus.SUSPENDED);
        log.info("Tenant suspended: {}", tenantId);
        return tenantRepository.save(tenant);
    }

    @Override
    public TenantEntity activateTenant(String tenantId, ActivateTenantRequest request) {
        TenantEntity tenant = getTenantById(tenantId);

        if (tenant.getStatus() != TenantStatus.PENDING) {
            throw new IllegalStateException("Only PENDING tenants can be activated. Current status: " + tenant.getStatus());
        }

        tenant.setStatus(TenantStatus.ACTIVE);
        tenant.setLastActivityAt(Instant.now());
        log.info("Tenant activated: {} (sendWelcome={})", tenantId, request.sendWelcomeNotification());
        return tenantRepository.save(tenant);
    }

    @Override
    public TenantEntity suspendTenantWithReason(String tenantId, SuspendTenantRequest request) {
        TenantEntity tenant = getTenantById(tenantId);

        if (Boolean.TRUE.equals(tenant.getIsProtected())) {
            throw new IllegalStateException("Cannot suspend protected tenant.");
        }
        if (tenant.getStatus() != TenantStatus.ACTIVE) {
            throw new IllegalStateException("Only ACTIVE tenants can be suspended. Current status: " + tenant.getStatus());
        }

        tenant.setStatus(TenantStatus.SUSPENDED);
        tenant.setSuspensionReason(request.reason());
        tenant.setSuspensionNotes(request.notes());
        tenant.setSuspendedAt(Instant.now());

        if (request.estimatedReactivationDate() != null && !request.estimatedReactivationDate().isBlank()) {
            tenant.setEstimatedReactivationDate(Instant.parse(request.estimatedReactivationDate()));
        }

        log.info("Tenant suspended with reason: {} - {}", tenantId, request.reason());
        return tenantRepository.save(tenant);
    }

    @Override
    public TenantEntity reactivateTenant(String tenantId) {
        TenantEntity tenant = getTenantById(tenantId);

        if (tenant.getStatus() != TenantStatus.SUSPENDED) {
            throw new IllegalStateException("Only SUSPENDED tenants can be reactivated. Current status: " + tenant.getStatus());
        }

        tenant.setStatus(TenantStatus.ACTIVE);
        tenant.setSuspensionReason(null);
        tenant.setSuspensionNotes(null);
        tenant.setSuspendedAt(null);
        tenant.setEstimatedReactivationDate(null);
        tenant.setLastActivityAt(Instant.now());

        log.info("Tenant reactivated: {}", tenantId);
        return tenantRepository.save(tenant);
    }

    @Override
    public TenantEntity decommissionTenant(String tenantId, DecommissionTenantRequest request) {
        TenantEntity tenant = getTenantById(tenantId);

        if (Boolean.TRUE.equals(tenant.getIsProtected())) {
            throw new IllegalStateException("Cannot decommission protected tenant.");
        }
        if (tenant.getStatus() != TenantStatus.SUSPENDED) {
            throw new IllegalStateException("Only SUSPENDED tenants can be decommissioned. Current status: " + tenant.getStatus());
        }

        tenant.setStatus(TenantStatus.DECOMMISSIONED);
        tenant.setDecommissionedAt(Instant.now());

        log.info("Tenant decommissioned: {} - reason: {}", tenantId, request.reason());
        return tenantRepository.save(tenant);
    }

    @Override
    @Transactional(readOnly = true)
    public TenantStatsDTO getTenantStats() {
        long total = tenantRepository.count();
        long active = tenantRepository.countByStatus(TenantStatus.ACTIVE);
        long pending = tenantRepository.countByStatus(TenantStatus.PENDING);
        long suspended = tenantRepository.countByStatus(TenantStatus.SUSPENDED);
        long decommissioned = tenantRepository.countByStatus(TenantStatus.DECOMMISSIONED);

        return TenantStatsDTO.builder()
            .totalTenants(total)
            .activeTenants(active)
            .pendingTenants(pending)
            .suspendedTenants(suspended)
            .decommissionedTenants(decommissioned)
            .totalUsers(0) // TODO: integrate with user-service
            .avgUtilizationPercent(0.0) // TODO: calculate from license-service
            .build();
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isShortCodeAvailable(String shortCode) {
        if (shortCode == null || shortCode.isBlank()) {
            return false;
        }
        String normalized = shortCode.trim().toUpperCase();
        return !tenantRepository.existsByShortNameIgnoreCase(normalized);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TenantDomainEntity> getTenantDomains(String tenantId) {
        TenantEntity tenant = getTenantById(tenantId); // Validate tenant exists
        return domainRepository.findByTenantId(tenant.getId());
    }

    @Override
    public TenantDomainEntity addDomain(String tenantId, String domain, boolean isPrimary) {
        TenantEntity tenant = getTenantById(tenantId);

        if (domainRepository.existsByDomain(domain)) {
            throw new DuplicateResourceException("Domain already registered: " + domain);
        }

        if (isPrimary) {
            domainRepository.clearPrimaryDomain(tenant.getId());
        }

        TenantDomainEntity domainEntity = TenantDomainEntity.builder()
            .tenant(tenant)
            .domain(domain.toLowerCase())
            .isPrimary(isPrimary)
            .isVerified(false)
            .verificationToken(generateVerificationToken())
            .verificationMethod(VerificationMethod.DNS_TXT)
            .sslStatus(SSLStatus.PENDING)
            .build();

        return domainRepository.save(domainEntity);
    }

    @Override
    public TenantDomainEntity verifyDomain(String tenantId, String domainId) {
        TenantEntity tenant = getTenantById(tenantId);
        TenantDomainEntity domain = domainRepository.findByTenantIdAndId(tenant.getId(), domainId)
            .orElseThrow(() -> new ResourceNotFoundException("Domain not found"));

        // Verify DNS TXT record
        boolean verified = dnsVerificationService.verifyTxtRecord(
            domain.getDomain(),
            domain.getVerificationToken()
        );

        if (!verified) {
            String instructions = dnsVerificationService.generateVerificationInstructions(
                domain.getDomain(),
                domain.getVerificationToken()
            );
            log.warn("Domain verification failed for: {}. Instructions: {}", domain.getDomain(), instructions);
            throw new DomainVerificationException(domain.getDomain(), "DNS TXT record not found");
        }

        domain.setVerified(true);
        domain.setVerifiedAt(Instant.now());

        // TODO: Trigger SSL provisioning
        // eventPublisher.publishEvent(new DomainVerifiedEvent(this, domain.getId()));

        log.info("Domain verified successfully: {}", domain.getDomain());
        return domainRepository.save(domain);
    }

    @Override
    public void removeDomain(String tenantId, String domainId) {
        TenantEntity tenant = getTenantById(tenantId);
        TenantDomainEntity domain = domainRepository.findByTenantIdAndId(tenant.getId(), domainId)
            .orElseThrow(() -> new ResourceNotFoundException("Domain not found"));

        if (domain.isPrimary()) {
            throw new IllegalStateException("Cannot remove primary domain. Set another domain as primary first.");
        }

        domainRepository.delete(domain);
        log.info("Domain removed: {} from tenant {}", domain.getDomain(), tenantId);
    }

    @Override
    @Transactional(readOnly = true)
    public TenantEntity resolveTenantByHostname(String hostname) {
        return tenantRepository.findByVerifiedDomain(hostname.toLowerCase())
            .filter(tenant -> tenant.getStatus() == TenantStatus.ACTIVE)
            .orElseThrow(() -> new TenantNotFoundException("No active tenant found for domain: " + hostname));
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isSlugAvailable(String slug) {
        return !tenantRepository.existsBySlug(normalizeSlug(slug));
    }

    @Override
    @SuppressWarnings("unchecked")
    public TenantEntity updateAuthProviders(String tenantId, java.util.Map<String, Object> request) {
        TenantEntity tenant = getTenantById(tenantId);

        var authProvidersList = (java.util.List<java.util.Map<String, Object>>) request.get("authProviders");
        if (authProvidersList != null) {
            // Clear existing and add new
            tenant.getAuthProviders().clear();

            for (var providerData : authProvidersList) {
                TenantAuthProviderEntity provider = TenantAuthProviderEntity.builder()
                    .tenant(tenant)
                    .type(com.ems.common.enums.AuthProviderType.valueOf(
                        ((String) providerData.get("type")).toUpperCase()))
                    .name((String) providerData.get("name"))
                    .displayName((String) providerData.get("displayName"))
                    .icon((String) providerData.get("icon"))
                    .isEnabled(Boolean.TRUE.equals(providerData.get("isEnabled")))
                    .isPrimary(Boolean.TRUE.equals(providerData.get("isPrimary")))
                    .sortOrder(providerData.get("sortOrder") != null ?
                        ((Number) providerData.get("sortOrder")).intValue() : 0)
                    .config((java.util.Map<String, Object>) providerData.get("config"))
                    .build();
                tenant.getAuthProviders().add(provider);
            }
        }

        log.info("Auth providers updated for tenant: {}", tenantId);
        return tenantRepository.save(tenant);
    }

    @Override
    public TenantEntity updateBranding(String tenantId, java.util.Map<String, Object> request) {
        TenantEntity tenant = getTenantById(tenantId);
        TenantBrandingEntity branding = tenant.getBranding();

        BrandingValidationResult validation = brandingPolicyEnforcer.validateAndNormalize(request);
        if (!validation.valid()) {
            throw new IllegalArgumentException("Branding policy violations: " + String.join(" | ", validation.violations()));
        }
        Map<String, Object> normalized = validation.normalized();

        if (branding == null) {
            branding = TenantBrandingEntity.builder().tenant(tenant).build();
            tenant.setBranding(branding);
        }

        if (normalized.get("primaryColor") != null) {
            branding.setPrimaryColor((String) normalized.get("primaryColor"));
        }
        if (normalized.get("primaryColorDark") != null) {
            branding.setPrimaryColorDark((String) normalized.get("primaryColorDark"));
        }
        if (normalized.get("secondaryColor") != null) {
            branding.setSecondaryColor((String) normalized.get("secondaryColor"));
        }
        if (normalized.get("logoUrl") != null) {
            branding.setLogoUrl((String) normalized.get("logoUrl"));
        }
        if (normalized.get("logoUrlDark") != null) {
            branding.setLogoUrlDark((String) normalized.get("logoUrlDark"));
        }
        if (normalized.get("faviconUrl") != null) {
            branding.setFaviconUrl((String) normalized.get("faviconUrl"));
        }
        if (normalized.get("fontFamily") != null) {
            branding.setFontFamily((String) normalized.get("fontFamily"));
        }
        if (normalized.containsKey("customCss")) {
            branding.setCustomCss((String) normalized.get("customCss"));
        }
        if (normalized.get("loginBackgroundUrl") != null) {
            branding.setLoginBackgroundUrl((String) normalized.get("loginBackgroundUrl"));
        }
        if (normalized.get("surfaceColor") != null) {
            branding.setSurfaceColor((String) normalized.get("surfaceColor"));
        }
        if (normalized.get("textColor") != null) {
            branding.setTextColor((String) normalized.get("textColor"));
        }
        if (normalized.get("shadowDarkColor") != null) {
            branding.setShadowDarkColor((String) normalized.get("shadowDarkColor"));
        }
        if (normalized.get("shadowLightColor") != null) {
            branding.setShadowLightColor((String) normalized.get("shadowLightColor"));
        }
        if (normalized.get("cornerRadius") != null) {
            branding.setCornerRadius(((Number) normalized.get("cornerRadius")).intValue());
        }
        if (normalized.get("buttonDepth") != null) {
            branding.setButtonDepth(((Number) normalized.get("buttonDepth")).intValue());
        }
        if (normalized.get("shadowIntensity") != null) {
            branding.setShadowIntensity(((Number) normalized.get("shadowIntensity")).intValue());
        }
        if (normalized.get("softShadows") != null) {
            branding.setSoftShadows((Boolean) normalized.get("softShadows"));
        }
        if (normalized.get("compactNav") != null) {
            branding.setCompactNav((Boolean) normalized.get("compactNav"));
        }
        if (normalized.get("hoverButton") != null) {
            branding.setHoverButton((String) normalized.get("hoverButton"));
        }
        if (normalized.get("hoverCard") != null) {
            branding.setHoverCard((String) normalized.get("hoverCard"));
        }
        if (normalized.get("hoverInput") != null) {
            branding.setHoverInput((String) normalized.get("hoverInput"));
        }
        if (normalized.get("hoverNav") != null) {
            branding.setHoverNav((String) normalized.get("hoverNav"));
        }
        if (normalized.get("hoverTableRow") != null) {
            branding.setHoverTableRow((String) normalized.get("hoverTableRow"));
        }
        if (normalized.containsKey("componentTokens")) {
            Object componentTokensValue = normalized.get("componentTokens");
            if (componentTokensValue == null) {
                branding.setComponentTokens(null);
            } else {
                try {
                    String json = objectMapper.writeValueAsString(componentTokensValue);
                    if (json.getBytes(java.nio.charset.StandardCharsets.UTF_8).length > MAX_COMPONENT_TOKENS_BYTES) {
                        throw new IllegalArgumentException("componentTokens payload exceeds 512 KB limit");
                    }
                    branding.setComponentTokens(json);
                } catch (JsonProcessingException e) {
                    throw new RuntimeException("Failed to serialize componentTokens", e);
                }
            }
        }

        log.info("Branding updated for tenant: {}", tenantId);
        return tenantRepository.save(tenant);
    }

    @Override
    @Transactional(readOnly = true)
    public BrandingValidationResult validateBranding(String tenantId, java.util.Map<String, Object> request) {
        getTenantById(tenantId);
        return brandingPolicyEnforcer.validateAndNormalize(request);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getBranding(String tenantId) {
        TenantEntity tenant = getTenantById(tenantId);
        TenantBrandingEntity b = tenant.getBranding();
        log.debug("Fetching branding for tenant: {}", tenantId);
        return buildBrandingResponse(b);
    }

    private Map<String, Object> buildBrandingResponse(TenantBrandingEntity b) {
        Map<String, Object> map = new LinkedHashMap<>();
        if (b == null) {
            TenantBrandingEntity defaults = TenantBrandingEntity.builder().build();
            return buildBrandingResponse(defaults);
        }
        map.put("primaryColor", b.getPrimaryColor() != null ? b.getPrimaryColor() : "#428177");
        map.put("primaryColorDark", b.getPrimaryColorDark() != null ? b.getPrimaryColorDark() : "#054239");
        map.put("secondaryColor", b.getSecondaryColor() != null ? b.getSecondaryColor() : "#b9a779");
        map.put("surfaceColor", b.getSurfaceColor() != null ? b.getSurfaceColor() : "#edebe0");
        map.put("textColor", b.getTextColor() != null ? b.getTextColor() : "#3d3a3b");
        map.put("shadowDarkColor", b.getShadowDarkColor() != null ? b.getShadowDarkColor() : "#988561");
        map.put("shadowLightColor", b.getShadowLightColor() != null ? b.getShadowLightColor() : "#ffffff");
        map.put("logoUrl", b.getLogoUrl() != null ? b.getLogoUrl() : "");
        map.put("logoUrlDark", b.getLogoUrlDark() != null ? b.getLogoUrlDark() : "");
        map.put("faviconUrl", b.getFaviconUrl() != null ? b.getFaviconUrl() : "");
        map.put("loginBackgroundUrl", b.getLoginBackgroundUrl() != null ? b.getLoginBackgroundUrl() : "");
        map.put("fontFamily", b.getFontFamily() != null ? b.getFontFamily() : "'Gotham Rounded', 'Nunito', sans-serif");
        map.put("customCss", b.getCustomCss() != null ? b.getCustomCss() : "");
        map.put("cornerRadius", b.getCornerRadius() != null ? b.getCornerRadius() : 16);
        map.put("buttonDepth", b.getButtonDepth() != null ? b.getButtonDepth() : 12);
        map.put("shadowIntensity", b.getShadowIntensity() != null ? b.getShadowIntensity() : 50);
        map.put("softShadows", b.getSoftShadows() != null ? b.getSoftShadows() : true);
        map.put("compactNav", b.getCompactNav() != null ? b.getCompactNav() : false);
        map.put("hoverButton", b.getHoverButton() != null ? b.getHoverButton() : "lift");
        map.put("hoverCard", b.getHoverCard() != null ? b.getHoverCard() : "lift");
        map.put("hoverInput", b.getHoverInput() != null ? b.getHoverInput() : "press");
        map.put("hoverNav", b.getHoverNav() != null ? b.getHoverNav() : "slide");
        map.put("hoverTableRow", b.getHoverTableRow() != null ? b.getHoverTableRow() : "highlight");
        if (b.getComponentTokens() != null && !b.getComponentTokens().isBlank()) {
            try {
                Map<String, Object> tokens = objectMapper.readValue(
                    b.getComponentTokens(),
                    new TypeReference<Map<String, Object>>() {}
                );
                map.put("componentTokens", tokens);
            } catch (JsonProcessingException e) {
                log.warn("Failed to deserialize componentTokens for tenant {}: {}", b.getTenantId(), e.getMessage());
                map.put("componentTokens", Map.of());
            }
        }
        map.put("updatedAt", b.getUpdatedAt() != null ? b.getUpdatedAt().toString() : "");
        return map;
    }

    // Helper methods

    /**
     * Resolve tenant by either legacy tenant ID (e.g., tenant-master) or UUID.
     * This enables UUID-first API calls while preserving backward compatibility.
     */
    private TenantEntity resolveTenantByIdentifier(String tenantIdentifier) {
        if (tenantIdentifier == null || tenantIdentifier.isBlank()) {
            throw new TenantNotFoundException("Tenant identifier is required");
        }

        return tenantRepository.findById(tenantIdentifier)
            .or(() -> tryFindByUuid(tenantIdentifier))
            .orElseThrow(() -> new TenantNotFoundException("Tenant not found: " + tenantIdentifier));
    }

    private java.util.Optional<TenantEntity> tryFindByUuid(String tenantIdentifier) {
        try {
            return tenantRepository.findByUuid(UUID.fromString(tenantIdentifier));
        } catch (IllegalArgumentException ignored) {
            return java.util.Optional.empty();
        }
    }

    private String generateSlug(String fullName) {
        return normalizeSlug(fullName);
    }

    private String normalizeSlug(String input) {
        return input.toLowerCase()
            .replaceAll("[^a-z0-9]+", "-")
            .replaceAll("^-|-$", "");
    }

    private String generateVerificationToken() {
        return "bitx-verify=" + UUID.randomUUID().toString().replace("-", "");
    }

}
