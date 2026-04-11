package com.ems.ai.dto;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class SendMessageRequestTest {

    @Test
    @DisplayName("should default stream to true when null")
    void constructor_whenStreamNull_shouldDefaultToTrue() {
        // Arrange & Act
        SendMessageRequest request = SendMessageRequest.builder()
            .content("Hello")
            .stream(null)
            .build();

        // Assert
        assertThat(request.stream()).isTrue();
    }

    @Test
    @DisplayName("should preserve stream value when explicitly set to false")
    void constructor_whenStreamFalse_shouldPreserveFalse() {
        // Arrange & Act
        SendMessageRequest request = SendMessageRequest.builder()
            .content("Hello")
            .stream(false)
            .build();

        // Assert
        assertThat(request.stream()).isFalse();
    }

    @Test
    @DisplayName("should preserve stream value when explicitly set to true")
    void constructor_whenStreamTrue_shouldPreserveTrue() {
        // Arrange & Act
        SendMessageRequest request = SendMessageRequest.builder()
            .content("Hello")
            .stream(true)
            .build();

        // Assert
        assertThat(request.stream()).isTrue();
    }
}
