package com.ems.auth.provider;

import com.ems.auth.config.KeycloakConfig;
import com.ems.auth.security.PrincipalExtractor;
import com.ems.common.dto.auth.*;
import com.ems.common.exception.AuthenticationException;
import com.ems.common.exception.InvalidCredentialsException;
import com.ems.common.exception.InvalidTokenException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.samstevens.totp.code.*;
import dev.samstevens.totp.qr.QrData;
import dev.samstevens.totp.qr.QrGenerator;
import dev.samstevens.totp.qr.ZxingPngQrGenerator;
import dev.samstevens.totp.recovery.RecoveryCodeGenerator;
import dev.samstevens.totp.secret.DefaultSecretGenerator;
import dev.samstevens.totp.secret.SecretGenerator;
import dev.samstevens.totp.time.SystemTimeProvider;
import dev.samstevens.totp.time.TimeProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.admin.client.resource.UserResource;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.EventRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

import static dev.samstevens.totp.util.Utils.getDataUriForImage;

/**
 * Keycloak implementation of IdentityProvider.
 *
 * To switch to a different provider (Auth0, FusionAuth, etc.):
 * 1. Create a new class implementing IdentityProvider
 * 2. Annotate with @ConditionalOnProperty(name = "auth.facade.provider", havingValue = "new-provider")
 * 3. Set auth.facade.provider=new-provider in application.yml
 *
 * This class will not be loaded when auth.facade.provider != keycloak.
 */
@Service
@ConditionalOnProperty(name = "auth.facade.provider", havingValue = "keycloak", matchIfMissing = true)
@RequiredArgsConstructor
@Slf4j
public class KeycloakIdentityProvider implements IdentityProvider {

    private static final String PROVIDER_TYPE = "keycloak";

    private final KeycloakConfig keycloakConfig;
    private final PrincipalExtractor principalExtractor;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    // TOTP utilities
    private final SecretGenerator secretGenerator = new DefaultSecretGenerator();
    private final QrGenerator qrGenerator = new ZxingPngQrGenerator();
    private final RecoveryCodeGenerator recoveryCodeGenerator = new RecoveryCodeGenerator();

    @Override
    public AuthResponse authenticate(String realm, String identifier, String password) {
        log.debug("Keycloak: Attempting login for user {} in realm {}", identifier, realm);

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("grant_type", "password");
        params.add("client_id", keycloakConfig.getClient().getClientId());
        params.add("client_secret", keycloakConfig.getClient().getClientSecret());
        params.add("username", identifier);
        params.add("password", password);
        params.add("scope", "openid profile email");

        try {
            ResponseEntity<String> response = executeTokenRequest(realm, params);
            return parseTokenResponse(response.getBody());
        } catch (ResourceAccessException e) {
            log.error("Keycloak connection failed during login in realm {}: {}", realm, e.getMessage());
            throw providerUnavailableException();
        } catch (HttpClientErrorException e) {
            log.warn("Keycloak login failed for user {}: {}", identifier, e.getStatusCode());
            if (e.getStatusCode() == HttpStatus.UNAUTHORIZED) {
                throw new InvalidCredentialsException();
            }
            throw new AuthenticationException("Authentication request failed", "authentication_failed");
        }
    }

    @Override
    public AuthResponse refreshToken(String realm, String refreshToken) {
        log.debug("Keycloak: Refreshing token in realm {}", realm);

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("grant_type", "refresh_token");
        params.add("client_id", keycloakConfig.getClient().getClientId());
        params.add("client_secret", keycloakConfig.getClient().getClientSecret());
        params.add("refresh_token", refreshToken);

        try {
            ResponseEntity<String> response = executeTokenRequest(realm, params);
            return parseTokenResponse(response.getBody());
        } catch (ResourceAccessException e) {
            log.error("Keycloak connection failed during token refresh in realm {}: {}", realm, e.getMessage());
            throw providerUnavailableException();
        } catch (HttpClientErrorException e) {
            log.warn("Keycloak token refresh failed: {}", e.getStatusCode());
            if (e.getStatusCode() == HttpStatus.BAD_REQUEST) {
                throw new InvalidTokenException("Invalid or expired refresh token");
            }
            throw new AuthenticationException("Token refresh failed", "authentication_failed");
        }
    }

