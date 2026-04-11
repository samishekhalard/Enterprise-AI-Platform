package com.ems.auth.tenant;

import com.ems.auth.config.AuthGraphPerTenantProperties;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class TenantAwareAuthDatabaseSelectionProviderTest {

    @AfterEach
    void tearDown() {
        TenantRoutingContextHolder.clear();
    }

    @Test
    void shouldReturnUndecidedWhenGraphPerTenantDisabled() {
        AuthGraphPerTenantProperties properties = new AuthGraphPerTenantProperties();
        properties.setEnabled(false);

        TenantAwareAuthDatabaseSelectionProvider provider = new TenantAwareAuthDatabaseSelectionProvider(properties);

        assertThat(provider.getDatabaseSelection().getValue()).isNull();
    }

    @Test
    void shouldFailHardWhenEnabledWithoutTenantContext() {
        AuthGraphPerTenantProperties properties = new AuthGraphPerTenantProperties();
        properties.setEnabled(true);

        TenantAwareAuthDatabaseSelectionProvider provider = new TenantAwareAuthDatabaseSelectionProvider(properties);

        assertThatThrownBy(provider::getDatabaseSelection)
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("Missing tenant routing context");
    }

    @Test
    void shouldSelectTenantAuthDatabaseWhenContextPresent() {
        AuthGraphPerTenantProperties properties = new AuthGraphPerTenantProperties();
        properties.setEnabled(true);

        TenantRoutingContextHolder.setCurrent(new TenantRoutingContext(
            UUID.fromString("11111111-1111-1111-1111-111111111111"),
            "acme",
            "tenant_acme_auth",
            "en",
            "V003"
        ));

        TenantAwareAuthDatabaseSelectionProvider provider = new TenantAwareAuthDatabaseSelectionProvider(properties);

        assertThat(provider.getDatabaseSelection().getValue()).isEqualTo("tenant_acme_auth");
    }
}
