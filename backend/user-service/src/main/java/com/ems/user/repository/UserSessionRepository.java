package com.ems.user.repository;

import com.ems.common.enums.SessionStatus;
import com.ems.user.entity.UserSessionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserSessionRepository extends JpaRepository<UserSessionEntity, UUID> {

    List<UserSessionEntity> findByUserIdAndStatus(UUID userId, SessionStatus status);

    List<UserSessionEntity> findByTenantIdAndStatus(String tenantId, SessionStatus status);

    Optional<UserSessionEntity> findBySessionToken(String sessionToken);

    Optional<UserSessionEntity> findByIdAndUserId(UUID id, UUID userId);

    @Query("SELECT s FROM UserSessionEntity s WHERE s.userId = :userId AND s.status = 'ACTIVE' " +
           "AND s.expiresAt > :now ORDER BY s.lastActivity DESC")
    List<UserSessionEntity> findActiveSessionsByUserId(
        @Param("userId") UUID userId,
        @Param("now") Instant now
    );

    @Query("SELECT s FROM UserSessionEntity s WHERE s.tenantId = :tenantId AND s.status = 'ACTIVE' " +
           "AND s.expiresAt > :now ORDER BY s.lastActivity DESC")
    List<UserSessionEntity> findActiveSessionsByTenantId(
        @Param("tenantId") String tenantId,
        @Param("now") Instant now
    );

    @Query("SELECT COUNT(s) FROM UserSessionEntity s WHERE s.userId = :userId AND s.status = 'ACTIVE' " +
           "AND s.expiresAt > :now")
    long countActiveSessionsByUserId(@Param("userId") UUID userId, @Param("now") Instant now);

    @Modifying
    @Query("UPDATE UserSessionEntity s SET s.status = 'EXPIRED' WHERE s.expiresAt < :now AND s.status = 'ACTIVE'")
    int expireSessions(@Param("now") Instant now);

    @Modifying
    @Query("UPDATE UserSessionEntity s SET s.status = 'REVOKED', s.revokedAt = :now, s.revokedBy = :revokedBy, " +
           "s.revokeReason = :reason WHERE s.userId = :userId AND s.status = 'ACTIVE'")
    int revokeAllUserSessions(
        @Param("userId") UUID userId,
        @Param("now") Instant now,
        @Param("revokedBy") UUID revokedBy,
        @Param("reason") String reason
    );
}
