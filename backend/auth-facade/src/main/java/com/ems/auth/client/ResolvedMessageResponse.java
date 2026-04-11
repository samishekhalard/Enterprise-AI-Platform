package com.ems.auth.client;

public record ResolvedMessageResponse(
    String code,
    String title,
    String detail,
    Integer httpStatus,
    String locale
) {
}
