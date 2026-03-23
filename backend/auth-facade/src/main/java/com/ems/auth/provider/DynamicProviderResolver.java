package com.ems.auth.provider;

import com.ems.auth.dto.ProviderConfigRequest;

import java.util.List;

/**
 * Dynamic Provider Resolver Interface.
 *
 * This interface abstracts the resolution and management of identity providers
 * per tenant. It supports dynamic provider configuration stored in Neo4j
 * while maintaining backward compatibility with static configuration.
 *
 * The resolver is responsible for:
 * - Resolving provider configurations for a tenant
 * - CRUD operations on provider configurations
 * - Caching and cache invalidation
 *
 * Implementations:
 * - InMemoryProviderResolver: In-memory implementation for testing and fallback
 * - Neo4jProviderResolver: Production implementation using Neo4j graph database
 */
public interface DynamicProviderResolver {

    /**
     * Resolve a specific provider configuration for a tenant.
     *
     * @param tenantId The tenant identifier
     * @param providerName The provider name (e.g., "KEYCLOAK", "google", "saml-primary")
     * @return The provider configuration
     * @throws ProviderNotFoundException if the provider is not found
     */
    ProviderConfig resolveProvider(String tenantId, String providerName);

    /**
     * List all providers configured for a tenant.
     *
     * @param tenantId The tenant identifier
     * @return List of provider configurations (may be empty)
     */
    List<ProviderConfig> listProviders(String tenantId);

    /**
     * List only enabled providers for a tenant.
     *
     * @param tenantId The tenant identifier
     * @return List of enabled provider configurations
     */
    default List<ProviderConfig> listEnabledProviders(String tenantId) {
        return listProviders(tenantId).stream()
            .filter(ProviderConfig::enabled)
            .toList();
    }

    /**
     * Register a new identity provider for a tenant.
     *
     * @param tenantId The tenant identifier
     * @param request The provider configuration request
     * @throws ProviderAlreadyExistsException if a provider with the same name exists
     */
    void registerProvider(String tenantId, ProviderConfigRequest request);

    /**
     * Update an existing identity provider.
     *
     * @param tenantId The tenant identifier
     * @param providerId The provider identifier (can be name or UUID)
     * @param request The updated provider configuration
     * @throws ProviderNotFoundException if the provider is not found
     */
    void updateProvider(String tenantId, String providerId, ProviderConfigRequest request);

    /**
     * Delete an identity provider.
     *
     * @param tenantId The tenant identifier
     * @param providerId The provider identifier (can be name or UUID)
     * @throws ProviderNotFoundException if the provider is not found
     */
    void deleteProvider(String tenantId, String providerId);

    /**
     * Invalidate the provider cache for a tenant.
     * Call this after making direct database changes.
     *
     * @param tenantId The tenant identifier
     */
    void invalidateCache(String tenantId);

    /**
     * Check if a provider exists for a tenant.
     *
     * @param tenantId The tenant identifier
     * @param providerName The provider name
     * @return true if the provider exists
     */
    default boolean providerExists(String tenantId, String providerName) {
        try {
            resolveProvider(tenantId, providerName);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Get the default provider for a tenant.
     * Returns the enabled provider with the highest priority (lowest priority number).
     *
     * @param tenantId The tenant identifier
     * @return The default provider configuration
     * @throws ProviderNotFoundException if no enabled providers exist
     */
    default ProviderConfig getDefaultProvider(String tenantId) {
        return listEnabledProviders(tenantId).stream()
            .min((a, b) -> Integer.compare(a.priority(), b.priority()))
            .orElseThrow(() -> new ProviderNotFoundException(
                "No enabled providers found for tenant: " + tenantId));
    }
}
