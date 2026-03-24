package com.ems.ai.controller;

import com.ems.ai.dto.KnowledgeSourceDTO;
import com.ems.ai.entity.KnowledgeSourceEntity.FileType;
import com.ems.ai.entity.KnowledgeSourceEntity.SourceStatus;
import com.ems.ai.entity.KnowledgeSourceEntity.SourceType;
import com.ems.ai.service.RagService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.bean.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(KnowledgeController.class)
class KnowledgeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private RagService ragService;

    private static final String TENANT_ID = "tenant-1";
    private static final UUID AGENT_ID = UUID.randomUUID();
    private static final UUID SOURCE_ID = UUID.randomUUID();

    @Nested
    @DisplayName("POST /api/v1/agents/{agentId}/knowledge")
    class UploadFile {

        @Test
        @DisplayName("should upload file and return 201")
        void uploadFile_shouldReturn201() throws Exception {
            // Arrange
            KnowledgeSourceDTO dto = KnowledgeSourceDTO.builder()
                .id(SOURCE_ID)
                .agentId(AGENT_ID)
                .name("doc.pdf")
                .sourceType(SourceType.FILE)
                .fileType(FileType.PDF)
                .fileSize(1024L)
                .status(SourceStatus.PENDING)
                .createdAt(Instant.now())
                .build();

            when(ragService.uploadFile(eq(AGENT_ID), eq(TENANT_ID), any(), eq("Test description")))
                .thenReturn(dto);

            MockMultipartFile file = new MockMultipartFile(
                "file", "doc.pdf", "application/pdf", "fake pdf content".getBytes());

            // Act & Assert
            mockMvc.perform(multipart("/api/v1/agents/{agentId}/knowledge", AGENT_ID)
                    .file(file)
                    .param("description", "Test description")
                    .with(jwt())
                    .header("X-Tenant-ID", TENANT_ID))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name", is("doc.pdf")))
                .andExpect(jsonPath("$.fileType", is("PDF")))
                .andExpect(jsonPath("$.status", is("PENDING")));
        }
    }

    @Nested
    @DisplayName("POST /api/v1/agents/{agentId}/knowledge/text")
    class AddTextSource {

        @Test
        @DisplayName("should add text source and return 201")
        void addTextSource_shouldReturn201() throws Exception {
            // Arrange
            KnowledgeSourceDTO dto = KnowledgeSourceDTO.builder()
                .id(SOURCE_ID)
                .agentId(AGENT_ID)
                .name("notes")
                .sourceType(SourceType.TEXT)
                .status(SourceStatus.PROCESSING)
                .createdAt(Instant.now())
                .build();

            when(ragService.addTextSource(eq(AGENT_ID), eq(TENANT_ID), eq("notes"), any(), eq("desc")))
                .thenReturn(dto);

            // Act & Assert
            mockMvc.perform(post("/api/v1/agents/{agentId}/knowledge/text", AGENT_ID)
                    .with(jwt())
                    .header("X-Tenant-ID", TENANT_ID)
                    .param("name", "notes")
                    .param("description", "desc")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("This is my knowledge text"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name", is("notes")))
                .andExpect(jsonPath("$.sourceType", is("TEXT")));
        }
    }

    @Nested
    @DisplayName("GET /api/v1/agents/{agentId}/knowledge")
    class GetKnowledgeSources {

        @Test
        @DisplayName("should return all knowledge sources for agent")
        void getKnowledgeSources_shouldReturnList() throws Exception {
            // Arrange
            List<KnowledgeSourceDTO> sources = List.of(
                KnowledgeSourceDTO.builder()
                    .id(SOURCE_ID)
                    .agentId(AGENT_ID)
                    .name("doc.pdf")
                    .sourceType(SourceType.FILE)
                    .status(SourceStatus.COMPLETED)
                    .chunkCount(10)
                    .build()
            );
            when(ragService.getKnowledgeSources(AGENT_ID)).thenReturn(sources);

            // Act & Assert
            mockMvc.perform(get("/api/v1/agents/{agentId}/knowledge", AGENT_ID)
                    .with(jwt()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name", is("doc.pdf")))
                .andExpect(jsonPath("$[0].chunkCount", is(10)));
        }

        @Test
        @DisplayName("should return empty list when no sources exist")
        void getKnowledgeSources_whenEmpty_shouldReturnEmptyList() throws Exception {
            // Arrange
            when(ragService.getKnowledgeSources(AGENT_ID)).thenReturn(List.of());

            // Act & Assert
            mockMvc.perform(get("/api/v1/agents/{agentId}/knowledge", AGENT_ID)
                    .with(jwt()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
        }
    }

    @Nested
    @DisplayName("DELETE /api/v1/agents/{agentId}/knowledge/{sourceId}")
    class DeleteKnowledgeSource {

        @Test
        @DisplayName("should delete knowledge source and return 204")
        void deleteKnowledgeSource_shouldReturn204() throws Exception {
            // Arrange
            doNothing().when(ragService).deleteKnowledgeSource(SOURCE_ID, TENANT_ID);

            // Act & Assert
            mockMvc.perform(delete("/api/v1/agents/{agentId}/knowledge/{sourceId}", AGENT_ID, SOURCE_ID)
                    .with(jwt())
                    .header("X-Tenant-ID", TENANT_ID))
                .andExpect(status().isNoContent());

            verify(ragService).deleteKnowledgeSource(SOURCE_ID, TENANT_ID);
        }
    }

    @Nested
    @DisplayName("POST /api/v1/agents/{agentId}/knowledge/{sourceId}/reprocess")
    class ReprocessKnowledgeSource {

        @Test
        @DisplayName("should reprocess knowledge source and return 202")
        void reprocessKnowledgeSource_shouldReturn202() throws Exception {
            // Arrange
            doNothing().when(ragService).processKnowledgeSource(SOURCE_ID);

            // Act & Assert
            mockMvc.perform(post("/api/v1/agents/{agentId}/knowledge/{sourceId}/reprocess", AGENT_ID, SOURCE_ID)
                    .with(jwt()))
                .andExpect(status().isAccepted());

            verify(ragService).processKnowledgeSource(SOURCE_ID);
        }
    }
}
