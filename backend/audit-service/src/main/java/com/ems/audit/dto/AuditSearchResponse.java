package com.ems.audit.dto;

import lombok.Builder;

import java.util.List;

@Builder
public record AuditSearchResponse(
    List<AuditEventDTO> content,
    int page,
    int size,
    long totalElements,
    int totalPages,
    boolean hasNext,
    boolean hasPrevious
) {}
