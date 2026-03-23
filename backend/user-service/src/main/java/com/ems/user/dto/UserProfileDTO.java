package com.ems.user.dto;

import com.ems.common.enums.UserStatus;
import lombok.Builder;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Builder
public record UserProfileDTO(
    UUID id,
    UUID keycloakId,
    String tenantId,
    String email,
    Boolean emailVerified,
    String firstName,
    String lastName,
    String fullName,
    String displayName,
    String jobTitle,
    String department,
    String phone,
    String mobile,
    String officeLocation,
    String employeeId,
    String employeeType,
    ManagerDTO manager,
    String avatarUrl,
    String timezone,
    String locale,
    Boolean mfaEnabled,
    List<String> mfaMethods,
    UserStatus status,
    Instant lastLoginAt,
    Instant createdAt,
    Instant updatedAt
) {
    @Builder
    public record ManagerDTO(
        UUID id,
        String displayName,
        String email
    ) {}
}
