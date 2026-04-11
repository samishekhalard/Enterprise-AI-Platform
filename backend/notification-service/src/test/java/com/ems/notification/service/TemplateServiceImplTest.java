package com.ems.notification.service;

import com.ems.common.exception.BusinessException;
import com.ems.common.exception.ResourceNotFoundException;
import com.ems.notification.dto.CreateTemplateRequest;
import com.ems.notification.dto.NotificationTemplateDTO;
import com.ems.notification.entity.NotificationTemplateEntity;
import com.ems.notification.mapper.NotificationMapper;
import com.ems.notification.repository.NotificationTemplateRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("TemplateServiceImpl Unit Tests")
class TemplateServiceImplTest {

    @Mock
    private NotificationTemplateRepository repository;

    @Mock
    private NotificationMapper mapper;

    @InjectMocks
    private TemplateServiceImpl templateService;

    private static final String TENANT_ID = "tenant-1";
    private static final UUID TEMPLATE_ID = UUID.randomUUID();

    private CreateTemplateRequest buildCreateRequest() {
        return CreateTemplateRequest.builder()
                .tenantId(TENANT_ID)
                .code("WELCOME_EMAIL")
                .name("Welcome Email")
                .description("Sent to new users")
                .type("EMAIL")
                .category("SYSTEM")
                .subjectTemplate("Welcome [[${name}]]")
                .bodyTemplate("Hello [[${name}]], welcome!")
                .bodyHtmlTemplate("<h1>Welcome [[${name}]]</h1>")
                .variables(List.of("name"))
                .locale("en")
                .build();
    }

    private NotificationTemplateEntity buildTemplateEntity(boolean isSystem) {
        return NotificationTemplateEntity.builder()
                .id(TEMPLATE_ID)
                .tenantId(TENANT_ID)
                .code("WELCOME_EMAIL")
                .name("Welcome Email")
                .type("EMAIL")
                .category("SYSTEM")
                .bodyTemplate("Hello [[${name}]], welcome!")
                .isActive(true)
                .isSystem(isSystem)
                .locale("en")
                .build();
    }

    private NotificationTemplateDTO buildTemplateDTO() {
        return NotificationTemplateDTO.builder()
                .id(TEMPLATE_ID)
                .tenantId(TENANT_ID)
                .code("WELCOME_EMAIL")
                .name("Welcome Email")
                .type("EMAIL")
                .category("SYSTEM")
                .isActive(true)
                .isSystem(false)
                .locale("en")
                .build();
    }

    @Nested
    @DisplayName("createTemplate()")
    class CreateTemplate {

        @Test
        @DisplayName("Should create template successfully when no duplicate exists")
        void createTemplate_whenNoDuplicate_shouldCreateAndReturn() {
            // Arrange
            CreateTemplateRequest request = buildCreateRequest();
            NotificationTemplateEntity entity = buildTemplateEntity(false);

            when(repository.existsByCodeAndTypeAndTenantId("WELCOME_EMAIL", "EMAIL", TENANT_ID))
                    .thenReturn(false);
            when(mapper.toTemplateEntity(request)).thenReturn(entity);
            when(repository.save(any(NotificationTemplateEntity.class))).thenReturn(entity);
            when(mapper.toTemplateDTO(entity)).thenReturn(buildTemplateDTO());

            // Act
            NotificationTemplateDTO result = templateService.createTemplate(request);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.code()).isEqualTo("WELCOME_EMAIL");
            verify(repository).save(any(NotificationTemplateEntity.class));
        }

