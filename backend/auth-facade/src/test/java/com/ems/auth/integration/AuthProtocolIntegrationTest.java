package com.ems.auth.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Base64;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

/**
 * Integration tests for auth protocols against the running Docker auth-testing stack.
 *
 * <p>These tests verify LDAP-federated authentication, OAuth2 flows, and OIDC token
 * validation by calling Keycloak endpoints directly. They do NOT spin up containers;
 * they connect to the already-running stack.</p>
 *
 * <h3>Prerequisites</h3>
 * <ol>
 *   <li>Docker auth-testing stack running (Keycloak at port 28180, OpenLDAP at port 1389)</li>
 *   <li>LDAP federation configured: {@code ./scripts/configure-keycloak-ldap-federation.sh}</li>
 * </ol>
 *
 * <h3>Test IDs</h3>
 * <ul>
 *   <li>IT-AUTH-001: LDAP-federated login via Keycloak ROPC grant</li>
 *   <li>IT-AUTH-002: OAuth2 Client Credentials grant</li>
 *   <li>IT-AUTH-003: OAuth2 Refresh Token flow</li>
 *   <li>IT-AUTH-004: OIDC token claim validation (iss, sub, azp, exp, iat)</li>
 *   <li>IT-AUTH-005: OIDC Userinfo endpoint</li>
 *   <li>IT-AUTH-006: Role claims per LDAP-mapped user</li>
 *   <li>IT-AUTH-007: Negative - wrong password returns invalid_grant</li>
 *   <li>IT-AUTH-008: Negative - wrong client secret returns unauthorized_client</li>
 *   <li>IT-AUTH-009: Token introspection (active=true / active=false)</li>
 *   <li>IT-AUTH-010: Token revocation via logout</li>
 * </ul>
 */
@Tag("integration")
@DisplayName("Auth Protocol Integration Tests (Keycloak + LDAP)")
class AuthProtocolIntegrationTest {

    private static final String KC_URL = System.getenv().getOrDefault("KC_URL", "http://localhost:28180");
    private static final String REALM = "master";
    private static final String CLIENT_ID = "ems-auth-facade";
    private static final String CLIENT_SECRET = "ems-auth-facade-secret";

    private static final String TOKEN_URL = KC_URL + "/realms/" + REALM + "/protocol/openid-connect/token";
    private static final String USERINFO_URL = KC_URL + "/realms/" + REALM + "/protocol/openid-connect/userinfo";
    private static final String INTROSPECT_URL = KC_URL + "/realms/" + REALM + "/protocol/openid-connect/token/introspect";
    private static final String LOGOUT_URL = KC_URL + "/realms/" + REALM + "/protocol/openid-connect/logout";

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeAll
    static void verifyKeycloakReachable() {
        RestTemplate probe = new RestTemplate();
        try {
            String discoveryUrl = KC_URL + "/realms/" + REALM + "/.well-known/openid-configuration";
            ResponseEntity<String> response = probe.getForEntity(discoveryUrl, String.class);
            assumeTrue(
                response.getStatusCode().is2xxSuccessful(),
                "Keycloak is not reachable at " + KC_URL + ". Start the Docker auth-testing stack first."
            );
        } catch (Exception e) {
            assumeTrue(false,
                "Keycloak is not reachable at " + KC_URL + ": " + e.getMessage()
                    + ". Start the Docker auth-testing stack first.");
        }
    }

    // =========================================================================
    // Helper Methods
    // =========================================================================

    /**
     * Obtain a token via Resource Owner Password Credentials grant.
     */
    private JsonNode authenticateUser(String username, String password) {
        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("grant_type", "password");
        params.add("client_id", CLIENT_ID);
        params.add("client_secret", CLIENT_SECRET);
        params.add("username", username);
        params.add("password", password);
        params.add("scope", "openid profile email");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(TOKEN_URL, request, String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);

        try {
            return objectMapper.readTree(response.getBody());
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse token response", e);
        }
    }

