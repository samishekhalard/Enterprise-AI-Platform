package com.ems.ai.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class AiProviderPropertiesTest {

    @Test
    @DisplayName("RagConfig should have sensible defaults")
    void ragConfig_shouldHaveDefaults() {
        // Arrange & Act
        AiProviderProperties.RagConfig config = new AiProviderProperties.RagConfig();

        // Assert
        assertThat(config.getChunkSize()).isEqualTo(1000);
        assertThat(config.getChunkOverlap()).isEqualTo(200);
        assertThat(config.getMaxChunksPerQuery()).isEqualTo(5);
        assertThat(config.getSimilarityThreshold()).isEqualTo(0.7);
        assertThat(config.getEmbeddingDimension()).isEqualTo(1536);
    }

    @Test
    @DisplayName("ConversationConfig should have sensible defaults")
    void conversationConfig_shouldHaveDefaults() {
        // Arrange & Act
        AiProviderProperties.ConversationConfig config = new AiProviderProperties.ConversationConfig();

        // Assert
        assertThat(config.getMaxContextMessages()).isEqualTo(20);
        assertThat(config.getContextCacheTtl()).isEqualTo(3600);
    }

    @Test
    @DisplayName("ProviderConfig should have sensible defaults")
    void providerConfig_shouldHaveDefaults() {
        // Arrange & Act
        AiProviderProperties.ProviderConfig config = new AiProviderProperties.ProviderConfig();

        // Assert
        assertThat(config.isEnabled()).isFalse();
        assertThat(config.getTimeout()).isEqualTo(60000);
        assertThat(config.getApiKey()).isNull();
        assertThat(config.getBaseUrl()).isNull();
    }

    @Test
    @DisplayName("AiProviderProperties should initialize with empty maps")
    void aiProviderProperties_shouldInitializeEmpty() {
        // Arrange & Act
        AiProviderProperties properties = new AiProviderProperties();

        // Assert
        assertThat(properties.getProviders()).isNotNull().isEmpty();
        assertThat(properties.getRag()).isNotNull();
        assertThat(properties.getConversation()).isNotNull();
    }

    @Test
    @DisplayName("ProviderConfig should allow setting all fields")
    void providerConfig_shouldAllowSettingFields() {
        // Arrange
        AiProviderProperties.ProviderConfig config = new AiProviderProperties.ProviderConfig();

        // Act
        config.setEnabled(true);
        config.setApiKey("sk-test-key");
        config.setBaseUrl("https://api.openai.com");
        config.setDefaultModel("gpt-4o");
        config.setEmbeddingModel("text-embedding-3-small");
        config.setTimeout(30000);

        // Assert
        assertThat(config.isEnabled()).isTrue();
        assertThat(config.getApiKey()).isEqualTo("sk-test-key");
        assertThat(config.getBaseUrl()).isEqualTo("https://api.openai.com");
        assertThat(config.getDefaultModel()).isEqualTo("gpt-4o");
        assertThat(config.getEmbeddingModel()).isEqualTo("text-embedding-3-small");
        assertThat(config.getTimeout()).isEqualTo(30000);
    }
}
