package com.ems.auth.dto;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for PagedResponse record.
 *
 * Tests cover:
 * - Page calculation with various element counts
 * - Exact page boundaries
 * - Single element pages
 * - Empty pages
 * - Zero size edge case
 *
 * No Mockito needed -- pure record/factory method tests.
 */
class PagedResponseTest {

    @Test
    @DisplayName("of() should calculate totalPages correctly")
    void of_shouldCalculateTotalPages() {
        // Arrange
        List<String> content = List.of("a", "b");

        // Act
        PagedResponse<String> response = PagedResponse.of(content, 0, 20, 50);

        // Assert
        assertThat(response.page()).isEqualTo(0);
        assertThat(response.size()).isEqualTo(20);
        assertThat(response.totalElements()).isEqualTo(50);
        assertThat(response.totalPages()).isEqualTo(3);
    }

    @Test
    @DisplayName("of() should handle exact page boundary")
    void of_shouldHandleExactBoundary() {
        // Arrange / Act
        PagedResponse<String> response = PagedResponse.of(List.of("a", "b"), 0, 10, 20);

        // Assert
        assertThat(response.totalPages()).isEqualTo(2);
    }

    @Test
    @DisplayName("of() should handle single element")
    void of_shouldHandleSingleElement() {
        // Arrange / Act
        PagedResponse<String> response = PagedResponse.of(List.of("a"), 0, 20, 1);

        // Assert
        assertThat(response.totalPages()).isEqualTo(1);
        assertThat(response.totalElements()).isEqualTo(1);
    }

    @Test
    @DisplayName("empty() should return zero-element response")
    void empty_shouldReturnZeroElements() {
        // Arrange / Act
        PagedResponse<String> response = PagedResponse.empty(0, 20);

        // Assert
        assertThat(response.content()).isEmpty();
        assertThat(response.totalElements()).isZero();
        assertThat(response.totalPages()).isZero();
    }

    @Test
    @DisplayName("of() should handle zero size gracefully")
    void of_shouldHandleZeroSize() {
        // Arrange / Act
        PagedResponse<String> response = PagedResponse.of(List.of(), 0, 0, 0);

        // Assert
        assertThat(response.totalPages()).isZero();
    }
}
