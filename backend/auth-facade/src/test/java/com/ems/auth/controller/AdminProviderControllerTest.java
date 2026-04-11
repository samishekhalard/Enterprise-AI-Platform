package com.ems.auth.controller;

import com.ems.auth.dto.ProviderConfigRequest;
import com.ems.auth.dto.ProviderConfigResponse;
import com.ems.auth.dto.ProviderPatchRequest;
import com.ems.auth.provider.DynamicProviderResolver;
import com.ems.auth.provider.ProviderConfig;
import com.ems.auth.provider.ProviderNotFoundException;
import com.ems.auth.security.TenantAccessValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.Instant;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Unit tests for AdminProviderController.
 *
 * Tests: UT-BE-001 through UT-BE-010
 * Source: AdminProviderController.java
 *
 * Dependencies:
 * - DynamicProviderResolver (interface -- mocked via Mockito)
 * - TenantAccessValidator (concrete -- bypassed with no-op subclass for Java 25 compat)
 * - ProviderConnectionTester (concrete -- passed as null; not exercised in these tests)
 *
 * NOTE: Java 25 prevents Mockito from mocking concrete classes. Additionally,
 * TenantAccessValidator references UserInfo from ems-common, which has class-file
 * resolution issues on Java 25. A no-op test subclass is used instead.
 * The real TenantAccessValidator is tested in TenantAccessValidatorTest (separate).
 */
@ExtendWith(MockitoExtension.class)
class AdminProviderControllerTest {

    @Mock
    private DynamicProviderResolver dynamicProviderResolver;

    private AdminProviderController controller;

    // =========================================================================
    // Test Data
    // =========================================================================

    private static final String TENANT_ID = "tenant-acme";
    private static final String PROVIDER_ID = "keycloak-primary";
    private static final Instant NOW = Instant.parse("2026-01-15T10:30:00Z");

    /**
     * No-op TenantAccessValidator for unit tests.
     * The real validator depends on ems-common UserInfo which has Java 25 issues.
     * TenantAccessValidator behavior is verified in its own test class.
     */
    private static class NoOpTenantAccessValidator extends TenantAccessValidator {
        @Override
        public void validateTenantAccess(String requestedTenantId) {
            // No-op: skip tenant access validation in controller unit tests.
            // Tenant isolation is tested separately in TenantAccessValidatorTest
            // and SecurityFilterChain integration tests.
        }
    }

    @BeforeEach
    void setUp() {
        // Construct controller manually:
        // - DynamicProviderResolver: mocked (interface, works with Mockito)
        // - ProviderConnectionTester: null (not exercised in these 10 tests)
        // - TenantAccessValidator: no-op subclass (Java 25 compat)
        controller = new AdminProviderController(
                dynamicProviderResolver, null, new NoOpTenantAccessValidator());
    }

    // =========================================================================
    // Test Data Builders
    // =========================================================================

    private ProviderConfig buildKeycloakConfig() {
        return ProviderConfig.builder()
                .id("uuid-001").tenantId(TENANT_ID).providerName("KEYCLOAK")
                .displayName("Company SSO").protocol("OIDC")
                .clientId("ems-auth-client").clientSecret("abcdefgh")
                .discoveryUrl("https://keycloak.example.com/realms/acme/.well-known/openid-configuration")
                .scopes(List.of("openid", "profile", "email")).idpHint("keycloak")
                .enabled(true).priority(1).trustEmail(true).storeToken(false).linkExistingAccounts(true)
                .createdAt(NOW).updatedAt(NOW).build();
    }

    private ProviderConfig buildAuth0Config() {
        return ProviderConfig.builder()
                .id("uuid-002").tenantId(TENANT_ID).providerName("AUTH0")
                .displayName("Auth0 SSO").protocol("OIDC")
                .clientId("auth0-client").clientSecret("xyz12345")
                .discoveryUrl("https://auth0.example.com/.well-known/openid-configuration")
                .scopes(List.of("openid", "profile")).enabled(true).priority(2)
                .trustEmail(true).storeToken(false).linkExistingAccounts(false)
                .createdAt(NOW).updatedAt(NOW).build();
    }

