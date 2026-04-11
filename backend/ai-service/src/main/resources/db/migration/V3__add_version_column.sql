-- Add optimistic locking version column to agents
ALTER TABLE agents ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 0;
