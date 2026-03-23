package com.ems.ai.provider;

import com.ems.ai.dto.ModelInfoDTO;
import com.ems.ai.dto.StreamChunkDTO;
import com.ems.ai.entity.AgentEntity.LlmProvider;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

public interface LlmProviderService {

    LlmProvider getProviderType();

    String getDisplayName();

    boolean isEnabled();

    List<ModelInfoDTO> getSupportedModels();

    boolean supportsStreaming();

    boolean supportsEmbeddings();

    CompletableFuture<ChatResponse> chat(ChatRequest request);

    Flux<StreamChunkDTO> streamChat(ChatRequest request);

    float[] generateEmbedding(String text);

    record ChatRequest(
        String model,
        List<ChatMessage> messages,
        Map<String, Object> config,
        String systemPrompt
    ) {}

    record ChatMessage(
        String role,
        String content
    ) {}

    record ChatResponse(
        String content,
        int inputTokens,
        int outputTokens,
        String finishReason
    ) {}
}
