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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationTemplateRepository templateRepository;
    private final NotificationPreferenceRepository preferenceRepository;
    private final NotificationMapper mapper;
    private final EmailService emailService;
    private final SpringTemplateEngine templateEngine;

    private static final int DEFAULT_EXPIRATION_HOURS = 72;

    @Override
    public NotificationDTO send(SendNotificationRequest request) {
        log.debug("Sending notification: type={}, userId={}", request.type(), request.userId());

        // Check user preferences
        if (!shouldSendNotification(request)) {
            log.debug("Notification blocked by user preferences");
            return null;
        }

        NotificationEntity entity = createNotificationEntity(request);
        entity = notificationRepository.save(entity);

        // Process immediately if not scheduled
        if (entity.getScheduledAt() == null || entity.getScheduledAt().isBefore(Instant.now())) {
            processNotification(entity);
        }

        return mapper.toDTO(entity);
    }

    @Override
    @Async
    public NotificationDTO sendAsync(SendNotificationRequest request) {
        return send(request);
    }

    @Override
    @Transactional(readOnly = true)
    public NotificationDTO getNotification(UUID notificationId) {
        NotificationEntity entity = notificationRepository.findById(notificationId)
            .orElseThrow(() -> new ResourceNotFoundException("Notification", notificationId.toString()));
        return mapper.toDTO(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationDTO> getUserNotifications(String tenantId, UUID userId, String type, int page, int size) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 100), Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<NotificationEntity> notifications;

        if (type != null && !type.isBlank()) {
            notifications = notificationRepository.findByTenantIdAndUserIdAndType(tenantId, userId, type, pageable);
        } else {
            notifications = notificationRepository.findByTenantIdAndUserId(tenantId, userId, pageable);
        }

        return mapper.toDTOList(notifications.getContent());
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationDTO> getUnreadNotifications(String tenantId, UUID userId) {
        List<NotificationEntity> notifications = notificationRepository.findUnreadInAppNotifications(tenantId, userId);
        return mapper.toDTOList(notifications);
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(String tenantId, UUID userId) {
        return notificationRepository.countUnreadInAppNotifications(tenantId, userId);
    }

    @Override
    public void markAsRead(UUID notificationId) {
        notificationRepository.markAsRead(notificationId, Instant.now());
    }

    @Override
    public void markAllAsRead(String tenantId, UUID userId) {
        notificationRepository.markAllAsRead(tenantId, userId, Instant.now());
    }

    @Override
    public void deleteNotification(UUID notificationId) {
        notificationRepository.deleteById(notificationId);
    }

    @Override
    public int processScheduledNotifications() {
        log.info("Processing scheduled notifications");
        Pageable pageable = PageRequest.of(0, 100);
        List<NotificationEntity> pending = notificationRepository.findPendingNotifications(Instant.now(), pageable);

        int processed = 0;
        for (NotificationEntity notification : pending) {
            try {
                processNotification(notification);
                processed++;
            } catch (Exception e) {
                log.error("Failed to process notification {}: {}", notification.getId(), e.getMessage());
            }
        }

        log.info("Processed {} scheduled notifications", processed);
        return processed;
    }

    @Override
    public int retryFailedNotifications() {
        log.info("Retrying failed notifications");
        Pageable pageable = PageRequest.of(0, 50);
        List<NotificationEntity> failed = notificationRepository.findRetryableNotifications(pageable);

        int retried = 0;
        for (NotificationEntity notification : failed) {
            try {
                notification.setRetryCount(notification.getRetryCount() + 1);
                processNotification(notification);
                retried++;
            } catch (Exception e) {
                log.error("Retry failed for notification {}: {}", notification.getId(), e.getMessage());
            }
        }

        log.info("Retried {} failed notifications", retried);
        return retried;
    }

    @Override
    public int purgeExpiredNotifications() {
        log.info("Purging expired notifications");
        int deleted = notificationRepository.deleteExpiredNotifications(Instant.now());
        log.info("Purged {} expired notifications", deleted);
        return deleted;
    }

    private NotificationEntity createNotificationEntity(SendNotificationRequest request) {
        NotificationEntity entity = mapper.toEntity(request);

        // Set defaults
        if (entity.getCategory() == null) {
            entity.setCategory("SYSTEM");
        }
        if (entity.getPriority() == null) {
            entity.setPriority("NORMAL");
        }
        entity.setStatus("PENDING");
        entity.setRetryCount(0);
        entity.setMaxRetries(3);

        // Set expiration
        int expirationHours = request.expiresInHours() != null ? request.expiresInHours() : DEFAULT_EXPIRATION_HOURS;
        entity.setExpiresAt(Instant.now().plus(expirationHours, ChronoUnit.HOURS));

        // Process template if provided
        if (request.templateId() != null) {
            processTemplate(entity, request);
        }

        return entity;
    }

    private void processTemplate(NotificationEntity entity, SendNotificationRequest request) {
        templateRepository.findById(request.templateId()).ifPresent(template -> {
            Map<String, Object> data = request.templateData();
            if (data != null) {
                Context context = new Context();
                data.forEach(context::setVariable);

                if (template.getSubjectTemplate() != null) {
                    entity.setSubject(templateEngine.process(template.getSubjectTemplate(), context));
                }
                if (template.getBodyTemplate() != null) {
                    entity.setBody(templateEngine.process(template.getBodyTemplate(), context));
                }
                if (template.getBodyHtmlTemplate() != null) {
                    entity.setBodyHtml(templateEngine.process(template.getBodyHtmlTemplate(), context));
                }
            }
        });
    }

    private boolean shouldSendNotification(SendNotificationRequest request) {
        return preferenceRepository.findByTenantIdAndUserId(request.tenantId(), request.userId())
            .map(pref -> isNotificationAllowed(pref, request))
            .orElse(true); // Default to allowed if no preferences set
    }

    private boolean isNotificationAllowed(NotificationPreferenceEntity pref, SendNotificationRequest request) {
        // Check channel preference
        boolean channelEnabled = switch (request.type()) {
            case "EMAIL" -> Boolean.TRUE.equals(pref.getEmailEnabled());
            case "PUSH" -> Boolean.TRUE.equals(pref.getPushEnabled());
            case "SMS" -> Boolean.TRUE.equals(pref.getSmsEnabled());
            case "IN_APP" -> Boolean.TRUE.equals(pref.getInAppEnabled());
            default -> true;
        };

        if (!channelEnabled) return false;

        // Check category preference
        String category = request.category() != null ? request.category() : "SYSTEM";
        return switch (category) {
            case "SYSTEM" -> Boolean.TRUE.equals(pref.getSystemNotifications());
            case "MARKETING" -> Boolean.TRUE.equals(pref.getMarketingNotifications());
            case "TRANSACTIONAL" -> Boolean.TRUE.equals(pref.getTransactionalNotifications());
            case "ALERT" -> Boolean.TRUE.equals(pref.getAlertNotifications());
            default -> true;
        };
    }

    private void processNotification(NotificationEntity notification) {
        try {
            switch (notification.getType()) {
                case "EMAIL" -> sendEmail(notification);
                case "PUSH" -> sendPushNotification(notification);
                case "SMS" -> sendSms(notification);
                case "IN_APP" -> markAsDelivered(notification);
                default -> log.warn("Unknown notification type: {}", notification.getType());
            }
        } catch (Exception e) {
            markAsFailed(notification, e.getMessage());
            throw e;
        }
    }

    private void sendEmail(NotificationEntity notification) {
        log.debug("Sending email notification: {}", notification.getId());

        String recipient = notification.getRecipientAddress();
        if (recipient == null || recipient.isBlank()) {
            throw new IllegalArgumentException("Email recipient address is required");
        }

        emailService.sendEmail(
            recipient,
            notification.getSubject(),
            notification.getBody(),
            notification.getBodyHtml()
        );

        markAsSent(notification);
    }

    private void sendPushNotification(NotificationEntity notification) {
        log.debug("Sending push notification: {}", notification.getId());
        // TODO: Integrate with push notification service (Firebase, APNs)
        markAsSent(notification);
    }

    private void sendSms(NotificationEntity notification) {
        log.debug("Sending SMS notification: {}", notification.getId());
        // TODO: Integrate with SMS provider (Twilio, etc.)
        markAsSent(notification);
    }

    private void markAsSent(NotificationEntity notification) {
        notification.setStatus("SENT");
        notification.setSentAt(Instant.now());
        notificationRepository.save(notification);
    }

    private void markAsDelivered(NotificationEntity notification) {
        notification.setStatus("DELIVERED");
        notification.setDeliveredAt(Instant.now());
        notificationRepository.save(notification);
    }

    private void markAsFailed(NotificationEntity notification, String reason) {
        notification.setStatus("FAILED");
        notification.setFailedAt(Instant.now());
        notification.setFailureReason(reason);
        notificationRepository.save(notification);
    }
}
