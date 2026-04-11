package com.ems.audit.scheduler;

import com.ems.audit.service.AuditService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuditPurgeScheduler Unit Tests")
class AuditPurgeSchedulerTest {

    @Mock
    private AuditService auditService;

    @InjectMocks
    private AuditPurgeScheduler scheduler;

    @Nested
    @DisplayName("purgeExpiredEvents")
    class PurgeExpiredEvents {

        @Test
        @DisplayName("purgeExpiredEvents_shouldDelegateToService")
        void purgeExpiredEvents_shouldDelegateToService() {
            // Arrange
            when(auditService.purgeExpiredEvents()).thenReturn(15);

            // Act
            scheduler.purgeExpiredEvents();

            // Assert
            verify(auditService).purgeExpiredEvents();
        }

        @Test
        @DisplayName("purgeExpiredEvents_whenServiceThrows_shouldNotPropagateException")
        void purgeExpiredEvents_whenServiceThrows_shouldNotPropagateException() {
            // Arrange
            when(auditService.purgeExpiredEvents()).thenThrow(new RuntimeException("DB connection failed"));

            // Act & Assert - should not throw
            scheduler.purgeExpiredEvents();

            // Assert
            verify(auditService).purgeExpiredEvents();
        }

        @Test
        @DisplayName("purgeExpiredEvents_whenZeroDeleted_shouldCompleteSuccessfully")
        void purgeExpiredEvents_whenZeroDeleted_shouldCompleteSuccessfully() {
            // Arrange
            when(auditService.purgeExpiredEvents()).thenReturn(0);

            // Act
            scheduler.purgeExpiredEvents();

            // Assert
            verify(auditService).purgeExpiredEvents();
        }
    }
}
