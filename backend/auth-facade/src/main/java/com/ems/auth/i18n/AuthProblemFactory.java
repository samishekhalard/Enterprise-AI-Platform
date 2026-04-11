package com.ems.auth.i18n;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ProblemDetail;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class AuthProblemFactory {

    private final AuthLocalizedMessageResolver messageResolver;

    public ProblemDetail create(
        AuthProblemType type,
        Locale locale,
        String tenantId,
        Map<String, ?> arguments,
        Map<String, ?> extraProperties
    ) {
        Map<String, Object> resolvedArguments = new LinkedHashMap<>();
        resolvedArguments.put("code", type.code());
        if (arguments != null) {
            resolvedArguments.putAll(arguments);
        }

        AuthLocalizedMessageResolver.ResolvedAuthMessage message =
            messageResolver.resolve(type, locale, tenantId, resolvedArguments);

        ProblemDetail problem = ProblemDetail.forStatusAndDetail(message.status(), message.detail());
        problem.setTitle(message.title());
        problem.setType(URI.create("urn:emsist:auth:" + message.code().toLowerCase(Locale.ROOT)));
        problem.setProperty("code", message.code());
        problem.setProperty("error", message.legacyError());
        problem.setProperty("message", message.detail());
        problem.setProperty("timestamp", Instant.now());
        problem.setProperty("locale", message.locale());
        if (tenantId != null && !tenantId.isBlank()) {
            problem.setProperty("tenantId", tenantId);
        }

        if (extraProperties != null) {
            extraProperties.forEach(problem::setProperty);
        }

        return problem;
    }
}
