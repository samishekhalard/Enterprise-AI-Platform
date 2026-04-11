-- ============================================================================
-- Brand Studio Runtime Tables
-- Transitional implementation on the current shared tenant-service database.
-- Authoritative runtime ownership still sits with tenant-service; the storage
-- model can move to per-tenant PostgreSQL later without changing the contract.
-- ============================================================================

-- ============================================================================
-- SHARED CATALOGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS platform_brand_starter_kit (
    starter_kit_id              VARCHAR(64) PRIMARY KEY,
    name                        VARCHAR(255) NOT NULL,
    description                 TEXT,
    preview_thumbnail_asset_id  VARCHAR(64),
    base_palette_pack_id        VARCHAR(64) NOT NULL,
    base_typography_pack_id     VARCHAR(64) NOT NULL,
    base_component_recipe_json  JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_default                  BOOLEAN NOT NULL DEFAULT FALSE,
    status                      VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
                                CHECK (status IN ('ACTIVE', 'INACTIVE', 'DEPRECATED')),
    created_at                  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform_palette_pack (
    palette_pack_id         VARCHAR(64) PRIMARY KEY,
    name                    VARCHAR(255) NOT NULL,
    description             TEXT,
    primary_color           VARCHAR(20) NOT NULL,
    secondary_color         VARCHAR(20) NOT NULL,
    accent_color            VARCHAR(20) NOT NULL,
    surface_color           VARCHAR(20) NOT NULL,
    surface_raised_color    VARCHAR(20) NOT NULL,
    text_color              VARCHAR(20) NOT NULL,
    text_muted_color        VARCHAR(20) NOT NULL,
    border_color            VARCHAR(20) NOT NULL,
    success_color           VARCHAR(20) NOT NULL,
    warning_color           VARCHAR(20) NOT NULL,
    error_color             VARCHAR(20) NOT NULL,
    info_color              VARCHAR(20) NOT NULL,
    is_default              BOOLEAN NOT NULL DEFAULT FALSE,
    status                  VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
                            CHECK (status IN ('ACTIVE', 'INACTIVE', 'DEPRECATED')),
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform_typography_pack (
    typography_pack_id      VARCHAR(64) PRIMARY KEY,
    name                    VARCHAR(255) NOT NULL,
    description             TEXT,
    heading_font_family     TEXT NOT NULL,
    body_font_family        TEXT NOT NULL,
    mono_font_family        TEXT NOT NULL,
    heading_weight_scale_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    body_weight_scale_json  JSONB NOT NULL DEFAULT '{}'::jsonb,
    font_source_type        VARCHAR(32) NOT NULL
                            CHECK (font_source_type IN ('SYSTEM', 'GOOGLE_APPROVED', 'SELF_HOSTED_APPROVED')),
    preload_manifest_json   JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_default              BOOLEAN NOT NULL DEFAULT FALSE,
    status                  VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
                            CHECK (status IN ('ACTIVE', 'INACTIVE', 'DEPRECATED')),
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TENANT-OWNED BRAND STUDIO TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS tenant_brand_draft (
    tenant_id                    VARCHAR(50) PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
    draft_manifest_json          JSONB NOT NULL DEFAULT '{}'::jsonb,
    selected_starter_kit_id      VARCHAR(64),
    selected_palette_pack_id     VARCHAR(64),
    selected_typography_pack_id  VARCHAR(64),
    selected_icon_library_id     VARCHAR(64),
    updated_at                   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_by                   VARCHAR(100),
    last_validated_at            TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS tenant_brand_profile (
    brand_profile_id             VARCHAR(64) PRIMARY KEY,
    tenant_id                    VARCHAR(50) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    profile_version              INTEGER NOT NULL,
    manifest_json                JSONB NOT NULL DEFAULT '{}'::jsonb,
    published_at                 TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    published_by                 VARCHAR(100),
    rolled_back_from_profile_id  VARCHAR(64),
    created_at                   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tenant_brand_profile_version UNIQUE (tenant_id, profile_version)
);

CREATE TABLE IF NOT EXISTS tenant_brand_asset (
    asset_id                 VARCHAR(64) PRIMARY KEY,
    tenant_id                VARCHAR(50) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    kind                     VARCHAR(32) NOT NULL
                             CHECK (kind IN ('LOGO_LIGHT', 'LOGO_DARK', 'FAVICON', 'LOGIN_BACKGROUND')),
    display_name             VARCHAR(255) NOT NULL,
    storage_key              VARCHAR(512) NOT NULL,
    delivery_url             VARCHAR(512) NOT NULL,
    mime_type                VARCHAR(100) NOT NULL,
    checksum                 VARCHAR(128) NOT NULL,
    file_size                BIGINT NOT NULL CHECK (file_size >= 0),
    width                    INTEGER,
    height                   INTEGER,
    created_at               TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by               VARCHAR(100),
    replaced_by_asset_id     VARCHAR(64)
);

CREATE TABLE IF NOT EXISTS tenant_icon_library (
    icon_library_id          VARCHAR(64) PRIMARY KEY,
    tenant_id                VARCHAR(50) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name                     VARCHAR(255) NOT NULL,
    description              TEXT,
    source_type              VARCHAR(32) NOT NULL
                             CHECK (source_type IN ('PHOSPHOR_SEEDED', 'ICONBUDDY_SEEDED', 'TENANT_UPLOAD', 'HYBRID')),
    version                  INTEGER NOT NULL DEFAULT 1,
    manifest_json            JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at               TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by               VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS tenant_icon_asset (
    icon_asset_id            VARCHAR(64) PRIMARY KEY,
    icon_library_id          VARCHAR(64) NOT NULL REFERENCES tenant_icon_library(icon_library_id) ON DELETE CASCADE,
    icon_key                 VARCHAR(128) NOT NULL,
    display_name             VARCHAR(255) NOT NULL,
    svg_content              TEXT NOT NULL,
    tags_json                JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at               TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tenant_icon_asset_key UNIQUE (icon_library_id, icon_key)
);

CREATE TABLE IF NOT EXISTS tenant_brand_audit_event (
    event_id                 VARCHAR(64) PRIMARY KEY,
    tenant_id                VARCHAR(50) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    event_type               VARCHAR(32) NOT NULL
                             CHECK (event_type IN (
                                'DRAFT_SAVED',
                                'DRAFT_VALIDATED',
                                'ASSET_UPLOADED',
                                'ASSET_REPLACED',
                                'ICON_LIBRARY_UPLOADED',
                                'BRAND_PUBLISHED',
                                'BRAND_ROLLED_BACK'
                             )),
    actor_id                 VARCHAR(100),
    target_brand_profile_id  VARCHAR(64),
    target_asset_id          VARCHAR(64),
    target_icon_library_id   VARCHAR(64),
    summary                  VARCHAR(512) NOT NULL,
    details_json             JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at               TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_platform_brand_starter_kit_status
    ON platform_brand_starter_kit(status);

CREATE INDEX IF NOT EXISTS idx_platform_palette_pack_status
    ON platform_palette_pack(status);

CREATE INDEX IF NOT EXISTS idx_platform_typography_pack_status
    ON platform_typography_pack(status);

CREATE INDEX IF NOT EXISTS idx_tenant_brand_profile_tenant
    ON tenant_brand_profile(tenant_id);

CREATE INDEX IF NOT EXISTS idx_tenant_brand_asset_tenant
    ON tenant_brand_asset(tenant_id);

CREATE INDEX IF NOT EXISTS idx_tenant_brand_asset_tenant_kind
    ON tenant_brand_asset(tenant_id, kind);

CREATE INDEX IF NOT EXISTS idx_tenant_icon_library_tenant
    ON tenant_icon_library(tenant_id);

CREATE INDEX IF NOT EXISTS idx_tenant_brand_audit_event_tenant
    ON tenant_brand_audit_event(tenant_id);

CREATE INDEX IF NOT EXISTS idx_tenant_brand_audit_event_tenant_created
    ON tenant_brand_audit_event(tenant_id, created_at DESC);

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS update_platform_brand_starter_kit_updated_at ON platform_brand_starter_kit;
CREATE TRIGGER update_platform_brand_starter_kit_updated_at
    BEFORE UPDATE ON platform_brand_starter_kit
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_platform_palette_pack_updated_at ON platform_palette_pack;
CREATE TRIGGER update_platform_palette_pack_updated_at
    BEFORE UPDATE ON platform_palette_pack
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_platform_typography_pack_updated_at ON platform_typography_pack;
CREATE TRIGGER update_platform_typography_pack_updated_at
    BEFORE UPDATE ON platform_typography_pack
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tenant_brand_draft_updated_at ON tenant_brand_draft;
CREATE TRIGGER update_tenant_brand_draft_updated_at
    BEFORE UPDATE ON tenant_brand_draft
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- DEFAULT CATALOG SEED
-- ============================================================================

INSERT INTO platform_palette_pack (
    palette_pack_id,
    name,
    description,
    primary_color,
    secondary_color,
    accent_color,
    surface_color,
    surface_raised_color,
    text_color,
    text_muted_color,
    border_color,
    success_color,
    warning_color,
    error_color,
    info_color,
    is_default,
    status
)
SELECT
    'palette-thinkplus-default',
    'ThinkPlus Default',
    'Current live default palette baseline.',
    '#428177',
    '#b9a779',
    '#054239',
    '#edebe0',
    '#f2efe9',
    '#3d3a3b',
    '#7a7672',
    '#e0ddda',
    '#428177',
    '#988561',
    '#ef4444',
    '#054239',
    TRUE,
    'ACTIVE'
WHERE NOT EXISTS (
    SELECT 1 FROM platform_palette_pack WHERE palette_pack_id = 'palette-thinkplus-default'
);

INSERT INTO platform_typography_pack (
    typography_pack_id,
    name,
    description,
    heading_font_family,
    body_font_family,
    mono_font_family,
    heading_weight_scale_json,
    body_weight_scale_json,
    font_source_type,
    preload_manifest_json,
    is_default,
    status
)
SELECT
    'type-thinkplus-default',
    'ThinkPlus Default',
    'Current approved Gotham Rounded / Nunito baseline.',
    '''Gotham Rounded'', ''Nunito'', sans-serif',
    '''Gotham Rounded'', ''Nunito'', sans-serif',
    '''SFMono-Regular'', ''Consolas'', ''Liberation Mono'', monospace',
    '{"display":700,"h1":700,"h2":600,"h3":600}'::jsonb,
    '{"body":400,"strong":600,"label":500}'::jsonb,
    'SYSTEM',
    '[]'::jsonb,
    TRUE,
    'ACTIVE'
WHERE NOT EXISTS (
    SELECT 1 FROM platform_typography_pack WHERE typography_pack_id = 'type-thinkplus-default'
);

INSERT INTO platform_brand_starter_kit (
    starter_kit_id,
    name,
    description,
    base_palette_pack_id,
    base_typography_pack_id,
    base_component_recipe_json,
    is_default,
    status
)
SELECT
    'starter-thinkplus-default',
    'ThinkPlus Default',
    'Current live default starter kit baseline.',
    'palette-thinkplus-default',
    'type-thinkplus-default',
    '{}'::jsonb,
    TRUE,
    'ACTIVE'
WHERE NOT EXISTS (
    SELECT 1 FROM platform_brand_starter_kit WHERE starter_kit_id = 'starter-thinkplus-default'
);
