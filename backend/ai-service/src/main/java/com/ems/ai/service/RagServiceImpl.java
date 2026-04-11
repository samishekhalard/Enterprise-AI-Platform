package com.ems.ai.service;

import com.ems.ai.config.AiProviderProperties;
import com.ems.ai.dto.KnowledgeSourceDTO;
import com.ems.ai.entity.AgentEntity;
import com.ems.ai.entity.KnowledgeChunkEntity;
import com.ems.ai.entity.KnowledgeSourceEntity;
import com.ems.ai.entity.KnowledgeSourceEntity.*;
import com.ems.ai.mapper.KnowledgeSourceMapper;
import com.ems.ai.provider.LlmProviderFactory;
import com.ems.ai.provider.LlmProviderService;
import com.ems.ai.repository.AgentRepository;
import com.ems.ai.repository.KnowledgeChunkRepository;
import com.ems.ai.repository.KnowledgeSourceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.StringReader;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class RagServiceImpl implements RagService {

    private final KnowledgeSourceRepository sourceRepository;
    private final KnowledgeChunkRepository chunkRepository;
    private final AgentRepository agentRepository;
    private final KnowledgeSourceMapper sourceMapper;
    private final LlmProviderFactory providerFactory;
    private final AiProviderProperties aiProperties;

    @Override
    public KnowledgeSourceDTO uploadFile(UUID agentId, String tenantId, MultipartFile file, String description) {
        log.debug("Uploading file for agent: {}", agentId);

        AgentEntity agent = agentRepository.findById(agentId)
            .orElseThrow(() -> new RuntimeException("Agent not found: " + agentId));

        if (!agent.getTenantId().equals(tenantId)) {
            throw new RuntimeException("Not authorized to upload to this agent");
        }

        String filename = file.getOriginalFilename();
        FileType fileType = detectFileType(filename);

        KnowledgeSourceEntity source = KnowledgeSourceEntity.builder()
            .agent(agent)
            .tenantId(tenantId)
            .name(filename)
            .description(description)
            .sourceType(SourceType.FILE)
            .fileType(fileType)
            .fileSize(file.getSize())
            .status(SourceStatus.PENDING)
            .build();

        source = sourceRepository.save(source);
        log.info("Created knowledge source: {} for agent: {}", source.getId(), agentId);

        // Process asynchronously
        processKnowledgeSourceAsync(source.getId(), file);

        return sourceMapper.toDTO(source);
    }

    @Override
    public KnowledgeSourceDTO addTextSource(UUID agentId, String tenantId, String name, String content, String description) {
        log.debug("Adding text source for agent: {}", agentId);

        AgentEntity agent = agentRepository.findById(agentId)
            .orElseThrow(() -> new RuntimeException("Agent not found: " + agentId));

        if (!agent.getTenantId().equals(tenantId)) {
            throw new RuntimeException("Not authorized to add source to this agent");
        }

        KnowledgeSourceEntity source = KnowledgeSourceEntity.builder()
            .agent(agent)
            .tenantId(tenantId)
            .name(name)
            .description(description)
            .sourceType(SourceType.TEXT)
            .status(SourceStatus.PROCESSING)
            .build();

        source = sourceRepository.save(source);

        // Process text directly
        processTextContent(source, content);

        return sourceMapper.toDTO(sourceRepository.findById(source.getId()).orElse(source));
    }

    @Override
    @Transactional(readOnly = true)
    public List<KnowledgeSourceDTO> getKnowledgeSources(UUID agentId) {
        return sourceMapper.toDTOList(sourceRepository.findByAgentId(agentId));
    }

    @Override
    public void deleteKnowledgeSource(UUID sourceId, String tenantId) {
        KnowledgeSourceEntity source = sourceRepository.findById(sourceId)
            .orElseThrow(() -> new RuntimeException("Knowledge source not found: " + sourceId));

        if (!source.getTenantId().equals(tenantId)) {
            throw new RuntimeException("Not authorized to delete this source");
        }

        chunkRepository.deleteBySourceId(sourceId);
        sourceRepository.delete(source);
        log.info("Deleted knowledge source: {}", sourceId);
    }

    @Override
    public void processKnowledgeSource(UUID sourceId) {
        KnowledgeSourceEntity source = sourceRepository.findById(sourceId)
            .orElseThrow(() -> new RuntimeException("Knowledge source not found: " + sourceId));

        source.setStatus(SourceStatus.PROCESSING);
        sourceRepository.save(source);

        try {
            // This would need the file content - for now we'll handle it in async method
            log.warn("Direct processing not implemented - use async upload");
        } catch (Exception e) {
            source.setStatus(SourceStatus.FAILED);
            source.setErrorMessage(e.getMessage());
            sourceRepository.save(source);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public String getRelevantContext(UUID agentId, String query) {
        try {
            float[] queryEmbedding = generateEmbedding(query);
            String embeddingStr = Arrays.toString(queryEmbedding);

            List<KnowledgeChunkEntity> chunks = chunkRepository.findSimilarChunksWithThreshold(
                agentId,
                embeddingStr,
                aiProperties.getRag().getSimilarityThreshold(),
                aiProperties.getRag().getMaxChunksPerQuery()
            );

            if (chunks.isEmpty()) {
                return null;
            }

            return chunks.stream()
                .map(KnowledgeChunkEntity::getContent)
                .collect(Collectors.joining("\n\n---\n\n"));
        } catch (Exception e) {
            log.warn("Failed to get relevant context", e);
            return null;
        }
    }

    @Override
    public float[] generateEmbedding(String text) {
        // Try OpenAI first, then Gemini, then Ollama
        try {
            if (providerFactory.isProviderEnabled(AgentEntity.LlmProvider.OPENAI)) {
                return providerFactory.getProvider(AgentEntity.LlmProvider.OPENAI).generateEmbedding(text);
            }
        } catch (Exception e) {
            log.debug("OpenAI embedding failed, trying alternatives", e);
        }

        try {
            if (providerFactory.isProviderEnabled(AgentEntity.LlmProvider.GEMINI)) {
                return providerFactory.getProvider(AgentEntity.LlmProvider.GEMINI).generateEmbedding(text);
            }
        } catch (Exception e) {
            log.debug("Gemini embedding failed, trying Ollama", e);
        }

        try {
            if (providerFactory.isProviderEnabled(AgentEntity.LlmProvider.OLLAMA)) {
                return providerFactory.getProvider(AgentEntity.LlmProvider.OLLAMA).generateEmbedding(text);
            }
        } catch (Exception e) {
            log.debug("Ollama embedding failed", e);
        }

        throw new RuntimeException("No embedding provider available");
    }

    @Async("embeddingExecutor")
    protected void processKnowledgeSourceAsync(UUID sourceId, MultipartFile file) {
        try {
            KnowledgeSourceEntity source = sourceRepository.findById(sourceId).orElseThrow();
            source.setStatus(SourceStatus.PROCESSING);
            sourceRepository.save(source);

            String content = extractContent(file, source.getFileType());
            processTextContent(source, content);

        } catch (Exception e) {
            log.error("Failed to process knowledge source: {}", sourceId, e);
            sourceRepository.findById(sourceId).ifPresent(source -> {
                source.setStatus(SourceStatus.FAILED);
                source.setErrorMessage(e.getMessage());
                sourceRepository.save(source);
            });
        }
    }

    private void processTextContent(KnowledgeSourceEntity source, String content) {
        try {
            List<String> chunks = chunkText(content);

            int chunkIndex = 0;
            for (String chunkContent : chunks) {
                float[] embedding = generateEmbedding(chunkContent);

                KnowledgeChunkEntity chunk = KnowledgeChunkEntity.builder()
                    .source(source)
                    .agentId(source.getAgent().getId())
                    .content(chunkContent)
                    .embedding(embedding)
                    .chunkIndex(chunkIndex++)
                    .tokenCount(estimateTokens(chunkContent))
                    .build();

                chunkRepository.save(chunk);
            }

            source.setChunkCount(chunks.size());
            source.setStatus(SourceStatus.COMPLETED);
            source.setProcessedAt(Instant.now());
            sourceRepository.save(source);

            // Enable RAG on agent if not already
            AgentEntity agent = source.getAgent();
            if (!agent.getRagEnabled()) {
                agent.setRagEnabled(true);
                agentRepository.save(agent);
            }

            log.info("Processed {} chunks for source: {}", chunks.size(), source.getId());
        } catch (Exception e) {
            source.setStatus(SourceStatus.FAILED);
            source.setErrorMessage(e.getMessage());
            sourceRepository.save(source);
            throw e;
        }
    }

    private String extractContent(MultipartFile file, FileType fileType) throws Exception {
        return switch (fileType) {
            case PDF -> extractPdfContent(file.getInputStream());
            case TXT, MD -> extractTextContent(file.getInputStream());
            case CSV -> extractCsvContent(file.getInputStream());
            default -> throw new RuntimeException("Unsupported file type: " + fileType);
        };
    }

    private String extractPdfContent(InputStream inputStream) throws Exception {
        try (PDDocument document = org.apache.pdfbox.Loader.loadPDF(inputStream.readAllBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        }
    }

    private String extractTextContent(InputStream inputStream) throws Exception {
        StringBuilder content = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                content.append(line).append("\n");
            }
        }
        return content.toString();
    }

    private String extractCsvContent(InputStream inputStream) throws Exception {
        StringBuilder content = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8));
             CSVParser parser = CSVFormat.DEFAULT.withFirstRecordAsHeader().parse(reader)) {

            List<String> headers = parser.getHeaderNames();

            for (CSVRecord record : parser) {
                for (int i = 0; i < headers.size(); i++) {
                    content.append(headers.get(i)).append(": ").append(record.get(i)).append("\n");
                }
                content.append("\n");
            }
        }
        return content.toString();
    }

    private List<String> chunkText(String text) {
        int chunkSize = aiProperties.getRag().getChunkSize();
        int overlap = aiProperties.getRag().getChunkOverlap();

        List<String> chunks = new ArrayList<>();
        String[] paragraphs = text.split("\n\n+");

        StringBuilder currentChunk = new StringBuilder();

        for (String paragraph : paragraphs) {
            if (currentChunk.length() + paragraph.length() > chunkSize && currentChunk.length() > 0) {
                chunks.add(currentChunk.toString().trim());

                // Keep overlap
                String overlapText = currentChunk.substring(Math.max(0, currentChunk.length() - overlap));
                currentChunk = new StringBuilder(overlapText);
            }
            currentChunk.append(paragraph).append("\n\n");
        }

        if (currentChunk.length() > 0) {
            chunks.add(currentChunk.toString().trim());
        }

        return chunks;
    }

    private FileType detectFileType(String filename) {
        if (filename == null) return FileType.TXT;

        String lower = filename.toLowerCase();
        if (lower.endsWith(".pdf")) return FileType.PDF;
        if (lower.endsWith(".md")) return FileType.MD;
        if (lower.endsWith(".csv")) return FileType.CSV;
        if (lower.endsWith(".docx")) return FileType.DOCX;
        return FileType.TXT;
    }

    private int estimateTokens(String text) {
        // Rough estimate: ~4 characters per token
        return text.length() / 4;
    }
}
