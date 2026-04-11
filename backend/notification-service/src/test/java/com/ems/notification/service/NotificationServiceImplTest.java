package com.ems.notification.service;

import com.ems.common.exception.ResourceNotFoundException;
import com.ems.notification.dto.NotificationDTO;
import com.ems.notification.dto.SendNotificationRequest;
import com.ems.notification.entity.NotificationEntity;
import com.ems.notification.entity.NotificationPreferenceEntity;
import com.ems.notification.entity.NotificationTemplateEntity;
import com.ems.notification.mapper.NotificationMapper;
import com.ems.notification.repository.NotificationPreferenceRepository;
import com.ems.notification.repository.NotificationRepository;
import com.ems.notification.repository.NotificationTemplateRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.thymeleaf.spring6.SpringTemplateEngine;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("NotificationServiceImpl Unit Tests")
class NotificationServiceImplTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private NotificationTemplateRepository templateRepository;

    @Mock
    private NotificationPreferenceRepository preferenceRepository;

    @Mock
    private NotificationMapper mapper;

    @Mock
    private EmailService emailService;

    @Mock
    private SpringTemplateEngine templateEngine;

    @InjectMocks
    private NotificationServiceImpl notificationService;

    private static final String TENANT_ID = "tenant-1";
    private static final UUID USER_ID = UUID.randomUUID();
    private static final UUID NOTIFICATION_ID = UUID.randomUUID();

    private SendNotificationRequest buildEmailRequest() {
        return SendNotificationRequest.builder()
                .tenantId(TENANT_ID)
                .userId(USER_ID)
                .type("EMAIL")
                .category("SYSTEM")
                .subject("Test Subject")
                .body("Test Body")
                .recipientAddress("user@example.com")
                .priority("NORMAL")
                .build();
    }

    private NotificationEntity buildNotificationEntity(String type) {
        return NotificationEntity.builder()
                .id(NOTIFICATION_ID)
                .tenantId(TENANT_ID)
                .userId(USER_ID)
                .type(type)
                .category("SYSTEM")
                .subject("Test Subject")
                .body("Test Body")
                .recipientAddress("user@example.com")
                .status("PENDING")
                .priority("NORMAL")
                .retryCount(0)
                .maxRetries(3)
                .expiresAt(Instant.now().plus(72, ChronoUnit.HOURS))
                .build();
    }

    private NotificationDTO buildNotificationDTO() {
        return NotificationDTO.builder()
                .id(NOTIFICATION_ID)
                .tenantId(TENANT_ID)
                .userId(USER_ID)
                .type("EMAIL")
                .category("SYSTEM")
                .subject("Test Subject")
                .body("Test Body")
                .status("SENT")
                .build();
    }

    @Nested
    @DisplayName("send()")
    class Send {

        @Test
        @DisplayName("Should send email notification successfully when no preferences block it")
        void send_whenEmailType_shouldSendEmailAndReturnDTO() {
            // Arrange
            SendNotificationRequest request = buildEmailRequest();
            NotificationEntity entity = buildNotificationEntity("EMAIL");
            NotificationDTO expectedDTO = buildNotificationDTO();

            when(preferenceRepository.findByTenantIdAndUserId(TENANT_ID, USER_ID))
                    .thenReturn(Optional.empty());
            when(mapper.toEntity(request)).thenReturn(entity);
            when(notificationRepository.save(any(NotificationEntity.class))).thenReturn(entity);
            when(mapper.toDTO(any(NotificationEntity.class))).thenReturn(expectedDTO);

            // Act
            NotificationDTO result = notificationService.send(request);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.id()).isEqualTo(NOTIFICATION_ID);
            verify(emailService).sendEmail("user@example.com", "Test Subject", "Test Body", null);
            verify(notificationRepository, times(2)).save(any(NotificationEntity.class));
        }

        @Test
        @DisplayName("Should return null when user preferences block email notifications")
        void send_whenEmailDisabledByPreferences_shouldReturnNull() {
            // Arrange
            SendNotificationRequest request = buildEmailRequest();
            NotificationPreferenceEntity prefs = NotificationPreferenceEntity.builder()
                    .tenantId(TENANT_ID)
                    .userId(USER_ID)
                    .emailEnabled(false)
                    .build();

            when(preferenceRepository.findByTenantIdAndUserId(TENANT_ID, USER_ID))
                    .thenReturn(Optional.of(prefs));

            // Act
            NotificationDTO result = notificationService.send(request);

            // Assert
            assertThat(result).isNull();
            verify(notificationRepository, never()).save(any());
            verify(emailService, never()).sendEmail(anyString(), anyString(), anyString(), anyString());
        }

        @Test
        @DisplayName("Should mark IN_APP notification as DELIVERED immediately")
        void send_whenInAppType_shouldMarkAsDelivered() {
            // Arrange
            SendNotificationRequest request = SendNotificationRequest.builder()
                    .tenantId(TENANT_ID)
                    .userId(USER_ID)
                    .type("IN_APP")
                    .subject("Alert")
                    .body("In-app message")
                    .build();
            NotificationEntity entity = buildNotificationEntity("IN_APP");
            NotificationDTO expectedDTO = buildNotificationDTO();

            when(preferenceRepository.findByTenantIdAndUserId(TENANT_ID, USER_ID))
                    .thenReturn(Optional.empty());
            when(mapper.toEntity(request)).thenReturn(entity);
            when(notificationRepository.save(any(NotificationEntity.class))).thenReturn(entity);
            when(mapper.toDTO(any(NotificationEntity.class))).thenReturn(expectedDTO);

            // Act
            notificationService.send(request);

            // Assert
            ArgumentCaptor<NotificationEntity> captor = ArgumentCaptor.forClass(NotificationEntity.class);
            verify(notificationRepository, atLeast(2)).save(captor.capture());
            NotificationEntity saved = captor.getAllValues().get(captor.getAllValues().size() - 1);
            assertThat(saved.getStatus()).isEqualTo("DELIVERED");
            assertThat(saved.getDeliveredAt()).isNotNull();
        }

        @Test
        @DisplayName("Should set default category to SYSTEM when not provided")
        void send_whenNoCategoryProvided_shouldDefaultToSystem() {
            // Arrange
            SendNotificationRequest request = SendNotificationRequest.builder()
                    .tenantId(TENANT_ID)
                    .userId(USER_ID)
                    .type("IN_APP")
                    .subject("Alert")
                    .body("Body")
                    .build();
            NotificationEntity entity = NotificationEntity.builder()
                    .id(NOTIFICATION_ID)
                    .tenantId(TENANT_ID)
                    .userId(USER_ID)
                    .type("IN_APP")
                    .subject("Alert")
                    .body("Body")
                    .build();

            when(preferenceRepository.findByTenantIdAndUserId(TENANT_ID, USER_ID))
                    .thenReturn(Optional.empty());
            when(mapper.toEntity(request)).thenReturn(entity);
            when(notificationRepository.save(any(NotificationEntity.class))).thenReturn(entity);
            when(mapper.toDTO(any(NotificationEntity.class))).thenReturn(buildNotificationDTO());

            // Act
            notificationService.send(request);

            // Assert
            ArgumentCaptor<NotificationEntity> captor = ArgumentCaptor.forClass(NotificationEntity.class);
            verify(notificationRepository, atLeastOnce()).save(captor.capture());
            assertThat(captor.getAllValues().get(0).getCategory()).isEqualTo("SYSTEM");
        }

        @Test
        @DisplayName("Should use custom expiration hours when provided in request")
        void send_whenExpiresInHoursProvided_shouldUseCustomExpiration() {
            // Arrange
            SendNotificationRequest request = SendNotificationRequest.builder()
                    .tenantId(TENANT_ID)
                    .userId(USER_ID)
                    .type("IN_APP")
                    .subject("Alert")
                    .body("Body")
                    .expiresInHours(24)
                    .build();
            NotificationEntity entity = NotificationEntity.builder()
                    .id(NOTIFICATION_ID)
                    .tenantId(TENANT_ID)
                    .userId(USER_ID)
                    .type("IN_APP")
                    .subject("Alert")
                    .body("Body")
                    .build();

            when(preferenceRepository.findByTenantIdAndUserId(TENANT_ID, USER_ID))
                    .thenReturn(Optional.empty());
            when(mapper.toEntity(request)).thenReturn(entity);
            when(notificationRepository.save(any(NotificationEntity.class))).thenReturn(entity);
            when(mapper.toDTO(any(NotificationEntity.class))).thenReturn(buildNotificationDTO());

            Instant before = Instant.now().plus(23, ChronoUnit.HOURS);

            // Act
            notificationService.send(request);

            // Assert
            ArgumentCaptor<NotificationEntity> captor = ArgumentCaptor.forClass(NotificationEntity.class);
            verify(notificationRepository, atLeastOnce()).save(captor.capture());
            Instant expiresAt = captor.getAllValues().get(0).getExpiresAt();
            assertThat(expiresAt).isAfter(before);
            assertThat(expiresAt).isBefore(Instant.now().plus(25, ChronoUnit.HOURS));
        }

        @Test
        @DisplayName("Should throw exception when email recipient address is missing")
        void send_whenEmailWithNoRecipient_shouldThrowException() {
            // Arrange
            SendNotificationRequest request = SendNotificationRequest.builder()
                    .tenantId(TENANT_ID)
                    .userId(USER_ID)
                    .type("EMAIL")
                    .subject("Subject")
                    .body("Body")
                    .build();
            NotificationEntity entity = NotificationEntity.builder()
                    .id(NOTIFICATION_ID)
                    .tenantId(TENANT_ID)
                    .userId(USER_ID)
                    .type("EMAIL")
                    .subject("Subject")
                    .body("Body")
                    .status("PENDING")
                    .retryCount(0)
                    .maxRetries(3)
                    .build();

            when(preferenceRepository.findByTenantIdAndUserId(TENANT_ID, USER_ID))
                    .thenReturn(Optional.empty());
            when(mapper.toEntity(request)).thenReturn(entity);
            when(notificationRepository.save(any(NotificationEntity.class))).thenReturn(entity);

            // Act & Assert
            assertThatThrownBy(() -> notificationService.send(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Email recipient address is required");
        }

        @Test
        @DisplayName("Should process template when templateId is provided")
        void send_whenTemplateIdProvided_shouldProcessTemplate() {
            // Arrange
            UUID templateId = UUID.randomUUID();
            SendNotificationRequest request = SendNotificationRequest.builder()
                    .tenantId(TENANT_ID)
                    .userId(USER_ID)
                    .type("IN_APP")
                    .subject("Subject")
                    .body("Body")
                    .templateId(templateId)
                    .templateData(Map.of("name", "John"))
                    .build();
            NotificationEntity entity = buildNotificationEntity("IN_APP");
            NotificationTemplateEntity template = NotificationTemplateEntity.builder()
                    .id(templateId)
                    .subjectTemplate("Hello [[${name}]]")
                    .bodyTemplate("Welcome [[${name}]]")
                    .bodyHtmlTemplate("<h1>Welcome [[${name}]]</h1>")
                    .build();

            when(preferenceRepository.findByTenantIdAndUserId(TENANT_ID, USER_ID))
                    .thenReturn(Optional.empty());
            when(mapper.toEntity(request)).thenReturn(entity);
            when(templateRepository.findById(templateId)).thenReturn(Optional.of(template));
            when(templateEngine.process(anyString(), any())).thenReturn("Processed");
            when(notificationRepository.save(any(NotificationEntity.class))).thenReturn(entity);
            when(mapper.toDTO(any(NotificationEntity.class))).thenReturn(buildNotificationDTO());

            // Act
            notificationService.send(request);

            // Assert
            verify(templateRepository).findById(templateId);
            verify(templateEngine, times(3)).process(anyString(), any());
        }

        @Test
        @DisplayName("Should not process scheduled notification if scheduledAt is in the future")
        void send_whenScheduledInFuture_shouldNotProcess() {
            // Arrange
            SendNotificationRequest request = SendNotificationRequest.builder()
                    .tenantId(TENANT_ID)
                    .userId(USER_ID)
                    .type("EMAIL")
                    .subject("Subject")
                    .body("Body")
                    .recipientAddress("user@example.com")
                    .scheduledAt(Instant.now().plus(1, ChronoUnit.DAYS))
                    .build();
            NotificationEntity entity = buildNotificationEntity("EMAIL");
            entity.setScheduledAt(Instant.now().plus(1, ChronoUnit.DAYS));

            when(preferenceRepository.findByTenantIdAndUserId(TENANT_ID, USER_ID))
                    .thenReturn(Optional.empty());
            when(mapper.toEntity(request)).thenReturn(entity);
            when(notificationRepository.save(any(NotificationEntity.class))).thenReturn(entity);
            when(mapper.toDTO(any(NotificationEntity.class))).thenReturn(buildNotificationDTO());

            // Act
            notificationService.send(request);

            // Assert
            verify(emailService, never()).sendEmail(anyString(), anyString(), anyString(), anyString());
            verify(notificationRepository, times(1)).save(any(NotificationEntity.class));
        }
    }

    @Nested
    @DisplayName("Preference-based filtering")
    class PreferenceFiltering {

        @ParameterizedTest(name = "channel={0}, enabled={1}, categoryField=SYSTEM")
        @CsvSource({
                "EMAIL,   true,  true",
                "EMAIL,   false, true",
                "PUSH,    true,  true",
                "PUSH,    false, true",
                "SMS,     true,  true",
                "SMS,     false, true",
                "IN_APP,  true,  true",
                "IN_APP,  false, true"
        })
        @DisplayName("Should respect channel-level preferences for each notification type")
        void send_shouldRespectChannelPreferences(String type, boolean channelEnabled, boolean categoryEnabled) {
            // Arrange
            SendNotificationRequest request = SendNotificationRequest.builder()
                    .tenantId(TENANT_ID)
                    .userId(USER_ID)
                    .type(type)
                    .category("SYSTEM")
                    .subject("Subject")
                    .body("Body")
                    .recipientAddress("user@example.com")
                    .build();

            NotificationPreferenceEntity prefs = NotificationPreferenceEntity.builder()
                    .tenantId(TENANT_ID)
                    .userId(USER_ID)
                    .emailEnabled(type.equals("EMAIL") ? channelEnabled : true)
                    .pushEnabled(type.equals("PUSH") ? channelEnabled : true)
                    .smsEnabled(type.equals("SMS") ? channelEnabled : true)
                    .inAppEnabled(type.equals("IN_APP") ? channelEnabled : true)
                    .systemNotifications(categoryEnabled)
                    .marketingNotifications(true)
                    .transactionalNotifications(true)
                    .alertNotifications(true)
                    .build();

            when(preferenceRepository.findByTenantIdAndUserId(TENANT_ID, USER_ID))
                    .thenReturn(Optional.of(prefs));

            if (channelEnabled && categoryEnabled) {
                NotificationEntity entity = buildNotificationEntity(type);
                when(mapper.toEntity(request)).thenReturn(entity);
                when(notificationRepository.save(any(NotificationEntity.class))).thenReturn(entity);
                when(mapper.toDTO(any(NotificationEntity.class))).thenReturn(buildNotificationDTO());
            }

            // Act
            NotificationDTO result = notificationService.send(request);

            // Assert
            if (!channelEnabled) {
                assertThat(result).isNull();
                verify(notificationRepository, never()).save(any());
            } else {
                verify(notificationRepository, atLeastOnce()).save(any());
            }
        }

        @ParameterizedTest(name = "category={0}, enabled={1}")
        @CsvSource({
                "MARKETING,     false",
                "TRANSACTIONAL, true",
                "ALERT,         true"
        })
        @DisplayName("Should respect category-level preferences")
        void send_shouldRespectCategoryPreferences(String category, boolean categoryEnabled) {
            // Arrange
            SendNotificationRequest request = SendNotificationRequest.builder()
                    .tenantId(TENANT_ID)
                    .userId(USER_ID)
                    .type("IN_APP")
                    .category(category)
                    .subject("Subject")
                    .body("Body")
                    .build();

            NotificationPreferenceEntity prefs = NotificationPreferenceEntity.builder()
                    .tenantId(TENANT_ID)
                    .userId(USER_ID)
                    .emailEnabled(true)
                    .pushEnabled(true)
                    .smsEnabled(true)
                    .inAppEnabled(true)
                    .systemNotifications(true)
                    .marketingNotifications(category.equals("MARKETING") ? categoryEnabled : true)
                    .transactionalNotifications(category.equals("TRANSACTIONAL") ? categoryEnabled : true)
                    .alertNotifications(category.equals("ALERT") ? categoryEnabled : true)
                    .build();

            when(preferenceRepository.findByTenantIdAndUserId(TENANT_ID, USER_ID))
                    .thenReturn(Optional.of(prefs));

            if (categoryEnabled) {
                NotificationEntity entity = buildNotificationEntity("IN_APP");
                when(mapper.toEntity(request)).thenReturn(entity);
                when(notificationRepository.save(any(NotificationEntity.class))).thenReturn(entity);
                when(mapper.toDTO(any(NotificationEntity.class))).thenReturn(buildNotificationDTO());
            }

            // Act
            NotificationDTO result = notificationService.send(request);

            // Assert
            if (!categoryEnabled) {
                assertThat(result).isNull();
            } else {
                verify(notificationRepository, atLeastOnce()).save(any());
            }
        }
    }

    @Nested
    @DisplayName("getNotification()")
    class GetNotification {

        @Test
        @DisplayName("Should return notification DTO when found")
        void getNotification_whenExists_shouldReturnDTO() {
            // Arrange
            NotificationEntity entity = buildNotificationEntity("EMAIL");
            NotificationDTO expectedDTO = buildNotificationDTO();

            when(notificationRepository.findById(NOTIFICATION_ID)).thenReturn(Optional.of(entity));
            when(mapper.toDTO(entity)).thenReturn(expectedDTO);

            // Act
            NotificationDTO result = notificationService.getNotification(NOTIFICATION_ID);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.id()).isEqualTo(NOTIFICATION_ID);
            verify(notificationRepository).findById(NOTIFICATION_ID);
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when notification does not exist")
        void getNotification_whenNotExists_shouldThrowException() {
            // Arrange
            UUID missingId = UUID.randomUUID();
            when(notificationRepository.findById(missingId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> notificationService.getNotification(missingId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Notification");
        }
    }

    @Nested
    @DisplayName("getUserNotifications()")
    class GetUserNotifications {

        @Test
        @DisplayName("Should return paginated notifications for user filtered by type")
        void getUserNotifications_withType_shouldFilterByType() {
            // Arrange
            NotificationEntity entity = buildNotificationEntity("EMAIL");
            Page<NotificationEntity> page = new PageImpl<>(List.of(entity));
            NotificationDTO dto = buildNotificationDTO();

            when(notificationRepository.findByTenantIdAndUserIdAndType(
                    eq(TENANT_ID), eq(USER_ID), eq("EMAIL"), any(Pageable.class)))
                    .thenReturn(page);
            when(mapper.toDTOList(List.of(entity))).thenReturn(List.of(dto));

            // Act
            List<NotificationDTO> result = notificationService.getUserNotifications(TENANT_ID, USER_ID, "EMAIL", 0, 20);

            // Assert
            assertThat(result).hasSize(1);
            verify(notificationRepository).findByTenantIdAndUserIdAndType(
                    eq(TENANT_ID), eq(USER_ID), eq("EMAIL"), any(Pageable.class));
        }

        @Test
        @DisplayName("Should return all notifications when type is null")
        void getUserNotifications_withoutType_shouldReturnAll() {
            // Arrange
            NotificationEntity entity = buildNotificationEntity("EMAIL");
            Page<NotificationEntity> page = new PageImpl<>(List.of(entity));
            NotificationDTO dto = buildNotificationDTO();

            when(notificationRepository.findByTenantIdAndUserId(
                    eq(TENANT_ID), eq(USER_ID), any(Pageable.class)))
                    .thenReturn(page);
            when(mapper.toDTOList(List.of(entity))).thenReturn(List.of(dto));

            // Act
            List<NotificationDTO> result = notificationService.getUserNotifications(TENANT_ID, USER_ID, null, 0, 20);

            // Assert
            assertThat(result).hasSize(1);
            verify(notificationRepository).findByTenantIdAndUserId(
                    eq(TENANT_ID), eq(USER_ID), any(Pageable.class));
        }

        @Test
        @DisplayName("Should cap page size at 100")
        void getUserNotifications_withLargeSize_shouldCapAt100() {
            // Arrange
            Page<NotificationEntity> page = new PageImpl<>(List.of());
            when(notificationRepository.findByTenantIdAndUserId(
                    eq(TENANT_ID), eq(USER_ID), any(Pageable.class)))
                    .thenReturn(page);
            when(mapper.toDTOList(any())).thenReturn(List.of());

            // Act
            notificationService.getUserNotifications(TENANT_ID, USER_ID, null, 0, 500);

            // Assert
            ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
            verify(notificationRepository).findByTenantIdAndUserId(eq(TENANT_ID), eq(USER_ID), captor.capture());
            assertThat(captor.getValue().getPageSize()).isEqualTo(100);
        }
    }

    @Nested
    @DisplayName("getUnreadNotifications()")
    class GetUnreadNotifications {

        @Test
        @DisplayName("Should return unread in-app notifications")
        void getUnreadNotifications_shouldReturnUnreadInApp() {
            // Arrange
            NotificationEntity entity = buildNotificationEntity("IN_APP");
            NotificationDTO dto = buildNotificationDTO();

            when(notificationRepository.findUnreadInAppNotifications(TENANT_ID, USER_ID))
                    .thenReturn(List.of(entity));
            when(mapper.toDTOList(List.of(entity))).thenReturn(List.of(dto));

            // Act
            List<NotificationDTO> result = notificationService.getUnreadNotifications(TENANT_ID, USER_ID);

            // Assert
            assertThat(result).hasSize(1);
            verify(notificationRepository).findUnreadInAppNotifications(TENANT_ID, USER_ID);
        }
    }

    @Nested
    @DisplayName("getUnreadCount()")
    class GetUnreadCount {

        @Test
        @DisplayName("Should return count of unread in-app notifications")
        void getUnreadCount_shouldReturnCount() {
            // Arrange
            when(notificationRepository.countUnreadInAppNotifications(TENANT_ID, USER_ID)).thenReturn(5L);

            // Act
            long count = notificationService.getUnreadCount(TENANT_ID, USER_ID);

            // Assert
            assertThat(count).isEqualTo(5L);
        }
    }

    @Nested
    @DisplayName("markAsRead() / markAllAsRead()")
    class MarkAsRead {

        @Test
        @DisplayName("Should call repository to mark single notification as read")
        void markAsRead_shouldDelegateToRepository() {
            // Arrange / Act
            notificationService.markAsRead(NOTIFICATION_ID);

            // Assert
            verify(notificationRepository).markAsRead(eq(NOTIFICATION_ID), any(Instant.class));
        }

        @Test
        @DisplayName("Should call repository to mark all user notifications as read")
        void markAllAsRead_shouldDelegateToRepository() {
            // Arrange / Act
            notificationService.markAllAsRead(TENANT_ID, USER_ID);

            // Assert
            verify(notificationRepository).markAllAsRead(eq(TENANT_ID), eq(USER_ID), any(Instant.class));
        }
    }

    @Nested
    @DisplayName("deleteNotification()")
    class DeleteNotification {

        @Test
        @DisplayName("Should call repository deleteById")
        void deleteNotification_shouldDelegateToRepository() {
            // Arrange / Act
            notificationService.deleteNotification(NOTIFICATION_ID);

            // Assert
            verify(notificationRepository).deleteById(NOTIFICATION_ID);
        }
    }

    @Nested
    @DisplayName("processScheduledNotifications()")
    class ProcessScheduled {

        @Test
        @DisplayName("Should process pending notifications and return count")
        void processScheduledNotifications_shouldProcessPending() {
            // Arrange
            NotificationEntity entity = buildNotificationEntity("IN_APP");
            when(notificationRepository.findPendingNotifications(any(Instant.class), any(Pageable.class)))
                    .thenReturn(List.of(entity));
            when(notificationRepository.save(any(NotificationEntity.class))).thenReturn(entity);

            // Act
            int processed = notificationService.processScheduledNotifications();

            // Assert
            assertThat(processed).isEqualTo(1);
        }

        @Test
        @DisplayName("Should continue processing even if one notification fails")
        void processScheduledNotifications_whenOneFails_shouldContinue() {
            // Arrange
            NotificationEntity failEntity = buildNotificationEntity("EMAIL");
            // no recipient address -> will throw
            failEntity.setRecipientAddress(null);

            NotificationEntity okEntity = buildNotificationEntity("IN_APP");

            when(notificationRepository.findPendingNotifications(any(Instant.class), any(Pageable.class)))
                    .thenReturn(List.of(failEntity, okEntity));
            when(notificationRepository.save(any(NotificationEntity.class)))
                    .thenReturn(failEntity)
                    .thenReturn(okEntity);

            // Act
            int processed = notificationService.processScheduledNotifications();

            // Assert
            assertThat(processed).isEqualTo(1);
        }
    }

    @Nested
    @DisplayName("retryFailedNotifications()")
    class RetryFailed {

        @Test
        @DisplayName("Should increment retry count and re-process failed notifications")
        void retryFailedNotifications_shouldIncrementRetryAndProcess() {
            // Arrange
            NotificationEntity entity = buildNotificationEntity("IN_APP");
            entity.setStatus("FAILED");
            entity.setRetryCount(1);

            when(notificationRepository.findRetryableNotifications(any(Pageable.class)))
                    .thenReturn(List.of(entity));
            when(notificationRepository.save(any(NotificationEntity.class))).thenReturn(entity);

            // Act
            int retried = notificationService.retryFailedNotifications();

            // Assert
            assertThat(retried).isEqualTo(1);
            assertThat(entity.getRetryCount()).isEqualTo(2);
        }
    }

    @Nested
    @DisplayName("purgeExpiredNotifications()")
    class PurgeExpired {

        @Test
        @DisplayName("Should return number of purged notifications")
        void purgeExpiredNotifications_shouldReturnDeletedCount() {
            // Arrange
            when(notificationRepository.deleteExpiredNotifications(any(Instant.class))).thenReturn(10);

            // Act
            int purged = notificationService.purgeExpiredNotifications();

            // Assert
            assertThat(purged).isEqualTo(10);
            verify(notificationRepository).deleteExpiredNotifications(any(Instant.class));
        }
    }
}
