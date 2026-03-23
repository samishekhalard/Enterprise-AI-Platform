package com.ems.user.dto;

import com.ems.common.enums.SessionStatus;
import lombok.Builder;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Builder
public record UserSessionDTO(
    UUID id,
    String deviceName,
    String ipAddress,
    Map<String, Object> location,
    Instant createdAt,
    Instant lastActivity,
    Instant expiresAt,
    Boolean isRemembered,
    Boolean mfaVerified,
    SessionStatus status,
    Boolean isCurrent
) {}
