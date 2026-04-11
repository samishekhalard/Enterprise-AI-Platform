package com.ems.auth.dto;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for UserResponse record and its builder.
 *
 * Tests cover:
 * - Builder with all fields populated
 * - Builder defaults for optional collections
 *
 * No Mockito needed -- pure record builder tests.
 */
class UserResponseTest {

    @Test
    @DisplayName("builder should create UserResponse with all fields")
    void builder_shouldCreateWithAllFields() {
        // Arrange
        Instant now = Instant.now();

        // Act
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

        // Assert
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
        // Arrange / Act
        UserResponse user = UserResponse.builder()
            .id("user-1")
            .email("test@example.com")
            .build();

        // Assert
        assertThat(user.roles()).isEmpty();
        assertThat(user.groups()).isEmpty();
    }
}