    private ProviderConfigRequest buildValidRequest() {
        return new ProviderConfigRequest(
                "KEYCLOAK", "Company SSO", "OIDC",
                "ems-auth-client", "super-secret",
                "https://kc.example.com/.well-known/openid-configuration",
                null, null, null, null, null, null, null,
                "keycloak", List.of("openid", "profile", "email"),
                null, null, null, null, null,
                true, 1, true, false, true);
    }

    // =========================================================================
    // UT-BE-001 / UT-BE-002: List Providers
    // =========================================================================
    @Nested
    @DisplayName("List Providers Endpoint")
    class ListProviders {

        @Test
        @DisplayName("UT-BE-001: listProviders - when tenant has providers - should return list with 200 OK")
        void listProviders_whenTenantHasProviders_shouldReturnList() {
            // Arrange
            when(dynamicProviderResolver.listProviders(TENANT_ID))
                    .thenReturn(List.of(buildKeycloakConfig(), buildAuth0Config()));

            // Act
            ResponseEntity<List<ProviderConfigResponse>> response = controller.listProviders(TENANT_ID);

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).isNotNull().hasSize(2);
            assertThat(response.getBody().get(0).providerName()).isEqualTo("KEYCLOAK");
            assertThat(response.getBody().get(1).providerName()).isEqualTo("AUTH0");
            verify(dynamicProviderResolver).listProviders(TENANT_ID);
        }

