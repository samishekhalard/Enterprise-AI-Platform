package com.ems.audit.scheduler;

import com.ems.audit.service.AuditService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
@EnableScheduling
@ConditionalOnProperty(name = "audit.purge.enabled", havingValue = "true", matchIfMissing = true)
public class AuditPurgeScheduler {

    private final AuditService auditService;

    @Scheduled(cron = "${audit.purge.cron:0 0 2 * * ?}")
    public void purgeExpiredEvents() {
        log.info("Starting scheduled audit event purge");
        try {
            int deleted = auditService.purgeExpiredEvents();
            log.info("Scheduled purge completed: deleted {} events", deleted);
        } catch (Exception e) {
            log.error("Scheduled purge failed", e);
        }
    }
}
