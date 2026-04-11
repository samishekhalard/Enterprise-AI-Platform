package com.ems.auth.service;

import com.ems.auth.config.KeycloakConfig;
import com.ems.common.dto.auth.AuthEventDTO;
import com.ems.common.dto.auth.AuthEventQuery;
import com.ems.common.dto.auth.AuthResponse;
import com.ems.common.dto.auth.MfaSetupResponse;
import com.ems.common.dto.auth.UserInfo;
import com.ems.common.exception.AuthenticationException;
import com.ems.common.exception.InvalidCredentialsException;
import com.ems.common.exception.InvalidTokenException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.samstevens.totp.code.CodeGenerator;
import dev.samstevens.totp.code.CodeVerifier;
import dev.samstevens.totp.code.DefaultCodeGenerator;
import dev.samstevens.totp.code.DefaultCodeVerifier;
import dev.samstevens.totp.code.HashingAlgorithm;
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
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

import static dev.samstevens.totp.util.Utils.getDataUriForImage;

@Service
@RequiredArgsConstructor
@Slf4j
public class KeycloakServiceImpl implements KeycloakService {

    private final KeycloakConfig keycloakConfig;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final SecretGenerator secretGenerator = new DefaultSecretGenerator();
    private final QrGenerator qrGenerator = new ZxingPngQrGenerator();
    private final RecoveryCodeGenerator recoveryCodeGenerator = new RecoveryCodeGenerator();

