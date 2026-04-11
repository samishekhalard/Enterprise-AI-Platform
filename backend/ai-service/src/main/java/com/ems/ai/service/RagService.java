package com.ems.ai.service;

import com.ems.ai.dto.KnowledgeSourceDTO;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

public interface RagService {

    KnowledgeSourceDTO uploadFile(UUID agentId, String tenantId, MultipartFile file, String description);

    KnowledgeSourceDTO addTextSource(UUID agentId, String tenantId, String name, String content, String description);

    List<KnowledgeSourceDTO> getKnowledgeSources(UUID agentId);

    void deleteKnowledgeSource(UUID sourceId, String tenantId);

    void processKnowledgeSource(UUID sourceId);

    String getRelevantContext(UUID agentId, String query);

    float[] generateEmbedding(String text);
}
