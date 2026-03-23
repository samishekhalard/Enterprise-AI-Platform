package com.ems.ai.controller;

import com.ems.ai.dto.AgentCategoryDTO;
import com.ems.ai.dto.AgentDTO;
import com.ems.ai.dto.CreateAgentRequest;
import com.ems.ai.dto.UpdateAgentRequest;
import com.ems.ai.service.AgentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/agents")
@RequiredArgsConstructor
@Tag(name = "Agents", description = "AI Agent management endpoints")
public class AgentController {

    private final AgentService agentService;

    @PostMapping
    @Operation(summary = "Create a new agent")
    public ResponseEntity<AgentDTO> createAgent(
            @RequestHeader("X-Tenant-ID") String tenantId,
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CreateAgentRequest request) {

        UUID userId = getAuthenticatedUserId(jwt);
        AgentDTO agent = agentService.createAgent(tenantId, userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(agent);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get agent by ID")
    public ResponseEntity<AgentDTO> getAgent(
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable UUID id) {

        AgentDTO agent = agentService.getAgent(id, tenantId);
        return ResponseEntity.ok(agent);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an agent")
    public ResponseEntity<AgentDTO> updateAgent(
            @RequestHeader("X-Tenant-ID") String tenantId,
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateAgentRequest request) {

        UUID userId = getAuthenticatedUserId(jwt);
        AgentDTO agent = agentService.updateAgent(id, tenantId, userId, request);
        return ResponseEntity.ok(agent);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete an agent")
    public ResponseEntity<Void> deleteAgent(
            @RequestHeader("X-Tenant-ID") String tenantId,
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id) {

        UUID userId = getAuthenticatedUserId(jwt);
        agentService.deleteAgent(id, tenantId, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/my")
    @Operation(summary = "Get my agents")
    public ResponseEntity<Page<AgentDTO>> getMyAgents(
            @RequestHeader("X-Tenant-ID") String tenantId,
            @AuthenticationPrincipal Jwt jwt,
            Pageable pageable) {

        UUID userId = getAuthenticatedUserId(jwt);
        Page<AgentDTO> agents = agentService.getMyAgents(tenantId, userId, pageable);
        return ResponseEntity.ok(agents);
    }

    @GetMapping
    @Operation(summary = "Get all accessible agents")
    public ResponseEntity<Page<AgentDTO>> getAccessibleAgents(
            @RequestHeader("X-Tenant-ID") String tenantId,
            Pageable pageable) {

        Page<AgentDTO> agents = agentService.getAccessibleAgents(tenantId, pageable);
        return ResponseEntity.ok(agents);
    }

    @GetMapping("/search")
    @Operation(summary = "Search agents")
    public ResponseEntity<Page<AgentDTO>> searchAgents(
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestParam String query,
            Pageable pageable) {

        Page<AgentDTO> agents = agentService.searchAgents(tenantId, query, pageable);
        return ResponseEntity.ok(agents);
    }

    @GetMapping("/category/{categoryId}")
    @Operation(summary = "Get agents by category")
    public ResponseEntity<Page<AgentDTO>> getAgentsByCategory(
            @PathVariable UUID categoryId,
            Pageable pageable) {

        Page<AgentDTO> agents = agentService.getAgentsByCategory(categoryId, pageable);
        return ResponseEntity.ok(agents);
    }

    @GetMapping("/categories")
    @Operation(summary = "Get all agent categories")
    public ResponseEntity<List<AgentCategoryDTO>> getCategories() {
        List<AgentCategoryDTO> categories = agentService.getCategories();
        return ResponseEntity.ok(categories);
    }

    private UUID getAuthenticatedUserId(Jwt jwt) {
        if (jwt == null || jwt.getSubject() == null || jwt.getSubject().isBlank()) {
            throw new IllegalArgumentException("Authenticated JWT subject is required");
        }
        return UUID.fromString(jwt.getSubject());
    }
}
