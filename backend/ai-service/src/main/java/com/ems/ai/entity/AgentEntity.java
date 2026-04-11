package com.ems.ai.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "agents", indexes = {
    @Index(name = "idx_agents_tenant", columnList = "tenant_id"),
    @Index(name = "idx_agents_owner", columnList = "owner_id"),
    @Index(name = "idx_agents_category", columnList = "category_id"),
    @Index(name = "idx_agents_status", columnList = "status")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AgentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    @Column(name = "owner_id", nullable = false)
    private UUID ownerId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Column(name = "system_prompt", nullable = false, columnDefinition = "TEXT")
    private String systemPrompt;

    @Column(name = "greeting_message", columnDefinition = "TEXT")
    private String greetingMessage;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "conversation_starters", columnDefinition = "jsonb")
    @Builder.Default
    private List<String> conversationStarters = new ArrayList<>();

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private LlmProvider provider;

    @Column(nullable = false, length = 50)
    private String model;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "model_config", columnDefinition = "jsonb")
    private Map<String, Object> modelConfig;

    @Column(name = "rag_enabled")
    @Builder.Default
    private Boolean ragEnabled = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private AgentCategoryEntity category;

    @Column(name = "is_public")
    @Builder.Default
    private Boolean isPublic = false;

    @Column(name = "is_system")
    @Builder.Default
    private Boolean isSystem = false;

    @Column(length = 20)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private AgentStatus status = AgentStatus.ACTIVE;

    @Column(name = "usage_count")
    @Builder.Default
    private Long usageCount = 0L;

    @Version
    @Column(name = "version")
    private Long version;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    @OneToMany(mappedBy = "agent", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<KnowledgeSourceEntity> knowledgeSources = new ArrayList<>();

    public enum LlmProvider {
        OPENAI, ANTHROPIC, GEMINI, OLLAMA
    }

    public enum AgentStatus {
        ACTIVE, INACTIVE, DELETED
    }
}
