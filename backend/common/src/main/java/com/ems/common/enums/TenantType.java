package com.ems.common.enums;

import com.fasterxml.jackson.annotation.JsonValue;

public enum TenantType {
    MASTER,
    DOMINANT,
    REGULAR;

    @JsonValue
    public String toJson() {
        return name().toLowerCase();
    }
}
