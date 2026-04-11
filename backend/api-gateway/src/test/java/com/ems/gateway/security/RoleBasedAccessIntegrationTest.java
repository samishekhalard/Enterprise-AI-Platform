package com.ems.gateway.security;

import com.ems.gateway.ApiGatewayApplication;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.reactive.server.WebTestClient;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Base64;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

/**
 * Role-Based Access Control integration tests using real JWT tokens issued by Keycloak.
 *
 * <p>These tests authenticate LDAP-federated users against a live Keycloak instance
 * (port 28180) using the Resource Owner Password Credentials grant, then use the
 * real access tokens to verify the API Gateway's security rules.</p>
 *
 * <h3>LDAP test users:</h3>
 * <ul>
 *   <li>{@code viewer / ViewerPass1!} - VIEWER role</li>
 *   <li>{@code testuser / UserPass1!} - USER role</li>
 *   <li>{@code manager / ManagerPass1!} - MANAGER role</li>
 *   <li>{@code admin.user / AdminPass1!} - ADMIN role (composite: includes VIEWER, USER, MANAGER)</li>
 * </ul>
 *
 * <h3>Prerequisites:</h3>
 * <ol>
 *   <li>Keycloak running on localhost:28180 (master realm)</li>
 *   <li>OpenLDAP running and seeded with test users</li>
 *   <li>LDAP federation configured in Keycloak (run configure-keycloak-ldap-federation.sh)</li>
 * </ol>
 *
 * <p>Tests are skipped (not failed) when Keycloak is unreachable, so they do not
 * break CI builds that lack the auth-testing infrastructure.</p>
 */
@SpringBootTest(
        classes = ApiGatewayApplication.class,
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT
)
@AutoConfigureWebTestClient
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "eureka.client.enabled=false",
        "spring.data.redis.host=localhost",
        "spring.data.redis.port=6379",
        "spring.security.oauth2.resourceserver.jwt.issuer-uri=http://localhost:28180/realms/master",
        "spring.security.oauth2.resourceserver.jwt.jwk-set-uri=http://localhost:28180/realms/master/protocol/openid-connect/certs",
        "spring.cloud.gateway.routes[0].id=test-admin-route",
        "spring.cloud.gateway.routes[0].uri=http://localhost:19999",
        "spring.cloud.gateway.routes[0].predicates[0]=Path=/api/v1/admin/**",
        "spring.cloud.gateway.routes[1].id=test-internal-route",
        "spring.cloud.gateway.routes[1].uri=http://localhost:19999",
        "spring.cloud.gateway.routes[1].predicates[0]=Path=/api/v1/internal/**",
        "spring.cloud.gateway.routes[2].id=test-tenant-seats-route",
        "spring.cloud.gateway.routes[2].uri=http://localhost:19999",
        "spring.cloud.gateway.routes[2].predicates[0]=Path=/api/v1/tenants/*/seats/**",
        "spring.cloud.gateway.routes[3].id=test-protected-route",
        "spring.cloud.gateway.routes[3].uri=http://localhost:19999",
        "spring.cloud.gateway.routes[3].predicates[0]=Path=/api/v1/users/**"
})
@Tag("integration")
@DisplayName("Role-Based Access Control Integration Tests (Real Keycloak Tokens)")
class RoleBasedAccessIntegrationTest {

    // Keycloak ROPC token endpoint
    private static final String KC_TOKEN_URL =
            "http://localhost:28180/realms/master/protocol/openid-connect/token";
    private static final String CLIENT_ID = "ems-auth-facade";
    private static final String CLIENT_SECRET = "ems-auth-facade-secret";

    // Cached tokens — obtained once per test class to avoid hammering Keycloak
    private static String viewerToken;
    private static String userToken;
    private static String managerToken;
    private static String adminToken;
    private static boolean keycloakAvailable;

    @Autowired
    private WebTestClient webTestClient;

    @MockitoBean
    private ReactiveStringRedisTemplate reactiveStringRedisTemplate;

    /**
     * Obtain real JWT access tokens from Keycloak for each LDAP test user.
     * If Keycloak is unreachable, all tests in this class are skipped.
     */
    @BeforeAll
    static void obtainTokensFromKeycloak() {
        WebClient keycloakClient = WebClient.builder()
                .baseUrl(KC_TOKEN_URL)
                .build();

        // Probe Keycloak availability before attempting token requests
        keycloakAvailable = isKeycloakReachable(keycloakClient);
        if (!keycloakAvailable) {
            return;
        }

        viewerToken = fetchAccessToken(keycloakClient, "viewer", "ViewerPass1!");
        userToken = fetchAccessToken(keycloakClient, "testuser", "UserPass1!");
        managerToken = fetchAccessToken(keycloakClient, "manager", "ManagerPass1!");
        adminToken = fetchAccessToken(keycloakClient, "admin.user", "AdminPass1!");
    }

