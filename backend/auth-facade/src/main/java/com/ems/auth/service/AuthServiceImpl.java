package com.ems.auth.service;

import com.ems.auth.client.LicenseServiceClient;
import com.ems.auth.provider.IdentityProvider;
import com.ems.auth.provider.LoginInitiationResponse;
import com.ems.common.dto.auth.*;
import com.ems.common.exception.AuthenticationException;
import com.ems.common.exception.InvalidTokenException;
import com.ems.common.exception.MfaRequiredException;
import com.ems.auth.util.RealmResolver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * Auth Service implementation using the Strategy Pattern.
 *
 * This service is provider-agnostic - it delegates to whatever IdentityProvider
 * is configured (Keycloak, Auth0, FusionAuth, etc.).
 *
 * To switch providers:
 * 1. Set auth.facade.provider=new-provider in application.yml
 * 2. The corresponding IdentityProvider bean will be injected automatically
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    // Provider-agnostic identity provider (injected based on auth.facade.provider config)
    private final IdentityProvider identityProvider;
    private final TokenService tokenService;
    private final StringRedisTemplate redisTemplate;
    private final SeatValidationService seatValidationService;
    private final LicenseServiceClient licenseServiceClient;

    private static final String MFA_PENDING_PREFIX = "auth:mfa:pending:";

    @Override
    public AuthResponse login(String tenantId, LoginRequest request) {
        log.info("Login attempt for user {} in tenant {}", request.identifier(), tenantId);

        String realm = RealmResolver.resolve(tenantId);
        AuthResponse response = identityProvider.authenticate(realm, request.identifier(), request.password());

        // Validate user has an active license seat (skip for master tenant/admin)
        if (response.user() != null && !RealmResolver.isMasterTenant(tenantId)) {
            seatValidationService.validateUserSeat(tenantId, response.user().id());
        }

        // Check if MFA is required
        if (response.user() != null && identityProvider.isMfaEnabled(realm, response.user().id())) {
            log.debug("MFA required for user {}", request.identifier());

            // Store tokens temporarily for post-MFA
            String mfaSessionToken = tokenService.createMfaSessionToken(response.user().id(), tenantId);
            storePendingTokens(mfaSessionToken, response.accessToken(), response.refreshToken());

            throw new MfaRequiredException(mfaSessionToken);
        }

        log.info("Login successful for user {} in tenant {}", request.identifier(), tenantId);
        return response.withFeatures(fetchTenantFeatures(tenantId));
    }

    @Override
    public AuthResponse loginWithGoogle(String tenantId, GoogleTokenRequest request) {
        log.info("Google login attempt in tenant {}", tenantId);

        String realm = RealmResolver.resolve(tenantId);
        AuthResponse response = identityProvider.exchangeToken(realm, request.idToken(), "google");

        // Validate user has an active license seat (skip for master tenant/admin)
        if (response.user() != null && !RealmResolver.isMasterTenant(tenantId)) {
            seatValidationService.validateUserSeat(tenantId, response.user().id());
        }

        // Check MFA for social login too
        if (response.user() != null && identityProvider.isMfaEnabled(realm, response.user().id())) {
            String mfaSessionToken = tokenService.createMfaSessionToken(response.user().id(), tenantId);
            storePendingTokens(mfaSessionToken, response.accessToken(), response.refreshToken());
            throw new MfaRequiredException(mfaSessionToken);
        }

        log.info("Google login successful in tenant {}", tenantId);
        return response.withFeatures(fetchTenantFeatures(tenantId));
    }

    @Override
    public AuthResponse loginWithMicrosoft(String tenantId, MicrosoftTokenRequest request) {
        log.info("Microsoft login attempt in tenant {}", tenantId);

        String realm = RealmResolver.resolve(tenantId);
        AuthResponse response = identityProvider.exchangeToken(realm, request.accessToken(), "microsoft");

        // Validate user has an active license seat (skip for master tenant/admin)
        if (response.user() != null && !RealmResolver.isMasterTenant(tenantId)) {
            seatValidationService.validateUserSeat(tenantId, response.user().id());
        }

        // Check MFA for social login too
        if (response.user() != null && identityProvider.isMfaEnabled(realm, response.user().id())) {
            String mfaSessionToken = tokenService.createMfaSessionToken(response.user().id(), tenantId);
            storePendingTokens(mfaSessionToken, response.accessToken(), response.refreshToken());
            throw new MfaRequiredException(mfaSessionToken);
        }

        log.info("Microsoft login successful in tenant {}", tenantId);
        return response.withFeatures(fetchTenantFeatures(tenantId));
    }

    @Override
    public AuthResponse refreshToken(String tenantId, RefreshTokenRequest request) {
        log.debug("Token refresh in tenant {}", tenantId);

        String realm = RealmResolver.resolve(tenantId);
        return identityProvider.refreshToken(realm, request.refreshToken());
    }

    @Override
    public void logout(String tenantId, LogoutRequest request, String accessToken) {
        log.info("Logout in tenant {}", tenantId);

        // Blacklist the access token so it cannot be reused
        if (accessToken != null && !accessToken.isBlank()) {
            try {
                String tokenValue = accessToken.startsWith("Bearer ")
                        ? accessToken.substring(7)
                        : accessToken;
                String[] parts = tokenValue.split("\\.");
                if (parts.length == 3) {
                    String payload = new String(java.util.Base64.getUrlDecoder().decode(parts[1]));
                    com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                    com.fasterxml.jackson.databind.JsonNode claims = mapper.readTree(payload);
                    String jti = claims.has("jti") ? claims.get("jti").asText() : null;
                    long exp = claims.has("exp") ? claims.get("exp").asLong() : 0;
                    if (jti != null && exp > 0) {
                        tokenService.blacklistToken(jti, exp);
                        log.info("Access token blacklisted on logout for tenant {}", tenantId);
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to blacklist access token on logout: {}", e.getMessage());
            }
        }

        String realm = RealmResolver.resolve(tenantId);
        identityProvider.logout(realm, request.refreshToken());
    }

    @Override
    public MfaSetupResponse setupMfa(String userId, String tenantId, MfaSetupRequest request) {
        log.info("MFA setup for user {} in tenant {}", userId, tenantId);

        String realm = RealmResolver.resolve(tenantId);
        return identityProvider.setupMfa(realm, userId);
    }

    @Override
    public AuthResponse verifyMfa(String tenantId, MfaVerifyRequest request) {
        log.info("MFA verification in tenant {}", tenantId);

        // Validate MFA session token
        String userId = tokenService.validateMfaSessionToken(request.mfaSessionToken());

        String realm = RealmResolver.resolve(tenantId);
        boolean valid = identityProvider.verifyMfaCode(realm, userId, request.code());

        if (!valid) {
            throw new AuthenticationException("Invalid MFA code", "invalid_mfa_code");
        }

        // Retrieve and return pending tokens
        String[] tokens = retrievePendingTokens(request.mfaSessionToken());
        if (tokens == null) {
            throw new InvalidTokenException("MFA session expired");
        }

        // Invalidate MFA session
        tokenService.invalidateMfaSession(request.mfaSessionToken());
        deletePendingTokens(request.mfaSessionToken());

        // Parse access token to get user info
        UserInfo userInfo = extractUserInfoFromAccessToken(tokens[0]);

        log.info("MFA verification successful for user {}", userId);
        AuthResponse mfaResponse = AuthResponse.success(tokens[0], tokens[1], 300, userInfo);
        return mfaResponse.withFeatures(fetchTenantFeatures(tenantId));
    }

    @Override
    public UserInfo getCurrentUser(String userId, String tenantId) {
        // User info is already extracted from JWT in the filter
        // This could be enhanced to fetch additional details from Keycloak if needed
        return null; // Will be populated from security context
    }

    private void storePendingTokens(String mfaSessionToken, String accessToken, String refreshToken) {
        String key = MFA_PENDING_PREFIX + mfaSessionToken.hashCode();
        redisTemplate.opsForValue().set(key, accessToken + "|" + refreshToken, 5, TimeUnit.MINUTES);
    }

    private String[] retrievePendingTokens(String mfaSessionToken) {
        String key = MFA_PENDING_PREFIX + mfaSessionToken.hashCode();
        String value = redisTemplate.opsForValue().get(key);
        if (value == null) {
            return null;
        }
        return value.split("\\|", 2);
    }

    private void deletePendingTokens(String mfaSessionToken) {
        String key = MFA_PENDING_PREFIX + mfaSessionToken.hashCode();
        redisTemplate.delete(key);
    }

    private UserInfo extractUserInfoFromAccessToken(String accessToken) {
        try {
            // Simple JWT decode without validation (already validated by Keycloak)
            String[] parts = accessToken.split("\\.");
            if (parts.length != 3) {
                return null;
            }

            String payload = new String(java.util.Base64.getUrlDecoder().decode(parts[1]));
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            com.fasterxml.jackson.databind.JsonNode claims = mapper.readTree(payload);

            String userId = claims.has("sub") ? claims.get("sub").asText() : null;
            String email = claims.has("email") ? claims.get("email").asText() : null;
            String firstName = claims.has("given_name") ? claims.get("given_name").asText() : null;
            String lastName = claims.has("family_name") ? claims.get("family_name").asText() : null;
            String tenant = claims.has("tenant_id") ? claims.get("tenant_id").asText() : null;

            java.util.List<String> roles = new java.util.ArrayList<>();
            if (claims.has("realm_access") && claims.get("realm_access").has("roles")) {
                claims.get("realm_access").get("roles").forEach(role -> roles.add(role.asText()));
            }

            return new UserInfo(userId, email, firstName, lastName, tenant, roles);
        } catch (Exception e) {
            log.warn("Failed to extract user info from access token: {}", e.getMessage());
            return null;
        }
    }

    private List<String> fetchTenantFeatures(String tenantId) {
        try {
            List<String> features = licenseServiceClient.getUserFeatures(tenantId);
            log.debug("Fetched {} features for tenant {}", features != null ? features.size() : 0, tenantId);
            return features != null ? features : Collections.emptyList();
        } catch (Exception e) {
            log.warn("Failed to fetch tenant features for tenant {}: {}", tenantId, e.getMessage());
            return Collections.emptyList();
        }
    }
}
