package com.ems.auth.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * Cache Configuration for Valkey.
 *
 * Configures caching for:
 * - providerConfig: Individual provider configurations (5 minute TTL)
 * - providerList: List of providers per tenant (5 minute TTL)
 * - userRoles: User role lookups (10 minute TTL)
 *
 * Uses Spring Cache abstraction with Valkey as the backing store.
 */
@Configuration
@EnableCaching
public class CacheConfig {

    /**
     * Default cache TTL.
     */
    private static final Duration DEFAULT_TTL = Duration.ofMinutes(5);

    /**
     * Provider config cache TTL.
     */
    private static final Duration PROVIDER_CONFIG_TTL = Duration.ofMinutes(5);

    /**
     * Provider list cache TTL.
     */
    private static final Duration PROVIDER_LIST_TTL = Duration.ofMinutes(5);

    /**
     * User roles cache TTL.
     */
    private static final Duration USER_ROLES_TTL = Duration.ofMinutes(10);

    /**
     * Configure Valkey cache manager with per-cache TTL settings.
     *
     * @param connectionFactory Valkey connection factory
     * @return Configured cache manager
     */
    @Bean
    public CacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        ObjectMapper cacheObjectMapper = new ObjectMapper().findAndRegisterModules();
        GenericJackson2JsonRedisSerializer valueSerializer = new GenericJackson2JsonRedisSerializer(cacheObjectMapper);

        // Default configuration
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(DEFAULT_TTL)
            .disableCachingNullValues()
            .serializeKeysWith(
                RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer())
            )
            .serializeValuesWith(
                RedisSerializationContext.SerializationPair.fromSerializer(valueSerializer)
            );

        // Per-cache configurations
        Map<String, RedisCacheConfiguration> cacheConfigurations = new HashMap<>();

        // Provider configuration cache
        cacheConfigurations.put("providerConfig",
            defaultConfig.entryTtl(PROVIDER_CONFIG_TTL)
                .prefixCacheNameWith("auth:")
        );

        // Provider list cache
        cacheConfigurations.put("providerList",
            defaultConfig.entryTtl(PROVIDER_LIST_TTL)
                .prefixCacheNameWith("auth:")
        );

        // User roles cache (longer TTL as roles change less frequently)
        cacheConfigurations.put("userRoles",
            defaultConfig.entryTtl(USER_ROLES_TTL)
                .prefixCacheNameWith("auth:")
        );

        return RedisCacheManager.builder(connectionFactory)
            .cacheDefaults(defaultConfig)
            .withInitialCacheConfigurations(cacheConfigurations)
            .transactionAware()
            .build();
    }
}
