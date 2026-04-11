package com.ems.notification.scheduler;

import com.ems.notification.service.NotificationService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("NotificationScheduler Unit Tests")
class NotificationSchedulerTest {

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private NotificationScheduler notificationScheduler;

    @Test
    @DisplayName("processScheduledNotifications - Should delegate to service")
    void processScheduledNotifications_shouldDelegateToService() {
        // Arrange
        when(notificationService.processScheduledNotifications()).thenReturn(3);

        // Act
        notificationScheduler.processScheduledNotifications();

        // Assert
        verify(notificationService).processScheduledNotifications();
    }

    @Test
    @DisplayName("processScheduledNotifications - Should handle exception gracefully")
    void processScheduledNotifications_whenExceptionThrown_shouldHandleGracefully() {
        // Arrange
        when(notificationService.processScheduledNotifications())
                .thenThrow(new RuntimeException("DB connection error"));

        // Act - should not throw
        notificationScheduler.processScheduledNotifications();

        // Assert
        verify(notificationService).processScheduledNotifications();
    }

    @Test
    @DisplayName("retryFailedNotifications - Should delegate to service")
    void retryFailedNotifications_shouldDelegateToService() {
        // Arrange
        when(notificationService.retryFailedNotifications()).thenReturn(2);

        // Act
        notificationScheduler.retryFailedNotifications();

        // Assert
        verify(notificationService).retryFailedNotifications();
    }

    @Test
    @DisplayName("retryFailedNotifications - Should handle exception gracefully")
    void retryFailedNotifications_whenExceptionThrown_shouldHandleGracefully() {
        // Arrange
        when(notificationService.retryFailedNotifications())
                .thenThrow(new RuntimeException("Connection refused"));

        // Act - should not throw
        notificationScheduler.retryFailedNotifications();

        // Assert
        verify(notificationService).retryFailedNotifications();
    }

    @Test
    @DisplayName("purgeExpiredNotifications - Should delegate to service")
    void purgeExpiredNotifications_shouldDelegateToService() {
        // Arrange
        when(notificationService.purgeExpiredNotifications()).thenReturn(50);

        // Act
        notificationScheduler.purgeExpiredNotifications();

        // Assert
        verify(notificationService).purgeExpiredNotifications();
    }

    @Test
    @DisplayName("purgeExpiredNotifications - Should handle exception gracefully")
    void purgeExpiredNotifications_whenExceptionThrown_shouldHandleGracefully() {
        // Arrange
        when(notificationService.purgeExpiredNotifications())
                .thenThrow(new RuntimeException("Timeout"));

        // Act - should not throw
        notificationScheduler.purgeExpiredNotifications();

        // Assert
        verify(notificationService).purgeExpiredNotifications();
    }
}
