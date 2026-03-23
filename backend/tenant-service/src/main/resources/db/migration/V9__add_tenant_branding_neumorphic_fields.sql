-- ============================================================================
-- Migration:   V9
-- Description: Add neumorphic branding fields to tenant_branding table
-- Date:        2026-03-02
-- Author:      DBA Agent (DBA-PRINCIPLES.md v1.1.0)
-- Feature:     Tenant Theme Builder -- Neumorphism Design System
--
-- SAFETY NOTES:
--   - All 14 new columns are NULLABLE with NO DEFAULT clause.
--   - Existing rows (e.g., master tenant seeded in V2) are NOT modified.
--   - Application code (@Builder.Default) handles defaults for new tenants.
--   - ADD COLUMN IF NOT EXISTS makes this migration re-runnable (idempotent).
--
-- SA Review:   docs/sdlc-evidence/sa-review.md (Sections 2-3)
-- BA Sign-off: docs/sdlc-evidence/ba-signoff.md
-- ============================================================================

-- ============================================================================
-- 1. NEUMORPHIC COLOR CONTROLS (4 columns)
-- ============================================================================

ALTER TABLE tenant_branding ADD COLUMN IF NOT EXISTS surface_color VARCHAR(20);
ALTER TABLE tenant_branding ADD COLUMN IF NOT EXISTS text_color VARCHAR(20);
ALTER TABLE tenant_branding ADD COLUMN IF NOT EXISTS shadow_dark_color VARCHAR(20);
ALTER TABLE tenant_branding ADD COLUMN IF NOT EXISTS shadow_light_color VARCHAR(20);

-- ============================================================================
-- 2. NEUMORPHIC SHAPE CONTROLS (5 columns)
-- ============================================================================

ALTER TABLE tenant_branding ADD COLUMN IF NOT EXISTS corner_radius INTEGER;
ALTER TABLE tenant_branding ADD COLUMN IF NOT EXISTS button_depth INTEGER;
ALTER TABLE tenant_branding ADD COLUMN IF NOT EXISTS shadow_intensity INTEGER;
ALTER TABLE tenant_branding ADD COLUMN IF NOT EXISTS soft_shadows BOOLEAN;
ALTER TABLE tenant_branding ADD COLUMN IF NOT EXISTS compact_nav BOOLEAN;

-- ============================================================================
-- 3. PER-COMPONENT HOVER BEHAVIOUR (5 columns)
-- ============================================================================

ALTER TABLE tenant_branding ADD COLUMN IF NOT EXISTS hover_button VARCHAR(20);
ALTER TABLE tenant_branding ADD COLUMN IF NOT EXISTS hover_card VARCHAR(20);
ALTER TABLE tenant_branding ADD COLUMN IF NOT EXISTS hover_input VARCHAR(20);
ALTER TABLE tenant_branding ADD COLUMN IF NOT EXISTS hover_nav VARCHAR(20);
ALTER TABLE tenant_branding ADD COLUMN IF NOT EXISTS hover_table_row VARCHAR(20);

-- ============================================================================
-- 4. CHECK CONSTRAINTS -- Numeric Ranges (3 constraints)
-- ============================================================================

ALTER TABLE tenant_branding ADD CONSTRAINT chk_tb_corner_radius
    CHECK (corner_radius IS NULL OR corner_radius BETWEEN 0 AND 40);

ALTER TABLE tenant_branding ADD CONSTRAINT chk_tb_button_depth
    CHECK (button_depth IS NULL OR button_depth BETWEEN 0 AND 30);

ALTER TABLE tenant_branding ADD CONSTRAINT chk_tb_shadow_intensity
    CHECK (shadow_intensity IS NULL OR shadow_intensity BETWEEN 0 AND 100);

-- ============================================================================
-- 5. CHECK CONSTRAINTS -- Hover Enum Values (5 constraints)
-- ============================================================================

ALTER TABLE tenant_branding ADD CONSTRAINT chk_tb_hover_button
    CHECK (hover_button IS NULL OR hover_button IN ('lift', 'press', 'glow', 'none'));

ALTER TABLE tenant_branding ADD CONSTRAINT chk_tb_hover_card
    CHECK (hover_card IS NULL OR hover_card IN ('lift', 'glow', 'none'));

ALTER TABLE tenant_branding ADD CONSTRAINT chk_tb_hover_input
    CHECK (hover_input IS NULL OR hover_input IN ('press', 'highlight', 'none'));

ALTER TABLE tenant_branding ADD CONSTRAINT chk_tb_hover_nav
    CHECK (hover_nav IS NULL OR hover_nav IN ('slide', 'lift', 'highlight', 'none'));

ALTER TABLE tenant_branding ADD CONSTRAINT chk_tb_hover_table_row
    CHECK (hover_table_row IS NULL OR hover_table_row IN ('highlight', 'lift', 'none'));

-- ============================================================================
-- 6. ROLLBACK (Manual -- PostgreSQL Flyway does not support automatic rollback)
--
-- To reverse this migration, execute the following statements:
--
-- ALTER TABLE tenant_branding DROP CONSTRAINT IF EXISTS chk_tb_hover_table_row;
-- ALTER TABLE tenant_branding DROP CONSTRAINT IF EXISTS chk_tb_hover_nav;
-- ALTER TABLE tenant_branding DROP CONSTRAINT IF EXISTS chk_tb_hover_input;
-- ALTER TABLE tenant_branding DROP CONSTRAINT IF EXISTS chk_tb_hover_card;
-- ALTER TABLE tenant_branding DROP CONSTRAINT IF EXISTS chk_tb_hover_button;
-- ALTER TABLE tenant_branding DROP CONSTRAINT IF EXISTS chk_tb_shadow_intensity;
-- ALTER TABLE tenant_branding DROP CONSTRAINT IF EXISTS chk_tb_button_depth;
-- ALTER TABLE tenant_branding DROP CONSTRAINT IF EXISTS chk_tb_corner_radius;
-- ALTER TABLE tenant_branding DROP COLUMN IF EXISTS hover_table_row;
-- ALTER TABLE tenant_branding DROP COLUMN IF EXISTS hover_nav;
-- ALTER TABLE tenant_branding DROP COLUMN IF EXISTS hover_input;
-- ALTER TABLE tenant_branding DROP COLUMN IF EXISTS hover_card;
-- ALTER TABLE tenant_branding DROP COLUMN IF EXISTS hover_button;
-- ALTER TABLE tenant_branding DROP COLUMN IF EXISTS compact_nav;
-- ALTER TABLE tenant_branding DROP COLUMN IF EXISTS soft_shadows;
-- ALTER TABLE tenant_branding DROP COLUMN IF EXISTS shadow_intensity;
-- ALTER TABLE tenant_branding DROP COLUMN IF EXISTS button_depth;
-- ALTER TABLE tenant_branding DROP COLUMN IF EXISTS corner_radius;
-- ALTER TABLE tenant_branding DROP COLUMN IF EXISTS shadow_light_color;
-- ALTER TABLE tenant_branding DROP COLUMN IF EXISTS shadow_dark_color;
-- ALTER TABLE tenant_branding DROP COLUMN IF EXISTS text_color;
-- ALTER TABLE tenant_branding DROP COLUMN IF EXISTS surface_color;
-- ============================================================================
