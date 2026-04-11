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
import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
public class OllamaProvider implements LlmProviderService {

    private final AiProviderProperties.ProviderConfig config;
    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    private static final List<ModelInfoDTO> DEFAULT_MODELS = List.of(
        ModelInfoDTO.builder()
            .id("llama3.2")
            .name("Llama 3.2")
            .description("Latest Llama model")
            .maxTokens(128000)
            .supportsVision(false)
            .isDefault(true)
            .build(),
        ModelInfoDTO.builder()
            .id("llama3.1")
            .name("Llama 3.1")
            .description("Powerful open source model")
            .maxTokens(128000)
            .supportsVision(false)
            .isDefault(false)
            .build(),
        ModelInfoDTO.builder()
            .id("mistral")
            .name("Mistral")
            .description("Fast and efficient")
            .maxTokens(32768)
            .supportsVision(false)
            .isDefault(false)
            .build(),
        ModelInfoDTO.builder()
            .id("codellama")
            .name("Code Llama")
            .description("Optimized for code generation")
            .maxTokens(16384)
            .supportsVision(false)
            .isDefault(false)
            .build(),
        ModelInfoDTO.builder()
            .id("llava")
            .name("LLaVA")
            .description("Multimodal vision model")
            .maxTokens(4096)
            .supportsVision(true)
            .isDefault(false)
            .build()
    );

    public OllamaProvider(AiProviderProperties properties, ObjectMapper objectMapper) {
        this.config = properties.getProviders().get("ollama");
        this.objectMapper = objectMapper;
        this.webClient = WebClient.builder()
            .baseUrl(config.getBaseUrl())
            .defaultHeader("Content-Type", "application/json")
            .build();
    }

    @Override
    public LlmProvider getProviderType() {
        return LlmProvider.OLLAMA;
    }

    @Override
    public String getDisplayName() {
        return "Ollama (Self-Hosted)";
    }

    @Override
    public boolean isEnabled() {
        return config.isEnabled();
    }

    @Override
    public List<ModelInfoDTO> getSupportedModels() {
        // Try to fetch available models from Ollama server
        try {
            String response = webClient.get()
                .uri("/api/tags")
                .retrieve()
                .bodyToMono(String.class)
                .timeout(Duration.ofSeconds(5))
                .block();

            if (response != null) {
                JsonNode root = objectMapper.readTree(response);
                JsonNode models = root.path("models");
                if (!models.isEmpty()) {
                    List<ModelInfoDTO> availableModels = new ArrayList<>();
                    for (JsonNode model : models) {
                        String name = model.path("name").asText();
                        availableModels.add(ModelInfoDTO.builder()
                            .id(name)
                            .name(name)
                            .description("Local model")
                            .maxTokens(32768)
                            .supportsVision(name.contains("llava") || name.contains("vision"))
                            .isDefault(name.equals(config.getDefaultModel()))
                            .build());
                    }
                    return availableModels;
                }
            }
        } catch (Exception e) {
            log.debug("Could not fetch Ollama models, using defaults: {}", e.getMessage());
        }
        return DEFAULT_MODELS;
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
                    .uri("/api/chat")
                    .bodyValue(body.toString())
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofMillis(config.getTimeout()))
                    .block();

                return parseResponse(response);
            } catch (Exception e) {
                log.error("Ollama chat error", e);
                throw new RuntimeException("Ollama API error: " + e.getMessage(), e);
            }
        });
    }

    @Override
    public Flux<StreamChunkDTO> streamChat(ChatRequest request) {
        ObjectNode body = buildRequestBody(request, true);

        return webClient.post()
            .uri("/api/chat")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(body.toString())
            .retrieve()
            .bodyToFlux(String.class)
            .filter(line -> !line.isEmpty())
            .map(this::parseStreamChunk)
            .filter(chunk -> chunk != null)
            .onErrorResume(e -> {
                log.error("Ollama stream error", e);
                return Flux.just(StreamChunkDTO.error("Stream error: " + e.getMessage()));
            });
    }

    @Override
    public float[] generateEmbedding(String text) {
        try {
            ObjectNode body = objectMapper.createObjectNode();
            body.put("model", config.getEmbeddingModel() != null ? config.getEmbeddingModel() : "nomic-embed-text");
            body.put("prompt", text);

            String response = webClient.post()
                .uri("/api/embeddings")
                .bodyValue(body.toString())
                .retrieve()
                .bodyToMono(String.class)
                .timeout(Duration.ofMillis(config.getTimeout()))
                .block();

            JsonNode root = objectMapper.readTree(response);
            JsonNode embeddingNode = root.path("embedding");

            float[] embedding = new float[embeddingNode.size()];
            for (int i = 0; i < embeddingNode.size(); i++) {
                embedding[i] = (float) embeddingNode.get(i).asDouble();
            }
            return embedding;
        } catch (Exception e) {
            log.error("Ollama embedding error", e);
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
            ObjectNode options = body.putObject("options");
            if (request.config().containsKey("temperature")) {
                options.put("temperature", ((Number) request.config().get("temperature")).doubleValue());
            }
            if (request.config().containsKey("maxTokens")) {
                options.put("num_predict", ((Number) request.config().get("maxTokens")).intValue());
            }
        }

        return body;
    }

    private ChatResponse parseResponse(String response) {
        try {
            JsonNode root = objectMapper.readTree(response);
            String content = root.path("message").path("content").asText();
            int inputTokens = root.path("prompt_eval_count").asInt();
            int outputTokens = root.path("eval_count").asInt();

            return new ChatResponse(content, inputTokens, outputTokens, "stop");
        } catch (Exception e) {
            log.error("Failed to parse Ollama response", e);
            throw new RuntimeException("Failed to parse response", e);
        }
    }

    private StreamChunkDTO parseStreamChunk(String line) {
        try {
            JsonNode root = objectMapper.readTree(line);

            if (root.path("done").asBoolean(false)) {
                return StreamChunkDTO.done(null, root.path("eval_count").asInt(0));
            }

            String content = root.path("message").path("content").asText(null);
            if (content != null && !content.isEmpty()) {
                return StreamChunkDTO.content(content);
            }

            return null;
        } catch (Exception e) {
            log.warn("Failed to parse stream chunk: {}", line, e);
            return null;
        }
    }
}
