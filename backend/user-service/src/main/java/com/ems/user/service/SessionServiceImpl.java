package com.ems.user.service;

import com.ems.common.enums.SessionStatus;
import com.ems.common.exception.ResourceNotFoundException;
import com.ems.user.dto.UserSessionDTO;
import com.ems.user.entity.UserDeviceEntity;
import com.ems.user.entity.UserProfileEntity;
import com.ems.user.entity.UserSessionEntity;
import com.ems.user.mapper.UserMapper;
import com.ems.user.repository.UserDeviceRepository;
import com.ems.user.repository.UserProfileRepository;
import com.ems.user.repository.UserSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class SessionServiceImpl implements SessionService {

    private final UserSessionRepository sessionRepository;
    private final UserProfileRepository userProfileRepository;
    private final UserDeviceRepository deviceRepository;
    private final UserMapper userMapper;

    @Override
    @Transactional(readOnly = true)
    public List<UserSessionDTO> getCurrentUserSessions(UUID keycloakId, String tenantId, String currentSessionToken) {
        log.debug("Getting sessions for current user: {}", keycloakId);

        UserProfileEntity user = userProfileRepository.findByKeycloakId(keycloakId)
            .orElseThrow(() -> new ResourceNotFoundException("User", keycloakId.toString()));

        List<UserSessionEntity> sessions = sessionRepository.findActiveSessionsByUserId(user.getId(), Instant.now());

        return sessions.stream()
            .map(session -> enrichSession(session, currentSessionToken))
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserSessionDTO> getUserSessions(UUID userId, String tenantId) {
        log.debug("Getting sessions for user: {} in tenant: {}", userId, tenantId);

        List<UserSessionEntity> sessions = sessionRepository.findActiveSessionsByUserId(userId, Instant.now());

        return sessions.stream()
            .map(session -> enrichSession(session, null))
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserSessionDTO> getTenantSessions(String tenantId) {
        log.debug("Getting all sessions for tenant: {}", tenantId);

        List<UserSessionEntity> sessions = sessionRepository.findActiveSessionsByTenantId(tenantId, Instant.now());

        return sessions.stream()
            .map(session -> enrichSession(session, null))
            .toList();
    }

    @Override
    public void revokeSession(UUID sessionId, UUID keycloakId, String tenantId) {
        log.info("Revoking session: {} by user: {}", sessionId, keycloakId);

        UserProfileEntity user = userProfileRepository.findByKeycloakId(keycloakId)
            .orElseThrow(() -> new ResourceNotFoundException("User", keycloakId.toString()));

        UserSessionEntity session = sessionRepository.findByIdAndUserId(sessionId, user.getId())
            .orElseThrow(() -> new ResourceNotFoundException("Session", sessionId.toString()));

        session.revoke(user.getId(), "User requested revocation");
        sessionRepository.save(session);

        log.info("Revoked session: {}", sessionId);
    }

    @Override
    public void revokeAllUserSessions(UUID userId, String tenantId, UUID revokedByKeycloakId) {
        log.info("Revoking all sessions for user: {} by: {}", userId, revokedByKeycloakId);

        UserProfileEntity revokedBy = userProfileRepository.findByKeycloakId(revokedByKeycloakId)
            .orElseThrow(() -> new ResourceNotFoundException("User", revokedByKeycloakId.toString()));

        int count = sessionRepository.revokeAllUserSessions(
            userId,
            Instant.now(),
            revokedBy.getId(),
            "Admin revoked all sessions"
        );

        log.info("Revoked {} sessions for user: {}", count, userId);
    }

    @Override
    public void revokeAllTenantSessions(String tenantId, UUID revokedByKeycloakId) {
        log.info("Revoking all sessions for tenant: {} by: {}", tenantId, revokedByKeycloakId);

        UserProfileEntity revokedBy = userProfileRepository.findByKeycloakId(revokedByKeycloakId)
            .orElseThrow(() -> new ResourceNotFoundException("User", revokedByKeycloakId.toString()));

        List<UserSessionEntity> sessions = sessionRepository.findByTenantIdAndStatus(tenantId, SessionStatus.ACTIVE);

        for (UserSessionEntity session : sessions) {
            session.revoke(revokedBy.getId(), "Admin revoked all tenant sessions");
        }

        sessionRepository.saveAll(sessions);
        log.info("Revoked {} sessions for tenant: {}", sessions.size(), tenantId);
    }

    @Override
    @Transactional(readOnly = true)
    public long countActiveSessions(UUID userId) {
        return sessionRepository.countActiveSessionsByUserId(userId, Instant.now());
    }

    private UserSessionDTO enrichSession(UserSessionEntity session, String currentSessionToken) {
        String deviceName = null;
        if (session.getDeviceId() != null) {
            UserDeviceEntity device = deviceRepository.findById(session.getDeviceId()).orElse(null);
            if (device != null) {
                deviceName = device.getDeviceName();
            }
        }

        boolean isCurrent = currentSessionToken != null &&
                           currentSessionToken.equals(session.getSessionToken());

        return UserSessionDTO.builder()
            .id(session.getId())
            .deviceName(deviceName)
            .ipAddress(session.getIpAddress())
            .location(session.getLocation())
            .createdAt(session.getCreatedAt())
            .lastActivity(session.getLastActivity())
            .expiresAt(session.getExpiresAt())
            .isRemembered(session.getIsRemembered())
            .mfaVerified(session.getMfaVerified())
            .status(session.getStatus())
            .isCurrent(isCurrent)
            .build();
    }
}
