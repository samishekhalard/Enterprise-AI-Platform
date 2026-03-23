package com.ems.common.dto.auth;

import jakarta.validation.constraints.NotBlank;

public record MicrosoftTokenRequest(
    @NotBlank(message = "Microsoft access token is required")
    String accessToken
) {}