        @Test
        @DisplayName("Should throw BusinessException when duplicate template exists")
        void createTemplate_whenDuplicate_shouldThrow() {
            // Arrange
            CreateTemplateRequest request = buildCreateRequest();
            when(repository.existsByCodeAndTypeAndTenantId("WELCOME_EMAIL", "EMAIL", TENANT_ID))
                    .thenReturn(true);

            // Act & Assert
            assertThatThrownBy(() -> templateService.createTemplate(request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("already exists");
        }

        @Test
        @DisplayName("Should set default locale to 'en' when locale is null")
        void createTemplate_whenLocaleNull_shouldDefaultToEn() {
            // Arrange
            CreateTemplateRequest request = CreateTemplateRequest.builder()
                    .tenantId(TENANT_ID)
                    .code("TEST")
                    .name("Test")
                    .type("EMAIL")
                    .category("SYSTEM")
                    .bodyTemplate("body")
                    .locale(null)
                    .build();

            NotificationTemplateEntity entity = NotificationTemplateEntity.builder()
                    .id(TEMPLATE_ID)
                    .code("TEST")
                    .name("Test")
                    .type("EMAIL")
                    .category("SYSTEM")
                    .bodyTemplate("body")
                    .build();

            when(repository.existsByCodeAndTypeAndTenantId("TEST", "EMAIL", TENANT_ID))
                    .thenReturn(false);
            when(mapper.toTemplateEntity(request)).thenReturn(entity);
            when(repository.save(any(NotificationTemplateEntity.class))).thenReturn(entity);
            when(mapper.toTemplateDTO(entity)).thenReturn(buildTemplateDTO());

            // Act
            templateService.createTemplate(request);

            // Assert
            ArgumentCaptor<NotificationTemplateEntity> captor = ArgumentCaptor.forClass(NotificationTemplateEntity.class);
            verify(repository).save(captor.capture());
            assertThat(captor.getValue().getLocale()).isEqualTo("en");
        }
    }

    @Nested
    @DisplayName("getTemplate()")
    class GetTemplate {

        @Test
        @DisplayName("Should return template DTO when found")
        void getTemplate_whenExists_shouldReturn() {
            // Arrange
            NotificationTemplateEntity entity = buildTemplateEntity(false);
            when(repository.findById(TEMPLATE_ID)).thenReturn(Optional.of(entity));
            when(mapper.toTemplateDTO(entity)).thenReturn(buildTemplateDTO());

            // Act
            NotificationTemplateDTO result = templateService.getTemplate(TEMPLATE_ID);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.id()).isEqualTo(TEMPLATE_ID);
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when template not found")
        void getTemplate_whenNotFound_shouldThrow() {
            // Arrange
            UUID missingId = UUID.randomUUID();
            when(repository.findById(missingId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> templateService.getTemplate(missingId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Template");
        }
    }

    @Nested
    @DisplayName("getTemplateByCode()")
    class GetTemplateByCode {

        @Test
        @DisplayName("Should return template when found by code and type")
        void getTemplateByCode_whenFound_shouldReturn() {
            // Arrange
            NotificationTemplateEntity entity = buildTemplateEntity(false);
            when(repository.findTemplateByCodeAndType(TENANT_ID, "WELCOME_EMAIL", "EMAIL"))
                    .thenReturn(Optional.of(entity));
            when(mapper.toTemplateDTO(entity)).thenReturn(buildTemplateDTO());

            // Act
            NotificationTemplateDTO result = templateService.getTemplateByCode(TENANT_ID, "WELCOME_EMAIL", "EMAIL");

            // Assert
            assertThat(result).isNotNull();
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when code/type combo not found")
        void getTemplateByCode_whenNotFound_shouldThrow() {
            // Arrange
            when(repository.findTemplateByCodeAndType(TENANT_ID, "MISSING", "EMAIL"))
                    .thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> templateService.getTemplateByCode(TENANT_ID, "MISSING", "EMAIL"))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("getAllTemplates() / getSystemTemplates()")
    class ListTemplates {

        @Test
        @DisplayName("Should return all templates for a tenant")
        void getAllTemplates_shouldReturnAll() {
            // Arrange
            NotificationTemplateEntity entity = buildTemplateEntity(false);
            when(repository.findAllTemplatesForTenant(TENANT_ID)).thenReturn(List.of(entity));
            when(mapper.toTemplateDTOList(List.of(entity))).thenReturn(List.of(buildTemplateDTO()));

            // Act
            List<NotificationTemplateDTO> result = templateService.getAllTemplates(TENANT_ID);

            // Assert
            assertThat(result).hasSize(1);
        }

        @Test
        @DisplayName("Should return only system templates")
        void getSystemTemplates_shouldReturnSystemOnly() {
            // Arrange
            NotificationTemplateEntity entity = buildTemplateEntity(true);
            when(repository.findByTenantIdIsNullAndIsActiveTrue()).thenReturn(List.of(entity));
            when(mapper.toTemplateDTOList(List.of(entity))).thenReturn(List.of(buildTemplateDTO()));

            // Act
            List<NotificationTemplateDTO> result = templateService.getSystemTemplates();

            // Assert
            assertThat(result).hasSize(1);
            verify(repository).findByTenantIdIsNullAndIsActiveTrue();
        }
    }

    @Nested
    @DisplayName("updateTemplate()")
    class UpdateTemplate {

        @Test
        @DisplayName("Should update non-system template successfully")
        void updateTemplate_whenNotSystem_shouldUpdate() {
            // Arrange
            CreateTemplateRequest request = buildCreateRequest();
            NotificationTemplateEntity entity = buildTemplateEntity(false);

            when(repository.findById(TEMPLATE_ID)).thenReturn(Optional.of(entity));
            when(repository.save(any(NotificationTemplateEntity.class))).thenReturn(entity);
            when(mapper.toTemplateDTO(entity)).thenReturn(buildTemplateDTO());

            // Act
            NotificationTemplateDTO result = templateService.updateTemplate(TEMPLATE_ID, request);

            // Assert
            assertThat(result).isNotNull();
            verify(repository).save(entity);
        }

        @Test
        @DisplayName("Should throw BusinessException when trying to update system template")
        void updateTemplate_whenSystem_shouldThrow() {
            // Arrange
            NotificationTemplateEntity entity = buildTemplateEntity(true);
            when(repository.findById(TEMPLATE_ID)).thenReturn(Optional.of(entity));

            // Act & Assert
            assertThatThrownBy(() -> templateService.updateTemplate(TEMPLATE_ID, buildCreateRequest()))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("System templates cannot be modified");
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when template not found")
        void updateTemplate_whenNotFound_shouldThrow() {
            // Arrange
            UUID missingId = UUID.randomUUID();
            when(repository.findById(missingId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> templateService.updateTemplate(missingId, buildCreateRequest()))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("Should not overwrite locale when request locale is null")
        void updateTemplate_whenLocaleNull_shouldNotOverwrite() {
            // Arrange
            CreateTemplateRequest request = CreateTemplateRequest.builder()
                    .code("WELCOME_EMAIL")
                    .name("Updated Name")
                    .type("EMAIL")
                    .category("SYSTEM")
                    .bodyTemplate("updated body")
                    .locale(null)
                    .build();
            NotificationTemplateEntity entity = buildTemplateEntity(false);
            entity.setLocale("fr");

            when(repository.findById(TEMPLATE_ID)).thenReturn(Optional.of(entity));
            when(repository.save(any(NotificationTemplateEntity.class))).thenReturn(entity);
            when(mapper.toTemplateDTO(entity)).thenReturn(buildTemplateDTO());

            // Act
            templateService.updateTemplate(TEMPLATE_ID, request);

            // Assert
            assertThat(entity.getLocale()).isEqualTo("fr");
        }
    }

    @Nested
    @DisplayName("deleteTemplate()")
    class DeleteTemplate {

        @Test
        @DisplayName("Should delete non-system template")
        void deleteTemplate_whenNotSystem_shouldDelete() {
            // Arrange
            NotificationTemplateEntity entity = buildTemplateEntity(false);
            when(repository.findById(TEMPLATE_ID)).thenReturn(Optional.of(entity));

            // Act
            templateService.deleteTemplate(TEMPLATE_ID);

            // Assert
            verify(repository).delete(entity);
        }

        @Test
        @DisplayName("Should throw BusinessException when deleting system template")
        void deleteTemplate_whenSystem_shouldThrow() {
            // Arrange
            NotificationTemplateEntity entity = buildTemplateEntity(true);
            when(repository.findById(TEMPLATE_ID)).thenReturn(Optional.of(entity));

            // Act & Assert
            assertThatThrownBy(() -> templateService.deleteTemplate(TEMPLATE_ID))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("System templates cannot be deleted");
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when template not found")
        void deleteTemplate_whenNotFound_shouldThrow() {
            // Arrange
            UUID missingId = UUID.randomUUID();
            when(repository.findById(missingId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> templateService.deleteTemplate(missingId))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("activateTemplate() / deactivateTemplate()")
    class ActivateDeactivate {

        @Test
        @DisplayName("Should activate template by setting isActive to true")
        void activateTemplate_shouldSetActiveTrue() {
            // Arrange
            NotificationTemplateEntity entity = buildTemplateEntity(false);
            entity.setIsActive(false);
            when(repository.findById(TEMPLATE_ID)).thenReturn(Optional.of(entity));
            when(repository.save(entity)).thenReturn(entity);

            // Act
            templateService.activateTemplate(TEMPLATE_ID);

            // Assert
            assertThat(entity.getIsActive()).isTrue();
            verify(repository).save(entity);
        }

        @Test
        @DisplayName("Should deactivate template by setting isActive to false")
        void deactivateTemplate_shouldSetActiveFalse() {
            // Arrange
            NotificationTemplateEntity entity = buildTemplateEntity(false);
            when(repository.findById(TEMPLATE_ID)).thenReturn(Optional.of(entity));
            when(repository.save(entity)).thenReturn(entity);

            // Act
            templateService.deactivateTemplate(TEMPLATE_ID);

            // Assert
            assertThat(entity.getIsActive()).isFalse();
            verify(repository).save(entity);
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when activating non-existent template")
        void activateTemplate_whenNotFound_shouldThrow() {
            // Arrange
            UUID missingId = UUID.randomUUID();
            when(repository.findById(missingId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> templateService.activateTemplate(missingId))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }
}
