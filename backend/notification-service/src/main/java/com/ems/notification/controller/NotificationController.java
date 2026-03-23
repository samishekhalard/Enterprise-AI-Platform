package com.ems.notification.controller;

import com.ems.notification.dto.NotificationDTO;
import com.ems.notification.dto.SendNotificationRequest;
import com.ems.notification.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "Notification management APIs")
public class NotificationController {

    private final NotificationService notificationService;

    @PostMapping
    @Operation(summary = "Send notification", description = "Send a new notification")
    public ResponseEntity<NotificationDTO> sendNotification(
            @Valid @RequestBody SendNotificationRequest request) {
        NotificationDTO notification = notificationService.send(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(notification);
    }

    @PostMapping("/async")
    @Operation(summary = "Send notification asynchronously", description = "Queue a notification for async delivery")
    public ResponseEntity<Void> sendNotificationAsync(
            @Valid @RequestBody SendNotificationRequest request) {
        notificationService.sendAsync(request);
        return ResponseEntity.accepted().build();
    }

    @GetMapping("/{notificationId}")
    @Operation(summary = "Get notification", description = "Retrieve a specific notification by ID")
    public ResponseEntity<NotificationDTO> getNotification(@PathVariable UUID notificationId) {
        NotificationDTO notification = notificationService.getNotification(notificationId);
        return ResponseEntity.ok(notification);
    }

    @GetMapping
    @Operation(summary = "List user notifications", description = "Get notifications for a user")
    public ResponseEntity<List<NotificationDTO>> getUserNotifications(
            @RequestHeader("X-Tenant-ID") String tenantId,
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        UUID userId = getAuthenticatedUserId(jwt);
        List<NotificationDTO> notifications = notificationService.getUserNotifications(
            tenantId, userId, type, page, size);
        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/unread")
    @Operation(summary = "Get unread notifications", description = "Get unread in-app notifications for a user")
    public ResponseEntity<List<NotificationDTO>> getUnreadNotifications(
            @RequestHeader("X-Tenant-ID") String tenantId,
            @AuthenticationPrincipal Jwt jwt) {
        UUID userId = getAuthenticatedUserId(jwt);
        List<NotificationDTO> notifications = notificationService.getUnreadNotifications(tenantId, userId);
        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/unread/count")
    @Operation(summary = "Get unread count", description = "Get count of unread in-app notifications")
    public ResponseEntity<Long> getUnreadCount(
            @RequestHeader("X-Tenant-ID") String tenantId,
            @AuthenticationPrincipal Jwt jwt) {
        UUID userId = getAuthenticatedUserId(jwt);
        long count = notificationService.getUnreadCount(tenantId, userId);
        return ResponseEntity.ok(count);
    }

    @PostMapping("/{notificationId}/read")
    @Operation(summary = "Mark as read", description = "Mark a notification as read")
    public ResponseEntity<Void> markAsRead(@PathVariable UUID notificationId) {
        notificationService.markAsRead(notificationId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/read-all")
    @Operation(summary = "Mark all as read", description = "Mark all in-app notifications as read")
    public ResponseEntity<Void> markAllAsRead(
            @RequestHeader("X-Tenant-ID") String tenantId,
            @AuthenticationPrincipal Jwt jwt) {
        UUID userId = getAuthenticatedUserId(jwt);
        notificationService.markAllAsRead(tenantId, userId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{notificationId}")
    @Operation(summary = "Delete notification", description = "Delete a notification")
    public ResponseEntity<Void> deleteNotification(@PathVariable UUID notificationId) {
        notificationService.deleteNotification(notificationId);
        return ResponseEntity.noContent().build();
    }

    private UUID getAuthenticatedUserId(Jwt jwt) {
        if (jwt == null || jwt.getSubject() == null || jwt.getSubject().isBlank()) {
            throw new IllegalArgumentException("Authenticated JWT subject is required");
        }
        return UUID.fromString(jwt.getSubject());
    }
}
