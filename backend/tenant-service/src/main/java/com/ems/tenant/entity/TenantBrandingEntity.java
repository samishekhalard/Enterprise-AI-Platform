package com.ems.tenant.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.Instant;

@Entity
@Table(name = "tenant_branding")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantBrandingEntity {

    @Id
    @Column(name = "tenant_id", length = 50)
    private String tenantId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "tenant_id")
    private TenantEntity tenant;

    @Column(name = "primary_color", length = 20)
    @Builder.Default
    private String primaryColor = "#428177";

    @Column(name = "primary_color_dark", length = 20)
    @Builder.Default
    private String primaryColorDark = "#054239";

    @Column(name = "secondary_color", length = 20)
    @Builder.Default
    private String secondaryColor = "#b9a779";

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Column(name = "logo_url_dark", length = 500)
    private String logoUrlDark;

    @Column(name = "favicon_url", length = 500)
    private String faviconUrl;

    @Column(name = "login_background_url", length = 500)
    private String loginBackgroundUrl;

    @Column(name = "font_family")
    @Builder.Default
    private String fontFamily = "'Gotham Rounded', 'Nunito', sans-serif";

    @Column(name = "custom_css", columnDefinition = "TEXT")
    private String customCss;

    // === Neumorphic Color Controls ===

    @Column(name = "surface_color", length = 20)
    @Builder.Default
    private String surfaceColor = "#edebe0";

    @Column(name = "text_color", length = 20)
    @Builder.Default
    private String textColor = "#3d3a3b";

    @Column(name = "shadow_dark_color", length = 20)
    @Builder.Default
    private String shadowDarkColor = "#988561";

    @Column(name = "shadow_light_color", length = 20)
    @Builder.Default
    private String shadowLightColor = "#ffffff";

    // === Neumorphic Shape Controls ===

    @Column(name = "corner_radius")
    @Builder.Default
    private Integer cornerRadius = 16;

    @Column(name = "button_depth")
    @Builder.Default
    private Integer buttonDepth = 12;

    @Column(name = "shadow_intensity")
    @Builder.Default
    private Integer shadowIntensity = 50;

    @Column(name = "soft_shadows")
    @Builder.Default
    private Boolean softShadows = true;

    @Column(name = "compact_nav")
    @Builder.Default
    private Boolean compactNav = false;

    // === Per-Component Hover Behaviour ===

    @Column(name = "hover_button", length = 20)
    @Builder.Default
    private String hoverButton = "lift";

    @Column(name = "hover_card", length = 20)
    @Builder.Default
    private String hoverCard = "lift";

    @Column(name = "hover_input", length = 20)
    @Builder.Default
    private String hoverInput = "press";

    @Column(name = "hover_nav", length = 20)
    @Builder.Default
    private String hoverNav = "slide";

    @Column(name = "hover_table_row", length = 20)
    @Builder.Default
    private String hoverTableRow = "highlight";

    // === Per-Component Token Overrides (JSONB) ===

    @Column(name = "component_tokens", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String componentTokens;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
