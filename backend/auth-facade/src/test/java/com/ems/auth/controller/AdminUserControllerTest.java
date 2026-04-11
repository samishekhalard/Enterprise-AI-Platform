package com.ems.auth.controller;

import com.ems.auth.dto.PagedResponse;
import com.ems.auth.dto.UserResponse;
import com.ems.auth.exception.UserNotFoundException;
import com.ems.auth.service.UserManagementService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

/**
 * Unit tests for AdminUserController.
 *
 * Tests cover:
 * - List users endpoint with various parameters
 * - Get user endpoint with success and not-found scenarios
 * - Response status codes
 */
@ExtendWith(MockitoExtension.class)
class AdminUserControllerTest {

    @Mock
    private UserManagementService userManagementService;

    @InjectMocks
    private AdminUserController adminUserController;

    private static final String TENANT_ID = "tenant-acme";
    private static final String USER_ID = "550e8400-e29b-41d4-a716-446655440000";

    @Nested
    @DisplayName("GET /api/v1/admin/tenants/{tenantId}/users")
    class ListUsersTests {

        @Test
        @DisplayName("should return 200 with paginated users")
        void listUsers_shouldReturn200WithPaginatedUsers() {
            // Given
            UserResponse user = createTestUser(USER_ID, "john@example.com", "John", "Doe");
            PagedResponse<UserResponse> pagedResponse = PagedResponse.of(List.of(user), 0, 20, 1);
            when(userManagementService.listUsers(TENANT_ID, 0, 20, null, null, null))
                .thenReturn(pagedResponse);

            // When
            ResponseEntity<PagedResponse<UserResponse>> response = adminUserController.listUsers(
                TENANT_ID, 0, 20, null, null, null
            );

            // Then
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().content()).hasSize(1);
            assertThat(response.getBody().content().get(0).email()).isEqualTo("john@example.com");
            assertThat(response.getBody().totalElements()).isEqualTo(1);
            verify(userManagementService).listUsers(TENANT_ID, 0, 20, null, null, null);
        }

        @Test
        @DisplayName("should pass search parameter to service")
        void listUsers_shouldPassSearchParam() {
            // Given
            PagedResponse<UserResponse> pagedResponse = PagedResponse.empty(0, 20);
            when(userManagementService.listUsers(TENANT_ID, 0, 20, "john", null, null))
                .thenReturn(pagedResponse);

            // When
            ResponseEntity<PagedResponse<UserResponse>> response = adminUserController.listUsers(
                TENANT_ID, 0, 20, "john", null, null
            );

            // Then
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            verify(userManagementService).listUsers(TENANT_ID, 0, 20, "john", null, null);
        }

        @Test
        @DisplayName("should pass role filter to service")
        void listUsers_shouldPassRoleFilter() {
            // Given
            PagedResponse<UserResponse> pagedResponse = PagedResponse.empty(0, 20);
            when(userManagementService.listUsers(TENANT_ID, 0, 20, null, "ADMIN", null))
                .thenReturn(pagedResponse);

            // When
            ResponseEntity<PagedResponse<UserResponse>> response = adminUserController.listUsers(
                TENANT_ID, 0, 20, null, "ADMIN", null
            );

            // Then
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            verify(userManagementService).listUsers(TENANT_ID, 0, 20, null, "ADMIN", null);
        }

        @Test
        @DisplayName("should pass status filter to service")
        void listUsers_shouldPassStatusFilter() {
            // Given
            PagedResponse<UserResponse> pagedResponse = PagedResponse.empty(0, 20);
            when(userManagementService.listUsers(TENANT_ID, 0, 20, null, null, "active"))
                .thenReturn(pagedResponse);

            // When
            ResponseEntity<PagedResponse<UserResponse>> response = adminUserController.listUsers(
                TENANT_ID, 0, 20, null, null, "active"
            );

            // Then
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            verify(userManagementService).listUsers(TENANT_ID, 0, 20, null, null, "active");
        }

