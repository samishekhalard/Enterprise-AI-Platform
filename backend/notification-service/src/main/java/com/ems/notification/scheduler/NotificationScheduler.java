package com.ems.notification.scheduler;

import com.ems.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationScheduler {

    private final NotificationService notificationService;

    @Scheduled(fixedDelayString = "${notification.scheduler.process-interval:60000}")
    public void processScheduledNotifications() {
        log.debug("Running scheduled notification processor");
        try {
            int processed = notificationService.processScheduledNotifications();
            if (processed > 0) {
                log.info("Processed {} scheduled notifications", processed);
            }
        } catch (Exception e) {
            log.error("Error processing scheduled notifications", e);
        }
    }

    @Scheduled(fixedDelayString = "${notification.scheduler.retry-interval:300000}")
    public void retryFailedNotifications() {
        log.debug("Running failed notification retry");
        try {
            int retried = notificationService.retryFailedNotifications();
            if (retried > 0) {
                log.info("Retried {} failed notifications", retried);
            }
        } catch (Exception e) {
            log.error("Error retrying failed notifications", e);
        }
    }

    @Scheduled(cron = "${notification.scheduler.purge-cron:0 0 3 * * ?}")
    public void purgeExpiredNotifications() {
        log.info("Running expired notification purge");
        try {
            int purged = notificationService.purgeExpiredNotifications();
            log.info("Purged {} expired notifications", purged);
        } catch (Exception e) {
            log.error("Error purging expired notifications", e);
        }
    }
}
