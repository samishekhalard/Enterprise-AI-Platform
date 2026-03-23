package com.ems.notification.service;

import com.ems.notification.dto.NotificationDTO;
import com.ems.notification.dto.SendNotificationRequest;

import java.util.List;
import java.util.UUID;

public interface NotificationService {

    NotificationDTO send(SendNotificationRequest request);

    NotificationDTO sendAsync(SendNotificationRequest request);

    NotificationDTO getNotification(UUID notificationId);

    List<NotificationDTO> getUserNotifications(String tenantId, UUID userId, String type, int page, int size);

    List<NotificationDTO> getUnreadNotifications(String tenantId, UUID userId);

    long getUnreadCount(String tenantId, UUID userId);

    void markAsRead(UUID notificationId);

    void markAllAsRead(String tenantId, UUID userId);

    void deleteNotification(UUID notificationId);

    int processScheduledNotifications();

    int retryFailedNotifications();

    int purgeExpiredNotifications();
}
