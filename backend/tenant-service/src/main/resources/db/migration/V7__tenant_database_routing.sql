-- ============================================================================
-- EMS Tenant Service - Graph-per-Tenant Database Routing
-- Version: 7
-- Description: Add database routing columns and supporting tables for
--              graph-per-tenant Neo4j multi-database architecture
-- Author: DBA Agent
-- Date: 2026-02-25
-- Traceability: /docs/lld/graph-per-tenant-lld.md
-- ============================================================================

-- Ensure trigger helper exists when baseline migrations skip V1.
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 1. EXTEND TENANT STATUS ENUM
-- ============================================================================

-- Add new status values for graph-per-tenant lifecycle management
-- Note: PostgreSQL requires separate ALTER TYPE statements for each value
-- Using DO block for idempotency

DO $$
BEGIN
    -- Add PROVISIONING status if not exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'PROVISIONING'
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'tenant_status_enum')
    ) THEN
        -- Check if using check constraint instead of enum
        -- If using check constraint, we'll update it below
        NULL;
    END IF;
END $$;

-- Since tenant-service uses CHECK constraint instead of enum, update the constraint
-- First, check and update the status check constraint
ALTER TABLE tenants DROP CONSTRAINT IF EXISTS tenants_status_check;

ALTER TABLE tenants ADD CONSTRAINT tenants_status_check
    CHECK (status IN (
        'PENDING',              -- Initial state, awaiting provisioning
        'PROVISIONING',         -- Database creation in progress
        'PROVISIONING_FAILED',  -- Database creation failed
        'ACTIVE',               -- Fully operational
        'SUSPENDED',            -- Temporarily disabled (billing, admin action)
        'LOCKED',               -- Security lock (breach, compliance)
        'DELETION_PENDING',     -- Grace period before deletion
        'DELETION_FAILED',      -- Database deletion failed
        'RESTORING',            -- Restore from backup in progress
        'DELETED'               -- Soft-deleted, database dropped
    ));

-- ============================================================================
-- 2. ADD DATABASE ROUTING COLUMNS TO TENANTS TABLE
-- ============================================================================

-- Neo4j database name (e.g., tenant_acme)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS database_name VARCHAR(100);

-- Data residency region for compliance (UAE, EU, US, APAC)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS data_residency_region VARCHAR(20) DEFAULT 'UAE';

-- Add check constraint for data residency region
ALTER TABLE tenants DROP CONSTRAINT IF EXISTS tenants_data_residency_check;
ALTER TABLE tenants ADD CONSTRAINT tenants_data_residency_check
    CHECK (data_residency_region IN ('UAE', 'EU', 'US', 'APAC'));

-- Soft deletion timestamp
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Grace period expiration for deletion (72 hours default)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS grace_period_expires_at TIMESTAMP WITH TIME ZONE;

-- User who requested deletion
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS deletion_requested_by VARCHAR(50);

-- Confirmation code for deletion (extra safety)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS deletion_confirmation_code VARCHAR(10);

-- Last successful backup timestamp
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS last_backup_at TIMESTAMP WITH TIME ZONE;

-- Optimistic locking version
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;

