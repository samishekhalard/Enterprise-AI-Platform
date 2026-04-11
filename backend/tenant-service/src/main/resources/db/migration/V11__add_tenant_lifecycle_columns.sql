-- V11: Add tenant lifecycle management columns for US-TM-04
-- Supports: activate, suspend (with reason), reactivate, decommission

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS suspension_reason VARCHAR(50);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS suspension_notes TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS estimated_reactivation_date TIMESTAMP;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS decommissioned_at TIMESTAMP;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP;
