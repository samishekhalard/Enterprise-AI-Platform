package com.ems.definition.dto;

import java.util.List;

/**
 * Generic paged response wrapper.
 *
 * @param <T> the element type
 */
public record PagedResponse<T>(
    List<T> content,
    int page,
    int size,
    long totalElements,
    int totalPages
) {

    /**
     * Factory method to create a PagedResponse.
     *
     * @param content       the page content
     * @param page          current page number (0-based)
     * @param size          page size
     * @param totalElements total number of elements across all pages
     * @param <T>           the element type
     * @return a new PagedResponse
     */
    public static <T> PagedResponse<T> of(List<T> content, int page, int size, long totalElements) {
        int totalPages = size > 0 ? (int) Math.ceil((double) totalElements / size) : 0;
        return new PagedResponse<>(content, page, size, totalElements, totalPages);
    }
}