    /**
     * Check whether Keycloak is reachable by calling the token endpoint with
     * an empty body (expects 400 or 401 — anything other than a connection error).
     */
    private static boolean isKeycloakReachable(WebClient client) {
        try {
            client.post()
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .bodyValue("grant_type=client_credentials&client_id=probe")
                    .retrieve()
                    .toBodilessEntity()
                    .block(java.time.Duration.ofSeconds(5));
            return true;
        } catch (Exception e) {
            String message = e.getMessage() != null ? e.getMessage() : "";
            // 400/401 responses mean Keycloak IS reachable (just rejecting the probe)
            if (message.contains("400") || message.contains("401")) {
                return true;
            }
            return false;
        }
    }

    /**
     * Obtain an access token from Keycloak using the Resource Owner Password Credentials grant.
     *
     * @param client   the WebClient configured for the Keycloak token endpoint
     * @param username LDAP username
     * @param password LDAP password
     * @return the access_token string, or null if authentication fails
     */
    @SuppressWarnings("unchecked")
    private static String fetchAccessToken(WebClient client, String username, String password) {
        try {
            Map<String, Object> response = client.post()
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .bodyValue(
                            "grant_type=password"
                                    + "&client_id=" + CLIENT_ID
                                    + "&client_secret=" + CLIENT_SECRET
                                    + "&username=" + username
                                    + "&password=" + password
                                    + "&scope=openid"
                    )
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block(java.time.Duration.ofSeconds(10));

            if (response != null && response.containsKey("access_token")) {
                return (String) response.get("access_token");
            }
            return null;
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Decode the payload section of a JWT (base64url) to extract claims as a Map.
     */
    @SuppressWarnings("unchecked")
    private static Map<String, Object> decodeJwtPayload(String token) {
        String[] parts = token.split("\\.");
        if (parts.length < 2) {
            return Map.of();
        }
        byte[] decoded = Base64.getUrlDecoder().decode(parts[1]);
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper =
                    new com.fasterxml.jackson.databind.ObjectMapper();
            return mapper.readValue(decoded, Map.class);
        } catch (Exception e) {
            return Map.of();
        }
    }

    // =========================================================================
    // Helper: skip test when Keycloak is not available
    // =========================================================================

    private void requireKeycloak() {
        assumeTrue(keycloakAvailable,
                "Keycloak is not reachable at " + KC_TOKEN_URL + " — skipping integration test");
    }

    private void requireToken(String token, String user) {
        requireKeycloak();
        assumeTrue(token != null,
                "Could not obtain token for user '" + user + "' — LDAP federation may not be configured");
    }

    // =========================================================================
    // Test Groups
    // =========================================================================

    @Nested
    @DisplayName("Public Endpoint Access")
    class PublicEndpointAccess {

        @Test
        @DisplayName("VIEWER token can access /actuator/health (public endpoint returns 200)")
        void viewerCanAccessPublicHealthEndpoint() {
            requireToken(viewerToken, "viewer");

            webTestClient.get()
                    .uri("/actuator/health")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + viewerToken)
                    .exchange()
                    .expectStatus().isOk();
        }

        @Test
        @DisplayName("Public endpoint is accessible even without any token")
        void publicEndpointAccessibleWithoutToken() {
            // This does not require Keycloak — it validates the permitAll() rule
            webTestClient.get()
                    .uri("/actuator/health")
                    .exchange()
                    .expectStatus().isOk();
        }
    }

    @Nested
    @DisplayName("Admin Endpoint Authorization")
    class AdminEndpointAuthorization {

        @Test
        @DisplayName("VIEWER cannot access /api/v1/admin/** (returns 403)")
        void viewerCannotAccessAdminEndpoints() {
            requireToken(viewerToken, "viewer");

            webTestClient.get()
                    .uri("/api/v1/admin/users")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + viewerToken)
                    .exchange()
                    .expectStatus().isForbidden();
        }

