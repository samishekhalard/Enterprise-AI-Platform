-- Add optimistic locking version column to bpmn_element_types
ALTER TABLE bpmn_element_types ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 0;
