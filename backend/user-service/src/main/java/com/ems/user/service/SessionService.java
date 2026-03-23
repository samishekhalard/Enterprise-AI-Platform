package com.ems.user.service;

import com.ems.user.dto.UserSessionDTO;

import java.util.List;
import java.util.UUID;

public interface SessionService {

    List<UserSessionDTO> getCurrentUserSessions(UUID keycloakId, String tenantId, String currentSessionToken);

    List<UserSessionDTO> getUserSessions(UUID userId, String tenantId);

    List<UserSessionDTO> getTenantSessions(String tenantId);

    void revokeSession(UUID sessionId, UUID keycloakId, String tenantId);

    void revokeAllUserSessions(UUID userId, String tenantId, UUID revokedByKeycloakId);

    void revokeAllTenantSessions(String tenantId, UUID revokedByKeycloakId);

    long countActiveSessions(UUID userId);
}
