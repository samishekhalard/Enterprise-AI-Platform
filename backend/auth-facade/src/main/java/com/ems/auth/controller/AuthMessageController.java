package com.ems.auth.controller;

import com.ems.auth.dto.AuthUiMessageResponse;
import com.ems.auth.filter.TenantContextFilter;
import com.ems.auth.i18n.AuthUiMessageResolver;
import com.ems.auth.i18n.AuthUiMessageType;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api/v1/auth/messages")
@RequiredArgsConstructor
@Tag(name = "Auth Messages", description = "Public localized UI messages for authentication flows")
public class AuthMessageController {

    private final AuthUiMessageResolver authUiMessageResolver;

    @GetMapping
    @Operation(summary = "Resolve localized auth UI messages")
    public ResponseEntity<List<AuthUiMessageResponse>> getMessages(
        @RequestParam String codes,
        Locale locale,
        @RequestHeader(value = TenantContextFilter.TENANT_HEADER, required = false) String tenantId
    ) {
        List<AuthUiMessageType> requestedTypes = Arrays.stream(codes.split(","))
            .map(String::trim)
            .filter(value -> !value.isBlank())
            .map(AuthUiMessageType::fromCode)
            .flatMap(java.util.Optional::stream)
            .distinct()
            .toList();

        if (requestedTypes.isEmpty()) {
            return ResponseEntity.badRequest().body(List.of());
        }

        return ResponseEntity.ok(authUiMessageResolver.resolveAll(requestedTypes, locale, tenantId));
    }
}
