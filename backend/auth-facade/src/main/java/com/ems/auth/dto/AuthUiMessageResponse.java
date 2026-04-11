package com.ems.auth.dto;

public record AuthUiMessageResponse(
    String code,
    String text,
    String locale
) {
}
