package com.ems.auth.i18n;

import com.ems.auth.client.MessageRegistryClient;
import com.ems.auth.client.ResolvedMessageResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthLocalizedMessageResolver {

    private final MessageRegistryClient messageRegistryClient;

    public ResolvedAuthMessage resolve(
        AuthProblemType type,
        Locale locale,
        String tenantId,
        Map<String, ?> arguments
    ) {
        Set<String> candidates = localeCandidates(locale);
        Exception lastException = null;
        for (String candidateLocale : candidates) {
            try {
                ResolvedMessageResponse response =
                    messageRegistryClient.resolveMessage(type.code(), candidateLocale, tenantId);
                return new ResolvedAuthMessage(
                    type.code(),
                    type.legacyError(),
                    applyArguments(orDefault(response.title(), type.fallbackTitle(locale)), arguments),
                    applyArguments(orDefault(response.detail(), type.fallbackDetail(locale, arguments)), arguments),
                    response.httpStatus() != null ? HttpStatus.valueOf(response.httpStatus()) : type.httpStatus(),
                    response.locale()
                );
            } catch (Exception ex) {
                lastException = ex;
            }
        }
        if (lastException != null) {
            log.trace("All locale candidates failed for code {}, tried {}, falling back to enum: {}",
                type.code(), candidates, lastException.getMessage());
        }

        return new ResolvedAuthMessage(
            type.code(),
            type.legacyError(),
            type.fallbackTitle(locale),
            type.fallbackDetail(locale, arguments),
            type.httpStatus(),
            locale != null ? locale.toLanguageTag() : Locale.ENGLISH.toLanguageTag()
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

    private String applyArguments(String template, Map<String, ?> arguments) {
        if (template == null || arguments == null || arguments.isEmpty()) {
            return template;
        }

        String resolved = template;
        for (Map.Entry<String, ?> entry : arguments.entrySet()) {
            resolved = resolved.replace("{" + entry.getKey() + "}", String.valueOf(entry.getValue()));
        }
        return resolved;
    }

    private String orDefault(String candidate, String fallback) {
        return candidate != null && !candidate.isBlank() ? candidate : fallback;
    }

    public record ResolvedAuthMessage(
        String code,
        String legacyError,
        String title,
        String detail,
        HttpStatus status,
        String locale
    ) {
    }
}
