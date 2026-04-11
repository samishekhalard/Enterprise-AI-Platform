package com.ems.auth.i18n;

import com.ems.auth.client.MessageRegistryClient;
import com.ems.auth.client.ResolvedMessageResponse;
import com.ems.auth.dto.AuthUiMessageResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthUiMessageResolver {

    private final MessageRegistryClient messageRegistryClient;

    public List<AuthUiMessageResponse> resolveAll(
        List<AuthUiMessageType> types,
        Locale locale,
        String tenantId
    ) {
        return types.stream()
            .map(type -> resolve(type, locale, tenantId))
            .toList();
    }

    public AuthUiMessageResponse resolve(
        AuthUiMessageType type,
        Locale locale,
        String tenantId
    ) {
        for (String candidateLocale : localeCandidates(locale)) {
            try {
                ResolvedMessageResponse response =
                    messageRegistryClient.resolveMessage(type.code(), candidateLocale, tenantId);
                String text = response.title() != null && !response.title().isBlank()
                    ? response.title()
                    : type.fallbackText(locale);
                String resolvedLocale = response.locale() != null && !response.locale().isBlank()
                    ? response.locale()
                    : candidateLocale;
                return new AuthUiMessageResponse(type.code(), text, resolvedLocale);
            } catch (Exception ex) {
                log.trace("Falling back to local auth UI message for code {} and locale {}: {}",
                    type.code(), candidateLocale, ex.getMessage());
            }
        }

        Locale effectiveLocale = locale != null ? locale : Locale.ENGLISH;
        return new AuthUiMessageResponse(
            type.code(),
            type.fallbackText(effectiveLocale),
            effectiveLocale.toLanguageTag()
        );
    }

    private Set<String> localeCandidates(Locale locale) {
        Set<String> candidates = new LinkedHashSet<>();
        Locale effectiveLocale = locale != null ? locale : Locale.ENGLISH;
        String languageTag = effectiveLocale.toLanguageTag();
        if (!languageTag.isBlank()) {
            candidates.add(languageTag);
        }
        if (!effectiveLocale.getLanguage().isBlank()) {
            candidates.add(effectiveLocale.getLanguage());
        }
        candidates.add("en");
        return candidates;
    }
}
