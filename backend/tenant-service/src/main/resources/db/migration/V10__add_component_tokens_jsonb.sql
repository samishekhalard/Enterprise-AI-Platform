-- ============================================================================
-- Migration:   V10
-- Description: Add component_tokens JSONB column to tenant_branding table
-- Date:        2026-03-02
-- Author:      DBA Agent (DBA-PRINCIPLES.md v1.1.0)
-- Feature:     Branding Studio -- Per-Component Token Overrides
--
-- SAFETY NOTES:
--   - The new column is NULLABLE with NO DEFAULT clause.
--   - Existing rows (e.g., master tenant seeded in V2) are NOT modified.
--   - NULL means "no component-level overrides" -- application code handles
--     defaults and merges component tokens on top of global theme tokens.
--   - ADD COLUMN IF NOT EXISTS makes this migration re-runnable (idempotent).
--   - Application-layer validation enforces a 512 KB maximum payload size.
--
-- SA Review:   docs/sdlc-evidence/sa-review.md (component token JSONB section)
-- BA Sign-off: docs/sdlc-evidence/ba-signoff.md
-- ============================================================================

-- ============================================================================
-- 1. ADD COLUMN -- component_tokens JSONB
-- ============================================================================

ALTER TABLE tenant_branding
    ADD COLUMN IF NOT EXISTS component_tokens JSONB;

-- ============================================================================
-- 2. CHECK CONSTRAINT -- Must be a JSON object (not array, string, etc.)
--
--    Ensures component_tokens is either NULL (no overrides) or a valid JSON
--    object whose top-level keys are component names, e.g.:
--
--    {
--      "p-button": { "borderRadius": "12px", "fontWeight": "600" },
--      "p-card":   { "shadow": "var(--nm-shadow-card)" }
--    }
--
--    Rejects: arrays, strings, numbers, booleans at the top level.
--    Size validation (512 KB max) is enforced at the application layer.
-- ============================================================================

ALTER TABLE tenant_branding ADD CONSTRAINT chk_tb_component_tokens_object
    CHECK (component_tokens IS NULL OR jsonb_typeof(component_tokens) = 'object');

-- ============================================================================
-- 3. GIN INDEX -- Fast containment (@>) and existence (?) queries
--
--    Supports queries such as:
--      SELECT * FROM tenant_branding
--      WHERE component_tokens @> '{"p-button": {}}'::jsonb;
--
--    GIN is the recommended index type for JSONB columns that are queried
--    with containment, existence, or key-path operators.
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_tb_component_tokens_gin
    ON tenant_branding USING gin(component_tokens);

-- ============================================================================
-- 4. COLUMN COMMENT -- Documentation for schema introspection
-- ============================================================================

COMMENT ON COLUMN tenant_branding.component_tokens IS
    'Per-component design token overrides as a JSONB object. '
    'Top-level keys are PrimeNG component selectors (e.g., "p-button", "p-card"). '
    'Values are objects mapping CSS custom property names to override values. '
    'NULL means no component-level overrides (global theme tokens apply). '
    'Application layer enforces a 512 KB maximum payload size.';

-- ============================================================================
-- 5. ROLLBACK (Manual -- PostgreSQL Flyway does not support automatic rollback)
--
-- To reverse this migration, execute the following statements:
--
-- DROP INDEX IF EXISTS idx_tb_component_tokens_gin;
-- ALTER TABLE tenant_branding DROP CONSTRAINT IF EXISTS chk_tb_component_tokens_object;
-- ALTER TABLE tenant_branding DROP COLUMN IF EXISTS component_tokens;
-- ============================================================================
