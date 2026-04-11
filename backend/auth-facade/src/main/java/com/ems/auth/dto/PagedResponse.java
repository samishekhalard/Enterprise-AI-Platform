package com.ems.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

/**
 * Generic paginated response DTO.
 *
 * Provides a consistent pagination wrapper for list endpoints.
 * Mirrors Spring Data's Page structure for frontend compatibility.
 *
 * @param <T> The type of elements in the page
 */
@Schema(description = "Paginated response wrapper")
public record PagedResponse<T>(

    @Schema(description = "List of items in the current page")
    List<T> content,

    @Schema(description = "Current page number (zero-based)", example = "0")
    int page,

    @Schema(description = "Page size", example = "20")
    int size,

    @Schema(description = "Total number of elements across all pages", example = "150")
    long totalElements,

    @Schema(description = "Total number of pages", example = "8")
    int totalPages

) {
    /**
     * Create a PagedResponse from content and pagination metadata.
     *
     * @param content       The items in the current page
     * @param page          Current page number (zero-based)
     * @param size          Page size
     * @param totalElements Total number of elements
     * @param <T>           The type of elements
     * @return A new PagedResponse instance
     */
    public static <T> PagedResponse<T> of(List<T> content, int page, int size, long totalElements) {
        int totalPages = size > 0 ? (int) Math.ceil((double) totalElements / size) : 0;
        return new PagedResponse<>(content, page, size, totalElements, totalPages);
    }

    /**
     * Create an empty PagedResponse.
     *
     * @param page Current page number
     * @param size Page size
     * @param <T>  The type of elements
     * @return An empty PagedResponse
     */
    public static <T> PagedResponse<T> empty(int page, int size) {
        return new PagedResponse<>(List.of(), page, size, 0, 0);
    }
}
