-- Add optimistic locking version column to notifications
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 0;
