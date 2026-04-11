package com.ems.common.dto;

import lombok.Builder;

@Builder
public record ActivateTenantRequest(
    boolean sendWelcomeNotification
) {}
