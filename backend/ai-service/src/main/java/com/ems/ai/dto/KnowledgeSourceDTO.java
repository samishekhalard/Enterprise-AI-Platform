package com.ems.ai.dto;

import com.ems.ai.entity.KnowledgeSourceEntity.FileType;
import com.ems.ai.entity.KnowledgeSourceEntity.SourceStatus;
import com.ems.ai.entity.KnowledgeSourceEntity.SourceType;
import lombok.Builder;

import java.time.Instant;
import java.util.UUID;

@Builder
public record KnowledgeSourceDTO(
    UUID id,
    UUID agentId,
    String name,
    String description,
    SourceType sourceType,
    FileType fileType,
    Long fileSize,
    String url,
    SourceStatus status,
    Integer chunkCount,
    String errorMessage,
    Instant processedAt,
    Instant createdAt
) {}
