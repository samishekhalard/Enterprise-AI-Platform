package com.ems.license.entity.converter;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("StringListJsonConverter")
class StringListJsonConverterTest {

    private StringListJsonConverter converter;

    @BeforeEach
    void setUp() {
        converter = new StringListJsonConverter();
    }

    @Nested
    @DisplayName("convertToDatabaseColumn")
    class ConvertToDatabaseColumn {

        @Test
        @DisplayName("Should convert list of strings to JSON array")
        void shouldConvertList_toJsonArray() {
            // Arrange
            List<String> input = List.of("basic_workflows", "advanced_reports");

            // Act
            String result = converter.convertToDatabaseColumn(input);

            // Assert
            assertThat(result).isEqualTo("[\"basic_workflows\",\"advanced_reports\"]");
        }

        @Test
        @DisplayName("Should convert single-element list to JSON array")
        void shouldConvertSingleElementList_toJsonArray() {
            // Arrange
            List<String> input = List.of("single_feature");

            // Act
            String result = converter.convertToDatabaseColumn(input);

            // Assert
            assertThat(result).isEqualTo("[\"single_feature\"]");
        }

        @Test
        @DisplayName("Should convert empty list to empty JSON array")
        void shouldConvertEmptyList_toEmptyArray() {
            // Arrange
            List<String> input = Collections.emptyList();

            // Act
            String result = converter.convertToDatabaseColumn(input);

            // Assert
            assertThat(result).isEqualTo("[]");
        }

        @Test
        @DisplayName("Should convert null to empty JSON array")
        void shouldConvertNull_toEmptyArray() {
            // Act
            String result = converter.convertToDatabaseColumn(null);

            // Assert
            assertThat(result).isEqualTo("[]");
        }
    }

    @Nested
    @DisplayName("convertToEntityAttribute")
    class ConvertToEntityAttribute {

        @Test
        @DisplayName("Should convert JSON array to list of strings")
        void shouldConvertJsonArray_toList() {
            // Arrange
            String input = "[\"basic_workflows\",\"advanced_reports\"]";

            // Act
            List<String> result = converter.convertToEntityAttribute(input);

            // Assert
            assertThat(result).containsExactly("basic_workflows", "advanced_reports");
        }

        @Test
        @DisplayName("Should convert single-element JSON array to list")
        void shouldConvertSingleElementArray_toList() {
            // Arrange
            String input = "[\"single\"]";

            // Act
            List<String> result = converter.convertToEntityAttribute(input);

            // Assert
            assertThat(result).containsExactly("single");
        }

        @Test
        @DisplayName("Should convert empty JSON array to empty list")
        void shouldConvertEmptyArray_toEmptyList() {
            // Arrange
            String input = "[]";

            // Act
            List<String> result = converter.convertToEntityAttribute(input);

            // Assert
            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("Should return empty list for null input")
        void shouldReturnEmptyList_forNull() {
            // Act
            List<String> result = converter.convertToEntityAttribute(null);

            // Assert
            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("Should return empty list for blank input")
        void shouldReturnEmptyList_forBlank() {
            // Act
            List<String> result = converter.convertToEntityAttribute("   ");

            // Assert
            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("Should throw IllegalArgumentException for invalid JSON")
        void shouldThrowException_forInvalidJson() {
            // Arrange
            String input = "not-valid-json{{{";

            // Act & Assert
            assertThatThrownBy(() -> converter.convertToEntityAttribute(input))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Failed to convert JSON to list");
        }
    }

    @Nested
    @DisplayName("Round-trip conversion")
    class RoundTrip {

        @Test
        @DisplayName("Should preserve data through write-then-read cycle")
        void shouldPreserveData_throughRoundTrip() {
            // Arrange
            List<String> original = List.of("feature_a", "feature_b", "feature_c");

            // Act
            String json = converter.convertToDatabaseColumn(original);
            List<String> restored = converter.convertToEntityAttribute(json);

            // Assert
            assertThat(restored).isEqualTo(original);
        }

        @Test
        @DisplayName("Should preserve empty list through round-trip")
        void shouldPreserveEmptyList_throughRoundTrip() {
            // Arrange
            List<String> original = Collections.emptyList();

            // Act
            String json = converter.convertToDatabaseColumn(original);
            List<String> restored = converter.convertToEntityAttribute(json);

            // Assert
            assertThat(restored).isEmpty();
        }
    }
}