        @Test
        @DisplayName("should return empty page when no users found")
        void listUsers_shouldReturnEmptyPage() {
            // Given
            PagedResponse<UserResponse> pagedResponse = PagedResponse.empty(0, 20);
            when(userManagementService.listUsers(TENANT_ID, 0, 20, null, null, null))
                .thenReturn(pagedResponse);

            // When
            ResponseEntity<PagedResponse<UserResponse>> response = adminUserController.listUsers(
                TENANT_ID, 0, 20, null, null, null
            );

            // Then
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().content()).isEmpty();
            assertThat(response.getBody().totalElements()).isZero();
        }

        @Test
        @DisplayName("should pass all filters combined")
        void listUsers_shouldPassAllFiltersCombined() {
            // Given
            PagedResponse<UserResponse> pagedResponse = PagedResponse.empty(2, 10);
            when(userManagementService.listUsers(TENANT_ID, 2, 10, "john", "ADMIN", "active"))
                .thenReturn(pagedResponse);

            // When
            ResponseEntity<PagedResponse<UserResponse>> response = adminUserController.listUsers(
                TENANT_ID, 2, 10, "john", "ADMIN", "active"
            );

            // Then
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            verify(userManagementService).listUsers(TENANT_ID, 2, 10, "john", "ADMIN", "active");
        }
    }

    @Nested
    @DisplayName("GET /api/v1/admin/tenants/{tenantId}/users/{userId}")
    class GetUserTests {

        @Test
        @DisplayName("should return 200 with user details")
        void getUser_shouldReturn200WithUserDetails() {
            // Given
            UserResponse user = createTestUser(USER_ID, "john@example.com", "John", "Doe");
            when(userManagementService.getUser(TENANT_ID, USER_ID)).thenReturn(user);

            // When
            ResponseEntity<UserResponse> response = adminUserController.getUser(TENANT_ID, USER_ID);

            // Then
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().id()).isEqualTo(USER_ID);
            assertThat(response.getBody().email()).isEqualTo("john@example.com");
            assertThat(response.getBody().firstName()).isEqualTo("John");
            assertThat(response.getBody().lastName()).isEqualTo("Doe");
            verify(userManagementService).getUser(TENANT_ID, USER_ID);
        }

        @Test
        @DisplayName("should propagate UserNotFoundException")
        void getUser_shouldPropagateNotFoundException() {
            // Given
            when(userManagementService.getUser(TENANT_ID, USER_ID))
                .thenThrow(new UserNotFoundException(TENANT_ID, USER_ID));

            // When / Then
            assertThatThrownBy(() -> adminUserController.getUser(TENANT_ID, USER_ID))
                .isInstanceOf(UserNotFoundException.class)
                .hasMessageContaining(USER_ID)
                .hasMessageContaining(TENANT_ID);
        }

        @Test
        @DisplayName("should return user with roles and groups")
        void getUser_shouldReturnUserWithRolesAndGroups() {
            // Given
            UserResponse user = UserResponse.builder()
                .id(USER_ID)
                .email("admin@example.com")
                .firstName("Admin")
                .lastName("User")
                .displayName("Admin User")
                .active(true)
                .emailVerified(true)
                .roles(List.of("ADMIN", "USER"))
                .groups(List.of("administrators", "developers"))
                .identityProvider("keycloak")
                .createdAt(Instant.parse("2026-01-15T08:00:00Z"))
                .build();
            when(userManagementService.getUser(TENANT_ID, USER_ID)).thenReturn(user);

            // When
            ResponseEntity<UserResponse> response = adminUserController.getUser(TENANT_ID, USER_ID);

            // Then
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().roles()).containsExactly("ADMIN", "USER");
            assertThat(response.getBody().groups()).containsExactly("administrators", "developers");
        }
    }

    // =========================================================================
    // Helper Methods
    // =========================================================================

    private UserResponse createTestUser(String id, String email, String firstName, String lastName) {
        return UserResponse.builder()
            .id(id)
            .email(email)
            .firstName(firstName)
            .lastName(lastName)
            .displayName(firstName + " " + lastName)
            .active(true)
            .emailVerified(true)
            .roles(List.of("USER"))
            .groups(List.of())
            .identityProvider("keycloak")
            .createdAt(Instant.parse("2026-01-15T08:00:00Z"))
            .build();
    }
}
