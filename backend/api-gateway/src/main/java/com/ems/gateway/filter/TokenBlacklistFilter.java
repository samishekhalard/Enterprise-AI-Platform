package com.ems.gateway.filter;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.nio.charset.StandardCharsets;

@Component
@Slf4j
public class TokenBlacklistFilter implements GlobalFilter, Ordered {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final ReactiveStringRedisTemplate redisTemplate;
    private final String blacklistPrefix;

    public TokenBlacklistFilter(
            ReactiveStringRedisTemplate redisTemplate,
            @Value("${token.blacklist.prefix:auth:blacklist:}") String blacklistPrefix
    ) {
        this.redisTemplate = redisTemplate;
        this.blacklistPrefix = blacklistPrefix;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String authHeader = exchange.getRequest().getHeaders().getFirst("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return chain.filter(exchange);
        }

        String token = authHeader.substring(7);
        String jti = extractJti(token);
        if (jti == null) {
            return chain.filter(exchange);
        }

        return redisTemplate.hasKey(blacklistPrefix + jti)
                .flatMap(isBlacklisted -> {
                    if (Boolean.TRUE.equals(isBlacklisted)) {
                        log.info("Blocked request with blacklisted token jti={}", jti);
                        return rejectBlacklistedToken(exchange);
                    }
                    return chain.filter(exchange);
                });
    }

    @Override
    public int getOrder() {
        return -200; // Run before TenantContextFilter (-100)
    }

    private String extractJti(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) return null;
            byte[] decoded = java.util.Base64.getUrlDecoder().decode(parts[1]);
            JsonNode payload = MAPPER.readTree(decoded);
            JsonNode jtiNode = payload.get("jti");
            return (jtiNode != null && jtiNode.isTextual()) ? jtiNode.asText() : null;
        } catch (Exception e) {
            log.debug("Failed to extract JTI from token: {}", e.getMessage());
            return null;
        }
    }

    private Mono<Void> rejectBlacklistedToken(ServerWebExchange exchange) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(HttpStatus.UNAUTHORIZED);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);

        String body = "{\"error\":\"token_revoked\",\"message\":\"Token has been revoked\"}";
        DataBuffer buffer = response.bufferFactory().wrap(body.getBytes(StandardCharsets.UTF_8));
        return response.writeWith(Mono.just(buffer));
    }
}
