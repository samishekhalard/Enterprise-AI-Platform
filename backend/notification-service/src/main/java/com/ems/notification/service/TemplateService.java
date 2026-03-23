package com.ems.notification.service;

import com.ems.notification.dto.CreateTemplateRequest;
import com.ems.notification.dto.NotificationTemplateDTO;

import java.util.List;
import java.util.UUID;

public interface TemplateService {

    NotificationTemplateDTO createTemplate(CreateTemplateRequest request);

    NotificationTemplateDTO getTemplate(UUID templateId);

    NotificationTemplateDTO getTemplateByCode(String tenantId, String code, String type);

    List<NotificationTemplateDTO> getAllTemplates(String tenantId);

    List<NotificationTemplateDTO> getSystemTemplates();

    NotificationTemplateDTO updateTemplate(UUID templateId, CreateTemplateRequest request);

    void deleteTemplate(UUID templateId);

    void activateTemplate(UUID templateId);

    void deactivateTemplate(UUID templateId);
}
