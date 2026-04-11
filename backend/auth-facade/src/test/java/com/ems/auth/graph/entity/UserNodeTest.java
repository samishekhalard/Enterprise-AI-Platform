package com.ems.auth.graph.entity;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for UserNode record.
 *
 * Tests cover:
 * - getFullName() display name logic with various name combinations
 * - Graph relationship structure (roles, groups)
 * - Null handling for optional relationships
 *
 * No Mockito needed -- pure record tests.
 */
class UserNodeTest {

    private static final String TENANT_ID = "tenant-acme";

    @Nested
    @DisplayName("getFullName()")
    class DisplayNameTests {

        @Test
        @DisplayName("should return first + last name when both present")
        void shouldReturnFullName() {
            // Arrange
            UserNode user = UserNode.builder()
                .id("user-1")
                .email("john@example.com")
                .firstName("John")
                .lastName("Doe")
                .build();

            // Act
            String fullName = user.getFullName();

            // Assert
            assertThat(fullName).isEqualTo("John Doe");
        }

        @Test
        @DisplayName("should return email when no names set")
        void shouldReturnEmailWhenNoNames() {
            // Arrange
            UserNode user = UserNode.builder()
                .id("user-1")
                .email("john@example.com")
                .build();

            // Act
            String fullName = user.getFullName();

            // Assert
            assertThat(fullName).isEqualTo("john@example.com");
        }

        @Test
        @DisplayName("should return first name only when last name is null")
        void shouldReturnFirstNameOnly() {
            // Arrange
            UserNode user = UserNode.builder()
                .id("user-1")
                .email("john@example.com")
                .firstName("John")
                .build();

            // Act
            String fullName = user.getFullName();

            // Assert
            assertThat(fullName).isEqualTo("John");
        }

        @Test
        @DisplayName("should return last name only when first name is null")
        void shouldReturnLastNameOnly() {
            // Arrange
            UserNode user = UserNode.builder()
                .id("user-1")
                .email("john@example.com")
                .lastName("Doe")
                .build();

            // Act
            String fullName = user.getFullName();

            // Assert
            assertThat(fullName).isEqualTo("Doe");
        }
    }

    @Nested
    @DisplayName("Graph enrichment")
    class GraphEnrichmentTests {

        @Test
        @DisplayName("should extract role names from UserNode")
        void shouldExtractRoleNames() {
            // Arrange
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

            // Act / Assert
            assertThat(graphUser.directRoles()).hasSize(2);
            assertThat(graphUser.directRoles().stream().map(RoleNode::name).toList())
                .containsExactly("ADMIN", "USER");
        }

        @Test
        @DisplayName("should extract group names from UserNode")
        void shouldExtractGroupNames() {
            // Arrange
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

            // Act / Assert
            assertThat(graphUser.groups()).hasSize(1);
            assertThat(graphUser.groups().get(0).name()).isEqualTo("administrators");
        }

        @Test
        @DisplayName("should handle null roles and groups gracefully")
        void shouldHandleNullRolesAndGroups() {
            // Arrange
            UserNode graphUser = new UserNode(
                "user-1", "test@example.com", "John", "Doe",
                TENANT_ID, true, true, null, "keycloak",
                null, null, Instant.now(), Instant.now(), null
            );

            // Act / Assert
            assertThat(graphUser.directRoles()).isNull();
            assertThat(graphUser.groups()).isNull();
        }
    }
}
