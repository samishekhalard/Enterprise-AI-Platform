package com.ems.ai.dto;

import com.ems.ai.entity.MessageEntity.MessageRole;
import lombok.Builder;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Builder
public record MessageDTO(
    UUID id,
    UUID conversationId,
    MessageRole role,
    String content,
    Integer tokenCount,
    Map<String, Object> ragContext,
    Map<String, Object> metadata,
    Instant createdAt
) {}
