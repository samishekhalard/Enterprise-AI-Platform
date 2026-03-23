package com.ems.ai.controller;

import com.ems.ai.dto.KnowledgeSourceDTO;
import com.ems.ai.service.RagService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/agents/{agentId}/knowledge")
@RequiredArgsConstructor
@Tag(name = "Knowledge", description = "RAG knowledge source management")
public class KnowledgeController {

    private final RagService ragService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload a file as knowledge source")
    public ResponseEntity<KnowledgeSourceDTO> uploadFile(
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable UUID agentId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "description", required = false) String description) {

        KnowledgeSourceDTO source = ragService.uploadFile(agentId, tenantId, file, description);
        return ResponseEntity.status(HttpStatus.CREATED).body(source);
    }

    @PostMapping("/text")
    @Operation(summary = "Add text as knowledge source")
    public ResponseEntity<KnowledgeSourceDTO> addTextSource(
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable UUID agentId,
            @RequestParam String name,
            @RequestBody String content,
            @RequestParam(value = "description", required = false) String description) {

        KnowledgeSourceDTO source = ragService.addTextSource(agentId, tenantId, name, content, description);
        return ResponseEntity.status(HttpStatus.CREATED).body(source);
    }

    @GetMapping
    @Operation(summary = "Get all knowledge sources for an agent")
    public ResponseEntity<List<KnowledgeSourceDTO>> getKnowledgeSources(
            @PathVariable UUID agentId) {

        List<KnowledgeSourceDTO> sources = ragService.getKnowledgeSources(agentId);
        return ResponseEntity.ok(sources);
    }

    @DeleteMapping("/{sourceId}")
    @Operation(summary = "Delete a knowledge source")
    public ResponseEntity<Void> deleteKnowledgeSource(
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable UUID agentId,
            @PathVariable UUID sourceId) {

        ragService.deleteKnowledgeSource(sourceId, tenantId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{sourceId}/reprocess")
    @Operation(summary = "Reprocess a knowledge source")
    public ResponseEntity<Void> reprocessKnowledgeSource(
            @PathVariable UUID agentId,
            @PathVariable UUID sourceId) {

        ragService.processKnowledgeSource(sourceId);
        return ResponseEntity.accepted().build();
    }
}
