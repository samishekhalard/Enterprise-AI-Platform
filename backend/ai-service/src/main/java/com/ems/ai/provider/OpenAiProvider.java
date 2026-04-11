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
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
public class OpenAiProvider implements LlmProviderService {

    private final AiProviderProperties.ProviderConfig config;
    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    private static final List<ModelInfoDTO> MODELS = List.of(
        ModelInfoDTO.builder()
            .id("gpt-4o")
            .name("GPT-4o")
            .description("Most capable multimodal model")
            .maxTokens(128000)
            .supportsVision(true)
            .isDefault(true)
            .build(),
        ModelInfoDTO.builder()
            .id("gpt-4o-mini")
            .name("GPT-4o Mini")
            .description("Fast and cost-effective")
            .maxTokens(128000)
            .supportsVision(true)
            .isDefault(false)
            .build(),
        ModelInfoDTO.builder()
            .id("gpt-4-turbo")
            .name("GPT-4 Turbo")
            .description("Advanced reasoning model")
            .maxTokens(128000)
            .supportsVision(true)
            .isDefault(false)
            .build(),
        ModelInfoDTO.builder()
            .id("gpt-3.5-turbo")
            .name("GPT-3.5 Turbo")
            .description("Fast and efficient")
            .maxTokens(16385)
            .supportsVision(false)
            .isDefault(false)
            .build()
    );

    public OpenAiProvider(AiProviderProperties properties, ObjectMapper objectMapper) {
        this.config = properties.getProviders().get("openai");
        this.objectMapper = objectMapper;
        this.webClient = WebClient.builder()
            .baseUrl(config.getBaseUrl())
            .defaultHeader("Authorization", "Bearer " + config.getApiKey())
            .defaultHeader("Content-Type", "application/json")
            .build();
    }

    @Override
    public LlmProvider getProviderType() {
        return LlmProvider.OPENAI;
    }

    @Override
    public String getDisplayName() {
        return "OpenAI";
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
        return true;
    }

    @Override
    public CompletableFuture<ChatResponse> chat(ChatRequest request) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                ObjectNode body = buildRequestBody(request, false);

                String response = webClient.post()
                    .uri("/chat/completions")
                    .bodyValue(body.toString())
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofMillis(config.getTimeout()))
                    .block();

                return parseResponse(response);
            } catch (Exception e) {
                log.error("OpenAI chat error", e);
                throw new RuntimeException("OpenAI API error: " + e.getMessage(), e);
            }
        });
    }

    @Override
    public Flux<StreamChunkDTO> streamChat(ChatRequest request) {
        ObjectNode body = buildRequestBody(request, true);

        return webClient.post()
            .uri("/chat/completions")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(body.toString())
            .retrieve()
            .bodyToFlux(String.class)
            .filter(line -> !line.isEmpty() && !line.equals("[DONE]"))
            .map(this::parseStreamChunk)
            .filter(chunk -> chunk != null && chunk.content() != null)
            .onErrorResume(e -> {
                log.error("OpenAI stream error", e);
                return Flux.just(StreamChunkDTO.error("Stream error: " + e.getMessage()));
            });
    }

    @Override
    public float[] generateEmbedding(String text) {
        try {
            ObjectNode body = objectMapper.createObjectNode();
            body.put("model", config.getEmbeddingModel());
            body.put("input", text);

            String response = webClient.post()
                .uri("/embeddings")
                .bodyValue(body.toString())
                .retrieve()
                .bodyToMono(String.class)
                .timeout(Duration.ofMillis(config.getTimeout()))
                .block();

            JsonNode root = objectMapper.readTree(response);
            JsonNode embeddingNode = root.path("data").get(0).path("embedding");

            float[] embedding = new float[embeddingNode.size()];
            for (int i = 0; i < embeddingNode.size(); i++) {
                embedding[i] = (float) embeddingNode.get(i).asDouble();
            }
            return embedding;
        } catch (Exception e) {
            log.error("OpenAI embedding error", e);
            throw new RuntimeException("Failed to generate embedding: " + e.getMessage(), e);
        }
    }

    private ObjectNode buildRequestBody(ChatRequest request, boolean stream) {
        ObjectNode body = objectMapper.createObjectNode();
        body.put("model", request.model());
        body.put("stream", stream);

        ArrayNode messages = body.putArray("messages");

        if (request.systemPrompt() != null && !request.systemPrompt().isEmpty()) {
            ObjectNode systemMsg = messages.addObject();
            systemMsg.put("role", "system");
            systemMsg.put("content", request.systemPrompt());
        }

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
            String content = root.path("choices").get(0).path("message").path("content").asText();
            int inputTokens = root.path("usage").path("prompt_tokens").asInt();
            int outputTokens = root.path("usage").path("completion_tokens").asInt();
            String finishReason = root.path("choices").get(0).path("finish_reason").asText();

            return new ChatResponse(content, inputTokens, outputTokens, finishReason);
        } catch (Exception e) {
            log.error("Failed to parse OpenAI response", e);
            throw new RuntimeException("Failed to parse response", e);
        }
    }

    private StreamChunkDTO parseStreamChunk(String line) {
        try {
            if (line.startsWith("data: ")) {
                line = line.substring(6);
            }
            if (line.equals("[DONE]")) {
                return StreamChunkDTO.done(null, 0);
            }

            JsonNode root = objectMapper.readTree(line);
            JsonNode delta = root.path("choices").get(0).path("delta");
            String content = delta.path("content").asText(null);

            if (content != null && !content.isEmpty()) {
                return StreamChunkDTO.content(content);
            }

            String finishReason = root.path("choices").get(0).path("finish_reason").asText(null);
            if ("stop".equals(finishReason)) {
                return StreamChunkDTO.done(null, 0);
            }

            return null;
        } catch (Exception e) {
            log.warn("Failed to parse stream chunk: {}", line, e);
            return null;
        }
    }
}
