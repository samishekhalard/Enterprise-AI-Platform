package com.ems.ai.dto;

import com.ems.ai.entity.AgentEntity.LlmProvider;

import java.util.List;

public record ProviderInfoDTO(
    LlmProvider provider,
    String displayName,
    Boolean enabled,
    List<ModelInfoDTO> models,
    Boolean supportsStreaming,
    Boolean supportsEmbeddings
) {
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private LlmProvider provider;
        private String displayName;
        private Boolean enabled;
        private List<ModelInfoDTO> models;
        private Boolean supportsStreaming;
        private Boolean supportsEmbeddings;

        public Builder provider(LlmProvider provider) { this.provider = provider; return this; }
        public Builder displayName(String displayName) { this.displayName = displayName; return this; }
        public Builder enabled(Boolean enabled) { this.enabled = enabled; return this; }
        public Builder models(List<ModelInfoDTO> models) { this.models = models; return this; }
        public Builder supportsStreaming(Boolean supportsStreaming) { this.supportsStreaming = supportsStreaming; return this; }
        public Builder supportsEmbeddings(Boolean supportsEmbeddings) { this.supportsEmbeddings = supportsEmbeddings; return this; }

        public ProviderInfoDTO build() {
            return new ProviderInfoDTO(provider, displayName, enabled, models, supportsStreaming, supportsEmbeddings);
        }
    }
}