        @Test
        @DisplayName("UT-BE-002: listProviders - when no providers - should return empty list with 200 OK")
        void listProviders_whenTenantHasNoProviders_shouldReturnEmptyList() {
            // Arrange
            when(dynamicProviderResolver.listProviders(TENANT_ID)).thenReturn(Collections.emptyList());

            // Act
            ResponseEntity<List<ProviderConfigResponse>> response = controller.listProviders(TENANT_ID);

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).isNotNull().isEmpty();
            verify(dynamicProviderResolver).listProviders(TENANT_ID);
        }
    }

    // =========================================================================
    // UT-BE-003 / UT-BE-004: Get Provider
    // =========================================================================
    @Nested
    @DisplayName("Get Provider Endpoint")
    class GetProvider {

        @Test
        @DisplayName("UT-BE-003: getProvider - when exists - should return config with 200 OK")
        void getProvider_whenProviderExists_shouldReturnConfig() {
            // Arrange
            when(dynamicProviderResolver.resolveProvider(TENANT_ID, PROVIDER_ID))
                    .thenReturn(buildKeycloakConfig());

            // Act
            ResponseEntity<ProviderConfigResponse> response = controller.getProvider(TENANT_ID, PROVIDER_ID);

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().providerName()).isEqualTo("KEYCLOAK");
            assertThat(response.getBody().displayName()).isEqualTo("Company SSO");
            assertThat(response.getBody().protocol()).isEqualTo("OIDC");
            assertThat(response.getBody().clientId()).isEqualTo("ems-auth-client");
            assertThat(response.getBody().enabled()).isTrue();
            verify(dynamicProviderResolver).resolveProvider(TENANT_ID, PROVIDER_ID);
        }

        @Test
        @DisplayName("UT-BE-004: getProvider - when not found - should propagate ProviderNotFoundException")
        void getProvider_whenProviderNotFound_shouldThrow() {
            // Arrange
            when(dynamicProviderResolver.resolveProvider(TENANT_ID, "nonexistent"))
                    .thenThrow(new ProviderNotFoundException(TENANT_ID, "nonexistent"));

            // Act & Assert
            assertThatThrownBy(() -> controller.getProvider(TENANT_ID, "nonexistent"))
                    .isInstanceOf(ProviderNotFoundException.class)
                    .hasMessageContaining("nonexistent")
                    .hasMessageContaining(TENANT_ID);
        }
    }

    // =========================================================================
    // UT-BE-005: Register Provider
    // =========================================================================
    @Nested
    @DisplayName("Register Provider Endpoint")
    class RegisterProvider {

        @Test
        @DisplayName("UT-BE-005: registerProvider - valid request - should return 201 CREATED")
        void registerProvider_withValidRequest_shouldReturn201() {
            // Arrange
            ProviderConfigRequest request = buildValidRequest();
            doNothing().when(dynamicProviderResolver).registerProvider(eq(TENANT_ID), any());
            when(dynamicProviderResolver.resolveProvider(TENANT_ID, request.providerName()))
                    .thenReturn(buildKeycloakConfig());

            // Act
            ResponseEntity<ProviderConfigResponse> response = controller.registerProvider(TENANT_ID, request);

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().providerName()).isEqualTo("KEYCLOAK");
            verify(dynamicProviderResolver).registerProvider(eq(TENANT_ID), any());
        }
    }

    // =========================================================================
    // UT-BE-006: Update Provider
    // =========================================================================
    @Nested
    @DisplayName("Update Provider Endpoint")
    class UpdateProvider {

        @Test
        @DisplayName("UT-BE-006: updateProvider - valid request - should return 200 OK")
        void updateProvider_withValidRequest_shouldReturn200() {
            // Arrange
            doNothing().when(dynamicProviderResolver).updateProvider(eq(TENANT_ID), eq(PROVIDER_ID), any());
            when(dynamicProviderResolver.resolveProvider(TENANT_ID, PROVIDER_ID))
                    .thenReturn(buildKeycloakConfig());

            // Act
            ResponseEntity<ProviderConfigResponse> response =
                    controller.updateProvider(TENANT_ID, PROVIDER_ID, buildValidRequest());

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).isNotNull();
            verify(dynamicProviderResolver).updateProvider(eq(TENANT_ID), eq(PROVIDER_ID), any());
        }
    }

    // =========================================================================
    // UT-BE-007: Delete Provider
    // =========================================================================
    @Nested
    @DisplayName("Delete Provider Endpoint")
    class DeleteProvider {

        @Test
        @DisplayName("UT-BE-007: deleteProvider - when exists - should return 204 NO_CONTENT")
        void deleteProvider_whenExists_shouldReturn204() {
            // Arrange
            doNothing().when(dynamicProviderResolver).deleteProvider(TENANT_ID, PROVIDER_ID);

            // Act
            ResponseEntity<Void> response = controller.deleteProvider(TENANT_ID, PROVIDER_ID);

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
            assertThat(response.getBody()).isNull();
            verify(dynamicProviderResolver).deleteProvider(TENANT_ID, PROVIDER_ID);
        }
    }

    // =========================================================================
    // UT-BE-008 / UT-BE-009: Patch Provider
    // =========================================================================
    @Nested
    @DisplayName("Patch Provider Endpoint")
    class PatchProvider {

        @Test
        @DisplayName("UT-BE-008: patchProvider - enabled=false - should disable and return 200")
        void patchProvider_withEnabledFalse_shouldDisable() {
            // Arrange
            ProviderConfig currentConfig = buildKeycloakConfig(); // enabled=true
            ProviderConfig updatedConfig = ProviderConfig.builder()
                    .id("uuid-001").tenantId(TENANT_ID).providerName("KEYCLOAK")
                    .displayName("Company SSO").protocol("OIDC")
                    .clientId("ems-auth-client").clientSecret("abcdefgh")
                    .discoveryUrl("https://keycloak.example.com/realms/acme/.well-known/openid-configuration")
                    .scopes(List.of("openid", "profile", "email")).idpHint("keycloak")
                    .enabled(false).priority(1).trustEmail(true).storeToken(false).linkExistingAccounts(true)
                    .createdAt(NOW).updatedAt(NOW).build();

            when(dynamicProviderResolver.resolveProvider(TENANT_ID, PROVIDER_ID))
                    .thenReturn(currentConfig).thenReturn(updatedConfig);
            doNothing().when(dynamicProviderResolver).updateProvider(eq(TENANT_ID), eq(PROVIDER_ID), any());

            // Act
            ResponseEntity<ProviderConfigResponse> response =
                    controller.patchProvider(TENANT_ID, PROVIDER_ID, new ProviderPatchRequest(false, null, null));

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().enabled()).isFalse();
            verify(dynamicProviderResolver, times(2)).resolveProvider(TENANT_ID, PROVIDER_ID);
            verify(dynamicProviderResolver).updateProvider(eq(TENANT_ID), eq(PROVIDER_ID), any());
        }

        @Test
        @DisplayName("UT-BE-009: patchProvider - no updates - should return 400 BAD_REQUEST")
        void patchProvider_withNoUpdates_shouldReturn400() {
            // Arrange
            ProviderPatchRequest emptyPatch = new ProviderPatchRequest(null, null, null);

            // Act
            ResponseEntity<ProviderConfigResponse> response =
                    controller.patchProvider(TENANT_ID, PROVIDER_ID, emptyPatch);

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
            assertThat(response.getBody()).isNull();
            verify(dynamicProviderResolver, never()).resolveProvider(any(), any());
            verify(dynamicProviderResolver, never()).updateProvider(any(), any(), any());
        }
    }

    // =========================================================================
    // UT-BE-010: Secret Masking
    // =========================================================================
    @Nested
    @DisplayName("Secret Masking")
    class SecretMasking {

        @Test
        @DisplayName("UT-BE-010: toResponse - masks client secret (first 2 + **** + last 2)")
        void toResponse_shouldMaskClientSecret() {
            // Arrange -- clientSecret="abcdefgh" (8 chars) -> "ab****gh"
            when(dynamicProviderResolver.resolveProvider(TENANT_ID, PROVIDER_ID))
                    .thenReturn(buildKeycloakConfig());

            // Act
            ResponseEntity<ProviderConfigResponse> response = controller.getProvider(TENANT_ID, PROVIDER_ID);

            // Assert
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().clientSecret()).isEqualTo("ab****gh");
            assertThat(response.getBody().clientId()).isEqualTo("ems-auth-client");
        }

        @Test
        @DisplayName("toResponse - masks short secrets (<=4 chars) as '****'")
        void toResponse_shouldMaskShortSecrets() {
            // Arrange
            ProviderConfig config = ProviderConfig.builder()
                    .id("uuid-short").tenantId(TENANT_ID).providerName("TEST").protocol("OIDC")
                    .clientId("client").clientSecret("ab").enabled(true).priority(1)
                    .createdAt(NOW).updatedAt(NOW).build();
            when(dynamicProviderResolver.resolveProvider(TENANT_ID, "short-provider")).thenReturn(config);

            // Act
            ResponseEntity<ProviderConfigResponse> response = controller.getProvider(TENANT_ID, "short-provider");

            // Assert
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().clientSecret()).isEqualTo("****");
        }

        @Test
        @DisplayName("toResponse - returns null for null or empty secrets")
        void toResponse_shouldReturnNullForNullOrEmptySecrets() {
            // Arrange
            ProviderConfig config = ProviderConfig.builder()
                    .id("uuid-null").tenantId(TENANT_ID).providerName("TEST").protocol("OIDC")
                    .clientId("client").clientSecret(null).enabled(true).priority(1)
                    .createdAt(NOW).updatedAt(NOW).build();
            when(dynamicProviderResolver.resolveProvider(TENANT_ID, "null-provider")).thenReturn(config);

            // Act
            ResponseEntity<ProviderConfigResponse> response = controller.getProvider(TENANT_ID, "null-provider");

            // Assert
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().clientSecret()).isNull();
        }
    }
}
