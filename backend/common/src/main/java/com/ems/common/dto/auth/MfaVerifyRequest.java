package com.ems.common.dto.auth;

import jakarta.validation.constraints.NotBlank;

public record MfaVerifyRequest(
    @NotBlank(message = "MFA session token is required")
    String mfaSessionToken,

    @NotBlank(message = "TOTP code is required")
    String code
) {}
