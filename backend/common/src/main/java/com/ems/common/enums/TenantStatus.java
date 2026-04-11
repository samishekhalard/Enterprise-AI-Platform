package com.ems.common.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum TenantStatus {
    PROVISIONING,
    PROVISIONING_FAILED,
    ACTIVE,
    LOCKED,
    SUSPENDED,
    PENDING,
    DELETION_PENDING,
    DELETION_FAILED,
    DELETED,
    RESTORING,
    DECOMMISSIONED;

    @JsonValue
    public String toJson() {
        return name().toLowerCase();
    }

    @JsonCreator
    public static TenantStatus fromJson(String value) {
        return valueOf(value.toUpperCase());
    }
}