-- ============================================================================
-- 3. CREATE RETENTION POLICIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS retention_policies (
    id                          VARCHAR(50) PRIMARY KEY,
    name                        VARCHAR(100) NOT NULL,
    description                 TEXT,

    -- Retention periods (in days)
    default_retention_days      INTEGER NOT NULL,
    audit_retention_days        INTEGER,
    conversation_retention_days INTEGER,
    notification_retention_days INTEGER,
    process_retention_days      INTEGER,

    -- Compliance framework reference
    compliance_framework        VARCHAR(50),

    -- Audit timestamps
    created_at                  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_retention_policies_updated_at ON retention_policies;
CREATE TRIGGER update_retention_policies_updated_at
    BEFORE UPDATE ON retention_policies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add foreign key from tenants to retention_policies
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS retention_policy_id VARCHAR(50);
ALTER TABLE tenants DROP CONSTRAINT IF EXISTS fk_tenants_retention_policy;
ALTER TABLE tenants ADD CONSTRAINT fk_tenants_retention_policy
    FOREIGN KEY (retention_policy_id) REFERENCES retention_policies(id);

COMMENT ON TABLE retention_policies IS
    'Data retention policies for compliance with various regulatory frameworks (GDPR, SOC2, UAE_GOV)';

COMMENT ON COLUMN retention_policies.default_retention_days IS
    'Default retention period for all data types not explicitly specified';

COMMENT ON COLUMN retention_policies.audit_retention_days IS
    'Retention period for audit event records';

COMMENT ON COLUMN retention_policies.compliance_framework IS
    'Compliance framework this policy aligns with (DEFAULT, SOC2, GDPR, HIPAA, UAE_GOV)';

-- ============================================================================
-- 4. INSERT DEFAULT RETENTION POLICIES
-- ============================================================================

INSERT INTO retention_policies (
    id, name, description,
    default_retention_days, audit_retention_days,
    conversation_retention_days, notification_retention_days,
    process_retention_days, compliance_framework
) VALUES
    ('policy-1year', '1-Year Standard',
     'Standard retention for most business data',
     365, 365, 365, 90, 365, 'DEFAULT'),

    ('policy-3year', '3-Year Business',
     'Extended retention for business compliance requirements',
     1095, 2555, 365, 365, 1095, 'SOC2'),

    ('policy-7year', '7-Year Compliance',
     'Full compliance retention for regulated industries',
     2555, 2555, 2555, 365, 2555, 'GDPR'),

    ('policy-uae-gov', 'UAE Government',
     'UAE government compliance requirements',
     2555, 2555, 2555, 730, 2555, 'UAE_GOV')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 5. CREATE DATABASE PROVISIONING LOGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS tenant_database_logs (
    id              VARCHAR(50) PRIMARY KEY,
    tenant_id       VARCHAR(50) NOT NULL,

    -- Event details
    event_type      VARCHAR(50) NOT NULL,
    database_name   VARCHAR(100),
    status          VARCHAR(20) NOT NULL,

    -- Execution details
    message         TEXT,
    requested_by    VARCHAR(50),
    duration_ms     BIGINT,

    -- Additional context (JSON)
    metadata        JSONB DEFAULT '{}',

    -- Timestamp
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Foreign key
    CONSTRAINT fk_db_log_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Event type check constraint
ALTER TABLE tenant_database_logs ADD CONSTRAINT tenant_database_logs_event_type_check
    CHECK (event_type IN (
        'PROVISION_STARTED', 'PROVISION_COMPLETED', 'PROVISION_FAILED',
        'SCHEMA_APPLIED', 'SEED_DATA_INSERTED',
        'DELETE_STARTED', 'DELETE_COMPLETED', 'DELETE_FAILED',
        'BACKUP_STARTED', 'BACKUP_COMPLETED', 'BACKUP_FAILED',
        'RESTORE_STARTED', 'RESTORE_COMPLETED', 'RESTORE_FAILED',
        'MIGRATION_STARTED', 'MIGRATION_COMPLETED', 'MIGRATION_FAILED'
    ));

-- Status check constraint
ALTER TABLE tenant_database_logs ADD CONSTRAINT tenant_database_logs_status_check
    CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED'));

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_db_log_tenant ON tenant_database_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_db_log_type ON tenant_database_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_db_log_created ON tenant_database_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_db_log_status ON tenant_database_logs(status);

COMMENT ON TABLE tenant_database_logs IS
    'Audit log for tenant database provisioning, backup, restore, and migration events';

COMMENT ON COLUMN tenant_database_logs.event_type IS
    'Type of database lifecycle event (PROVISION_*, DELETE_*, BACKUP_*, RESTORE_*, MIGRATION_*)';

COMMENT ON COLUMN tenant_database_logs.duration_ms IS
    'Operation duration in milliseconds for performance monitoring';

COMMENT ON COLUMN tenant_database_logs.metadata IS
    'Additional JSON metadata for the event (error details, configuration, etc.)';

-- ============================================================================
-- 6. CREATE INDEXES FOR NEW COLUMNS
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_tenant_database_name ON tenants(database_name);
CREATE INDEX IF NOT EXISTS idx_tenant_data_residency ON tenants(data_residency_region);
CREATE INDEX IF NOT EXISTS idx_tenant_deleted_at ON tenants(deleted_at);
CREATE INDEX IF NOT EXISTS idx_tenant_grace_period ON tenants(grace_period_expires_at);
CREATE INDEX IF NOT EXISTS idx_tenant_retention_policy ON tenants(retention_policy_id);

-- ============================================================================
-- 7. ADD COMMENTS FOR NEW COLUMNS
-- ============================================================================

COMMENT ON COLUMN tenants.database_name IS
    'Neo4j database name for this tenant (format: tenant_{slug})';

COMMENT ON COLUMN tenants.data_residency_region IS
    'Data residency region for compliance (UAE, EU, US, APAC)';

COMMENT ON COLUMN tenants.deleted_at IS
    'Soft deletion timestamp - NULL means not deleted';

COMMENT ON COLUMN tenants.grace_period_expires_at IS
    'Timestamp when deletion grace period expires (typically 72 hours after deletion request)';

COMMENT ON COLUMN tenants.deletion_requested_by IS
    'User ID who requested tenant deletion';

COMMENT ON COLUMN tenants.deletion_confirmation_code IS
    'Confirmation code required to proceed with tenant deletion';

COMMENT ON COLUMN tenants.last_backup_at IS
    'Timestamp of last successful database backup';

COMMENT ON COLUMN tenants.version IS
    'Optimistic locking version for concurrent update detection';

COMMENT ON COLUMN tenants.retention_policy_id IS
    'Reference to data retention policy for compliance';

-- ============================================================================
-- 8. UPDATE VERSION TRIGGER
-- ============================================================================

-- Create or replace function to increment version on update
CREATE OR REPLACE FUNCTION increment_tenant_version()
RETURNS TRIGGER AS $$
BEGIN
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for version increment
DROP TRIGGER IF EXISTS trg_increment_tenant_version ON tenants;
CREATE TRIGGER trg_increment_tenant_version
    BEFORE UPDATE ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION increment_tenant_version();

COMMENT ON FUNCTION increment_tenant_version() IS
    'Automatically increments tenant version for optimistic locking';

-- ============================================================================
-- 9. UPDATE EXISTING TENANTS WITH DEFAULT VALUES
-- ============================================================================

-- Set default retention policy for existing tenants without one
UPDATE tenants
SET retention_policy_id = 'policy-1year'
WHERE retention_policy_id IS NULL;

-- Set default data residency region for existing tenants
UPDATE tenants
SET data_residency_region = 'UAE'
WHERE data_residency_region IS NULL;

-- ============================================================================
-- 10. VERIFICATION
-- ============================================================================

DO $$
DECLARE
    column_count INTEGER;
    table_count INTEGER;
BEGIN
    -- Verify new columns exist
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns
    WHERE table_name = 'tenants'
    AND column_name IN ('database_name', 'data_residency_region', 'deleted_at',
                        'grace_period_expires_at', 'retention_policy_id', 'version');

    IF column_count < 6 THEN
        RAISE EXCEPTION 'Not all columns were created successfully. Expected 6, found %', column_count;
    END IF;

    -- Verify new tables exist
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_name IN ('retention_policies', 'tenant_database_logs');

    IF table_count < 2 THEN
        RAISE EXCEPTION 'Not all tables were created successfully. Expected 2, found %', table_count;
    END IF;

    RAISE NOTICE 'Graph-per-tenant database routing migration applied successfully.';
    RAISE NOTICE '  - Added database routing columns to tenants table';
    RAISE NOTICE '  - Created retention_policies table with default policies';
    RAISE NOTICE '  - Created tenant_database_logs table for audit trail';
END $$;
