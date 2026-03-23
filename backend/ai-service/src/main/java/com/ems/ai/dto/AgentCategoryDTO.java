package com.ems.ai.dto;

import lombok.Builder;

import java.util.UUID;

@Builder
public record AgentCategoryDTO(
    UUID id,
    String name,
    String description,
    String icon,
    Integer displayOrder
) {}
