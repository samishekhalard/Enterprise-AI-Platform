package com.ems.audit.dto;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.*;

@DisplayName("AuditSearchRequest Compact Constructor Validation")
class AuditSearchRequestTest {

    @Nested
    @DisplayName("page validation")
    class PageValidation {

        @Test
        @DisplayName("constructor_withNegativePage_shouldDefaultToZero")
        void constructor_withNegativePage_shouldDefaultToZero() {
            // Arrange & Act
            AuditSearchRequest request = new AuditSearchRequest(
                    "tenant-1", null, null, null, null, null,
                    null, null, null, null, null, null, null,
                    -1, 50, "timestamp", "DESC"
            );

            // Assert
            assertThat(request.page()).isZero();
        }

        @Test
        @DisplayName("constructor_withValidPage_shouldKeepValue")
        void constructor_withValidPage_shouldKeepValue() {
            // Arrange & Act
            AuditSearchRequest request = new AuditSearchRequest(
                    "tenant-1", null, null, null, null, null,
                    null, null, null, null, null, null, null,
                    5, 50, "timestamp", "DESC"
            );

            // Assert
            assertThat(request.page()).isEqualTo(5);
        }
    }

    @Nested
    @DisplayName("size validation")
    class SizeValidation {

        @Test
        @DisplayName("constructor_withZeroSize_shouldDefaultTo50")
        void constructor_withZeroSize_shouldDefaultTo50() {
            // Arrange & Act
            AuditSearchRequest request = new AuditSearchRequest(
                    "tenant-1", null, null, null, null, null,
                    null, null, null, null, null, null, null,
                    0, 0, "timestamp", "DESC"
            );

            // Assert
            assertThat(request.size()).isEqualTo(50);
        }

        @Test
        @DisplayName("constructor_withNegativeSize_shouldDefaultTo50")
        void constructor_withNegativeSize_shouldDefaultTo50() {
            // Arrange & Act
            AuditSearchRequest request = new AuditSearchRequest(
                    "tenant-1", null, null, null, null, null,
                    null, null, null, null, null, null, null,
                    0, -10, "timestamp", "DESC"
            );

            // Assert
            assertThat(request.size()).isEqualTo(50);
        }

        @Test
        @DisplayName("constructor_withSizeAbove1000_shouldDefaultTo50")
        void constructor_withSizeAbove1000_shouldDefaultTo50() {
            // Arrange & Act
            AuditSearchRequest request = new AuditSearchRequest(
                    "tenant-1", null, null, null, null, null,
                    null, null, null, null, null, null, null,
                    0, 1001, "timestamp", "DESC"
            );

            // Assert
            assertThat(request.size()).isEqualTo(50);
        }

        @ParameterizedTest
        @ValueSource(ints = {1, 50, 100, 500, 1000})
        @DisplayName("constructor_withValidSize_shouldKeepValue")
        void constructor_withValidSize_shouldKeepValue(int size) {
            // Arrange & Act
            AuditSearchRequest request = new AuditSearchRequest(
                    "tenant-1", null, null, null, null, null,
                    null, null, null, null, null, null, null,
                    0, size, "timestamp", "DESC"
            );

            // Assert
            assertThat(request.size()).isEqualTo(size);
        }
    }

    @Nested
    @DisplayName("sortBy validation")
    class SortByValidation {

        @Test
        @DisplayName("constructor_withNullSortBy_shouldDefaultToTimestamp")
        void constructor_withNullSortBy_shouldDefaultToTimestamp() {
            // Arrange & Act
            AuditSearchRequest request = new AuditSearchRequest(
                    "tenant-1", null, null, null, null, null,
                    null, null, null, null, null, null, null,
                    0, 50, null, "DESC"
            );

            // Assert
            assertThat(request.sortBy()).isEqualTo("timestamp");
        }

        @Test
        @DisplayName("constructor_withBlankSortBy_shouldDefaultToTimestamp")
        void constructor_withBlankSortBy_shouldDefaultToTimestamp() {
            // Arrange & Act
            AuditSearchRequest request = new AuditSearchRequest(
                    "tenant-1", null, null, null, null, null,
                    null, null, null, null, null, null, null,
                    0, 50, "  ", "DESC"
            );

            // Assert
            assertThat(request.sortBy()).isEqualTo("timestamp");
        }

        @Test
        @DisplayName("constructor_withCustomSortBy_shouldKeepValue")
        void constructor_withCustomSortBy_shouldKeepValue() {
            // Arrange & Act
            AuditSearchRequest request = new AuditSearchRequest(
                    "tenant-1", null, null, null, null, null,
                    null, null, null, null, null, null, null,
                    0, 50, "eventType", "DESC"
            );

            // Assert
            assertThat(request.sortBy()).isEqualTo("eventType");
        }
    }

    @Nested
    @DisplayName("sortDirection validation")
    class SortDirectionValidation {

        @Test
        @DisplayName("constructor_withNullSortDirection_shouldDefaultToDESC")
        void constructor_withNullSortDirection_shouldDefaultToDESC() {
            // Arrange & Act
            AuditSearchRequest request = new AuditSearchRequest(
                    "tenant-1", null, null, null, null, null,
                    null, null, null, null, null, null, null,
                    0, 50, "timestamp", null
            );

            // Assert
            assertThat(request.sortDirection()).isEqualTo("DESC");
        }

        @Test
        @DisplayName("constructor_withBlankSortDirection_shouldDefaultToDESC")
        void constructor_withBlankSortDirection_shouldDefaultToDESC() {
            // Arrange & Act
            AuditSearchRequest request = new AuditSearchRequest(
                    "tenant-1", null, null, null, null, null,
                    null, null, null, null, null, null, null,
                    0, 50, "timestamp", ""
            );

            // Assert
            assertThat(request.sortDirection()).isEqualTo("DESC");
        }

        @Test
        @DisplayName("constructor_withASCSortDirection_shouldKeepValue")
        void constructor_withASCSortDirection_shouldKeepValue() {
            // Arrange & Act
            AuditSearchRequest request = new AuditSearchRequest(
                    "tenant-1", null, null, null, null, null,
                    null, null, null, null, null, null, null,
                    0, 50, "timestamp", "ASC"
            );

            // Assert
            assertThat(request.sortDirection()).isEqualTo("ASC");
        }
    }
}
