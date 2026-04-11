package com.ems.gateway.config;

import com.ems.gateway.ApiGatewayApplication;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.reactive.server.WebTestClient;

import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.mockJwt;

/**
 * Integration tests for API Gateway SecurityConfig.
 *
 * Verifies the zero-trust gateway security policy:
 * - Public endpoints (auth, health) are accessible without authentication
 * - Actuator endpoints beyond /health require authentication
 * - Internal endpoints are denied to all edge traffic
 * - Admin endpoints require ADMIN or SUPER_ADMIN roles
 * - Security headers (HSTS, X-Frame-Options, etc.) are present
 * - All other endpoints require JWT authentication
 *
 * These tests load the full Spring Boot context with a real SecurityWebFilterChain
 * to verify that the security rules are correctly applied BEFORE gateway routing.
 * Downstream services are not running, so routed requests may return 503 — the key
 * assertion is that security filters (401/403) execute before routing.
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
        "spring.cloud.gateway.routes[0].id=test-fallback",
        "spring.cloud.gateway.routes[0].uri=http://localhost:19999",
        "spring.cloud.gateway.routes[0].predicates[0]=Path=/api/v1/users/**"
})
@DisplayName("SecurityConfig Integration Tests (API Gateway)")
class SecurityConfigIntegrationTest {

    @Autowired
    private WebTestClient webTestClient;

    @MockitoBean
    private ReactiveStringRedisTemplate reactiveStringRedisTemplate;

    @Nested
    @DisplayName("Authentication Enforcement")
    class AuthenticationEnforcement {

        @Test
        @DisplayName("Unauthenticated request to protected endpoint returns 401")
        void unauthenticatedRequestReturns401() {
            // Arrange & Act & Assert
            // A GET to any protected endpoint without a JWT should be rejected with 401.
            // /api/v1/users is a protected path that requires authentication.
            webTestClient.get()
                    .uri("/api/v1/users")
                    .exchange()
                    .expectStatus().isUnauthorized();
        }
    }

    @Nested
    @DisplayName("Public Endpoints")
    class PublicEndpoints {

        @Test
        @DisplayName("GET /actuator/health is accessible without authentication")
        void publicHealthEndpointAccessible() {
            // Arrange & Act & Assert
            // /actuator/health is explicitly permitted in SecurityConfig line 58.
            // It should return 200 (the actuator health endpoint is built-in).
            webTestClient.get()
                    .uri("/actuator/health")
                    .exchange()
                    .expectStatus().isOk();
        }

        @Test
        @DisplayName("Public auth endpoints are accessible without authentication")
        void publicAuthEndpointsAccessible() {
            // Arrange & Act & Assert
            // /api/v1/auth/login is permitAll() in SecurityConfig line 48.
            // The downstream auth-facade is not running, so we may get 503,
            // but we must NOT get 401 — proving the security filter allows it through.
            webTestClient.get()
                    .uri("/api/v1/auth/providers")
                    .exchange()
                    .expectStatus().value(status ->
                            // Acceptable: 200 (if handler exists), or 503/404 (no downstream).
                            // NOT acceptable: 401 or 403.
                            org.assertj.core.api.Assertions.assertThat(status)
                                    .isNotEqualTo(401)
                                    .isNotEqualTo(403));
        }
    }

    @Nested
    @DisplayName("Actuator Security")
    class ActuatorSecurity {

        @Test
        @DisplayName("GET /actuator/info without authentication returns 401")
        void actuatorMetricsRequiresAuth() {
            // Arrange & Act & Assert
            // /actuator/** (except /health) requires authentication per SecurityConfig line 59.
            webTestClient.get()
                    .uri("/actuator/info")
                    .exchange()
                    .expectStatus().isUnauthorized();
        }
    }

    @Nested
    @DisplayName("Security Headers")
    class SecurityHeaders {

        @Test
        @DisplayName("Response includes HSTS, X-Frame-Options, and X-Content-Type-Options headers")
        void securityHeadersPresent() {
            // Arrange & Act & Assert
            // SecurityConfig lines 72-84 configure security headers.
            // We use the /actuator/health endpoint (public, returns 200) to verify headers.
            webTestClient.get()
                    .uri("/actuator/health")
                    .exchange()
                    .expectStatus().isOk()
                    .expectHeader().valueMatches("Strict-Transport-Security",
                            ".*max-age=31536000.*includeSubDomains.*")
                    .expectHeader().valueEquals("X-Frame-Options", "DENY")
                    .expectHeader().valueEquals("X-Content-Type-Options", "nosniff")
                    .expectHeader().exists("Content-Security-Policy")
                    .expectHeader().exists("Referrer-Policy");
        }
    }

    @Nested
    @DisplayName("Internal Endpoint Denial")
    class InternalEndpointDenial {

        @Test
        @DisplayName("GET /api/v1/internal/** returns 403 even for authenticated users")
        void internalEndpointsDenied() {
            // Arrange & Act & Assert
            // SecurityConfig line 62: .pathMatchers("/api/v1/internal/**").denyAll()
            // Even with a valid JWT, internal endpoints should be completely blocked.
            webTestClient
                    .mutateWith(mockJwt().jwt(jwt -> jwt
                            .subject("regular-user")
                            .claim("realm_access", java.util.Map.of(
                                    "roles", java.util.List.of("USER")))))
                    .get()
                    .uri("/api/v1/internal/features/check")
                    .exchange()
                    .expectStatus().isForbidden();
        }
    }

    @Nested
    @DisplayName("Admin Endpoint Authorization")
    class AdminEndpointAuthorization {

        @Test
        @DisplayName("GET /api/v1/admin/** returns 403 without ADMIN role")
        void adminEndpointRequiresAdminRole() {
            // Arrange & Act & Assert
            // SecurityConfig line 64: .pathMatchers("/api/v1/admin/**").hasAnyRole("ADMIN", "SUPER_ADMIN")
            // A user with only USER role should be forbidden.
            webTestClient
                    .mutateWith(mockJwt().jwt(jwt -> jwt
                            .subject("regular-user")
                            .claim("realm_access", java.util.Map.of(
                                    "roles", java.util.List.of("USER")))))
                    .get()
                    .uri("/api/v1/admin/licenses/status")
                    .exchange()
                    .expectStatus().isForbidden();
        }
    }
}
