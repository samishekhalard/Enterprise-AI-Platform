package com.ems.license.config;

import com.ems.license.repository.ApplicationLicenseRepository;
import com.ems.license.repository.LicenseFileRepository;
import com.ems.license.repository.RevocationEntryRepository;
import com.ems.license.repository.TenantLicenseRepository;
import com.ems.license.repository.TierSeatAllocationRepository;
import com.ems.license.repository.UserLicenseAssignmentRepository;
import com.ems.license.service.FeatureGateService;
import com.ems.license.service.LicenseImportService;
import com.ems.license.service.LicenseSignatureVerifier;
import com.ems.license.service.LicenseStateHolder;
import com.ems.license.service.SeatValidationService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import javax.sql.DataSource;
import java.util.UUID;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration tests for license-service SecurityConfig.
 *
 * Verifies the security filter chain enforces correct authorization rules:
 * - Internal endpoints (/api/v1/internal/**) require SCOPE_internal.service
 * - Admin endpoints (/api/v1/admin/**) require ADMIN or SUPER_ADMIN roles
 * - Seat management endpoints (/api/v1/tenants/{tenantId}/seats/**) require authentication
 * - All other endpoints require JWT authentication
 *
 * These tests use @SpringBootTest with MockMvc to exercise the real SecurityFilterChain,
 * with all infrastructure dependencies (DataSource, Redis, Eureka) mocked out.
 * The jwt() post-processor from spring-security-test provides mock JWT tokens
 * with configurable authorities for each test scenario.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "spring.autoconfigure.exclude=" +
                "org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration," +
                "org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration," +
                "org.springframework.boot.autoconfigure.data.jpa.JpaRepositoriesAutoConfiguration," +
                "org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration," +
                "org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration," +
                "org.springframework.boot.autoconfigure.data.redis.RedisRepositoriesAutoConfiguration," +
                "org.springframework.cloud.netflix.eureka.EurekaClientAutoConfiguration," +
                "org.springframework.cloud.netflix.eureka.EurekaDiscoveryClientConfiguration," +
                "com.ulisesbocchio.jasyptspringboot.JasyptSpringBootAutoConfiguration",
        "eureka.client.enabled=false",
        "spring.jpa.hibernate.ddl-auto=none",
        "jasypt.encryptor.password=test-password"
})
@DisplayName("SecurityConfig Integration Tests (License Service)")
class SecurityConfigIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    // Mock all repository and service beans to avoid requiring real infrastructure
    @MockitoBean
    private LicenseFileRepository licenseFileRepository;

    @MockitoBean
    private ApplicationLicenseRepository applicationLicenseRepository;

    @MockitoBean
    private TenantLicenseRepository tenantLicenseRepository;

    @MockitoBean
    private TierSeatAllocationRepository tierSeatAllocationRepository;

    @MockitoBean
    private UserLicenseAssignmentRepository userLicenseAssignmentRepository;

    @MockitoBean
    private RevocationEntryRepository revocationEntryRepository;

    @MockitoBean
    private FeatureGateService featureGateService;

    @MockitoBean
    private LicenseImportService licenseImportService;

    @MockitoBean
    private SeatValidationService seatValidationService;

    @MockitoBean
    private LicenseSignatureVerifier licenseSignatureVerifier;

    @MockitoBean
    private LicenseStateHolder licenseStateHolder;

    @MockitoBean
    private StringRedisTemplate stringRedisTemplate;

    @MockitoBean
    private DataSource dataSource;

    @Nested
    @DisplayName("Internal Endpoint Authorization")
    class InternalEndpointAuthorization {

        @Test
        @DisplayName("GET /api/v1/internal/** requires SCOPE_internal.service authority")
        void internalEndpointRequiresServiceScope() throws Exception {
            // Arrange & Act & Assert
            // SecurityConfig line 43: .requestMatchers("/api/v1/internal/**").hasAuthority("SCOPE_internal.service")
            // A regular authenticated user without the internal.service scope should be denied.
            mockMvc.perform(get("/api/v1/internal/features/check")
                            .header("X-Tenant-ID", "tenant-1")
                            .param("featureKey", "basic_workflows")
                            .with(jwt().jwt(j -> j
                                    .subject("regular-user")
                                    .claim("scope", "openid profile"))))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("GET /api/v1/internal/** succeeds with SCOPE_internal.service")
        void internalEndpointSucceedsWithServiceScope() throws Exception {
            // Arrange & Act & Assert
            // A service-to-service call with the internal.service scope should be allowed.
            mockMvc.perform(get("/api/v1/internal/features/check")
                            .header("X-Tenant-ID", "tenant-1")
                            .param("featureKey", "basic_workflows")
                            .with(jwt().jwt(j -> j
                                    .subject("auth-facade-service")
                                    .claim("scope", "openid internal.service"))))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("GET /api/v1/internal/** without auth returns 401")
        void internalEndpointWithoutAuthReturns401() throws Exception {
            // Arrange & Act & Assert
            // No JWT token at all should produce 401.
            mockMvc.perform(get("/api/v1/internal/features/check")
                            .header("X-Tenant-ID", "tenant-1")
                            .param("featureKey", "basic_workflows"))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("Admin Endpoint Authorization")
    class AdminEndpointAuthorization {

        @Test
        @DisplayName("GET /api/v1/admin/** requires ADMIN or SUPER_ADMIN role")
        void adminEndpointRequiresAdminRole() throws Exception {
            // Arrange & Act & Assert
            // SecurityConfig line 44: .requestMatchers("/api/v1/admin/**").hasAnyRole("ADMIN", "SUPER_ADMIN")
            // A user with only a regular USER role should be denied.
            mockMvc.perform(get("/api/v1/admin/licenses/status")
                            .with(jwt().jwt(j -> j
                                    .subject("regular-user")
                                    .claim("realm_access", java.util.Map.of(
                                            "roles", java.util.List.of("USER"))))))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("GET /api/v1/admin/** without auth returns 401")
        void adminEndpointWithoutAuthReturns401() throws Exception {
            // Arrange & Act & Assert
            mockMvc.perform(get("/api/v1/admin/licenses/status"))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("Tenant Seat Endpoint Authorization")
    class TenantSeatEndpointAuthorization {

        @Test
        @DisplayName("GET /api/v1/tenants/{tenantId}/seats/** requires authentication")
        void tenantSeatEndpointRequiresAuth() throws Exception {
            // Arrange & Act & Assert
            // SecurityConfig lines 45-46 require TENANT_ADMIN, ADMIN, or SUPER_ADMIN roles.
            // Without any JWT, should return 401.
            String tenantId = "tenant-" + UUID.randomUUID();

            mockMvc.perform(get("/api/v1/tenants/{tenantId}/seats", tenantId))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("GET /api/v1/tenants/{tenantId}/seats/** denied for regular user")
        void tenantSeatEndpointDeniedForRegularUser() throws Exception {
            // Arrange & Act & Assert
            // SecurityConfig lines 45-46: hasAnyRole("TENANT_ADMIN", "ADMIN", "SUPER_ADMIN")
            // A user with only USER role should be forbidden.
            String tenantId = "tenant-1";

            mockMvc.perform(get("/api/v1/tenants/{tenantId}/seats", tenantId)
                            .with(jwt().jwt(j -> j
                                    .subject("regular-user")
                                    .claim("realm_access", java.util.Map.of(
                                            "roles", java.util.List.of("USER"))))))
                    .andExpect(status().isForbidden());
        }
    }
}
