package com.ems.auth.controller;

import com.ems.auth.dto.ProviderConfigRequest;
import com.ems.auth.dto.ProviderConfigResponse;
import com.ems.auth.dto.ProviderPatchRequest;
import com.ems.auth.dto.TestConnectionResponse;
import com.ems.auth.provider.DynamicProviderResolver;
import com.ems.auth.provider.ProviderConfig;
import com.ems.auth.security.TenantAccessValidator;
import com.ems.auth.service.ProviderConnectionTester;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Admin Controller for managing Identity Providers per Tenant.
 *
 * This controller provides CRUD operations for dynamic identity provider
 * configuration. Each tenant can have multiple identity providers configured
 * (e.g., Keycloak, UAE Pass, Auth0, LDAP, SAML).
 *
 * All endpoints require ADMIN role.
 */
@RestController
@RequestMapping("/api/v1/admin/tenants/{tenantId}/providers")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin Provider Management", description = "Administrative endpoints for managing identity providers per tenant")
@SecurityRequirement(name = "bearerAuth")
public class AdminProviderController {

    private final DynamicProviderResolver dynamicProviderResolver;
    private final ProviderConnectionTester connectionTester;
    private final TenantAccessValidator tenantAccessValidator;

    /**
     * List all identity providers configured for a tenant.
     *
     * @param tenantId The tenant identifier
     * @return List of configured providers
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @Operation(
        summary = "List identity providers for tenant",
        description = """
            Returns all configured identity providers for the specified tenant.
            Each provider includes its configuration details (excluding sensitive data like secrets).

            Supports multiple provider types:
            - OIDC (Keycloak, Auth0, Okta, Azure AD)
            - SAML (Enterprise SSO)
            - LDAP (Active Directory, OpenLDAP)
            - OAuth2 (Custom providers)
            """
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Provider list retrieved successfully",
            content = @Content(
                array = @ArraySchema(schema = @Schema(implementation = ProviderConfigResponse.class))
            )
        ),
        @ApiResponse(responseCode = "401", description = "Not authenticated"),
        @ApiResponse(responseCode = "403", description = "Insufficient permissions (requires ADMIN role)"),
        @ApiResponse(responseCode = "404", description = "Tenant not found")
    })
    public ResponseEntity<List<ProviderConfigResponse>> listProviders(
            @Parameter(description = "Tenant identifier", required = true, example = "tenant-acme")
            @PathVariable String tenantId
    ) {
        // SEC-F02: Tenant isolation — prevent IDOR by verifying JWT tenant_id matches path param
        tenantAccessValidator.validateTenantAccess(tenantId);

        log.debug("Listing providers for tenant: {}", tenantId);

        List<ProviderConfig> providers = dynamicProviderResolver.listProviders(tenantId);
        List<ProviderConfigResponse> responses = providers.stream()
            .map(this::toResponse)
            .collect(Collectors.toList());

        log.info("Retrieved {} providers for tenant {}", responses.size(), tenantId);
        return ResponseEntity.ok(responses);
    }

    /**
     * Get a specific identity provider by ID.
     *
     * @param tenantId The tenant identifier
     * @param providerId The provider identifier
     * @return Provider configuration
     */
    @GetMapping("/{providerId}")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @Operation(
        summary = "Get identity provider by ID",
        description = "Returns the configuration for a specific identity provider. Sensitive data like secrets are masked."
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Provider retrieved successfully",
            content = @Content(schema = @Schema(implementation = ProviderConfigResponse.class))
        ),
        @ApiResponse(responseCode = "401", description = "Not authenticated"),
        @ApiResponse(responseCode = "403", description = "Insufficient permissions (requires ADMIN role)"),
        @ApiResponse(responseCode = "404", description = "Provider not found")
    })
    public ResponseEntity<ProviderConfigResponse> getProvider(
            @Parameter(description = "Tenant identifier", required = true, example = "tenant-acme")
            @PathVariable String tenantId,
            @Parameter(description = "Provider identifier", required = true, example = "keycloak-primary")
            @PathVariable String providerId
    ) {
        // SEC-F02: Tenant isolation — prevent IDOR by verifying JWT tenant_id matches path param
        tenantAccessValidator.validateTenantAccess(tenantId);

        log.debug("Getting provider {} for tenant {}", providerId, tenantId);

        ProviderConfig config = dynamicProviderResolver.resolveProvider(tenantId, providerId);

        log.info("Retrieved provider {} for tenant {}", providerId, tenantId);
        return ResponseEntity.ok(toResponse(config));
    }

    /**
     * Register a new identity provider for a tenant.
     *
     * @param tenantId The tenant identifier
     * @param request The provider configuration
     * @return Created provider configuration
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @Operation(
        summary = "Register new identity provider",
        description = """
            Registers a new identity provider for the specified tenant.

            **Supported Protocols:**
            - `OIDC` - OpenID Connect (requires discoveryUrl, clientId, clientSecret)
            - `SAML` - Security Assertion Markup Language (requires metadataUrl)
            - `LDAP` - Lightweight Directory Access Protocol (requires serverUrl, port, bindDn)
            - `OAUTH2` - Generic OAuth2 (requires clientId, clientSecret)

            **Provider Names:**
            - KEYCLOAK, AUTH0, OKTA, AZURE_AD, UAE_PASS, GOOGLE, MICROSOFT, GITHUB

            The provider will be available for authentication after registration.
            Use the `enabled` flag to control availability.
            """
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "201",
            description = "Provider registered successfully",
            content = @Content(schema = @Schema(implementation = ProviderConfigResponse.class))
        ),
        @ApiResponse(responseCode = "400", description = "Invalid provider configuration"),
        @ApiResponse(responseCode = "401", description = "Not authenticated"),
        @ApiResponse(responseCode = "403", description = "Insufficient permissions (requires ADMIN role)"),
        @ApiResponse(responseCode = "409", description = "Provider with same name already exists")
    })
    public ResponseEntity<ProviderConfigResponse> registerProvider(
            @Parameter(description = "Tenant identifier", required = true, example = "tenant-acme")
            @PathVariable String tenantId,
            @Valid @RequestBody ProviderConfigRequest request
    ) {
        // SEC-F02: Tenant isolation — prevent IDOR by verifying JWT tenant_id matches path param
        tenantAccessValidator.validateTenantAccess(tenantId);

        log.info("Registering new provider {} ({}) for tenant {}",
            request.providerName(), request.protocol(), tenantId);

        dynamicProviderResolver.registerProvider(tenantId, request);

        // Retrieve the created provider to return full response
        ProviderConfig config = dynamicProviderResolver.resolveProvider(tenantId, request.providerName());

        log.info("Successfully registered provider {} for tenant {}", request.providerName(), tenantId);
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(config));
    }

    /**
     * Update an existing identity provider.
     *
     * @param tenantId The tenant identifier
     * @param providerId The provider identifier
     * @param request The updated provider configuration
     * @return Updated provider configuration
     */
    @PutMapping("/{providerId}")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @Operation(
        summary = "Update identity provider",
        description = """
            Updates an existing identity provider configuration.

            **Note:** Changing the provider name or protocol may affect existing user sessions.
            It is recommended to disable the provider before making significant changes.

            Provider cache will be invalidated after update.
            """
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Provider updated successfully",
            content = @Content(schema = @Schema(implementation = ProviderConfigResponse.class))
        ),
        @ApiResponse(responseCode = "400", description = "Invalid provider configuration"),
        @ApiResponse(responseCode = "401", description = "Not authenticated"),
        @ApiResponse(responseCode = "403", description = "Insufficient permissions (requires ADMIN role)"),
        @ApiResponse(responseCode = "404", description = "Provider not found")
    })
    public ResponseEntity<ProviderConfigResponse> updateProvider(
            @Parameter(description = "Tenant identifier", required = true, example = "tenant-acme")
            @PathVariable String tenantId,
            @Parameter(description = "Provider identifier", required = true, example = "keycloak-primary")
            @PathVariable String providerId,
            @Valid @RequestBody ProviderConfigRequest request
    ) {
        // SEC-F02: Tenant isolation — prevent IDOR by verifying JWT tenant_id matches path param
        tenantAccessValidator.validateTenantAccess(tenantId);

        log.info("Updating provider {} for tenant {}", providerId, tenantId);

        dynamicProviderResolver.updateProvider(tenantId, providerId, request);

        // Retrieve the updated provider to return full response
        ProviderConfig config = dynamicProviderResolver.resolveProvider(tenantId, providerId);

        log.info("Successfully updated provider {} for tenant {}", providerId, tenantId);
        return ResponseEntity.ok(toResponse(config));
    }

    /**
     * Delete an identity provider.
     *
     * @param tenantId The tenant identifier
     * @param providerId The provider identifier
     * @return No content on success
     */
    @DeleteMapping("/{providerId}")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @Operation(
        summary = "Delete identity provider",
        description = """
            Deletes an identity provider from the tenant.

            **Warning:** This operation is irreversible. Users authenticated via this provider
            will need to re-authenticate using a different provider.

            Consider disabling the provider instead of deleting if you may need it later.
            """
    )
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Provider deleted successfully"),
        @ApiResponse(responseCode = "401", description = "Not authenticated"),
        @ApiResponse(responseCode = "403", description = "Insufficient permissions (requires ADMIN role)"),
        @ApiResponse(responseCode = "404", description = "Provider not found")
    })
    public ResponseEntity<Void> deleteProvider(
            @Parameter(description = "Tenant identifier", required = true, example = "tenant-acme")
            @PathVariable String tenantId,
            @Parameter(description = "Provider identifier", required = true, example = "keycloak-primary")
            @PathVariable String providerId
    ) {
        // SEC-F02: Tenant isolation — prevent IDOR by verifying JWT tenant_id matches path param
        tenantAccessValidator.validateTenantAccess(tenantId);

        log.info("Deleting provider {} for tenant {}", providerId, tenantId);

        dynamicProviderResolver.deleteProvider(tenantId, providerId);

        log.info("Successfully deleted provider {} for tenant {}", providerId, tenantId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Partially update an identity provider.
     *
     * @param tenantId The tenant identifier
     * @param providerId The provider identifier
     * @param request The partial update request
     * @return Updated provider configuration
     */
    @PatchMapping("/{providerId}")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @Operation(
        summary = "Partially update identity provider",
        description = """
            Partially updates an identity provider configuration.

            Use this endpoint to enable/disable a provider or update its priority
            without sending the full configuration.
            """
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Provider updated successfully",
            content = @Content(schema = @Schema(implementation = ProviderConfigResponse.class))
        ),
        @ApiResponse(responseCode = "400", description = "Invalid patch request"),
        @ApiResponse(responseCode = "401", description = "Not authenticated"),
        @ApiResponse(responseCode = "403", description = "Insufficient permissions (requires ADMIN role)"),
        @ApiResponse(responseCode = "404", description = "Provider not found")
    })
    public ResponseEntity<ProviderConfigResponse> patchProvider(
            @Parameter(description = "Tenant identifier", required = true, example = "tenant-acme")
            @PathVariable String tenantId,
            @Parameter(description = "Provider identifier", required = true, example = "keycloak-primary")
            @PathVariable String providerId,
            @RequestBody ProviderPatchRequest request
    ) {
        // SEC-F02: Tenant isolation — prevent IDOR by verifying JWT tenant_id matches path param
        tenantAccessValidator.validateTenantAccess(tenantId);

        log.info("Patching provider {} for tenant {} with {}", providerId, tenantId, request);

        if (!request.hasUpdates()) {
            return ResponseEntity.badRequest().build();
        }

        // Get current config and apply patch
        ProviderConfig currentConfig = dynamicProviderResolver.resolveProvider(tenantId, providerId);

        // Build updated request from current config with patch applied
        ProviderConfigRequest updateRequest = new ProviderConfigRequest(
            currentConfig.providerName(),
            request.displayName() != null ? request.displayName() : currentConfig.displayName(),
            currentConfig.protocol(),
            currentConfig.clientId(),
            currentConfig.clientSecret(),
            currentConfig.discoveryUrl(),
            currentConfig.metadataUrl(),
            currentConfig.serverUrl(),
            currentConfig.port(),
            currentConfig.bindDn(),
            currentConfig.bindPassword(),
            currentConfig.userSearchBase(),
            currentConfig.userSearchFilter(),
            currentConfig.idpHint(),
            currentConfig.scopes(),
            currentConfig.authorizationUrl(),
            currentConfig.tokenUrl(),
            currentConfig.userInfoUrl(),
            currentConfig.jwksUrl(),
            currentConfig.issuerUrl(),
            request.enabled() != null ? request.enabled() : currentConfig.enabled(),
            request.priority() != null ? request.priority() : currentConfig.priority(),
            currentConfig.trustEmail(),
            currentConfig.storeToken(),
            currentConfig.linkExistingAccounts()
        );

        dynamicProviderResolver.updateProvider(tenantId, providerId, updateRequest);

        ProviderConfig updatedConfig = dynamicProviderResolver.resolveProvider(tenantId, providerId);

        log.info("Successfully patched provider {} for tenant {}", providerId, tenantId);
        return ResponseEntity.ok(toResponse(updatedConfig));
    }

    /**
     * Test connection to an identity provider.
     *
     * @param tenantId The tenant identifier
     * @param providerId The provider identifier
     * @return Connection test result
     */
    @PostMapping("/{providerId}/test")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @Operation(
        summary = "Test provider connection",
        description = """
            Tests connectivity to an identity provider.

            For OIDC providers: Fetches and validates the discovery document.
            For SAML providers: Fetches and validates the metadata.
            For LDAP providers: Attempts a bind operation.
            For OAuth2 providers: Tests endpoint accessibility.
            """
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Connection test completed",
            content = @Content(schema = @Schema(implementation = TestConnectionResponse.class))
        ),
        @ApiResponse(responseCode = "401", description = "Not authenticated"),
        @ApiResponse(responseCode = "403", description = "Insufficient permissions (requires ADMIN role)"),
        @ApiResponse(responseCode = "404", description = "Provider not found")
    })
    public ResponseEntity<TestConnectionResponse> testConnection(
            @Parameter(description = "Tenant identifier", required = true, example = "tenant-acme")
            @PathVariable String tenantId,
            @Parameter(description = "Provider identifier", required = true, example = "keycloak-primary")
            @PathVariable String providerId
    ) {
        // SEC-F02: Tenant isolation — prevent IDOR by verifying JWT tenant_id matches path param
        tenantAccessValidator.validateTenantAccess(tenantId);

        log.info("Testing connection for provider {} in tenant {}", providerId, tenantId);

        TestConnectionResponse result = connectionTester.testConnection(tenantId, providerId);

        log.info("Connection test for provider {} in tenant {}: success={}",
            providerId, tenantId, result.success());
        return ResponseEntity.ok(result);
    }

    /**
     * Validate provider configuration without saving.
     *
     * @param tenantId The tenant identifier
     * @param request The provider configuration to validate
     * @return Validation result
     */
    @PostMapping("/validate")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @Operation(
        summary = "Validate provider configuration",
        description = """
            Validates a provider configuration without persisting it.

            Use this to check if a configuration is valid before saving.
            Validates required fields based on the protocol type.
            """
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Validation completed",
            content = @Content(schema = @Schema(implementation = TestConnectionResponse.class))
        ),
        @ApiResponse(responseCode = "401", description = "Not authenticated"),
        @ApiResponse(responseCode = "403", description = "Insufficient permissions (requires ADMIN role)")
    })
    public ResponseEntity<TestConnectionResponse> validateConfig(
            @Parameter(description = "Tenant identifier", required = true, example = "tenant-acme")
            @PathVariable String tenantId,
            @Valid @RequestBody ProviderConfigRequest request
    ) {
        // SEC-F02: Tenant isolation — prevent IDOR by verifying JWT tenant_id matches path param
        tenantAccessValidator.validateTenantAccess(tenantId);

        log.info("Validating provider configuration for {} in tenant {}",
            request.providerName(), tenantId);

        TestConnectionResponse result = connectionTester.validateConfig(request);

        log.info("Validation for provider {} in tenant {}: success={}",
            request.providerName(), tenantId, result.success());
        return ResponseEntity.ok(result);
    }

    /**
     * Invalidate provider cache for a tenant.
     *
     * @param tenantId The tenant identifier
     * @return No content on success
     */
    @PostMapping("/cache/invalidate")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @Operation(
        summary = "Invalidate provider cache",
        description = """
            Forces invalidation of the provider cache for the specified tenant.

            Use this after making direct database changes or when troubleshooting
            provider configuration issues.
            """
    )
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Cache invalidated successfully"),
        @ApiResponse(responseCode = "401", description = "Not authenticated"),
        @ApiResponse(responseCode = "403", description = "Insufficient permissions (requires ADMIN role)")
    })
    public ResponseEntity<Void> invalidateCache(
            @Parameter(description = "Tenant identifier", required = true, example = "tenant-acme")
            @PathVariable String tenantId
    ) {
        // SEC-F02: Tenant isolation — prevent IDOR by verifying JWT tenant_id matches path param
        tenantAccessValidator.validateTenantAccess(tenantId);

        log.info("Invalidating provider cache for tenant {}", tenantId);

        dynamicProviderResolver.invalidateCache(tenantId);

        log.info("Successfully invalidated provider cache for tenant {}", tenantId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Convert ProviderConfig to ProviderConfigResponse.
     * Masks sensitive data like secrets.
     */
    private ProviderConfigResponse toResponse(ProviderConfig config) {
        return ProviderConfigResponse.builder()
            .id(config.id())
            .providerName(config.providerName())
            .providerType(config.providerName()) // providerType same as providerName
            .displayName(config.displayName())
            .protocol(config.protocol())
            .clientId(config.clientId())
            .clientSecret(maskSecret(config.clientSecret()))
            .discoveryUrl(config.discoveryUrl())
            .metadataUrl(config.metadataUrl())
            .serverUrl(config.serverUrl())
            .port(config.port())
            .bindDn(maskSecret(config.bindDn()))
            .userSearchBase(config.userSearchBase())
            .idpHint(config.idpHint())
            .scopes(config.scopes())
            .pkceEnabled(null) // Will be populated if stored in config
            .enabled(config.enabled())
            .priority(config.priority())
            .createdAt(config.createdAt())
            .updatedAt(config.updatedAt())
            .lastTestedAt(null) // Will be populated from cache/database
            .testResult(null) // Will be populated from cache/database
            .build();
    }

    /**
     * Mask sensitive values for response.
     */
    private String maskSecret(String secret) {
        if (secret == null || secret.isEmpty()) {
            return null;
        }
        if (secret.length() <= 4) {
            return "****";
        }
        return secret.substring(0, 2) + "****" + secret.substring(secret.length() - 2);
    }
}
