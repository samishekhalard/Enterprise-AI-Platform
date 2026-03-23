package com.ems.user.dto;

import jakarta.validation.constraints.Size;
import lombok.Builder;

import java.util.UUID;

@Builder
public record UserProfileUpdateRequest(
    @Size(max = 255)
    String displayName,

    @Size(max = 100)
    String firstName,

    @Size(max = 100)
    String lastName,

    @Size(max = 100)
    String jobTitle,

    @Size(max = 100)
    String department,

    @Size(max = 50)
    String phone,

    @Size(max = 50)
    String mobile,

    @Size(max = 255)
    String officeLocation,

    @Size(max = 50)
    String employeeId,

    @Size(max = 50)
    String employeeType,

    UUID managerId,

    @Size(max = 500)
    String avatarUrl,

    @Size(max = 50)
    String timezone,

    @Size(max = 10)
    String locale
) {}