    @Override
    public void logout(String realm, String refreshToken) {
        log.debug("Keycloak: Logging out in realm {}", realm);

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("client_id", keycloakConfig.getClient().getClientId());
        params.add("client_secret", keycloakConfig.getClient().getClientSecret());
        params.add("refresh_token", refreshToken);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

            restTemplate.postForEntity(keycloakConfig.getLogoutEndpoint(realm), request, Void.class);
        } catch (HttpClientErrorException e) {
            log.warn("Keycloak logout request failed: {}", e.getMessage());
            // Don't throw - logout should be idempotent
        }
    }

    @Override
    public AuthResponse exchangeToken(String realm, String token, String providerHint) {
        log.debug("Keycloak: Exchanging {} token in realm {}", providerHint, realm);

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("grant_type", "urn:ietf:params:oauth:grant-type:token-exchange");
        params.add("client_id", keycloakConfig.getClient().getClientId());
        params.add("client_secret", keycloakConfig.getClient().getClientSecret());
        params.add("subject_token", token);
        params.add("subject_issuer", providerHint);
        params.add("scope", "openid profile email");

        // Token type varies by provider
        String tokenType = determineTokenType(providerHint);
        params.add("subject_token_type", tokenType);

        try {
            ResponseEntity<String> response = executeTokenRequest(realm, params);
            return parseTokenResponse(response.getBody());
        } catch (ResourceAccessException e) {
            log.error("Keycloak connection failed during token exchange in realm {}: {}", realm, e.getMessage());
            throw providerUnavailableException();
        } catch (HttpClientErrorException e) {
            log.warn("Keycloak token exchange failed for {}: {}", providerHint, e.getStatusCode());
            throw new AuthenticationException(providerHint + " authentication failed", "authentication_failed");
        }
    }

    @Override
    public LoginInitiationResponse initiateLogin(String realm, String providerHint, String redirectUri) {
        log.debug("Keycloak: Initiating login via {} in realm {}", providerHint, realm);

        // Build the Keycloak authorization URL with kc_idp_hint
        String authUrl = UriComponentsBuilder
            .fromUriString(keycloakConfig.getServerUrl())
            .pathSegment("realms", realm, "protocol", "openid-connect", "auth")
            .queryParam("client_id", keycloakConfig.getClient().getClientId())
            .queryParam("redirect_uri", redirectUri)
            .queryParam("response_type", "code")
            .queryParam("scope", "openid profile email")
            .queryParam("kc_idp_hint", providerHint)  // Skip Keycloak login, go direct to IdP
            .build()
            .toUriString();

        String state = UUID.randomUUID().toString();

        return LoginInitiationResponse.redirect(authUrl + "&state=" + state, state);
    }

    @Override
    public MfaSetupResponse setupMfa(String realm, String userId) {
        log.debug("Keycloak: Setting up MFA for user {} in realm {}", userId, realm);

        String secret = secretGenerator.generate();

        try (Keycloak keycloak = getAdminClient()) {
            UserResource userResource = keycloak.realm(realm).users().get(userId);
            UserRepresentation user = userResource.toRepresentation();

            QrData qrData = new QrData.Builder()
                .label(user.getEmail())
                .secret(secret)
                .issuer("EMS")
                .algorithm(HashingAlgorithm.SHA1)
                .digits(6)
                .period(30)
                .build();

            String qrCodeUri = getDataUriForImage(qrGenerator.generate(qrData), qrGenerator.getImageMimeType());
            String[] recoveryCodes = recoveryCodeGenerator.generateCodes(8);

            // Store pending secret
            user.singleAttribute("totp_secret_pending", secret);
            user.singleAttribute("recovery_codes_pending", String.join(",", recoveryCodes));
            userResource.update(user);

            return MfaSetupResponse.totp(secret, qrCodeUri, recoveryCodes);
        } catch (Exception e) {
            log.error("Keycloak: Failed to setup MFA for user {}: {}", userId, e.getMessage());
            throw new AuthenticationException("Failed to setup MFA", "authentication_failed");
        }
    }

    @Override
    public boolean verifyMfaCode(String realm, String userId, String code) {
        log.debug("Keycloak: Verifying MFA code for user {} in realm {}", userId, realm);

        try (Keycloak keycloak = getAdminClient()) {
            UserResource userResource = keycloak.realm(realm).users().get(userId);
            UserRepresentation user = userResource.toRepresentation();

            // First check pending secret (during setup)
            String secret = user.firstAttribute("totp_secret_pending");
            boolean isPending = true;

            if (secret == null) {
                secret = user.firstAttribute("totp_secret");
                isPending = false;
            }

            if (secret == null) {
                log.warn("Keycloak: No TOTP secret found for user {}", userId);
                return false;
            }

            TimeProvider timeProvider = new SystemTimeProvider();
            CodeGenerator codeGenerator = new DefaultCodeGenerator();
            CodeVerifier verifier = new DefaultCodeVerifier(codeGenerator, timeProvider);

            boolean valid = verifier.isValidCode(secret, code);

            if (valid && isPending) {
                // Confirm MFA setup
                String recoveryCodes = user.firstAttribute("recovery_codes_pending");
                user.singleAttribute("totp_secret", secret);
                user.singleAttribute("recovery_codes", recoveryCodes);
                user.getAttributes().remove("totp_secret_pending");
                user.getAttributes().remove("recovery_codes_pending");
                user.singleAttribute("mfa_enabled", "true");

                CredentialRepresentation credential = new CredentialRepresentation();
                credential.setType("otp");
                credential.setSecretData(secret);
                userResource.update(user);

                log.info("Keycloak: MFA confirmed and enabled for user {}", userId);
            }

            return valid;
        } catch (Exception e) {
            log.error("Keycloak: Failed to verify MFA code for user {}: {}", userId, e.getMessage());
            return false;
        }
    }

    @Override
    public boolean isMfaEnabled(String realm, String userId) {
        try (Keycloak keycloak = getAdminClient()) {
            UserResource userResource = keycloak.realm(realm).users().get(userId);
            UserRepresentation user = userResource.toRepresentation();
            return "true".equals(user.firstAttribute("mfa_enabled"));
        } catch (Exception e) {
            log.warn("Keycloak: Failed to check MFA status for user {}: {}", userId, e.getMessage());
            return false;
        }
    }

    @Override
    public List<AuthEventDTO> getEvents(String realm, AuthEventQuery query) {
        log.debug("Keycloak: Fetching auth events for realm {}", realm);

        try (Keycloak keycloak = getAdminClient()) {
            RealmResource realmResource = keycloak.realm(realm);

            List<String> types = query.types();
            String userId = query.userId();
            String ipAddress = query.ipAddress();
            Long dateFrom = query.dateFrom() != null ? query.dateFrom().toEpochMilli() : null;
            Long dateTo = query.dateTo() != null ? query.dateTo().toEpochMilli() : null;
            Integer first = query.first() != null ? query.first() : 0;
            Integer max = query.max() != null ? query.max() : 100;

            List<EventRepresentation> events = realmResource.getEvents(
                types, null, userId,
                dateFrom != null ? dateFrom.toString() : null,
                dateTo != null ? dateTo.toString() : null,
                ipAddress, first, max
            );

            return events.stream()
                .map(this::mapEventToDTO)
                .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Keycloak: Failed to fetch events for realm {}: {}", realm, e.getMessage());
            return Collections.emptyList();
        }
    }

    @Override
    public long getEventCount(String realm, AuthEventQuery query) {
        try (Keycloak keycloak = getAdminClient()) {
            RealmResource realmResource = keycloak.realm(realm);

            List<String> types = query.types();
            String userId = query.userId();
            Long dateFrom = query.dateFrom() != null ? query.dateFrom().toEpochMilli() : null;
            Long dateTo = query.dateTo() != null ? query.dateTo().toEpochMilli() : null;

            List<EventRepresentation> events = realmResource.getEvents(
                types, null, userId,
                dateFrom != null ? dateFrom.toString() : null,
                dateTo != null ? dateTo.toString() : null,
                query.ipAddress(), 0, 10000
            );

            return events.size();
        } catch (Exception e) {
            log.error("Keycloak: Failed to get event count for realm {}: {}", realm, e.getMessage());
            return 0;
        }
    }

    @Override
    public boolean supports(String providerType) {
        return PROVIDER_TYPE.equalsIgnoreCase(providerType);
    }

    @Override
    public String getProviderType() {
        return PROVIDER_TYPE;
    }

    // =========================================================================
    // Private Helper Methods
    // =========================================================================

    private ResponseEntity<String> executeTokenRequest(String realm, MultiValueMap<String, String> params) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

        return restTemplate.postForEntity(
            keycloakConfig.getTokenEndpoint(realm),
            request,
            String.class
        );
    }

    private String determineTokenType(String providerHint) {
        return switch (providerHint.toLowerCase()) {
            case "google" -> "urn:ietf:params:oauth:token-type:jwt";
            case "microsoft", "azure-ad" -> "urn:ietf:params:oauth:token-type:access_token";
            default -> "urn:ietf:params:oauth:token-type:access_token";
        };
    }

    private Keycloak getAdminClient() {
        return KeycloakBuilder.builder()
            .serverUrl(keycloakConfig.getServerUrl())
            .realm(keycloakConfig.getMasterRealm())
            .clientId(keycloakConfig.getAdmin().getClientId())
            .username(keycloakConfig.getAdmin().getUsername())
            .password(keycloakConfig.getAdmin().getPassword())
            .build();
    }

    private AuthenticationException providerUnavailableException() {
        return new AuthenticationException(
            "Authentication provider is unavailable. Verify Keycloak is running and try again.",
            "auth_provider_unavailable"
        );
    }

    private AuthResponse parseTokenResponse(String responseBody) {
        try {
            JsonNode json = objectMapper.readTree(responseBody);

            String accessToken = json.get("access_token").asText();
            String refreshToken = json.has("refresh_token") ? json.get("refresh_token").asText() : null;
            long expiresIn = json.get("expires_in").asLong();

            // Use PrincipalExtractor for provider-agnostic user info extraction
            UserInfo userInfo = extractUserInfoFromToken(accessToken);

            return AuthResponse.success(accessToken, refreshToken, expiresIn, userInfo);
        } catch (Exception e) {
            log.error("Keycloak: Failed to parse token response: {}", e.getMessage());
            throw new AuthenticationException("Failed to process authentication response", "authentication_failed");
        }
    }

    @SuppressWarnings("unchecked")
    private UserInfo extractUserInfoFromToken(String accessToken) {
        try {
            String[] parts = accessToken.split("\\.");
            if (parts.length != 3) return null;

            String payload = new String(Base64.getUrlDecoder().decode(parts[1]));
            Map<String, Object> claims = objectMapper.readValue(payload, Map.class);

            // Delegate to PrincipalExtractor for provider-agnostic extraction
            return principalExtractor.extractUserInfo(claims);
        } catch (Exception e) {
            log.warn("Keycloak: Failed to extract user info from token: {}", e.getMessage());
            return null;
        }
    }

    private AuthEventDTO mapEventToDTO(EventRepresentation event) {
        String eventId = String.format("%s-%s-%d",
            event.getType(),
            event.getUserId() != null ? event.getUserId() : "unknown",
            event.getTime());

        return new AuthEventDTO(
            eventId,
            event.getType(),
            event.getUserId(),
            event.getDetails() != null ? event.getDetails().get("username") : null,
            event.getIpAddress(),
            event.getClientId(),
            event.getSessionId(),
            event.getTime() > 0 ? Instant.ofEpochMilli(event.getTime()) : null,
            event.getError(),
            event.getDetails()
        );
    }
}
