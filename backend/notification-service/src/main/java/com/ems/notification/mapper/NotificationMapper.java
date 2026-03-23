package com.ems.notification.mapper;

import com.ems.notification.dto.*;
import com.ems.notification.entity.*;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface NotificationMapper {

    NotificationDTO toDTO(NotificationEntity entity);

    List<NotificationDTO> toDTOList(List<NotificationEntity> entities);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "sentAt", ignore = true)
    @Mapping(target = "deliveredAt", ignore = true)
    @Mapping(target = "readAt", ignore = true)
    @Mapping(target = "failedAt", ignore = true)
    @Mapping(target = "failureReason", ignore = true)
    @Mapping(target = "retryCount", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "expiresAt", ignore = true)
    NotificationEntity toEntity(SendNotificationRequest request);

    NotificationTemplateDTO toTemplateDTO(NotificationTemplateEntity entity);

    List<NotificationTemplateDTO> toTemplateDTOList(List<NotificationTemplateEntity> entities);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "isActive", constant = "true")
    @Mapping(target = "isSystem", constant = "false")
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    NotificationTemplateEntity toTemplateEntity(CreateTemplateRequest request);

    NotificationPreferenceDTO toPreferenceDTO(NotificationPreferenceEntity entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "userId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updatePreference(UpdatePreferenceRequest request, @MappingTarget NotificationPreferenceEntity entity);
}
