package com.ems.tenant.controller;

import com.ems.tenant.dto.internal.MessageBatchRegistrationRequest;
import com.ems.tenant.dto.internal.MessageBatchRegistrationResultResponse;
import com.ems.tenant.dto.internal.MessageCatalogEntryResponse;
import com.ems.tenant.dto.internal.ResolvedMessageResponse;
import com.ems.tenant.service.MessageRegistryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@Validated
@RequestMapping({"/internal/messages", "/api/v1/internal/messages"})
@RequiredArgsConstructor
@Tag(name = "Internal Message Registry", description = "Internal APIs for message catalog registration and resolution")
public class InternalMessageRegistryController {

    private final MessageRegistryService messageRegistryService;

    @PostMapping("/batch")
    @Operation(summary = "Register a service message catalog batch")
    public ResponseEntity<MessageBatchRegistrationResultResponse> registerBatch(
        @Valid @RequestBody List<@Valid MessageBatchRegistrationRequest> requests
    ) {
        MessageBatchRegistrationResultResponse result = messageRegistryService.registerBatch(requests);
        HttpStatus status = result.registeredCount() > 0 ? HttpStatus.CREATED : HttpStatus.OK;
        return ResponseEntity.status(status).body(result);
    }

    @GetMapping
    @Operation(summary = "List message catalog entries by comma-separated prefixes")
    public ResponseEntity<List<MessageCatalogEntryResponse>> getMessagesByPrefix(@RequestParam String prefix) {
        return ResponseEntity.ok(messageRegistryService.getMessagesByPrefixes(prefix));
    }

    @GetMapping("/{code}")
    @Operation(summary = "Resolve a single message for a locale")
    public ResponseEntity<ResolvedMessageResponse> resolveMessage(
        @PathVariable String code,
        @RequestParam(required = false) String locale,
        @RequestParam(required = false) String tenantId
    ) {
        return ResponseEntity.ok(messageRegistryService.resolveMessage(code, locale, tenantId));
    }
}