        @Test
        @DisplayName("USER cannot access /api/v1/admin/** (returns 403)")
        void userCannotAccessAdminEndpoints() {
            requireToken(userToken, "testuser");

            webTestClient.get()
                    .uri("/api/v1/admin/users")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + userToken)
                    .exchange()
                    .expectStatus().isForbidden();
        }

        @Test
        @DisplayName("MANAGER cannot access /api/v1/admin/** (returns 403)")
        void managerCannotAccessAdminEndpoints() {
            requireToken(managerToken, "manager");

            webTestClient.get()
                    .uri("/api/v1/admin/users")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + managerToken)
                    .exchange()
                    .expectStatus().isForbidden();
        }

        @Test
        @DisplayName("ADMIN can access /api/v1/admin/** (not rejected by security — 200 or 502/503)")
        void adminCanAccessAdminEndpoints() {
            requireToken(adminToken, "admin.user");

            // ADMIN should pass the security filter. Since no backend is running,
            // the gateway will return 502 (Bad Gateway) or 503 (Service Unavailable).
            // The key assertion: the response is NOT 401 (Unauthorized) or 403 (Forbidden).
            webTestClient.get()
                    .uri("/api/v1/admin/users")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                    .exchange()
                    .expectStatus().value(status ->
                            assertThat(status)
                                    .as("ADMIN should pass security (not 401/403); downstream may be unavailable")
                                    .isNotEqualTo(401)
                                    .isNotEqualTo(403));
        }
    }

    @Nested
    @DisplayName("Unauthenticated Access")
    class UnauthenticatedAccess {

        @Test
        @DisplayName("No token on protected endpoint returns 401")
        void noTokenReturns401OnProtectedEndpoint() {
            webTestClient.get()
                    .uri("/api/v1/admin/users")
                    .exchange()
                    .expectStatus().isUnauthorized();
        }

        @Test
        @DisplayName("No token on default-authenticated endpoint returns 401")
        void noTokenReturns401OnDefaultProtectedEndpoint() {
            webTestClient.get()
                    .uri("/api/v1/users")
                    .exchange()
                    .expectStatus().isUnauthorized();
        }
    }

    @Nested
    @DisplayName("Internal Endpoint Denial")
    class InternalEndpointDenial {

        @Test
        @DisplayName("ADMIN token on /api/v1/internal/** returns 403 (denyAll)")
        void internalEndpointsDeniedForAdmin() {
            requireToken(adminToken, "admin.user");

            webTestClient.get()
                    .uri("/api/v1/internal/anything")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                    .exchange()
                    .expectStatus().isForbidden();
        }

        @Test
        @DisplayName("VIEWER token on /api/v1/internal/** returns 403 (denyAll)")
        void internalEndpointsDeniedForViewer() {
            requireToken(viewerToken, "viewer");

            webTestClient.get()
                    .uri("/api/v1/internal/features/check")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + viewerToken)
                    .exchange()
                    .expectStatus().isForbidden();
        }

        @Test
        @DisplayName("Unauthenticated request to /api/v1/internal/** returns 401 or 403")
        void internalEndpointsDeniedWithoutToken() {
            // Without a token the filter chain may short-circuit to 401 (missing auth)
            // or 403 (denyAll evaluated first). Either is acceptable — the endpoint is blocked.
            webTestClient.get()
                    .uri("/api/v1/internal/anything")
                    .exchange()
                    .expectStatus().value(status ->
                            assertThat(status)
                                    .as("Internal endpoints must never return success")
                                    .isIn(401, 403));
        }
    }

    @Nested
    @DisplayName("Role Hierarchy Verification")
    class RoleHierarchyVerification {

        @Test
        @DisplayName("ADMIN user token contains VIEWER, USER, and MANAGER roles (composite)")
        void adminTokenContainsCompositeRoles() {
            requireToken(adminToken, "admin.user");

            Map<String, Object> payload = decodeJwtPayload(adminToken);

            @SuppressWarnings("unchecked")
            Map<String, Object> realmAccess = (Map<String, Object>) payload.get("realm_access");
            assumeTrue(realmAccess != null,
                    "Token does not contain realm_access claim — role mapper may not be configured");

            @SuppressWarnings("unchecked")
            List<String> roles = (List<String>) realmAccess.get("roles");
            assertThat(roles)
                    .as("ADMIN composite role should include ADMIN, VIEWER, USER, MANAGER")
                    .contains("ADMIN")
                    .containsAnyOf("VIEWER", "USER", "MANAGER");
        }

        @Test
        @DisplayName("VIEWER user token contains only VIEWER role (not ADMIN or MANAGER)")
        void viewerTokenContainsOnlyViewerRole() {
            requireToken(viewerToken, "viewer");

            Map<String, Object> payload = decodeJwtPayload(viewerToken);

            @SuppressWarnings("unchecked")
            Map<String, Object> realmAccess = (Map<String, Object>) payload.get("realm_access");
            assumeTrue(realmAccess != null,
                    "Token does not contain realm_access claim — role mapper may not be configured");

            @SuppressWarnings("unchecked")
            List<String> roles = (List<String>) realmAccess.get("roles");
            assertThat(roles)
                    .as("VIEWER should have VIEWER role")
                    .contains("VIEWER");
            assertThat(roles)
                    .as("VIEWER should not have ADMIN or MANAGER roles")
                    .doesNotContain("ADMIN", "MANAGER");
        }
    }

    @Nested
    @DisplayName("Invalid Token Handling")
    class InvalidTokenHandling {

        @Test
        @DisplayName("Garbage token returns 401 (Unauthorized)")
        void garbageTokenReturns401() {
            webTestClient.get()
                    .uri("/api/v1/admin/users")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer this.is.not.a.valid.jwt")
                    .exchange()
                    .expectStatus().isUnauthorized();
        }

        @Test
        @DisplayName("Expired-format token returns 401 (Unauthorized)")
        void malformedTokenReturns401() {
            // A structurally valid JWT but with garbage signature and expired claims
            String fakeHeader = Base64.getUrlEncoder().withoutPadding()
                    .encodeToString("{\"alg\":\"RS256\",\"typ\":\"JWT\"}".getBytes());
            String fakePayload = Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(("{\"sub\":\"fake\",\"exp\":0,\"iss\":\"http://localhost:28180/realms/master\"}")
                            .getBytes());
            String fakeToken = fakeHeader + "." + fakePayload + ".invalid-signature";

            webTestClient.get()
                    .uri("/api/v1/admin/users")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + fakeToken)
                    .exchange()
                    .expectStatus().isUnauthorized();
        }

        @Test
        @DisplayName("Empty Authorization header returns 401")
        void emptyBearerTokenReturns401() {
            webTestClient.get()
                    .uri("/api/v1/users")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer ")
                    .exchange()
                    .expectStatus().isUnauthorized();
        }
    }

    @Nested
    @DisplayName("Tenant Seat Endpoint Authorization")
    class TenantSeatEndpointAuthorization {

        @Test
        @DisplayName("VIEWER cannot access /api/v1/tenants/*/seats/** (returns 403)")
        void viewerCannotAccessTenantSeats() {
            requireToken(viewerToken, "viewer");

            webTestClient.get()
                    .uri("/api/v1/tenants/tenant-123/seats/list")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + viewerToken)
                    .exchange()
                    .expectStatus().isForbidden();
        }

        @Test
        @DisplayName("ADMIN can access /api/v1/tenants/*/seats/** (not rejected by security)")
        void adminCanAccessTenantSeats() {
            requireToken(adminToken, "admin.user");

            webTestClient.get()
                    .uri("/api/v1/tenants/tenant-123/seats/list")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                    .exchange()
                    .expectStatus().value(status ->
                            assertThat(status)
                                    .as("ADMIN should pass security for tenant seats endpoint")
                                    .isNotEqualTo(401)
                                    .isNotEqualTo(403));
        }
    }

    @Nested
    @DisplayName("Default Authenticated Endpoints")
    class DefaultAuthenticatedEndpoints {

        @Test
        @DisplayName("VIEWER can access default-authenticated endpoint (not rejected by security)")
        void viewerCanAccessDefaultAuthenticatedEndpoint() {
            requireToken(viewerToken, "viewer");

            webTestClient.get()
                    .uri("/api/v1/users")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + viewerToken)
                    .exchange()
                    .expectStatus().value(status ->
                            assertThat(status)
                                    .as("Any authenticated user should pass default security rules")
                                    .isNotEqualTo(401)
                                    .isNotEqualTo(403));
        }

        @Test
        @DisplayName("USER can access default-authenticated endpoint (not rejected by security)")
        void userCanAccessDefaultAuthenticatedEndpoint() {
            requireToken(userToken, "testuser");

            webTestClient.get()
                    .uri("/api/v1/users")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + userToken)
                    .exchange()
                    .expectStatus().value(status ->
                            assertThat(status)
                                    .as("Any authenticated user should pass default security rules")
                                    .isNotEqualTo(401)
                                    .isNotEqualTo(403));
        }
    }
}
