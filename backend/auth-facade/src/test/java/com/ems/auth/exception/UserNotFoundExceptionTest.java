package com.ems.auth.exception;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for UserNotFoundException.
 *
 * Tests cover:
 * - Two-argument constructor with tenantId and userId
 * - Single-argument constructor with plain message
 *
 * No Mockito needed -- pure exception construction tests.
 */
class UserNotFoundExceptionTest {

    @Test
    @DisplayName("should format message with tenant and user ID")
    void shouldFormatMessage() {
        // Arrange / Act
        UserNotFoundException ex = new UserNotFoundException("tenant-acme", "user-123");

        // Assert
        assertThat(ex.getMessage()).contains("user-123");
        assertThat(ex.getMessage()).contains("tenant-acme");
        assertThat(ex.getTenantId()).isEqualTo("tenant-acme");
        assertThat(ex.getUserId()).isEqualTo("user-123");
    }

    @Test
    @DisplayName("should accept plain message")
    void shouldAcceptPlainMessage() {
        // Arrange / Act
        UserNotFoundException ex = new UserNotFoundException("User not found");

        // Assert
        assertThat(ex.getMessage()).isEqualTo("User not found");
        assertThat(ex.getTenantId()).isNull();
        assertThat(ex.getUserId()).isNull();
    }
}
