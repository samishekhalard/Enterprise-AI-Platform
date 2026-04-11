package com.ems.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Builder;

import java.util.UUID;

@Builder
public record CreateUserRequest(
    @NotBlank
    @Email
    String email,

    @NotBlank
    @Size(min = 8, max = 100)
    String password,

    @Size(max = 100)
    String firstName,

    @Size(max = 100)
    String lastName,

    @Size(max = 255)
    String displayName,

    @Size(max = 100)
    String jobTitle,

    @Size(max = 100)
    String department,

    @Size(max = 50)
    String phone,

    UUID managerId,

    Boolean sendWelcomeEmail
) {
    public CreateUserRequest {
        if (sendWelcomeEmail == null) {
            sendWelcomeEmail = true;
        }
    }
}
