package com.ems.tenant.dto.internal;

public record ResolvedMessageResponse(
    String code,
    String title,
    String detail,
    Integer httpStatus,
    String locale
) {
}
