package com.ems.auth.provider;

/**
 * Exception thrown when attempting to register a provider that already exists.
 */
public class ProviderAlreadyExistsException extends RuntimeException {

    private final String tenantId;
    private final String providerName;

    public ProviderAlreadyExistsException(String tenantId, String providerName) {
        super(String.format("Provider '%s' already exists for tenant '%s'", providerName, tenantId));
        this.tenantId = tenantId;
        this.providerName = providerName;
    }

    public String getTenantId() {
        return tenantId;
    }

    public String getProviderName() {
        return providerName;
    }
}
