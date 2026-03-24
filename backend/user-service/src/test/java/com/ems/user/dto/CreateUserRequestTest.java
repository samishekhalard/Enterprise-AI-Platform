package com.ems.user.dto;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("CreateUserRequest Unit Tests")
class CreateUserRequestTest {

    @Test
    @DisplayName("Should default sendWelcomeEmail to true when null")
    void constructor_whenSendWelcomeEmailNull_shouldDefaultToTrue() {
        // Arrange & Act
        CreateUserRequest request = new CreateUserRequest(
            "test@example.com", "password123", "John", "Doe",
            "John Doe", null, null, null, null, null
        );

        // Assert
        assertThat(request.sendWelcomeEmail()).isTrue();
    }

    @Test
    @DisplayName("Should preserve sendWelcomeEmail when explicitly set to false")
    void constructor_whenSendWelcomeEmailFalse_shouldPreserve() {
        // Arrange & Act
        CreateUserRequest request = new CreateUserRequest(
            "test@example.com", "password123", "John", "Doe",
            "John Doe", null, null, null, null, false
        );

        // Assert
        assertThat(request.sendWelcomeEmail()).isFalse();
    }

    @Test
    @DisplayName("Should preserve sendWelcomeEmail when explicitly set to true")
    void constructor_whenSendWelcomeEmailTrue_shouldPreserve() {
        // Arrange & Act
        CreateUserRequest request = CreateUserRequest.builder()
            .email("test@example.com")
            .password("password123")
            .sendWelcomeEmail(true)
            .build();

        // Assert
        assertThat(request.sendWelcomeEmail()).isTrue();
    }
}
