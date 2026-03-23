package com.ems.auth.filter;

import com.ems.common.exception.RateLimitExceededException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Component
@Order(2)
@RequiredArgsConstructor
@Slf4j
public class RateLimitFilter extends OncePerRequestFilter {

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${rate-limit.requests-per-minute:100}")
    private int requestsPerMinute;

    @Value("${rate-limit.cache-prefix:auth:rate:}")
    private String cachePrefix;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // Skip rate limiting for actuator and swagger
        String path = request.getRequestURI();
        if (path.startsWith("/actuator") || path.startsWith("/swagger") || path.startsWith("/api-docs")) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientIdentifier = getClientIdentifier(request);
        String key = cachePrefix + clientIdentifier;

        try {
            Long currentCount = redisTemplate.opsForValue().increment(key);

            if (currentCount == null) {
                currentCount = 1L;
            }

            if (currentCount == 1) {
                // First request in this window - set expiry
                redisTemplate.expire(key, 60, TimeUnit.SECONDS);
            }

            // Get TTL for Retry-After header
            Long ttl = redisTemplate.getExpire(key, TimeUnit.SECONDS);
            if (ttl == null || ttl < 0) {
                ttl = 60L;
            }

            // Add rate limit headers
            response.setHeader("X-RateLimit-Limit", String.valueOf(requestsPerMinute));
            response.setHeader("X-RateLimit-Remaining", String.valueOf(Math.max(0, requestsPerMinute - currentCount)));
            response.setHeader("X-RateLimit-Reset", String.valueOf(Instant.now().plusSeconds(ttl).getEpochSecond()));

            if (currentCount > requestsPerMinute) {
                log.warn("Rate limit exceeded for client: {}", clientIdentifier);
                sendRateLimitResponse(response, ttl);
                return;
            }

            filterChain.doFilter(request, response);

        } catch (Exception e) {
            // If Valkey is unavailable, allow the request but log warning
            log.warn("Rate limiting failed, allowing request: {}", e.getMessage());
            filterChain.doFilter(request, response);
        }
    }

    private String getClientIdentifier(HttpServletRequest request) {
        // Use X-Forwarded-For if behind proxy, otherwise remote address
        String forwarded = request.getHeader("X-Forwarded-For");
        String ip = forwarded != null ? forwarded.split(",")[0].trim() : request.getRemoteAddr();

        // Combine with tenant ID if available
        String tenantId = request.getHeader(TenantContextFilter.TENANT_HEADER);
        if (tenantId != null && !tenantId.isBlank()) {
            return tenantId + ":" + ip;
        }

        return ip;
    }

    private void sendRateLimitResponse(HttpServletResponse response, long retryAfter) throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setHeader("Retry-After", String.valueOf(retryAfter));

        Map<String, Object> body = Map.of(
                "error", "rate_limit_exceeded",
                "message", "Too many requests. Please try again in " + retryAfter + " seconds.",
                "retryAfter", retryAfter,
                "timestamp", Instant.now().toString()
        );

        response.getWriter().write(objectMapper.writeValueAsString(body));
    }
}
