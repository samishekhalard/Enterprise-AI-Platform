package com.ems.user.service;

import com.ems.user.dto.*;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface UserProfileService {

    // Current user operations
    UserProfileDTO getCurrentUser(UUID keycloakId, String tenantId);
    UserProfileDTO updateCurrentUser(UUID keycloakId, String tenantId, UserProfileUpdateRequest request);

    // Admin operations
    UserListResponse listUsers(String tenantId, String search, Pageable pageable);
    UserProfileDTO getUserById(UUID userId, String tenantId);
    UserProfileDTO getUserByKeycloakId(UUID keycloakId);
    UserProfileDTO createUser(String tenantId, CreateUserRequest request, UUID createdByKeycloakId);
    UserProfileDTO updateUser(UUID userId, String tenantId, UserProfileUpdateRequest request);
    void deleteUser(UUID userId, String tenantId);
    void enableUser(UUID userId, String tenantId);
    void disableUser(UUID userId, String tenantId);

    // Keycloak sync
    UserProfileDTO syncFromKeycloak(UUID keycloakId, String tenantId);
}
