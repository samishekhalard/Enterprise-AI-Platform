package com.ems.user.controller;

import com.ems.user.dto.CreateUserRequest;
import com.ems.user.dto.UserDeviceDTO;
import com.ems.user.dto.UserListResponse;
import com.ems.user.dto.UserProfileDTO;
import com.ems.user.dto.UserProfileUpdateRequest;
import com.ems.user.dto.UserSessionDTO;
import com.ems.user.service.DeviceService;
import com.ems.user.service.SessionService;
import com.ems.user.service.UserProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "User Management", description = "APIs for managing users, sessions, and devices")
public class UserController {

    private final UserProfileService userProfileService;
    private final SessionService sessionService;
    private final DeviceService deviceService;

    // =========================================================================
    // Current User (Self-Service) Endpoints
    // =========================================================================

    @GetMapping("/users/me")
    @Operation(summary = "Get current user profile")
    public ResponseEntity<UserProfileDTO> getCurrentUser(
        @AuthenticationPrincipal Jwt jwt,
        @RequestHeader("X-Tenant-ID") String tenantId
    ) {
        UUID keycloakId = getAuthenticatedUserId(jwt);
        return ResponseEntity.ok(userProfileService.getCurrentUser(keycloakId, tenantId));
    }

    @PatchMapping("/users/me")
    @Operation(summary = "Update current user profile (self-service fields only)")
    public ResponseEntity<UserProfileDTO> updateCurrentUser(
        @AuthenticationPrincipal Jwt jwt,
        @RequestHeader("X-Tenant-ID") String tenantId,
        @Valid @RequestBody UserProfileUpdateRequest request
    ) {
        UUID keycloakId = getAuthenticatedUserId(jwt);
        return ResponseEntity.ok(userProfileService.updateCurrentUser(keycloakId, tenantId, request));
    }

    @GetMapping("/users/me/sessions")
    @Operation(summary = "List current user's active sessions")
    public ResponseEntity<List<UserSessionDTO>> getCurrentUserSessions(
        @AuthenticationPrincipal Jwt jwt,
        @RequestHeader("X-Tenant-ID") String tenantId,
        @RequestHeader(value = "X-Session-Token", required = false) String currentSessionToken
    ) {
        UUID keycloakId = getAuthenticatedUserId(jwt);
        return ResponseEntity.ok(sessionService.getCurrentUserSessions(keycloakId, tenantId, currentSessionToken));
    }

