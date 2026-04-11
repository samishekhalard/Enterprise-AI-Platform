-- Add optimistic locking version column to tenant_licenses
ALTER TABLE tenant_licenses ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 0;
