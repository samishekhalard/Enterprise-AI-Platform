package com.ems.common.dto.auth;

import java.util.List;

public record UserInfo(
    String id,
    String email,
    String firstName,
    String lastName,
    String tenantId,
    List<String> roles
) {}