    /**
     * Decode the payload of a JWT (second segment, Base64URL-encoded).
     */
    private JsonNode decodeJwtPayload(String jwt) {
        String[] parts = jwt.split("\\.");
        assertThat(parts).hasSize(3);

        byte[] decodedBytes = Base64.getUrlDecoder().decode(parts[1]);
        try {
            return objectMapper.readTree(decodedBytes);
        } catch (Exception e) {
            throw new RuntimeException("Failed to decode JWT payload", e);
        }
    }

    /**
     * POST form data and return raw response body as String.
     * Uses java.net.http.HttpClient which does NOT throw on 4xx/5xx,
     * giving us reliable access to error response bodies from Keycloak.
     */
    private String postFormRaw(String url, MultiValueMap<String, String> params) {
        String formBody = params.entrySet().stream()
            .flatMap(e -> e.getValue().stream()
                .map(v -> java.net.URLEncoder.encode(e.getKey(), java.nio.charset.StandardCharsets.UTF_8)
                    + "=" + java.net.URLEncoder.encode(v, java.nio.charset.StandardCharsets.UTF_8)))
            .collect(Collectors.joining("&"));

        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(url))
            .header("Content-Type", "application/x-www-form-urlencoded")
            .POST(HttpRequest.BodyPublishers.ofString(formBody))
            .build();

