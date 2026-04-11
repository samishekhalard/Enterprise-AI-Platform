package com.ems.ai.provider;

import com.ems.ai.dto.ModelInfoDTO;
import com.ems.ai.dto.ProviderInfoDTO;
import com.ems.ai.dto.StreamChunkDTO;
import com.ems.ai.entity.AgentEntity.LlmProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.concurrent.CompletableFuture;

import static org.assertj.core.api.Assertions.*;

class LlmProviderFactoryTest {

    private LlmProviderFactory factory;
    private TestProvider openAiProvider;
    private TestProvider anthropicProvider;

    @BeforeEach
    void setUp() {
        openAiProvider = new TestProvider(LlmProvider.OPENAI, "OpenAI", true);
        anthropicProvider = new TestProvider(LlmProvider.ANTHROPIC, "Anthropic", false);
        factory = new LlmProviderFactory(List.of(openAiProvider, anthropicProvider));
    }

    @Nested
    @DisplayName("getProvider")
    class GetProvider {

        @Test
        @DisplayName("should return provider when it exists and is enabled")
        void getProvider_whenExistsAndEnabled_shouldReturn() {
            // Arrange - openAiProvider is enabled

            // Act
            LlmProviderService result = factory.getProvider(LlmProvider.OPENAI);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getProviderType()).isEqualTo(LlmProvider.OPENAI);
        }

        @Test
        @DisplayName("should throw when provider exists but is not enabled")
        void getProvider_whenNotEnabled_shouldThrow() {
            // Arrange - anthropicProvider is disabled

            // Act & Assert
            assertThatThrownBy(() -> factory.getProvider(LlmProvider.ANTHROPIC))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("not enabled");
        }

        @Test
        @DisplayName("should throw when provider does not exist")
        void getProvider_whenNotFound_shouldThrow() {
            // Arrange - GEMINI not registered

            // Act & Assert
            assertThatThrownBy(() -> factory.getProvider(LlmProvider.GEMINI))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Provider not found");
        }
    }

    @Nested
    @DisplayName("getAvailableProviders")
    class GetAvailableProviders {

        @Test
        @DisplayName("should return all registered providers with info")
        void getAvailableProviders_shouldReturnAll() {
            // Arrange - 2 providers registered

            // Act
            List<ProviderInfoDTO> result = factory.getAvailableProviders();

            // Assert
            assertThat(result).hasSize(2);
            assertThat(result).extracting(ProviderInfoDTO::displayName)
                .containsExactlyInAnyOrder("OpenAI", "Anthropic");
        }

        @Test
        @DisplayName("should include enabled status for each provider")
        void getAvailableProviders_shouldIncludeEnabledStatus() {
            // Arrange - OpenAI enabled, Anthropic disabled

            // Act
            List<ProviderInfoDTO> result = factory.getAvailableProviders();

            // Assert
            ProviderInfoDTO openAi = result.stream()
                .filter(p -> p.provider() == LlmProvider.OPENAI).findFirst().orElseThrow();
            ProviderInfoDTO anthropic = result.stream()
                .filter(p -> p.provider() == LlmProvider.ANTHROPIC).findFirst().orElseThrow();

            assertThat(openAi.enabled()).isTrue();
            assertThat(anthropic.enabled()).isFalse();
        }
    }

    @Nested
    @DisplayName("getEnabledProviders")
    class GetEnabledProviders {

        @Test
        @DisplayName("should return only enabled providers")
        void getEnabledProviders_shouldFilterDisabled() {
            // Arrange - only OpenAI is enabled

            // Act
            List<ProviderInfoDTO> result = factory.getEnabledProviders();

            // Assert
            assertThat(result).hasSize(1);
            assertThat(result.get(0).provider()).isEqualTo(LlmProvider.OPENAI);
        }
    }

    @Nested
    @DisplayName("isProviderEnabled")
    class IsProviderEnabled {

        @Test
        @DisplayName("should return true for enabled provider")
        void isProviderEnabled_whenEnabled_shouldReturnTrue() {
            // Act & Assert
            assertThat(factory.isProviderEnabled(LlmProvider.OPENAI)).isTrue();
        }

        @Test
        @DisplayName("should return false for disabled provider")
        void isProviderEnabled_whenDisabled_shouldReturnFalse() {
            // Act & Assert
            assertThat(factory.isProviderEnabled(LlmProvider.ANTHROPIC)).isFalse();
        }

        @Test
        @DisplayName("should return false for unregistered provider")
        void isProviderEnabled_whenNotRegistered_shouldReturnFalse() {
            // Act & Assert
            assertThat(factory.isProviderEnabled(LlmProvider.GEMINI)).isFalse();
        }
    }

    /**
     * Minimal test implementation of LlmProviderService for unit testing the factory.
     */
    private static class TestProvider implements LlmProviderService {
        private final LlmProvider type;
        private final String displayName;
        private final boolean enabled;

        TestProvider(LlmProvider type, String displayName, boolean enabled) {
            this.type = type;
            this.displayName = displayName;
            this.enabled = enabled;
        }

        @Override public LlmProvider getProviderType() { return type; }
        @Override public String getDisplayName() { return displayName; }
        @Override public boolean isEnabled() { return enabled; }
        @Override public List<ModelInfoDTO> getSupportedModels() { return List.of(); }
        @Override public boolean supportsStreaming() { return true; }
        @Override public boolean supportsEmbeddings() { return type == LlmProvider.OPENAI; }
        @Override public CompletableFuture<ChatResponse> chat(ChatRequest request) {
            return CompletableFuture.completedFuture(new ChatResponse("test", 0, 0, "stop"));
        }
        @Override public Flux<StreamChunkDTO> streamChat(ChatRequest request) {
            return Flux.just(StreamChunkDTO.content("test"));
        }
        @Override public float[] generateEmbedding(String text) {
            return new float[]{0.1f, 0.2f};
        }
    }
}
