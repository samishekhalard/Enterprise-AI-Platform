package com.ems.audit.repository;

import com.ems.audit.entity.AuditEventEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface AuditEventRepository extends JpaRepository<AuditEventEntity, UUID>,
                                              JpaSpecificationExecutor<AuditEventEntity> {

    Page<AuditEventEntity> findByTenantId(String tenantId, Pageable pageable);

    Page<AuditEventEntity> findByTenantIdAndUserId(String tenantId, UUID userId, Pageable pageable);

    Page<AuditEventEntity> findByTenantIdAndEventType(String tenantId, String eventType, Pageable pageable);

    Page<AuditEventEntity> findByTenantIdAndResourceTypeAndResourceId(
        String tenantId, String resourceType, String resourceId, Pageable pageable);

    @Query("SELECT a FROM AuditEventEntity a WHERE a.tenantId = :tenantId " +
           "AND a.timestamp BETWEEN :from AND :to ORDER BY a.timestamp DESC")
    Page<AuditEventEntity> findByTenantIdAndTimestampBetween(
        @Param("tenantId") String tenantId,
        @Param("from") Instant from,
        @Param("to") Instant to,
        Pageable pageable
    );

    @Query("SELECT a.eventType, COUNT(a) FROM AuditEventEntity a " +
           "WHERE a.tenantId = :tenantId AND a.timestamp >= :since " +
           "GROUP BY a.eventType")
    List<Object[]> countByEventType(@Param("tenantId") String tenantId, @Param("since") Instant since);

    @Query("SELECT a.eventCategory, COUNT(a) FROM AuditEventEntity a " +
           "WHERE a.tenantId = :tenantId AND a.timestamp >= :since " +
           "GROUP BY a.eventCategory")
    List<Object[]> countByEventCategory(@Param("tenantId") String tenantId, @Param("since") Instant since);

    @Query("SELECT a.outcome, COUNT(a) FROM AuditEventEntity a " +
           "WHERE a.tenantId = :tenantId AND a.timestamp >= :since " +
           "GROUP BY a.outcome")
    List<Object[]> countByOutcome(@Param("tenantId") String tenantId, @Param("since") Instant since);

    @Query("SELECT a.severity, COUNT(a) FROM AuditEventEntity a " +
           "WHERE a.tenantId = :tenantId AND a.timestamp >= :since " +
           "GROUP BY a.severity")
    List<Object[]> countBySeverity(@Param("tenantId") String tenantId, @Param("since") Instant since);

    @Query("SELECT a.serviceName, COUNT(a) FROM AuditEventEntity a " +
           "WHERE a.tenantId = :tenantId AND a.timestamp >= :since " +
           "GROUP BY a.serviceName")
    List<Object[]> countByServiceName(@Param("tenantId") String tenantId, @Param("since") Instant since);

    @Query(value = "SELECT DATE(timestamp) as day, COUNT(*) FROM audit_events " +
                   "WHERE tenant_id = :tenantId AND timestamp >= :since " +
                   "GROUP BY DATE(timestamp) ORDER BY day", nativeQuery = true)
    List<Object[]> countByDay(@Param("tenantId") String tenantId, @Param("since") Instant since);

    long countByTenantIdAndTimestampAfter(String tenantId, Instant since);

    @Modifying
    @Query("DELETE FROM AuditEventEntity a WHERE a.expiresAt IS NOT NULL AND a.expiresAt < :now")
    int deleteExpiredEvents(@Param("now") Instant now);

    @Query("SELECT a FROM AuditEventEntity a WHERE a.userId = :userId ORDER BY a.timestamp DESC")
    Page<AuditEventEntity> findByUserId(@Param("userId") UUID userId, Pageable pageable);

    List<AuditEventEntity> findByCorrelationId(String correlationId);
}
