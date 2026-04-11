package com.ems.user.service;

import com.ems.common.enums.UserStatus;
import com.ems.common.exception.ResourceNotFoundException;
import com.ems.user.dto.*;
import com.ems.user.entity.UserProfileEntity;
import com.ems.user.mapper.UserMapper;
import com.ems.user.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class UserProfileServiceImpl implements UserProfileService {

    private final UserProfileRepository userProfileRepository;
    private final UserMapper userMapper;
    private final KeycloakSyncService keycloakSyncService;

    @Override
    @Transactional(readOnly = true)
    public UserProfileDTO getCurrentUser(UUID keycloakId, String tenantId) {
        log.debug("Getting current user profile for keycloakId: {}", keycloakId);

        UserProfileEntity user = userProfileRepository.findByKeycloakId(keycloakId)
            .orElseGet(() -> {
                // User not in our DB yet, sync from Keycloak
                log.info("User not found locally, syncing from Keycloak: {}", keycloakId);
                return keycloakSyncService.syncUser(keycloakId, tenantId);
            });

        return enrichWithManager(userMapper.toProfileDTO(user));
    }

    @Override
    public UserProfileDTO updateCurrentUser(UUID keycloakId, String tenantId, UserProfileUpdateRequest request) {
        log.debug("Updating current user profile for keycloakId: {}", keycloakId);

        UserProfileEntity user = userProfileRepository.findByKeycloakId(keycloakId)
            .orElseThrow(() -> new ResourceNotFoundException("User", keycloakId.toString()));

        // Only allow self-service fields
        updateSelfServiceFields(user, request);
        user = userProfileRepository.save(user);

        log.info("Updated user profile: {}", user.getEmail());
        return enrichWithManager(userMapper.toProfileDTO(user));
    }

    @Override
    @Transactional(readOnly = true)
    public UserListResponse listUsers(String tenantId, String search, Pageable pageable) {
        log.debug("Listing users for tenant: {}, search: {}", tenantId, search);

        Page<UserProfileEntity> page;
        if (search != null && !search.isBlank()) {
            page = userProfileRepository.searchByTenantId(tenantId, search, pageable);
        } else {
            page = userProfileRepository.findByTenantId(tenantId, pageable);
        }

        return UserListResponse.builder()
            .users(page.getContent().stream()
                .map(userMapper::toProfileDTO)
                .map(this::enrichWithManager)
                .toList())
            .page(page.getNumber() + 1)
            .limit(page.getSize())
            .total(page.getTotalElements())
            .totalPages(page.getTotalPages())
            .build();
    }

    @Override
    @Transactional(readOnly = true)
    public UserProfileDTO getUserById(UUID userId, String tenantId) {
        log.debug("Getting user by id: {} in tenant: {}", userId, tenantId);

        UserProfileEntity user = userProfileRepository.findById(userId)
            .filter(u -> u.getTenantId().equals(tenantId))
            .orElseThrow(() -> new ResourceNotFoundException("User", userId.toString()));

        return enrichWithManager(userMapper.toProfileDTO(user));
    }

    @Override
    @Transactional(readOnly = true)
    public UserProfileDTO getUserByKeycloakId(UUID keycloakId) {
        log.debug("Getting user by keycloakId: {}", keycloakId);

        UserProfileEntity user = userProfileRepository.findByKeycloakId(keycloakId)
            .orElseThrow(() -> new ResourceNotFoundException("User", keycloakId.toString()));

        return enrichWithManager(userMapper.toProfileDTO(user));
    }

    @Override
    public UserProfileDTO createUser(String tenantId, CreateUserRequest request, UUID createdByKeycloakId) {
        log.info("Creating user: {} in tenant: {}", request.email(), tenantId);

        // Create user in Keycloak first
        UUID keycloakUserId = keycloakSyncService.createUserInKeycloak(tenantId, request);

        // Create local profile
        UserProfileEntity user = UserProfileEntity.builder()
            .keycloakId(keycloakUserId)
            .tenantId(tenantId)
            .email(request.email())
            .firstName(request.firstName())
            .lastName(request.lastName())
            .displayName(request.displayName())
            .jobTitle(request.jobTitle())
            .department(request.department())
            .phone(request.phone())
            .managerId(request.managerId())
            .status(UserStatus.ACTIVE)
            .build();

        user = userProfileRepository.save(user);
        log.info("Created user: {} with id: {}", user.getEmail(), user.getId());

        return enrichWithManager(userMapper.toProfileDTO(user));
    }

    @Override
    public UserProfileDTO updateUser(UUID userId, String tenantId, UserProfileUpdateRequest request) {
        log.debug("Updating user: {} in tenant: {}", userId, tenantId);

        UserProfileEntity user = userProfileRepository.findById(userId)
            .filter(u -> u.getTenantId().equals(tenantId))
            .orElseThrow(() -> new ResourceNotFoundException("User", userId.toString()));

        // Admin can update all fields
        updateAllFields(user, request);
        user = userProfileRepository.save(user);

        log.info("Updated user: {}", user.getEmail());
        return enrichWithManager(userMapper.toProfileDTO(user));
    }

    @Override
    public void deleteUser(UUID userId, String tenantId) {
        log.info("Deleting user: {} in tenant: {}", userId, tenantId);

        UserProfileEntity user = userProfileRepository.findById(userId)
            .filter(u -> u.getTenantId().equals(tenantId))
            .orElseThrow(() -> new ResourceNotFoundException("User", userId.toString()));

        // Delete from Keycloak first
        keycloakSyncService.deleteUserInKeycloak(user.getKeycloakId(), tenantId);

        // Soft delete locally
        user.setStatus(UserStatus.DELETED);
        userProfileRepository.save(user);

        log.info("Deleted user: {}", user.getEmail());
    }

    @Override
    public void enableUser(UUID userId, String tenantId) {
        log.info("Enabling user: {} in tenant: {}", userId, tenantId);

        UserProfileEntity user = userProfileRepository.findById(userId)
            .filter(u -> u.getTenantId().equals(tenantId))
            .orElseThrow(() -> new ResourceNotFoundException("User", userId.toString()));

        // Enable in Keycloak
        keycloakSyncService.enableUserInKeycloak(user.getKeycloakId(), tenantId);

        user.setStatus(UserStatus.ACTIVE);
        userProfileRepository.save(user);

        log.info("Enabled user: {}", user.getEmail());
    }

    @Override
    public void disableUser(UUID userId, String tenantId) {
        log.info("Disabling user: {} in tenant: {}", userId, tenantId);

        UserProfileEntity user = userProfileRepository.findById(userId)
            .filter(u -> u.getTenantId().equals(tenantId))
            .orElseThrow(() -> new ResourceNotFoundException("User", userId.toString()));

        // Disable in Keycloak
        keycloakSyncService.disableUserInKeycloak(user.getKeycloakId(), tenantId);

        user.setStatus(UserStatus.SUSPENDED);
        userProfileRepository.save(user);

        log.info("Disabled user: {}", user.getEmail());
    }

    @Override
    public UserProfileDTO syncFromKeycloak(UUID keycloakId, String tenantId) {
        log.info("Syncing user from Keycloak: {}", keycloakId);

        UserProfileEntity user = keycloakSyncService.syncUser(keycloakId, tenantId);
        return enrichWithManager(userMapper.toProfileDTO(user));
    }

    // Helper methods

    private void updateSelfServiceFields(UserProfileEntity user, UserProfileUpdateRequest request) {
        if (request.displayName() != null) user.setDisplayName(request.displayName());
        if (request.phone() != null) user.setPhone(request.phone());
        if (request.mobile() != null) user.setMobile(request.mobile());
        if (request.avatarUrl() != null) user.setAvatarUrl(request.avatarUrl());
        if (request.timezone() != null) user.setTimezone(request.timezone());
        if (request.locale() != null) user.setLocale(request.locale());
    }

    private void updateAllFields(UserProfileEntity user, UserProfileUpdateRequest request) {
        updateSelfServiceFields(user, request);

        // Admin-only fields
        if (request.firstName() != null) user.setFirstName(request.firstName());
        if (request.lastName() != null) user.setLastName(request.lastName());
        if (request.jobTitle() != null) user.setJobTitle(request.jobTitle());
        if (request.department() != null) user.setDepartment(request.department());
        if (request.officeLocation() != null) user.setOfficeLocation(request.officeLocation());
        if (request.employeeId() != null) user.setEmployeeId(request.employeeId());
        if (request.employeeType() != null) user.setEmployeeType(request.employeeType());
        if (request.managerId() != null) user.setManagerId(request.managerId());
    }

    private UserProfileDTO enrichWithManager(UserProfileDTO dto) {
        if (dto.manager() == null && dto.id() != null) {
            // Get manager info from repository
            UserProfileEntity user = userProfileRepository.findById(dto.id()).orElse(null);
            if (user != null && user.getManagerId() != null) {
                UserProfileEntity manager = userProfileRepository.findById(user.getManagerId()).orElse(null);
                if (manager != null) {
                    return UserProfileDTO.builder()
                        .id(dto.id())
                        .keycloakId(dto.keycloakId())
                        .tenantId(dto.tenantId())
                        .email(dto.email())
                        .emailVerified(dto.emailVerified())
                        .firstName(dto.firstName())
                        .lastName(dto.lastName())
                        .fullName(dto.fullName())
                        .displayName(dto.displayName())
                        .jobTitle(dto.jobTitle())
                        .department(dto.department())
                        .phone(dto.phone())
                        .mobile(dto.mobile())
                        .officeLocation(dto.officeLocation())
                        .employeeId(dto.employeeId())
                        .employeeType(dto.employeeType())
                        .manager(UserProfileDTO.ManagerDTO.builder()
                            .id(manager.getId())
                            .displayName(manager.getFullName())
                            .email(manager.getEmail())
                            .build())
                        .avatarUrl(dto.avatarUrl())
                        .timezone(dto.timezone())
                        .locale(dto.locale())
                        .mfaEnabled(dto.mfaEnabled())
                        .mfaMethods(dto.mfaMethods())
                        .status(dto.status())
                        .lastLoginAt(dto.lastLoginAt())
                        .createdAt(dto.createdAt())
                        .updatedAt(dto.updatedAt())
                        .build();
                }
            }
        }
        return dto;
    }
}
