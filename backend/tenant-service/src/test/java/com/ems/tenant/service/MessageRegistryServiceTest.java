package com.ems.tenant.service;

import com.ems.tenant.dto.internal.MessageBatchRegistrationRequest;
import com.ems.tenant.dto.internal.MessageTranslationRequest;
import com.ems.tenant.entity.MessageRegistryEntity;
import com.ems.tenant.entity.MessageTranslationEntity;
import com.ems.tenant.entity.TenantEntity;
import com.ems.tenant.entity.TenantMessageTranslationEntity;
import com.ems.tenant.repository.MessageRegistryRepository;
import com.ems.tenant.repository.MessageTranslationRepository;
import com.ems.tenant.repository.TenantMessageTranslationRepository;
import com.ems.tenant.repository.TenantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MessageRegistryServiceTest {

    @Mock
    private MessageRegistryRepository messageRegistryRepository;

    @Mock
    private MessageTranslationRepository messageTranslationRepository;

    @Mock
    private TenantMessageTranslationRepository tenantMessageTranslationRepository;

    @Mock
    private TenantRepository tenantRepository;

    private MessageRegistryService messageRegistryService;

    @BeforeEach
    void setUp() {
        messageRegistryService = new MessageRegistryService(
            messageRegistryRepository,
            messageTranslationRepository,
            tenantMessageTranslationRepository,
            tenantRepository
        );
    }

    @Test
    @DisplayName("registerBatch ignores duplicate request codes and existing rows")
    void registerBatch_ignoresDuplicateAndExistingCodes() {
        MessageBatchRegistrationRequest existing = new MessageBatchRegistrationRequest(
            "DEF-E-001", "E", "definitions", 404, "Existing", "Existing detail", List.of()
        );
        MessageBatchRegistrationRequest duplicate = new MessageBatchRegistrationRequest(
            "def-e-001", "E", "definitions", 404, "Duplicate", "Duplicate detail", List.of()
        );
        MessageBatchRegistrationRequest fresh = new MessageBatchRegistrationRequest(
            "DEF-I-001", "I", "definitions", null, "Created", "Created detail",
            List.of(new MessageTranslationRequest("ar", "تم الإنشاء", "تفصيل"))
        );

        when(messageRegistryRepository.findAllById(anyCollection())).thenReturn(List.of(
            MessageRegistryEntity.builder().code("DEF-E-001").build()
        ));

        var result = messageRegistryService.registerBatch(List.of(existing, duplicate, fresh));

        assertThat(result.registeredCount()).isEqualTo(1);
        assertThat(result.ignoredCount()).isEqualTo(1);
        verify(messageRegistryRepository).saveAll(org.mockito.ArgumentMatchers.argThat(items -> {
            var list = new java.util.ArrayList<MessageRegistryEntity>();
            items.forEach(list::add);
            return list.size() == 1 && "DEF-I-001".equals(list.getFirst().getCode());
        }));
        verify(messageTranslationRepository).saveAll(org.mockito.ArgumentMatchers.argThat(items -> {
            var list = new java.util.ArrayList<MessageTranslationEntity>();
            items.forEach(list::add);
            return list.size() == 1 && "ar".equals(list.getFirst().getLocaleCode());
        }));
    }

    @Test
    @DisplayName("getMessagesByPrefixes matches exact service prefixes and sorts by code")
    void getMessagesByPrefixes_matchesExactPrefixesOnly() {
        when(messageRegistryRepository.findAllOrdered()).thenReturn(List.of(
            MessageRegistryEntity.builder().code("COM-I-001").type("I").category("common").defaultTitle("Active").build(),
            MessageRegistryEntity.builder().code("DEFAULT-I-001").type("I").category("other").defaultTitle("Wrong").build(),
            MessageRegistryEntity.builder().code("DEF-E-001").type("E").category("definitions").defaultTitle("Missing").build()
        ));
        when(messageTranslationRepository.findByCodeIn(List.of("COM-I-001", "DEF-E-001"))).thenReturn(List.of(
            MessageTranslationEntity.builder().code("DEF-E-001").localeCode("ar").title("مفقود").build()
        ));

        var result = messageRegistryService.getMessagesByPrefixes("DEF,COM,DEF");

        assertThat(result).extracting(item -> item.code())
            .containsExactly("COM-I-001", "DEF-E-001");
    }

    @Test
    @DisplayName("resolveMessage falls back to default title and detail when translation is missing")
    void resolveMessage_fallsBackToDefaults() {
        when(messageRegistryRepository.findById("TEN-E-001")).thenReturn(Optional.of(
            MessageRegistryEntity.builder()
                .code("TEN-E-001")
                .type("E")
                .category("tenant")
                .httpStatus(500)
                .defaultTitle("Provisioning Failed")
                .defaultDetail("Default detail")
                .build()
        ));
        when(messageTranslationRepository.findByCodeAndLocaleCode("TEN-E-001", "ar")).thenReturn(Optional.empty());

        var resolved = messageRegistryService.resolveMessage("ten-e-001", "ar", null);

        assertThat(resolved.title()).isEqualTo("Provisioning Failed");
        assertThat(resolved.detail()).isEqualTo("Default detail");
        assertThat(resolved.locale()).isEqualTo("ar");
    }

    @Test
    @DisplayName("resolveMessage prefers tenant override before global translation")
    void resolveMessage_prefersTenantOverride() {
        UUID tenantUuid = UUID.randomUUID();
        when(messageRegistryRepository.findById("AUTH-E-503")).thenReturn(Optional.of(
            MessageRegistryEntity.builder()
                .code("AUTH-E-503")
                .type("E")
                .category("auth")
                .httpStatus(503)
                .defaultTitle("Authentication service unavailable")
                .defaultDetail("Default detail")
                .build()
        ));
        when(tenantRepository.findByUuid(tenantUuid)).thenReturn(Optional.of(
            TenantEntity.builder().uuid(tenantUuid).build()
        ));
        when(tenantMessageTranslationRepository.findByTenantUuidAndCodeAndLocaleCode(
            tenantUuid, "AUTH-E-503", "ar"
        )).thenReturn(Optional.of(
            TenantMessageTranslationEntity.builder()
                .tenantUuid(tenantUuid)
                .code("AUTH-E-503")
                .localeCode("ar")
                .title("خدمة خاصة بالمستأجر")
                .detail("ترجمة مخصصة للمستأجر")
                .build()
        ));

        var resolved = messageRegistryService.resolveMessage("auth-e-503", "ar", tenantUuid.toString());

        assertThat(resolved.title()).isEqualTo("خدمة خاصة بالمستأجر");
        assertThat(resolved.detail()).isEqualTo("ترجمة مخصصة للمستأجر");
    }
}
