package com.ems.gateway.filter;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for TenantContextFilter.
 *
 * These tests verify that the filter correctly handles headers
 * without duplicating the X-Forwarded-Host header (which is
 * automatically added by Spring Cloud Gateway).
 */
class TenantContextFilterTest {

    private TenantContextFilter filter;
    private GatewayFilterChain mockChain;
    private ServerWebExchange forwardedExchange;

    @BeforeEach
    void setUp() {
        filter = new TenantContextFilter();
        mockChain = mock(GatewayFilterChain.class);
        when(mockChain.filter(any())).thenAnswer(invocation -> {
            forwardedExchange = invocation.getArgument(0);
            return Mono.empty();
        });
    }

    @Test
    @DisplayName("Should generate X-Request-ID when not present")
    void shouldGenerateRequestIdWhenNotPresent() {
        MockServerHttpRequest request = MockServerHttpRequest
                .get("/api/test")
                .header("Host", "tenant1.example.com")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        filter.filter(exchange, mockChain).block();

        // Verify request ID was generated (36 chars = UUID format)
        String requestId = forwardedExchange.getRequest().getHeaders().getFirst("X-Request-ID");
        assertThat(requestId)
                .isNotNull()
                .hasSize(36)
                .matches("[a-f0-9\\-]+");
    }

    @Test
    @DisplayName("Should preserve existing X-Request-ID")
    void shouldPreserveExistingRequestId() {
        String existingRequestId = "existing-request-id-12345";
        MockServerHttpRequest request = MockServerHttpRequest
                .get("/api/test")
                .header("Host", "tenant1.example.com")
                .header("X-Request-ID", existingRequestId)
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        filter.filter(exchange, mockChain).block();

        String requestId = forwardedExchange.getRequest().getHeaders().getFirst("X-Request-ID");
        assertThat(requestId).isEqualTo(existingRequestId);
    }

    @Test
    @DisplayName("Should NOT add duplicate X-Forwarded-Host header")
    void shouldNotAddDuplicateForwardedHostHeader() {
        // Simulate what Spring Cloud Gateway does - it adds X-Forwarded-Host
        MockServerHttpRequest request = MockServerHttpRequest
                .get("/api/test")
                .header("Host", "tenant1.example.com")
                .header("X-Forwarded-Host", "tenant1.example.com")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        filter.filter(exchange, mockChain).block();

        // Verify X-Forwarded-Host is NOT duplicated (the bug was "localhost,localhost")
        HttpHeaders headers = forwardedExchange.getRequest().getHeaders();
        java.util.List<String> forwardedHostValues = headers.get("X-Forwarded-Host");

        // Should only have one value, not duplicated
        assertThat(forwardedHostValues)
                .isNotNull()
                .hasSize(1)
                .first()
                .asString()
                .doesNotContain(",");
    }

    @Test
    @DisplayName("Should forward X-Tenant-ID header unchanged")
    void shouldForwardTenantIdHeaderUnchanged() {
        String tenantId = "b3f6f2ae-8899-4fb8-9e57-d0f4f2234a12";
        MockServerHttpRequest request = MockServerHttpRequest
                .get("/api/test")
                .header("Host", "tenant1.example.com")
                .header("X-Tenant-ID", tenantId)
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        filter.filter(exchange, mockChain).block();

        String headerTenantId = forwardedExchange.getRequest().getHeaders().getFirst("X-Tenant-ID");
        assertThat(headerTenantId).isEqualTo(tenantId);
    }

    @Test
    @DisplayName("Should reject non-UUID X-Tenant-ID header with 400")
    void shouldRejectNonUuidTenantIdHeader() {
        MockServerHttpRequest request = MockServerHttpRequest
                .get("/api/test")
                .header("Host", "tenant1.example.com")
                .header("X-Tenant-ID", "tenant-master")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        filter.filter(exchange, mockChain).block();

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        verify(mockChain, never()).filter(any());
    }

    @Test
    @DisplayName("Should handle request without X-Tenant-ID header")
    void shouldHandleRequestWithoutTenantIdHeader() {
        MockServerHttpRequest request = MockServerHttpRequest
                .get("/api/test")
                .header("Host", "public.example.com")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        // Should not throw exception
        filter.filter(exchange, mockChain).block();

        // Request ID should still be generated
        String requestId = forwardedExchange.getRequest().getHeaders().getFirst("X-Request-ID");
        assertThat(requestId).isNotNull();
    }

    @Test
    @DisplayName("Should have correct filter order (-100)")
    void shouldHaveCorrectFilterOrder() {
        assertThat(filter.getOrder()).isEqualTo(-100);
    }

    @Test
    @DisplayName("Should generate new request ID for blank value")
    void shouldGenerateRequestIdForBlankValue() {
        MockServerHttpRequest request = MockServerHttpRequest
                .get("/api/test")
                .header("Host", "tenant1.example.com")
                .header("X-Request-ID", "   ")  // blank value
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        filter.filter(exchange, mockChain).block();

        // Should generate a new UUID, not preserve the blank
        String requestId = forwardedExchange.getRequest().getHeaders().getFirst("X-Request-ID");
        assertThat(requestId)
                .isNotNull()
                .hasSize(36)
                .matches("[a-f0-9\\-]+");
    }
}
