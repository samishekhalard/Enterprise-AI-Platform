package com.ems.auth.provider;

/**
 * Exception thrown when a requested identity provider is not found.
 */
public class ProviderNotFoundException extends RuntimeException {

    private final String tenantId;
    private final String providerName;

    public ProviderNotFoundException(String message) {
        super(message);
        this.tenantId = null;
        this.providerName = null;
    }

    public ProviderNotFoundException(String tenantId, String providerName) {
        super(String.format("Provider '%s' not found for tenant '%s'", providerName, tenantId));
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
