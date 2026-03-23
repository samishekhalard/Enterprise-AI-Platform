package com.ems.ai.controller;

import com.ems.ai.dto.ProviderInfoDTO;
import com.ems.ai.provider.LlmProviderFactory;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/providers")
@RequiredArgsConstructor
@Tag(name = "Providers", description = "LLM provider information")
public class ProviderController {

    private final LlmProviderFactory providerFactory;

    @GetMapping
    @Operation(summary = "Get all available LLM providers")
    public ResponseEntity<List<ProviderInfoDTO>> getProviders() {
        List<ProviderInfoDTO> providers = providerFactory.getAvailableProviders();
        return ResponseEntity.ok(providers);
    }

    @GetMapping("/enabled")
    @Operation(summary = "Get enabled LLM providers")
    public ResponseEntity<List<ProviderInfoDTO>> getEnabledProviders() {
        List<ProviderInfoDTO> providers = providerFactory.getEnabledProviders();
        return ResponseEntity.ok(providers);
    }
}
