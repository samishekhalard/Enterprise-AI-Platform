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
public class GeminiProvider implements LlmProviderService {

    private final AiProviderProperties.ProviderConfig config;
    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    private static final String BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

    private static final List<ModelInfoDTO> MODELS = List.of(
        ModelInfoDTO.builder()
            .id("gemini-1.5-pro")
            .name("Gemini 1.5 Pro")
            .description("Most capable Gemini model")
            .maxTokens(2097152)
            .supportsVision(true)
            .isDefault(true)
            .build(),
        ModelInfoDTO.builder()
            .id("gemini-1.5-flash")
            .name("Gemini 1.5 Flash")
            .description("Fast and efficient")
            .maxTokens(1048576)
            .supportsVision(true)
            .isDefault(false)
            .build(),
        ModelInfoDTO.builder()
            .id("gemini-2.0-flash-exp")
            .name("Gemini 2.0 Flash (Experimental)")
            .description("Latest experimental model")
            .maxTokens(1048576)
            .supportsVision(true)
            .isDefault(false)
            .build()
    );

    public GeminiProvider(AiProviderProperties properties, ObjectMapper objectMapper) {
        this.config = properties.getProviders().get("gemini");
        this.objectMapper = objectMapper;
        this.webClient = WebClient.builder()
            .baseUrl(BASE_URL)
            .defaultHeader("Content-Type", "application/json")
            .build();
    }

    @Override
    public LlmProvider getProviderType() {
        return LlmProvider.GEMINI;
    }

    @Override
    public String getDisplayName() {
        return "Google Gemini";
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
                ObjectNode body = buildRequestBody(request);
                String uri = String.format("/models/%s:generateContent?key=%s", request.model(), config.getApiKey());

                String response = webClient.post()
                    .uri(uri)
                    .bodyValue(body.toString())
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofMillis(config.getTimeout()))
                    .block();

                return parseResponse(response);
            } catch (Exception e) {
                log.error("Gemini chat error", e);
                throw new RuntimeException("Gemini API error: " + e.getMessage(), e);
            }
        });
    }

    @Override
    public Flux<StreamChunkDTO> streamChat(ChatRequest request) {
        ObjectNode body = buildRequestBody(request);
        String uri = String.format("/models/%s:streamGenerateContent?key=%s&alt=sse", request.model(), config.getApiKey());

        return webClient.post()
            .uri(uri)
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(body.toString())
            .retrieve()
            .bodyToFlux(String.class)
            .filter(line -> !line.isEmpty())
            .map(this::parseStreamChunk)
            .filter(chunk -> chunk != null)
            .onErrorResume(e -> {
                log.error("Gemini stream error", e);
                return Flux.just(StreamChunkDTO.error("Stream error: " + e.getMessage()));
            });
    }

    @Override
    public float[] generateEmbedding(String text) {
        try {
            ObjectNode body = objectMapper.createObjectNode();
            ObjectNode content = body.putObject("content");
            ArrayNode parts = content.putArray("parts");
            parts.addObject().put("text", text);

            String uri = String.format("/models/text-embedding-004:embedContent?key=%s", config.getApiKey());

            String response = webClient.post()
                .uri(uri)
                .bodyValue(body.toString())
                .retrieve()
                .bodyToMono(String.class)
                .timeout(Duration.ofMillis(config.getTimeout()))
                .block();

            JsonNode root = objectMapper.readTree(response);
            JsonNode embeddingNode = root.path("embedding").path("values");

            float[] embedding = new float[embeddingNode.size()];
            for (int i = 0; i < embeddingNode.size(); i++) {
                embedding[i] = (float) embeddingNode.get(i).asDouble();
            }
            return embedding;
        } catch (Exception e) {
            log.error("Gemini embedding error", e);
            throw new RuntimeException("Failed to generate embedding: " + e.getMessage(), e);
        }
    }

    private ObjectNode buildRequestBody(ChatRequest request) {
        ObjectNode body = objectMapper.createObjectNode();

        if (request.systemPrompt() != null && !request.systemPrompt().isEmpty()) {
            ObjectNode systemInstruction = body.putObject("systemInstruction");
            ArrayNode parts = systemInstruction.putArray("parts");
            parts.addObject().put("text", request.systemPrompt());
        }

        ArrayNode contents = body.putArray("contents");
        for (ChatMessage msg : request.messages()) {
            ObjectNode content = contents.addObject();
            content.put("role", "user".equalsIgnoreCase(msg.role()) ? "user" : "model");
            ArrayNode parts = content.putArray("parts");
            parts.addObject().put("text", msg.content());
        }

        if (request.config() != null) {
            ObjectNode generationConfig = body.putObject("generationConfig");
            if (request.config().containsKey("temperature")) {
                generationConfig.put("temperature", ((Number) request.config().get("temperature")).doubleValue());
            }
            if (request.config().containsKey("maxTokens")) {
                generationConfig.put("maxOutputTokens", ((Number) request.config().get("maxTokens")).intValue());
            }
        }

        return body;
    }

    private ChatResponse parseResponse(String response) {
        try {
            JsonNode root = objectMapper.readTree(response);
            String content = root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();
            int totalTokens = root.path("usageMetadata").path("totalTokenCount").asInt();
            int inputTokens = root.path("usageMetadata").path("promptTokenCount").asInt();
            int outputTokens = totalTokens - inputTokens;
            String finishReason = root.path("candidates").get(0).path("finishReason").asText();

            return new ChatResponse(content, inputTokens, outputTokens, finishReason);
        } catch (Exception e) {
            log.error("Failed to parse Gemini response", e);
            throw new RuntimeException("Failed to parse response", e);
        }
    }

    private StreamChunkDTO parseStreamChunk(String line) {
        try {
            if (line.startsWith("data: ")) {
                line = line.substring(6);
            }
            if (line.isEmpty()) {
                return null;
            }

            JsonNode root = objectMapper.readTree(line);
            JsonNode candidates = root.path("candidates");
            if (candidates.isEmpty()) {
                return null;
            }

            JsonNode parts = candidates.get(0).path("content").path("parts");
            if (!parts.isEmpty()) {
                String text = parts.get(0).path("text").asText(null);
                if (text != null && !text.isEmpty()) {
                    return StreamChunkDTO.content(text);
                }
            }

            String finishReason = candidates.get(0).path("finishReason").asText(null);
            if (finishReason != null && !"STOP".equals(finishReason)) {
                return StreamChunkDTO.done(null, 0);
            }

            return null;
        } catch (Exception e) {
            log.warn("Failed to parse stream chunk: {}", line, e);
            return null;
        }
    }
}
