package com.ems.ai.service;

import com.ems.ai.config.AiProviderProperties;
import com.ems.ai.dto.KnowledgeSourceDTO;
import com.ems.ai.entity.AgentEntity;
import com.ems.ai.entity.AgentEntity.LlmProvider;
import com.ems.ai.entity.KnowledgeChunkEntity;
import com.ems.ai.entity.KnowledgeSourceEntity;
import com.ems.ai.entity.KnowledgeSourceEntity.*;
import com.ems.ai.mapper.KnowledgeSourceMapper;
import com.ems.ai.provider.LlmProviderFactory;
import com.ems.ai.provider.LlmProviderService;
import com.ems.ai.repository.AgentRepository;
import com.ems.ai.repository.KnowledgeChunkRepository;
import com.ems.ai.repository.KnowledgeSourceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RagServiceImplTest {

    @Mock private KnowledgeSourceRepository sourceRepository;
    @Mock private KnowledgeChunkRepository chunkRepository;
    @Mock private AgentRepository agentRepository;
    @Mock private KnowledgeSourceMapper sourceMapper;
    @Mock private LlmProviderFactory providerFactory;
    @Mock private AiProviderProperties aiProperties;

    @InjectMocks
    private RagServiceImpl ragService;

    private static final String TENANT_ID = "tenant-1";
    private static final UUID AGENT_ID = UUID.randomUUID();
    private static final UUID SOURCE_ID = UUID.randomUUID();

    private AgentEntity sampleAgent;
    private AiProviderProperties.RagConfig ragConfig;

    @BeforeEach
    void setUp() {
        sampleAgent = AgentEntity.builder()
            .id(AGENT_ID)
            .tenantId(TENANT_ID)
            .ownerId(UUID.randomUUID())
            .name("Test Agent")
            .systemPrompt("You are helpful")
            .provider(LlmProvider.OPENAI)
            .model("gpt-4o")
            .ragEnabled(false)
            .knowledgeSources(new ArrayList<>())
            .build();

        ragConfig = new AiProviderProperties.RagConfig();
        ragConfig.setChunkSize(1000);
        ragConfig.setChunkOverlap(200);
        ragConfig.setMaxChunksPerQuery(5);
        ragConfig.setSimilarityThreshold(0.7);
        ragConfig.setEmbeddingDimension(1536);
    }

    @Nested
    @DisplayName("uploadFile")
    class UploadFile {

        @Test
        @DisplayName("should create knowledge source for valid file upload")
        void uploadFile_withValidFile_shouldCreateSource() {
            // Arrange
            MultipartFile mockFile = mock(MultipartFile.class);
            when(mockFile.getOriginalFilename()).thenReturn("document.pdf");
            when(mockFile.getSize()).thenReturn(1024L);

            KnowledgeSourceEntity savedEntity = KnowledgeSourceEntity.builder()
                .id(SOURCE_ID)
                .agent(sampleAgent)
                .tenantId(TENANT_ID)
                .name("document.pdf")
                .sourceType(SourceType.FILE)
                .fileType(FileType.PDF)
                .status(SourceStatus.PENDING)
                .build();

            KnowledgeSourceDTO expectedDTO = KnowledgeSourceDTO.builder()
                .id(SOURCE_ID)
                .agentId(AGENT_ID)
                .name("document.pdf")
                .sourceType(SourceType.FILE)
                .fileType(FileType.PDF)
                .status(SourceStatus.PENDING)
                .build();

            when(agentRepository.findById(AGENT_ID)).thenReturn(Optional.of(sampleAgent));
            when(sourceRepository.save(any(KnowledgeSourceEntity.class))).thenReturn(savedEntity);
            when(sourceMapper.toDTO(savedEntity)).thenReturn(expectedDTO);

            // Act
            KnowledgeSourceDTO result = ragService.uploadFile(AGENT_ID, TENANT_ID, mockFile, "Test doc");

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.name()).isEqualTo("document.pdf");
            assertThat(result.fileType()).isEqualTo(FileType.PDF);
            assertThat(result.status()).isEqualTo(SourceStatus.PENDING);
            verify(sourceRepository).save(any(KnowledgeSourceEntity.class));
        }

        @Test
        @DisplayName("should throw when agent not found")
        void uploadFile_whenAgentNotFound_shouldThrow() {
            // Arrange
            MultipartFile mockFile = mock(MultipartFile.class);
            when(agentRepository.findById(AGENT_ID)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> ragService.uploadFile(AGENT_ID, TENANT_ID, mockFile, null))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Agent not found");
        }

        @Test
        @DisplayName("should throw when tenant does not match agent tenant")
        void uploadFile_whenTenantMismatch_shouldThrow() {
            // Arrange
            MultipartFile mockFile = mock(MultipartFile.class);
            when(agentRepository.findById(AGENT_ID)).thenReturn(Optional.of(sampleAgent));

            // Act & Assert
            assertThatThrownBy(() -> ragService.uploadFile(AGENT_ID, "other-tenant", mockFile, null))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Not authorized");
        }

        @Test
        @DisplayName("should detect CSV file type from filename")
        void uploadFile_withCsvFile_shouldDetectFileType() {
            // Arrange
            MultipartFile mockFile = mock(MultipartFile.class);
            when(mockFile.getOriginalFilename()).thenReturn("data.csv");
            when(mockFile.getSize()).thenReturn(512L);

            KnowledgeSourceEntity savedEntity = KnowledgeSourceEntity.builder()
                .id(SOURCE_ID)
                .agent(sampleAgent)
                .tenantId(TENANT_ID)
                .name("data.csv")
                .sourceType(SourceType.FILE)
                .fileType(FileType.CSV)
                .status(SourceStatus.PENDING)
                .build();

            when(agentRepository.findById(AGENT_ID)).thenReturn(Optional.of(sampleAgent));
            when(sourceRepository.save(any())).thenReturn(savedEntity);
            when(sourceMapper.toDTO(any())).thenReturn(
                KnowledgeSourceDTO.builder().fileType(FileType.CSV).build());

            // Act
            KnowledgeSourceDTO result = ragService.uploadFile(AGENT_ID, TENANT_ID, mockFile, null);

            // Assert
            assertThat(result.fileType()).isEqualTo(FileType.CSV);
        }

        @Test
        @DisplayName("should default to TXT when filename is null")
        void uploadFile_withNullFilename_shouldDefaultToTxt() {
            // Arrange
            MultipartFile mockFile = mock(MultipartFile.class);
            when(mockFile.getOriginalFilename()).thenReturn(null);
            when(mockFile.getSize()).thenReturn(100L);

            KnowledgeSourceEntity savedEntity = KnowledgeSourceEntity.builder()
                .id(SOURCE_ID)
                .agent(sampleAgent)
                .tenantId(TENANT_ID)
                .fileType(FileType.TXT)
                .status(SourceStatus.PENDING)
                .build();

            when(agentRepository.findById(AGENT_ID)).thenReturn(Optional.of(sampleAgent));
            when(sourceRepository.save(any())).thenReturn(savedEntity);
            when(sourceMapper.toDTO(any())).thenReturn(
                KnowledgeSourceDTO.builder().fileType(FileType.TXT).build());

            // Act
            KnowledgeSourceDTO result = ragService.uploadFile(AGENT_ID, TENANT_ID, mockFile, null);

            // Assert
            assertThat(result.fileType()).isEqualTo(FileType.TXT);
        }
    }

    @Nested
    @DisplayName("addTextSource")
    class AddTextSource {

        @Test
        @DisplayName("should throw when agent not found for text source")
        void addTextSource_whenAgentNotFound_shouldThrow() {
            // Arrange
            when(agentRepository.findById(AGENT_ID)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> ragService.addTextSource(AGENT_ID, TENANT_ID, "notes", "content", null))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Agent not found");
        }

        @Test
        @DisplayName("should throw when tenant mismatch for text source")
        void addTextSource_whenTenantMismatch_shouldThrow() {
            // Arrange
            when(agentRepository.findById(AGENT_ID)).thenReturn(Optional.of(sampleAgent));

            // Act & Assert
            assertThatThrownBy(() -> ragService.addTextSource(AGENT_ID, "other-tenant", "notes", "content", null))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Not authorized");
        }
    }

    @Nested
    @DisplayName("getKnowledgeSources")
    class GetKnowledgeSources {

        @Test
        @DisplayName("should return all knowledge sources for agent")
        void getKnowledgeSources_shouldReturnList() {
            // Arrange
            List<KnowledgeSourceEntity> entities = List.of(
                KnowledgeSourceEntity.builder().id(UUID.randomUUID()).name("doc1.pdf").build()
            );
            List<KnowledgeSourceDTO> dtos = List.of(
                KnowledgeSourceDTO.builder().name("doc1.pdf").build()
            );
            when(sourceRepository.findByAgentId(AGENT_ID)).thenReturn(entities);
            when(sourceMapper.toDTOList(entities)).thenReturn(dtos);

            // Act
            List<KnowledgeSourceDTO> result = ragService.getKnowledgeSources(AGENT_ID);

            // Assert
            assertThat(result).hasSize(1);
            assertThat(result.get(0).name()).isEqualTo("doc1.pdf");
        }
    }

    @Nested
    @DisplayName("deleteKnowledgeSource")
    class DeleteKnowledgeSource {

        @Test
        @DisplayName("should delete chunks and source when authorized")
        void deleteKnowledgeSource_whenAuthorized_shouldDeleteAll() {
            // Arrange
            KnowledgeSourceEntity source = KnowledgeSourceEntity.builder()
                .id(SOURCE_ID)
                .tenantId(TENANT_ID)
                .build();
            when(sourceRepository.findById(SOURCE_ID)).thenReturn(Optional.of(source));

            // Act
            ragService.deleteKnowledgeSource(SOURCE_ID, TENANT_ID);

            // Assert
            verify(chunkRepository).deleteBySourceId(SOURCE_ID);
            verify(sourceRepository).delete(source);
        }

        @Test
        @DisplayName("should throw when source not found")
        void deleteKnowledgeSource_whenNotFound_shouldThrow() {
            // Arrange
            when(sourceRepository.findById(SOURCE_ID)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> ragService.deleteKnowledgeSource(SOURCE_ID, TENANT_ID))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Knowledge source not found");
        }

        @Test
        @DisplayName("should throw when tenant does not match source tenant")
        void deleteKnowledgeSource_whenTenantMismatch_shouldThrow() {
            // Arrange
            KnowledgeSourceEntity source = KnowledgeSourceEntity.builder()
                .id(SOURCE_ID)
                .tenantId(TENANT_ID)
                .build();
            when(sourceRepository.findById(SOURCE_ID)).thenReturn(Optional.of(source));

            // Act & Assert
            assertThatThrownBy(() -> ragService.deleteKnowledgeSource(SOURCE_ID, "other-tenant"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Not authorized");
        }
    }

    @Nested
    @DisplayName("processKnowledgeSource")
    class ProcessKnowledgeSource {

        @Test
        @DisplayName("should set source status to PROCESSING")
        void processKnowledgeSource_shouldSetProcessingStatus() {
            // Arrange
            KnowledgeSourceEntity source = KnowledgeSourceEntity.builder()
                .id(SOURCE_ID)
                .status(SourceStatus.PENDING)
                .build();
            when(sourceRepository.findById(SOURCE_ID)).thenReturn(Optional.of(source));
            when(sourceRepository.save(any())).thenReturn(source);

            // Act
            ragService.processKnowledgeSource(SOURCE_ID);

            // Assert
            assertThat(source.getStatus()).isEqualTo(SourceStatus.PROCESSING);
            verify(sourceRepository).save(source);
        }

        @Test
        @DisplayName("should throw when source not found")
        void processKnowledgeSource_whenNotFound_shouldThrow() {
            // Arrange
            when(sourceRepository.findById(SOURCE_ID)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> ragService.processKnowledgeSource(SOURCE_ID))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Knowledge source not found");
        }
    }

    @Nested
    @DisplayName("getRelevantContext")
    class GetRelevantContext {

        @Test
        @DisplayName("should return concatenated chunk content when similar chunks found")
        void getRelevantContext_whenChunksFound_shouldReturnConcatenated() {
            // Arrange
            when(aiProperties.getRag()).thenReturn(ragConfig);

            LlmProviderService mockProvider = mock(LlmProviderService.class);
            when(providerFactory.isProviderEnabled(LlmProvider.OPENAI)).thenReturn(true);
            when(providerFactory.getProvider(LlmProvider.OPENAI)).thenReturn(mockProvider);
            when(mockProvider.generateEmbedding("test query")).thenReturn(new float[]{0.1f, 0.2f});

            KnowledgeChunkEntity chunk1 = KnowledgeChunkEntity.builder()
                .content("First relevant paragraph")
                .build();
            KnowledgeChunkEntity chunk2 = KnowledgeChunkEntity.builder()
                .content("Second relevant paragraph")
                .build();

            when(chunkRepository.findSimilarChunksWithThreshold(
                eq(AGENT_ID), any(), eq(0.7), eq(5)))
                .thenReturn(List.of(chunk1, chunk2));

            // Act
            String result = ragService.getRelevantContext(AGENT_ID, "test query");

            // Assert
            assertThat(result).isNotNull();
            assertThat(result).contains("First relevant paragraph");
            assertThat(result).contains("Second relevant paragraph");
            assertThat(result).contains("---");
        }

        @Test
        @DisplayName("should return null when no similar chunks found")
        void getRelevantContext_whenNoChunks_shouldReturnNull() {
            // Arrange
            when(aiProperties.getRag()).thenReturn(ragConfig);

            LlmProviderService mockProvider = mock(LlmProviderService.class);
            when(providerFactory.isProviderEnabled(LlmProvider.OPENAI)).thenReturn(true);
            when(providerFactory.getProvider(LlmProvider.OPENAI)).thenReturn(mockProvider);
            when(mockProvider.generateEmbedding(any())).thenReturn(new float[]{0.1f});

            when(chunkRepository.findSimilarChunksWithThreshold(
                eq(AGENT_ID), any(), eq(0.7), eq(5)))
                .thenReturn(Collections.emptyList());

            // Act
            String result = ragService.getRelevantContext(AGENT_ID, "irrelevant query");

            // Assert
            assertThat(result).isNull();
        }

        @Test
        @DisplayName("should return null when embedding generation fails")
        void getRelevantContext_whenEmbeddingFails_shouldReturnNull() {
            // Arrange
            when(aiProperties.getRag()).thenReturn(ragConfig);
            when(providerFactory.isProviderEnabled(LlmProvider.OPENAI)).thenReturn(false);
            when(providerFactory.isProviderEnabled(LlmProvider.GEMINI)).thenReturn(false);
            when(providerFactory.isProviderEnabled(LlmProvider.OLLAMA)).thenReturn(false);

            // Act
            String result = ragService.getRelevantContext(AGENT_ID, "query");

            // Assert
            assertThat(result).isNull();
        }
    }

    @Nested
    @DisplayName("generateEmbedding")
    class GenerateEmbedding {

        @Test
        @DisplayName("should use OpenAI when enabled")
        void generateEmbedding_whenOpenAiEnabled_shouldUseOpenAi() {
            // Arrange
            LlmProviderService mockProvider = mock(LlmProviderService.class);
            float[] expected = new float[]{0.1f, 0.2f, 0.3f};
            when(providerFactory.isProviderEnabled(LlmProvider.OPENAI)).thenReturn(true);
            when(providerFactory.getProvider(LlmProvider.OPENAI)).thenReturn(mockProvider);
            when(mockProvider.generateEmbedding("hello")).thenReturn(expected);

            // Act
            float[] result = ragService.generateEmbedding("hello");

            // Assert
            assertThat(result).isEqualTo(expected);
        }

        @Test
        @DisplayName("should fallback to Gemini when OpenAI fails")
        void generateEmbedding_whenOpenAiFails_shouldFallbackToGemini() {
            // Arrange
            LlmProviderService openAi = mock(LlmProviderService.class);
            LlmProviderService gemini = mock(LlmProviderService.class);
            float[] expected = new float[]{0.4f, 0.5f};

            when(providerFactory.isProviderEnabled(LlmProvider.OPENAI)).thenReturn(true);
            when(providerFactory.getProvider(LlmProvider.OPENAI)).thenReturn(openAi);
            when(openAi.generateEmbedding("hello")).thenThrow(new RuntimeException("OpenAI down"));

            when(providerFactory.isProviderEnabled(LlmProvider.GEMINI)).thenReturn(true);
            when(providerFactory.getProvider(LlmProvider.GEMINI)).thenReturn(gemini);
            when(gemini.generateEmbedding("hello")).thenReturn(expected);

            // Act
            float[] result = ragService.generateEmbedding("hello");

            // Assert
            assertThat(result).isEqualTo(expected);
        }

        @Test
        @DisplayName("should fallback to Ollama when OpenAI and Gemini fail")
        void generateEmbedding_whenOpenAiAndGeminiFail_shouldFallbackToOllama() {
            // Arrange
            LlmProviderService openAi = mock(LlmProviderService.class);
            LlmProviderService gemini = mock(LlmProviderService.class);
            LlmProviderService ollama = mock(LlmProviderService.class);
            float[] expected = new float[]{0.7f};

            when(providerFactory.isProviderEnabled(LlmProvider.OPENAI)).thenReturn(true);
            when(providerFactory.getProvider(LlmProvider.OPENAI)).thenReturn(openAi);
            when(openAi.generateEmbedding("hello")).thenThrow(new RuntimeException("fail"));

            when(providerFactory.isProviderEnabled(LlmProvider.GEMINI)).thenReturn(true);
            when(providerFactory.getProvider(LlmProvider.GEMINI)).thenReturn(gemini);
            when(gemini.generateEmbedding("hello")).thenThrow(new RuntimeException("fail"));

            when(providerFactory.isProviderEnabled(LlmProvider.OLLAMA)).thenReturn(true);
            when(providerFactory.getProvider(LlmProvider.OLLAMA)).thenReturn(ollama);
            when(ollama.generateEmbedding("hello")).thenReturn(expected);

            // Act
            float[] result = ragService.generateEmbedding("hello");

            // Assert
            assertThat(result).isEqualTo(expected);
        }

        @Test
        @DisplayName("should throw when no embedding provider available")
        void generateEmbedding_whenNoProviderAvailable_shouldThrow() {
            // Arrange
            when(providerFactory.isProviderEnabled(LlmProvider.OPENAI)).thenReturn(false);
            when(providerFactory.isProviderEnabled(LlmProvider.GEMINI)).thenReturn(false);
            when(providerFactory.isProviderEnabled(LlmProvider.OLLAMA)).thenReturn(false);

            // Act & Assert
            assertThatThrownBy(() -> ragService.generateEmbedding("hello"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("No embedding provider available");
        }
    }
}
