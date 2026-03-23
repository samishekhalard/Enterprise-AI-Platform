package com.ems.user.dto;

import lombok.Builder;

import java.util.List;

@Builder
public record UserListResponse(
    List<UserProfileDTO> users,
    int page,
    int limit,
    long total,
    int totalPages
) {}
