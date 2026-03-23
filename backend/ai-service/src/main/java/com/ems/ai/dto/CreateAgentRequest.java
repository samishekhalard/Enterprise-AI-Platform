package com.ems.ai.dto;

import com.ems.ai.entity.AgentEntity.LlmProvider;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Builder;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Builder
public record CreateAgentRequest(
    @NotBlank(message = "Agent name is required")
    @Size(max = 100, message = "Name must not exceed 100 characters")
    String name,

    @Size(max = 1000, message = "Description must not exceed 1000 characters")
    String description,

    String avatarUrl,

    @NotBlank(message = "System prompt is required")
    String systemPrompt,

    String greetingMessage,

    List<String> conversationStarters,

    @NotNull(message = "Provider is required")
    LlmProvider provider,

    @NotBlank(message = "Model is required")
    String model,

    Map<String, Object> modelConfig,

    Boolean ragEnabled,

    UUID categoryId,

    Boolean isPublic
) {}
