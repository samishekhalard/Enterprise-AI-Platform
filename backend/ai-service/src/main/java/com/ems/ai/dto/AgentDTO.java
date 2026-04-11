package com.ems.ai.dto;

import com.ems.ai.entity.AgentEntity.AgentStatus;
import com.ems.ai.entity.AgentEntity.LlmProvider;
import lombok.Builder;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Builder
public record AgentDTO(
    UUID id,
    String tenantId,
    UUID ownerId,
    String name,
    String description,
    String avatarUrl,
    String systemPrompt,
    String greetingMessage,
    List<String> conversationStarters,
    LlmProvider provider,
    String model,
    Map<String, Object> modelConfig,
    Boolean ragEnabled,
    AgentCategoryDTO category,
    Boolean isPublic,
    Boolean isSystem,
    AgentStatus status,
    Long usageCount,
    Integer knowledgeSourceCount,
    Instant createdAt,
    Instant updatedAt
) {}
