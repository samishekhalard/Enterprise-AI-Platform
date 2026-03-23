package com.ems.notification.repository;

import com.ems.notification.entity.NotificationEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<NotificationEntity, UUID> {

    Page<NotificationEntity> findByTenantIdAndUserId(String tenantId, UUID userId, Pageable pageable);

    Page<NotificationEntity> findByTenantIdAndUserIdAndType(
        String tenantId, UUID userId, String type, Pageable pageable);

    Page<NotificationEntity> findByTenantIdAndUserIdAndStatus(
        String tenantId, UUID userId, String status, Pageable pageable);

    @Query("SELECT n FROM NotificationEntity n WHERE n.tenantId = :tenantId " +
           "AND n.userId = :userId AND n.type = 'IN_APP' AND n.status != 'READ' " +
           "ORDER BY n.createdAt DESC")
    List<NotificationEntity> findUnreadInAppNotifications(
        @Param("tenantId") String tenantId, @Param("userId") UUID userId);

    @Query("SELECT COUNT(n) FROM NotificationEntity n WHERE n.tenantId = :tenantId " +
           "AND n.userId = :userId AND n.type = 'IN_APP' AND n.status != 'READ'")
    long countUnreadInAppNotifications(
        @Param("tenantId") String tenantId, @Param("userId") UUID userId);

    @Query("SELECT n FROM NotificationEntity n WHERE n.status = 'PENDING' " +
           "AND (n.scheduledAt IS NULL OR n.scheduledAt <= :now) " +
           "ORDER BY n.priority DESC, n.createdAt ASC")
    List<NotificationEntity> findPendingNotifications(@Param("now") Instant now, Pageable pageable);

    @Query("SELECT n FROM NotificationEntity n WHERE n.status = 'FAILED' " +
           "AND n.retryCount < n.maxRetries ORDER BY n.failedAt ASC")
    List<NotificationEntity> findRetryableNotifications(Pageable pageable);

    @Modifying
    @Query("UPDATE NotificationEntity n SET n.status = 'READ', n.readAt = :now " +
           "WHERE n.id = :id AND n.status != 'READ'")
    int markAsRead(@Param("id") UUID id, @Param("now") Instant now);

    @Modifying
    @Query("UPDATE NotificationEntity n SET n.status = 'READ', n.readAt = :now " +
           "WHERE n.tenantId = :tenantId AND n.userId = :userId AND n.type = 'IN_APP' " +
           "AND n.status != 'READ'")
    int markAllAsRead(
        @Param("tenantId") String tenantId,
        @Param("userId") UUID userId,
        @Param("now") Instant now);

    @Modifying
    @Query("DELETE FROM NotificationEntity n WHERE n.expiresAt IS NOT NULL AND n.expiresAt < :now")
    int deleteExpiredNotifications(@Param("now") Instant now);

    List<NotificationEntity> findByCorrelationId(String correlationId);
}
