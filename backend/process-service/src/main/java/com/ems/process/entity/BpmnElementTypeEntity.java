package com.ems.process.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

/**
 * Entity representing a BPMN element type definition.
 * Stores metadata about BPMN elements including colors, sizes, and icons.
 * Supports tenant-specific overrides (tenant_id = null means system default).
 */
@Entity
@Table(name = "bpmn_element_types",
       uniqueConstraints = @UniqueConstraint(columnNames = {"tenant_id", "code"}))
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BpmnElementTypeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * Tenant ID for tenant-specific overrides.
     * NULL means this is a system default available to all tenants.
     */
    @Column(name = "tenant_id")
    private String tenantId;

    /**
     * BPMN element type code (e.g., "bpmn:Task", "bpmn:StartEvent")
     */
    @Column(nullable = false, length = 100)
    private String code;

    /**
     * Display name for the element
     */
    @Column(nullable = false, length = 100)
    private String name;

    /**
     * Category for grouping (task, event, gateway, data, artifact, flow)
     */
    @Column(nullable = false, length = 50)
    private String category;

    /**
     * Sub-category for further classification
     * (e.g., "start", "end", "intermediate" for events; "user", "service" for tasks)
     */
    @Column(name = "sub_category", length = 50)
    private String subCategory;

    /**
     * Stroke/border color in hex format (e.g., "#1E88E5")
     */
    @Column(name = "stroke_color", nullable = false, length = 7)
    private String strokeColor;

    /**
     * Fill/background color in hex format (e.g., "#FFFFFF")
     */
    @Column(name = "fill_color", nullable = false, length = 7)
    private String fillColor;

    /**
     * Stroke width in pixels
     */
    @Column(name = "stroke_width", nullable = false)
    @Builder.Default
    private Double strokeWidth = 2.0;

    /**
     * Default width for the element
     */
    @Column(name = "default_width")
    private Integer defaultWidth;

    /**
     * Default height for the element
     */
    @Column(name = "default_height")
    private Integer defaultHeight;

    /**
     * SVG icon content (uses currentColor for dynamic coloring)
     */
    @Column(name = "icon_svg", columnDefinition = "TEXT")
    private String iconSvg;

    /**
     * Sort order for display in palette
     */
    @Column(name = "sort_order")
    @Builder.Default
    private Integer sortOrder = 0;

    /**
     * Whether this element type is active/visible
     */
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Version
    @Column(name = "version")
    private Long version;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
