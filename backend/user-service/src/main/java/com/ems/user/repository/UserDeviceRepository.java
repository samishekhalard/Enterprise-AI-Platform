package com.ems.user.repository;

import com.ems.common.enums.DeviceTrustLevel;
import com.ems.user.entity.UserDeviceEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserDeviceRepository extends JpaRepository<UserDeviceEntity, UUID> {

    List<UserDeviceEntity> findByUserId(UUID userId);

    List<UserDeviceEntity> findByTenantId(String tenantId);

    Optional<UserDeviceEntity> findByUserIdAndFingerprint(UUID userId, String fingerprint);

    Optional<UserDeviceEntity> findByIdAndUserId(UUID id, UUID userId);

    List<UserDeviceEntity> findByUserIdAndTrustLevel(UUID userId, DeviceTrustLevel trustLevel);

    @Query("SELECT d FROM UserDeviceEntity d WHERE d.user.id = :userId ORDER BY d.lastSeenAt DESC")
    List<UserDeviceEntity> findByUserIdOrderByLastSeenDesc(@Param("userId") UUID userId);

    @Query("SELECT COUNT(d) FROM UserDeviceEntity d WHERE d.user.id = :userId")
    long countByUserId(@Param("userId") UUID userId);

    void deleteByUserIdAndId(UUID userId, UUID deviceId);
}
