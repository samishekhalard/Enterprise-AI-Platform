package com.ems.user.dto;

import com.ems.common.enums.DeviceTrustLevel;
import com.ems.common.enums.DeviceType;
import lombok.Builder;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Builder
public record UserDeviceDTO(
    UUID id,
    String fingerprint,
    String deviceName,
    DeviceType deviceType,
    String osName,
    String osVersion,
    String browserName,
    String browserVersion,
    DeviceTrustLevel trustLevel,
    Boolean isApproved,
    Instant firstSeenAt,
    Instant lastSeenAt,
    String lastIpAddress,
    Map<String, Object> lastLocation,
    Integer loginCount,
    Instant createdAt
) {}
