package com.ems.ai.dto;

import com.ems.ai.entity.AgentEntity.LlmProvider;
import jakarta.validation.constraints.Size;
import lombok.Builder;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Builder
public record UpdateAgentRequest(
    @Size(max = 100, message = "Name must not exceed 100 characters")
    String name,

    @Size(max = 1000, message = "Description must not exceed 1000 characters")
    String description,

    String avatarUrl,

    String systemPrompt,

    String greetingMessage,

    List<String> conversationStarters,

    LlmProvider provider,

    String model,

    Map<String, Object> modelConfig,

    Boolean ragEnabled,

    UUID categoryId,

    Boolean isPublic
) {}