    @DeleteMapping("/users/me/sessions/{sessionId}")
    @Operation(summary = "Revoke current user's session")
    public ResponseEntity<Void> revokeCurrentUserSession(
        @PathVariable UUID sessionId,
        @AuthenticationPrincipal Jwt jwt,
        @RequestHeader("X-Tenant-ID") String tenantId
    ) {
        UUID keycloakId = getAuthenticatedUserId(jwt);
        sessionService.revokeSession(sessionId, keycloakId, tenantId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/users/me/devices")
    @Operation(summary = "List current user's devices")
    public ResponseEntity<List<UserDeviceDTO>> getCurrentUserDevices(
        @AuthenticationPrincipal Jwt jwt,
        @RequestHeader("X-Tenant-ID") String tenantId
    ) {
        UUID keycloakId = getAuthenticatedUserId(jwt);
        return ResponseEntity.ok(deviceService.getCurrentUserDevices(keycloakId, tenantId));
    }

    @PostMapping("/users/me/devices/{deviceId}/trust")
    @Operation(summary = "Trust a device")
    public ResponseEntity<UserDeviceDTO> trustDevice(
        @PathVariable UUID deviceId,
        @AuthenticationPrincipal Jwt jwt,
        @RequestHeader("X-Tenant-ID") String tenantId
    ) {
        UUID keycloakId = getAuthenticatedUserId(jwt);
        return ResponseEntity.ok(deviceService.trustDevice(deviceId, keycloakId, tenantId));
    }

    @DeleteMapping("/users/me/devices/{deviceId}")
    @Operation(summary = "Remove a device")
    public ResponseEntity<Void> removeDevice(
        @PathVariable UUID deviceId,
        @AuthenticationPrincipal Jwt jwt,
        @RequestHeader("X-Tenant-ID") String tenantId
    ) {
        UUID keycloakId = getAuthenticatedUserId(jwt);
        deviceService.removeDevice(deviceId, keycloakId, tenantId);
        return ResponseEntity.noContent().build();
    }

    // =========================================================================
    // Admin Endpoints
    // =========================================================================

    @GetMapping("/users")
    @Operation(summary = "List users (admin)")
    public ResponseEntity<UserListResponse> listUsers(
        @RequestHeader("X-Tenant-ID") String tenantId,
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "20") int limit,
        @RequestParam(required = false) String search
    ) {
        PageRequest pageable = PageRequest.of(page - 1, limit, Sort.by("createdAt").descending());
        return ResponseEntity.ok(userProfileService.listUsers(tenantId, search, pageable));
    }

    @GetMapping("/users/{userId}")
    @Operation(summary = "Get user by ID (admin)")
    public ResponseEntity<UserProfileDTO> getUserById(
        @PathVariable UUID userId,
        @RequestHeader("X-Tenant-ID") String tenantId
    ) {
        return ResponseEntity.ok(userProfileService.getUserById(userId, tenantId));
    }

    @PostMapping("/users")
    @Operation(summary = "Create user (admin)")
    public ResponseEntity<UserProfileDTO> createUser(
        @RequestHeader("X-Tenant-ID") String tenantId,
        @AuthenticationPrincipal Jwt jwt,
        @Valid @RequestBody CreateUserRequest request
    ) {
        UUID keycloakId = getAuthenticatedUserId(jwt);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(userProfileService.createUser(tenantId, request, keycloakId));
    }

    @PatchMapping("/users/{userId}")
    @Operation(summary = "Update user (admin)")
    public ResponseEntity<UserProfileDTO> updateUser(
        @PathVariable UUID userId,
        @RequestHeader("X-Tenant-ID") String tenantId,
        @Valid @RequestBody UserProfileUpdateRequest request
    ) {
        return ResponseEntity.ok(userProfileService.updateUser(userId, tenantId, request));
    }

    @DeleteMapping("/users/{userId}")
    @Operation(summary = "Delete user (admin)")
    public ResponseEntity<Void> deleteUser(
        @PathVariable UUID userId,
        @RequestHeader("X-Tenant-ID") String tenantId
    ) {
        userProfileService.deleteUser(userId, tenantId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/users/{userId}/enable")
    @Operation(summary = "Enable user (admin)")
    public ResponseEntity<Void> enableUser(
        @PathVariable UUID userId,
        @RequestHeader("X-Tenant-ID") String tenantId
    ) {
        userProfileService.enableUser(userId, tenantId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/users/{userId}/disable")
    @Operation(summary = "Disable user (admin)")
    public ResponseEntity<Void> disableUser(
        @PathVariable UUID userId,
        @RequestHeader("X-Tenant-ID") String tenantId
    ) {
        userProfileService.disableUser(userId, tenantId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/users/{userId}/sessions")
    @Operation(summary = "List user's sessions (admin)")
    public ResponseEntity<List<UserSessionDTO>> getUserSessions(
        @PathVariable UUID userId,
        @RequestHeader("X-Tenant-ID") String tenantId
    ) {
        return ResponseEntity.ok(sessionService.getUserSessions(userId, tenantId));
    }

    @DeleteMapping("/users/{userId}/sessions")
    @Operation(summary = "Revoke all user's sessions (admin)")
    public ResponseEntity<Void> revokeAllUserSessions(
        @PathVariable UUID userId,
        @RequestHeader("X-Tenant-ID") String tenantId,
        @AuthenticationPrincipal Jwt jwt
    ) {
        UUID keycloakId = getAuthenticatedUserId(jwt);
        sessionService.revokeAllUserSessions(userId, tenantId, keycloakId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/users/{userId}/devices")
    @Operation(summary = "List user's devices (admin)")
    public ResponseEntity<List<UserDeviceDTO>> getUserDevices(
        @PathVariable UUID userId,
        @RequestHeader("X-Tenant-ID") String tenantId
    ) {
        return ResponseEntity.ok(deviceService.getUserDevices(userId, tenantId));
    }

    @PostMapping("/users/{userId}/devices/{deviceId}/block")
    @Operation(summary = "Block user's device (admin)")
    public ResponseEntity<Void> blockDevice(
        @PathVariable UUID userId,
        @PathVariable UUID deviceId,
        @RequestHeader("X-Tenant-ID") String tenantId,
        @AuthenticationPrincipal Jwt jwt
    ) {
        UUID keycloakId = getAuthenticatedUserId(jwt);
        deviceService.blockDevice(deviceId, userId, tenantId, keycloakId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/users/{userId}/devices/{deviceId}/approve")
    @Operation(summary = "Approve user's device (admin)")
    public ResponseEntity<Void> approveDevice(
        @PathVariable UUID userId,
        @PathVariable UUID deviceId,
        @RequestHeader("X-Tenant-ID") String tenantId,
        @AuthenticationPrincipal Jwt jwt
    ) {
        UUID keycloakId = getAuthenticatedUserId(jwt);
        deviceService.approveDevice(deviceId, userId, tenantId, keycloakId);
        return ResponseEntity.noContent().build();
    }

    // =========================================================================
    // Tenant Admin Endpoints
    // =========================================================================

    @GetMapping("/admin/sessions")
    @Operation(summary = "List all tenant sessions (tenant admin)")
    public ResponseEntity<List<UserSessionDTO>> getTenantSessions(
        @RequestHeader("X-Tenant-ID") String tenantId
    ) {
        return ResponseEntity.ok(sessionService.getTenantSessions(tenantId));
    }

    @DeleteMapping("/admin/sessions")
    @Operation(summary = "Revoke all tenant sessions (tenant admin)")
    public ResponseEntity<Void> revokeAllTenantSessions(
        @RequestHeader("X-Tenant-ID") String tenantId,
        @AuthenticationPrincipal Jwt jwt
    ) {
        UUID keycloakId = getAuthenticatedUserId(jwt);
        sessionService.revokeAllTenantSessions(tenantId, keycloakId);
        return ResponseEntity.noContent().build();
    }

    // =========================================================================
    // Sync Endpoints (Internal)
    // =========================================================================

    @PostMapping("/internal/users/{keycloakId}/sync")
    @Operation(summary = "Sync user from Keycloak (internal)")
    public ResponseEntity<UserProfileDTO> syncFromKeycloak(
        @PathVariable UUID keycloakId,
        @RequestHeader("X-Tenant-ID") String tenantId
    ) {
        return ResponseEntity.ok(userProfileService.syncFromKeycloak(keycloakId, tenantId));
    }

    private UUID getAuthenticatedUserId(Jwt jwt) {
        if (jwt == null || jwt.getSubject() == null || jwt.getSubject().isBlank()) {
            throw new IllegalArgumentException("Authenticated JWT subject is required");
        }
        return UUID.fromString(jwt.getSubject());
    }
}
