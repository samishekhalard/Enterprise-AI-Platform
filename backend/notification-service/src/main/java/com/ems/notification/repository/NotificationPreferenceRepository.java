package com.ems.notification.repository;

import com.ems.notification.entity.NotificationPreferenceEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface NotificationPreferenceRepository extends JpaRepository<NotificationPreferenceEntity, UUID> {

    Optional<NotificationPreferenceEntity> findByTenantIdAndUserId(String tenantId, UUID userId);

    boolean existsByTenantIdAndUserId(String tenantId, UUID userId);
}
