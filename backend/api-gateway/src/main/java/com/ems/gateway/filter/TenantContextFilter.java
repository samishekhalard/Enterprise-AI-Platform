package com.ems.gateway.filter;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

/**
 * Global filter to add tenant context and request tracking headers.
 */
@Component
@Slf4j
public class TenantContextFilter implements GlobalFilter, Ordered {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();

        // Generate request ID if not present
        String requestId = request.getHeaders().getFirst("X-Request-ID");
        if (requestId == null || requestId.isBlank()) {
            requestId = UUID.randomUUID().toString();
        }
        String effectiveRequestId = requestId;

        // Get tenant ID from header (frontend should send this)
        String tenantId = request.getHeaders().getFirst("X-Tenant-ID");
        if (tenantId != null) {
            tenantId = tenantId.trim();
            if (tenantId.isEmpty() || !isValidUuid(tenantId)) {
                return rejectInvalidTenantId(exchange);
            }
        }

        // Log request
        log.debug("Gateway routing: {} {} | Tenant: {} | RequestId: {}",
            request.getMethod(),
            request.getPath(),
            tenantId != null ? tenantId : "none",
            effectiveRequestId
        );

        // Add/forward headers to downstream services
        // Note: X-Forwarded-Host is automatically added by Spring Cloud Gateway
        String effectiveTenantId = tenantId;
        ServerHttpRequest mutatedRequest = request.mutate()
            .headers(headers -> {
                headers.set("X-Request-ID", effectiveRequestId);
                if (effectiveTenantId != null) {
                    headers.set("X-Tenant-ID", effectiveTenantId);
                }
            })
            .build();

        return chain.filter(exchange.mutate().request(mutatedRequest).build());
    }

    @Override
    public int getOrder() {
        return -100; // Run early in the filter chain
    }

    private boolean isValidUuid(String value) {
        try {
            UUID.fromString(value);
            return true;
        } catch (IllegalArgumentException ex) {
            return false;
        }
    }

    private Mono<Void> rejectInvalidTenantId(ServerWebExchange exchange) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(HttpStatus.BAD_REQUEST);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);

        String body = "{\"error\":\"invalid_tenant_id\",\"message\":\"X-Tenant-ID must be a valid UUID\"}";
        DataBuffer buffer = response.bufferFactory().wrap(body.getBytes(StandardCharsets.UTF_8));
        return response.writeWith(Mono.just(buffer));
    }
}
