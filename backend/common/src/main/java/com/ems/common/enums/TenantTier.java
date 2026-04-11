package com.ems.common.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum TenantTier {
    FREE,
    STANDARD,
    PROFESSIONAL,
    ENTERPRISE;

    @JsonValue
    public String toJson() {
        return name().toLowerCase();
    }

    @JsonCreator
    public static TenantTier fromJson(String value) {
        return valueOf(value.toUpperCase());
    }
}
