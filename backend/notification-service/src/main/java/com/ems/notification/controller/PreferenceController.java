package com.ems.notification.controller;

import com.ems.notification.dto.NotificationPreferenceDTO;
import com.ems.notification.dto.UpdatePreferenceRequest;
import com.ems.notification.service.PreferenceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notification-preferences")
@RequiredArgsConstructor
@Tag(name = "Notification Preferences", description = "User notification preference APIs")
public class PreferenceController {

    private final PreferenceService preferenceService;

    @GetMapping
    @Operation(summary = "Get preferences", description = "Get notification preferences for the current user")
    public ResponseEntity<NotificationPreferenceDTO> getPreferences(
            @RequestHeader("X-Tenant-ID") String tenantId,
            @AuthenticationPrincipal Jwt jwt) {
        UUID userId = getAuthenticatedUserId(jwt);
        NotificationPreferenceDTO preferences = preferenceService.getPreferences(tenantId, userId);
        return ResponseEntity.ok(preferences);
    }

    @PutMapping
    @Operation(summary = "Update preferences", description = "Update notification preferences")
    public ResponseEntity<NotificationPreferenceDTO> updatePreferences(
            @RequestHeader("X-Tenant-ID") String tenantId,
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody UpdatePreferenceRequest request) {
        UUID userId = getAuthenticatedUserId(jwt);
        NotificationPreferenceDTO preferences = preferenceService.updatePreferences(tenantId, userId, request);
        return ResponseEntity.ok(preferences);
    }

    @PostMapping("/reset")
    @Operation(summary = "Reset preferences", description = "Reset preferences to defaults")
    public ResponseEntity<NotificationPreferenceDTO> resetPreferences(
            @RequestHeader("X-Tenant-ID") String tenantId,
            @AuthenticationPrincipal Jwt jwt) {
        UUID userId = getAuthenticatedUserId(jwt);
        NotificationPreferenceDTO preferences = preferenceService.createDefaultPreferences(tenantId, userId);
        return ResponseEntity.ok(preferences);
    }

    private UUID getAuthenticatedUserId(Jwt jwt) {
        if (jwt == null || jwt.getSubject() == null || jwt.getSubject().isBlank()) {
            throw new IllegalArgumentException("Authenticated JWT subject is required");
        }
        return UUID.fromString(jwt.getSubject());
    }
}
