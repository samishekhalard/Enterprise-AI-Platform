-- Add optimistic locking version column to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 0;
