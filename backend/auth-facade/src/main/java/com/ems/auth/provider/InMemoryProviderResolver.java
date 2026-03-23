package com.ems.auth.provider;

import com.ems.auth.dto.ProviderConfigRequest;
import com.ems.auth.util.RealmResolver;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * In-Memory Implementation of DynamicProviderResolver.
 *
 * This implementation stores provider configurations in memory using a
 * ConcurrentHashMap. It is suitable for:
 * - Development and testing
 * - Fallback when Neo4j is unavailable
 * - Single-instance deployments
 *
 * For production multi-instance deployments, use Neo4jProviderResolver.
 *
 * Activation:
 * This bean is activated when auth.dynamic-broker.storage=memory.
 * The Neo4jProviderResolver is the primary implementation (storage=neo4j).
 *
 * Note: This implementation initializes with default providers for common
 * tenants to support backward compatibility with static configuration.
 */
@Service
@ConditionalOnProperty(name = "auth.dynamic-broker.storage", havingValue = "memory")
@Slf4j
public class InMemoryProviderResolver implements DynamicProviderResolver {

    /**
     * Provider storage: Map<tenantId, Map<providerName, ProviderConfig>>
     */
    private final Map<String, Map<String, ProviderConfig>> providerStore = new ConcurrentHashMap<>();

    /**
     * Initialize with default providers for backward compatibility.
     */
    public InMemoryProviderResolver() {
        log.info("Initializing InMemoryProviderResolver");
        initializeDefaultProviders();
    }

    @Override
    public ProviderConfig resolveProvider(String tenantId, String providerName) {
        String tenantKey = normalizeTenantId(tenantId);
        log.debug("Resolving provider {} for tenant {}", providerName, tenantKey);

        Map<String, ProviderConfig> tenantProviders = providerStore.get(tenantKey);
        if (tenantProviders == null) {
            throw new ProviderNotFoundException(tenantId, providerName);
        }

        // Try exact match first
        ProviderConfig config = tenantProviders.get(providerName);
        if (config != null) {
            return config;
        }

        // Try case-insensitive match
        config = tenantProviders.entrySet().stream()
            .filter(e -> e.getKey().equalsIgnoreCase(providerName))
            .map(Map.Entry::getValue)
            .findFirst()
            .orElse(null);

        if (config != null) {
            return config;
        }

        // Try matching by ID
        config = tenantProviders.values().stream()
            .filter(p -> p.id() != null && p.id().equals(providerName))
            .findFirst()
            .orElse(null);

        if (config != null) {
            return config;
        }

        throw new ProviderNotFoundException(tenantId, providerName);
    }

    @Override
    public List<ProviderConfig> listProviders(String tenantId) {
        String tenantKey = normalizeTenantId(tenantId);
        log.debug("Listing providers for tenant {}", tenantKey);

        Map<String, ProviderConfig> tenantProviders = providerStore.get(tenantKey);
        if (tenantProviders == null) {
            return Collections.emptyList();
        }

        return tenantProviders.values().stream()
            .sorted(Comparator.comparingInt(ProviderConfig::priority))
            .collect(Collectors.toList());
    }

    @Override
    public void registerProvider(String tenantId, ProviderConfigRequest request) {
        String tenantKey = normalizeTenantId(tenantId);
        log.info("Registering provider {} ({}) for tenant {}",
            request.providerName(), request.protocol(), tenantKey);

        Map<String, ProviderConfig> tenantProviders = providerStore
            .computeIfAbsent(tenantKey, k -> new ConcurrentHashMap<>());

        // Check if provider already exists
        if (tenantProviders.containsKey(request.providerName())) {
            throw new ProviderAlreadyExistsException(tenantKey, request.providerName());
        }

        // Create provider config from request
        ProviderConfig config = createConfigFromRequest(tenantKey, request);
        tenantProviders.put(request.providerName(), config);

        log.info("Successfully registered provider {} for tenant {}", request.providerName(), tenantKey);
    }

    @Override
    public void updateProvider(String tenantId, String providerId, ProviderConfigRequest request) {
        String tenantKey = normalizeTenantId(tenantId);
        log.info("Updating provider {} for tenant {}", providerId, tenantKey);

        Map<String, ProviderConfig> tenantProviders = providerStore.get(tenantKey);
        if (tenantProviders == null) {
            throw new ProviderNotFoundException(tenantId, providerId);
        }

        // Find existing provider
        ProviderConfig existing = resolveProvider(tenantKey, providerId);

        // Remove old entry if name changed
        tenantProviders.remove(existing.providerName());

        // Create updated config preserving original id and createdAt
        ProviderConfig updated = createUpdatedConfig(tenantKey, existing, request);
        tenantProviders.put(request.providerName(), updated);

        log.info("Successfully updated provider {} for tenant {}", providerId, tenantKey);
    }

    @Override
    public void deleteProvider(String tenantId, String providerId) {
        String tenantKey = normalizeTenantId(tenantId);
        log.info("Deleting provider {} for tenant {}", providerId, tenantKey);

        Map<String, ProviderConfig> tenantProviders = providerStore.get(tenantKey);
        if (tenantProviders == null) {
            throw new ProviderNotFoundException(tenantId, providerId);
        }

        // Find and remove the provider
        ProviderConfig existing = resolveProvider(tenantKey, providerId);
        tenantProviders.remove(existing.providerName());

        log.info("Successfully deleted provider {} for tenant {}", providerId, tenantKey);
    }

