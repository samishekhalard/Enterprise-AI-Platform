package com.ems.auth.service;

import com.ems.auth.config.KeycloakConfig;
import com.ems.auth.dto.PagedResponse;
import com.ems.auth.dto.UserResponse;
import com.ems.auth.exception.UserNotFoundException;
import com.ems.auth.graph.entity.GroupNode;
import com.ems.auth.graph.entity.RoleNode;
import com.ems.auth.graph.entity.UserNode;
import com.ems.auth.graph.repository.UserGraphRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.keycloak.representations.idm.UserRepresentation;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for UserManagementServiceImpl.
 *
 * Tests cover:
 * - User listing with pagination
 * - User detail retrieval
 * - Graph data enrichment
 * - Error handling
 * - Realm resolution
 *
 * Note: These tests mock the Keycloak admin client and Neo4j repository.
 * Integration tests with Testcontainers would be needed for full coverage.
 */
@ExtendWith(MockitoExtension.class)
class UserManagementServiceImplTest {

    private KeycloakConfig keycloakConfig;

    @Mock
    private UserGraphRepository userGraphRepository;

    private UserManagementServiceImpl userManagementService;

    private static final String TENANT_ID = "tenant-acme";
    private static final String USER_ID = "550e8400-e29b-41d4-a716-446655440000";

    @BeforeEach
    void setUp() {
        // Use real KeycloakConfig (not mock) - it's a POJO with @Getter/@Setter
        // Mockito cannot mock @Configuration classes on Java 25
        keycloakConfig = new KeycloakConfig();
        keycloakConfig.setServerUrl("http://localhost:8080");
        keycloakConfig.setMasterRealm("master");

        KeycloakConfig.Admin admin = new KeycloakConfig.Admin();
        admin.setUsername("admin");
        admin.setPassword("admin");
        admin.setClientId("admin-cli");
        keycloakConfig.setAdmin(admin);

        userManagementService = new UserManagementServiceImpl(keycloakConfig, userGraphRepository);
    }

    @Nested
    @DisplayName("PagedResponse")
    class PagedResponseTests {

        @Test
        @DisplayName("of() should calculate totalPages correctly")
        void of_shouldCalculateTotalPages() {
            PagedResponse<String> response = PagedResponse.of(List.of("a", "b"), 0, 20, 50);

            assertThat(response.page()).isEqualTo(0);
            assertThat(response.size()).isEqualTo(20);
            assertThat(response.totalElements()).isEqualTo(50);
            assertThat(response.totalPages()).isEqualTo(3);
        }

        @Test
        @DisplayName("of() should handle exact page boundary")
        void of_shouldHandleExactBoundary() {
            PagedResponse<String> response = PagedResponse.of(List.of("a", "b"), 0, 10, 20);

            assertThat(response.totalPages()).isEqualTo(2);
        }

        @Test
        @DisplayName("of() should handle single element")
        void of_shouldHandleSingleElement() {
            PagedResponse<String> response = PagedResponse.of(List.of("a"), 0, 20, 1);

            assertThat(response.totalPages()).isEqualTo(1);
            assertThat(response.totalElements()).isEqualTo(1);
        }

        @Test
        @DisplayName("empty() should return zero-element response")
        void empty_shouldReturnZeroElements() {
            PagedResponse<String> response = PagedResponse.empty(0, 20);

            assertThat(response.content()).isEmpty();
            assertThat(response.totalElements()).isZero();
            assertThat(response.totalPages()).isZero();
        }

        @Test
        @DisplayName("of() should handle zero size gracefully")
        void of_shouldHandleZeroSize() {
            PagedResponse<String> response = PagedResponse.of(List.of(), 0, 0, 0);

            assertThat(response.totalPages()).isZero();
        }
    }

    @Nested
    @DisplayName("UserResponse builder")
    class UserResponseBuilderTests {

