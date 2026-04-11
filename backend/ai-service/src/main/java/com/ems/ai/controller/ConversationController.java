package com.ems.ai.controller;

import com.ems.ai.dto.ConversationDTO;
import com.ems.ai.dto.CreateConversationRequest;
import com.ems.ai.dto.MessageDTO;
import com.ems.ai.dto.SendMessageRequest;
import com.ems.ai.service.ConversationService;
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
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/conversations")
@RequiredArgsConstructor
@Tag(name = "Conversations", description = "Chat conversation management endpoints")
public class ConversationController {

    private final ConversationService conversationService;

    @PostMapping
    @Operation(summary = "Create a new conversation")
    public ResponseEntity<ConversationDTO> createConversation(
            @RequestHeader("X-Tenant-ID") String tenantId,
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CreateConversationRequest request) {

        UUID userId = getAuthenticatedUserId(jwt);
        ConversationDTO conversation = conversationService.createConversation(tenantId, userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(conversation);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get conversation by ID")
    public ResponseEntity<ConversationDTO> getConversation(
            @RequestHeader("X-Tenant-ID") String tenantId,
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id) {

        UUID userId = getAuthenticatedUserId(jwt);
        ConversationDTO conversation = conversationService.getConversation(id, tenantId, userId);
        return ResponseEntity.ok(conversation);
    }

    @GetMapping
    @Operation(summary = "Get user's conversations")
    public ResponseEntity<Page<ConversationDTO>> getConversations(
            @RequestHeader("X-Tenant-ID") String tenantId,
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) UUID agentId,
            Pageable pageable) {

        UUID userId = getAuthenticatedUserId(jwt);
        Page<ConversationDTO> conversations;
        if (agentId != null) {
            conversations = conversationService.getUserConversationsWithAgent(tenantId, userId, agentId, pageable);
        } else {
            conversations = conversationService.getUserConversations(tenantId, userId, pageable);
        }
        return ResponseEntity.ok(conversations);
    }

    @GetMapping("/recent")
    @Operation(summary = "Get recent conversations")
    public ResponseEntity<List<ConversationDTO>> getRecentConversations(
            @RequestHeader("X-Tenant-ID") String tenantId,
            @AuthenticationPrincipal Jwt jwt) {

        UUID userId = getAuthenticatedUserId(jwt);
        List<ConversationDTO> conversations = conversationService.getRecentConversations(tenantId, userId);
        return ResponseEntity.ok(conversations);
    }

    @PostMapping("/{id}/archive")
    @Operation(summary = "Archive a conversation")
    public ResponseEntity<Void> archiveConversation(
            @RequestHeader("X-Tenant-ID") String tenantId,
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id) {

        UUID userId = getAuthenticatedUserId(jwt);
        conversationService.archiveConversation(id, tenantId, userId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a conversation")
    public ResponseEntity<Void> deleteConversation(
            @RequestHeader("X-Tenant-ID") String tenantId,
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id) {

        UUID userId = getAuthenticatedUserId(jwt);
        conversationService.deleteConversation(id, tenantId, userId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/title")
    @Operation(summary = "Update conversation title")
    public ResponseEntity<Void> updateTitle(
            @RequestHeader("X-Tenant-ID") String tenantId,
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id,
            @RequestBody String title) {

        UUID userId = getAuthenticatedUserId(jwt);
        conversationService.updateConversationTitle(id, tenantId, userId, title);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/messages")
    @Operation(summary = "Get messages in a conversation")
    public ResponseEntity<Page<MessageDTO>> getMessages(
            @RequestHeader("X-Tenant-ID") String tenantId,
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id,
            Pageable pageable) {

        UUID userId = getAuthenticatedUserId(jwt);
        Page<MessageDTO> messages = conversationService.getMessages(id, tenantId, userId, pageable);
        return ResponseEntity.ok(messages);
    }

    @PostMapping("/{id}/messages")
    @Operation(summary = "Send a message (non-streaming)")
    public ResponseEntity<MessageDTO> sendMessage(
            @RequestHeader("X-Tenant-ID") String tenantId,
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id,
            @Valid @RequestBody SendMessageRequest request) {

        UUID userId = getAuthenticatedUserId(jwt);
        MessageDTO message = conversationService.sendMessage(id, tenantId, userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(message);
    }

    private UUID getAuthenticatedUserId(Jwt jwt) {
        if (jwt == null || jwt.getSubject() == null || jwt.getSubject().isBlank()) {
            throw new IllegalArgumentException("Authenticated JWT subject is required");
        }
        return UUID.fromString(jwt.getSubject());
    }
}