    @Override
    public void invalidateCache(String tenantId) {
        String tenantKey = normalizeTenantId(tenantId);
        log.info("Invalidating cache for tenant {} (no-op for in-memory implementation)", tenantKey);
        // No-op for in-memory implementation
        // In a cached implementation, this would clear the cache
    }

    /**
     * Normalizes tenant aliases to the canonical in-memory key.
     * This keeps backward compatibility for master tenant aliases while UUID-first
     * callers are being adopted.
     */
    private String normalizeTenantId(String tenantId) {
        if (tenantId == null || tenantId.isBlank()) {
            return tenantId;
        }
        if (RealmResolver.isMasterTenant(tenantId)) {
            return "master";
        }
        return tenantId;
    }

    /**
     * Create updated config preserving original id and createdAt.
     */
    private ProviderConfig createUpdatedConfig(String tenantId, ProviderConfig existing, ProviderConfigRequest request) {
        Instant now = Instant.now();

        return ProviderConfig.builder()
            .id(existing.id())
            .tenantId(tenantId)
            .providerName(request.providerName())
            .displayName(request.displayName() != null ? request.displayName() : request.providerName())
            .protocol(request.protocol())
            .clientId(request.clientId())
            .clientSecret(request.clientSecret())
            .discoveryUrl(request.discoveryUrl())
            .authorizationUrl(request.authorizationUrl())
            .tokenUrl(request.tokenUrl())
            .userInfoUrl(request.userInfoUrl())
            .jwksUrl(request.jwksUrl())
            .issuerUrl(request.issuerUrl())
            .scopes(request.scopes())
            .metadataUrl(request.metadataUrl())
            .serverUrl(request.serverUrl())
            .port(request.port())
            .bindDn(request.bindDn())
            .bindPassword(request.bindPassword())
            .userSearchBase(request.userSearchBase())
            .userSearchFilter(request.userSearchFilter())
            .idpHint(request.idpHint())
            .enabled(request.enabled())
            .priority(request.priority() != null ? request.priority() : 100)
            .trustEmail(request.trustEmail() != null ? request.trustEmail() : true)
            .storeToken(request.storeToken() != null ? request.storeToken() : false)
            .linkExistingAccounts(request.linkExistingAccounts() != null ? request.linkExistingAccounts() : true)
            .createdAt(existing.createdAt())
            .updatedAt(now)
            .build();
    }

    /**
     * Create ProviderConfig from ProviderConfigRequest.
     */
    private ProviderConfig createConfigFromRequest(String tenantId, ProviderConfigRequest request) {
        Instant now = Instant.now();

        return ProviderConfig.builder()
            .id(UUID.randomUUID().toString())
            .tenantId(tenantId)
            .providerName(request.providerName())
            .displayName(request.displayName() != null ? request.displayName() : request.providerName())
            .protocol(request.protocol())
            .clientId(request.clientId())
            .clientSecret(request.clientSecret())
            .discoveryUrl(request.discoveryUrl())
            .authorizationUrl(request.authorizationUrl())
            .tokenUrl(request.tokenUrl())
            .userInfoUrl(request.userInfoUrl())
            .jwksUrl(request.jwksUrl())
            .issuerUrl(request.issuerUrl())
            .scopes(request.scopes())
            .metadataUrl(request.metadataUrl())
            .serverUrl(request.serverUrl())
            .port(request.port())
            .bindDn(request.bindDn())
            .bindPassword(request.bindPassword())
            .userSearchBase(request.userSearchBase())
            .userSearchFilter(request.userSearchFilter())
            .idpHint(request.idpHint())
            .enabled(request.enabled())
            .priority(request.priority() != null ? request.priority() : 100)
            .trustEmail(request.trustEmail() != null ? request.trustEmail() : true)
            .storeToken(request.storeToken() != null ? request.storeToken() : false)
            .linkExistingAccounts(request.linkExistingAccounts() != null ? request.linkExistingAccounts() : true)
            .createdAt(now)
            .updatedAt(now)
            .build();
    }

    /**
     * Initialize default providers for backward compatibility.
     */
    private void initializeDefaultProviders() {
        // Add default Keycloak provider for master tenant
        addDefaultProvider("master", "KEYCLOAK", "Keycloak", "OIDC",
            "keycloak", List.of("openid", "profile", "email"));

        // Add default providers for common social logins
        addDefaultProvider("master", "GOOGLE", "Google", "OIDC",
            "google", List.of("openid", "profile", "email"));

        addDefaultProvider("master", "MICROSOFT", "Microsoft", "OIDC",
            "microsoft", List.of("openid", "profile", "email"));

        log.info("Initialized {} default providers", providerStore.values().stream()
            .mapToInt(Map::size).sum());
    }

    /**
     * Add a default provider.
     */
    private void addDefaultProvider(String tenantId, String name, String displayName,
                                    String protocol, String idpHint, List<String> scopes) {
        Map<String, ProviderConfig> tenantProviders = providerStore
            .computeIfAbsent(tenantId, k -> new ConcurrentHashMap<>());

        Instant now = Instant.now();
        ProviderConfig config = ProviderConfig.builder()
            .id(UUID.randomUUID().toString())
            .tenantId(tenantId)
            .providerName(name)
            .displayName(displayName)
            .protocol(protocol)
            .idpHint(idpHint)
            .scopes(scopes)
            .enabled(true)
            .priority(100)
            .trustEmail(true)
            .storeToken(false)
            .linkExistingAccounts(true)
            .createdAt(now)
            .updatedAt(now)
            .build();

        tenantProviders.put(name, config);
    }

}
