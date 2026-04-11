package com.ems.common.dto.auth;

import com.ems.common.enums.MFAMethod;
import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record MfaSetupResponse(
    MFAMethod method,
    String secret,
    String qrCodeUri,
    String[] recoveryCodes
) {
    public static MfaSetupResponse totp(String secret, String qrCodeUri, String[] recoveryCodes) {
        return new MfaSetupResponse(MFAMethod.TOTP, secret, qrCodeUri, recoveryCodes);
    }
}