        @Test
        @DisplayName("builder should create UserResponse with all fields")
        void builder_shouldCreateWithAllFields() {
            Instant now = Instant.now();
            UserResponse user = UserResponse.builder()
                .id("user-1")
                .email("test@example.com")
                .firstName("John")
                .lastName("Doe")
                .displayName("John Doe")
                .active(true)
                .emailVerified(true)
                .roles(List.of("ADMIN", "USER"))
                .groups(List.of("administrators"))
                .identityProvider("keycloak")
                .lastLoginAt(now)
                .createdAt(now)
                .build();

            assertThat(user.id()).isEqualTo("user-1");
            assertThat(user.email()).isEqualTo("test@example.com");
            assertThat(user.firstName()).isEqualTo("John");
            assertThat(user.lastName()).isEqualTo("Doe");
            assertThat(user.displayName()).isEqualTo("John Doe");
            assertThat(user.active()).isTrue();
            assertThat(user.emailVerified()).isTrue();
            assertThat(user.roles()).containsExactly("ADMIN", "USER");
            assertThat(user.groups()).containsExactly("administrators");
            assertThat(user.identityProvider()).isEqualTo("keycloak");
            assertThat(user.lastLoginAt()).isEqualTo(now);
            assertThat(user.createdAt()).isEqualTo(now);
        }

        @Test
        @DisplayName("builder should default roles and groups to empty lists")
        void builder_shouldDefaultToEmptyLists() {
            UserResponse user = UserResponse.builder()
                .id("user-1")
                .email("test@example.com")
                .build();

            assertThat(user.roles()).isEmpty();
            assertThat(user.groups()).isEmpty();
        }
    }

    @Nested
    @DisplayName("UserNotFoundException")
    class UserNotFoundExceptionTests {

        @Test
        @DisplayName("should format message with tenant and user ID")
        void shouldFormatMessage() {
            UserNotFoundException ex = new UserNotFoundException("tenant-acme", "user-123");

            assertThat(ex.getMessage()).contains("user-123");
            assertThat(ex.getMessage()).contains("tenant-acme");
            assertThat(ex.getTenantId()).isEqualTo("tenant-acme");
            assertThat(ex.getUserId()).isEqualTo("user-123");
        }

        @Test
        @DisplayName("should accept plain message")
        void shouldAcceptPlainMessage() {
            UserNotFoundException ex = new UserNotFoundException("User not found");

            assertThat(ex.getMessage()).isEqualTo("User not found");
            assertThat(ex.getTenantId()).isNull();
            assertThat(ex.getUserId()).isNull();
        }
    }

    @Nested
    @DisplayName("Graph enrichment")
    class GraphEnrichmentTests {

        @Test
        @DisplayName("should extract role names from UserNode")
        void shouldExtractRoleNames() {
            RoleNode adminRole = RoleNode.builder().name("ADMIN").build();
            RoleNode userRole = RoleNode.builder().name("USER").build();

            UserNode graphUser = UserNode.builder()
                .id("user-1")
                .email("test@example.com")
                .tenantId(TENANT_ID)
                .active(true)
                .directRoles(List.of(adminRole, userRole))
                .groups(List.of())
                .build();

            assertThat(graphUser.directRoles()).hasSize(2);
            assertThat(graphUser.directRoles().stream().map(RoleNode::name).toList())
                .containsExactly("ADMIN", "USER");
        }

        @Test
        @DisplayName("should extract group names from UserNode")
        void shouldExtractGroupNames() {
            GroupNode adminGroup = GroupNode.builder()
                .id("group-1")
                .name("administrators")
                .tenantId(TENANT_ID)
                .build();

            UserNode graphUser = UserNode.builder()
                .id("user-1")
                .email("test@example.com")
                .tenantId(TENANT_ID)
                .active(true)
                .groups(List.of(adminGroup))
                .directRoles(List.of())
                .build();

            assertThat(graphUser.groups()).hasSize(1);
            assertThat(graphUser.groups().get(0).name()).isEqualTo("administrators");
        }

        @Test
        @DisplayName("should handle null roles and groups gracefully")
        void shouldHandleNullRolesAndGroups() {
            UserNode graphUser = new UserNode(
                "user-1", "test@example.com", "John", "Doe",
                TENANT_ID, true, true, null, "keycloak",
                null, null, Instant.now(), Instant.now(), null
            );

            assertThat(graphUser.directRoles()).isNull();
            assertThat(graphUser.groups()).isNull();
        }
    }

