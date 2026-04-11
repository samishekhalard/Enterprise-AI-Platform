package com.ems.ai.provider;

import com.ems.ai.dto.ProviderInfoDTO;
import com.ems.ai.entity.AgentEntity.LlmProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class LlmProviderFactory {

    private final List<LlmProviderService> providers;

    private Map<LlmProvider, LlmProviderService> providerMap;

    private Map<LlmProvider, LlmProviderService> getProviderMap() {
        if (providerMap == null) {
            providerMap = providers.stream()
                .collect(Collectors.toMap(
                    LlmProviderService::getProviderType,
                    Function.identity()
                ));
        }
        return providerMap;
    }

    public LlmProviderService getProvider(LlmProvider provider) {
        LlmProviderService service = getProviderMap().get(provider);
        if (service == null) {
            throw new IllegalArgumentException("Provider not found: " + provider);
        }
        if (!service.isEnabled()) {
            throw new IllegalStateException("Provider is not enabled: " + provider);
        }
        return service;
    }

    public List<ProviderInfoDTO> getAvailableProviders() {
        return providers.stream()
            .map(p -> ProviderInfoDTO.builder()
                .provider(p.getProviderType())
                .displayName(p.getDisplayName())
                .enabled(p.isEnabled())
                .models(p.getSupportedModels())
                .supportsStreaming(p.supportsStreaming())
                .supportsEmbeddings(p.supportsEmbeddings())
                .build())
            .collect(Collectors.toList());
    }

    public List<ProviderInfoDTO> getEnabledProviders() {
        return getAvailableProviders().stream()
            .filter(ProviderInfoDTO::enabled)
            .collect(Collectors.toList());
    }

    public boolean isProviderEnabled(LlmProvider provider) {
        LlmProviderService service = getProviderMap().get(provider);
        return service != null && service.isEnabled();
    }
}
