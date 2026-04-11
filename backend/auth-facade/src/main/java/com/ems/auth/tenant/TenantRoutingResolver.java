package com.ems.auth.tenant;

import com.ems.auth.client.TenantServiceClient;
import com.ems.auth.config.AuthGraphPerTenantProperties;
import com.ems.auth.dto.internal.TenantRoutingRecord;
import com.ems.common.exception.TenantNotFoundException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@RequiredArgsConstructor
@Slf4j
public class TenantRoutingResolver {

    private static final String SERVICE_CACHE_SUFFIX = ":auth-facade";

    private final TenantServiceClient tenantServiceClient;
    private final StringRedisTemplate stringRedisTemplate;
    private final ObjectMapper objectMapper;
    private final AuthGraphPerTenantProperties properties;

    public TenantRoutingContext resolve(String tenantIdentifier) {
        if (tenantIdentifier == null || tenantIdentifier.isBlank()) {
            throw new TenantNotFoundException("Tenant identifier is required");
        }

        String normalized = tenantIdentifier.trim();
        TenantRoutingContext cached = readFromCache(cacheKey(normalized));
        if (cached != null) {
            return cached;
        }

        TenantRoutingRecord response;
        try {
            response = tenantServiceClient.getRouting(normalized);
        } catch (FeignException.NotFound ex) {
            throw new TenantNotFoundException("Tenant not found: " + normalized);
        } catch (FeignException ex) {
            throw new TenantRoutingUnavailableException("Failed to resolve tenant routing metadata", ex);
        }

        if (response.authDbName() == null || response.authDbName().isBlank()) {
            throw new TenantRoutingUnavailableException("Tenant routing metadata is missing authDbName");
        }

        TenantRoutingContext context = new TenantRoutingContext(
            response.tenantId(),
            response.slug(),
            response.authDbName(),
            response.defaultLocale() == null || response.defaultLocale().isBlank() ? "en" : response.defaultLocale(),
            response.baselineVersion()
        );

        writeToCache(cacheKey(normalized), context);
        if (context.tenantIdValue() != null && !normalized.equals(context.tenantIdValue())) {
            writeToCache(cacheKey(context.tenantIdValue()), context);
        }
        return context;
    }

    private String cacheKey(String tenantIdentifier) {
        return properties.getRoutingCachePrefix() + tenantIdentifier + SERVICE_CACHE_SUFFIX;
    }

    private TenantRoutingContext readFromCache(String key) {
        try {
            ValueOperations<String, String> valueOperations = stringRedisTemplate.opsForValue();
            String payload = valueOperations.get(key);
            if (payload == null || payload.isBlank()) {
                return null;
            }
            return objectMapper.readValue(payload, TenantRoutingContext.class);
        } catch (JsonProcessingException ex) {
            log.warn("Ignoring unreadable tenant routing cache entry {}: {}", key, ex.getMessage());
            return null;
        } catch (Exception ex) {
            log.warn("Tenant routing cache read failed for {}: {}", key, ex.getMessage());
            return null;
        }
    }

    private void writeToCache(String key, TenantRoutingContext context) {
        try {
            String payload = objectMapper.writeValueAsString(context);
            stringRedisTemplate.opsForValue().set(
                key,
                payload,
                Duration.ofMinutes(properties.getRoutingCacheTtlMinutes())
            );
        } catch (Exception ex) {
            log.warn("Tenant routing cache write failed for {}: {}", key, ex.getMessage());
        }
    }
}