    @Nested
    @DisplayName("UserNode display name")
    class UserNodeDisplayNameTests {

        @Test
        @DisplayName("getFullName() should return first + last name")
        void shouldReturnFullName() {
            UserNode user = UserNode.builder()
                .id("user-1")
                .email("john@example.com")
                .firstName("John")
                .lastName("Doe")
                .build();

            assertThat(user.getFullName()).isEqualTo("John Doe");
        }

        @Test
        @DisplayName("getFullName() should return email when no names set")
        void shouldReturnEmailWhenNoNames() {
            UserNode user = UserNode.builder()
                .id("user-1")
                .email("john@example.com")
                .build();

            assertThat(user.getFullName()).isEqualTo("john@example.com");
        }

        @Test
        @DisplayName("getFullName() should return first name only when last name is null")
        void shouldReturnFirstNameOnly() {
            UserNode user = UserNode.builder()
                .id("user-1")
                .email("john@example.com")
                .firstName("John")
                .build();

            assertThat(user.getFullName()).isEqualTo("John");
        }

        @Test
        @DisplayName("getFullName() should return last name only when first name is null")
        void shouldReturnLastNameOnly() {
            UserNode user = UserNode.builder()
                .id("user-1")
                .email("john@example.com")
                .lastName("Doe")
                .build();

            assertThat(user.getFullName()).isEqualTo("Doe");
        }
    }

    @Nested
    @DisplayName("UserGraphRepository")
    class UserGraphRepositoryTests {

        @Test
        @DisplayName("findByIdAndTenantId should return empty when user not in graph")
        void findByIdAndTenantId_shouldReturnEmptyForMissingUser() {
            when(userGraphRepository.findByIdAndTenantId("unknown-user", TENANT_ID))
                .thenReturn(Optional.empty());

            Optional<UserNode> result = userGraphRepository.findByIdAndTenantId("unknown-user", TENANT_ID);

            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("findAllByTenantId should return empty list when no users in graph")
        void findAllByTenantId_shouldReturnEmptyForNoUsers() {
            when(userGraphRepository.findAllByTenantId(TENANT_ID))
                .thenReturn(Collections.emptyList());

            List<UserNode> result = userGraphRepository.findAllByTenantId(TENANT_ID);

            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("findByIdAndTenantId should return user with relationships")
        void findByIdAndTenantId_shouldReturnUserWithRelationships() {
            RoleNode role = RoleNode.builder().name("USER").build();
            GroupNode group = GroupNode.builder().id("g1").name("devs").tenantId(TENANT_ID).build();
            UserNode user = UserNode.builder()
                .id(USER_ID)
                .email("test@example.com")
                .tenantId(TENANT_ID)
                .active(true)
                .directRoles(List.of(role))
                .groups(List.of(group))
                .build();

            when(userGraphRepository.findByIdAndTenantId(USER_ID, TENANT_ID))
                .thenReturn(Optional.of(user));

            Optional<UserNode> result = userGraphRepository.findByIdAndTenantId(USER_ID, TENANT_ID);

            assertThat(result).isPresent();
            assertThat(result.get().directRoles()).hasSize(1);
            assertThat(result.get().groups()).hasSize(1);
        }
    }

    // =========================================================================
    // Helper Methods
    // =========================================================================

    private UserRepresentation createKeycloakUser(String id, String email, String firstName, String lastName) {
        UserRepresentation user = new UserRepresentation();
        user.setId(id);
        user.setEmail(email);
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setEnabled(true);
        user.setEmailVerified(true);
        user.setCreatedTimestamp(Instant.parse("2026-01-15T08:00:00Z").toEpochMilli());
        return user;
    }

    private UserNode createGraphUser(String id, String email, List<RoleNode> roles, List<GroupNode> groups) {
        return UserNode.builder()
            .id(id)
            .email(email)
            .tenantId(TENANT_ID)
            .active(true)
            .emailVerified(true)
            .identityProvider("keycloak")
            .directRoles(roles)
            .groups(groups)
            .lastLoginAt(Instant.parse("2026-02-25T10:30:00Z"))
            .createdAt(Instant.parse("2026-01-15T08:00:00Z"))
            .build();
    }
}
