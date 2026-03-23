package com.ems.user.service;

import com.ems.user.dto.UserDeviceDTO;

import java.util.List;
import java.util.UUID;

public interface DeviceService {

    List<UserDeviceDTO> getCurrentUserDevices(UUID keycloakId, String tenantId);

    List<UserDeviceDTO> getUserDevices(UUID userId, String tenantId);

    UserDeviceDTO trustDevice(UUID deviceId, UUID keycloakId, String tenantId);

    void removeDevice(UUID deviceId, UUID keycloakId, String tenantId);

    void blockDevice(UUID deviceId, UUID userId, String tenantId, UUID blockedByKeycloakId);

    void approveDevice(UUID deviceId, UUID userId, String tenantId, UUID approvedByKeycloakId);
}
