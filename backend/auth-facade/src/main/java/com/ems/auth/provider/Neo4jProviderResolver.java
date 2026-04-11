package com.ems.auth.provider;

import com.ems.auth.dto.ProviderConfigRequest;
import com.ems.auth.config.KeycloakConfig;
import com.ems.auth.graph.entity.ConfigNode;
import com.ems.auth.graph.repository.AuthGraphRepository;
import com.ems.auth.service.EncryptionService;
import com.ems.auth.util.RealmResolver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Neo4j Implementation of DynamicProviderResolver.
 *
 * This is the production implementation for multi-tenant provider configuration.
 * It stores provider configurations in Neo4j and uses Valkey for caching.
 *
 * Features:
 * - Graph-based provider configuration storage
 * - Encrypted secrets (client secrets, bind passwords)
 * - Distributed caching with Valkey
 * - Cache invalidation on configuration changes
 *
 * Activation:
 * This bean is activated when auth.dynamic-broker.storage=neo4j (default).
 * It is marked as @Primary to override InMemoryProviderResolver.
 */
@Service
@ConditionalOnProperty(name = "auth.dynamic-broker.storage", havingValue = "neo4j", matchIfMissing = true)
@Primary
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class Neo4jProviderResolver implements DynamicProviderResolver {

    private final AuthGraphRepository repository;
    private final StringRedisTemplate redisTemplate;
    private final EncryptionService encryptionService;
    private final KeycloakConfig keycloakConfig;

    private static final String CACHE_PREFIX = "provider:config:";
    private static final String CACHE_LIST_PREFIX = "provider:list:";
    private static final Duration CACHE_TTL = Duration.ofMinutes(5);
    private final Object bootstrapLock = new Object();

    @Override
    public ProviderConfig resolveProvider(String tenantId, String providerName) {
        log.debug("Resolving provider {} for tenant {} from Neo4j", providerName, tenantId);

        // All tenants — including master — read from Neo4j.
        // Bootstrap ensures a default Keycloak entry exists on cold start.
        bootstrapDefaultMasterKeycloakProvider(tenantId);

        return repository.findProviderConfig(tenantId, providerName)
            .map(this::toProviderConfig)
            .orElseThrow(() -> {
                log.warn("Provider {} not found for tenant {}", providerName, tenantId);
                return new ProviderNotFoundException(tenantId, providerName);
            });
    }

    @Override
    @Transactional
    public List<ProviderConfig> listProviders(String tenantId) {
        log.debug("Listing all providers for tenant {} from Neo4j", tenantId);

        // All tenants read from Neo4j. Bootstrap seeds a default Keycloak entry
        // if the tenant has no providers yet (handles fresh installs and master tenant).
        bootstrapDefaultMasterKeycloakProvider(tenantId);

        return repository.findAllConfigsByTenant(tenantId).stream()
            .map(this::toProviderConfig)
            .sorted(Comparator.comparingInt(ProviderConfig::priority))
            .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public List<ProviderConfig> listEnabledProviders(String tenantId) {
        log.debug("Listing enabled providers for tenant {} from Neo4j", tenantId);

        bootstrapDefaultMasterKeycloakProvider(tenantId);

        return repository.findAllEnabledConfigsByTenant(tenantId).stream()
            .map(this::toProviderConfig)
            .sorted(Comparator.comparingInt(ProviderConfig::priority))
            .collect(Collectors.toList());
    }

    @Override
    @Transactional
    @CacheEvict(value = {"providerConfig", "providerList"}, allEntries = true)
    public void registerProvider(String tenantId, ProviderConfigRequest request) {
        log.info("Registering provider {} ({}) for tenant {}",
            request.providerName(), request.protocol(), tenantId);

        // Check if provider already exists for this tenant
        if (repository.providerExistsForTenant(tenantId, request.providerName())) {
            log.warn("Provider {} already exists for tenant {}", request.providerName(), tenantId);
            throw new ProviderAlreadyExistsException(tenantId, request.providerName());
        }

        // Ensure the provider node exists
        ensureProviderNode(request.providerName(), request.protocol());

        // Create the configuration
        Map<String, Object> configProps = buildConfigProperties(tenantId, request);
        ConfigNode created = repository.createProviderConfig(tenantId, request.providerName(), configProps);

        log.info("Successfully registered provider {} for tenant {} with config ID {}",
            request.providerName(), tenantId, created.id());

        // Invalidate cache
        invalidateCacheForTenant(tenantId);
    }

    @Override
    @Transactional
    @CacheEvict(value = {"providerConfig", "providerList"}, allEntries = true)
    public void updateProvider(String tenantId, String providerId, ProviderConfigRequest request) {
        log.info("Updating provider {} for tenant {}", providerId, tenantId);

        // Find existing config
        ConfigNode existing = repository.findConfigById(tenantId, providerId)
            .orElseGet(() -> {
                // Try to find by provider name
                return repository.findProviderConfig(tenantId, providerId)
                    .orElseThrow(() -> {
                        log.warn("Provider {} not found for tenant {}", providerId, tenantId);
                        return new ProviderNotFoundException(tenantId, providerId);
                    });
            });

        // Build updated properties preserving original values
        Map<String, Object> configProps = buildUpdateProperties(existing, request);
        repository.updateProviderConfig(existing.id(), configProps);

        log.info("Successfully updated provider {} for tenant {}", providerId, tenantId);

        // Invalidate cache
        invalidateCacheForTenant(tenantId);
    }

    @Override
    @Transactional
    @CacheEvict(value = {"providerConfig", "providerList"}, allEntries = true)
    public void deleteProvider(String tenantId, String providerId) {
        log.info("Deleting provider {} for tenant {}", providerId, tenantId);

        // Find existing config to get the actual ID
        ConfigNode existing = repository.findConfigById(tenantId, providerId)
            .orElseGet(() -> {
                return repository.findProviderConfig(tenantId, providerId)
                    .orElseThrow(() -> {
                        log.warn("Provider {} not found for tenant {}", providerId, tenantId);
                        return new ProviderNotFoundException(tenantId, providerId);
                    });
            });

        repository.deleteProviderConfig(tenantId, existing.id());
        log.info("Successfully deleted provider {} for tenant {}", providerId, tenantId);

        // Invalidate cache
        invalidateCacheForTenant(tenantId);
    }

    @Override
    public void invalidateCache(String tenantId) {
        log.info("Invalidating cache for tenant {}", tenantId);
        invalidateCacheForTenant(tenantId);
    }

    // ==========================================================================
    // Private Helper Methods
    // ==========================================================================

    /**
     * Convert ConfigNode to ProviderConfig, decrypting secrets.
     */
    private ProviderConfig toProviderConfig(ConfigNode node) {
        return ProviderConfig.builder()
            .id(node.id())
            .tenantId(node.tenantId())
            .providerName(node.providerName())
            .displayName(node.displayName())
            .protocol(node.protocol())
            // OIDC/OAuth2
            .clientId(node.clientId())
            .clientSecret(decryptIfPresent(node.clientSecretEncrypted()))
            .discoveryUrl(node.discoveryUrl())
            .authorizationUrl(node.authorizationUrl())
            .tokenUrl(node.tokenUrl())
            .userInfoUrl(node.userInfoUrl())
            .jwksUrl(node.jwksUrl())
            .issuerUrl(node.issuerUrl())
            .scopes(node.scopes())
            // SAML
            .metadataUrl(node.metadataUrl())
            .entityId(node.entityId())
            .signingCertificate(node.signingCertificate())
            // LDAP
            .serverUrl(node.serverUrl())
            .port(node.port())
            .bindDn(node.bindDn())
            .bindPassword(decryptIfPresent(node.bindPasswordEncrypted()))
            .userSearchBase(node.userSearchBase())
            .userSearchFilter(node.userSearchFilter())
            // Common
            .idpHint(node.idpHint())
            .enabled(node.enabled())
            .priority(node.priority())
            .trustEmail(node.trustEmail())
            .storeToken(node.storeToken())
            .linkExistingAccounts(node.linkExistingAccounts())
            .createdAt(node.createdAt())
            .updatedAt(node.updatedAt())
            .build();
    }

    /**
     * Build configuration properties from request, encrypting secrets.
     */
    private Map<String, Object> buildConfigProperties(String tenantId, ProviderConfigRequest request) {
        Instant now = Instant.now();

        Map<String, Object> props = new HashMap<>();
        props.put("id", UUID.randomUUID().toString());
        props.put("tenantId", tenantId);
        props.put("providerName", request.providerName());
        props.put("displayName", request.displayName() != null ? request.displayName() : request.providerName());
        props.put("protocol", request.protocol());

        // OIDC/OAuth2
        putIfNotNull(props, "clientId", request.clientId());
        putIfNotNull(props, "clientSecretEncrypted", encryptIfPresent(request.clientSecret()));
        putIfNotNull(props, "discoveryUrl", request.discoveryUrl());
        putIfNotNull(props, "authorizationUrl", request.authorizationUrl());
        putIfNotNull(props, "tokenUrl", request.tokenUrl());
        putIfNotNull(props, "userInfoUrl", request.userInfoUrl());
        putIfNotNull(props, "jwksUrl", request.jwksUrl());
        putIfNotNull(props, "issuerUrl", request.issuerUrl());
        if (request.scopes() != null && !request.scopes().isEmpty()) {
            props.put("scopes", request.scopes());
        }

        // SAML
        putIfNotNull(props, "metadataUrl", request.metadataUrl());

        // LDAP
        putIfNotNull(props, "serverUrl", request.serverUrl());
        putIfNotNull(props, "port", request.port());
        putIfNotNull(props, "bindDn", request.bindDn());
        putIfNotNull(props, "bindPasswordEncrypted", encryptIfPresent(request.bindPassword()));
        putIfNotNull(props, "userSearchBase", request.userSearchBase());
        putIfNotNull(props, "userSearchFilter", request.userSearchFilter());

        // Common
        putIfNotNull(props, "idpHint", request.idpHint());
        props.put("enabled", request.enabled());
        props.put("priority", request.priority() != null ? request.priority() : 100);
        props.put("trustEmail", request.trustEmail() != null ? request.trustEmail() : true);
        props.put("storeToken", request.storeToken() != null ? request.storeToken() : false);
        props.put("linkExistingAccounts", request.linkExistingAccounts() != null ? request.linkExistingAccounts() : true);
        props.put("createdAt", now);
        props.put("updatedAt", now);

        return props;
    }

    /**
     * Build update properties, preserving original values for unchanged fields.
     */
    private Map<String, Object> buildUpdateProperties(ConfigNode existing, ProviderConfigRequest request) {
        Instant now = Instant.now();

        Map<String, Object> props = new HashMap<>();
        props.put("providerName", request.providerName());
        props.put("displayName", request.displayName() != null ? request.displayName() : request.providerName());
        props.put("protocol", request.protocol());

        // OIDC/OAuth2
        putIfNotNull(props, "clientId", request.clientId());
        // Only update secret if provided
        if (request.clientSecret() != null && !request.clientSecret().isBlank()) {
            props.put("clientSecretEncrypted", encryptIfPresent(request.clientSecret()));
        }
        putIfNotNull(props, "discoveryUrl", request.discoveryUrl());
        putIfNotNull(props, "authorizationUrl", request.authorizationUrl());
        putIfNotNull(props, "tokenUrl", request.tokenUrl());
        putIfNotNull(props, "userInfoUrl", request.userInfoUrl());
        putIfNotNull(props, "jwksUrl", request.jwksUrl());
        putIfNotNull(props, "issuerUrl", request.issuerUrl());
        if (request.scopes() != null && !request.scopes().isEmpty()) {
            props.put("scopes", request.scopes());
        }

        // SAML
        putIfNotNull(props, "metadataUrl", request.metadataUrl());

        // LDAP
        putIfNotNull(props, "serverUrl", request.serverUrl());
        putIfNotNull(props, "port", request.port());
        putIfNotNull(props, "bindDn", request.bindDn());
        // Only update password if provided
        if (request.bindPassword() != null && !request.bindPassword().isBlank()) {
            props.put("bindPasswordEncrypted", encryptIfPresent(request.bindPassword()));
        }
        putIfNotNull(props, "userSearchBase", request.userSearchBase());
        putIfNotNull(props, "userSearchFilter", request.userSearchFilter());

        // Common
        putIfNotNull(props, "idpHint", request.idpHint());
        props.put("enabled", request.enabled());
        props.put("priority", request.priority() != null ? request.priority() : existing.priority());
        props.put("trustEmail", request.trustEmail() != null ? request.trustEmail() : existing.trustEmail());
        props.put("storeToken", request.storeToken() != null ? request.storeToken() : existing.storeToken());
        props.put("linkExistingAccounts", request.linkExistingAccounts() != null ?
            request.linkExistingAccounts() : existing.linkExistingAccounts());
        props.put("updatedAt", now);

        return props;
    }

    /**
     * Ensure the provider node exists with correct protocol link.
     */
    private void ensureProviderNode(String providerName, String protocol) {
        Map<String, Object> providerProps = Map.of(
            "vendor", getVendorFromProviderName(providerName),
            "displayName", providerName
        );
        repository.ensureProvider(providerName, providerProps);
        repository.linkProviderToProtocol(providerName, protocol);
    }

    /**
     * Bootstrap default Keycloak provider configuration for any tenant that has no
     * providers yet. For the master tenant this seeds the bundled Keycloak provider;
     * for regular tenants it is a no-op (they configure their own providers later).
     */
    private void bootstrapDefaultMasterKeycloakProvider(String tenantId) {
        if (!RealmResolver.isMasterTenant(tenantId)) {
            return; // Regular tenants start empty — admin adds providers via UI.
        }

        synchronized (bootstrapLock) {
            List<ConfigNode> existingConfigs = repository.findAllConfigsByTenant(tenantId);
            if (!existingConfigs.isEmpty()) {
                return;
            }

            log.warn("No provider configuration found for master tenant {}; bootstrapping default KEYCLOAK provider", tenantId);
            ensureTenantNodeExists(tenantId);
            ensureProviderNode("KEYCLOAK", "OIDC");
            repository.createProviderConfigWithoutReturn(
                tenantId,
                "KEYCLOAK",
                buildDefaultKeycloakConfigProps(tenantId)
            );
            invalidateCacheForTenant(tenantId);
        }
    }

    private void ensureTenantNodeExists(String tenantId) {
        if (repository.tenantExists(tenantId)) {
            return;
        }

        Instant now = Instant.now();
        Map<String, Object> tenantProps = new HashMap<>();
        tenantProps.put("id", tenantId);
        tenantProps.put("name", "Master Tenant");
        tenantProps.put("domain", "localhost");
        tenantProps.put("slug", "master");
        tenantProps.put("active", true);
        tenantProps.put("createdAt", now);
        tenantProps.put("updatedAt", now);
        repository.createTenant(tenantProps);
    }

    private Map<String, Object> buildDefaultKeycloakConfigProps(String tenantId) {
        Instant now = Instant.now();
        String realm = keycloakConfig.getMasterRealm();
        String realmBase = keycloakConfig.getServerUrl() + "/realms/" + realm;

        Map<String, Object> props = new HashMap<>();
        props.put("id", UUID.randomUUID().toString());
        props.put("tenantId", tenantId);
        props.put("providerName", "KEYCLOAK");
        props.put("displayName", "Keycloak");
        props.put("protocol", "OIDC");
        props.put("clientId", keycloakConfig.getClient().getClientId());
        if (keycloakConfig.getClient().getClientSecret() != null && !keycloakConfig.getClient().getClientSecret().isBlank()) {
            props.put("clientSecretEncrypted", encryptIfPresent(keycloakConfig.getClient().getClientSecret()));
        }
        props.put("discoveryUrl", realmBase + "/.well-known/openid-configuration");
        props.put("authorizationUrl", realmBase + "/protocol/openid-connect/auth");
        props.put("tokenUrl", keycloakConfig.getTokenEndpoint(realm));
        props.put("userInfoUrl", keycloakConfig.getUserInfoEndpoint(realm));
        props.put("jwksUrl", keycloakConfig.getJwksUri(realm));
        props.put("issuerUrl", realmBase);
        props.put("scopes", List.of("openid", "profile", "email"));
        props.put("idpHint", "keycloak");
        props.put("enabled", true);
        props.put("priority", 1);
        props.put("trustEmail", true);
        props.put("storeToken", false);
        props.put("linkExistingAccounts", true);
        props.put("createdAt", now);
        props.put("updatedAt", now);
        return props;
    }

    /**
     * Get vendor name from provider name.
     */
    private String getVendorFromProviderName(String providerName) {
        return switch (providerName.toUpperCase()) {
            case "KEYCLOAK" -> "Keycloak";
            case "AUTH0" -> "Auth0";
            case "OKTA" -> "Okta";
            case "AZURE_AD", "MICROSOFT" -> "Microsoft";
            case "GOOGLE" -> "Google";
            case "GITHUB" -> "GitHub";
            case "UAE_PASS" -> "UAE Pass";
            default -> providerName;
        };
    }

    /**
     * Encrypt a value if it's not null or blank.
     */
    private String encryptIfPresent(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return encryptionService.encrypt(value);
    }

    /**
     * Decrypt a value if it's not null or blank.
     */
    private String decryptIfPresent(String encryptedValue) {
        if (encryptedValue == null || encryptedValue.isBlank()) {
            return null;
        }
        try {
            return encryptionService.decrypt(encryptedValue);
        } catch (Exception e) {
            log.warn("Failed to decrypt value, returning as-is: {}", e.getMessage());
            return encryptedValue;
        }
    }

    /**
     * Put value into map if not null.
     */
    private void putIfNotNull(Map<String, Object> map, String key, Object value) {
        if (value != null) {
            map.put(key, value);
        }
    }

    /**
     * Invalidate cache entries for a tenant.
     */
    private void invalidateCacheForTenant(String tenantId) {
        try {
            Set<String> keys = redisTemplate.keys(CACHE_PREFIX + tenantId + ":*");
            if (keys != null && !keys.isEmpty()) {
                redisTemplate.delete(keys);
            }
            // Also delete list cache
            redisTemplate.delete(CACHE_LIST_PREFIX + tenantId);
            redisTemplate.delete(CACHE_LIST_PREFIX + tenantId + ":enabled");
        } catch (Exception e) {
            log.warn("Failed to invalidate cache for tenant {}: {}", tenantId, e.getMessage());
        }
    }
}
