package com.ems.tenant.controller;

import com.ems.common.dto.*;
import com.ems.common.enums.TenantStatus;
import com.ems.common.enums.TenantType;
import com.ems.tenant.controller.dto.BrandDraftUpdateRequest;
import com.ems.tenant.controller.dto.BrandRollbackRequest;
import com.ems.common.exception.TenantNotFoundException;
import com.ems.tenant.controller.dto.BrandingUpdateRequest;
import com.ems.tenant.controller.dto.BrandingValidationResponse;
import com.ems.tenant.entity.TenantDomainEntity;
import com.ems.tenant.entity.TenantEntity;
import com.ems.tenant.mapper.TenantMapper;
import com.ems.tenant.service.TenantService;
import com.ems.tenant.service.brandstudio.BrandStudioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tenants")
@RequiredArgsConstructor
@Tag(name = "Tenant Management", description = "APIs for managing tenants")
public class TenantController {

    private final TenantService tenantService;
    private final BrandStudioService brandStudioService;
    private final TenantMapper tenantMapper;

    @GetMapping
    @Operation(summary = "List all tenants", description = "Get paginated list of tenants with optional filters")
    public ResponseEntity<TenantListResponse> listTenants(
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "20") int limit,
        @RequestParam(required = false) TenantStatus status,
        @RequestParam(required = false) TenantType type,
        @RequestParam(required = false) String search,
        Authentication authentication
    ) {
        // TENANT_ADMIN users only see their own tenant
        if (isTenantAdmin(authentication) && !isSuperOrAdmin(authentication)) {
            String tenantId = extractTenantId(authentication);
            if (tenantId != null) {
                TenantEntity tenant = tenantService.getTenantById(tenantId);
                TenantSummaryDTO dto = tenantMapper.toSummaryDTO(tenant);
                return ResponseEntity.ok(new TenantListResponse(List.of(dto), 1, page, limit));
            }
        }
        TenantListResponse response = tenantService.listTenants(page, limit, status, type, search);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{tenantId}")
    @Operation(summary = "Get tenant by ID")
    public ResponseEntity<TenantSummaryDTO> getTenant(@PathVariable String tenantId, Authentication authentication) {
        enforceTenantScope(tenantId, authentication);
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

            var brandingMap = brandStudioService.getLegacyBranding(tenant.getId());
            var activeBrand = brandStudioService.getActiveBrand(tenant.getId());

            return ResponseEntity.ok(Map.of(
                "tenant", tenantDto,
                "authProviders", authProviders,
                "branding", brandingMap,
                "activeBrand", activeBrand,
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

    // =========================================================================
    // Tenant Lifecycle (US-TM-04)
    // =========================================================================

    @PostMapping("/{tenantId}/activate")
    @Operation(summary = "Activate pending tenant", description = "Transition PENDING tenant to ACTIVE status")
    public ResponseEntity<TenantSummaryDTO> activateTenant(
        @PathVariable String tenantId,
        @Valid @RequestBody ActivateTenantRequest request
    ) {
        TenantEntity tenant = tenantService.activateTenant(tenantId, request);
        return ResponseEntity.ok(tenantMapper.toSummaryDTO(tenant));
    }

    @PostMapping("/{tenantId}/suspend")
    @Operation(summary = "Suspend active tenant", description = "Transition ACTIVE tenant to SUSPENDED with reason")
    public ResponseEntity<TenantSummaryDTO> suspendTenant(
        @PathVariable String tenantId,
        @Valid @RequestBody SuspendTenantRequest request
    ) {
        TenantEntity tenant = tenantService.suspendTenantWithReason(tenantId, request);
        return ResponseEntity.ok(tenantMapper.toSummaryDTO(tenant));
    }

    @PostMapping("/{tenantId}/reactivate")
    @Operation(summary = "Reactivate suspended tenant", description = "Transition SUSPENDED tenant back to ACTIVE")
    public ResponseEntity<TenantSummaryDTO> reactivateTenant(@PathVariable String tenantId) {
        TenantEntity tenant = tenantService.reactivateTenant(tenantId);
        return ResponseEntity.ok(tenantMapper.toSummaryDTO(tenant));
    }

    @PostMapping("/{tenantId}/decommission")
    @Operation(summary = "Decommission suspended tenant", description = "Permanently retire a SUSPENDED tenant")
    public ResponseEntity<TenantSummaryDTO> decommissionTenant(
        @PathVariable String tenantId,
        @Valid @RequestBody DecommissionTenantRequest request
    ) {
        TenantEntity tenant = tenantService.decommissionTenant(tenantId, request);
        return ResponseEntity.ok(tenantMapper.toSummaryDTO(tenant));
    }

    // =========================================================================
    // Statistics (US-TM-01)
    // =========================================================================

    @GetMapping("/stats")
    @Operation(summary = "Get tenant statistics", description = "Total tenants, active count, etc.")
    public ResponseEntity<TenantStatsDTO> getTenantStats() {
        TenantStatsDTO stats = tenantService.getTenantStats();
        return ResponseEntity.ok(stats);
    }

    // =========================================================================
    // Validation
    // =========================================================================

    @GetMapping("/validate/slug/{slug}")
    @Operation(summary = "Check if slug is available")
    public ResponseEntity<Map<String, Boolean>> validateSlug(@PathVariable String slug) {
        boolean available = tenantService.isSlugAvailable(slug);
        return ResponseEntity.ok(Map.of("available", available));
    }

    @GetMapping("/validate/short-code/{shortCode}")
    @Operation(summary = "Check if short code is available")
    public ResponseEntity<Map<String, Boolean>> validateShortCode(@PathVariable String shortCode) {
        boolean available = tenantService.isShortCodeAvailable(shortCode);
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
        Map<String, Object> branding = brandStudioService.getLegacyBranding(tenantId);
        return ResponseEntity.ok(branding);
    }

    @PutMapping("/{tenantId}/branding")
    @Operation(summary = "Update branding", description = "Update tenant branding configuration")
    public ResponseEntity<Map<String, Object>> updateBranding(
        @PathVariable String tenantId,
        @RequestBody BrandingUpdateRequest request,
        Principal principal
    ) {
        Map<String, Object> branding = brandStudioService.saveLegacyBranding(
            tenantId,
            request.toUpdateMap(),
            getActorId(principal)
        );
        return ResponseEntity.ok(branding);
    }

    @PostMapping("/{tenantId}/branding/validate")
    @Operation(summary = "Validate branding", description = "Validate branding payload without persisting")
    public ResponseEntity<BrandingValidationResponse> validateBranding(
        @PathVariable String tenantId,
        @RequestBody BrandingUpdateRequest request
    ) {
        var result = brandStudioService.validateLegacyBranding(tenantId, request.toUpdateMap());
        return ResponseEntity.ok(BrandingValidationResponse.from(result));
    }

    @GetMapping("/{tenantId}/branding/draft")
    @Operation(summary = "Get brand draft", description = "Get the editable brand draft workspace")
    public ResponseEntity<Map<String, Object>> getBrandDraft(@PathVariable String tenantId) {
        return ResponseEntity.ok(brandStudioService.getDraft(tenantId));
    }

    @PutMapping("/{tenantId}/branding/draft")
    @Operation(summary = "Update brand draft", description = "Save the tenant brand draft workspace")
    public ResponseEntity<Map<String, Object>> updateBrandDraft(
        @PathVariable String tenantId,
        @RequestBody BrandDraftUpdateRequest request,
        Principal principal
    ) {
        return ResponseEntity.ok(brandStudioService.saveDraft(
            tenantId,
            request.selectedStarterKitId(),
            request.selectedPalettePackId(),
            request.selectedTypographyPackId(),
            request.selectedIconLibraryId(),
            request.manifestOverrides(),
            getActorId(principal)
        ));
    }

    @PostMapping("/{tenantId}/branding/draft/validate")
    @Operation(summary = "Validate brand draft", description = "Validate the current tenant brand draft without publishing")
    public ResponseEntity<BrandingValidationResponse> validateBrandDraft(@PathVariable String tenantId) {
        return ResponseEntity.ok(BrandingValidationResponse.from(brandStudioService.validateDraft(tenantId)));
    }

    @GetMapping("/{tenantId}/branding/history")
    @Operation(summary = "Get brand history", description = "List published brand profiles for compare and rollback")
    public ResponseEntity<List<Map<String, Object>>> getBrandHistory(@PathVariable String tenantId) {
        return ResponseEntity.ok(brandStudioService.getHistory(tenantId));
    }

    @PostMapping("/{tenantId}/branding/publish")
    @Operation(summary = "Publish brand draft", description = "Assemble and publish a new active brand profile")
    public ResponseEntity<Map<String, Object>> publishBrandDraft(
        @PathVariable String tenantId,
        Principal principal
    ) {
        return ResponseEntity.ok(brandStudioService.publishDraft(tenantId, getActorId(principal)));
    }

    @PostMapping("/{tenantId}/branding/rollback")
    @Operation(summary = "Rollback brand profile", description = "Restore a previous brand profile as the new active profile")
    public ResponseEntity<Map<String, Object>> rollbackBrand(
        @PathVariable String tenantId,
        @RequestBody BrandRollbackRequest request,
        Principal principal
    ) {
        return ResponseEntity.ok(brandStudioService.rollback(
            tenantId,
            request.targetBrandProfileId(),
            getActorId(principal)
        ));
    }

    @GetMapping("/{tenantId}/branding/assets")
    @Operation(summary = "List brand assets", description = "List tenant-managed brand assets")
    public ResponseEntity<List<Map<String, Object>>> listBrandAssets(@PathVariable String tenantId) {
        return ResponseEntity.ok(brandStudioService.listAssets(tenantId));
    }

    @GetMapping("/{tenantId}/branding/icon-library")
    @Operation(summary = "List icon libraries", description = "List tenant icon libraries used by object definitions")
    public ResponseEntity<List<Map<String, Object>>> listIconLibraries(@PathVariable String tenantId) {
        return ResponseEntity.ok(brandStudioService.listIconLibraries(tenantId));
    }

    @GetMapping("/{tenantId}/branding/starter-kits")
    @Operation(summary = "List starter kits", description = "List starter kits available to Brand Studio")
    public ResponseEntity<List<Map<String, Object>>> listStarterKits(@PathVariable String tenantId) {
        return ResponseEntity.ok(brandStudioService.listStarterKits());
    }

    @GetMapping("/{tenantId}/branding/palette-packs")
    @Operation(summary = "List palette packs", description = "List palette packs available to Brand Studio")
    public ResponseEntity<List<Map<String, Object>>> listPalettePacks(@PathVariable String tenantId) {
        return ResponseEntity.ok(brandStudioService.listPalettePacks());
    }

    @GetMapping("/{tenantId}/branding/typography-packs")
    @Operation(summary = "List typography packs", description = "List typography packs available to Brand Studio")
    public ResponseEntity<List<Map<String, Object>>> listTypographyPacks(@PathVariable String tenantId) {
        return ResponseEntity.ok(brandStudioService.listTypographyPacks());
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

        var brandingMap = brandStudioService.getLegacyBranding(tenantId);

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

    private String getActorId(Principal principal) {
        return principal != null && principal.getName() != null && !principal.getName().isBlank()
            ? principal.getName()
            : "system";
    }

    private void enforceTenantScope(String tenantId, Authentication auth) {
        if (isTenantAdmin(auth) && !isSuperOrAdmin(auth)) {
            String userTenantId = extractTenantId(auth);
            if (userTenantId != null && !userTenantId.equals(tenantId)) {
                throw new org.springframework.security.access.AccessDeniedException("Access denied to tenant: " + tenantId);
            }
        }
    }

    private boolean isTenantAdmin(Authentication auth) {
        return auth != null && auth.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .anyMatch("ROLE_TENANT_ADMIN"::equals);
    }

    private boolean isSuperOrAdmin(Authentication auth) {
        if (auth == null) return false;
        return auth.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .anyMatch(a -> "ROLE_SUPER_ADMIN".equals(a) || "ROLE_ADMIN".equals(a));
    }

    private String extractTenantId(Authentication auth) {
        if (auth instanceof JwtAuthenticationToken jwtAuth) {
            Jwt jwt = jwtAuth.getToken();
            return jwt.getClaimAsString("tenant_id");
        }
        return null;
    }
}
