package com.ems.tenant.service;

import com.ems.common.exception.ResourceNotFoundException;
import com.ems.tenant.dto.internal.MessageBatchRegistrationRequest;
import com.ems.tenant.dto.internal.MessageBatchRegistrationResultResponse;
import com.ems.tenant.dto.internal.MessageCatalogEntryResponse;
import com.ems.tenant.dto.internal.MessageTranslationRequest;
import com.ems.tenant.dto.internal.MessageTranslationResponse;
import com.ems.tenant.dto.internal.ResolvedMessageResponse;
import com.ems.tenant.entity.MessageRegistryEntity;
import com.ems.tenant.entity.MessageTranslationEntity;
import com.ems.tenant.entity.TenantEntity;
import com.ems.tenant.entity.TenantMessageTranslationEntity;
import com.ems.tenant.repository.MessageRegistryRepository;
import com.ems.tenant.repository.MessageTranslationRepository;
import com.ems.tenant.repository.TenantMessageTranslationRepository;
import com.ems.tenant.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessageRegistryService {

    private final MessageRegistryRepository messageRegistryRepository;
    private final MessageTranslationRepository messageTranslationRepository;
    private final TenantMessageTranslationRepository tenantMessageTranslationRepository;
    private final TenantRepository tenantRepository;

    @Transactional
    public MessageBatchRegistrationResultResponse registerBatch(List<MessageBatchRegistrationRequest> requests) {
        if (requests == null || requests.isEmpty()) {
            return new MessageBatchRegistrationResultResponse(0, 0);
        }

        Map<String, MessageBatchRegistrationRequest> deduplicated = new LinkedHashMap<>();
        for (MessageBatchRegistrationRequest request : requests) {
            deduplicated.putIfAbsent(normalizeCode(request.code()), request);
        }

        Set<String> existingCodes = new LinkedHashSet<>(messageRegistryRepository.findAllById(deduplicated.keySet())
            .stream()
            .map(MessageRegistryEntity::getCode)
            .toList());

        List<MessageRegistryEntity> registriesToCreate = new ArrayList<>();
        List<MessageTranslationEntity> translationsToCreate = new ArrayList<>();

        for (Map.Entry<String, MessageBatchRegistrationRequest> entry : deduplicated.entrySet()) {
            String code = entry.getKey();
            MessageBatchRegistrationRequest request = entry.getValue();
            if (existingCodes.contains(code)) {
                continue;
            }

            registriesToCreate.add(MessageRegistryEntity.builder()
                .code(code)
                .type(request.type().trim().toUpperCase(Locale.ROOT))
                .category(request.category().trim())
                .httpStatus(request.httpStatus())
                .defaultTitle(request.defaultTitle().trim())
                .defaultDetail(trimToNull(request.defaultDetail()))
                .build());

            if (request.translations() == null) {
                continue;
            }

            Set<String> seenLocales = new LinkedHashSet<>();
            for (MessageTranslationRequest translation : request.translations()) {
                String localeCode = normalizeLocale(translation.localeCode());
                if (!seenLocales.add(localeCode)) {
                    continue;
                }
                translationsToCreate.add(MessageTranslationEntity.builder()
                    .code(code)
                    .localeCode(localeCode)
                    .title(translation.title().trim())
                    .detail(trimToNull(translation.detail()))
                    .build());
            }
        }

        if (!registriesToCreate.isEmpty()) {
            messageRegistryRepository.saveAll(registriesToCreate);
        }
        if (!translationsToCreate.isEmpty()) {
            messageTranslationRepository.saveAll(translationsToCreate);
        }

        return new MessageBatchRegistrationResultResponse(
            registriesToCreate.size(),
            deduplicated.size() - registriesToCreate.size()
        );
    }

    @Transactional(readOnly = true)
    public List<MessageCatalogEntryResponse> getMessagesByPrefixes(String prefixCsv) {
        List<String> prefixes = parsePrefixes(prefixCsv);
        List<MessageRegistryEntity> registries = messageRegistryRepository.findAllOrdered().stream()
            .filter(registry -> matchesPrefixes(registry.getCode(), prefixes))
            .toList();

        if (registries.isEmpty()) {
            return List.of();
        }

        Map<String, List<MessageTranslationResponse>> translationsByCode =
            groupTranslations(messageTranslationRepository.findByCodeIn(
                registries.stream().map(MessageRegistryEntity::getCode).toList()
            ));

        return registries.stream()
            .map(registry -> new MessageCatalogEntryResponse(
                registry.getCode(),
                registry.getType(),
                registry.getCategory(),
                registry.getHttpStatus(),
                registry.getDefaultTitle(),
                registry.getDefaultDetail(),
                translationsByCode.getOrDefault(registry.getCode(), List.of())
            ))
            .toList();
    }

    @Transactional(readOnly = true)
    public ResolvedMessageResponse resolveMessage(String code, String locale, String tenantId) {
        String normalizedCode = normalizeCode(code);
        MessageRegistryEntity registry = messageRegistryRepository.findById(normalizedCode)
            .orElseThrow(() -> new ResourceNotFoundException("Message not found: " + normalizedCode));

        String normalizedLocale = normalizeLocale(locale);
        UUID tenantUuid = resolveTenantUuid(tenantId);
        TenantMessageTranslationEntity tenantTranslation = normalizedLocale == null || tenantUuid == null
            ? null
            : tenantMessageTranslationRepository
                .findByTenantUuidAndCodeAndLocaleCode(tenantUuid, normalizedCode, normalizedLocale)
                .orElse(null);

        MessageTranslationEntity translation = normalizedLocale == null
            ? null
            : messageTranslationRepository.findByCodeAndLocaleCode(normalizedCode, normalizedLocale).orElse(null);

        return new ResolvedMessageResponse(
            registry.getCode(),
            tenantTranslation != null ? tenantTranslation.getTitle()
                : translation != null ? translation.getTitle() : registry.getDefaultTitle(),
            tenantTranslation != null && tenantTranslation.getDetail() != null ? tenantTranslation.getDetail()
                : translation != null && translation.getDetail() != null ? translation.getDetail() : registry.getDefaultDetail(),
            registry.getHttpStatus(),
            normalizedLocale
        );
    }

    private UUID resolveTenantUuid(String tenantId) {
        if (tenantId == null || tenantId.isBlank()) {
            return null;
        }

        String normalizedTenantId = tenantId.trim();
        return tenantRepository.findById(normalizedTenantId)
            .map(TenantEntity::getUuid)
            .or(() -> tryFindByUuid(normalizedTenantId).map(TenantEntity::getUuid))
            .orElse(null);
    }

    private java.util.Optional<TenantEntity> tryFindByUuid(String tenantId) {
        try {
            return tenantRepository.findByUuid(UUID.fromString(tenantId));
        } catch (IllegalArgumentException ignored) {
            return java.util.Optional.empty();
        }
    }

    private Map<String, List<MessageTranslationResponse>> groupTranslations(Collection<MessageTranslationEntity> translations) {
        return translations.stream()
            .sorted(Comparator.comparing(MessageTranslationEntity::getLocaleCode))
            .collect(Collectors.groupingBy(
                MessageTranslationEntity::getCode,
                LinkedHashMap::new,
                Collectors.mapping(
                    entity -> new MessageTranslationResponse(entity.getLocaleCode(), entity.getTitle(), entity.getDetail()),
                    Collectors.toList()
                )
            ));
    }

    private boolean matchesPrefixes(String code, List<String> prefixes) {
        return prefixes.stream().anyMatch(prefix -> code.startsWith(prefix + "-"));
    }

    private List<String> parsePrefixes(String prefixCsv) {
        if (prefixCsv == null || prefixCsv.isBlank()) {
            throw new IllegalArgumentException("prefix is required");
        }

        List<String> prefixes = java.util.Arrays.stream(prefixCsv.split(","))
            .map(String::trim)
            .filter(value -> !value.isBlank())
            .map(value -> value.toUpperCase(Locale.ROOT))
            .distinct()
            .toList();

        if (prefixes.isEmpty()) {
            throw new IllegalArgumentException("prefix is required");
        }
        return prefixes;
    }

    private String normalizeCode(String code) {
        if (code == null || code.isBlank()) {
            throw new IllegalArgumentException("code is required");
        }
        return code.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeLocale(String locale) {
        if (locale == null || locale.isBlank()) {
            return null;
        }
        return locale.trim().replace('_', '-').toLowerCase(Locale.ROOT);
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