    @Override
    public AuthResponse login(String realm, String email, String password) {
        log.debug("Attempting login for user {} in realm {}", email, realm);

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("grant_type", "password");
        params.add("client_id", keycloakConfig.getClient().getClientId());
        params.add("client_secret", keycloakConfig.getClient().getClientSecret());
        params.add("username", email);
        params.add("password", password);
        params.add("scope", "openid profile email");

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(
                    keycloakConfig.getTokenEndpoint(realm),
                    request,
                    String.class
            );

            return parseTokenResponse(response.getBody());
        } catch (HttpClientErrorException e) {
            log.warn("Login failed for user {}: {}", email, e.getStatusCode());
            if (e.getStatusCode() == HttpStatus.UNAUTHORIZED) {
                throw new InvalidCredentialsException();
            }
            throw new AuthenticationException("Authentication failed: " + e.getMessage());
        }
    }

    @Override
    public AuthResponse refreshToken(String realm, String refreshToken) {
        log.debug("Refreshing token in realm {}", realm);

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("grant_type", "refresh_token");
        params.add("client_id", keycloakConfig.getClient().getClientId());
        params.add("client_secret", keycloakConfig.getClient().getClientSecret());
        params.add("refresh_token", refreshToken);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(
                    keycloakConfig.getTokenEndpoint(realm),
                    request,
                    String.class
            );

            return parseTokenResponse(response.getBody());
        } catch (HttpClientErrorException e) {
            log.warn("Token refresh failed: {}", e.getStatusCode());
            if (e.getStatusCode() == HttpStatus.BAD_REQUEST) {
                throw new InvalidTokenException("Invalid or expired refresh token");
            }
            throw new AuthenticationException("Token refresh failed: " + e.getMessage());
        }
    }

    @Override
    public void logout(String realm, String refreshToken) {
        log.debug("Logging out in realm {}", realm);

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("client_id", keycloakConfig.getClient().getClientId());
        params.add("client_secret", keycloakConfig.getClient().getClientSecret());
        params.add("refresh_token", refreshToken);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

            restTemplate.postForEntity(
                    keycloakConfig.getLogoutEndpoint(realm),
                    request,
                    Void.class
            );
        } catch (HttpClientErrorException e) {
            log.warn("Logout request failed: {}", e.getMessage());
            // Don't throw - logout should be idempotent
        }
    }

    @Override
    public AuthResponse exchangeGoogleToken(String realm, String googleIdToken) {
        log.debug("Exchanging Google token in realm {}", realm);

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("grant_type", "urn:ietf:params:oauth:grant-type:token-exchange");
        params.add("client_id", keycloakConfig.getClient().getClientId());
        params.add("client_secret", keycloakConfig.getClient().getClientSecret());
        params.add("subject_token", googleIdToken);
        params.add("subject_token_type", "urn:ietf:params:oauth:token-type:jwt");
        params.add("subject_issuer", "google");
        params.add("scope", "openid profile email");

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(
                    keycloakConfig.getTokenEndpoint(realm),
                    request,
                    String.class
            );

            return parseTokenResponse(response.getBody());
        } catch (HttpClientErrorException e) {
            log.warn("Google token exchange failed: {}", e.getStatusCode());
            throw new AuthenticationException("Google authentication failed");
        }
    }

    @Override
    public AuthResponse exchangeMicrosoftToken(String realm, String microsoftAccessToken) {
        log.debug("Exchanging Microsoft token in realm {}", realm);

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("grant_type", "urn:ietf:params:oauth:grant-type:token-exchange");
        params.add("client_id", keycloakConfig.getClient().getClientId());
        params.add("client_secret", keycloakConfig.getClient().getClientSecret());
        params.add("subject_token", microsoftAccessToken);
        params.add("subject_token_type", "urn:ietf:params:oauth:token-type:access_token");
        params.add("subject_issuer", "microsoft");
        params.add("scope", "openid profile email");

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(
                    keycloakConfig.getTokenEndpoint(realm),
                    request,
                    String.class
            );

            return parseTokenResponse(response.getBody());
        } catch (HttpClientErrorException e) {
            log.warn("Microsoft token exchange failed: {}", e.getStatusCode());
            throw new AuthenticationException("Microsoft authentication failed");
        }
    }

    @Override
    public MfaSetupResponse setupMfa(String realm, String userId) {
        log.debug("Setting up MFA for user {} in realm {}", userId, realm);

        String secret = secretGenerator.generate();

        // Get user email for QR code label
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

            // Store secret in Keycloak user attributes (will be confirmed on verify)
            user.singleAttribute("totp_secret_pending", secret);
            user.singleAttribute("recovery_codes_pending", String.join(",", recoveryCodes));
            userResource.update(user);

            return MfaSetupResponse.totp(secret, qrCodeUri, recoveryCodes);
        } catch (Exception e) {
            log.error("Failed to setup MFA for user {}: {}", userId, e.getMessage());
            throw new AuthenticationException("Failed to setup MFA");
        }
    }

    @Override
    public boolean verifyMfaCode(String realm, String userId, String code) {
        log.debug("Verifying MFA code for user {} in realm {}", userId, realm);

        try (Keycloak keycloak = getAdminClient()) {
            UserResource userResource = keycloak.realm(realm).users().get(userId);
            UserRepresentation user = userResource.toRepresentation();

            // First check pending secret (during setup)
            String secret = user.firstAttribute("totp_secret_pending");
            boolean isPending = true;

            if (secret == null) {
                // Check active secret
                secret = user.firstAttribute("totp_secret");
                isPending = false;
            }

            if (secret == null) {
                log.warn("No TOTP secret found for user {}", userId);
                return false;
            }

            TimeProvider timeProvider = new SystemTimeProvider();
            CodeGenerator codeGenerator = new DefaultCodeGenerator();
            CodeVerifier verifier = new DefaultCodeVerifier(codeGenerator, timeProvider);

            boolean valid = verifier.isValidCode(secret, code);

            if (valid && isPending) {
                // Confirm MFA setup - move pending to active
                String recoveryCodes = user.firstAttribute("recovery_codes_pending");
                user.singleAttribute("totp_secret", secret);
                user.singleAttribute("recovery_codes", recoveryCodes);
                user.getAttributes().remove("totp_secret_pending");
                user.getAttributes().remove("recovery_codes_pending");
                user.singleAttribute("mfa_enabled", "true");

                // Add OTP credential
                CredentialRepresentation credential = new CredentialRepresentation();
                credential.setType("otp");
                credential.setSecretData(secret);
                userResource.update(user);

                log.info("MFA confirmed and enabled for user {}", userId);
            }

            return valid;
        } catch (Exception e) {
            log.error("Failed to verify MFA code for user {}: {}", userId, e.getMessage());
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
            log.warn("Failed to check MFA status for user {}: {}", userId, e.getMessage());
            return false;
        }
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

    private AuthResponse parseTokenResponse(String responseBody) {
        try {
            JsonNode json = objectMapper.readTree(responseBody);

            String accessToken = json.get("access_token").asText();
            String refreshToken = json.has("refresh_token") ? json.get("refresh_token").asText() : null;
            long expiresIn = json.get("expires_in").asLong();

            // Extract user info from ID token or access token
            UserInfo userInfo = extractUserInfoFromToken(accessToken);

            return AuthResponse.success(accessToken, refreshToken, expiresIn, userInfo);
        } catch (Exception e) {
            log.error("Failed to parse token response: {}", e.getMessage());
            throw new AuthenticationException("Failed to process authentication response");
        }
    }

    private UserInfo extractUserInfoFromToken(String accessToken) {
        try {
            // Decode JWT payload (second part)
            String[] parts = accessToken.split("\\.");
            if (parts.length != 3) {
                return null;
            }

            String payload = new String(Base64.getUrlDecoder().decode(parts[1]));
            JsonNode claims = objectMapper.readTree(payload);

            String userId = claims.has("sub") ? claims.get("sub").asText() : null;
            String email = claims.has("email") ? claims.get("email").asText() : null;
            String firstName = claims.has("given_name") ? claims.get("given_name").asText() : null;
            String lastName = claims.has("family_name") ? claims.get("family_name").asText() : null;

            // Try different claim names for tenant
            String tenantId = null;
            if (claims.has("tenant_id")) {
                tenantId = claims.get("tenant_id").asText();
            } else if (claims.has("tenantId")) {
                tenantId = claims.get("tenantId").asText();
            }

            // Extract roles from realm_access or resource_access
            List<String> roles = new ArrayList<>();
            if (claims.has("realm_access") && claims.get("realm_access").has("roles")) {
                claims.get("realm_access").get("roles").forEach(role -> roles.add(role.asText()));
            }

            return new UserInfo(userId, email, firstName, lastName, tenantId, roles);
        } catch (Exception e) {
            log.warn("Failed to extract user info from token: {}", e.getMessage());
            return null;
        }
    }

    @Override
    public List<AuthEventDTO> getEvents(String realm, AuthEventQuery query) {
        log.debug("Fetching auth events for realm {} with query {}", realm, query);

        try (Keycloak keycloak = getAdminClient()) {
            RealmResource realmResource = keycloak.realm(realm);

            // Build query parameters
            List<String> types = query.types();
            String userId = query.userId();
            String clientId = null;
            String ipAddress = query.ipAddress();
            Long dateFrom = query.dateFrom() != null ? query.dateFrom().toEpochMilli() : null;
            Long dateTo = query.dateTo() != null ? query.dateTo().toEpochMilli() : null;
            Integer first = query.first() != null ? query.first() : 0;
            Integer max = query.max() != null ? query.max() : 100;

            List<EventRepresentation> events = realmResource.getEvents(
                    types,
                    clientId,
                    userId,
                    dateFrom != null ? dateFrom.toString() : null,
                    dateTo != null ? dateTo.toString() : null,
                    ipAddress,
                    first,
                    max
            );

            return events.stream()
                    .map(this::mapEventToDTO)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Failed to fetch events for realm {}: {}", realm, e.getMessage());
            return Collections.emptyList();
        }
    }

    @Override
    public long getEventCount(String realm, AuthEventQuery query) {
        // Keycloak admin API doesn't provide a count endpoint directly
        // We fetch events with a large limit and count them
        // For production, consider caching or database aggregation
        try (Keycloak keycloak = getAdminClient()) {
            RealmResource realmResource = keycloak.realm(realm);

            List<String> types = query.types();
            String userId = query.userId();
            Long dateFrom = query.dateFrom() != null ? query.dateFrom().toEpochMilli() : null;
            Long dateTo = query.dateTo() != null ? query.dateTo().toEpochMilli() : null;

            List<EventRepresentation> events = realmResource.getEvents(
                    types,
                    null,
                    userId,
                    dateFrom != null ? dateFrom.toString() : null,
                    dateTo != null ? dateTo.toString() : null,
                    query.ipAddress(),
                    0,
                    10000
            );

            return events.size();
        } catch (Exception e) {
            log.error("Failed to get event count for realm {}: {}", realm, e.getMessage());
            return 0;
        }
    }

    private AuthEventDTO mapEventToDTO(EventRepresentation event) {
        // Generate a unique ID from event properties since Keycloak doesn't expose event ID
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