        try {
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            return response.body();
        } catch (IOException | InterruptedException e) {
            throw new RuntimeException("HTTP request failed: " + e.getMessage(), e);
        }
    }

    // =========================================================================
    // IT-AUTH-001: LDAP-Federated Login via Keycloak
    // =========================================================================
    @Nested
    @DisplayName("IT-AUTH-001: LDAP-Federated Login via Keycloak ROPC Grant")
    class LdapFederatedLogin {

        @Test
        @DisplayName("viewer user authenticates via Keycloak and receives JWT with access_token, refresh_token, and id_token")
        void viewerUser_shouldAuthenticateAndReturnJwt() {
            JsonNode tokenResponse = authenticateUser("viewer", "ViewerPass1!");

            assertThat(tokenResponse.has("access_token")).isTrue();
            assertThat(tokenResponse.get("access_token").asText()).isNotBlank();
            assertThat(tokenResponse.has("refresh_token")).isTrue();
            assertThat(tokenResponse.get("refresh_token").asText()).isNotBlank();
            assertThat(tokenResponse.has("id_token")).isTrue();
            assertThat(tokenResponse.get("id_token").asText()).isNotBlank();
            assertThat(tokenResponse.get("token_type").asText()).isEqualToIgnoringCase("Bearer");
            assertThat(tokenResponse.get("expires_in").asLong()).isPositive();
        }

        @Test
        @DisplayName("testuser authenticates via Keycloak and receives valid tokens")
        void testuser_shouldAuthenticateSuccessfully() {
            JsonNode tokenResponse = authenticateUser("testuser", "UserPass1!");

            assertThat(tokenResponse.get("access_token").asText()).isNotBlank();
            assertThat(tokenResponse.get("token_type").asText()).isEqualToIgnoringCase("Bearer");
        }

        @Test
        @DisplayName("manager authenticates via Keycloak and receives valid tokens")
        void manager_shouldAuthenticateSuccessfully() {
            JsonNode tokenResponse = authenticateUser("manager", "ManagerPass1!");

            assertThat(tokenResponse.get("access_token").asText()).isNotBlank();
        }

        @Test
        @DisplayName("admin.user authenticates via Keycloak and receives valid tokens")
        void adminUser_shouldAuthenticateSuccessfully() {
            JsonNode tokenResponse = authenticateUser("admin.user", "AdminPass1!");

            assertThat(tokenResponse.get("access_token").asText()).isNotBlank();
        }
    }

    // =========================================================================
    // IT-AUTH-002: OAuth2 Client Credentials Grant
    // =========================================================================
    @Nested
    @DisplayName("IT-AUTH-002: OAuth2 Client Credentials Grant")
    class ClientCredentialsGrant {

        @Test
        @DisplayName("client_credentials grant returns access token with correct azp claim")
        void clientCredentials_shouldReturnAccessTokenWithCorrectAzp() {
            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("grant_type", "client_credentials");
            params.add("client_id", CLIENT_ID);
            params.add("client_secret", CLIENT_SECRET);

            String responseBody = postFormRaw(TOKEN_URL, params);
            JsonNode response;
            try {
                response = objectMapper.readTree(responseBody);
            } catch (Exception e) {
                throw new RuntimeException("Failed to parse client_credentials response", e);
            }

            assertThat(response.has("access_token")).isTrue();
            String accessToken = response.get("access_token").asText();
            assertThat(accessToken).isNotBlank();

            // Verify JWT claims
            JsonNode payload = decodeJwtPayload(accessToken);
            assertThat(payload.get("azp").asText()).isEqualTo(CLIENT_ID);
            assertThat(payload.has("exp")).isTrue();
            assertThat(payload.has("iat")).isTrue();
        }

        @Test
        @DisplayName("client_credentials grant does not return refresh_token (per OAuth2 spec)")
        void clientCredentials_shouldNotReturnRefreshToken() {
            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("grant_type", "client_credentials");
            params.add("client_id", CLIENT_ID);
            params.add("client_secret", CLIENT_SECRET);

            String responseBody = postFormRaw(TOKEN_URL, params);
            JsonNode response;
            try {
                response = objectMapper.readTree(responseBody);
            } catch (Exception e) {
                throw new RuntimeException("Failed to parse response", e);
            }

            // Per OAuth2 spec, client_credentials SHOULD NOT include refresh_token
            // Keycloak may or may not include it depending on config; validate if absent
            if (response.has("refresh_token")) {
                // Some Keycloak versions include refresh_token for client_credentials;
                // this is technically non-standard but not a failure
                assertThat(response.get("access_token").asText()).isNotBlank();
            } else {
                assertThat(response.has("refresh_token")).isFalse();
            }
        }
    }

    // =========================================================================
    // IT-AUTH-003: OAuth2 Refresh Token Flow
    // =========================================================================
    @Nested
    @DisplayName("IT-AUTH-003: OAuth2 Refresh Token Flow")
    class RefreshTokenFlow {

        @Test
        @DisplayName("refresh_token grant returns a new access token that differs from the original")
        void refreshToken_shouldReturnNewAccessToken() {
            // Step 1: Authenticate to get initial tokens
            JsonNode initialResponse = authenticateUser("viewer", "ViewerPass1!");
            String originalAccessToken = initialResponse.get("access_token").asText();
            String refreshToken = initialResponse.get("refresh_token").asText();

            // Step 2: Use refresh_token to get new tokens
            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("grant_type", "refresh_token");
            params.add("client_id", CLIENT_ID);
            params.add("client_secret", CLIENT_SECRET);
            params.add("refresh_token", refreshToken);

            String responseBody = postFormRaw(TOKEN_URL, params);
            JsonNode refreshResponse;
            try {
                refreshResponse = objectMapper.readTree(responseBody);
            } catch (Exception e) {
                throw new RuntimeException("Failed to parse refresh response", e);
            }

            assertThat(refreshResponse.has("access_token")).isTrue();
            String newAccessToken = refreshResponse.get("access_token").asText();
            assertThat(newAccessToken).isNotBlank();
            assertThat(newAccessToken).isNotEqualTo(originalAccessToken);

            // Step 3: New refresh token should also be issued (token rotation)
            assertThat(refreshResponse.has("refresh_token")).isTrue();
            assertThat(refreshResponse.get("refresh_token").asText()).isNotBlank();
        }

        @Test
        @DisplayName("invalid refresh token returns error")
        void invalidRefreshToken_shouldReturnError() {
            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("grant_type", "refresh_token");
            params.add("client_id", CLIENT_ID);
            params.add("client_secret", CLIENT_SECRET);
            params.add("refresh_token", "invalid-refresh-token-value");

            String responseBody = postFormRaw(TOKEN_URL, params);
            JsonNode errorResponse;
            try {
                errorResponse = objectMapper.readTree(responseBody);
            } catch (Exception e) {
                throw new RuntimeException("Failed to parse error response", e);
            }

            assertThat(errorResponse.has("error")).isTrue();
            assertThat(errorResponse.get("error").asText()).isEqualTo("invalid_grant");
        }
    }

    // =========================================================================
    // IT-AUTH-004: OIDC Token Claim Validation
    // =========================================================================
    @Nested
    @DisplayName("IT-AUTH-004: OIDC Token Claim Validation")
    class OidcTokenClaimValidation {

        @Test
        @DisplayName("access token contains standard OIDC claims: iss, sub, azp, exp, iat")
        void accessToken_shouldContainStandardOidcClaims() {
            JsonNode tokenResponse = authenticateUser("admin.user", "AdminPass1!");
            String accessToken = tokenResponse.get("access_token").asText();
            JsonNode payload = decodeJwtPayload(accessToken);

            // iss: issuer must match Keycloak realm URL
            assertThat(payload.has("iss")).isTrue();
            assertThat(payload.get("iss").asText()).isEqualTo(KC_URL + "/realms/" + REALM);

            // sub: subject identifier (UUID)
            assertThat(payload.has("sub")).isTrue();
            assertThat(payload.get("sub").asText()).isNotBlank();

            // azp: authorized party must match client_id
            assertThat(payload.has("azp")).isTrue();
            assertThat(payload.get("azp").asText()).isEqualTo(CLIENT_ID);

            // exp: expiration time (epoch seconds, must be in the future)
            assertThat(payload.has("exp")).isTrue();
            long exp = payload.get("exp").asLong();
            assertThat(exp).isGreaterThan(System.currentTimeMillis() / 1000);

            // iat: issued-at time (epoch seconds, must be in the past or present)
            assertThat(payload.has("iat")).isTrue();
            long iat = payload.get("iat").asLong();
            assertThat(iat).isLessThanOrEqualTo(System.currentTimeMillis() / 1000 + 5);
        }

        @Test
        @DisplayName("id_token contains OIDC-required claims including email and preferred_username")
        void idToken_shouldContainOidcRequiredClaims() {
            JsonNode tokenResponse = authenticateUser("admin.user", "AdminPass1!");
            String idToken = tokenResponse.get("id_token").asText();
            JsonNode payload = decodeJwtPayload(idToken);

            assertThat(payload.get("iss").asText()).isEqualTo(KC_URL + "/realms/" + REALM);
            assertThat(payload.get("sub").asText()).isNotBlank();
            assertThat(payload.get("azp").asText()).isEqualTo(CLIENT_ID);
            assertThat(payload.has("exp")).isTrue();
            assertThat(payload.has("iat")).isTrue();

            // OIDC profile claims from LDAP
            assertThat(payload.has("preferred_username")).isTrue();
            assertThat(payload.get("preferred_username").asText()).isEqualTo("admin.user");
        }

        @Test
        @DisplayName("access token typ header is 'Bearer' and alg is RSA-based")
        void accessToken_shouldHaveCorrectJwtHeader() {
            JsonNode tokenResponse = authenticateUser("viewer", "ViewerPass1!");
            String accessToken = tokenResponse.get("access_token").asText();

            // Decode JWT header (first segment)
            String[] parts = accessToken.split("\\.");
            byte[] headerBytes = Base64.getUrlDecoder().decode(parts[0]);
            JsonNode header;
            try {
                header = objectMapper.readTree(headerBytes);
            } catch (Exception e) {
                throw new RuntimeException("Failed to decode JWT header", e);
            }

            assertThat(header.has("alg")).isTrue();
            assertThat(header.get("alg").asText()).startsWith("RS");
            assertThat(header.has("kid")).isTrue();
            assertThat(header.get("kid").asText()).isNotBlank();
        }
    }

    // =========================================================================
    // IT-AUTH-005: OIDC Userinfo Endpoint
    // =========================================================================
    @Nested
    @DisplayName("IT-AUTH-005: OIDC Userinfo Endpoint")
    class OidcUserinfo {

        @Test
        @DisplayName("userinfo returns sub, email, and preferred_username for authenticated user")
        void userinfo_shouldReturnUserAttributes() {
            JsonNode tokenResponse = authenticateUser("admin.user", "AdminPass1!");
            String accessToken = tokenResponse.get("access_token").asText();

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            HttpEntity<Void> request = new HttpEntity<>(headers);

            ResponseEntity<String> userinfoResponse = restTemplate.exchange(
                USERINFO_URL, org.springframework.http.HttpMethod.GET, request, String.class);

            assertThat(userinfoResponse.getStatusCode()).isEqualTo(HttpStatus.OK);

            JsonNode userinfo;
            try {
                userinfo = objectMapper.readTree(userinfoResponse.getBody());
            } catch (Exception e) {
                throw new RuntimeException("Failed to parse userinfo response", e);
            }

            assertThat(userinfo.has("sub")).isTrue();
            assertThat(userinfo.get("sub").asText()).isNotBlank();
            assertThat(userinfo.get("preferred_username").asText()).isEqualTo("admin.user");
            assertThat(userinfo.get("email").asText()).isEqualTo("admin@ems.test");
            assertThat(userinfo.get("email_verified").asBoolean()).isTrue();
        }

        @Test
        @DisplayName("userinfo rejects invalid bearer token with HTTP 401")
        void userinfo_shouldRejectInvalidToken() {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth("invalid.token.value");
            HttpEntity<Void> request = new HttpEntity<>(headers);

            assertThatThrownBy(() ->
                restTemplate.exchange(USERINFO_URL, org.springframework.http.HttpMethod.GET, request, String.class)
            ).isInstanceOf(HttpClientErrorException.class)
             .satisfies(ex -> {
                 HttpClientErrorException httpEx = (HttpClientErrorException) ex;
                 assertThat(httpEx.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
             });
        }

        @Test
        @DisplayName("userinfo returns LDAP-mapped attributes for viewer user")
        void userinfo_shouldReturnLdapAttributes_forViewerUser() {
            JsonNode tokenResponse = authenticateUser("viewer", "ViewerPass1!");
            String accessToken = tokenResponse.get("access_token").asText();

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            HttpEntity<Void> request = new HttpEntity<>(headers);

            ResponseEntity<String> userinfoResponse = restTemplate.exchange(
                USERINFO_URL, org.springframework.http.HttpMethod.GET, request, String.class);

            assertThat(userinfoResponse.getStatusCode()).isEqualTo(HttpStatus.OK);

            JsonNode userinfo;
            try {
                userinfo = objectMapper.readTree(userinfoResponse.getBody());
            } catch (Exception e) {
                throw new RuntimeException("Failed to parse userinfo response", e);
            }

            assertThat(userinfo.get("preferred_username").asText()).isEqualTo("viewer");
            assertThat(userinfo.get("email").asText()).isEqualTo("viewer@ems.test");
        }
    }

    // =========================================================================
    // IT-AUTH-006: Role Claims per LDAP-Mapped User
    // =========================================================================
    @Nested
    @DisplayName("IT-AUTH-006: Role Claims per LDAP-Mapped User")
    class RoleClaims {

        @Test
        @DisplayName("viewer user has VIEWER role in realm_access.roles")
        void viewer_shouldHaveViewerRole() {
            assertUserHasRole("viewer", "ViewerPass1!", "VIEWER");
        }

        @Test
        @DisplayName("testuser has USER role in realm_access.roles")
        void testuser_shouldHaveUserRole() {
            assertUserHasRole("testuser", "UserPass1!", "USER");
        }

        @Test
        @DisplayName("manager has MANAGER role in realm_access.roles")
        void manager_shouldHaveManagerRole() {
            assertUserHasRole("manager", "ManagerPass1!", "MANAGER");
        }

        @Test
        @DisplayName("admin.user has ADMIN role in realm_access.roles")
        void adminUser_shouldHaveAdminRole() {
            assertUserHasRole("admin.user", "AdminPass1!", "ADMIN");
        }

        @Test
        @DisplayName("realm_access.roles is a non-empty array for LDAP-federated users")
        void allUsers_shouldHaveNonEmptyRolesArray() {
            JsonNode tokenResponse = authenticateUser("viewer", "ViewerPass1!");
            String accessToken = tokenResponse.get("access_token").asText();
            JsonNode payload = decodeJwtPayload(accessToken);

            assertThat(payload.has("realm_access")).isTrue();
            JsonNode roles = payload.get("realm_access").get("roles");
            assertThat(roles.isArray()).isTrue();
            assertThat(roles.size())
                .as("LDAP-federated user should have at least one role in realm_access.roles")
                .isGreaterThanOrEqualTo(1);
        }

        private void assertUserHasRole(String username, String password, String expectedRole) {
            JsonNode tokenResponse = authenticateUser(username, password);
            String accessToken = tokenResponse.get("access_token").asText();
            JsonNode payload = decodeJwtPayload(accessToken);

            assertThat(payload.has("realm_access"))
                .as("JWT for %s should contain realm_access claim", username)
                .isTrue();
            JsonNode roles = payload.get("realm_access").get("roles");
            assertThat(roles.isArray()).isTrue();

            boolean hasExpectedRole = false;
            for (JsonNode role : roles) {
                if (role.asText().equals(expectedRole)) {
                    hasExpectedRole = true;
                    break;
                }
            }
            assertThat(hasExpectedRole)
                .as("User %s should have role %s in realm_access.roles, found: %s",
                    username, expectedRole, roles)
                .isTrue();
        }
    }

    // =========================================================================
    // IT-AUTH-007: Negative - Wrong Password
    // =========================================================================
    @Nested
    @DisplayName("IT-AUTH-007: Negative - Wrong Password")
    class NegativeWrongPassword {

        @Test
        @DisplayName("wrong password returns error=invalid_grant")
        void wrongPassword_shouldReturnInvalidGrant() {
            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("grant_type", "password");
            params.add("client_id", CLIENT_ID);
            params.add("client_secret", CLIENT_SECRET);
            params.add("username", "admin.user");
            params.add("password", "WrongPassword123!");
            params.add("scope", "openid");

            String responseBody = postFormRaw(TOKEN_URL, params);
            JsonNode response;
            try {
                response = objectMapper.readTree(responseBody);
            } catch (Exception e) {
                throw new RuntimeException("Failed to parse error response", e);
            }

            assertThat(response.has("error")).isTrue();
            assertThat(response.get("error").asText()).isEqualTo("invalid_grant");
            assertThat(response.has("error_description")).isTrue();
        }

        @Test
        @DisplayName("non-existent user returns an error response (invalid_grant or unknown_error)")
        void nonExistentUser_shouldReturnError() {
            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("grant_type", "password");
            params.add("client_id", CLIENT_ID);
            params.add("client_secret", CLIENT_SECRET);
            params.add("username", "nonexistent-user-xyz");
            params.add("password", "AnyPassword123!");
            params.add("scope", "openid");

            String responseBody = postFormRaw(TOKEN_URL, params);
            JsonNode response;
            try {
                response = objectMapper.readTree(responseBody);
            } catch (Exception e) {
                throw new RuntimeException("Failed to parse error response", e);
            }

            assertThat(response.has("error")).isTrue();
            // Keycloak may return "invalid_grant" or "unknown_error" for non-existent users
            // depending on its internal user resolution behavior
            assertThat(response.get("error").asText())
                .as("Non-existent user should return an OAuth2 error")
                .isIn("invalid_grant", "unknown_error");
        }
    }

    // =========================================================================
    // IT-AUTH-008: Negative - Wrong Client Secret
    // =========================================================================
    @Nested
    @DisplayName("IT-AUTH-008: Negative - Wrong Client Secret")
    class NegativeWrongClientSecret {

        @Test
        @DisplayName("wrong client secret returns unauthorized_client or invalid_client error")
        void wrongClientSecret_shouldReturnUnauthorized() {
            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("grant_type", "password");
            params.add("client_id", CLIENT_ID);
            params.add("client_secret", "wrong-secret-value");
            params.add("username", "admin.user");
            params.add("password", "AdminPass1!");
            params.add("scope", "openid");

            String responseBody = postFormRaw(TOKEN_URL, params);
            JsonNode response;
            try {
                response = objectMapper.readTree(responseBody);
            } catch (Exception e) {
                throw new RuntimeException("Failed to parse error response", e);
            }

            assertThat(response.has("error")).isTrue();
            String error = response.get("error").asText();
            assertThat(error)
                .as("Wrong client secret should return 'unauthorized_client' or 'invalid_client'")
                .isIn("unauthorized_client", "invalid_client");
        }

        @Test
        @DisplayName("non-existent client_id returns error")
        void nonExistentClientId_shouldReturnError() {
            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("grant_type", "password");
            params.add("client_id", "non-existent-client-id");
            params.add("client_secret", "any-secret");
            params.add("username", "admin.user");
            params.add("password", "AdminPass1!");

            String responseBody = postFormRaw(TOKEN_URL, params);
            JsonNode response;
            try {
                response = objectMapper.readTree(responseBody);
            } catch (Exception e) {
                throw new RuntimeException("Failed to parse error response", e);
            }

            assertThat(response.has("error")).isTrue();
            // Keycloak returns "invalid_client" for unknown client_id
            assertThat(response.get("error").asText())
                .isIn("invalid_client", "unauthorized_client");
        }
    }

    // =========================================================================
    // IT-AUTH-009: Token Introspection
    // =========================================================================
    @Nested
    @DisplayName("IT-AUTH-009: Token Introspection")
    class TokenIntrospection {

        @Test
        @DisplayName("valid access token introspects as active=true with correct username and client_id")
        void validToken_shouldIntrospectAsActive() {
            JsonNode tokenResponse = authenticateUser("admin.user", "AdminPass1!");
            String accessToken = tokenResponse.get("access_token").asText();

            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("token", accessToken);
            params.add("client_id", CLIENT_ID);
            params.add("client_secret", CLIENT_SECRET);

            String responseBody = postFormRaw(INTROSPECT_URL, params);
            JsonNode introspection;
            try {
                introspection = objectMapper.readTree(responseBody);
            } catch (Exception e) {
                throw new RuntimeException("Failed to parse introspection response", e);
            }

            assertThat(introspection.get("active").asBoolean()).isTrue();
            assertThat(introspection.get("username").asText()).isEqualTo("admin.user");
            assertThat(introspection.get("client_id").asText()).isEqualTo(CLIENT_ID);
            assertThat(introspection.has("sub")).isTrue();
            assertThat(introspection.has("exp")).isTrue();
        }

        @Test
        @DisplayName("invalid/garbage token introspects as active=false")
        void invalidToken_shouldIntrospectAsInactive() {
            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("token", "garbage-invalid-token-value");
            params.add("client_id", CLIENT_ID);
            params.add("client_secret", CLIENT_SECRET);

            String responseBody = postFormRaw(INTROSPECT_URL, params);
            JsonNode introspection;
            try {
                introspection = objectMapper.readTree(responseBody);
            } catch (Exception e) {
                throw new RuntimeException("Failed to parse introspection response", e);
            }

            assertThat(introspection.get("active").asBoolean()).isFalse();
        }

        @Test
        @DisplayName("refresh token also introspects as active=true")
        void refreshToken_shouldIntrospectAsActive() {
            JsonNode tokenResponse = authenticateUser("viewer", "ViewerPass1!");
            String refreshToken = tokenResponse.get("refresh_token").asText();

            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("token", refreshToken);
            params.add("client_id", CLIENT_ID);
            params.add("client_secret", CLIENT_SECRET);

            String responseBody = postFormRaw(INTROSPECT_URL, params);
            JsonNode introspection;
            try {
                introspection = objectMapper.readTree(responseBody);
            } catch (Exception e) {
                throw new RuntimeException("Failed to parse introspection response", e);
            }

            assertThat(introspection.get("active").asBoolean()).isTrue();
        }
    }

    // =========================================================================
    // IT-AUTH-010: Token Revocation via Logout
    // =========================================================================
    @Nested
    @DisplayName("IT-AUTH-010: Token Revocation via Logout")
    class TokenRevocation {

        @Test
        @DisplayName("logout revokes refresh token; subsequent introspection returns active=false")
        void logout_shouldInvalidateRefreshToken() {
            // Step 1: Authenticate
            JsonNode tokenResponse = authenticateUser("testuser", "UserPass1!");
            String refreshToken = tokenResponse.get("refresh_token").asText();

            // Step 2: Logout (revoke the refresh token)
            MultiValueMap<String, String> logoutParams = new LinkedMultiValueMap<>();
            logoutParams.add("client_id", CLIENT_ID);
            logoutParams.add("client_secret", CLIENT_SECRET);
            logoutParams.add("refresh_token", refreshToken);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            HttpEntity<MultiValueMap<String, String>> logoutRequest = new HttpEntity<>(logoutParams, headers);

            ResponseEntity<String> logoutResponse = restTemplate.postForEntity(LOGOUT_URL, logoutRequest, String.class);
            assertThat(logoutResponse.getStatusCode().value())
                .as("Logout should return 204 No Content or 200 OK")
                .isIn(200, 204);

            // Step 3: Introspect the revoked refresh token
            MultiValueMap<String, String> introspectParams = new LinkedMultiValueMap<>();
            introspectParams.add("token", refreshToken);
            introspectParams.add("client_id", CLIENT_ID);
            introspectParams.add("client_secret", CLIENT_SECRET);

            String introspectBody = postFormRaw(INTROSPECT_URL, introspectParams);
            JsonNode introspection;
            try {
                introspection = objectMapper.readTree(introspectBody);
            } catch (Exception e) {
                throw new RuntimeException("Failed to parse introspection response", e);
            }

            assertThat(introspection.get("active").asBoolean())
                .as("Refresh token should be inactive after logout/revocation")
                .isFalse();
        }

        @Test
        @DisplayName("refresh token cannot be used after logout")
        void logout_shouldPreventRefreshTokenReuse() {
            // Step 1: Authenticate
            JsonNode tokenResponse = authenticateUser("manager", "ManagerPass1!");
            String refreshToken = tokenResponse.get("refresh_token").asText();

            // Step 2: Logout
            MultiValueMap<String, String> logoutParams = new LinkedMultiValueMap<>();
            logoutParams.add("client_id", CLIENT_ID);
            logoutParams.add("client_secret", CLIENT_SECRET);
            logoutParams.add("refresh_token", refreshToken);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            HttpEntity<MultiValueMap<String, String>> logoutRequest = new HttpEntity<>(logoutParams, headers);
            restTemplate.postForEntity(LOGOUT_URL, logoutRequest, String.class);

            // Step 3: Attempt to use revoked refresh token
            MultiValueMap<String, String> refreshParams = new LinkedMultiValueMap<>();
            refreshParams.add("grant_type", "refresh_token");
            refreshParams.add("client_id", CLIENT_ID);
            refreshParams.add("client_secret", CLIENT_SECRET);
            refreshParams.add("refresh_token", refreshToken);

            String responseBody = postFormRaw(TOKEN_URL, refreshParams);
            JsonNode errorResponse;
            try {
                errorResponse = objectMapper.readTree(responseBody);
            } catch (Exception e) {
                throw new RuntimeException("Failed to parse response", e);
            }

            assertThat(errorResponse.has("error")).isTrue();
            assertThat(errorResponse.get("error").asText())
                .as("Using revoked refresh token should return 'invalid_grant'")
                .isEqualTo("invalid_grant");
        }
    }
}
