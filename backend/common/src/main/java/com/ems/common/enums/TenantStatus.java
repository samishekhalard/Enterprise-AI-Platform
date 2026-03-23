package com.ems.common.enums;

import com.fasterxml.jackson.annotation.JsonValue;

public enum TenantStatus {
    ACTIVE,
    LOCKED,
    SUSPENDED,
    PENDING;

    @JsonValue
    public String toJson() {
        return name().toLowerCase();
    }
}
