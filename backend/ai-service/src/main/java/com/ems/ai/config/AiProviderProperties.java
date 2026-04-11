package com.ems.ai.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.HashMap;
import java.util.Map;

@Data
@Configuration
@ConfigurationProperties(prefix = "ai")
public class AiProviderProperties {

    private Map<String, ProviderConfig> providers = new HashMap<>();
    private RagConfig rag = new RagConfig();
    private ConversationConfig conversation = new ConversationConfig();

    @Data
    public static class ProviderConfig {
        private boolean enabled = false;
        private String apiKey;
        private String baseUrl;
        private String defaultModel;
        private String embeddingModel;
        private long timeout = 60000;
    }

    @Data
    public static class RagConfig {
        private int chunkSize = 1000;
        private int chunkOverlap = 200;
        private int maxChunksPerQuery = 5;
        private double similarityThreshold = 0.7;
        private int embeddingDimension = 1536;
    }

    @Data
    public static class ConversationConfig {
        private int maxContextMessages = 20;
        private int contextCacheTtl = 3600;
    }
}
