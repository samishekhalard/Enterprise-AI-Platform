package com.ems.ai.provider;

import com.ems.ai.config.AiProviderProperties;
import com.ems.ai.dto.ModelInfoDTO;
import com.ems.ai.dto.StreamChunkDTO;
import com.ems.ai.entity.AgentEntity.LlmProvider;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;

import java.time.Duration;
import java.util.List;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
public class AnthropicProvider implements LlmProviderService {

    private final AiProviderProperties.ProviderConfig config;
    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    private static final String ANTHROPIC_VERSION = "2023-06-01";

    private static final List<ModelInfoDTO> MODELS = List.of(
        ModelInfoDTO.builder()
            .id("claude-sonnet-4-20250514")
            .name("Claude Sonnet 4")
            .description("Balanced performance and speed")
            .maxTokens(200000)
            .supportsVision(true)
            .isDefault(true)
            .build(),
        ModelInfoDTO.builder()
            .id("claude-opus-4-20250514")
            .name("Claude Opus 4")
            .description("Most capable reasoning model")
            .maxTokens(200000)
            .supportsVision(true)
            .isDefault(false)
            .build(),
        ModelInfoDTO.builder()
            .id("claude-3-5-sonnet-20241022")
            .name("Claude 3.5 Sonnet")
            .description("Previous generation balanced model")
            .maxTokens(200000)
            .supportsVision(true)
            .isDefault(false)
            .build(),
        ModelInfoDTO.builder()
            .id("claude-3-5-haiku-20241022")
            .name("Claude 3.5 Haiku")
            .description("Fast and efficient")
            .maxTokens(200000)
            .supportsVision(true)
            .isDefault(false)
            .build()
    );

    public AnthropicProvider(AiProviderProperties properties, ObjectMapper objectMapper) {
        this.config = properties.getProviders().get("anthropic");
        this.objectMapper = objectMapper;
        this.webClient = WebClient.builder()
            .baseUrl(config.getBaseUrl())
            .defaultHeader("x-api-key", config.getApiKey())
            .defaultHeader("anthropic-version", ANTHROPIC_VERSION)
            .defaultHeader("Content-Type", "application/json")
            .build();
    }

    @Override
    public LlmProvider getProviderType() {
        return LlmProvider.ANTHROPIC;
    }

    @Override
    public String getDisplayName() {
        return "Anthropic Claude";
    }

    @Override
    public boolean isEnabled() {
        return config.isEnabled() && config.getApiKey() != null && !config.getApiKey().isEmpty();
    }

    @Override
    public List<ModelInfoDTO> getSupportedModels() {
        return MODELS;
    }

    @Override
    public boolean supportsStreaming() {
        return true;
    }

    @Override
    public boolean supportsEmbeddings() {
        return false;
    }

    @Override
    public CompletableFuture<ChatResponse> chat(ChatRequest request) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                ObjectNode body = buildRequestBody(request, false);

                String response = webClient.post()
                    .uri("/v1/messages")
                    .bodyValue(body.toString())
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofMillis(config.getTimeout()))
                    .block();

                return parseResponse(response);
            } catch (Exception e) {
                log.error("Anthropic chat error", e);
                throw new RuntimeException("Anthropic API error: " + e.getMessage(), e);
            }
        });
    }

    @Override
    public Flux<StreamChunkDTO> streamChat(ChatRequest request) {
        ObjectNode body = buildRequestBody(request, true);

        return webClient.post()
            .uri("/v1/messages")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(body.toString())
            .retrieve()
            .bodyToFlux(String.class)
            .filter(line -> !line.isEmpty())
            .map(this::parseStreamChunk)
            .filter(chunk -> chunk != null)
            .onErrorResume(e -> {
                log.error("Anthropic stream error", e);
                return Flux.just(StreamChunkDTO.error("Stream error: " + e.getMessage()));
            });
    }

    @Override
    public float[] generateEmbedding(String text) {
        throw new UnsupportedOperationException("Anthropic does not support embeddings. Use OpenAI for embeddings.");
    }

    private ObjectNode buildRequestBody(ChatRequest request, boolean stream) {
        ObjectNode body = objectMapper.createObjectNode();
        body.put("model", request.model());
        body.put("max_tokens", 4096);
        body.put("stream", stream);

        if (request.systemPrompt() != null && !request.systemPrompt().isEmpty()) {
            body.put("system", request.systemPrompt());
        }

        ArrayNode messages = body.putArray("messages");
        for (ChatMessage msg : request.messages()) {
            ObjectNode msgNode = messages.addObject();
            msgNode.put("role", msg.role().toLowerCase());
            msgNode.put("content", msg.content());
        }

        if (request.config() != null) {
            if (request.config().containsKey("temperature")) {
                body.put("temperature", ((Number) request.config().get("temperature")).doubleValue());
            }
            if (request.config().containsKey("maxTokens")) {
                body.put("max_tokens", ((Number) request.config().get("maxTokens")).intValue());
            }
        }

        return body;
    }

    private ChatResponse parseResponse(String response) {
        try {
            JsonNode root = objectMapper.readTree(response);
            String content = root.path("content").get(0).path("text").asText();
            int inputTokens = root.path("usage").path("input_tokens").asInt();
            int outputTokens = root.path("usage").path("output_tokens").asInt();
            String stopReason = root.path("stop_reason").asText();

            return new ChatResponse(content, inputTokens, outputTokens, stopReason);
        } catch (Exception e) {
            log.error("Failed to parse Anthropic response", e);
            throw new RuntimeException("Failed to parse response", e);
        }
    }

    private StreamChunkDTO parseStreamChunk(String line) {
        try {
            if (line.startsWith("data: ")) {
                line = line.substring(6);
            }
            if (line.startsWith("event:") || line.isEmpty()) {
                return null;
            }

            JsonNode root = objectMapper.readTree(line);
            String type = root.path("type").asText();

            if ("content_block_delta".equals(type)) {
                String text = root.path("delta").path("text").asText(null);
                if (text != null && !text.isEmpty()) {
                    return StreamChunkDTO.content(text);
                }
            } else if ("message_stop".equals(type)) {
                return StreamChunkDTO.done(null, 0);
            } else if ("message_delta".equals(type)) {
                String stopReason = root.path("delta").path("stop_reason").asText(null);
                if (stopReason != null) {
                    int outputTokens = root.path("usage").path("output_tokens").asInt(0);
                    return StreamChunkDTO.done(null, outputTokens);
                }
            }

            return null;
        } catch (Exception e) {
            log.warn("Failed to parse stream chunk: {}", line, e);
            return null;
        }
    }
}
