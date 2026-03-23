package com.ems.notification.repository;

import com.ems.notification.entity.NotificationTemplateEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface NotificationTemplateRepository extends JpaRepository<NotificationTemplateEntity, UUID> {

    @Query("SELECT t FROM NotificationTemplateEntity t WHERE " +
           "(t.tenantId = :tenantId OR t.tenantId IS NULL) " +
           "AND t.code = :code AND t.type = :type AND t.isActive = true " +
           "ORDER BY t.tenantId DESC NULLS LAST")
    List<NotificationTemplateEntity> findByCodeAndType(
        @Param("tenantId") String tenantId,
        @Param("code") String code,
        @Param("type") String type);

    default Optional<NotificationTemplateEntity> findTemplateByCodeAndType(
            String tenantId, String code, String type) {
        List<NotificationTemplateEntity> templates = findByCodeAndType(tenantId, code, type);
        return templates.isEmpty() ? Optional.empty() : Optional.of(templates.get(0));
    }

    List<NotificationTemplateEntity> findByTenantIdAndIsActiveTrue(String tenantId);

    List<NotificationTemplateEntity> findByTenantIdIsNullAndIsActiveTrue();

    @Query("SELECT t FROM NotificationTemplateEntity t WHERE " +
           "(t.tenantId = :tenantId OR t.tenantId IS NULL) AND t.isActive = true " +
           "ORDER BY t.tenantId DESC NULLS LAST, t.code")
    List<NotificationTemplateEntity> findAllTemplatesForTenant(@Param("tenantId") String tenantId);

    boolean existsByCodeAndTypeAndTenantId(String code, String type, String tenantId);

    Optional<NotificationTemplateEntity> findByIdAndTenantId(UUID id, String tenantId);
}
