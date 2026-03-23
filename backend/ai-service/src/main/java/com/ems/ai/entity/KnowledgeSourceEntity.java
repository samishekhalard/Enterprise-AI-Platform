package com.ems.ai.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "knowledge_sources", indexes = {
    @Index(name = "idx_knowledge_sources_agent", columnList = "agent_id"),
    @Index(name = "idx_knowledge_sources_tenant", columnList = "tenant_id"),
    @Index(name = "idx_knowledge_sources_status", columnList = "status")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KnowledgeSourceEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agent_id", nullable = false)
    private AgentEntity agent;

    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "source_type", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private SourceType sourceType;

    @Column(name = "file_path", length = 500)
    private String filePath;

    @Column(name = "file_type", length = 20)
    @Enumerated(EnumType.STRING)
    private FileType fileType;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(length = 1000)
    private String url;

    @Column(length = 20)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private SourceStatus status = SourceStatus.PENDING;

    @Column(name = "chunk_count")
    @Builder.Default
    private Integer chunkCount = 0;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "processed_at")
    private Instant processedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    @OneToMany(mappedBy = "source", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<KnowledgeChunkEntity> chunks = new ArrayList<>();

    public enum SourceType {
        FILE, URL, TEXT
    }

    public enum FileType {
        PDF, TXT, MD, CSV, DOCX
    }

    public enum SourceStatus {
        PENDING, PROCESSING, COMPLETED, FAILED
    }
}
