package com.ems.auth.i18n;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Locale;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class AuthProblemResponseWriter {

    private final ObjectMapper objectMapper;
    private final AuthProblemFactory problemFactory;

    public void write(
        HttpServletRequest request,
        HttpServletResponse response,
        AuthProblemType type,
        Map<String, ?> arguments,
        Map<String, ?> extraProperties
    ) throws IOException {
        Locale locale = request != null ? request.getLocale() : Locale.ENGLISH;
        String tenantId = request != null ? request.getHeader("X-Tenant-ID") : null;
        ProblemDetail problem = problemFactory.create(type, locale, tenantId, arguments, extraProperties);

        response.setStatus(problem.getStatus());
        response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
        objectMapper.writeValue(response.getWriter(), problem);
    }
}
