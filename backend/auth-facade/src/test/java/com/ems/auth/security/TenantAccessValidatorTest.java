package com.ems.auth.security;

import com.ems.common.dto.auth.UserInfo;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for TenantAccessValidator.
 *
 * Validates the SEC-F02 IDOR fix: ensures that admin users can only access
 * resources belonging to their own tenant, unless they hold the SUPER_ADMIN role.
 */
class TenantAccessValidatorTest {

    private TenantAccessValidator validator;

    @BeforeEach
    void setUp() {
        validator = new TenantAccessValidator();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Nested
    @DisplayName("When user tenant matches requested tenant")
    class MatchingTenant {

        @Test
        @DisplayName("Should allow access when tenant IDs match exactly")
        void shouldAllowAccess_whenTenantIdsMatch() {
            // Given
            setAuthentication("tenant-acme", List.of("admin"));

            // When / Then - no exception thrown
            assertDoesNotThrow(() -> validator.validateTenantAccess("tenant-acme"));
        }

        @Test
        @DisplayName("Should allow access for regular admin to own tenant")
        void shouldAllowAccess_forRegularAdmin_toOwnTenant() {
            // Given
            setAuthentication("tenant-globex", List.of("admin", "user"));

            // When / Then
            assertDoesNotThrow(() -> validator.validateTenantAccess("tenant-globex"));
        }
    }

    @Nested
    @DisplayName("When user tenant does NOT match requested tenant (IDOR attempt)")
    class MismatchedTenant {

        @Test
        @DisplayName("Should deny access when admin of Tenant A accesses Tenant B")
        void shouldDenyAccess_whenTenantIdsDontMatch() {
            // Given - admin of tenant-acme
            setAuthentication("tenant-acme", List.of("admin"));

            // When / Then - tries to access tenant-globex
            AccessDeniedException exception = assertThrows(
                    AccessDeniedException.class,
                    () -> validator.validateTenantAccess("tenant-globex")
            );
            assertTrue(exception.getMessage().contains("tenant-globex"));
        }

        @Test
        @DisplayName("Should deny access when user has null tenant ID")
        void shouldDenyAccess_whenUserTenantIsNull() {
            // Given - user with no tenant claim in JWT
            setAuthentication(null, List.of("admin"));

            // When / Then
            assertThrows(
                    AccessDeniedException.class,
                    () -> validator.validateTenantAccess("tenant-acme")
            );
        }
    }

    @Nested
    @DisplayName("When user is SUPER_ADMIN (cross-tenant access)")
    class SuperAdminAccess {

        @Test
        @DisplayName("Should allow SUPER_ADMIN to access any tenant (lowercase)")
        void shouldAllowSuperAdmin_toAccessAnyTenant_lowercase() {
            // Given - super-admin of tenant-master
            setAuthentication("tenant-master", List.of("super-admin"));

            // When / Then - accessing a different tenant
            assertDoesNotThrow(() -> validator.validateTenantAccess("tenant-acme"));
            assertDoesNotThrow(() -> validator.validateTenantAccess("tenant-globex"));
        }

        @Test
        @DisplayName("Should allow SUPER_ADMIN to access any tenant (uppercase)")
        void shouldAllowSuperAdmin_toAccessAnyTenant_uppercase() {
            // Given - SUPER_ADMIN role (alternate casing)
            setAuthentication("tenant-master", List.of("SUPER_ADMIN"));

            // When / Then
            assertDoesNotThrow(() -> validator.validateTenantAccess("tenant-other"));
        }

        @Test
        @DisplayName("Should allow SUPER_ADMIN even when user has no tenant claim")
        void shouldAllowSuperAdmin_evenWithNullTenant() {
            // Given
            setAuthentication(null, List.of("super-admin"));

            // When / Then
            assertDoesNotThrow(() -> validator.validateTenantAccess("tenant-acme"));
        }

        @Test
        @DisplayName("Should allow SUPER_ADMIN with mixed case")
        void shouldAllowSuperAdmin_withMixedCase() {
            // Given
            setAuthentication("tenant-master", List.of("Super-Admin"));

            // When / Then
            assertDoesNotThrow(() -> validator.validateTenantAccess("tenant-other"));
        }
    }

    @Nested
    @DisplayName("When no authentication is present")
    class NoAuthentication {

        @Test
        @DisplayName("Should deny access when SecurityContext is empty")
        void shouldDenyAccess_whenNoAuthentication() {
            // Given - empty security context (no call to setAuthentication)

            // When / Then
            assertThrows(
                    AccessDeniedException.class,
                    () -> validator.validateTenantAccess("tenant-acme")
            );
        }

        @Test
        @DisplayName("Should deny access when principal is not UserInfo")
        void shouldDenyAccess_whenPrincipalIsNotUserInfo() {
            // Given - authentication with a string principal instead of UserInfo
            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                    "just-a-string", null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
            );
            SecurityContextHolder.getContext().setAuthentication(auth);

            // When / Then
            assertThrows(
                    AccessDeniedException.class,
                    () -> validator.validateTenantAccess("tenant-acme")
            );
        }
    }

    @Nested
    @DisplayName("Edge cases")
    class EdgeCases {

        @Test
        @DisplayName("Should deny access when user has empty roles list")
        void shouldDenyAccess_whenRolesEmpty_andTenantMismatch() {
            // Given - user with empty roles trying to access different tenant
            setAuthentication("tenant-acme", List.of());

            // When / Then
            assertThrows(
                    AccessDeniedException.class,
                    () -> validator.validateTenantAccess("tenant-globex")
            );
        }

        @Test
        @DisplayName("Should allow access when user has empty roles but matching tenant")
        void shouldAllowAccess_whenRolesEmpty_butTenantMatches() {
            // Given - even with no roles, tenant match means access is allowed
            // (role check is @PreAuthorize responsibility, not tenant validator's)
            setAuthentication("tenant-acme", List.of());

            // When / Then
            assertDoesNotThrow(() -> validator.validateTenantAccess("tenant-acme"));
        }

        @Test
        @DisplayName("Should deny when user has null roles list and tenant mismatch")
        void shouldDenyAccess_whenRolesNull_andTenantMismatch() {
            // Given
            UserInfo userInfo = new UserInfo("user-1", "user@acme.com", "John", "Doe", "tenant-acme", null);
            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                    userInfo, null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
            );
            SecurityContextHolder.getContext().setAuthentication(auth);

            // When / Then
            assertThrows(
                    AccessDeniedException.class,
                    () -> validator.validateTenantAccess("tenant-globex")
            );
        }
    }

    /**
     * Helper to set up SecurityContext with a UserInfo principal.
     */
    private void setAuthentication(String tenantId, List<String> roles) {
        UserInfo userInfo = new UserInfo(
                "user-123",
                "admin@" + (tenantId != null ? tenantId : "unknown") + ".com",
                "Admin",
                "User",
                tenantId,
                roles
        );

        List<SimpleGrantedAuthority> authorities = roles.stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()))
                .toList();

        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                userInfo, null, authorities
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
    }
}
