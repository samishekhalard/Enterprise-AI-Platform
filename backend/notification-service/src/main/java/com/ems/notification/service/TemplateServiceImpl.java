package com.ems.notification.service;

import com.ems.common.exception.BusinessException;
import com.ems.common.exception.ResourceNotFoundException;
import com.ems.notification.dto.CreateTemplateRequest;
import com.ems.notification.dto.NotificationTemplateDTO;
import com.ems.notification.entity.NotificationTemplateEntity;
import com.ems.notification.mapper.NotificationMapper;
import com.ems.notification.repository.NotificationTemplateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class TemplateServiceImpl implements TemplateService {

    private final NotificationTemplateRepository repository;
    private final NotificationMapper mapper;

    @Override
    public NotificationTemplateDTO createTemplate(CreateTemplateRequest request) {
        log.debug("Creating template: code={}, type={}", request.code(), request.type());

        // Check for duplicates
        if (repository.existsByCodeAndTypeAndTenantId(request.code(), request.type(), request.tenantId())) {
            throw new BusinessException("TEMPLATE_EXISTS",
                "Template with code " + request.code() + " and type " + request.type() + " already exists");
        }

        NotificationTemplateEntity entity = mapper.toTemplateEntity(request);
        if (request.locale() == null) {
            entity.setLocale("en");
        }

        entity = repository.save(entity);
        log.info("Created template: id={}, code={}", entity.getId(), entity.getCode());

        return mapper.toTemplateDTO(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public NotificationTemplateDTO getTemplate(UUID templateId) {
        NotificationTemplateEntity entity = repository.findById(templateId)
            .orElseThrow(() -> new ResourceNotFoundException("Template", templateId.toString()));
        return mapper.toTemplateDTO(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public NotificationTemplateDTO getTemplateByCode(String tenantId, String code, String type) {
        return repository.findTemplateByCodeAndType(tenantId, code, type)
            .map(mapper::toTemplateDTO)
            .orElseThrow(() -> new ResourceNotFoundException("Template", code + "/" + type));
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationTemplateDTO> getAllTemplates(String tenantId) {
        List<NotificationTemplateEntity> templates = repository.findAllTemplatesForTenant(tenantId);
        return mapper.toTemplateDTOList(templates);
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationTemplateDTO> getSystemTemplates() {
        List<NotificationTemplateEntity> templates = repository.findByTenantIdIsNullAndIsActiveTrue();
        return mapper.toTemplateDTOList(templates);
    }

    @Override
    public NotificationTemplateDTO updateTemplate(UUID templateId, CreateTemplateRequest request) {
        NotificationTemplateEntity entity = repository.findById(templateId)
            .orElseThrow(() -> new ResourceNotFoundException("Template", templateId.toString()));

        if (Boolean.TRUE.equals(entity.getIsSystem())) {
            throw new BusinessException("SYSTEM_TEMPLATE", "System templates cannot be modified");
        }

        entity.setName(request.name());
        entity.setDescription(request.description());
        entity.setSubjectTemplate(request.subjectTemplate());
        entity.setBodyTemplate(request.bodyTemplate());
        entity.setBodyHtmlTemplate(request.bodyHtmlTemplate());
        entity.setVariables(request.variables());
        if (request.locale() != null) {
            entity.setLocale(request.locale());
        }

        entity = repository.save(entity);
        return mapper.toTemplateDTO(entity);
    }

    @Override
    public void deleteTemplate(UUID templateId) {
        NotificationTemplateEntity entity = repository.findById(templateId)
            .orElseThrow(() -> new ResourceNotFoundException("Template", templateId.toString()));

        if (Boolean.TRUE.equals(entity.getIsSystem())) {
            throw new BusinessException("SYSTEM_TEMPLATE", "System templates cannot be deleted");
        }

        repository.delete(entity);
        log.info("Deleted template: id={}", templateId);
    }

    @Override
    public void activateTemplate(UUID templateId) {
        NotificationTemplateEntity entity = repository.findById(templateId)
            .orElseThrow(() -> new ResourceNotFoundException("Template", templateId.toString()));
        entity.setIsActive(true);
        repository.save(entity);
    }

    @Override
    public void deactivateTemplate(UUID templateId) {
        NotificationTemplateEntity entity = repository.findById(templateId)
            .orElseThrow(() -> new ResourceNotFoundException("Template", templateId.toString()));
        entity.setIsActive(false);
        repository.save(entity);
    }
}
