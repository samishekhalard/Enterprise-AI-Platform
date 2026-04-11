package com.ems.ai.dto;

import com.ems.ai.entity.ConversationEntity.ConversationStatus;
import lombok.Builder;

import java.time.Instant;
import java.util.UUID;

@Builder
public record ConversationDTO(
    UUID id,
    String tenantId,
    UUID userId,
    UUID agentId,
    String agentName,
    String agentAvatarUrl,
    String title,
    Integer messageCount,
    Integer totalTokens,
    ConversationStatus status,
    Instant lastMessageAt,
    Instant createdAt
) {}
