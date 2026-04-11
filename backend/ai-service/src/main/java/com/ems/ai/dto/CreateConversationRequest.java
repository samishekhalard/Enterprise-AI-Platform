package com.ems.ai.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Builder;

import java.util.UUID;

@Builder
public record CreateConversationRequest(
    @NotNull(message = "Agent ID is required")
    UUID agentId,

    String title,

    String initialMessage
) {}
