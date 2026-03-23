-- ============================================================================
-- V2: Add correlation_id index for efficient audit trail queries
-- ============================================================================
-- Note: V1 created idx_audit_correlation but canonical data model specifies
-- idx_audit_events_correlation. This migration ensures the canonical index
-- name exists for consistency with documentation.
--
-- The existing idx_audit_correlation provides the same functionality, but
-- we add the canonical name for explicit documentation alignment.
-- ============================================================================

-- Add correlation_id index with canonical naming convention
-- Uses IF NOT EXISTS for idempotency
CREATE INDEX IF NOT EXISTS idx_audit_events_correlation ON audit_events(correlation_id);
