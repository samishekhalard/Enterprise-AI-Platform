package com.ems.notification.controller;

import com.ems.notification.dto.CreateTemplateRequest;
import com.ems.notification.dto.NotificationTemplateDTO;
import com.ems.notification.service.TemplateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notification-templates")
@RequiredArgsConstructor
@Tag(name = "Notification Templates", description = "Template management APIs")
public class TemplateController {

    private final TemplateService templateService;

    @PostMapping
    @Operation(summary = "Create template", description = "Create a new notification template")
    public ResponseEntity<NotificationTemplateDTO> createTemplate(
            @Valid @RequestBody CreateTemplateRequest request) {
        NotificationTemplateDTO template = templateService.createTemplate(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(template);
    }

    @GetMapping("/{templateId}")
    @Operation(summary = "Get template", description = "Retrieve a template by ID")
    public ResponseEntity<NotificationTemplateDTO> getTemplate(@PathVariable UUID templateId) {
        NotificationTemplateDTO template = templateService.getTemplate(templateId);
        return ResponseEntity.ok(template);
    }

    @GetMapping("/code/{code}")
    @Operation(summary = "Get template by code", description = "Retrieve a template by code and type")
    public ResponseEntity<NotificationTemplateDTO> getTemplateByCode(
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String code,
            @RequestParam String type) {
        NotificationTemplateDTO template = templateService.getTemplateByCode(tenantId, code, type);
        return ResponseEntity.ok(template);
    }

    @GetMapping
    @Operation(summary = "List templates", description = "List all templates for a tenant")
    public ResponseEntity<List<NotificationTemplateDTO>> getAllTemplates(
            @RequestHeader("X-Tenant-ID") String tenantId) {
        List<NotificationTemplateDTO> templates = templateService.getAllTemplates(tenantId);
        return ResponseEntity.ok(templates);
    }

    @GetMapping("/system")
    @Operation(summary = "List system templates", description = "List all system templates")
    public ResponseEntity<List<NotificationTemplateDTO>> getSystemTemplates() {
        List<NotificationTemplateDTO> templates = templateService.getSystemTemplates();
        return ResponseEntity.ok(templates);
    }

    @PutMapping("/{templateId}")
    @Operation(summary = "Update template", description = "Update an existing template")
    public ResponseEntity<NotificationTemplateDTO> updateTemplate(
            @PathVariable UUID templateId,
            @Valid @RequestBody CreateTemplateRequest request) {
        NotificationTemplateDTO template = templateService.updateTemplate(templateId, request);
        return ResponseEntity.ok(template);
    }

    @DeleteMapping("/{templateId}")
    @Operation(summary = "Delete template", description = "Delete a template")
    public ResponseEntity<Void> deleteTemplate(@PathVariable UUID templateId) {
        templateService.deleteTemplate(templateId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{templateId}/activate")
    @Operation(summary = "Activate template", description = "Activate a template")
    public ResponseEntity<Void> activateTemplate(@PathVariable UUID templateId) {
        templateService.activateTemplate(templateId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{templateId}/deactivate")
    @Operation(summary = "Deactivate template", description = "Deactivate a template")
    public ResponseEntity<Void> deactivateTemplate(@PathVariable UUID templateId) {
        templateService.deactivateTemplate(templateId);
        return ResponseEntity.ok().build();
    }
}
