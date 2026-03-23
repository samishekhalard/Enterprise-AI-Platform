package com.ems.user.service;

import com.ems.common.enums.DeviceTrustLevel;
import com.ems.common.exception.ResourceNotFoundException;
import com.ems.user.dto.UserDeviceDTO;
import com.ems.user.entity.UserDeviceEntity;
import com.ems.user.entity.UserProfileEntity;
import com.ems.user.mapper.UserMapper;
import com.ems.user.repository.UserDeviceRepository;
import com.ems.user.repository.UserProfileRepository;
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
public class DeviceServiceImpl implements DeviceService {

    private final UserDeviceRepository deviceRepository;
    private final UserProfileRepository userProfileRepository;
    private final UserMapper userMapper;

    @Override
    @Transactional(readOnly = true)
    public List<UserDeviceDTO> getCurrentUserDevices(UUID keycloakId, String tenantId) {
        log.debug("Getting devices for current user: {}", keycloakId);

        UserProfileEntity user = userProfileRepository.findByKeycloakId(keycloakId)
            .orElseThrow(() -> new ResourceNotFoundException("User", keycloakId.toString()));

        return deviceRepository.findByUserIdOrderByLastSeenDesc(user.getId()).stream()
            .map(userMapper::toDeviceDTO)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserDeviceDTO> getUserDevices(UUID userId, String tenantId) {
        log.debug("Getting devices for user: {} in tenant: {}", userId, tenantId);

        return deviceRepository.findByUserIdOrderByLastSeenDesc(userId).stream()
            .map(userMapper::toDeviceDTO)
            .toList();
    }

    @Override
    public UserDeviceDTO trustDevice(UUID deviceId, UUID keycloakId, String tenantId) {
        log.info("Trusting device: {} by user: {}", deviceId, keycloakId);

        UserProfileEntity user = userProfileRepository.findByKeycloakId(keycloakId)
            .orElseThrow(() -> new ResourceNotFoundException("User", keycloakId.toString()));

        UserDeviceEntity device = deviceRepository.findByIdAndUserId(deviceId, user.getId())
            .orElseThrow(() -> new ResourceNotFoundException("Device", deviceId.toString()));

        device.setTrustLevel(DeviceTrustLevel.TRUSTED);
        device = deviceRepository.save(device);

        log.info("Trusted device: {}", deviceId);
        return userMapper.toDeviceDTO(device);
    }

    @Override
    public void removeDevice(UUID deviceId, UUID keycloakId, String tenantId) {
        log.info("Removing device: {} by user: {}", deviceId, keycloakId);

        UserProfileEntity user = userProfileRepository.findByKeycloakId(keycloakId)
            .orElseThrow(() -> new ResourceNotFoundException("User", keycloakId.toString()));

        UserDeviceEntity device = deviceRepository.findByIdAndUserId(deviceId, user.getId())
            .orElseThrow(() -> new ResourceNotFoundException("Device", deviceId.toString()));

        deviceRepository.delete(device);

        log.info("Removed device: {}", deviceId);
    }

    @Override
    public void blockDevice(UUID deviceId, UUID userId, String tenantId, UUID blockedByKeycloakId) {
        log.info("Blocking device: {} for user: {} by: {}", deviceId, userId, blockedByKeycloakId);

        UserDeviceEntity device = deviceRepository.findByIdAndUserId(deviceId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Device", deviceId.toString()));

        device.setTrustLevel(DeviceTrustLevel.BLOCKED);
        deviceRepository.save(device);

        log.info("Blocked device: {}", deviceId);
    }

    @Override
    public void approveDevice(UUID deviceId, UUID userId, String tenantId, UUID approvedByKeycloakId) {
        log.info("Approving device: {} for user: {} by: {}", deviceId, userId, approvedByKeycloakId);

        UserProfileEntity approvedBy = userProfileRepository.findByKeycloakId(approvedByKeycloakId)
            .orElseThrow(() -> new ResourceNotFoundException("User", approvedByKeycloakId.toString()));

        UserDeviceEntity device = deviceRepository.findByIdAndUserId(deviceId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Device", deviceId.toString()));

        device.setIsApproved(true);
        device.setApprovedBy(approvedBy.getId());
        device.setApprovedAt(Instant.now());
        device.setTrustLevel(DeviceTrustLevel.TRUSTED);

        deviceRepository.save(device);

        log.info("Approved device: {}", deviceId);
    }
}
