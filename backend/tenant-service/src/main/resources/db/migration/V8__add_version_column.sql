-- Add optimistic locking version column to tenants
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 0;
