package com.ems.common.dto.auth;

import com.ems.common.enums.MFAMethod;
import jakarta.validation.constraints.NotNull;

public record MfaSetupRequest(
    @NotNull(message = "MFA method is required")
    MFAMethod method
) {}
