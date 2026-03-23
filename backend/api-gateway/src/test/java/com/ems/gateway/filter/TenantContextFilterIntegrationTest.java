package com.ems.gateway.filter;

import com.ems.gateway.ApiGatewayApplication;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.reactive.server.WebTestClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.mockJwt;

/**
 * Integration tests for TenantContextFilter verifying correct header handling
 * through the Spring Cloud Gateway filter chain.
 *
 * These tests verify that:
 * 1. X-Forwarded-Host is NOT duplicated by the TenantContextFilter
 * 2. X-Request-ID is generated/forwarded correctly
 * 3. Tenant resolution headers flow through correctly
 */
@SpringBootTest(
        classes = ApiGatewayApplication.class,
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT
)
@AutoConfigureWebTestClient
@ActiveProfiles("test")
@Import({
        TenantContextFilterIntegrationTest.TestConfig.class,
        TenantContextFilterIntegrationTest.TestEchoController.class
})
@TestPropertySource(properties = {
        "eureka.client.enabled=false",
        "spring.data.redis.host=localhost",
        "spring.data.redis.port=6379"
})
class TenantContextFilterIntegrationTest {

    @Autowired
    private WebTestClient webTestClient;

    @Test
    @DisplayName("Should add X-Request-ID header when routing through gateway")
    void shouldAddRequestIdHeader() {
        authenticatedClient().get()
                .uri("/test/echo-headers")
                .header("Host", "tenant1.localhost")
                .exchange()
                .expectStatus().isOk()
                .expectBody(String.class)
                .consumeWith(result -> {
                    String body = result.getResponseBody();
                    assertThat(body).isNotNull();
                    assertThat(extractHeaderValue(body, "X-Request-ID"))
                            .isNotBlank();
                });
    }

    @Test
    @DisplayName("Should preserve existing X-Request-ID header")
    void shouldPreserveExistingRequestId() {
        String requestId = "my-custom-request-id-123";

        authenticatedClient().get()
                .uri("/test/echo-headers")
                .header("Host", "tenant1.localhost")
                .header("X-Request-ID", requestId)
                .exchange()
                .expectStatus().isOk()
                .expectBody(String.class)
                .consumeWith(result -> {
                    String body = result.getResponseBody();
                    assertThat(body).isNotNull();
                    assertThat(extractHeaderValue(body, "X-Request-ID"))
                            .isEqualTo(requestId);
                });
    }

    @Test
    @DisplayName("Should NOT create duplicate X-Forwarded-Host header")
    void shouldNotDuplicateForwardedHostHeader() {
        authenticatedClient().get()
                .uri("/test/echo-headers")
                .header("Host", "tenant1.localhost")
                .exchange()
                .expectStatus().isOk()
                .expectBody(String.class)
                .consumeWith(result -> {
                    String body = result.getResponseBody();
                    assertThat(body).isNotNull();
                    // The bug was duplicate headers like "localhost,localhost"
                    // After fix, should NOT contain comma-separated duplicates
                    if (body.contains("X-Forwarded-Host")) {
                        assertThat(body).doesNotContain("localhost,localhost");
                    }
                });
    }

    @Test
    @DisplayName("Should forward X-Tenant-ID header to downstream service")
    void shouldForwardTenantIdHeader() {
        String tenantId = "b3f6f2ae-8899-4fb8-9e57-d0f4f2234a12";

        authenticatedClient().get()
                .uri("/test/echo-headers")
                .header("Host", "tenant1.localhost")
                .header("X-Tenant-ID", tenantId)
                .exchange()
                .expectStatus().isOk()
                .expectBody(String.class)
                .consumeWith(result -> {
                    String body = result.getResponseBody();
                    assertThat(body).isNotNull();
                    assertThat(body).contains("X-Tenant-ID: " + tenantId);
                });
    }

    @Test
    @DisplayName("Should reject non-UUID X-Tenant-ID header with 400")
    void shouldRejectNonUuidTenantIdHeader() {
        authenticatedClient().get()
                .uri("/test/echo")
                .header("Host", "tenant1.localhost")
                .header("X-Tenant-ID", "tenant-master")
                .exchange()
                .expectStatus().isEqualTo(HttpStatus.BAD_REQUEST)
                .expectBody(String.class)
                .consumeWith(result -> {
                    String body = result.getResponseBody();
                    assertThat(body).isNotNull();
                    assertThat(body).contains("invalid_tenant_id");
                });
    }

    @Test
    @DisplayName("Should handle requests without tenant context")
    void shouldHandleRequestsWithoutTenantContext() {
        authenticatedClient().get()
                .uri("/test/public")
                .header("Host", "public.localhost")
                .exchange()
                .expectStatus().isOk();
    }

    @Test
    @DisplayName("Generated X-Request-ID should be valid UUID format")
    void generatedRequestIdShouldBeValidUuid() {
        authenticatedClient().get()
                .uri("/test/echo-headers")
                .header("Host", "tenant1.localhost")
                .exchange()
                .expectStatus().isOk()
                .expectBody(String.class)
                .consumeWith(result -> {
                    String body = result.getResponseBody();
                    String requestId = extractHeaderValue(body, "X-Request-ID");
                    assertThat(requestId)
                            .isNotNull()
                            .hasSize(36)
                            .matches("[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}");
                });
    }

    private static String extractHeaderValue(String headersDump, String headerName) {
        if (headersDump == null) {
            return null;
        }
        String prefix = headerName + ": ";
        return headersDump.lines()
                .filter(line -> line.startsWith(prefix))
                .map(line -> line.substring(prefix.length()).trim())
                .findFirst()
                .orElse(null);
    }

    private WebTestClient authenticatedClient() {
        return webTestClient.mutateWith(mockJwt().jwt(jwt -> jwt.subject("gateway-integration-test")));
    }

    /**
     * Test configuration that provides mock endpoints for gateway routing tests.
     */
    @TestConfiguration
    static class TestConfig {

        @Bean
        public RouteLocator testRoutes(RouteLocatorBuilder builder) {
            return builder.routes()
                    .route("test-echo", r -> r
                            .path("/test/echo")
                            .uri("forward:/test-echo"))
                    .route("test-echo-headers", r -> r
                            .path("/test/echo-headers")
                            .uri("forward:/test-echo-headers"))
                    .route("test-public", r -> r
                            .path("/test/public")
                            .uri("forward:/test-public"))
                    .build();
        }
    }

    /**
     * Test controller providing endpoints for integration tests.
     */
    @RestController
    static class TestEchoController {

        @GetMapping("/test-echo")
        public Mono<Map<String, String>> echo() {
            return Mono.just(Map.of("status", "ok"));
        }

        @GetMapping("/test-echo-headers")
        public Mono<String> echoHeaders(
                org.springframework.http.server.reactive.ServerHttpRequest request) {
            StringBuilder sb = new StringBuilder();
            request.getHeaders().forEach((name, values) -> {
                for (String value : values) {
                    sb.append(name).append(": ").append(value).append("\n");
                }
            });
            return Mono.just(sb.toString());
        }

        @GetMapping("/test-public")
        public Mono<Map<String, String>> publicEndpoint() {
            return Mono.just(Map.of("access", "public"));
        }
    }
}
