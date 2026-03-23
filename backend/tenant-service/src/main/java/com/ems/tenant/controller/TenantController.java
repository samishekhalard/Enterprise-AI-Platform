package com.ems.tenant.controller;

import com.ems.common.dto.*;
import com.ems.common.enums.TenantStatus;
import com.ems.common.enums.TenantType;
import com.ems.common.exception.TenantNotFoundException;
import com.ems.tenant.controller.dto.BrandingUpdateRequest;
import com.ems.tenant.controller.dto.BrandingValidationResponse;
import com.ems.tenant.entity.TenantDomainEntity;
import com.ems.tenant.entity.TenantEntity;
import com.ems.tenant.mapper.TenantMapper;
import com.ems.tenant.service.TenantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tenants")
@RequiredArgsConstructor
@Tag(name = "Tenant Management", description = "APIs for managing tenants")
public class TenantController {

    private final TenantService tenantService;
    private final TenantMapper tenantMapper;

    @GetMapping
    @Operation(summary = "List all tenants", description = "Get paginated list of tenants with optional filters")
    public ResponseEntity<TenantListResponse> listTenants(
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "20") int limit,
        @RequestParam(required = false) TenantStatus status,
        @RequestParam(required = false) TenantType type,
        @RequestParam(required = false) String search
    ) {
        TenantListResponse response = tenantService.listTenants(page, limit, status, type, search);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{tenantId}")
    @Operation(summary = "Get tenant by ID")
    public ResponseEntity<TenantSummaryDTO> getTenant(@PathVariable String tenantId) {
        TenantEntity tenant = tenantService.getTenantById(tenantId);
        return ResponseEntity.ok(tenantMapper.toSummaryDTO(tenant));
    }

    @GetMapping("/resolve")
    @Operation(summary = "Resolve tenant from hostname", description = "Used by Angular APP_INITIALIZER to resolve tenant config")
    public ResponseEntity<Map<String, Object>> resolveTenant(
        @RequestHeader(value = "X-Forwarded-Host", required = false) String forwardedHost,
        @RequestHeader(value = "Host", required = false) String host
    ) {
        String hostname = forwardedHost != null ? forwardedHost : host;
        if (hostname == null || hostname.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "missing_host",
                "message", "Host header is required"
            ));
        }

        // Remove port if present
        hostname = hostname.split(":")[0];

        try {
            TenantEntity tenant = tenantService.resolveTenantByHostname(hostname);

            // Include auth providers in response
            var authProviders = tenant.getAuthProviders().stream()
                .filter(ap -> ap.isEnabled())
                .map(ap -> Map.of(
                    "id", ap.getId(),
                    "type", ap.getType().name().toLowerCase(),
                    "name", ap.getName(),
                    "displayName", ap.getDisplayName() != null ? ap.getDisplayName() : ap.getName(),
                    "icon", ap.getIcon() != null ? ap.getIcon() : "key",
                    "isEnabled", ap.isEnabled(),
                    "isPrimary", ap.isPrimary(),
                    "sortOrder", ap.getSortOrder()
                ))
                .toList();

            var tenantDto = tenantMapper.toSummaryDTO(tenant);

            // Include branding in response
            var branding = tenant.getBranding();
            var brandingMap = branding != null ? Map.of(
                "primaryColor", branding.getPrimaryColor() != null ? branding.getPrimaryColor() : "#428177",
                "primaryColorDark", branding.getPrimaryColorDark() != null ? branding.getPrimaryColorDark() : "#054239",
                "secondaryColor", branding.getSecondaryColor() != null ? branding.getSecondaryColor() : "#b9a779",
                "logoUrl", branding.getLogoUrl() != null ? branding.getLogoUrl() : "/assets/images/logo.svg",
                "faviconUrl", branding.getFaviconUrl() != null ? branding.getFaviconUrl() : "/assets/favicon.ico",
                "fontFamily", branding.getFontFamily() != null ? branding.getFontFamily() : "'Gotham Rounded', 'Nunito', sans-serif"
            ) : Map.of(
                "primaryColor", "#428177",
                "primaryColorDark", "#054239",
                "secondaryColor", "#b9a779",
                "logoUrl", "/assets/images/logo.svg",
                "faviconUrl", "/assets/favicon.ico",
                "fontFamily", "'Gotham Rounded', 'Nunito', sans-serif"
            );

            return ResponseEntity.ok(Map.of(
                "tenant", tenantDto,
                "authProviders", authProviders,
                "branding", brandingMap,
                "resolved", true,
                "hostname", hostname
            ));
        } catch (TenantNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                "error", "tenant_not_found",
                "message", "No organization found for domain",
                "resolved", false,
                "hostname", hostname
            ));
        }
    }

    @PostMapping
    @Operation(summary = "Create new tenant")
    public ResponseEntity<TenantSummaryDTO> createTenant(
        @Valid @RequestBody CreateTenantRequest request,
        Principal principal
    ) {
        TenantEntity tenant = tenantService.createTenant(request, getAuthenticatedSubject(principal));
        return ResponseEntity.status(HttpStatus.CREATED).body(tenantMapper.toSummaryDTO(tenant));
    }

    @PutMapping("/{tenantId}")
    @Operation(summary = "Update tenant")
    public ResponseEntity<TenantSummaryDTO> updateTenant(
        @PathVariable String tenantId,
        @Valid @RequestBody UpdateTenantRequest request
    ) {
        TenantEntity tenant = tenantService.updateTenant(tenantId, request);
        return ResponseEntity.ok(tenantMapper.toSummaryDTO(tenant));
    }

    @DeleteMapping("/{tenantId}")
    @Operation(summary = "Delete tenant")
    public ResponseEntity<Void> deleteTenant(@PathVariable String tenantId) {
        tenantService.deleteTenant(tenantId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{tenantId}/lock")
    @Operation(summary = "Lock tenant", description = "Prevents users from logging in")
    public ResponseEntity<TenantSummaryDTO> lockTenant(@PathVariable String tenantId) {
        TenantEntity tenant = tenantService.lockTenant(tenantId);
        return ResponseEntity.ok(tenantMapper.toSummaryDTO(tenant));
    }

    @PostMapping("/{tenantId}/unlock")
    @Operation(summary = "Unlock tenant")
    public ResponseEntity<TenantSummaryDTO> unlockTenant(@PathVariable String tenantId) {
        TenantEntity tenant = tenantService.unlockTenant(tenantId);
        return ResponseEntity.ok(tenantMapper.toSummaryDTO(tenant));
    }

    // Domain management

    @GetMapping("/{tenantId}/domains")
    @Operation(summary = "List tenant domains")
    public ResponseEntity<List<TenantDomainEntity>> getTenantDomains(@PathVariable String tenantId) {
        List<TenantDomainEntity> domains = tenantService.getTenantDomains(tenantId);
        return ResponseEntity.ok(domains);
    }

    @PostMapping("/{tenantId}/domains")
    @Operation(summary = "Add domain to tenant")
    public ResponseEntity<TenantDomainEntity> addDomain(
        @PathVariable String tenantId,
        @RequestBody Map<String, Object> request
    ) {
        String domain = (String) request.get("domain");
        boolean isPrimary = Boolean.TRUE.equals(request.get("isPrimary"));

        TenantDomainEntity domainEntity = tenantService.addDomain(tenantId, domain, isPrimary);
        return ResponseEntity.status(HttpStatus.CREATED).body(domainEntity);
    }

    @PostMapping("/{tenantId}/domains/{domainId}/verify")
    @Operation(summary = "Verify domain ownership")
    public ResponseEntity<TenantDomainEntity> verifyDomain(
        @PathVariable String tenantId,
        @PathVariable String domainId
    ) {
        TenantDomainEntity domain = tenantService.verifyDomain(tenantId, domainId);
        return ResponseEntity.ok(domain);
    }

    @DeleteMapping("/{tenantId}/domains/{domainId}")
    @Operation(summary = "Remove domain from tenant")
    public ResponseEntity<Void> removeDomain(
        @PathVariable String tenantId,
        @PathVariable String domainId
    ) {
        tenantService.removeDomain(tenantId, domainId);
        return ResponseEntity.noContent().build();
    }

    // Validation

    @GetMapping("/validate/slug/{slug}")
    @Operation(summary = "Check if slug is available")
    public ResponseEntity<Map<String, Boolean>> validateSlug(@PathVariable String slug) {
        boolean available = tenantService.isSlugAvailable(slug);
        return ResponseEntity.ok(Map.of("available", available));
    }

    // =========================================================================
    // Auth Provider Management
    // =========================================================================

    @PutMapping("/{tenantId}/auth-providers")
    @Operation(summary = "Configure auth providers", description = "Update authentication providers for tenant")
    public ResponseEntity<Map<String, Object>> updateAuthProviders(
        @PathVariable String tenantId,
        @RequestBody Map<String, Object> request
    ) {
        TenantEntity tenant = tenantService.updateAuthProviders(tenantId, request);
        var authProviders = tenant.getAuthProviders().stream()
            .map(ap -> Map.of(
                "id", ap.getId(),
                "type", ap.getType().name().toLowerCase(),
                "name", ap.getName(),
                "displayName", ap.getDisplayName() != null ? ap.getDisplayName() : ap.getName(),
                "icon", ap.getIcon() != null ? ap.getIcon() : "key",
                "isEnabled", ap.isEnabled(),
                "isPrimary", ap.isPrimary(),
                "sortOrder", ap.getSortOrder()
            ))
            .toList();
        return ResponseEntity.ok(Map.of("authProviders", authProviders));
    }

    // =========================================================================
    // Branding Management
    // =========================================================================

    @GetMapping("/{tenantId}/branding")
    @Operation(summary = "Get tenant branding", description = "Get tenant branding configuration with null-coalesced defaults")
    public ResponseEntity<Map<String, Object>> getBranding(@PathVariable String tenantId) {
        Map<String, Object> branding = tenantService.getBranding(tenantId);
        return ResponseEntity.ok(branding);
    }

    @PutMapping("/{tenantId}/branding")
    @Operation(summary = "Update branding", description = "Update tenant branding configuration")
    public ResponseEntity<Map<String, Object>> updateBranding(
        @PathVariable String tenantId,
        @RequestBody BrandingUpdateRequest request
    ) {
        tenantService.updateBranding(tenantId, request.toUpdateMap());
        Map<String, Object> branding = tenantService.getBranding(tenantId);
        return ResponseEntity.ok(branding);
    }

    @PostMapping("/{tenantId}/branding/validate")
    @Operation(summary = "Validate branding", description = "Validate branding payload without persisting")
    public ResponseEntity<BrandingValidationResponse> validateBranding(
        @PathVariable String tenantId,
        @RequestBody BrandingUpdateRequest request
    ) {
        var result = tenantService.validateBranding(tenantId, request.toUpdateMap());
        return ResponseEntity.ok(BrandingValidationResponse.from(result));
    }

    // =========================================================================
    // Full Tenant Config (for admin view)
    // =========================================================================

    @GetMapping("/{tenantId}/config")
    @Operation(summary = "Get full tenant config", description = "Get complete tenant configuration including auth, branding, session")
    public ResponseEntity<Map<String, Object>> getTenantConfig(@PathVariable String tenantId) {
        TenantEntity tenant = tenantService.getTenantById(tenantId);

        var authProviders = tenant.getAuthProviders().stream()
            .map(ap -> Map.of(
                "id", ap.getId(),
                "type", ap.getType().name().toLowerCase(),
                "name", ap.getName(),
                "displayName", ap.getDisplayName() != null ? ap.getDisplayName() : ap.getName(),
                "icon", ap.getIcon() != null ? ap.getIcon() : "key",
                "isEnabled", ap.isEnabled(),
                "isPrimary", ap.isPrimary(),
                "sortOrder", ap.getSortOrder(),
                "config", ap.getConfig()
            ))
            .toList();

        var branding = tenant.getBranding();
        var brandingMap = branding != null ? Map.of(
            "primaryColor", branding.getPrimaryColor(),
            "primaryColorDark", branding.getPrimaryColorDark(),
            "secondaryColor", branding.getSecondaryColor(),
            "logoUrl", branding.getLogoUrl() != null ? branding.getLogoUrl() : "",
            "faviconUrl", branding.getFaviconUrl() != null ? branding.getFaviconUrl() : "",
            "fontFamily", branding.getFontFamily()
        ) : Map.of();

        var sessionConfig = tenant.getSessionConfig();
        var sessionMap = sessionConfig != null ? Map.of(
            "accessTokenLifetime", sessionConfig.getAccessTokenLifetime(),
            "refreshTokenLifetime", sessionConfig.getRefreshTokenLifetime(),
            "idleTimeout", sessionConfig.getIdleTimeout(),
            "absoluteTimeout", sessionConfig.getAbsoluteTimeout(),
            "maxConcurrentSessions", sessionConfig.getMaxConcurrentSessions()
        ) : Map.of();

        var mfaConfig = tenant.getMfaConfig();
        var mfaMap = mfaConfig != null ? Map.of(
            "enabled", mfaConfig.isEnabled(),
            "required", mfaConfig.isRequired(),
            "allowedMethods", mfaConfig.getAllowedMethods(),
            "defaultMethod", mfaConfig.getDefaultMethod().name().toLowerCase()
        ) : Map.of();

        return ResponseEntity.ok(Map.of(
            "tenant", tenantMapper.toSummaryDTO(tenant),
            "authProviders", authProviders,
            "branding", brandingMap,
            "sessionConfig", sessionMap,
            "mfaConfig", mfaMap
        ));
    }

    private String getAuthenticatedSubject(Principal principal) {
        if (principal == null || principal.getName() == null || principal.getName().isBlank()) {
            throw new IllegalArgumentException("Authenticated principal is required");
        }
        return principal.getName();
    }
}
