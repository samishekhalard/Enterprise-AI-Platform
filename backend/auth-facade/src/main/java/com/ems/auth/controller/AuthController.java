package com.ems.auth.controller;

import com.ems.auth.config.AuthProperties;
import com.ems.auth.filter.JwtValidationFilter;
import com.ems.auth.filter.TenantContextFilter;
import com.ems.auth.provider.IdentityProvider;
import com.ems.auth.provider.LoginInitiationResponse;
import com.ems.auth.service.AuthService;
import com.ems.auth.util.RealmResolver;
import com.ems.common.dto.auth.*;
import com.ems.common.exception.AuthenticationException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
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
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Authentication", description = "Authentication and authorization endpoints")
public class AuthController {

    private final AuthService authService;
    private final IdentityProvider identityProvider;
    private final AuthProperties authProperties;

    @PostMapping("/login")
    @Operation(
            summary = "Login with email or username and password",
            description = "Authenticate user using Direct Access Grant (Resource Owner Password Credentials)"
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Login successful",
                    content = @Content(schema = @Schema(implementation = AuthResponse.class))),
            @ApiResponse(responseCode = "401", description = "Invalid credentials"),
            @ApiResponse(responseCode = "403", description = "MFA required - check mfaSessionToken in response"),
            @ApiResponse(responseCode = "429", description = "Rate limit exceeded")
    })
    public ResponseEntity<AuthResponse> login(
            @Parameter(description = "Tenant identifier", required = true)
            @RequestHeader(TenantContextFilter.TENANT_HEADER) String tenantId,
            @Valid @RequestBody LoginRequest request
    ) {
        AuthResponse response = authService.login(tenantId, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/social/google")
    @Operation(
            summary = "Login with Google One Tap",
            description = "Exchange Google ID token for application tokens"
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Login successful"),
            @ApiResponse(responseCode = "401", description = "Invalid or expired Google token"),
            @ApiResponse(responseCode = "403", description = "MFA required")
    })
    public ResponseEntity<AuthResponse> loginWithGoogle(
            @RequestHeader(TenantContextFilter.TENANT_HEADER) String tenantId,
            @Valid @RequestBody GoogleTokenRequest request
    ) {
        AuthResponse response = authService.loginWithGoogle(tenantId, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/social/microsoft")
    @Operation(
            summary = "Login with Microsoft MSAL",
            description = "Exchange Microsoft access token for application tokens"
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Login successful"),
            @ApiResponse(responseCode = "401", description = "Invalid or expired Microsoft token"),
            @ApiResponse(responseCode = "403", description = "MFA required")
    })
    public ResponseEntity<AuthResponse> loginWithMicrosoft(
            @RequestHeader(TenantContextFilter.TENANT_HEADER) String tenantId,
            @Valid @RequestBody MicrosoftTokenRequest request
    ) {
        AuthResponse response = authService.loginWithMicrosoft(tenantId, request);
        return ResponseEntity.ok(response);
    }

    // =========================================================================
    // Dynamic Provider Selection (kc_idp_hint / Identity Brokering)
    // =========================================================================

    @GetMapping("/login/{provider}")
    @Operation(
            summary = "Initiate login with specific identity provider",
            description = """
                Initiates OAuth2/OIDC login flow with a specific identity provider.
                Uses Keycloak's kc_idp_hint or equivalent for other providers.

                Supported providers: google, microsoft, facebook, github, saml, okta, azure-ad

                For redirect-based flows, returns HTTP 302 with Location header.
                For inline flows (e.g., direct grants), returns AuthResponse.
                """
    )
    @ApiResponses({
            @ApiResponse(responseCode = "302", description = "Redirect to identity provider"),
            @ApiResponse(responseCode = "200", description = "Inline authentication successful"),
            @ApiResponse(responseCode = "400", description = "Invalid provider or configuration")
    })
    public ResponseEntity<?> initiateProviderLogin(
            @RequestHeader(TenantContextFilter.TENANT_HEADER) String tenantId,
            @Parameter(description = "Identity provider alias (e.g., google, microsoft, saml)")
            @PathVariable String provider,
            @Parameter(description = "URL to redirect after successful authentication")
            @RequestParam(required = false, defaultValue = "/") String redirectUri
    ) {
        log.info("Initiating login with provider {} for tenant {}", provider, tenantId);

        String realm = RealmResolver.resolve(tenantId);
        LoginInitiationResponse initResponse = identityProvider.initiateLogin(realm, provider, redirectUri);

        if (initResponse.redirectRequired()) {
            // OAuth2/SAML redirect flow
            return ResponseEntity
                    .status(HttpStatus.FOUND)
                    .location(URI.create(initResponse.redirectUrl()))
                    .build();
        } else {
            // Direct/inline authentication (rare, but supported)
            return ResponseEntity.ok(initResponse.authResponse());
        }
    }

    @GetMapping("/providers")
    @Operation(
            summary = "List available identity providers",
            description = "Returns list of configured identity providers for the tenant. " +
                    "X-Tenant-ID header is optional; if omitted, returns default providers."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Provider list retrieved")
    })
    public ResponseEntity<Map<String, Object>> getAvailableProviders(
            @Parameter(description = "Tenant identifier (optional for default providers)")
            @RequestHeader(value = TenantContextFilter.TENANT_HEADER, required = false) String tenantId
    ) {
        // If no tenant specified, use "default" to return generic providers
        String effectiveTenant = (tenantId != null && !tenantId.isBlank())
                ? tenantId
                : "default";

        log.debug("Listing available providers for tenant: {}", effectiveTenant);

        // Return available providers for this tenant
        // This could be enhanced to fetch from Keycloak realm configuration
        Map<String, Object> providers = Map.of(
                "active", authProperties.getProvider(),
                "available", java.util.List.of(
                        Map.of("alias", "google", "name", "Google", "type", "oidc"),
                        Map.of("alias", "microsoft", "name", "Microsoft", "type", "oidc"),
                        Map.of("alias", "facebook", "name", "Facebook", "type", "oidc"),
                        Map.of("alias", "github", "name", "GitHub", "type", "oidc"),
                        Map.of("alias", "saml", "name", "Enterprise SAML", "type", "saml")
                ),
                "tenant", effectiveTenant
        );

        return ResponseEntity.ok(providers);
    }

    @PostMapping("/refresh")
    @Operation(
            summary = "Refresh access token",
            description = "Exchange refresh token for new access token (token rotation)"
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Token refreshed successfully"),
            @ApiResponse(responseCode = "401", description = "Invalid or expired refresh token")
    })
    public ResponseEntity<AuthResponse> refresh(
            @RequestHeader(TenantContextFilter.TENANT_HEADER) String tenantId,
            @Valid @RequestBody RefreshTokenRequest request
    ) {
        AuthResponse response = authService.refreshToken(tenantId, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    @Operation(
            summary = "Logout",
            description = "Invalidate refresh token and end session"
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Logout successful"),
            @ApiResponse(responseCode = "400", description = "Invalid request")
    })
    public ResponseEntity<Void> logout(
            @RequestHeader(TenantContextFilter.TENANT_HEADER) String tenantId,
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Valid @RequestBody LogoutRequest request
    ) {
        authService.logout(tenantId, request, authorization);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/mfa/setup")
    @Operation(
            summary = "Setup MFA",
            description = "Initialize TOTP MFA setup for authenticated user"
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "MFA setup initialized",
                    content = @Content(schema = @Schema(implementation = MfaSetupResponse.class))),
            @ApiResponse(responseCode = "401", description = "Not authenticated")
    })
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<MfaSetupResponse> setupMfa(
            @RequestHeader(TenantContextFilter.TENANT_HEADER) String tenantId,
            @Valid @RequestBody MfaSetupRequest request
    ) {
        UserInfo currentUser = JwtValidationFilter.getCurrentUser();
        if (currentUser == null) {
            throw new AuthenticationException("Not authenticated", "not_authenticated");
        }

        MfaSetupResponse response = authService.setupMfa(currentUser.id(), tenantId, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/mfa/verify")
    @Operation(
            summary = "Verify MFA code",
            description = "Verify TOTP code to complete MFA authentication or setup"
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "MFA verified successfully",
                    content = @Content(schema = @Schema(implementation = AuthResponse.class))),
            @ApiResponse(responseCode = "401", description = "Invalid MFA code or session")
    })
    public ResponseEntity<AuthResponse> verifyMfa(
            @RequestHeader(TenantContextFilter.TENANT_HEADER) String tenantId,
            @Valid @RequestBody MfaVerifyRequest request
    ) {
        AuthResponse response = authService.verifyMfa(tenantId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    @Operation(
            summary = "Get current user profile",
            description = "Get profile information for the authenticated user"
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "User profile retrieved",
                    content = @Content(schema = @Schema(implementation = UserInfo.class))),
            @ApiResponse(responseCode = "401", description = "Not authenticated")
    })
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<UserInfo> getCurrentUser() {
        UserInfo currentUser = JwtValidationFilter.getCurrentUser();
        if (currentUser == null) {
            throw new AuthenticationException("Not authenticated", "not_authenticated");
        }

        return ResponseEntity.ok(currentUser);
    }
}
